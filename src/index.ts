import express from "express";
import fs from "fs";
import path from "path";
import SETTINGS from "./settings";

const { port, routes } = SETTINGS;

const app = express();

// Function to check if a given path is a directory
const isDirectory = (path: string): boolean => {
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch (err) {
    return false;
  }
};

// Function to recursively read all files in a directory and its subdirectories
const readFiles = (dir: string, app: express.Application): void => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (isDirectory(filePath)) {
      // If the file is a directory, recursively read its files
      readFiles(filePath, app);
    } else {
      // If the file is a JavaScript module, require it and add its router to the app
      if (file.endsWith(".js")) {
        const router = require(filePath);
        app.use(router);
      }
    }
  });
};

// Call the readFiles function with the directory path and app instance
const dirPath = path.join(__dirname, routes.path); // Change "src" to the desired directory
readFiles(dirPath, app);

// Start the Express app
// Change to the desired port number
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
