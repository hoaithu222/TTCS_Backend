import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import UsersService from "./users.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import {
  authenticateToken,
  authorize,
} from "../../shared/middlewares/auth.middleware";

export const getUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const includeShopStatus = req.query.includeShopStatus === "true";
  const result = await UsersService.getUser(id, includeShopStatus);
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

export const updateUserAvatarController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const { avatar } = req.body as { avatar?: string };
  const result = await UsersService.updateAvatar(id, avatar || "");
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
    message: "Cập nhật avatar thành công",
    user: result.user,
  });
};

export const getUsersController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search as string | undefined;
  const status = req.query.status as "active" | "inactive" | "suspended" | undefined;
  const role = req.query.role as "admin" | "user" | "moderator" | undefined;
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as "asc" | "desc" | undefined;

  const result = await UsersService.getUsers(
    page,
    limit,
    search,
    status,
    role,
    sortBy,
    sortOrder
  );

  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message || "Không thể lấy danh sách người dùng",
      result.status || 400,
      undefined,
      req.path,
      req.method
    );
  }

  const paginationMeta = {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  };

  return ResponseUtil.success(
    res,
    {
      users: result.users,
      pagination: paginationMeta,
    },
    "Lấy danh sách người dùng thành công",
    200,
    1,
    paginationMeta
  );
};

export const suspendUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const result = await UsersService.suspendUser(id);
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
  return ResponseUtil.success(res, result.user, "Đã khóa người dùng thành công");
};

export const unlockUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { id } = req.params;
  const result = await UsersService.unlockUser(id);
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
  return ResponseUtil.success(res, result.user, "Đã mở khóa người dùng thành công");
};