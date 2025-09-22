// rekognition.service.js
import dotenv from "dotenv";
import AWS from 'aws-sdk';

dotenv.config();

const rekognition = new AWS.Rekognition({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export function generateAltText(params) {
  return new Promise((resolve, reject) => {
    rekognition.detectLabels(params, (err, data) => {
      if (err) {
        console.error("AWS Rekognition error:", err);
        reject(new Error("Error generating alt text."));
      } else {
        const labels = data.Labels.map(label => label.Name.toLowerCase());
        // Build a simple alt text sentence
        const altText = `Image may contain: ${labels.join(", ")}.`;
        resolve(altText);
      }
    });
  });
}
