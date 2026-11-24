// Vercel entrypoint: Vercel runs the exported Express app as a function and handles listening itself.
// Local development keeps using src/server.ts (`npm run dev`), which calls app.listen().
import type { Express } from "express";
import { createApp } from "./create-app";

const app: Express = createApp();

export default app;
