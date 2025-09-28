import { Request, Response } from "express";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getProfileController = async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser;
  if (!currentUser) return ResponseUtil.unauthorized(res);
  return ResponseUtil.success(res, { user: currentUser });
};
