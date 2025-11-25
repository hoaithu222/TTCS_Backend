import mongoose from "mongoose";
import ReviewModel from "../../models/ReviewModel";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";
import ProductModel from "../../models/ProductModal";
import ShopModel from "../../models/ShopModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type { CreateReviewRequest, ListReviewsQuery } from "./types";

export default class ReviewsService {
  static async create(req: AuthenticatedRequest, data: CreateReviewRequest) {
    const currentUser = (req as any).currentUser as { id: string; role?: string } | undefined;
    const userId = currentUser?.id?.toString() || (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }
    if (!data.orderId || !data.orderItemId) {
      return { ok: false as const, status: 400, message: "Thiếu thông tin đơn hàng" };
    }
    if (!data.productId || !data.shopId) {
      return { ok: false as const, status: 400, message: "Thiếu thông tin sản phẩm" };
    }
    if (typeof data.rating !== "number" || data.rating < 1 || data.rating > 5) {
      return { ok: false as const, status: 400, message: "Điểm đánh giá không hợp lệ" };
    }

    const session = await ReviewModel.startSession();
    session.startTransaction();
    const abortWith = async (status: number, message: string) => {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      return { ok: false as const, status, message };
    };
    try {
      const order = await OrderModel.findById(data.orderId)
        .select("userId status shopId orderItems isReview")
        .session(session);
      if (!order) {
        return abortWith(404, "Đơn hàng không tồn tại");
      }
      const isOwner = order.userId.toString() === userId.toString();
      if (!isOwner && currentUser?.role !== "admin") {
        return abortWith(403, "Bạn không thể đánh giá đơn hàng này");
      }
      if ((order.status as OrderStatus) !== OrderStatus.DELIVERED) {
        return abortWith(400, "Chỉ có thể đánh giá khi đơn hàng đã giao thành công");
      }
      if (order.shopId.toString() !== data.shopId.toString()) {
        return abortWith(400, "Shop không khớp với đơn hàng");
      }

      const orderItem = await OrderItemModel.findById(data.orderItemId).session(session);
      if (!orderItem) {
        return abortWith(404, "Sản phẩm trong đơn không tồn tại");
      }
      const belongsToOrder =
        orderItem.orderId?.toString() === order._id.toString() ||
        order.orderItems?.some((itemId) => itemId.toString() === orderItem._id.toString());
      if (!belongsToOrder) {
        return abortWith(400, "Sản phẩm không thuộc đơn hàng cần đánh giá");
      }
      if (orderItem.productId.toString() !== data.productId.toString()) {
        return abortWith(400, "Sản phẩm không hợp lệ");
      }
      if (orderItem.isReviewed) {
        return abortWith(400, "Bạn đã đánh giá sản phẩm này");
      }
      const existingReview = await ReviewModel.findOne({
        orderItemId: orderItem._id,
      }).session(session);
      if (existingReview) {
        return abortWith(400, "Bạn đã đánh giá sản phẩm này");
      }

      const [createdReview] = await ReviewModel.create(
        [
          {
            userId,
            productId: data.productId,
            shopId: data.shopId,
            orderId: data.orderId,
            orderItemId: data.orderItemId,
            rating: data.rating,
            comment: data.comment,
            images: data.images || [],
            isVerified: true,
          },
        ],
        { session }
      );

      await OrderItemModel.findByIdAndUpdate(
        orderItem._id,
        { isReviewed: true },
        { session }
      );

      const [totalItems, reviewedItems] = await Promise.all([
        OrderItemModel.countDocuments({ orderId: order._id }).session(session),
        OrderItemModel.countDocuments({ orderId: order._id, isReviewed: true }).session(session),
      ]);
      if (totalItems > 0 && reviewedItems === totalItems) {
        await OrderModel.findByIdAndUpdate(order._id, { isReview: true }, { session });
      }

      await session.commitTransaction();
      session.endSession();

      await ReviewsService.refreshAggregates(data.productId, data.shopId);

      return { ok: true as const, review: createdReview };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
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

  static async getShopReviews(
    shopId: string,
    query: { page?: number; limit?: number; sortBy?: string }
  ) {
    try {
      const page =
        Number.isFinite(query.page) && query.page && query.page > 0
          ? query.page
          : 1;
      const limit =
        Number.isFinite(query.limit) && query.limit && query.limit > 0
          ? Math.min(query.limit, 100)
          : 10;
      const skip = (page - 1) * limit;
      const sortField = query.sortBy || "createdAt";
      const sort: any = { [sortField]: -1 };

      const filter: any = { shopId };

      const [reviews, total] = await Promise.all([
        ReviewModel.find(filter)
          .populate({
            path: "userId",
            select: "name avatar",
          })
          .populate({
            path: "images",
            select: "url publicId",
          })
          .populate({
            path: "productId",
            select: "_id name images",
            populate: {
              path: "images",
              select: "_id url publicId",
            },
          })
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        ReviewModel.countDocuments(filter),
      ]);

      const ratingStats = await ReviewModel.aggregate([
        { $match: { shopId: new mongoose.Types.ObjectId(shopId) } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: "$rating",
            },
          },
        },
      ]);

      const ratingDistribution = ratingStats[0]?.ratingDistribution || [];
      const distribution: Record<string, number> = {};
      ratingDistribution.forEach((rating: number) => {
        distribution[rating.toString()] =
          (distribution[rating.toString()] || 0) + 1;
      });

      const mappedReviews = reviews.map((review: any) => ({
        _id: review._id,
        productId: review.productId?._id || review.productId,
        product: review.productId
          ? {
              _id: review.productId._id || review.productId,
              name: review.productId.name || "",
              image:
                review.productId.images?.[0]?.url ||
                review.productId.images?.[0],
            }
          : undefined,
        userId: review.userId?._id || review.userId,
        user: review.userId
          ? {
              _id: review.userId._id || review.userId,
              name: review.userId.name || "",
              avatar: review.userId.avatar,
            }
          : undefined,
        rating: review.rating,
        title: review.title || undefined,
        comment: review.comment || undefined,
        images: review.images?.map((img: any) => img?.url || img) || [],
        isVerified: review.isVerified || false,
        helpfulCount: review.helpfulCount || 0,
        createdAt: review.createdAt,
      }));

      return {
        ok: true as const,
        reviews: mappedReviews,
        averageRating: ratingStats[0]?.averageRating || 0,
        totalReviews: ratingStats[0]?.totalReviews || 0,
        ratingDistribution: distribution,
        page,
        limit,
        total,
      };
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
    if (updated) {
      await ReviewsService.refreshAggregates(updated.productId.toString(), updated.shopId.toString());
    }
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
    if (deleted) {
      await ReviewsService.refreshAggregates(deleted.productId.toString(), deleted.shopId.toString());
    }
    return { ok: true as const, review: deleted };
  }

  private static async refreshAggregates(productId: string, shopId: string) {
    try {
      await Promise.all([
        ReviewsService.updateProductStats(productId),
        ReviewsService.updateShopStats(shopId),
      ]);
    } catch (error) {
      console.error("[reviews] refresh aggregates failed:", error);
    }
  }

  private static async updateProductStats(productId: string) {
    const objectId = new mongoose.Types.ObjectId(productId);
    const stats = await ReviewModel.aggregate([
      { $match: { productId: objectId } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    const averageRating = stats[0]?.averageRating ?? 0;
    const totalReviews = stats[0]?.totalReviews ?? 0;
    await ProductModel.findByIdAndUpdate(productId, {
      rating: averageRating,
      reviewCount: totalReviews,
    });
  }

  private static async updateShopStats(shopId: string) {
    const objectId = new mongoose.Types.ObjectId(shopId);
    const stats = await ReviewModel.aggregate([
      { $match: { shopId: objectId } },
      {
        $group: {
          _id: "$shopId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    const averageRating = stats[0]?.averageRating ?? 0;
    const totalReviews = stats[0]?.totalReviews ?? 0;
    await ShopModel.findByIdAndUpdate(shopId, {
      rating: averageRating,
      reviewCount: totalReviews,
    });
  }
}
