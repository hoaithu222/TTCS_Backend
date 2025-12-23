import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";

export default class AnalyticsService {
  static async revenueByShop(params: {
    shopId: string;
    from?: Date;
    to?: Date;
  }) {
    const match: any = { shopId: params.shopId, status: OrderStatus.DELIVERED };
    if (params.from || params.to) {
      match.createdAt = {};
      if (params.from) match.createdAt.$gte = params.from;
      if (params.to) match.createdAt.$lte = params.to;
    }
    const [result] = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$shopId",
          orders: { $sum: 1 },
          grossRevenue: { $sum: "$totalAmount" },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          shopId: "$_id",
          orders: 1,
          grossRevenue: 1,
          shippingFees: 1,
          discounts: 1,
          netRevenue: {
            $subtract: [
              { $add: ["$grossRevenue", "$shippingFees"] },
              "$discounts",
            ],
          },
        },
      },
    ]);
    return {
      ok: true as const,
      revenue: result || {
        shopId: params.shopId,
        orders: 0,
        grossRevenue: 0,
        shippingFees: 0,
        discounts: 0,
        netRevenue: 0,
      },
    };
  }

  static async revenueAllShops(params: { from?: Date; to?: Date }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.from || params.to) {
      match.createdAt = {};
      if (params.from) match.createdAt.$gte = params.from;
      if (params.to) match.createdAt.$lte = params.to;
    }
    const items = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$shopId",
          orders: { $sum: 1 },
          grossRevenue: { $sum: "$totalAmount" },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          shopId: "$_id",
          orders: 1,
          grossRevenue: 1,
          shippingFees: 1,
          discounts: 1,
          netRevenue: {
            $subtract: [
              { $add: ["$grossRevenue", "$shippingFees"] },
              "$discounts",
            ],
          },
        },
      },
      { $sort: { netRevenue: -1 } },
    ]);
    const totals = items.reduce(
      (acc, it) => {
        acc.orders += it.orders;
        acc.grossRevenue += it.grossRevenue;
        acc.shippingFees += it.shippingFees;
        acc.discounts += it.discounts;
        acc.netRevenue += it.netRevenue;
        return acc;
      },
      {
        orders: 0,
        grossRevenue: 0,
        shippingFees: 0,
        discounts: 0,
        netRevenue: 0,
      }
    );
    return { ok: true as const, items, totals };
  }

  static async revenueTimeSeries(params: {
    from?: Date;
    to?: Date;
    granularity?: "day" | "month";
    shopId?: string;
  }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.shopId) match.shopId = params.shopId as any;
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }
    const format = params.granularity === "month" ? "%Y-%m" : "%Y-%m-%d";
    const items = await OrderModel.aggregate([
      { $match: match },
      {
        $project: {
          bucket: { $dateToString: { format, date: "$createdAt" } },
          totalAmount: 1,
          shippingFee: 1,
          discountAmount: 1,
        },
      },
      {
        $group: {
          _id: "$bucket",
          orders: { $sum: 1 },
          grossRevenue: { $sum: "$totalAmount" },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          bucket: "$_id",
          orders: 1,
          grossRevenue: 1,
          shippingFees: 1,
          discounts: 1,
          netRevenue: {
            $subtract: [
              { $add: ["$grossRevenue", "$shippingFees"] },
              "$discounts",
            ],
          },
        },
      },
      { $sort: { bucket: 1 } },
    ]);
    return { ok: true as const, items };
  }

  static async topProducts(params: {
    from?: Date;
    to?: Date;
    limit?: number;
    shopId?: string;
    categoryId?: string;
    subCategoryId?: string;
    metric?: "revenue" | "quantity";
  }) {
    const matchOrders: any = { status: OrderStatus.DELIVERED };
    if (params.from || params.to) {
      matchOrders.createdAt = {} as any;
      if (params.from) (matchOrders.createdAt as any).$gte = params.from;
      if (params.to) (matchOrders.createdAt as any).$lte = params.to;
    }
    if (params.shopId) matchOrders.shopId = params.shopId as any;

    const pipeline: any[] = [
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      { $match: matchOrders },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ];

    if (params.categoryId) {
      pipeline.push({
        $match: { "product.categoryId": params.categoryId as any },
      });
    }
    if (params.subCategoryId) {
      pipeline.push({
        $match: { "product.subCategoryId": params.subCategoryId as any },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: "$productId",
          quantity: { $sum: "$quantity" },
          revenue: { $sum: "$totalPrice" },
          orders: { $addToSet: "$orderId" },
          product: { $first: "$product" },
        },
      },
      {
        $project: {
          productId: "$_id",
          _id: 0,
          quantity: 1,
          revenue: 1,
          ordersCount: { $size: "$orders" },
          product: {
            _id: "$product._id",
            name: "$product.name",
            price: "$product.price",
            discount: "$product.discount",
            categoryId: "$product.categoryId",
            subCategoryId: "$product.subCategoryId",
            shopId: "$product.shopId",
          },
        },
      },
      {
        $sort:
          params.metric === "quantity" ? { quantity: -1 } : { revenue: -1 },
      },
      { $limit: params.limit ?? 10 }
    );

    const items = await OrderItemModel.aggregate(pipeline);
    return { ok: true as const, items };
  }

  static async topShops(params: { from?: Date; to?: Date; limit?: number }) {
    console.log("🚀 [Analytics Service] topShops called with params:", params);
    
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.from || params.to) {
      match.createdAt = {};
      if (params.from) match.createdAt.$gte = params.from;
      if (params.to) match.createdAt.$lte = params.to;
    }
    
    console.log("🚀 [Analytics Service] Match condition:", JSON.stringify(match));
    
    // Use aggregation with $lookup to join with Shop collection
    const items = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$shopId",
          orders: { $sum: 1 },
          grossRevenue: { $sum: "$totalAmount" },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          shopId: "$_id", // Keep as ObjectId
          orders: 1,
          grossRevenue: 1,
          shippingFees: 1,
          discounts: 1,
          netRevenue: {
            $subtract: [
              { $add: ["$grossRevenue", "$shippingFees"] },
              "$discounts",
            ],
          },
        },
      },
      // Lookup shop information - shopId is already ObjectId from $group
      {
        $lookup: {
          from: "shops",
          localField: "shopId",
          foreignField: "_id",
          as: "shopInfo",
        },
      },
      {
        $project: {
          shopId: 1,
          orders: 1,
          grossRevenue: 1,
          shippingFees: 1,
          discounts: 1,
          netRevenue: 1,
          shopName: {
            $ifNull: [
              { $arrayElemAt: ["$shopInfo.name", 0] },
              "Unknown Shop"
            ]
          },
          shopLogo: { $arrayElemAt: ["$shopInfo.logo", 0] },
          // Calculate AOV
          averageOrderValue: {
            $cond: {
              if: { $gt: ["$orders", 0] },
              then: { $round: [{ $divide: ["$netRevenue", "$orders"] }] },
              else: 0,
            },
          },
        },
      },
      { $sort: { netRevenue: -1 } },
      { $limit: params.limit ?? 10 },
    ]);
    
    // Debug: Log để kiểm tra dữ liệu từ aggregation
    console.log("🔍 [Analytics Service] Top shops aggregation result:", JSON.stringify(items, null, 2));
    console.log("🔍 [Analytics Service] Number of shops:", items.length);
    items.forEach((item, index) => {
      console.log(`🔍 [Analytics Service] Shop ${index + 1}:`, {
        shopId: item.shopId,
        shopName: item.shopName,
        shopInfo: item.shopInfo,
        hasShopInfo: !!item.shopInfo,
      });
    });
    
    return { ok: true as const, items };
  }

  static async orderStatusDistribution(params: { from?: Date; to?: Date }) {
    const match: any = {};
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }
    const items = await OrderModel.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);
    return { ok: true as const, items };
  }

  static async averageOrderValue(params: {
    from?: Date;
    to?: Date;
    shopId?: string;
  }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.shopId) match.shopId = params.shopId as any;
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }
    const [result] = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avg: { $avg: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $project: { _id: 0, averageOrderValue: "$avg", orders: 1 } },
    ]);
    return {
      ok: true as const,
      ...(result || { averageOrderValue: 0, orders: 0 }),
    };
  }

  // New method for revenue vs profit data (Area Chart)
  static async revenueVsProfitTimeSeries(params: {
    from?: Date;
    to?: Date;
    granularity?: "day" | "month";
    shopId?: string;
  }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.shopId) match.shopId = params.shopId as any;
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }
    const format = params.granularity === "month" ? "%Y-%m" : "%Y-%m-%d";
    const items = await OrderModel.aggregate([
      { $match: match },
      {
        $project: {
          bucket: { $dateToString: { format, date: "$createdAt" } },
          totalAmount: 1,
          shippingFee: 1,
          discountAmount: 1,
        },
      },
      {
        $group: {
          _id: "$bucket",
          revenue: { $sum: "$totalAmount" },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          revenue: 1,
          // Calculate profit as revenue + shipping - discounts (assuming 30% profit margin for demo)
          profit: {
            $multiply: [
              { $subtract: [{ $add: ["$revenue", "$shippingFees"] }, "$discounts"] },
              0.3 // 30% profit margin
            ]
          },
        },
      },
      { $sort: { date: 1 } },
    ]);
    return { ok: true as const, items };
  }

  // New method for wallet transactions (Stacked Bar Chart)
  static async walletTransactionsTimeSeries(params: {
    from?: Date;
    to?: Date;
    shopId?: string;
  }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.shopId) match.shopId = params.shopId as any;
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }

    const items = await OrderModel.aggregate([
      { $match: match },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalAmount: 1,
          shippingFee: 1,
          discountAmount: 1,
        },
      },
      {
        $group: {
          _id: "$month",
          revenue: { $sum: "$totalAmount" },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          // Income: revenue + shipping
          income: { $add: ["$revenue", "$shippingFees"] },
          // Expense: discounts + platform fees (assuming 5% platform fee)
          expense: {
            $add: [
              "$discounts",
              { $multiply: [{ $add: ["$revenue", "$shippingFees"] }, 0.05] }
            ]
          },
        },
      },
      { $sort: { month: 1 } },
    ]);
    return { ok: true as const, items };
  }

  // Enhanced order status distribution with colors
  static async orderStatusDistributionWithColors(params: {
    from?: Date;
    to?: Date;
    shopId?: string;
  }) {
    const match: any = {};
    if (params.shopId) match.shopId = params.shopId as any;
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }

    const items = await OrderModel.aggregate([
      { $match: match },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
    ]);

    // Add colors for donut chart
    const statusColors: Record<string, string> = {
      [OrderStatus.PENDING]: "#f59e0b", // Vàng (Amber-500) - Chờ xác nhận
      [OrderStatus.PROCESSING]: "#3b82f6", // Xanh dương (Blue-500) - Đang xử lý
      [OrderStatus.SHIPPED]: "#10b981", // Xanh lá (Emerald-500) - Đang giao
      [OrderStatus.DELIVERED]: "#22c55e", // Xanh lá đậm (Green-500) - Hoàn thành
      [OrderStatus.CANCELLED]: "#ef4444", // Đỏ (Red-500) - Đã hủy
    };

    const itemsWithColors = items.map(item => ({
      ...item,
      fill: statusColors[item.status] || "#6b7280", // Màu xám mặc định
    }));

    return { ok: true as const, items: itemsWithColors };
  }
}
