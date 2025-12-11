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
const UserModel_1 = __importStar(require("../../models/UserModel"));
const ShopModel_1 = __importStar(require("../../models/ShopModel"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const ChatConversation_1 = __importDefault(require("../../models/ChatConversation"));
const ChatMessage_1 = __importDefault(require("../../models/ChatMessage"));
const shop_service_1 = __importDefault(require("../shop/shop.service"));
class UsersService {
    // lấy thông tin user
    static async getUser(id, includeShopStatus = false) {
        const user = await UserModel_1.default.findById(id);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        const userObj = user.toObject();
        if (includeShopStatus) {
            const shopStatusResult = await shop_service_1.default.getShopStatusByUserId(id);
            if (shopStatusResult.ok) {
                return {
                    ok: true,
                    user: {
                        ...userObj,
                        shopStatus: shopStatusResult.shopStatus,
                        shop: shopStatusResult.shop,
                    },
                };
            }
        }
        return { ok: true, user: userObj };
    }
    // cập nhật thông tin user
    static async updateUser(id, data) {
        // Lấy user hiện tại để so sánh status
        const currentUser = await UserModel_1.default.findById(id).select("status").lean();
        if (!currentUser) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        const user = await UserModel_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        // Xử lý shop và sản phẩm khi status thay đổi
        if (data.status && data.status !== currentUser.status) {
            try {
                const shop = await ShopModel_1.default.findOne({ userId: id }).select("_id status").lean();
                if (shop) {
                    if (data.status === UserModel_1.UserStatus.INACTIVE) {
                        // User bị khóa → khóa shop và ẩn sản phẩm
                        await ShopModel_1.default.findByIdAndUpdate(shop._id, {
                            status: ShopModel_1.ShopStatus.BLOCKED,
                            isActive: false,
                        });
                        const hiddenProducts = await ProductModal_1.default.updateMany({ shopId: shop._id }, { $set: { isActive: false } });
                        console.log(`[users] Blocked shop ${shop._id} and hidden ${hiddenProducts.modifiedCount} products for inactive user ${id}`);
                    }
                    else if (data.status === UserModel_1.UserStatus.ACTIVE && currentUser.status === UserModel_1.UserStatus.INACTIVE) {
                        // User được mở khóa (từ INACTIVE sang ACTIVE) → mở khóa shop và hiện lại sản phẩm
                        await ShopModel_1.default.findByIdAndUpdate(shop._id, {
                            status: ShopModel_1.ShopStatus.ACTIVE,
                            isActive: true,
                        });
                        const shownProducts = await ProductModal_1.default.updateMany({ shopId: shop._id }, { $set: { isActive: true } });
                        console.log(`[users] Unlocked shop ${shop._id} and shown ${shownProducts.modifiedCount} products for active user ${id}`);
                    }
                }
            }
            catch (error) {
                console.error("[users] Error updating shop and products status:", error);
                // Không fail nếu xử lý shop lỗi
            }
        }
        return { ok: true, user };
    }
    // xóa user
    static async deleteUser(id) {
        const user = await UserModel_1.default.findById(id);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        // Tìm shop của user
        const shop = await ShopModel_1.default.findOne({ userId: id }).select("_id").lean();
        if (shop) {
            try {
                // Xóa tất cả sản phẩm của shop
                const deletedProducts = await ProductModal_1.default.deleteMany({ shopId: shop._id });
                console.log(`[users] Deleted ${deletedProducts.deletedCount} products for shop ${shop._id} (user ${id})`);
                // Xóa shop
                await ShopModel_1.default.findByIdAndDelete(shop._id);
                console.log(`[users] Deleted shop ${shop._id} for user ${id}`);
            }
            catch (error) {
                console.error("[users] Error deleting shop and products:", error);
                // Tiếp tục xóa user dù có lỗi khi xóa shop
            }
        }
        // Xóa tất cả conversations và messages của user
        try {
            // Tìm tất cả conversations có user trong participants
            const conversations = await ChatConversation_1.default.find({
                "participants.userId": id,
            }).select("_id").lean();
            const conversationIds = conversations.map((c) => c._id);
            if (conversationIds.length > 0) {
                // Xóa tất cả messages của các conversations này
                const deletedMessages = await ChatMessage_1.default.deleteMany({
                    conversationId: { $in: conversationIds },
                });
                console.log(`[users] Deleted ${deletedMessages.deletedCount} messages for user ${id}`);
                // Xóa conversations
                const deletedConversations = await ChatConversation_1.default.deleteMany({
                    _id: { $in: conversationIds },
                });
                console.log(`[users] Deleted ${deletedConversations.deletedCount} conversations for user ${id}`);
            }
        }
        catch (error) {
            console.error("[users] Error deleting conversations and messages:", error);
            // Tiếp tục xóa user dù có lỗi khi xóa conversations
        }
        // Xóa user
        await UserModel_1.default.findByIdAndDelete(id);
        return { ok: true, user };
    }
    // lấy danh sách user với pagination và filter
    static async getUsers(page = 1, limit = 10, search, status, role, sortBy, sortOrder) {
        try {
            const safePage = Number.isFinite(page) && page > 0 ? page : 1;
            const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
            const skip = (safePage - 1) * safeLimit;
            // Build filter query
            const filterQuery = {};
            // Add search filter (case insensitive) - search by name or email
            if (search && search.trim()) {
                filterQuery.$or = [
                    { name: { $regex: search.trim(), $options: "i" } },
                    { email: { $regex: search.trim(), $options: "i" } },
                ];
            }
            // Add status filter
            if (status) {
                filterQuery.status = status;
            }
            // Add role filter
            if (role) {
                filterQuery.role = role;
            }
            // Build sort
            const sort = {};
            if (sortBy) {
                sort[sortBy] = sortOrder === "desc" ? -1 : 1;
            }
            else {
                sort.createdAt = -1; // Default sort by createdAt desc
            }
            const [users, total] = await Promise.all([
                UserModel_1.default.find(filterQuery)
                    .skip(skip)
                    .limit(safeLimit)
                    .sort(sort)
                    .select("-password -refreshToken -accessToken -forgotPasswordToken -verifyToken -twoFactorAuthSecret"),
                UserModel_1.default.countDocuments(filterQuery),
            ]);
            return {
                ok: true,
                users,
                total,
                page: safePage,
                limit: safeLimit,
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
    // cập nhật avatar của user
    static async updateAvatar(id, avatarUrl) {
        if (!avatarUrl || typeof avatarUrl !== "string") {
            return {
                ok: false,
                status: 400,
                message: "avatar là bắt buộc và phải là string",
            };
        }
        const user = await UserModel_1.default.findByIdAndUpdate(id, { avatar: avatarUrl }, { new: true });
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        return { ok: true, user };
    }
}
exports.default = UsersService;
