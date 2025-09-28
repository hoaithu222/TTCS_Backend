import { Request, Response } from "express";
import AddressService from "./address.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export const listAddressesController = async (req: Request, res: Response) => {
  const result = await AddressService.list(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items);
};

export const createAddressController = async (req: Request, res: Response) => {
  const result = await AddressService.create(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item);
};

export const updateAddressController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AddressService.update(
    req as AuthenticatedRequest,
    id,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const deleteAddressController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AddressService.delete(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const setDefaultAddressController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AddressService.setDefault(
    req as AuthenticatedRequest,
    id
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items);
};

export const getAddressByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AddressService.getById(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};
