"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const CategoryModel_1 = __importDefault(require("../../models/CategoryModel"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
class HomeService {
    // Get home banner (for now, return empty array - can be extended with banner model)
    static async getBanner() {
        // TODO: Implement banner model and logic
        // For now, return empty banners array
        return {
            ok: true,
            banners: [],
        };
    }
    // Get home categories
    static async getHomeCategories(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            const [categories, total] = await Promise.all([
                CategoryModel_1.default.find(filter)
                    .sort({ sortOrder: 1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                CategoryModel_1.default.countDocuments(filter),
            ]);
            return {
                ok: true,
                categories,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
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
    // Get best seller products
    static async getBestSellerProducts(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { isActive: true };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate("shopId", "name logo rating")
                    .populate("categoryId", "name slug")
                    .populate("subCategoryId", "name slug")
                    .sort({ salesCount: -1, rating: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Calculate finalPrice for each product
            const productsWithFinalPrice = products.map((product) => ({
                ...product,
                finalPrice: product.discount
                    ? product.price - product.discount
                    : product.price,
            }));
            return {
                ok: true,
                products: productsWithFinalPrice,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
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
    // Get best shops
    static async getBestShops(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = { isActive: true, isVerified: true };
            const [shops, total] = await Promise.all([
                ShopModel_1.default.find(filter)
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
                ShopModel_1.default.countDocuments(filter),
            ]);
            return {
                ok: true,
                shops,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
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
    // Get flash sale products
    static async getFlashSaleProducts(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 50)
                : 10;
            const skip = (page - 1) * limit;
            const filter = {
                isActive: true,
                discount: { $gt: 0 }, // Products with discount
            };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate("shopId", "name logo rating")
                    .populate("categoryId", "name slug")
                    .populate("subCategoryId", "name slug")
                    .sort({ discount: -1, createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Calculate finalPrice for each product
            const productsWithFinalPrice = products.map((product) => ({
                ...product,
                finalPrice: product.price - (product.discount || 0),
            }));
            return {
                ok: true,
                products: productsWithFinalPrice,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
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
    // Get search suggestions
    static async getSearchSuggestions(params) {
        try {
            const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
            const limit = Number.isFinite(params.limit) && params.limit > 0
                ? Math.min(params.limit, 20)
                : 10;
            const skip = (page - 1) * limit;
            if (!params.q || params.q.trim().length === 0) {
                return {
                    ok: true,
                    products: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            }
            const filter = {
                isActive: true,
                $or: [
                    { name: { $regex: params.q, $options: "i" } },
                    { description: { $regex: params.q, $options: "i" } },
                    { metaKeywords: { $regex: params.q, $options: "i" } },
                ],
            };
            const [products, total] = await Promise.all([
                ProductModal_1.default.find(filter)
                    .populate("shopId", "name logo rating")
                    .populate("categoryId", "name slug")
                    .populate("subCategoryId", "name slug")
                    .sort({ salesCount: -1, rating: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                ProductModal_1.default.countDocuments(filter),
            ]);
            // Calculate finalPrice for each product
            const productsWithFinalPrice = products.map((product) => ({
                ...product,
                finalPrice: product.discount
                    ? product.price - product.discount
                    : product.price,
            }));
            return {
                ok: true,
                products: productsWithFinalPrice,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
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
exports.default = HomeService;
