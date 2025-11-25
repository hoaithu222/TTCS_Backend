"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const ShopFollower_1 = __importDefault(require("../../models/ShopFollower"));
const ReviewModel_1 = __importDefault(require("../../models/ReviewModel"));
const OrderHistory_1 = __importDefault(require("../../models/OrderHistory"));
const OrderInternalNote_1 = __importDefault(require("../../models/OrderInternalNote"));
const notification_service_1 = require("../../shared/services/notification.service");
class ShopManagementService {
    // Lấy thông tin shop của user hiện tại
    static async getMyShop(req) {
        try {
            // Lấy userId từ currentUser._id (ObjectId) hoặc user.userId (string)
            const currentUser = req.currentUser;
            const user = req.user;
            // Ưu tiên currentUser._id, nếu không có thì dùng user.userId
            // Convert ObjectId thành string để đảm bảo consistency
            const userId = currentUser?._id
                ? currentUser._id.toString
                    ? currentUser._id.toString()
                    : String(currentUser._id)
                : user?.userId;
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            // Mongoose sẽ tự động convert string thành ObjectId khi query
            const shop = await ShopModel_1.default.findOne({ userId }).lean();
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước.",
                };
            }
            return { ok: true, shop };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Cập nhật thông tin shop
    static async updateMyShop(req, data) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOneAndUpdate({ userId }, data, {
                new: true,
            });
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            return { ok: true, shop };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Lấy danh sách sản phẩm của shop
    static async getMyShopProducts(req, query) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id name");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const page = Number.isFinite(query.page) && query.page && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0
                ? Math.min(query.limit, 500)
                : 50;
            const skip = (page - 1) * limit;
            const filter = { shopId: shop._id.toString() };
            if (query.categoryId)
                filter.categoryId = query.categoryId;
            if (query.subCategoryId)
                filter.subCategoryId = query.subCategoryId;
            if (query.search)
                filter.name = { $regex: query.search, $options: "i" };
            if (typeof query.isActive === "boolean")
                filter.isActive = query.isActive;
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate("images", "url publicId")
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            return {
                ok: true,
                products,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Tạo sản phẩm mới
    static async createMyShopProduct(req, data) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id name");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            // Prepare product data
            const productData = {
                ...data,
                shopId: shop._id.toString(),
            };
            // Handle variants if provided
            if (data.variants &&
                Array.isArray(data.variants) &&
                data.variants.length > 0) {
                productData.variants = data.variants.map((variant) => ({
                    attributes: variant.attributes || {},
                    price: variant.price || data.price || 0,
                    stock: variant.stock || 0,
                    image: variant.image || null,
                    sku: variant.sku || undefined,
                }));
                // If variants exist, calculate total stock from variants
                productData.stock = productData.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
            }
            // Handle images - convert string URLs to ObjectIds if needed
            if (data.images && Array.isArray(data.images)) {
                const ImageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ImageModel")))).default;
                const imageIds = [];
                for (const imageItem of data.images) {
                    // If it's already an ObjectId string, use it directly
                    if (typeof imageItem === "string" &&
                        imageItem.match(/^[0-9a-fA-F]{24}$/)) {
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
                        }
                        catch (err) {
                            console.error("Failed to create image record:", err);
                            // Continue with other images
                        }
                    }
                }
                if (imageIds.length > 0) {
                    productData.images = imageIds;
                }
                else {
                    // If no valid images, return error
                    return {
                        ok: false,
                        status: 400,
                        message: "At least one valid image is required",
                    };
                }
            }
            const product = await ProductModal_1.default.create(productData);
            return { ok: true, product };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Cập nhật sản phẩm
    static async updateMyShopProduct(req, productId, data) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            // Prepare update data
            const updateData = { ...data };
            // Handle images - convert string URLs to ObjectIds if needed
            if (data.images && Array.isArray(data.images)) {
                const ImageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ImageModel")))).default;
                const imageIds = [];
                for (const imageItem of data.images) {
                    // If it's already an ObjectId string, use it directly
                    if (typeof imageItem === "string" &&
                        imageItem.match(/^[0-9a-fA-F]{24}$/)) {
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
                        }
                        catch (err) {
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
                    const ImageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ImageModel")))).default;
                    updateData.variants = await Promise.all(data.variants.map(async (variant) => {
                        let variantImage = variant.image || null;
                        // If variant image is a URL (not ObjectId), create Image record
                        if (variantImage &&
                            typeof variantImage === "string" &&
                            !variantImage.match(/^[0-9a-fA-F]{24}$/)) {
                            try {
                                const publicId = `variant-image-${Date.now()}-${Math.random()
                                    .toString(36)
                                    .substring(7)}`;
                                const imageRecord = await ImageModel.create({
                                    url: variantImage,
                                    publicId: publicId,
                                });
                                variantImage = imageRecord._id.toString();
                            }
                            catch (err) {
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
                    }));
                    // If variants exist, calculate total stock from variants
                    updateData.stock = updateData.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                }
                else {
                    // Empty array means remove all variants
                    updateData.variants = [];
                }
            }
            const product = await ProductModal_1.default.findOneAndUpdate({ _id: productId, shopId: shop._id.toString() }, updateData, { new: true });
            if (!product) {
                return {
                    ok: false,
                    status: 404,
                    message: "Sản phẩm không tồn tại",
                };
            }
            return { ok: true, product };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Lấy chi tiết một sản phẩm của shop
    static async getMyShopProduct(req, productId) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const productDoc = await ProductModal_1.default.findOne({
                _id: productId,
                shopId: shop._id.toString(),
            })
                .populate("images", "url publicId")
                .lean();
            if (!productDoc) {
                return {
                    ok: false,
                    status: 404,
                    message: "Sản phẩm không tồn tại",
                };
            }
            // Populate variant images if they are ObjectIds
            const product = { ...productDoc };
            if (product.variants && Array.isArray(product.variants)) {
                const ImageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ImageModel")))).default;
                product.variants = await Promise.all(product.variants.map(async (variant) => {
                    // If variant.image is an ObjectId string, fetch the image URL
                    if (variant.image &&
                        typeof variant.image === "string" &&
                        variant.image.match(/^[0-9a-fA-F]{24}$/)) {
                        try {
                            const imageDoc = await ImageModel.findById(variant.image).lean();
                            if (imageDoc && imageDoc.url) {
                                variant.image = imageDoc.url; // Convert ObjectId to URL
                            }
                        }
                        catch (err) {
                            console.error("Failed to populate variant image:", err);
                            // Keep original value if fetch fails
                        }
                    }
                    return variant;
                }));
            }
            return { ok: true, product };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Xóa sản phẩm
    static async deleteMyShopProduct(req, productId) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const product = await ProductModal_1.default.findOneAndDelete({
                _id: productId,
                shopId: shop._id.toString(),
            });
            if (!product) {
                return {
                    ok: false,
                    status: 404,
                    message: "Sản phẩm không tồn tại",
                };
            }
            return { ok: true, product };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Calculate trust score based on user order history
    static async calculateTrustScore(userId, shopId) {
        try {
            const userOrders = await OrderModel_1.default.find({ userId, shopId }).lean();
            if (userOrders.length === 0)
                return 50; // Default for new customers
            const totalOrders = userOrders.length;
            const cancelledOrders = userOrders.filter((o) => o.status === OrderModel_1.OrderStatus.CANCELLED).length;
            const deliveredOrders = userOrders.filter((o) => o.status === OrderModel_1.OrderStatus.DELIVERED).length;
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
        }
        catch (error) {
            return 50; // Default on error
        }
    }
    // Internal note helper
    static async formatOrderForShop(orderDoc, shopId) {
        const address = orderDoc.addressId;
        const user = orderDoc.userId;
        const orderItemsDetails = Array.isArray(orderDoc.orderItems)
            ? orderDoc.orderItems.map((item) => {
                const product = item.productId;
                const images = Array.isArray(product?.images) ? product.images : [];
                let imageUrl;
                if (images.length > 0) {
                    const firstImage = images[0];
                    if (typeof firstImage === "object" && firstImage?.url) {
                        imageUrl = firstImage.url;
                    }
                    else if (typeof firstImage === "string") {
                        imageUrl = firstImage;
                    }
                }
                return {
                    productId: product?._id?.toString?.() || item.productId,
                    productName: product?.name || "Sản phẩm",
                    quantity: item.quantity,
                    price: item.price,
                    totalPrice: item.totalPrice,
                    productImage: imageUrl,
                };
            })
            : [];
        // Get timeline from OrderHistory
        const orderHistory = await OrderHistory_1.default.find({ orderId: orderDoc._id })
            .sort({ createdAt: 1 })
            .lean();
        const timeline = orderHistory.map((h) => ({
            status: h.status,
            description: h.description,
            createdAt: h.createdAt,
        }));
        // Get internal notes
        const internalNotes = shopId
            ? await OrderInternalNote_1.default.find({ orderId: orderDoc._id, shopId })
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
            internalNotes: internalNotes.map((n) => ({
                note: n.note,
                createdAt: n.createdAt,
                createdBy: n.createdBy,
            })),
        };
    }
    // Lấy danh sách đơn hàng của shop
    static async getMyShopOrders(req, query) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const page = Number.isFinite(query.page) && query.page && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0
                ? Math.min(query.limit, 500)
                : 50;
            const skip = (page - 1) * limit;
            const filter = { shopId: shop._id };
            if (query.orderStatus)
                filter.status = query.orderStatus;
            if (query.paymentStatus)
                filter.isPay = query.paymentStatus === "paid";
            if (query.dateFrom || query.dateTo) {
                filter.createdAt = {};
                if (query.dateFrom)
                    filter.createdAt.$gte = new Date(query.dateFrom);
                if (query.dateTo)
                    filter.createdAt.$lte = new Date(query.dateTo);
            }
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [ordersDocs, total] = await Promise.all([
                OrderModel_1.default.find(filter)
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
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
                    .lean(),
                OrderModel_1.default.countDocuments(filter),
            ]);
            const orders = await Promise.all(ordersDocs.map((orderDoc) => ShopManagementService.formatOrderForShop(orderDoc, shop._id.toString())));
            return {
                ok: true,
                orders,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Lấy chi tiết đơn hàng
    static async getMyShopOrder(req, orderId) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const orderDoc = await OrderModel_1.default.findOne({
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
                    ok: false,
                    status: 404,
                    message: "Đơn hàng không tồn tại",
                };
            }
            const order = await ShopManagementService.formatOrderForShop(orderDoc, shop._id.toString());
            return { ok: true, order };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Cập nhật trạng thái đơn hàng
    static async updateMyShopOrderStatus(req, orderId, data) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const updateData = { status: data.orderStatus };
            if (data.trackingNumber)
                updateData.trackingNumber = data.trackingNumber;
            if (data.notes)
                updateData.notes = data.notes;
            const order = await OrderModel_1.default.findOneAndUpdate({ _id: orderId, shopId: shop._id }, updateData, { new: true });
            if (!order) {
                return {
                    ok: false,
                    status: 404,
                    message: "Đơn hàng không tồn tại",
                };
            }
            // Create order history
            const OrderHistoryModel = (await Promise.resolve().then(() => __importStar(require("../../models/OrderHistory")))).default;
            const history = await OrderHistoryModel.create({
                orderId: order._id,
                status: data.orderStatus,
                description: data.notes || `Order status changed to ${data.orderStatus}`,
            });
            await OrderModel_1.default.findByIdAndUpdate(order._id, {
                $push: { orderHistory: history._id },
            });
            // Handle wallet transfer based on order status
            try {
                const { default: WalletHelperService } = await Promise.resolve().then(() => __importStar(require("../wallet/wallet-helper.service")));
                const PaymentModel = (await Promise.resolve().then(() => __importStar(require("../../models/PaymentModel")))).default;
                if (data.orderStatus === "delivered" && order.isPay && !order.walletTransferred) {
                    // Transfer money to shop wallet when order is delivered
                    const payment = await PaymentModel.findOne({ orderId: order._id }).sort({ createdAt: -1 });
                    await WalletHelperService.transferToShopWallet(order._id.toString(), order.totalAmount, payment?._id.toString());
                }
                else if (data.orderStatus === "cancelled" && order.isPay) {
                    // Refund money when order is cancelled
                    await WalletHelperService.refundOrder(order._id.toString(), data.notes || "Đơn hàng bị hủy");
                }
            }
            catch (walletError) {
                console.error("[shop-management] wallet operation failed:", walletError);
                // Don't fail the order status update if wallet operation fails
            }
            try {
                await notification_service_1.notificationService.notifyUserOrderStatus({
                    userId: order.userId.toString(),
                    orderId: order._id.toString(),
                    status: (data.orderStatus || order.status),
                    shopName: shop.name,
                });
            }
            catch (notifyError) {
                console.error("[shop-management] notify user order status failed:", notifyError);
            }
            return { ok: true, order };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Lấy thống kê shop
    static async getMyShopAnalytics(req, query) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const shopId = shop._id.toString();
            const dateFilter = {};
            if (query.startDate)
                dateFilter.$gte = new Date(query.startDate);
            if (query.endDate)
                dateFilter.$lte = new Date(query.endDate);
            // Tổng doanh thu
            const revenueMatch = {
                shopId: shop._id,
                status: { $in: ["delivered"] },
                isPay: true,
            };
            if (Object.keys(dateFilter).length > 0) {
                revenueMatch.createdAt = dateFilter;
            }
            const revenueResult = await OrderModel_1.default.aggregate([
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
            const productsCount = await ProductModal_1.default.countDocuments({
                shopId: shop._id,
            });
            // Tổng đơn hàng
            const ordersMatch = { shopId: shop._id };
            if (Object.keys(dateFilter).length > 0) {
                ordersMatch.createdAt = dateFilter;
            }
            const totalOrders = await OrderModel_1.default.countDocuments(ordersMatch);
            // Đơn hàng theo trạng thái
            const ordersByStatus = await OrderModel_1.default.aggregate([
                { $match: ordersMatch },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]);
            // Top sản phẩm bán chạy (cần populate orderItems)
            const ordersWithItems = await OrderModel_1.default.find(revenueMatch)
                .populate("orderItems")
                .limit(100)
                .lean();
            const productStats = {};
            ordersWithItems.forEach((order) => {
                if (order.orderItems && Array.isArray(order.orderItems)) {
                    order.orderItems.forEach((item) => {
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
                ordersByStatus: ordersByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                topProducts,
            };
            return { ok: true, analytics };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Lấy đánh giá shop
    static async getMyShopReviews(req, query) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const page = Number.isFinite(query.page) && query.page && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0
                ? Math.min(query.limit, 500)
                : 50;
            const skip = (page - 1) * limit;
            const filter = { shopId: shop._id.toString() };
            if (query.rating)
                filter.rating = query.rating;
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [reviews, total] = await Promise.all([
                ReviewModel_1.default.find(filter).skip(skip).limit(limit).sort(sort),
                ReviewModel_1.default.countDocuments(filter),
            ]);
            // Tính rating trung bình
            const ratingStats = await ReviewModel_1.default.aggregate([
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
            const distribution = {};
            ratingDistribution.forEach((rating) => {
                distribution[rating] = (distribution[rating] || 0) + 1;
            });
            return {
                ok: true,
                reviews,
                total,
                page,
                limit,
                averageRating: ratingStats[0]?.averageRating || 0,
                totalReviews: ratingStats[0]?.totalReviews || 0,
                ratingDistribution: distribution,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Lấy danh sách người theo dõi
    static async getMyShopFollowers(req, query) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Bạn chưa có shop. Vui lòng tạo shop trước khi thêm sản phẩm.",
                };
            }
            const page = Number.isFinite(query.page) && query.page && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit && query.limit > 0
                ? Math.min(query.limit, 500)
                : 50;
            const skip = (page - 1) * limit;
            const [followers, total] = await Promise.all([
                ShopFollower_1.default.find({ shopId: shop._id.toString() })
                    .skip(skip)
                    .limit(limit)
                    .populate("userId", "name email avatar")
                    .sort({ createdAt: -1 }),
                ShopFollower_1.default.countDocuments({ shopId: shop._id.toString() }),
            ]);
            return {
                ok: true,
                followers,
                total,
                page,
                limit,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Batch printing - Generate PDF links for multiple orders
    static async batchPrintOrders(req, orderIds, type = "packing") {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id name");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            const orders = await OrderModel_1.default.find({
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
                    ok: false,
                    status: 404,
                    message: "Không tìm thấy đơn hàng",
                };
            }
            // Generate PDF links (in production, use actual PDF generation library)
            const baseUrl = process.env.API_URL || "http://localhost:5000";
            const pdfLinks = orders.map((order) => ({
                orderId: order._id.toString(),
                orderNumber: order.orderNumber || `#${order._id.toString().slice(-6)}`,
                pdfUrl: `${baseUrl}/api/v1/shops/my-shop/orders/${order._id}/print?type=${type}`,
                downloadUrl: `${baseUrl}/api/v1/shops/my-shop/orders/${order._id}/print?type=${type}&download=true`,
            }));
            // For ZIP download
            const zipUrl = `${baseUrl}/api/v1/shops/my-shop/orders/batch-print?orderIds=${orderIds.join(",")}&type=${type}&format=zip`;
            return {
                ok: true,
                pdfLinks,
                zipUrl,
                count: orders.length,
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Add internal note
    static async addInternalNote(req, orderId, note) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            const order = await OrderModel_1.default.findOne({
                _id: orderId,
                shopId: shop._id,
            });
            if (!order) {
                return {
                    ok: false,
                    status: 404,
                    message: "Đơn hàng không tồn tại",
                };
            }
            const internalNote = await OrderInternalNote_1.default.create({
                orderId: order._id,
                shopId: shop._id,
                note: note.trim(),
                createdBy: userId,
            });
            return {
                ok: true,
                note: {
                    _id: internalNote._id.toString(),
                    note: internalNote.note,
                    createdAt: internalNote.createdAt,
                    createdBy: internalNote.createdBy.toString(),
                },
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get internal notes for an order
    static async getInternalNotes(req, orderId) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            const notes = await OrderInternalNote_1.default.find({
                orderId,
                shopId: shop._id,
            })
                .sort({ createdAt: -1 })
                .lean();
            return {
                ok: true,
                notes: notes.map((n) => ({
                    _id: n._id.toString(),
                    note: n.note,
                    createdAt: n.createdAt,
                    createdBy: n.createdBy.toString(),
                })),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Delete internal note
    static async deleteInternalNote(req, noteId) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            const note = await OrderInternalNote_1.default.findOneAndDelete({
                _id: noteId,
                shopId: shop._id,
                createdBy: userId, // Only creator can delete
            });
            if (!note) {
                return {
                    ok: false,
                    status: 404,
                    message: "Ghi chú không tồn tại",
                };
            }
            return { ok: true, message: "Đã xóa ghi chú" };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    // Get detailed timeline for an order
    static async getOrderTimeline(req, orderId) {
        try {
            const userId = req.user?.userId || req.currentUser?._id?.toString();
            if (!userId) {
                return { ok: false, status: 401, message: "Unauthorized" };
            }
            const shop = await ShopModel_1.default.findOne({ userId }).select("_id");
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            const order = await OrderModel_1.default.findOne({
                _id: orderId,
                shopId: shop._id,
            });
            if (!order) {
                return {
                    ok: false,
                    status: 404,
                    message: "Đơn hàng không tồn tại",
                };
            }
            const timeline = await OrderHistory_1.default.find({ orderId: order._id })
                .sort({ createdAt: 1 })
                .lean();
            return {
                ok: true,
                timeline: timeline.map((t) => ({
                    _id: t._id.toString(),
                    status: t.status,
                    description: t.description,
                    createdAt: t.createdAt,
                })),
            };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
}
exports.default = ShopManagementService;
