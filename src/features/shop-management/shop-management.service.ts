import ShopModel from "../../models/ShopModel";
import ProductModel from "../../models/ProductModal";
import OrderModel from "../../models/OrderModel";
import ShopFollowerModel from "../../models/ShopFollower";
import ReviewModel from "../../models/ReviewModel";
import {
  GetMyShopProductsQuery,
  GetMyShopOrdersQuery,
  UpdateOrderStatusRequest,
  GetAnalyticsQuery,
  GetReviewsQuery,
  GetFollowersQuery,
} from "./types";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export default class ShopManagementService {
  // Lấy thông tin shop của user hiện tại
  static async getMyShop(req: AuthenticatedRequest) {
    try {
      // Lấy userId từ currentUser._id (ObjectId) hoặc user.userId (string)
      const currentUser = (req as any).currentUser;
      const user = (req as any).user;

      // Ưu tiên currentUser._id, nếu không có thì dùng user.userId
      // Convert ObjectId thành string để đảm bảo consistency
      const userId = currentUser?._id
        ? currentUser._id.toString
          ? currentUser._id.toString()
          : String(currentUser._id)
        : user?.userId;

      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      // Mongoose sẽ tự động convert string thành ObjectId khi query
      const shop = await ShopModel.findOne({ userId }).lean();
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message: "Bạn chưa có shop. Vui lòng tạo shop trước.",
        };
      }

      return { ok: true as const, shop };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Cập nhật thông tin shop
  static async updateMyShop(req: AuthenticatedRequest, data: any) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOneAndUpdate({ userId }, data, {
        new: true,
      });
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message: "Shop không tồn tại",
        };
      }

      return { ok: true as const, shop };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy danh sách sản phẩm của shop
  static async getMyShopProducts(
    req: AuthenticatedRequest,
    query: GetMyShopProductsQuery
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const page =
        Number.isFinite(query.page) && query.page && query.page > 0
          ? query.page
          : 1;
      const limit =
        Number.isFinite(query.limit) && query.limit && query.limit > 0
          ? Math.min(query.limit, 500)
          : 50;
      const skip = (page - 1) * limit;

      const filter: any = { shopId: shop._id.toString() };
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.subCategoryId) filter.subCategoryId = query.subCategoryId;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      if (typeof query.isActive === "boolean") filter.isActive = query.isActive;

      const sortField = query.sortBy || "createdAt";
      const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
      const sort: any = { [sortField]: sortDir };

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .populate("images", "url publicId")
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      return {
        ok: true as const,
        products,
        total,
        page,
        limit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Tạo sản phẩm mới
  static async createMyShopProduct(req: AuthenticatedRequest, data: any) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      // Prepare product data
      const productData: any = {
        ...data,
        shopId: shop._id.toString(),
      };

      // Handle variants if provided
      if (
        data.variants &&
        Array.isArray(data.variants) &&
        data.variants.length > 0
      ) {
        productData.variants = data.variants.map((variant: any) => ({
          attributes: variant.attributes || {},
          price: variant.price || data.price || 0,
          stock: variant.stock || 0,
          image: variant.image || null,
          sku: variant.sku || undefined,
        }));
        // If variants exist, calculate total stock from variants
        productData.stock = productData.variants.reduce(
          (sum: number, v: any) => sum + (v.stock || 0),
          0
        );
      }

      // Handle images - convert string URLs to ObjectIds if needed
      if (data.images && Array.isArray(data.images)) {
        const ImageModel = (await import("../../models/ImageModel")).default;
        const imageIds: string[] = [];

        for (const imageItem of data.images) {
          // If it's already an ObjectId string, use it directly
          if (
            typeof imageItem === "string" &&
            imageItem.match(/^[0-9a-fA-F]{24}$/)
          ) {
            imageIds.push(imageItem);
            continue;
          }

          // If it's a URL, create Image record
          if (typeof imageItem === "string" && imageItem.startsWith("http")) {
            try {
              // Extract publicId from URL if possible, or generate one
              const publicId = `product-image-${Date.now()}-${Math.random()
                .toString(36)
                .substring(7)}`;
              const imageRecord = await ImageModel.create({
                url: imageItem,
                publicId: publicId,
              });
              imageIds.push(imageRecord._id.toString());
            } catch (err) {
              console.error("Failed to create image record:", err);
              // Continue with other images
            }
          }
        }

        if (imageIds.length > 0) {
          productData.images = imageIds;
        } else {
          // If no valid images, return error
          return {
            ok: false as const,
            status: 400,
            message: "At least one valid image is required",
          };
        }
      }

      const product = await ProductModel.create(productData);

      return { ok: true as const, product };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Cập nhật sản phẩm
  static async updateMyShopProduct(
    req: AuthenticatedRequest,
    productId: string,
    data: any
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      // Prepare update data
      const updateData: any = { ...data };

      // Handle images - convert string URLs to ObjectIds if needed
      if (data.images && Array.isArray(data.images)) {
        const ImageModel = (await import("../../models/ImageModel")).default;
        const imageIds: string[] = [];

        for (const imageItem of data.images) {
          // If it's already an ObjectId string, use it directly
          if (
            typeof imageItem === "string" &&
            imageItem.match(/^[0-9a-fA-F]{24}$/)
          ) {
            imageIds.push(imageItem);
            continue;
          }

          // If it's a URL, create Image record
          if (typeof imageItem === "string" && imageItem.startsWith("http")) {
            try {
              const publicId = `product-image-${Date.now()}-${Math.random()
                .toString(36)
                .substring(7)}`;
              const imageRecord = await ImageModel.create({
                url: imageItem,
                publicId: publicId,
              });
              imageIds.push(imageRecord._id.toString());
            } catch (err) {
              console.error("Failed to create image record:", err);
              // Continue with other images
            }
          }
        }

        if (imageIds.length > 0) {
          updateData.images = imageIds;
        }
      }

      // Handle variants if provided
      if (data.variants !== undefined) {
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          const ImageModel = (await import("../../models/ImageModel")).default;

          updateData.variants = await Promise.all(
            data.variants.map(async (variant: any) => {
              let variantImage = variant.image || null;

              // If variant image is a URL (not ObjectId), create Image record
              if (
                variantImage &&
                typeof variantImage === "string" &&
                !variantImage.match(/^[0-9a-fA-F]{24}$/)
              ) {
                try {
                  const publicId = `variant-image-${Date.now()}-${Math.random()
                    .toString(36)
                    .substring(7)}`;
                  const imageRecord = await ImageModel.create({
                    url: variantImage,
                    publicId: publicId,
                  });
                  variantImage = imageRecord._id.toString();
                } catch (err) {
                  console.error("Failed to create variant image record:", err);
                  variantImage = null;
                }
              }

              return {
                attributes: variant.attributes || {},
                price: variant.price || data.price || 0,
                stock: variant.stock || 0,
                image: variantImage,
                sku: variant.sku || undefined,
              };
            })
          );

          // If variants exist, calculate total stock from variants
          updateData.stock = updateData.variants.reduce(
            (sum: number, v: any) => sum + (v.stock || 0),
            0
          );
        } else {
          // Empty array means remove all variants
          updateData.variants = [];
        }
      }

      const product = await ProductModel.findOneAndUpdate(
        { _id: productId, shopId: shop._id.toString() },
        updateData,
        { new: true }
      );

      if (!product) {
        return {
          ok: false as const,
          status: 404,
          message: "Sản phẩm không tồn tại",
        };
      }

      return { ok: true as const, product };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy chi tiết một sản phẩm của shop
  static async getMyShopProduct(req: AuthenticatedRequest, productId: string) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const productDoc = await ProductModel.findOne({
        _id: productId,
        shopId: shop._id.toString(),
      })
        .populate("images", "url publicId")
        .lean();

      if (!productDoc) {
        return {
          ok: false as const,
          status: 404,
          message: "Sản phẩm không tồn tại",
        };
      }

      // Populate variant images if they are ObjectIds
      const product: any = { ...productDoc };
      if (product.variants && Array.isArray(product.variants)) {
        const ImageModel = (await import("../../models/ImageModel")).default;
        product.variants = await Promise.all(
          product.variants.map(async (variant: any) => {
            // If variant.image is an ObjectId string, fetch the image URL
            if (
              variant.image &&
              typeof variant.image === "string" &&
              variant.image.match(/^[0-9a-fA-F]{24}$/)
            ) {
              try {
                const imageDoc = await ImageModel.findById(
                  variant.image
                ).lean();
                if (imageDoc && imageDoc.url) {
                  variant.image = imageDoc.url; // Convert ObjectId to URL
                }
              } catch (err) {
                console.error("Failed to populate variant image:", err);
                // Keep original value if fetch fails
              }
            }
            return variant;
          })
        );
      }

      return { ok: true as const, product };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Xóa sản phẩm
  static async deleteMyShopProduct(
    req: AuthenticatedRequest,
    productId: string
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const product = await ProductModel.findOneAndDelete({
        _id: productId,
        shopId: shop._id.toString(),
      });

      if (!product) {
        return {
          ok: false as const,
          status: 404,
          message: "Sản phẩm không tồn tại",
        };
      }

      return { ok: true as const, product };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy danh sách đơn hàng của shop
  static async getMyShopOrders(
    req: AuthenticatedRequest,
    query: GetMyShopOrdersQuery
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const page =
        Number.isFinite(query.page) && query.page && query.page > 0
          ? query.page
          : 1;
      const limit =
        Number.isFinite(query.limit) && query.limit && query.limit > 0
          ? Math.min(query.limit, 500)
          : 50;
      const skip = (page - 1) * limit;

      const filter: any = { shopId: shop._id };
      if (query.orderStatus) filter.status = query.orderStatus;
      if (query.paymentStatus) filter.isPay = query.paymentStatus === "paid";
      if (query.dateFrom || query.dateTo) {
        filter.createdAt = {};
        if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
        if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
      }

      const sortField = query.sortBy || "createdAt";
      const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
      const sort: any = { [sortField]: sortDir };

      const [orders, total] = await Promise.all([
        OrderModel.find(filter).skip(skip).limit(limit).sort(sort),
        OrderModel.countDocuments(filter),
      ]);

      return {
        ok: true as const,
        orders,
        total,
        page,
        limit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy chi tiết đơn hàng
  static async getMyShopOrder(req: AuthenticatedRequest, orderId: string) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const order = await OrderModel.findOne({
        _id: orderId,
        shopId: shop._id,
      });

      if (!order) {
        return {
          ok: false as const,
          status: 404,
          message: "Đơn hàng không tồn tại",
        };
      }

      return { ok: true as const, order };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Cập nhật trạng thái đơn hàng
  static async updateMyShopOrderStatus(
    req: AuthenticatedRequest,
    orderId: string,
    data: UpdateOrderStatusRequest
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const updateData: any = { status: data.orderStatus };
      if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
      if (data.notes) updateData.notes = data.notes;

      const order = await OrderModel.findOneAndUpdate(
        { _id: orderId, shopId: shop._id },
        updateData,
        { new: true }
      );

      if (!order) {
        return {
          ok: false as const,
          status: 404,
          message: "Đơn hàng không tồn tại",
        };
      }

      // Create order history
      const OrderHistoryModel = (await import("../../models/OrderHistory")).default;
      const history = await OrderHistoryModel.create({
        orderId: order._id,
        status: data.orderStatus,
        description: data.notes || `Order status changed to ${data.orderStatus}`,
      });
      await OrderModel.findByIdAndUpdate(order._id, {
        $push: { orderHistory: history._id },
      });

      // Handle wallet transfer based on order status
      try {
        const { default: WalletHelperService } = await import("../wallet/wallet-helper.service");
        const PaymentModel = (await import("../../models/PaymentModel")).default;
        
        if (data.orderStatus === "delivered" && order.isPay && !order.walletTransferred) {
          // Transfer money to shop wallet when order is delivered
          const payment = await PaymentModel.findOne({ orderId: order._id }).sort({ createdAt: -1 });
          await WalletHelperService.transferToShopWallet(
            order._id.toString(),
            order.totalAmount,
            payment?._id.toString()
          );
        } else if (data.orderStatus === "cancelled" && order.isPay) {
          // Refund money when order is cancelled
          await WalletHelperService.refundOrder(
            order._id.toString(),
            data.notes || "Đơn hàng bị hủy"
          );
        }
      } catch (walletError) {
        console.error("[shop-management] wallet operation failed:", walletError);
        // Don't fail the order status update if wallet operation fails
      }

      return { ok: true as const, order };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy thống kê shop
  static async getMyShopAnalytics(
    req: AuthenticatedRequest,
    query: GetAnalyticsQuery
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const shopId = shop._id.toString();
      const dateFilter: any = {};
      if (query.startDate) dateFilter.$gte = new Date(query.startDate);
      if (query.endDate) dateFilter.$lte = new Date(query.endDate);

      // Tổng doanh thu
      const revenueMatch: any = {
        shopId: shop._id,
        status: { $in: ["delivered"] },
        isPay: true,
      };
      if (Object.keys(dateFilter).length > 0) {
        revenueMatch.createdAt = dateFilter;
      }

      const revenueResult = await OrderModel.aggregate([
        { $match: revenueMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]);

      // Tổng sản phẩm
      const productsCount = await ProductModel.countDocuments({
        shopId: shop._id,
      });

      // Tổng đơn hàng
      const ordersMatch: any = { shopId: shop._id };
      if (Object.keys(dateFilter).length > 0) {
        ordersMatch.createdAt = dateFilter;
      }
      const totalOrders = await OrderModel.countDocuments(ordersMatch);

      // Đơn hàng theo trạng thái
      const ordersByStatus = await OrderModel.aggregate([
        { $match: ordersMatch },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Top sản phẩm bán chạy (cần populate orderItems)
      const ordersWithItems = await OrderModel.find(revenueMatch)
        .populate("orderItems")
        .limit(100)
        .lean();

      const productStats: Record<
        string,
        { productName: string; totalSold: number; totalRevenue: number }
      > = {};

      ordersWithItems.forEach((order: any) => {
        if (order.orderItems && Array.isArray(order.orderItems)) {
          order.orderItems.forEach((item: any) => {
            const productId = item.productId?.toString() || "unknown";
            if (!productStats[productId]) {
              productStats[productId] = {
                productName: item.productName || "Unknown",
                totalSold: 0,
                totalRevenue: 0,
              };
            }
            productStats[productId].totalSold += item.quantity || 0;
            productStats[productId].totalRevenue += item.totalPrice || 0;
          });
        }
      });

      const topProducts = Object.entries(productStats)
        .map(([productId, stats]) => ({
          _id: productId,
          productName: stats.productName,
          totalSold: stats.totalSold,
          totalRevenue: stats.totalRevenue,
        }))
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10);

      const analytics = {
        revenue: revenueResult[0]?.totalRevenue || 0,
        totalOrders,
        productsCount,
        ordersByStatus: ordersByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topProducts,
      };

      return { ok: true as const, analytics };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy đánh giá shop
  static async getMyShopReviews(
    req: AuthenticatedRequest,
    query: GetReviewsQuery
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const page =
        Number.isFinite(query.page) && query.page && query.page > 0
          ? query.page
          : 1;
      const limit =
        Number.isFinite(query.limit) && query.limit && query.limit > 0
          ? Math.min(query.limit, 500)
          : 50;
      const skip = (page - 1) * limit;

      const filter: any = { shopId: shop._id.toString() };
      if (query.rating) filter.rating = query.rating;

      const sortField = query.sortBy || "createdAt";
      const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
      const sort: any = { [sortField]: sortDir };

      const [reviews, total] = await Promise.all([
        ReviewModel.find(filter).skip(skip).limit(limit).sort(sort),
        ReviewModel.countDocuments(filter),
      ]);

      // Tính rating trung bình
      const ratingStats = await ReviewModel.aggregate([
        { $match: filter },
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
      const distribution: Record<number, number> = {};
      ratingDistribution.forEach((rating: number) => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });

      return {
        ok: true as const,
        reviews,
        total,
        page,
        limit,
        averageRating: ratingStats[0]?.averageRating || 0,
        totalReviews: ratingStats[0]?.totalReviews || 0,
        ratingDistribution: distribution,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Lấy danh sách người theo dõi
  static async getMyShopFollowers(
    req: AuthenticatedRequest,
    query: GetFollowersQuery
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message:
            "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
        };
      }

      const page =
        Number.isFinite(query.page) && query.page && query.page > 0
          ? query.page
          : 1;
      const limit =
        Number.isFinite(query.limit) && query.limit && query.limit > 0
          ? Math.min(query.limit, 500)
          : 50;
      const skip = (page - 1) * limit;

      const [followers, total] = await Promise.all([
        ShopFollowerModel.find({ shopId: shop._id.toString() })
          .skip(skip)
          .limit(limit)
          .populate("userId", "name email avatar")
          .sort({ createdAt: -1 }),
        ShopFollowerModel.countDocuments({ shopId: shop._id.toString() }),
      ]);

      return {
        ok: true as const,
        followers,
        total,
        page,
        limit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }
}
