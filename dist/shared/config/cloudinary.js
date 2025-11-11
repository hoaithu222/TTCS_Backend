"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryConfig = void 0;
// Cloudinary configuration for media storage
require("./env.config"); // ensure dotenv is loaded
exports.cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS for security
    folder: process.env.CLOUDINARY_FOLDER || "mylove",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "avi"],
    max_file_size: 10 * 1024 * 1024, // 10MB
    transformation: {
        quality: "auto",
        fetch_format: "auto",
    },
};
