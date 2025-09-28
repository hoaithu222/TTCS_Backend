import { Request, Response } from "express";
import ImageService from "./image.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { cloudinaryConfig } from "../../shared/config/cloudinary";

cloudinary.config({
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key,
  api_secret: cloudinaryConfig.api_secret,
  secure: cloudinaryConfig.secure,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: cloudinaryConfig.max_file_size },
});

export const getImageController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ImageService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const createImageController = async (req: Request, res: Response) => {
  const result = await ImageService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item);
};

export const updateImageController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ImageService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const deleteImageController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ImageService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const listImageController = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as any;
  const result = await ImageService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const uploadImageMiddleware = upload.single("file");

export const uploadImageController = async (req: Request, res: Response) => {
  const diagnosticsBase = {
    hasCloudName: Boolean(cloudinaryConfig.cloud_name),
    hasApiKey: Boolean(cloudinaryConfig.api_key),
    hasApiSecret: Boolean(cloudinaryConfig.api_secret),
    folder: cloudinaryConfig.folder,
    nodeEnv: process.env.NODE_ENV,
  };
  try {
    const file = (req as any).file as any;
    if (!file) {
      const diag = { ...diagnosticsBase };
      console.error("[UploadImage] Missing file in request", diag);
      return ResponseUtil.badRequest(
        res,
        "Missing file in form-data with key 'file'"
      );
    }

    if (
      !cloudinaryConfig.cloud_name ||
      !cloudinaryConfig.api_key ||
      !cloudinaryConfig.api_secret
    ) {
      const diag = {
        ...diagnosticsBase,
        fileInfo: {
          mimetype: file?.mimetype,
          size: file?.size,
          originalname: file?.originalname,
        },
      };
      console.error("[UploadImage] Cloudinary config missing", diag);
      return ResponseUtil.internalServerError(
        res,
        "Cloudinary is not configured. Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set."
      );
    }

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString(
      "base64"
    )}`;

    try {
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: cloudinaryConfig.folder,
        resource_type: "auto",
        transformation: cloudinaryConfig.transformation,
      });

      // Return URL at the top level (as requested)
      return res.status(201).json({ url: result.secure_url });
    } catch (err) {
      const anyErr = err as any;
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
      const status =
        typeof anyErr?.http_code === "number" ? anyErr.http_code : 400;
      return ResponseUtil.error(
        res,
        anyErr?.message || "Upload failed",
        status
      );
    }
  } catch (e) {
    const anyErr = e as any;
    console.error("[UploadImage] Unexpected error", {
      ...diagnosticsBase,
      errorName: anyErr?.name,
      errorMessage: anyErr?.message,
      stack: anyErr?.stack,
    });
    return ResponseUtil.internalServerError(res, (e as Error).message);
  }
};
