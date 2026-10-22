import mongoose from "mongoose";
import { env } from "../config/env.js";
import Category from "../models/Category.js";
import Project from "../models/Project.js";
import { categorySeeds, sampleProjectSeeds } from "../seed/sampleData.js";

// Fills (or cleans) the database with starting content. Run from the server folder:
//   npm run seed -- categories        adds the proposed categories (skips any that exist)
//   npm run seed -- samples           adds the demo projects, tagged isSample (skips existing)
//   npm run seed -- remove-samples    deletes ONLY the demo projects (run this before launch)

const command = process.argv[2];

if (!["categories", "samples", "remove-samples"].includes(command)) {
  console.error(
    "Usage: npm run seed -- <categories | samples | remove-samples>",
  );
  process.exit(1);
}

await mongoose.connect(env.mongoUri);
await Promise.all([Category.init(), Project.init()]); // make sure the unique indexes exist

try {
  if (command === "categories") {
    let added = 0;
    for (const seed of categorySeeds) {
      if (await Category.exists({ slug: seed.slug })) {
        console.log(`Skipped (already exists): ${seed.name}`);
        continue;
      }
      try {
        await Category.create({ ...seed, active: true });
        added += 1;
        console.log(`Added: ${seed.name}`);
      } catch (error) {
        // 11000 = the database refused a duplicate, e.g. a very similar name already exists
        if (error.code !== 11000) throw error;
        console.log(
          `Skipped (a similar category name already exists): ${seed.name}`,
        );
      }
    }
    console.log(`Done. ${added} categories added.`);
  }

  if (command === "samples") {
    if ((await Category.countDocuments()) === 0) {
      console.log(
        'No categories found. Run "npm run seed -- categories" first.',
      );
    } else {
      let added = 0;
      for (const seed of sampleProjectSeeds) {
        if (await Project.exists({ slug: seed.slug })) {
          console.log(`Skipped (already exists): ${seed.title}`);
          continue;
        }
        await Project.create({ ...seed, isSample: true });
        added += 1;
        console.log(`Added: ${seed.title} (${seed.status})`);
      }
      console.log(`Done. ${added} sample projects added.`);
    }
  }

  if (command === "remove-samples") {
    const result = await Project.deleteMany({ isSample: true });
    console.log(
      `Removed ${result.deletedCount} sample projects. Real projects were not touched.`,
    );
  }
} finally {
  await mongoose.disconnect();
}
