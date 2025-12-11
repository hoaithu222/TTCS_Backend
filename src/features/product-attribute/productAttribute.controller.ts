import { Request, Response } from "express";
import ProductAttributeService from "./productAttribute.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getProductAttributeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await ProductAttributeService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const createProductAttributeController = async (
  req: Request,
  res: Response
) => {
  const result = await ProductAttributeService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item, "Thêm thuộc tính sản phẩm thành công");
};

export const updateProductAttributeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await ProductAttributeService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item, "Cập nhật thuộc tính sản phẩm thành công");
};

export const deleteProductAttributeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await ProductAttributeService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item, "Xóa thuộc tính sản phẩm thành công");
};

export const listProductAttributeController = async (
  req: Request,
  res: Response
) => {
  const { page, limit, productId, attributeTypeId } = req.query as any;
  const result = await ProductAttributeService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    productId,
    attributeTypeId,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};
