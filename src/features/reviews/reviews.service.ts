import ReviewModel from "../../models/ReviewModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export interface CreateReviewRequest {
  productId: string;
  shopId: string;
  rating: number;
  comment?: string;
  images?: string[]; // Image IDs
}

export interface ListReviewsQuery {
  page?: number;
  limit?: number;
  productId?: string;
  shopId?: string;
  userId?: string;
  sortBy?: "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
}

export default class ReviewsService {
  static async create(req: AuthenticatedRequest, data: CreateReviewRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    try {
      const review = await ReviewModel.create({
        userId,
        productId: data.productId,
        shopId: data.shopId,
        rating: data.rating,
        comment: data.comment,
        images: data.images || [],
      });
      return { ok: true as const, review };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async get(id: string) {
    const review = await ReviewModel.findById(id);
    if (!review)
      return {
        ok: false as const,
        status: 404,
        message: "Review không tồn tại",
      };
    return { ok: true as const, review };
  }

  static async list(query: ListReviewsQuery) {
    try {
      const page =
        Number.isFinite(query.page as number) && (query.page as number) > 0
          ? (query.page as number)
          : 1;
      const limit =
        Number.isFinite(query.limit as number) && (query.limit as number) > 0
          ? Math.min(query.limit as number, 100)
          : 10;
      const skip = (page - 1) * limit;
      const filter: any = {};
      if (query.productId) filter.productId = query.productId;
      if (query.shopId) filter.shopId = query.shopId;
      if (query.userId) filter.userId = query.userId;
      const sortField = query.sortBy || "createdAt";
      const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
      const sort: any = { [sortField]: sortDir };

      const [items, total] = await Promise.all([
        ReviewModel.find(filter).skip(skip).limit(limit).sort(sort),
        ReviewModel.countDocuments(filter),
      ]);
      return { ok: true as const, items, total, page, limit };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  static async update(req: AuthenticatedRequest, id: string, data: any) {
    const currentUser = (req as any).currentUser as any;
    const review = await ReviewModel.findById(id);
    if (!review)
      return {
        ok: false as const,
        status: 404,
        message: "Review không tồn tại",
      };
    if (review.userId.toString() !== currentUser.id.toString())
      return { ok: false as const, status: 403, message: "Forbidden" };
    const updated = await ReviewModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return { ok: true as const, review: updated };
  }

  static async delete(req: AuthenticatedRequest, id: string) {
    const currentUser = (req as any).currentUser as any;
    const review = await ReviewModel.findById(id);
    if (!review)
      return {
        ok: false as const,
        status: 404,
        message: "Review không tồn tại",
      };
    if (review.userId.toString() !== currentUser.id.toString())
      return { ok: false as const, status: 403, message: "Forbidden" };
    const deleted = await ReviewModel.findByIdAndDelete(id);
    return { ok: true as const, review: deleted };
  }
}
