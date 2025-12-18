import mongoose from "mongoose";
import ShopModel from "../../models/ShopModel";
import ProductModel from "../../models/ProductModal";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import ShopFollowerModel from "../../models/ShopFollower";
import ReviewModel from "../../models/ReviewModel";
import OrderHistoryModel from "../../models/OrderHistory";
import OrderInternalNoteModel from "../../models/OrderInternalNote";
import {
  GetMyShopProductsQuery,
  GetMyShopOrdersQuery,
  UpdateOrderStatusRequest,
  GetAnalyticsQuery,
  GetReviewsQuery,
  GetFollowersQuery,
} from "./types";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import { notificationService } from "../../shared/services/notification.service";
import AnalyticsService from "../analytics/analytics.service";

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

      const shop = await ShopModel.findOne({ userId }).select("_id name");
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

      const [productsRaw, total] = await Promise.all([
        ProductModel.find(filter)
          .populate("images", "url publicId")
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      // Populate variant images
      const ImageModel = (await import("../../models/ImageModel")).default;
      const products = await Promise.all(
        productsRaw.map(async (product: any) => {
          if (product.variants && Array.isArray(product.variants)) {
            product.variants = await Promise.all(
              product.variants.map(async (variant: any) => {
                // If variant.image is an ObjectId string, fetch the image URL
                if (
                  variant.image &&
                  typeof variant.image === "string" &&
                  variant.image.match(/^[0-9a-fA-F]{24}$/)
                ) {
                  try {
                    const imageDoc = await ImageModel.findById(variant.image).lean();
                    if (imageDoc && imageDoc.url) {
                      return { ...variant, image: imageDoc.url };
                    }
                  } catch (err) {
                    console.error("Failed to populate variant image:", err);
                  }
                }
                return variant;
              })
            );
          }
          return product;
        })
      );

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

      const shop = await ShopModel.findOne({ userId }).select("_id name");
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

  // Calculate trust score based on user order history
  private static async calculateTrustScore(userId: string, shopId: string): Promise<number> {
    try {
      const userOrders = await OrderModel.find({ userId, shopId }).lean();
      if (userOrders.length === 0) return 50; // Default for new customers

      const totalOrders = userOrders.length;
      const cancelledOrders = userOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;
      const deliveredOrders = userOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
      const avgOrderValue = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / totalOrders;

      // Base score: 50
      let score = 50;

      // Positive factors
      if (deliveredOrders > 0) {
        const deliveryRate = deliveredOrders / totalOrders;
        score += deliveryRate * 30; // Up to +30 for good delivery rate
      }

      if (totalOrders >= 5) {
        score += 10; // +10 for repeat customers
      }

      if (avgOrderValue > 1000000) {
        score += 10; // +10 for high-value customers
      }

      // Negative factors
      if (cancelledOrders > 0) {
        const cancelRate = cancelledOrders / totalOrders;
        score -= cancelRate * 40; // Up to -40 for high cancellation rate
      }

      // Clamp between 0-100
      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error) {
      return 50; // Default on error
    }
  }

  // Internal note helper
  private static async formatOrderForShop(orderDoc: any, shopId?: string) {
    // Check if addressId is populated (object) or just an ID (string)
    let address = null;
    if (orderDoc.addressId) {
      if (typeof orderDoc.addressId === "object" && orderDoc.addressId._id) {
        // Already populated
        address = orderDoc.addressId;
      } else if (typeof orderDoc.addressId === "string") {
        // Need to populate - but this shouldn't happen if populate worked
        // For now, return null and log warning
        console.warn("addressId not populated for order", orderDoc._id);
      }
    }
    
    // Check if userId is populated
    let user = null;
    if (orderDoc.userId) {
      if (typeof orderDoc.userId === "object" && orderDoc.userId._id) {
        // Already populated
        user = orderDoc.userId;
      } else if (typeof orderDoc.userId === "string") {
        console.warn("userId not populated for order", orderDoc._id);
      }
    }
    
    // Process orderItems - they are already populated with productId and images
    const orderItemsDetails = Array.isArray(orderDoc.orderItems)
      ? orderDoc.orderItems.map((item: any) => {
          // item is an OrderItem document, productId is already populated
          const product = item.productId as any;
          const images = Array.isArray(product?.images) ? product.images : [];
          let imageUrl: string | undefined;
          if (images.length > 0) {
            const firstImage = images[0];
            if (typeof firstImage === "object" && firstImage?.url) {
              imageUrl = firstImage.url;
            } else if (typeof firstImage === "string") {
              imageUrl = firstImage;
            }
          }
          return {
            productId: product?._id?.toString?.() || (typeof item.productId === "string" ? item.productId : item.productId?._id?.toString?.()),
            productName: product?.name || "Sản phẩm",
            quantity: item.quantity || 0,
            price: item.price || 0,
            totalPrice: item.totalPrice || item.price || 0,
            productImage: imageUrl,
          };
        })
      : [];

    // Get timeline from OrderHistory
    const orderHistory = await OrderHistoryModel.find({ orderId: orderDoc._id })
      .sort({ createdAt: 1 })
      .lean();
    const timeline = orderHistory.map((h: any) => ({
      status: h.status,
      description: h.description,
      createdAt: h.createdAt,
    }));

    // Get internal notes
    const internalNotes = shopId
      ? await OrderInternalNoteModel.find({ orderId: orderDoc._id, shopId })
          .sort({ createdAt: -1 })
          .select("note createdAt createdBy")
          .lean()
      : [];

    // Calculate trust score
    const trustScore = user?._id && shopId
      ? await ShopManagementService.calculateTrustScore(user._id.toString(), shopId)
      : 50;

    return {
      ...orderDoc,
      user: user
        ? {
            _id: user._id?.toString?.() || user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
          }
        : undefined,
      shippingAddress: address
        ? {
            name: address.fullName,
            phone: address.phone,
            address: address.address,
            city: address.city,
            district: address.district,
            ward: address.ward,
          }
        : undefined,
      orderItemsDetails,
      trustScore,
      timeline,
      internalNotes: internalNotes.map((n: any) => ({
        note: n.note,
        createdAt: n.createdAt,
        createdBy: n.createdBy,
      })),
    };
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

      // Get orders with populate (without lean to ensure populate works correctly)
      const ordersQuery = OrderModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .populate({
          path: "orderItems",
          select: "_id productId variantId quantity price totalPrice discount tax",
          populate: {
            path: "productId",
            select: "_id name images price discount",
            populate: { 
              path: "images", 
              select: "_id url publicId"
            },
          },
        })
        .populate({
          path: "addressId",
          select: "_id fullName phone address city district ward"
        })
        .populate({
          path: "userId",
          select: "_id name email phone"
        });

      const [ordersRaw, total] = await Promise.all([
        ordersQuery.exec(),
        OrderModel.countDocuments(filter),
      ]);

      // Convert Mongoose documents to plain objects while preserving populated fields
      const ordersDocs = ordersRaw.map((order: any) => {
        const obj = order.toObject ? order.toObject() : order;
        // Ensure populated fields are properly converted
        if (obj.addressId && typeof obj.addressId === "object") {
          obj.addressId = typeof obj.addressId.toObject === "function" 
            ? obj.addressId.toObject() 
            : obj.addressId;
        }
        if (obj.userId && typeof obj.userId === "object") {
          obj.userId = typeof obj.userId.toObject === "function" 
            ? obj.userId.toObject() 
            : obj.userId;
        }
        if (Array.isArray(obj.orderItems)) {
          obj.orderItems = obj.orderItems.map((item: any) => {
            const itemObj = typeof item.toObject === "function" ? item.toObject() : item;
            if (itemObj.productId && typeof itemObj.productId === "object") {
              itemObj.productId = typeof itemObj.productId.toObject === "function" 
                ? itemObj.productId.toObject() 
                : itemObj.productId;
            }
            return itemObj;
          });
        }
        return obj;
      });

      const orders = await Promise.all(
        ordersDocs.map((orderDoc) =>
          ShopManagementService.formatOrderForShop(orderDoc, shop._id.toString())
        )
      );

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

  // Lấy thống kê số lượng đơn hàng theo trạng thái
  static async getMyShopOrderStatistics(req: AuthenticatedRequest) {
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
          message: "Shop không tồn tại",
        };
      }

      const ordersByStatus = await OrderModel.aggregate([
        { $match: { shopId: shop._id } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalOrders = await OrderModel.countDocuments({ shopId: shop._id });

      const stats = {
        all: totalOrders,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0,
      };

      ordersByStatus.forEach((item: any) => {
        if (item._id in stats) {
          (stats as any)[item._id] = item.count;
        }
      });

      return { ok: true as const, stats };
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

      const orderDoc = await OrderModel.findOne({
        _id: orderId,
        shopId: shop._id,
      })
        .populate({
          path: "orderItems",
          populate: {
            path: "productId",
            select: "_id name images price discount",
            populate: { path: "images", select: "_id url publicId" },
          },
        })
        .populate({
          path: "addressId",
          select: "_id fullName phone address city district ward",
        })
        .populate({
          path: "userId",
          select: "_id name email phone",
        })
        .lean();

      if (!orderDoc) {
        return {
          ok: false as const,
          status: 404,
          message: "Đơn hàng không tồn tại",
        };
      }

      const order = await ShopManagementService.formatOrderForShop(orderDoc, shop._id.toString());

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

      try {
        await notificationService.notifyUserOrderStatus({
          userId: order.userId.toString(),
          orderId: order._id.toString(),
          status: (data.orderStatus || order.status) as OrderStatus,
          shopName: shop.name,
        });
      } catch (notifyError) {
        console.error(
          "[shop-management] notify user order status failed:",
          notifyError
        );
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

      // Thống kê tồn kho
      const inventoryStats = await ProductModel.aggregate([
        { $match: { shopId: shop._id } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$stock" },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ["$stock", 10] }, 1, 0],
              },
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $eq: ["$stock", 0] }, 1, 0],
              },
            },
            productsWithVariants: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ["$variants", []] } }, 0] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      // Tính tồn kho từ variants
      const productsWithVariants = await ProductModel.find({
        shopId: shop._id,
        "variants.0": { $exists: true },
      }).select("variants").lean();

      let variantStockTotal = 0;
      productsWithVariants.forEach((product: any) => {
        if (product.variants && Array.isArray(product.variants)) {
          product.variants.forEach((variant: any) => {
            variantStockTotal += variant.stock || 0;
          });
        }
      });

      const inventoryData = inventoryStats[0] || {
        totalStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        productsWithVariants: 0,
      };
      inventoryData.totalStock += variantStockTotal;

      // Thống kê khách hàng thân thiết (top customers)
      const topCustomers = await OrderModel.aggregate([
        { $match: ordersMatch },
        {
          $group: {
            _id: "$userId",
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            lastOrderDate: { $max: "$createdAt" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]);

      // Populate user info cho top customers
      const topCustomersWithInfo = await Promise.all(
        topCustomers.map(async (customer: any) => {
          const user = await mongoose.model("User").findById(customer._id).select("name email").lean();
          return {
            userId: customer._id.toString(),
            userName: (user as any)?.name || "Khách hàng",
            userEmail: (user as any)?.email || "",
            totalOrders: customer.totalOrders,
            totalSpent: customer.totalSpent,
            lastOrderDate: customer.lastOrderDate,
          };
        })
      );

      // Doanh thu theo thời gian (7 ngày gần nhất)
      const revenueByDate = await OrderModel.aggregate([
        {
          $match: {
            ...revenueMatch,
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Doanh thu theo tháng (6 tháng gần nhất)
      const revenueByMonth = await OrderModel.aggregate([
        {
          $match: {
            ...revenueMatch,
            createdAt: {
              $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Thống kê sản phẩm theo danh mục
      const productsByCategory = await ProductModel.aggregate([
        { $match: { shopId: shop._id } },
        {
          $group: {
            _id: "$categoryId",
            count: { $sum: 1 },
            totalStock: { $sum: "$stock" },
          },
        },
        { $limit: 10 },
      ]);

      // Populate category names
      const productsByCategoryWithNames = await Promise.all(
        productsByCategory.map(async (item: any) => {
          const category = await mongoose.model("Category").findById(item._id).select("name").lean();
          return {
            categoryId: item._id.toString(),
            categoryName: (category as any)?.name || "Chưa phân loại",
            count: item.count,
            totalStock: item.totalStock,
          };
        })
      );

      // Get additional analytics data
      const revenueVsProfitResult = await AnalyticsService.revenueVsProfitTimeSeries({
        shopId: shop._id.toString(),
        granularity: "day",
        from: query.startDate ? new Date(query.startDate) : undefined,
        to: query.endDate ? new Date(query.endDate) : undefined,
      });

      const walletTransactionsResult = await AnalyticsService.walletTransactionsTimeSeries({
        shopId: shop._id.toString(),
        from: query.startDate ? new Date(query.startDate) : undefined,
        to: query.endDate ? new Date(query.endDate) : undefined,
      });

      const orderStatusWithColorsResult = await AnalyticsService.orderStatusDistributionWithColors({
        shopId: shop._id.toString(),
        from: query.startDate ? new Date(query.startDate) : undefined,
        to: query.endDate ? new Date(query.endDate) : undefined,
      });

      const analytics = {
        revenue: revenueResult[0]?.totalRevenue || 0,
        totalOrders,
        productsCount,
        ordersByStatus: ordersByStatus.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topProducts,
        inventory: {
          totalStock: inventoryData.totalStock,
          lowStockCount: inventoryData.lowStockCount,
          outOfStockCount: inventoryData.outOfStockCount,
          productsWithVariants: inventoryData.productsWithVariants,
        },
        topCustomers: topCustomersWithInfo,
        revenueByDate: revenueByDate.map((item: any) => ({
          date: item._id,
          revenue: item.revenue,
          orders: item.orders,
        })),
        revenueByMonth: revenueByMonth.map((item: any) => ({
          month: item._id,
          revenue: item.revenue,
          orders: item.orders,
        })),
        productsByCategory: productsByCategoryWithNames,
        // New analytics data
        revenueVsProfit: revenueVsProfitResult.ok ? revenueVsProfitResult.items : [],
        walletTransactions: walletTransactionsResult.ok ? walletTransactionsResult.items : [],
        orderStatusWithColors: orderStatusWithColorsResult.ok ? orderStatusWithColorsResult.items : [],
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

  // Batch printing - Generate PDF links for multiple orders
  static async batchPrintOrders(
    req: AuthenticatedRequest,
    orderIds: string[],
    type: "packing" | "invoice" = "packing"
  ) {
    try {
      const userId =
        (req as any).user?.userId || (req as any).currentUser?._id?.toString();
      if (!userId) {
        return { ok: false as const, status: 401, message: "Unauthorized" };
      }

      const shop = await ShopModel.findOne({ userId }).select("_id name");
      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message: "Shop không tồn tại",
        };
      }

      const orders = await OrderModel.find({
        _id: { $in: orderIds },
        shopId: shop._id,
      })
        .populate({
          path: "orderItems",
          populate: {
            path: "productId",
            select: "_id name images",
            populate: { path: "images", select: "url" },
          },
        })
        .populate({
          path: "addressId",
          select: "_id fullName phone address city district ward",
        })
        .populate({
          path: "userId",
          select: "_id name email phone",
        })
        .lean();

      if (orders.length === 0) {
        return {
          ok: false as const,
          status: 404,
          message: "Không tìm thấy đơn hàng",
        };
      }

      // Generate PDF links (in production, use actual PDF generation library)
      const baseUrl = process.env.API_URL || "http://localhost:5000";
      const pdfLinks = orders.map((order: any) => ({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
        pdfUrl: `${baseUrl}/api/v1/shops/my-shop/orders/${order._id}/print?type=${type}`,
        downloadUrl: `${baseUrl}/api/v1/shops/my-shop/orders/${order._id}/print?type=${type}&download=true`,
      }));

      // For ZIP download
      const zipUrl = `${baseUrl}/api/v1/shops/my-shop/orders/batch-print?orderIds=${orderIds.join(",")}&type=${type}&format=zip`;

      return {
        ok: true as const,
        pdfLinks,
        zipUrl,
        count: orders.length,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Add internal note
  static async addInternalNote(
    req: AuthenticatedRequest,
    orderId: string,
    note: string
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
          message: "Shop không tồn tại",
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

      const internalNote = await OrderInternalNoteModel.create({
        orderId: order._id,
        shopId: shop._id,
        note: note.trim(),
        createdBy: userId,
      });

      return {
        ok: true as const,
        note: {
          _id: internalNote._id.toString(),
          note: internalNote.note,
          createdAt: internalNote.createdAt,
          createdBy: internalNote.createdBy.toString(),
        },
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Get internal notes for an order
  static async getInternalNotes(req: AuthenticatedRequest, orderId: string) {
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
          message: "Shop không tồn tại",
        };
      }

      const notes = await OrderInternalNoteModel.find({
        orderId,
        shopId: shop._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        ok: true as const,
        notes: notes.map((n: any) => ({
          _id: n._id.toString(),
          note: n.note,
          createdAt: n.createdAt,
          createdBy: n.createdBy.toString(),
        })),
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Delete internal note
  static async deleteInternalNote(
    req: AuthenticatedRequest,
    noteId: string
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
          message: "Shop không tồn tại",
        };
      }

      const note = await OrderInternalNoteModel.findOneAndDelete({
        _id: noteId,
        shopId: shop._id,
        createdBy: userId, // Only creator can delete
      });

      if (!note) {
        return {
          ok: false as const,
          status: 404,
          message: "Ghi chú không tồn tại",
        };
      }

      return { ok: true as const, message: "Đã xóa ghi chú" };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Get detailed timeline for an order
  static async getOrderTimeline(req: AuthenticatedRequest, orderId: string) {
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
          message: "Shop không tồn tại",
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

      const timeline = await OrderHistoryModel.find({ orderId: order._id })
        .sort({ createdAt: 1 })
        .lean();

      return {
        ok: true as const,
        timeline: timeline.map((t: any) => ({
          _id: t._id.toString(),
          status: t.status,
          description: t.description,
          createdAt: t.createdAt,
        })),
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
