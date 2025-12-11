"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const OrderModel_1 = require("../../models/OrderModel");
const OrderItem_1 = __importDefault(require("../../models/OrderItem"));
class AdminService {
    // Get user statistics
    static async getUserStatistics() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            // Total users
            const totalUsers = await UserModel_1.default.countDocuments({});
            // Active users (status = 'active')
            const activeUsers = await UserModel_1.default.countDocuments({ status: "active" });
            // New users this month
            const newUsersThisMonth = await UserModel_1.default.countDocuments({
                createdAt: { $gte: startOfMonth },
            });
            // New users last month (for growth calculation)
            const newUsersLastMonth = await UserModel_1.default.countDocuments({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lte: endOfLastMonth,
                },
            });
            // Users by role
            const usersByRole = await UserModel_1.default.aggregate([
                {
                    $group: {
                        _id: "$role",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        role: "$_id",
                        count: 1,
                    },
                },
            ]);
            // Users by status
            const usersByStatus = await UserModel_1.default.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        status: "$_id",
                        count: 1,
                    },
                },
            ]);
            // Calculate monthly growth
            const monthlyGrowth = newUsersLastMonth > 0
                ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
                : newUsersThisMonth > 0
                    ? 100
                    : 0;
            const activeRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
            const inactiveUsers = Math.max(totalUsers - activeUsers, 0);
            // Convert arrays to objects
            const usersByRoleObj = usersByRole.reduce((acc, item) => {
                acc[item.role || "unknown"] = item.count;
                return acc;
            }, {});
            const usersByStatusObj = usersByStatus.reduce((acc, item) => {
                acc[item.status || "unknown"] = item.count;
                return acc;
            }, {});
            return {
                ok: true,
                statistics: {
                    totalUsers,
                    activeUsers,
                    newUsersThisMonth,
                    usersByRole: usersByRoleObj,
                    usersByStatus: usersByStatusObj,
                    monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
                    activeRate: Math.round(activeRate * 100) / 100,
                    inactiveUsers,
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
    // Get product statistics
    static async getProductStatistics() {
        try {
            // Total products
            const totalProducts = await ProductModal_1.default.countDocuments({});
            // Active products
            const activeProducts = await ProductModal_1.default.countDocuments({ isActive: true });
            // Products by category
            const productsByCategory = await ProductModal_1.default.aggregate([
                {
                    $group: {
                        _id: "$categoryId",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        categoryId: "$_id",
                        count: 1,
                    },
                },
            ]);
            // Products by shop
            const productsByShop = await ProductModal_1.default.aggregate([
                {
                    $group: {
                        _id: "$shopId",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        shopId: "$_id",
                        count: 1,
                    },
                },
            ]);
            // Low stock products (assuming stock field exists, if not, use quantity)
            const lowStockProducts = await ProductModal_1.default.countDocuments({
                $or: [
                    { stock: { $exists: true, $lte: 10, $gt: 0 } },
                    { quantity: { $exists: true, $lte: 10, $gt: 0 } },
                ],
            });
            // Out of stock products
            const outOfStockProducts = await ProductModal_1.default.countDocuments({
                $or: [
                    { stock: { $exists: true, $lte: 0 } },
                    { quantity: { $exists: true, $lte: 0 } },
                    { stock: { $exists: false }, quantity: { $exists: false } },
                ],
            });
            // Top selling products with richer data
            const topSellingProducts = await OrderItem_1.default.aggregate([
                {
                    $lookup: {
                        from: "orders",
                        localField: "orderId",
                        foreignField: "_id",
                        as: "order",
                    },
                },
                { $unwind: "$order" },
                {
                    $match: {
                        "order.status": OrderModel_1.OrderStatus.DELIVERED,
                    },
                },
                {
                    $group: {
                        _id: "$productId",
                        salesCount: { $sum: "$quantity" },
                        revenue: { $sum: { $multiply: ["$quantity", "$price"] } },
                    },
                },
                { $sort: { salesCount: -1 } },
                { $limit: 12 },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product",
                    },
                },
                { $unwind: "$product" },
                {
                    $lookup: {
                        from: "images",
                        localField: "product.images",
                        foreignField: "_id",
                        as: "imageDocs",
                    },
                },
                {
                    $addFields: {
                        primaryImage: {
                            $cond: [
                                { $gt: [{ $size: "$imageDocs" }, 0] },
                                { $arrayElemAt: ["$imageDocs.url", 0] },
                                null,
                            ],
                        },
                    },
                },
                {
                    $lookup: {
                        from: "categories",
                        localField: "product.categoryId",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 0,
                        productId: "$_id",
                        productName: "$product.name",
                        salesCount: 1,
                        revenue: 1,
                        price: {
                            $ifNull: [
                                "$product.salePrice",
                                {
                                    $ifNull: [
                                        "$product.price",
                                        { $ifNull: ["$product.finalPrice", "$product.amount"] },
                                    ],
                                },
                            ],
                        },
                        stockLeft: {
                            $ifNull: ["$product.stock", "$product.quantity"],
                        },
                        rating: {
                            $ifNull: ["$product.averageRating", "$product.rating"],
                        },
                        imageUrl: {
                            $ifNull: [
                                "$primaryImage",
                                {
                                    $cond: [
                                        { $gt: [{ $size: { $ifNull: ["$product.images", []] } }, 0] },
                                        { $arrayElemAt: ["$product.images", 0] },
                                        "$product.thumbnail",
                                    ],
                                },
                            ],
                        },
                        category: {
                            $ifNull: ["$category.name", "$product.categoryName"],
                        },
                    },
                },
            ]);
            // Convert arrays to objects
            const productsByCategoryObj = productsByCategory.reduce((acc, item) => {
                acc[item.categoryId?.toString() || "unknown"] = item.count;
                return acc;
            }, {});
            const productsByShopObj = productsByShop.reduce((acc, item) => {
                acc[item.shopId?.toString() || "unknown"] = item.count;
                return acc;
            }, {});
            return {
                ok: true,
                statistics: {
                    totalProducts,
                    activeProducts,
                    productsByCategory: productsByCategoryObj,
                    productsByShop: productsByShopObj,
                    lowStockProducts,
                    outOfStockProducts,
                    topSellingProducts: topSellingProducts.map((item, index) => ({
                        productId: item.productId?.toString() || `p-${index}`,
                        productName: item.productName || "Unknown",
                        salesCount: item.salesCount || 0,
                        revenue: item.revenue ||
                            (item.price && item.salesCount
                                ? item.price * item.salesCount
                                : undefined),
                        price: item.price || undefined,
                        stockLeft: item.stockLeft ?? undefined,
                        rating: item.rating ?? undefined,
                        imageUrl: item.imageUrl ||
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
                        category: item.category || "Khác",
                    })),
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
}
exports.default = AdminService;
