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

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

app.listen(PORT, () => {
  console.log(`Krypton API running at http://localhost:${PORT}`);
});
