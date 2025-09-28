import OrderModel, { OrderStatus } from "../../models/OrderModel";

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
}
