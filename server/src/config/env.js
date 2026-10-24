// Reads the environment variables ONCE, checks them, and exports them as one object.
// The rest of the code imports { env } from here instead of touching process.env directly.
// If something important is missing, the server stops immediately with a clear message,
// instead of failing in a confusing way later.

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

// In production these MUST be set. In development, CLIENT_ORIGIN has a safe default.
const required = ["MONGODB_URI", "JWT_SECRET"];
if (isProduction) required.push("CLIENT_ORIGIN");

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  console.error(
    "Copy server/.env.example to server/.env and fill in the values.",
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error(
    "JWT_SECRET must be at least 32 characters. Generate one with:",
  );
  console.error(`node -p "crypto.randomBytes(48).toString('hex')"`);
  process.exit(1);
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  // The address photos are served from, for example https://ik.imagekit.io/your_id.
  // Added in Stage B6. While empty, only the /placeholders/ photos are accepted.
  imagekitUrlEndpoint: (process.env.IMAGEKIT_URL_ENDPOINT ?? "")
    .trim()
    .replace(/\/+$/, ""),
};
