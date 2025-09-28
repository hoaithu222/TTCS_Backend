import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import UsersService from "./users.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const result = await UsersService.getUser(id);
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
  return ResponseUtil.success(res, {
    message: "Lấy thông tin người dùng thành công",
    user: result.user,
  });
};

export const updateUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const result = await UsersService.updateUser(id, req.body);
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
  return ResponseUtil.success(res, {
    message: "Cập nhật người dùng thành công",
    user: result.user,
  });
};

export const deleteUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const result = await UsersService.deleteUser(id);
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
  return ResponseUtil.success(res, { message: "Xóa người dùng thành công" });
};

export const getUsersController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const result = await UsersService.getUsers();

  if (!result.ok) {
    return ResponseUtil.error(
      res,
      "Không thể lấy danh sách người dùng",
      400,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, {
    message: "Lấy danh sách người dùng thành công",
    users: result.users,
  });
};
