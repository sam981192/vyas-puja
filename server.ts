import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import fs from "fs";
import cors from "cors";

// Ensure downloads directory exists
const DOWNLOADS_DIR = path.join(process.cwd(), "downloads");
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR);
}

const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions.json");
if (!fs.existsSync(SUBMISSIONS_FILE)) {
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([]));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Storage for multer
  const storage = multer.memoryStorage();
  const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // API Route: Submit Offering
  app.post("/api/submit", upload.array("files"), (req, res) => {
    try {
      const { metadata } = req.body;
      const parsedMetadata = JSON.parse(metadata);
      const files = req.files as Express.Multer.File[];

      const submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf-8"));
      
      const timestamp = new Date().toISOString();
      const newEntries = [];

      if (parsedMetadata.formatType === 'text') {
        const entry = {
          id: Date.now().toString(),
          timestamp,
          ...parsedMetadata,
          fileName: "text-offering.txt",
          fileIndex: 1,
          totalFiles: 1
        };
        newEntries.push(entry);
      } else if (files && files.length > 0) {
        files.forEach((file, index) => {
          // The renaming logic will be sent from client or handled here.
          // For the record keeping, we store the metadata.
          const entry = {
            id: `${Date.now()}-${index}`,
            timestamp,
            ...parsedMetadata,
            fileName: file.originalname, // This should be the renamed version from client
            fileIndex: index + 1,
            totalFiles: files.length
          };
          newEntries.push(entry);
        });
      }

      submissions.push(...newEntries);
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));

      res.json({ success: true, count: newEntries.length });
    } catch (error) {
      console.error("Submission error:", error);
      res.status(500).json({ error: "Failed to process submission" });
    }
  });

  // API Route: Get all submissions
  app.get("/api/submissions", (req, res) => {
    try {
      const submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf-8"));
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
