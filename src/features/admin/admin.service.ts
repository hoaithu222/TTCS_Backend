import UserModel from "../../models/UserModel";
import ProductModel from "../../models/ProductModal";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";

export default class AdminService {
  // Get user statistics
  static async getUserStatistics() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Total users
      const totalUsers = await UserModel.countDocuments({});

      // Active users (status = 'active')
      const activeUsers = await UserModel.countDocuments({ status: "active" });

      // New users this month
      const newUsersThisMonth = await UserModel.countDocuments({
        createdAt: { $gte: startOfMonth },
      });

      // New users last month (for growth calculation)
      const newUsersLastMonth = await UserModel.countDocuments({
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      });

      // Users by role
      const usersByRole = await UserModel.aggregate([
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
      const usersByStatus = await UserModel.aggregate([
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
      const monthlyGrowth =
        newUsersLastMonth > 0
          ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
          : newUsersThisMonth > 0
          ? 100
          : 0;

      // Convert arrays to objects
      const usersByRoleObj = usersByRole.reduce(
        (acc, item) => {
          acc[item.role || "unknown"] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      const usersByStatusObj = usersByStatus.reduce(
        (acc, item) => {
          acc[item.status || "unknown"] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        ok: true as const,
        statistics: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          usersByRole: usersByRoleObj,
          usersByStatus: usersByStatusObj,
          monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
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

  // Get product statistics
  static async getProductStatistics() {
    try {
      // Total products
      const totalProducts = await ProductModel.countDocuments({});

      // Active products
      const activeProducts = await ProductModel.countDocuments({ isActive: true });

      // Products by category
      const productsByCategory = await ProductModel.aggregate([
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
      const productsByShop = await ProductModel.aggregate([
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
      const lowStockProducts = await ProductModel.countDocuments({
        $or: [
          { stock: { $exists: true, $lte: 10, $gt: 0 } },
          { quantity: { $exists: true, $lte: 10, $gt: 0 } },
        ],
      });

      // Out of stock products
      const outOfStockProducts = await ProductModel.countDocuments({
        $or: [
          { stock: { $exists: true, $lte: 0 } },
          { quantity: { $exists: true, $lte: 0 } },
          { stock: { $exists: false }, quantity: { $exists: false } },
        ],
      });

      // Top selling products
      const topSellingProducts = await OrderItemModel.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        {
          $unwind: "$order",
        },
        {
          $match: {
            "order.status": OrderStatus.DELIVERED,
          },
        },
        {
          $group: {
            _id: "$productId",
            salesCount: { $sum: "$quantity" },
          },
        },
        {
          $sort: { salesCount: -1 },
        },
        {
          $limit: 10,
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $unwind: "$product",
        },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            productName: "$product.name",
            salesCount: 1,
          },
        },
      ]);

      // Convert arrays to objects
      const productsByCategoryObj = productsByCategory.reduce(
        (acc, item) => {
          acc[item.categoryId?.toString() || "unknown"] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      const productsByShopObj = productsByShop.reduce(
        (acc, item) => {
          acc[item.shopId?.toString() || "unknown"] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        ok: true as const,
        statistics: {
          totalProducts,
          activeProducts,
          productsByCategory: productsByCategoryObj,
          productsByShop: productsByShopObj,
          lowStockProducts,
          outOfStockProducts,
          topSellingProducts: topSellingProducts.map((item) => ({
            productId: item.productId?.toString() || "",
            productName: item.productName || "Unknown",
            salesCount: item.salesCount || 0,
          })),
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
}

