import { z } from "zod";
import dotenv from 'dotenv';

dotenv.config();

if (typeof window != "undefined") {
  throw new Error("This module should only be imported on the server");
}

const envSchema = z.object({
  BASE_URL: z.string().url(),
  API_KEY: z.string(),
  USER_EMAIL: z.string().email(),
});

const result = envSchema.safeParse({
  BASE_URL: process.env.BASE_URL,
  API_KEY: process.env.API_KEY,
  USER_EMAIL: process.env.USER_EMAIL,
});

if (!result.success) {
  throw new Error("Invalid environment variables");
}

const env = result.data;
export { env };