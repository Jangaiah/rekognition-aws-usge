import express from "express";
import cors from "cors";
import multer from "multer";
import { generateAltText } from "./aws-rekognition/aws-rekognition-service.js";

const app = express();

// Configure CORS for Angular dev server
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['POST', 'GET', 'OPTIONS', "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

// Parse JSON for non-blob requests
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Handle blob data for image processing
app.post("/api/generate-alt", upload.single("file"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "No file uploaded or file is invalid." });
    }

    // Convert uploaded file to bytes (Buffer is already byte array)
    const imageBuffer = req.file.buffer;

    // Set up parameters for AWS Rekognition using the buffer
    const params = {
      Image: { 
        Bytes: imageBuffer
      },
      MaxLabels: 5,
      MinConfidence: 75,
    };

    // Generate alt text using AWS Rekognition and await the result
    const altText = await generateAltText(params);

    // Send response after getting the alt text
    res.json({ altText });
  } catch (err) {
    console.error("Error processing image:", err);
    
    // Provide more specific error messages based on the error type
    if (err.code === 'InvalidImageFormatException') {
      res.status(400).json({ error: "Invalid image format. Please provide a valid image file." });
    } else if (err.code === 'ImageTooLargeException') {
      res.status(400).json({ error: "Image size too large. Maximum size is 5MB." });
    } else {
      res.status(500).json({ 
        error: "Failed to process image",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
});

app.post("/api/image-contrast-fix", express.raw({
  type: ['image/*', 'application/octet-stream'], 
  limit: '5mb' 
}), async (req, res) => {
  try {
    // Check if request body exists and has content
    if (!req.body || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Invalid image data. Expected a binary buffer." });
    }

    // Set up parameters for AWS Rekognition using the buffer
    const params = {
      Image: { 
        Bytes: req.body // Buffer is directly usable by AWS SDK
      },
      MaxLabels: 5,
      MinConfidence: 75,
    };

    // Generate alt text using AWS Rekognition and await the result
    const altText = await generateAltText(params);

    // Send response after getting the alt text
    res.json({ altText });
  } catch (err) {
    console.error("Error processing image:", err);
    
    // Provide more specific error messages based on the error type
    if (err.code === 'InvalidImageFormatException') {
      res.status(400).json({ error: "Invalid image format. Please provide a valid image file." });
    } else if (err.code === 'ImageTooLargeException') {
      res.status(400).json({ error: "Image size too large. Maximum size is 5MB." });
    } else {
      res.status(500).json({ 
        error: "Failed to process image",
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
});

app.listen(3000, () => console.log("API running on port 3000"));
