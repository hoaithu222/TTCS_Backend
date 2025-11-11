import { Request, Response } from "express";
import { ResponseUtil } from "../../shared/utils/response.util";
import UserModel from "../../models/UserModel";

export const getProfileController = async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser;
  if (!currentUser) return ResponseUtil.unauthorized(res);
  return ResponseUtil.success(res, currentUser);
};

export const updateProfileController = async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser as { _id: string } | undefined;
  if (!currentUser) return ResponseUtil.unauthorized(res);

  const { name, fullName, phone, avatar } = req.body as {
    name?: string;
    fullName?: string;
    phone?: string;
    avatar?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (typeof name === "string") updateData.name = name;
  if (typeof fullName === "string") updateData.fullName = fullName;
  if (typeof phone === "string") updateData.phone = phone;
  if (typeof avatar === "string") updateData.avatar = avatar;

  try {
    const updated = await UserModel.findByIdAndUpdate(
      currentUser._id,
      updateData,
      {
        new: true,
      }
    );
    if (!updated) return ResponseUtil.badRequest(res, "User không tồn tại");
    return ResponseUtil.success(res, updated, "Cập nhật hồ sơ thành công");
  } catch (e) {
    return ResponseUtil.error(res, (e as Error).message, 400);
  }
};
