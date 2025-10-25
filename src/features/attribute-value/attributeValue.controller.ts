import { Request, Response } from "express";
import AttributeValueService from "./attributeValue.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getAttributeValueController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeValueService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const createAttributeValueController = async (
  req: Request,
  res: Response
) => {
  const result = await AttributeValueService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item);
};

export const updateAttributeValueController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeValueService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const deleteAttributeValueController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeValueService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const listAttributeValueController = async (
  req: Request,
  res: Response
) => {
  const { page, limit, attributeTypeId, search } = req.query as any;
  const result = await AttributeValueService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    attributeTypeId,
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









