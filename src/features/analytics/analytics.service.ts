import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";
import ShopModel from "../../models/ShopModel";
import ReviewModel from "../../models/ReviewModel";
import PaymentModel, { PaymentMethod } from "../../models/PaymentModel";

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

  // 1. Shop Strength & Classification (Quadrant RRG)
  static async shopStrengthQuadrant(params: { from?: Date; to?: Date }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }

    // Get all shops with their revenue, orders, and ratings
    const shops = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$shopId",
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          shippingFees: { $sum: "$shippingFee" },
          discounts: { $sum: "$discountAmount" },
        },
      },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shopInfo",
        },
      },
      { $unwind: { path: "$shopInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          shopId: "$_id",
          shopName: { $ifNull: ["$shopInfo.name", "Unknown Shop"] },
          shopLogo: "$shopInfo.logo",
          gmv: {
            $subtract: [
              { $add: ["$totalRevenue", "$shippingFees"] },
              "$discounts",
            ],
          },
          totalOrders: 1,
          rating: { $ifNull: ["$shopInfo.rating", 0] },
        },
      },
    ]);

    // Calculate conversion rate for each shop
    // Conversion rate = (delivered orders / total orders) * 100
    // For simplicity, we'll use delivered orders / (delivered + cancelled) as conversion
    const allOrdersMatch: any = {};
    if (params.from || params.to) {
      allOrdersMatch.createdAt = {} as any;
      if (params.from) (allOrdersMatch.createdAt as any).$gte = params.from;
      if (params.to) (allOrdersMatch.createdAt as any).$lte = params.to;
    }

    const orderStats = await OrderModel.aggregate([
      { $match: allOrdersMatch },
      {
        $group: {
          _id: "$shopId",
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, 1, 0] },
          },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const conversionMap = new Map();
    orderStats.forEach((stat) => {
      const conversionRate =
        stat.totalOrders > 0
          ? (stat.deliveredOrders / stat.totalOrders) * 100
          : 0;
      conversionMap.set(stat._id.toString(), conversionRate);
    });

    // Add conversion rate and quadrant classification
    const items = shops.map((shop) => {
      const conversionRate = conversionMap.get(shop.shopId.toString()) || 0;
      const gmv = shop.gmv || 0;
      const rating = shop.rating || 0;

      // Calculate quadrant based on GMV and Rating
      // Quadrant 1 (Xanh lá - Tăng mạnh): High GMV, High Rating
      // Quadrant 2 (Vàng - Suy yếu): High GMV, Low Rating
      // Quadrant 3 (Đỏ - Giảm mạnh): Low GMV, Low Rating
      // Quadrant 4 (Xanh dương - Hồi phục): Low GMV, High Rating
      const avgGmv = shops.reduce((sum, s) => sum + (s.gmv || 0), 0) / shops.length || 1;
      const avgRating = shops.reduce((sum, s) => sum + (s.rating || 0), 0) / shops.length || 1;

      let quadrant = 3; // Default: Giảm mạnh
      let quadrantName = "Giảm mạnh";
      let quadrantColor = "#ef4444"; // Red

      if (gmv >= avgGmv && rating >= avgRating) {
        quadrant = 1;
        quadrantName = "Tăng mạnh";
        quadrantColor = "#22c55e"; // Green
      } else if (gmv >= avgGmv && rating < avgRating) {
        quadrant = 2;
        quadrantName = "Suy yếu";
        quadrantColor = "#f59e0b"; // Yellow/Amber
      } else if (gmv < avgGmv && rating >= avgRating) {
        quadrant = 4;
        quadrantName = "Hồi phục";
        quadrantColor = "#3b82f6"; // Blue
      }

      return {
        shopId: shop.shopId.toString(),
        shopName: shop.shopName,
        shopLogo: shop.shopLogo,
        gmv,
        rating,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalOrders: shop.totalOrders,
        quadrant,
        quadrantName,
        quadrantColor,
      };
    });

    return { ok: true as const, items };
  }

  // 2. Cash Flow & Platform Growth with MA30 and Net Profit
  static async cashFlowGrowth(params: {
    from?: Date;
    to?: Date;
    granularity?: "day" | "month";
  }) {
    const match: any = { status: OrderStatus.DELIVERED };
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
          gmv: {
            $sum: { $add: ["$totalAmount", "$shippingFee"] },
          },
          discounts: { $sum: "$discountAmount" },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          gmv: 1,
          discounts: 1,
          orders: 1,
          // Net Profit = GMV - Discounts - Platform Fee (assume 5% platform fee)
          netProfit: {
            $subtract: [
              {
                $subtract: [
                  "$gmv",
                  "$discounts",
                ],
              },
              { $multiply: ["$gmv", 0.05] }, // 5% platform fee
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Calculate MA30 (Moving Average 30 days)
    // For simplicity, we'll calculate MA30 as average of last 30 data points
    const itemsWithMA30 = items.map((item, index) => {
      const startIndex = Math.max(0, index - 29);
      const window = items.slice(startIndex, index + 1);
      const ma30 =
        window.length > 0
          ? window.reduce((sum, it) => sum + it.gmv, 0) / window.length
          : item.gmv;

      return {
        ...item,
        ma30: Math.round(ma30),
      };
    });

    return { ok: true as const, items: itemsWithMA30 };
  }

  // 3. Payment Method & Device Type Distribution (Nested Donut)
  static async paymentAndDeviceDistribution(params: { from?: Date; to?: Date }) {
    const match: any = { status: OrderStatus.DELIVERED };
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }

    // Get payment method distribution
    const paymentDistribution = await OrderModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "orderId",
          as: "payment",
        },
      },
      { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            $ifNull: ["$payment.method", "$paymentMethod"],
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          method: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", PaymentMethod.COD] }, then: "COD" },
                { case: { $eq: ["$_id", PaymentMethod.BANK_TRANSFER] }, then: "VNPay" },
                { case: { $eq: ["$_id", PaymentMethod.WALLET] }, then: "Ví điện tử" },
              ],
              default: "Khác",
            },
          },
          count: 1,
          totalAmount: 1,
        },
      },
    ]);

    // For device type, we'll simulate based on order patterns
    // In a real system, you'd track user-agent or device info
    // For now, we'll create a mock distribution
    const totalOrders = paymentDistribution.reduce((sum, p) => sum + p.count, 0);
    const deviceDistribution = [
      {
        device: "Mobile App",
        count: Math.round(totalOrders * 0.5),
        percentage: 50,
      },
      {
        device: "Web PC",
        count: Math.round(totalOrders * 0.3),
        percentage: 30,
      },
      {
        device: "Mobile Web",
        count: Math.round(totalOrders * 0.2),
        percentage: 20,
      },
    ];

    // Calculate percentages for payment methods
    const paymentWithPercent = paymentDistribution.map((p) => ({
      ...p,
      percentage: totalOrders > 0 ? Math.round((p.count / totalOrders) * 100) : 0,
    }));

    return {
      ok: true as const,
      paymentMethods: paymentWithPercent,
      deviceTypes: deviceDistribution,
    };
  }

  // 4. API Request Tracking (System Load)
  // Note: This is a simplified version. In production, you'd use a proper logging system
  static async systemLoadStats(params: {
    from?: Date;
    to?: Date;
    granularity?: "hour" | "day";
  }) {
    // For now, we'll generate mock data based on order patterns
    // In production, you'd query from a request log collection
    const match: any = {};
    if (params.from || params.to) {
      match.createdAt = {} as any;
      if (params.from) (match.createdAt as any).$gte = params.from;
      if (params.to) (match.createdAt as any).$lte = params.to;
    }

    const format = params.granularity === "hour" ? "%Y-%m-%d %H:00" : "%Y-%m-%d";
    const items = await OrderModel.aggregate([
      { $match: match },
      {
        $project: {
          bucket: { $dateToString: { format, date: "$createdAt" } },
        },
      },
      {
        $group: {
          _id: "$bucket",
          requestCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          timestamp: "$_id",
          baseRequestCount: "$requestCount",
        },
      },
      { $sort: { timestamp: 1 } },
    ]);

    // Calculate comparison data (same hour yesterday or weekly average)
    // Simulate API requests: assume 10-50 requests per order
    const itemsWithComparison = items.map((item, index) => {
      // Generate variation based on timestamp hash
      const timestampHash = item.timestamp
        ? item.timestamp.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
        : index;
      const multiplier = 10 + (timestampHash % 40);
      const requestCount = Math.round(item.baseRequestCount * multiplier);

      // For comparison, use previous period data
      const comparisonIndex = index - (params.granularity === "hour" ? 24 : 7);
      const comparisonValue =
        comparisonIndex >= 0 && items[comparisonIndex]
          ? Math.round(items[comparisonIndex].baseRequestCount * multiplier)
          : Math.round(requestCount * 0.8); // Default to 80% if no comparison data

      return {
        timestamp: item.timestamp,
        requestCount,
        comparisonValue,
      };
    });

    return { ok: true as const, items: itemsWithComparison };
  }
}
