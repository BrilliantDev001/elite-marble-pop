import mongoose from "mongoose";
import { env } from "../config/env.js";
import Category from "../models/Category.js";
import Project from "../models/Project.js";

// TEMPORARY: checks that the models enforce our rules. Delete this file when done.
// Run it from the server folder:  node --env-file=.env src/scripts/modelCheck.js

const photo = { url: "https://example.com/test.jpg", alt: "A test photo" };
let failures = 0;

function check(label, passed) {
  console.log(`${passed ? "PASS" : "FAIL"}  ${label}`);
  if (!passed) failures += 1;
}

async function cleanUp() {
  await Category.deleteMany({ slug: /^zz-model-check/ });
  await Project.deleteMany({ slug: /^zz-model-check/ });
}

await mongoose.connect(env.mongoUri);
await Promise.all([Category.init(), Project.init()]); // make sure the indexes exist
await cleanUp();

try {
  // 1. A category gets its slug, nameKey and defaults automatically.
  const category = await Category.create({
    name: "Zz Model Check Tiles",
    service: "marble",
    description: "A temporary category for testing.",
  });
  check(
    "category slug is made from the name",
    category.slug === "zz-model-check-tiles",
  );
  check("category is active by default", category.active === true);
  check("category has no photo by default", category.image === null);

  // 2. A near-duplicate name is refused by the database.
  try {
    await Category.create({
      name: "zz model check tile!",
      service: "pop",
      description: "A near-duplicate that must be refused.",
    });
    check("near-duplicate category name is refused", false);
  } catch (error) {
    check("near-duplicate category name is refused", error.code === 11000);
  }

  // 3. Slug and service cannot be changed after creation.
  category.slug = "zz-model-check-changed";
  category.service = "pop";
  await category.save();
  const reloaded = await Category.findById(category.id);
  check(
    "category slug cannot change",
    reloaded.slug === "zz-model-check-tiles",
  );
  check("category service cannot change", reloaded.service === "marble");

  // 4. A minimal project saves, as a draft, with sensible defaults.
  const project = await Project.create({
    title: "Zz Model Check Project",
    slug: "zz-model-check-project",
    service: "marble",
    category: "zz-model-check-tiles",
    coverImage: photo,
  });
  check("new project is a draft", project.status === "draft");
  check("new project is not featured", project.featured === false);
  check("new project has no extra photos", project.images.length === 0);
  check("new project location is empty", project.location === null);

  // 4b. The JSON output is tidy.
  const json = project.toJSON();
  check(
    "JSON has id, not _id or __v",
    Boolean(json.id) && json._id === undefined && json.__v === undefined,
  );

  // 5. Bad data is rejected.
  const bad = new Project({
    title: "Zz",
    slug: "Bad Slug!",
    service: "glass",
    category: "x",
  });
  const problems = Object.keys(bad.validateSync()?.errors ?? {});
  check("short title is rejected", problems.includes("title"));
  check("bad slug is rejected", problems.includes("slug"));
  check("unknown service is rejected", problems.includes("service"));
  check("missing cover photo is rejected", problems.includes("coverImage"));

  const noAlt = new Project({
    title: "Zz Model Check No Alt",
    slug: "zz-model-check-no-alt",
    service: "pop",
    category: "x",
    coverImage: { url: "https://example.com/test.jpg", alt: "" },
  });
  check(
    "photo without alt text is rejected",
    Object.keys(noAlt.validateSync()?.errors ?? {}).some((key) =>
      key.includes("alt"),
    ),
  );

  // 6. Too many photos are rejected.
  const tooMany = new Project({
    title: "Zz Model Check Many",
    slug: "zz-model-check-many",
    service: "pop",
    category: "x",
    coverImage: photo,
    images: Array.from({ length: 20 }, () => photo),
  });
  check(
    "more than 20 photos are rejected",
    Object.keys(tooMany.validateSync()?.errors ?? {}).includes("images"),
  );
} finally {
  await cleanUp();
  await mongoose.disconnect();
}

console.log(
  failures === 0
    ? "\nAll checks passed. Test data removed."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
