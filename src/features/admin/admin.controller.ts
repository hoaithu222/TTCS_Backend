import { Request, Response } from "express";
import AdminService from "./admin.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getUserStatisticsController = async (req: Request, res: Response) => {
  const result = await AdminService.getUserStatistics();
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, result.statistics, "Lấy thống kê người dùng thành công");
};

export const getProductStatisticsController = async (req: Request, res: Response) => {
  const result = await AdminService.getProductStatistics();
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, result.statistics, "Lấy thống kê sản phẩm thành công");
};

