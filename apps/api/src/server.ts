import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { api } from "./routes/api.js";
import { demoAuth } from "./middleware/auth.js";

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (process.env.WEB_ORIGIN || "http://localhost:5173").split(","), credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false }));
app.use("/api", demoAuth, api);

const port = Number(process.env.PORT || 4000);
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

await mongoose.connect(uri);
app.listen(port, () => console.log(`API listening on ${port}`));
