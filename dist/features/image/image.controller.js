"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageController = exports.uploadImageMiddleware = exports.listImageController = exports.deleteImageController = exports.updateImageController = exports.createImageController = exports.getImageController = void 0;
const image_service_1 = __importDefault(require("./image.service"));
const response_util_1 = require("../../shared/utils/response.util");
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const cloudinary_2 = require("../../shared/config/cloudinary");
cloudinary_1.v2.config({
    cloud_name: cloudinary_2.cloudinaryConfig.cloud_name,
    api_key: cloudinary_2.cloudinaryConfig.api_key,
    api_secret: cloudinary_2.cloudinaryConfig.api_secret,
    secure: cloudinary_2.cloudinaryConfig.secure,
});
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: cloudinary_2.cloudinaryConfig.max_file_size },
});
const getImageController = async (req, res) => {
    const { id } = req.params;
    const result = await image_service_1.default.get(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.getImageController = getImageController;
const createImageController = async (req, res) => {
    const result = await image_service_1.default.create(req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.created(res, result.item);
};
exports.createImageController = createImageController;
const updateImageController = async (req, res) => {
    const { id } = req.params;
    const result = await image_service_1.default.update(id, req.body);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.updateImageController = updateImageController;
const deleteImageController = async (req, res) => {
    const { id } = req.params;
    const result = await image_service_1.default.delete(id);
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.item);
};
exports.deleteImageController = deleteImageController;
const listImageController = async (req, res) => {
    const { page, limit, search } = req.query;
    const result = await image_service_1.default.list({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
    });
    if (!result.ok)
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    return response_util_1.ResponseUtil.success(res, result.items, "Success", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    });
};
exports.listImageController = listImageController;
exports.uploadImageMiddleware = upload.single("file");
const uploadImageController = async (req, res) => {
    const diagnosticsBase = {
        hasCloudName: Boolean(cloudinary_2.cloudinaryConfig.cloud_name),
        hasApiKey: Boolean(cloudinary_2.cloudinaryConfig.api_key),
        hasApiSecret: Boolean(cloudinary_2.cloudinaryConfig.api_secret),
        folder: cloudinary_2.cloudinaryConfig.folder,
        nodeEnv: process.env.NODE_ENV,
    };
    try {
        const file = req.file;
        if (!file) {
            const diag = { ...diagnosticsBase };
            console.error("[UploadImage] Missing file in request", diag);
            return response_util_1.ResponseUtil.badRequest(res, "Missing file in form-data with key 'file'");
        }
        if (!cloudinary_2.cloudinaryConfig.cloud_name ||
            !cloudinary_2.cloudinaryConfig.api_key ||
            !cloudinary_2.cloudinaryConfig.api_secret) {
            const diag = {
                ...diagnosticsBase,
                fileInfo: {
                    mimetype: file?.mimetype,
                    size: file?.size,
                    originalname: file?.originalname,
                },
            };
            console.error("[UploadImage] Cloudinary config missing", diag);
            return response_util_1.ResponseUtil.internalServerError(res, "Cloudinary is not configured. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set.");
        }
        const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        try {
            const result = await cloudinary_1.v2.uploader.upload(dataUri, {
                folder: cloudinary_2.cloudinaryConfig.folder,
                resource_type: "auto",
                transformation: cloudinary_2.cloudinaryConfig.transformation,
            });
            // Return full upload result including publicId, width, height, etc.
            const uploadData = {
                url: result.secure_url,
                publicId: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes,
            };
            return response_util_1.ResponseUtil.created(res, uploadData, "Image uploaded successfully");
        }
        catch (err) {
            const anyErr = err;
            const diag = {
                ...diagnosticsBase,
                fileInfo: {
                    mimetype: file?.mimetype,
                    size: file?.size,
                    originalname: file?.originalname,
                },
                cloudinaryError: {
                    name: anyErr?.name,
                    message: anyErr?.message,
                    http_code: anyErr?.http_code,
                    error: anyErr?.error,
                },
            };
            console.error("[UploadImage] Cloudinary upload error", diag);
            const status = typeof anyErr?.http_code === "number" ? anyErr.http_code : 400;
            return response_util_1.ResponseUtil.error(res, anyErr?.message || "Upload failed", status);
        }
    }
    catch (e) {
        const anyErr = e;
        console.error("[UploadImage] Unexpected error", {
            ...diagnosticsBase,
            errorName: anyErr?.name,
            errorMessage: anyErr?.message,
            stack: anyErr?.stack,
        });
        return response_util_1.ResponseUtil.internalServerError(res, e.message);
    }
};
exports.uploadImageController = uploadImageController;
