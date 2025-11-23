import { Request, Response } from "express";
import HomeConfigurationService from "./home-configuration.service";
import { ResponseUtil } from "../../shared/utils/response.util";

// Get active configuration (public)
export const getActiveConfigurationController = async (
  req: Request,
  res: Response
) => {
  const result = await HomeConfigurationService.getActiveConfiguration();
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.configuration);
};

// Get all configurations (admin only)
export const getAllConfigurationsController = async (
  req: Request,
  res: Response
) => {
  console.log("🔍 [Home Config] GET /admin/configuration called");
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    console.log("❌ [Home Config] Unauthorized access");
    return ResponseUtil.error(res, "Bạn không có quyền truy cập", 403);
  }

  console.log("✅ [Home Config] User authorized, fetching configurations");
  const result = await HomeConfigurationService.getAllConfigurations();
  if (!result.ok) {
    console.log("❌ [Home Config] Service error:", result.message);
    return ResponseUtil.error(res, result.message, result.status);
  }
  console.log("✅ [Home Config] Success, returning", result.configurations?.length || 0, "configurations");
  return ResponseUtil.success(res, { configurations: result.configurations });
};

// Get configuration by ID (public - for user selection)
export const getConfigurationByIdController = async (
  req: Request,
  res: Response
) => {
  // Allow public access for user configuration selection
  // No authentication required

  const { id } = req.params;
  const result = await HomeConfigurationService.getConfigurationById(id);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.configuration);
};

// Create configuration (admin only)
export const createConfigurationController = async (
  req: Request,
  res: Response
) => {
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    return ResponseUtil.error(res, "Bạn không có quyền tạo cấu hình", 403);
  }

  const result = await HomeConfigurationService.createConfiguration(req.body);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.configuration, "Tạo cấu hình thành công");
};

// Update configuration (admin only)
export const updateConfigurationController = async (
  req: Request,
  res: Response
) => {
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    return ResponseUtil.error(res, "Bạn không có quyền cập nhật cấu hình", 403);
  }

  const { id } = req.params;
  const result = await HomeConfigurationService.updateConfiguration(
    id,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.configuration, "Cập nhật cấu hình thành công");
};

// Delete configuration (admin only)
export const deleteConfigurationController = async (
  req: Request,
  res: Response
) => {
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    return ResponseUtil.error(res, "Bạn không có quyền xóa cấu hình", 403);
  }

  const { id } = req.params;
  const result = await HomeConfigurationService.deleteConfiguration(id);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, null, "Xóa cấu hình thành công");
};

