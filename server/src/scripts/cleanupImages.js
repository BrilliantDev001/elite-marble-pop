import mongoose from "mongoose";
import { env } from "../config/env.js";
import Project from "../models/Project.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import Enquiry from "../models/Enquiry.js";
import { UPLOAD_FOLDERS, listFiles, deleteFile } from "../utils/imagekit.js";

// Finds photos in ImageKit that nothing in the database uses (abandoned uploads), and optionally
// deletes them. Run from the server folder:
//   npm run cleanup:images                       dry run: only LISTS the unused photos
//   npm run cleanup:images -- --delete           deletes them
//   npm run cleanup:images -- --grace-hours=48   treat photos newer than 48 hours as "maybe still in use"
//   npm run cleanup:images -- --delete --force   allows deleting more than 20 files in one run

const args = process.argv.slice(2);
const shouldDelete = args.includes("--delete");
const force = args.includes("--force");
const graceArgument = args.find((argument) =>
  argument.startsWith("--grace-hours="),
);
const graceHours = graceArgument ? Number(graceArgument.split("=")[1]) : 24;
const MAX_DELETIONS_WITHOUT_FORCE = 20;

if (!env.imagekitConfigured) {
  console.error(
    "ImageKit is not set up. Fill in the IMAGEKIT_ values in server/.env first.",
  );
  process.exit(1);
}
if (!Number.isFinite(graceHours) || graceHours < 0) {
  console.error("--grace-hours must be a number, for example --grace-hours=24");
  process.exit(1);
}

await mongoose.connect(env.mongoUri);

try {
  // 1. Every file ID that the database refers to.
  const used = new Set();
  const remember = (fileId) => fileId && used.add(fileId);

  const [projects, categories, reviews, enquiries] = await Promise.all([
    Project.find().select("coverImage.fileId images.fileId").lean(),
    Category.find().select("image.fileId").lean(),
    Review.find().select("photo.fileId").lean(),
    Enquiry.find().select("photos.fileId").lean(),
  ]);

  for (const project of projects) {
    remember(project.coverImage?.fileId);
    for (const image of project.images ?? []) remember(image.fileId);
  }
  for (const category of categories) remember(category.image?.fileId);
  for (const review of reviews) remember(review.photo?.fileId);
  for (const enquiry of enquiries)
    for (const photo of enquiry.photos ?? []) remember(photo.fileId);

  // 2. Every file in our ImageKit folders that is NOT in that list.
  const unused = [];
  let inUse = 0;
  let tooNew = 0;

  for (const folder of Object.values(UPLOAD_FOLDERS)) {
    for (const file of await listFiles(folder)) {
      if (used.has(file.fileId)) {
        inUse += 1;
        continue;
      }
      const ageHours = (Date.now() - new Date(file.createdAt).getTime()) / 36e5;
      if (ageHours < graceHours) {
        tooNew += 1; // it may belong to a form that is still being filled in
        continue;
      }
      unused.push({ ...file, ageHours });
    }
  }

  console.log(`Photos in use: ${inUse}`);
  console.log(`Unused but newer than ${graceHours} hours (kept): ${tooNew}`);
  console.log(`Unused and older than ${graceHours} hours: ${unused.length}`);
  for (const file of unused) {
    console.log(
      `  ${file.filePath}  (${Math.round((file.size ?? 0) / 1024)} KB, ${Math.floor(file.ageHours)} hours old)`,
    );
  }

  // 3. Delete them, only when asked.
  if (unused.length === 0) {
    console.log("\nNothing to clean up.");
  } else if (!shouldDelete) {
    console.log(
      "\nDry run: nothing was deleted. Add --delete to remove these files.",
    );
  } else if (unused.length > MAX_DELETIONS_WITHOUT_FORCE && !force) {
    console.error(
      `\nRefusing to delete ${unused.length} files in one run (the limit is ${MAX_DELETIONS_WITHOUT_FORCE}).\n` +
        "Check that server/.env points at the right database. If it does, add --force.",
    );
    process.exitCode = 1;
  } else {
    for (const file of unused) await deleteFile(file.fileId);
    console.log(`\nDeleted ${unused.length} unused photos.`);
  }
} catch (error) {
  console.error(`Cleanup stopped: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
