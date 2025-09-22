import { checkContrast, adjustImageContrast } from './aws-rekognition/aws-rekognition.js';

// Example usage (local test)
(async () => {
  const bucket = "my-screenshot-bucket";
  const key = "ui-screenshot.png";

  const results = await checkContrast(bucket, key);
  console.log(JSON.stringify(results, null, 2));

  const output = await adjustImageContrast(bucket, key);
  console.log("Adjusted image saved to:", output);
})();
