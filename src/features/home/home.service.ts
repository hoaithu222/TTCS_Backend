import ProductModel from "../../models/ProductModal";
import CategoryModel from "../../models/CategoryModel";
import ShopModel from "../../models/ShopModel";

export default class HomeService {
  // Get home banner (for now, return empty array - can be extended with banner model)
  static async getBanner() {
    // TODO: Implement banner model and logic
    // For now, return empty banners array
    return {
      ok: true as const,
      banners: [],
    };
  }

  // Get home categories
  static async getHomeCategories(params: { page?: number; limit?: number }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page! > 0 ? params.page! : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit! > 0
          ? Math.min(params.limit!, 50)
          : 10;
      const skip = (page - 1) * limit;

      const filter: any = { isActive: true };

      const [categories, total] = await Promise.all([
        CategoryModel.find(filter)
          .sort({ sortOrder: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CategoryModel.countDocuments(filter),
      ]);

      return {
        ok: true as const,
        categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
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

  // Get best seller products
  static async getBestSellerProducts(params: {
    page?: number;
    limit?: number;
  }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page! > 0 ? params.page! : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit! > 0
          ? Math.min(params.limit!, 50)
          : 10;
      const skip = (page - 1) * limit;

      const filter: any = { isActive: true };

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .populate("shopId", "name logo rating")
          .populate("categoryId", "name slug")
          .populate("subCategoryId", "name slug")
          .sort({ salesCount: -1, rating: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      // Calculate finalPrice for each product
      const productsWithFinalPrice = products.map((product: any) => ({
        ...product,
        finalPrice: product.discount
          ? product.price - product.discount
          : product.price,
      }));

      return {
        ok: true as const,
        products: productsWithFinalPrice,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
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

  // Get best shops
  static async getBestShops(params: { page?: number; limit?: number }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page! > 0 ? params.page! : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit! > 0
          ? Math.min(params.limit!, 50)
          : 10;
      const skip = (page - 1) * limit;

      const filter: any = { isActive: true, isVerified: true };

      const [shops, total] = await Promise.all([
        ShopModel.find(filter)
          .populate("ownerId", "name email")
          .sort({
            rating: -1,
            followersCount: -1,
            productsCount: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
        ShopModel.countDocuments(filter),
      ]);

      return {
        ok: true as const,
        shops,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
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

  // Get flash sale products
  static async getFlashSaleProducts(params: { page?: number; limit?: number }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page! > 0 ? params.page! : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit! > 0
          ? Math.min(params.limit!, 50)
          : 10;
      const skip = (page - 1) * limit;

      const filter: any = {
        isActive: true,
        discount: { $gt: 0 }, // Products with discount
      };

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .populate("shopId", "name logo rating")
          .populate("categoryId", "name slug")
          .populate("subCategoryId", "name slug")
          .sort({ discount: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      // Calculate finalPrice for each product
      const productsWithFinalPrice = products.map((product: any) => ({
        ...product,
        finalPrice: product.price - (product.discount || 0),
      }));

      return {
        ok: true as const,
        products: productsWithFinalPrice,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
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

  // Get search suggestions
  static async getSearchSuggestions(params: {
    q: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page =
        Number.isFinite(params.page) && params.page! > 0 ? params.page! : 1;
      const limit =
        Number.isFinite(params.limit) && params.limit! > 0
          ? Math.min(params.limit!, 20)
          : 10;
      const skip = (page - 1) * limit;

      if (!params.q || params.q.trim().length === 0) {
        return {
          ok: true as const,
          products: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        };
      }

      const filter: any = {
        isActive: true,
        $or: [
          { name: { $regex: params.q, $options: "i" } },
          { description: { $regex: params.q, $options: "i" } },
          { metaKeywords: { $regex: params.q, $options: "i" } },
        ],
      };

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .populate("shopId", "name logo rating")
          .populate("categoryId", "name slug")
          .populate("subCategoryId", "name slug")
          .sort({ salesCount: -1, rating: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      // Calculate finalPrice for each product
      const productsWithFinalPrice = products.map((product: any) => ({
        ...product,
        finalPrice: product.discount
          ? product.price - product.discount
          : product.price,
      }));

      return {
        ok: true as const,
        products: productsWithFinalPrice,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
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
