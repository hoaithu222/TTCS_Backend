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
const ShopModel_1 = __importStar(require("../../models/ShopModel"));
const ShopFollower_1 = __importDefault(require("../../models/ShopFollower"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const ChatConversation_1 = __importDefault(require("../../models/ChatConversation"));
const ChatMessage_1 = __importDefault(require("../../models/ChatMessage"));
const UserModel_1 = __importStar(require("../../models/UserModel"));
const notification_service_1 = require("../../shared/services/notification.service");
class ShopService {
    static async get(id) {
        // Check if id is a valid ObjectId (24 hex characters)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        let item;
        if (isObjectId) {
            // Try to find by _id first
            item = await ShopModel_1.default.findById(id);
        }
        // If not found by _id or not an ObjectId, try to find by slug
        if (!item) {
            item = await ShopModel_1.default.findOne({ slug: id });
        }
        if (!item)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        // Count actual products for this shop
        const productCount = await ProductModal_1.default.countDocuments({ shopId: item._id, isActive: true });
        // Update productCount in shop if different
        if (item.productCount !== productCount) {
            item.productCount = productCount;
            await item.save();
        }
        return { ok: true, item };
    }
    static async create(data) {
        try {
            const item = await ShopModel_1.default.create(data);
            if (item?.userId) {
                notification_service_1.notificationService
                    .notifyAdminsShopRegistrationPending({
                    shopId: item._id.toString(),
                    shopName: item.name,
                    ownerId: item.userId.toString(),
                })
                    .catch((error) => console.error("[shop] notify admin pending failed:", error));
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async update(id, data) {
        // Lấy shop hiện tại để so sánh status
        const currentShop = await ShopModel_1.default.findById(id).select("status").lean();
        if (!currentShop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        const item = await ShopModel_1.default.findByIdAndUpdate(id, data, {
            new: true,
        });
        if (!item)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        // Xử lý sản phẩm khi status thay đổi
        if (data.status && data.status !== currentShop.status) {
            try {
                if (data.status === ShopModel_1.ShopStatus.BLOCKED) {
                    // Shop bị khóa → ẩn tất cả sản phẩm
                    const hiddenProducts = await ProductModal_1.default.updateMany({ shopId: id }, { $set: { isActive: false } });
                    console.log(`[shop] Hidden ${hiddenProducts.modifiedCount} products for blocked shop ${id}`);
                }
                else if (data.status === ShopModel_1.ShopStatus.ACTIVE && currentShop.status === ShopModel_1.ShopStatus.BLOCKED) {
                    // Shop được mở khóa (từ BLOCKED sang ACTIVE) → hiện lại sản phẩm
                    const shownProducts = await ProductModal_1.default.updateMany({ shopId: id }, { $set: { isActive: true } });
                    console.log(`[shop] Shown ${shownProducts.modifiedCount} products for unlocked shop ${id}`);
                }
            }
            catch (error) {
                console.error("[shop] Error updating products status:", error);
                // Không fail nếu xử lý sản phẩm lỗi
            }
        }
        return { ok: true, item };
    }
    static async delete(id) {
        const item = await ShopModel_1.default.findByIdAndDelete(id);
        if (!item)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        // Xóa tất cả sản phẩm của shop khi shop bị xóa
        try {
            const deletedProducts = await ProductModal_1.default.deleteMany({ shopId: id });
            console.log(`[shop] Deleted ${deletedProducts.deletedCount} products for shop ${id}`);
        }
        catch (error) {
            console.error("[shop] Error deleting products:", error);
            // Không fail nếu xóa sản phẩm lỗi, vì shop đã bị xóa
        }
        // Xóa tất cả conversations và messages liên quan đến shop
        try {
            // Tìm conversations có shop trong metadata.targetId hoặc channel = "shop" với shopId
            const conversations = await ChatConversation_1.default.find({
                $or: [
                    { "metadata.targetId": id },
                    { "metadata.shopId": id },
                    { channel: "shop", "metadata.shopId": id },
                ],
            }).select("_id").lean();
            const conversationIds = conversations.map((c) => c._id);
            if (conversationIds.length > 0) {
                // Xóa tất cả messages của các conversations này
                const deletedMessages = await ChatMessage_1.default.deleteMany({
                    conversationId: { $in: conversationIds },
                });
                console.log(`[shop] Deleted ${deletedMessages.deletedCount} messages for shop ${id}`);
                // Xóa conversations
                const deletedConversations = await ChatConversation_1.default.deleteMany({
                    _id: { $in: conversationIds },
                });
                console.log(`[shop] Deleted ${deletedConversations.deletedCount} conversations for shop ${id}`);
            }
        }
        catch (error) {
            console.error("[shop] Error deleting conversations and messages:", error);
            // Không fail nếu xóa conversations lỗi, vì shop đã bị xóa
        }
        return { ok: true, item };
    }
    static async list(query) {
        try {
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 100)
                : 10;
            const skip = (page - 1) * limit;
            const filter = {};
            if (query.userId)
                filter.userId = query.userId;
            if (query.status)
                filter.status = query.status;
            if (typeof query.isActive === "boolean")
                filter.isActive = query.isActive;
            if (typeof query.isVerified === "boolean")
                filter.isVerified = query.isVerified;
            if (query.search)
                filter.name = { $regex: query.search, $options: "i" };
            const [items, total] = await Promise.all([
                ShopModel_1.default.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
                ShopModel_1.default.countDocuments(filter),
            ]);
            return { ok: true, items, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    static async follow(shopId, userId) {
        const shop = await ShopModel_1.default.findById(shopId).select("_id followCount userId name");
        if (!shop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        if (shop.userId && shop.userId.toString() === userId) {
            return {
                ok: false,
                status: 400,
                message: "Bạn không thể theo dõi cửa hàng của chính mình",
            };
        }
        try {
            await ShopFollower_1.default.create({ shopId, userId });
        }
        catch (error) {
            // Duplicate follows should be idempotent
            if (error.code !== 11000) {
                return {
                    ok: false,
                    status: 400,
                    message: error.message,
                };
            }
        }
        const followersCount = await ShopFollower_1.default.countDocuments({ shopId });
        await ShopModel_1.default.findByIdAndUpdate(shopId, { followCount: followersCount });
        if (shop.userId) {
            const follower = await UserModel_1.default.findById(userId)
                .select("name fullName email")
                .lean();
            notification_service_1.notificationService
                .notifyShopOwnerNewFollower({
                ownerId: shop.userId.toString(),
                shopId: shop._id.toString(),
                shopName: shop.name,
                followerName: follower?.fullName || follower?.name || follower?.email,
            })
                .catch((error) => console.error("[shop] notify new follower failed:", error));
        }
        return { ok: true, isFollowing: true, followersCount };
    }
    static async unfollow(shopId, userId) {
        const shop = await ShopModel_1.default.findById(shopId).select("_id");
        if (!shop)
            return { ok: false, status: 404, message: "Shop không tồn tại" };
        await ShopFollower_1.default.findOneAndDelete({ shopId, userId });
        const followersCount = await ShopFollower_1.default.countDocuments({ shopId });
        await ShopModel_1.default.findByIdAndUpdate(shopId, { followCount: followersCount });
        return { ok: true, isFollowing: false, followersCount };
    }
    static async isFollowing(shopId, userId) {
        const [doc, followersCount] = await Promise.all([
            ShopFollower_1.default.findOne({ shopId, userId }).select("_id"),
            ShopFollower_1.default.countDocuments({ shopId }),
        ]);
        return { ok: true, isFollowing: !!doc, followersCount };
    }
    static async followersCount(shopId) {
        const count = await ShopFollower_1.default.countDocuments({ shopId });
        await ShopModel_1.default.findByIdAndUpdate(shopId, { followCount: count });
        return { ok: true, count };
    }
    // Lấy trạng thái shop của user
    static async getShopStatusByUserId(userId) {
        try {
            const shop = await ShopModel_1.default.findOne({ userId })
                .select("status name slug isActive isVerified")
                .lean();
            if (!shop) {
                return {
                    ok: true,
                    shopStatus: "not_registered",
                    shop: null,
                };
            }
            // Map backend status to frontend status
            // Backend chỉ có: pending, active, blocked
            // Frontend cần: pending_review, approved, rejected, active, blocked, suspended
            // Logic mapping:
            // - pending -> pending_review
            // - active + isActive + isVerified -> active (đã approve và đang hoạt động)
            // - active + !isActive -> approved (đã approve nhưng chưa active)
            // - blocked -> blocked (có thể là rejected hoặc suspended, nhưng không phân biệt được từ status)
            let shopStatus;
            switch (shop.status) {
                case "pending":
                    shopStatus = "pending_review";
                    break;
                case "active":
                    // Nếu đã active và verified thì là active, nếu chưa thì là approved
                    if (shop.isActive && shop.isVerified) {
                        shopStatus = "active";
                    }
                    else {
                        shopStatus = "approved";
                    }
                    break;
                case "blocked":
                    shopStatus = "blocked";
                    break;
                default:
                    // Fallback về pending_review cho các case không xác định
                    shopStatus = "pending_review";
            }
            return {
                ok: true,
                shopStatus,
                shop: {
                    id: shop._id.toString(),
                    name: shop.name,
                    slug: shop.slug,
                    status: shop.status,
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
    // Approve shop (admin only)
    static async approveShop(id) {
        try {
            const now = new Date();
            const item = await ShopModel_1.default.findByIdAndUpdate(id, {
                status: ShopModel_1.ShopStatus.ACTIVE,
                isActive: true,
                activatedAt: now,
                isVerified: true,
                verifiedAt: now,
            }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            if (item.userId) {
                await UserModel_1.default.findByIdAndUpdate(item.userId, {
                    role: "shop",
                    status: UserModel_1.UserStatus.ACTIVE,
                });
            }
            if (item.userId) {
                notification_service_1.notificationService
                    .notifyShopOwnerApproval({
                    ownerId: item.userId.toString(),
                    shopId: item._id.toString(),
                    shopName: item.name,
                    status: "approved",
                })
                    .catch((error) => console.error("[shop] notify approve failed:", error));
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    // Reject shop (admin only)
    static async rejectShop(id) {
        try {
            const item = await ShopModel_1.default.findByIdAndUpdate(id, {
                status: ShopModel_1.ShopStatus.BLOCKED,
                isActive: false,
                isVerified: false,
            }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            // Ẩn tất cả sản phẩm của shop khi shop bị từ chối
            try {
                const hiddenProducts = await ProductModal_1.default.updateMany({ shopId: id }, { $set: { isActive: false } });
                console.log(`[shop] Hidden ${hiddenProducts.modifiedCount} products for rejected shop ${id}`);
            }
            catch (error) {
                console.error("[shop] Error hiding products:", error);
                // Không fail nếu ẩn sản phẩm lỗi
            }
            if (item.userId) {
                notification_service_1.notificationService
                    .notifyShopOwnerApproval({
                    ownerId: item.userId.toString(),
                    shopId: item._id.toString(),
                    shopName: item.name,
                    status: "rejected",
                })
                    .catch((error) => console.error("[shop] notify reject failed:", error));
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    // Suspend shop (admin only)
    static async suspendShop(id) {
        try {
            const item = await ShopModel_1.default.findByIdAndUpdate(id, {
                status: ShopModel_1.ShopStatus.BLOCKED,
                isActive: false,
            }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            // Ẩn tất cả sản phẩm của shop khi shop bị đình chỉ
            try {
                const hiddenProducts = await ProductModal_1.default.updateMany({ shopId: id }, { $set: { isActive: false } });
                console.log(`[shop] Hidden ${hiddenProducts.modifiedCount} products for suspended shop ${id}`);
            }
            catch (error) {
                console.error("[shop] Error hiding products:", error);
                // Không fail nếu ẩn sản phẩm lỗi
            }
            if (item.userId) {
                notification_service_1.notificationService
                    .notifyShopOwnerApproval({
                    ownerId: item.userId.toString(),
                    shopId: item._id.toString(),
                    shopName: item.name,
                    status: "suspended",
                })
                    .catch((error) => console.error("[shop] notify suspend failed:", error));
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    // Unlock shop (admin only) - mở khóa shop bị khóa
    static async unlockShop(id) {
        try {
            const now = new Date();
            const item = await ShopModel_1.default.findByIdAndUpdate(id, {
                status: ShopModel_1.ShopStatus.ACTIVE,
                isActive: true,
                activatedAt: now,
                isVerified: true,
                verifiedAt: now,
            }, { new: true });
            if (!item) {
                return {
                    ok: false,
                    status: 404,
                    message: "Shop không tồn tại",
                };
            }
            // Hiện lại tất cả sản phẩm của shop khi shop được mở khóa
            try {
                const shownProducts = await ProductModal_1.default.updateMany({ shopId: id }, { $set: { isActive: true } });
                console.log(`[shop] Shown ${shownProducts.modifiedCount} products for unlocked shop ${id}`);
            }
            catch (error) {
                console.error("[shop] Error showing products:", error);
                // Không fail nếu hiện sản phẩm lỗi
            }
            if (item.userId) {
                await UserModel_1.default.findByIdAndUpdate(item.userId, {
                    role: "shop",
                    status: UserModel_1.UserStatus.ACTIVE,
                });
            }
            if (item.userId) {
                notification_service_1.notificationService
                    .notifyShopOwnerApproval({
                    ownerId: item.userId.toString(),
                    shopId: item._id.toString(),
                    shopName: item.name,
                    status: "approved",
                })
                    .catch((error) => console.error("[shop] notify unlock failed:", error));
            }
            return { ok: true, item };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
}
exports.default = ShopService;
