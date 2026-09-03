import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db.js";
import apiRoutes from "./routes/apiRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: [
    "http://localhost:5174",
    "http://localhost:5173",
    process.env.FRONTEND_URL,        // Set this on Render to your Vercel URL
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Root route so you don't get "Cannot GET /" if you visit the backend URL
app.get("/", (req, res) => {
  res.send("Krypton API is running! 🚀 Visit the frontend app to use it.");
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Krypton API running at http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless Functions
export default app;
