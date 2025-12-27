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
const mongoose_1 = __importDefault(require("mongoose"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const ShopFollower_1 = __importDefault(require("../../models/ShopFollower"));
const ReviewModel_1 = __importDefault(require("../../models/ReviewModel"));
const OrderHistory_1 = __importDefault(require("../../models/OrderHistory"));
const OrderInternalNote_1 = __importDefault(require("../../models/OrderInternalNote"));
const OrderItem_1 = __importDefault(require("../../models/OrderItem"));
const CartItem_1 = __importDefault(require("../../models/CartItem"));
const notification_service_1 = require("../../shared/services/notification.service");
const analytics_service_1 = __importDefault(require("../analytics/analytics.service"));
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
            const [productsRaw, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate("images", "url publicId")
                    .skip(skip)
                    .limit(limit)
                    .sort(sort)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Populate variant images
            const ImageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ImageModel")))).default;
            const products = await Promise.all(productsRaw.map(async (product) => {
                if (product.variants && Array.isArray(product.variants)) {
                    product.variants = await Promise.all(product.variants.map(async (variant) => {
                        // If variant.image is an ObjectId string, fetch the image URL
                        if (variant.image &&
                            typeof variant.image === "string" &&
                            variant.image.match(/^[0-9a-fA-F]{24}$/)) {
                            try {
                                const imageDoc = await ImageModel.findById(variant.image).lean();
                                if (imageDoc && imageDoc.url) {
                                    return { ...variant, image: imageDoc.url };
                                }
                            }
                            catch (err) {
                                console.error("Failed to populate variant image:", err);
                            }
                        }
                        return variant;
                    }));
                }
                return product;
            }));
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
        // Check if addressId is populated (object) or just an ID (string)
        let address = null;
        if (orderDoc.addressId) {
            if (typeof orderDoc.addressId === "object" && orderDoc.addressId._id) {
                // Already populated
                address = orderDoc.addressId;
            }
            else if (typeof orderDoc.addressId === "string") {
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
            }
            else if (typeof orderDoc.userId === "string") {
                console.warn("userId not populated for order", orderDoc._id);
            }
        }
        // Process orderItems - they are already populated with productId and images
        const orderItemsDetails = Array.isArray(orderDoc.orderItems)
            ? orderDoc.orderItems.map((item) => {
                // item is an OrderItem document, productId is already populated
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
            // Get orders with populate (without lean to ensure populate works correctly)
            const ordersQuery = OrderModel_1.default.find(filter)
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
                OrderModel_1.default.countDocuments(filter),
            ]);
            // Convert Mongoose documents to plain objects while preserving populated fields
            const ordersDocs = ordersRaw.map((order) => {
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
                    obj.orderItems = obj.orderItems.map((item) => {
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
    // Lấy thống kê số lượng đơn hàng theo trạng thái
    static async getMyShopOrderStatistics(req) {
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
            const ordersByStatus = await OrderModel_1.default.aggregate([
                { $match: { shopId: shop._id } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]);
            const totalOrders = await OrderModel_1.default.countDocuments({ shopId: shop._id });
            const stats = {
                all: totalOrders,
                pending: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                returned: 0,
            };
            ordersByStatus.forEach((item) => {
                if (item._id in stats) {
                    stats[item._id] = item.count;
                }
            });
            return { ok: true, stats };
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
            // Calculate date range from period if startDate/endDate not provided
            let fromDate;
            let toDate;
            if (query.startDate && query.endDate) {
                fromDate = new Date(query.startDate);
                toDate = new Date(query.endDate);
            }
            else if (query.period) {
                const now = new Date();
                toDate = new Date(now);
                fromDate = new Date(now);
                switch (query.period) {
                    case "day":
                        fromDate.setDate(fromDate.getDate() - 1);
                        break;
                    case "week":
                        fromDate.setDate(fromDate.getDate() - 7);
                        break;
                    case "month":
                        fromDate.setDate(fromDate.getDate() - 30);
                        break;
                    case "year":
                        fromDate.setFullYear(fromDate.getFullYear() - 1);
                        break;
                    default:
                        // Default to 30 days if period is invalid
                        fromDate.setDate(fromDate.getDate() - 30);
                        break;
                }
            }
            const dateFilter = {};
            if (fromDate)
                dateFilter.$gte = fromDate;
            if (toDate)
                dateFilter.$lte = toDate;
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
            // Top sản phẩm bán chạy (cần populate orderItems và productId)
            const ordersWithItems = await OrderModel_1.default.find(revenueMatch)
                .populate({
                path: "orderItems",
                populate: {
                    path: "productId",
                    select: "name",
                },
            })
                .limit(100)
                .lean();
            const productStats = {};
            ordersWithItems.forEach((order) => {
                if (order.orderItems && Array.isArray(order.orderItems)) {
                    order.orderItems.forEach((item) => {
                        const product = item.productId;
                        const productId = product?._id?.toString() || item.productId?.toString() || "unknown";
                        if (!productStats[productId]) {
                            productStats[productId] = {
                                productName: product?.name || item.productName || "Sản phẩm",
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
            const inventoryStats = await ProductModal_1.default.aggregate([
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
            const productsWithVariants = await ProductModal_1.default.find({
                shopId: shop._id,
                "variants.0": { $exists: true },
            }).select("variants").lean();
            let variantStockTotal = 0;
            productsWithVariants.forEach((product) => {
                if (product.variants && Array.isArray(product.variants)) {
                    product.variants.forEach((variant) => {
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
            const topCustomers = await OrderModel_1.default.aggregate([
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
            const topCustomersWithInfo = await Promise.all(topCustomers.map(async (customer) => {
                const user = await mongoose_1.default.model("User").findById(customer._id).select("name email").lean();
                return {
                    userId: customer._id.toString(),
                    userName: user?.name || "Khách hàng",
                    userEmail: user?.email || "",
                    totalOrders: customer.totalOrders,
                    totalSpent: customer.totalSpent,
                    lastOrderDate: customer.lastOrderDate,
                };
            }));
            // Doanh thu theo thời gian (7 ngày gần nhất)
            const revenueByDate = await OrderModel_1.default.aggregate([
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
            const revenueByMonth = await OrderModel_1.default.aggregate([
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
            const productsByCategory = await ProductModal_1.default.aggregate([
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
            const productsByCategoryWithNames = await Promise.all(productsByCategory.map(async (item) => {
                const category = await mongoose_1.default.model("Category").findById(item._id).select("name").lean();
                return {
                    categoryId: item._id.toString(),
                    categoryName: category?.name || "Chưa phân loại",
                    count: item.count,
                    totalStock: item.totalStock,
                };
            }));
            // Get additional analytics data
            const revenueVsProfitResult = await analytics_service_1.default.revenueVsProfitTimeSeries({
                shopId: shop._id.toString(),
                granularity: "day",
                from: fromDate,
                to: toDate,
            });
            const walletTransactionsResult = await analytics_service_1.default.walletTransactionsTimeSeries({
                shopId: shop._id.toString(),
                from: fromDate,
                to: toDate,
            });
            const orderStatusWithColorsResult = await analytics_service_1.default.orderStatusDistributionWithColors({
                shopId: shop._id.toString(),
                from: fromDate,
                to: toDate,
            });
            const analytics = {
                revenue: revenueResult[0]?.totalRevenue || 0,
                totalOrders,
                productsCount,
                ordersByStatus: ordersByStatus.reduce((acc, item) => {
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
                revenueByDate: revenueByDate.map((item) => ({
                    date: item._id,
                    revenue: item.revenue,
                    orders: item.orders,
                })),
                revenueByMonth: revenueByMonth.map((item) => ({
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
    // 1. Product Portfolio Analysis (80/20 Rule - Donut + List)
    static async getProductPortfolioAnalysis(req, query) {
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
                    message: "Bạn chưa có shop.",
                };
            }
            const dateFilter = {};
            if (query.startDate)
                dateFilter.$gte = new Date(query.startDate);
            if (query.endDate)
                dateFilter.$lte = new Date(query.endDate);
            const match = {
                shopId: shop._id,
                status: OrderModel_1.OrderStatus.DELIVERED,
            };
            if (Object.keys(dateFilter).length > 0) {
                match.createdAt = dateFilter;
            }
            // Get product revenue stats
            const productStats = await OrderItem_1.default.aggregate([
                {
                    $lookup: {
                        from: "orders",
                        localField: "orderId",
                        foreignField: "_id",
                        as: "order",
                    },
                },
                { $unwind: "$order" },
                { $match: match },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $group: {
                        _id: "$productId",
                        productName: { $first: "$product.name" },
                        revenue: { $sum: "$totalPrice" },
                        quantity: { $sum: "$quantity" },
                        viewCount: { $first: "$product.viewCount" },
                        salesCount: { $first: "$product.salesCount" },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        productName: 1,
                        revenue: 1,
                        quantity: 1,
                        viewCount: { $ifNull: ["$viewCount", 0] },
                        salesCount: { $ifNull: ["$salesCount", 0] },
                    },
                },
                { $sort: { revenue: -1 } },
            ]);
            const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
            const avgRevenue = totalRevenue / productStats.length || 1;
            // Classify products: 30% Cash Cows, 20% Stars, 50% Dogs
            const sortedProducts = productStats.sort((a, b) => b.revenue - a.revenue);
            const cashCowsCount = Math.ceil(sortedProducts.length * 0.3);
            const starsCount = Math.ceil(sortedProducts.length * 0.2);
            const dogsCount = sortedProducts.length - cashCowsCount - starsCount;
            const cashCows = sortedProducts.slice(0, cashCowsCount);
            const stars = sortedProducts.slice(cashCowsCount, cashCowsCount + starsCount);
            const dogs = sortedProducts.slice(cashCowsCount + starsCount);
            const cashCowsRevenue = cashCows.reduce((sum, p) => sum + p.revenue, 0);
            const starsRevenue = stars.reduce((sum, p) => sum + p.revenue, 0);
            const dogsRevenue = dogs.reduce((sum, p) => sum + p.revenue, 0);
            // Top 5 Stars for advertising
            const topStars = stars
                .sort((a, b) => {
                // Sort by growth potential (revenue + viewCount)
                const viewCountA = typeof a.viewCount === "number" ? a.viewCount : 0;
                const viewCountB = typeof b.viewCount === "number" ? b.viewCount : 0;
                const scoreA = a.revenue + viewCountA * 1000;
                const scoreB = b.revenue + viewCountB * 1000;
                return scoreB - scoreA;
            })
                .slice(0, 5)
                .map((p) => ({
                productId: p._id.toString(),
                productName: p.productName,
                revenue: p.revenue,
                quantity: p.quantity,
                viewCount: typeof p.viewCount === "number" ? p.viewCount : 0,
            }));
            return {
                ok: true,
                portfolio: {
                    cashCows: {
                        count: cashCows.length,
                        revenue: cashCowsRevenue,
                        percentage: totalRevenue > 0 ? (cashCowsRevenue / totalRevenue) * 100 : 0,
                        products: cashCows.map((p) => ({
                            productId: p._id.toString(),
                            productName: p.productName,
                            revenue: p.revenue,
                        })),
                    },
                    stars: {
                        count: stars.length,
                        revenue: starsRevenue,
                        percentage: totalRevenue > 0 ? (starsRevenue / totalRevenue) * 100 : 0,
                        products: stars.map((p) => ({
                            productId: p._id.toString(),
                            productName: p.productName,
                            revenue: p.revenue,
                        })),
                    },
                    dogs: {
                        count: dogs.length,
                        revenue: dogsRevenue,
                        percentage: totalRevenue > 0 ? (dogsRevenue / totalRevenue) * 100 : 0,
                        products: dogs.map((p) => ({
                            productId: p._id.toString(),
                            productName: p.productName,
                            revenue: p.revenue,
                        })),
                    },
                    topStarsForAds: topStars,
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
    // 2. Customer Trend Compass (Trail Chart)
    static async getCustomerTrendCompass(req, query) {
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
                    message: "Bạn chưa có shop.",
                };
            }
            // Default to last 7 days
            const to = query.endDate ? new Date(query.endDate) : new Date();
            const from = query.startDate
                ? new Date(query.startDate)
                : new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
            const match = { shopId: shop._id };
            if (query.productId)
                match._id = new mongoose_1.default.Types.ObjectId(query.productId);
            // Get products with views and cart additions
            const products = await ProductModal_1.default.find(match).select("_id name viewCount");
            // Get cart additions for products in date range
            const cartAdditions = await CartItem_1.default.aggregate([
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $match: {
                        "product.shopId": shop._id,
                        createdAt: { $gte: from, $lte: to },
                        ...(query.productId ? { productId: new mongoose_1.default.Types.ObjectId(query.productId) } : {}),
                    },
                },
                {
                    $group: {
                        _id: {
                            productId: "$productId",
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        },
                        addToCartCount: { $sum: 1 },
                    },
                },
            ]);
            // Get view counts by date (simulate from product viewCount and distribute)
            const trailData = [];
            const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
            for (let i = 0; i <= daysDiff; i++) {
                const date = new Date(from);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split("T")[0];
                for (const product of products) {
                    const cartData = cartAdditions.find((c) => c._id.productId.toString() === product._id.toString() &&
                        c._id.date === dateStr);
                    // Simulate views (distribute viewCount across days)
                    const productViewCount = typeof product.viewCount === "number" ? product.viewCount : 0;
                    const dailyViews = Math.round(productViewCount / (daysDiff + 1));
                    const addToCart = cartData?.addToCartCount || 0;
                    trailData.push({
                        date: dateStr,
                        productId: product._id.toString(),
                        productName: product.name,
                        views: dailyViews + Math.floor(Math.random() * 10), // Add some variation
                        addToCart,
                    });
                }
            }
            return {
                ok: true,
                trailData: trailData.sort((a, b) => {
                    if (a.date !== b.date)
                        return a.date.localeCompare(b.date);
                    return a.productName.localeCompare(b.productName);
                }),
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
    // 3. Order Forecast & Performance (Volume Analysis)
    static async getOrderForecast(req, query) {
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
                    message: "Bạn chưa có shop.",
                };
            }
            // Get today's orders by hour
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const todayOrders = await OrderModel_1.default.aggregate([
                {
                    $match: {
                        shopId: shop._id,
                        createdAt: { $gte: today, $lt: tomorrow },
                    },
                },
                {
                    $group: {
                        _id: { $hour: "$createdAt" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);
            // Get last week's average orders by hour
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const lastWeekEnd = new Date(today);
            const lastWeekOrders = await OrderModel_1.default.aggregate([
                {
                    $match: {
                        shopId: shop._id,
                        createdAt: { $gte: lastWeekStart, $lt: lastWeekEnd },
                    },
                },
                {
                    $group: {
                        _id: { $hour: "$createdAt" },
                        count: { $sum: 1 },
                    },
                },
            ]);
            // Calculate average per hour
            const avgByHour = {};
            lastWeekOrders.forEach((item) => {
                const hour = item._id;
                avgByHour[hour] = (avgByHour[hour] || 0) + item.count;
            });
            // Divide by 7 days to get average
            Object.keys(avgByHour).forEach((hour) => {
                avgByHour[parseInt(hour)] = Math.round(avgByHour[parseInt(hour)] / 7);
            });
            // Format data for chart
            const chartData = [];
            for (let hour = 0; hour < 24; hour++) {
                const todayCount = todayOrders.find((o) => o._id === hour)?.count || 0;
                const avgCount = avgByHour[hour] || 0;
                chartData.push({
                    hour: `${hour.toString().padStart(2, "0")}:00`,
                    currentOrders: todayCount,
                    averageOrders: avgCount,
                });
            }
            return {
                ok: true,
                forecastData: chartData,
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
    // 4. Order Cancellation & Return Analysis (Stacked Bar)
    static async getOrderCancellationAnalysis(req, query) {
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
                    message: "Bạn chưa có shop.",
                };
            }
            const dateFilter = {};
            if (query.startDate)
                dateFilter.$gte = new Date(query.startDate);
            if (query.endDate)
                dateFilter.$lte = new Date(query.endDate);
            // Group by week or month based on date range
            const daysDiff = query.startDate && query.endDate
                ? Math.ceil((new Date(query.endDate).getTime() - new Date(query.startDate).getTime()) / (24 * 60 * 60 * 1000))
                : 30;
            const format = daysDiff > 90 ? "%Y-%m" : "%Y-%m-%d";
            const groupFormat = daysDiff > 90 ? "month" : "week";
            const match = {
                shopId: shop._id,
                status: { $in: [OrderModel_1.OrderStatus.CANCELLED, OrderModel_1.OrderStatus.DELIVERED] },
            };
            if (Object.keys(dateFilter).length > 0) {
                match.createdAt = dateFilter;
            }
            const orders = await OrderModel_1.default.aggregate([
                { $match: match },
                {
                    $project: {
                        period: { $dateToString: { format, date: "$createdAt" } },
                        status: 1,
                        cancellationReason: 1,
                    },
                },
                {
                    $group: {
                        _id: {
                            period: "$period",
                            status: "$status",
                        },
                        count: { $sum: 1 },
                        reasons: { $push: "$cancellationReason" },
                    },
                },
                { $sort: { "_id.period": 1 } },
            ]);
            // Categorize cancellations
            const periodData = {};
            orders.forEach((order) => {
                const period = order._id.period;
                if (!periodData[period]) {
                    periodData[period] = {
                        period,
                        notReceived: 0, // Khách không nhận hàng
                        damaged: 0, // Hàng lỗi/vỡ
                        shopCancelled: 0, // Shop hủy (hết hàng)
                        totalFailed: 0,
                        totalOrders: 0,
                    };
                }
                if (order._id.status === OrderModel_1.OrderStatus.CANCELLED) {
                    periodData[period].totalFailed += order.count;
                    const reason = (order.reasons[0] || "").toLowerCase();
                    const reasonStr = reason || "";
                    if (reasonStr.includes("không nhận") || reasonStr.includes("từ chối")) {
                        periodData[period].notReceived += order.count;
                    }
                    else if (reasonStr.includes("lỗi") || reasonStr.includes("vỡ") || reasonStr.includes("hư")) {
                        periodData[period].damaged += order.count;
                    }
                    else if (reasonStr.includes("hết hàng") || reasonStr.includes("không có")) {
                        periodData[period].shopCancelled += order.count;
                    }
                    else {
                        // Default to not received
                        periodData[period].notReceived += order.count;
                    }
                }
                periodData[period].totalOrders += order.count;
            });
            const chartData = Object.values(periodData).map((data) => ({
                ...data,
                complaintRate: data.totalOrders > 0 ? (data.totalFailed / data.totalOrders) * 100 : 0,
            }));
            return {
                ok: true,
                cancellationData: chartData,
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
