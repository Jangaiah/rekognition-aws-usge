import express from "express";
import cors from "cors";
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

// Handle blob data for image processing
app.post("/api/generate-alt", express.raw({ 
  type: ['image/*', 'application/octet-stream'], 
  limit: '5mb' 
}), async (req, res) => {
  try {
    // Check if request body exists and has content
    if (!req.body || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Invalid image data. Expected a binary buffer." });
    }

    // Log the size of received data
    console.log("Received image data size:", req.body.length, "bytes");

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
