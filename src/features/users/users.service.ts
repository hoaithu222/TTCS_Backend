import UserModel, { UserStatus } from "../../models/UserModel";
import ShopModel, { ShopStatus } from "../../models/ShopModel";
import ProductModel from "../../models/ProductModal";
import ChatConversationModel from "../../models/ChatConversation";
import ChatMessageModel from "../../models/ChatMessage";
import { UpdateUserRequest } from "./types";
import ShopService from "../shop/shop.service";

export default class UsersService {
  // lấy thông tin user
  static async getUser(id: string, includeShopStatus = false) {
    const user = await UserModel.findById(id);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    const userObj = user.toObject();
    
    if (includeShopStatus) {
      const shopStatusResult = await ShopService.getShopStatusByUserId(id);
      if (shopStatusResult.ok) {
        return {
          ok: true as const,
          user: {
            ...userObj,
            shopStatus: shopStatusResult.shopStatus,
            shop: shopStatusResult.shop,
          },
        };
      }
    }
    
    return { ok: true as const, user: userObj };
  }
  // cập nhật thông tin user
  static async updateUser(id: string, data: UpdateUserRequest) {
    // Lấy user hiện tại để so sánh status
    const currentUser = await UserModel.findById(id).select("status").lean();
    if (!currentUser) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }

    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }

    // Xử lý shop và sản phẩm khi status thay đổi
    if (data.status && data.status !== currentUser.status) {
      try {
        const shop = await ShopModel.findOne({ userId: id }).select("_id status").lean();
        
        if (shop) {
          if (data.status === UserStatus.INACTIVE) {
            // User bị khóa → khóa shop và ẩn sản phẩm
            await ShopModel.findByIdAndUpdate(shop._id, {
              status: ShopStatus.BLOCKED,
              isActive: false,
            });
            
            const hiddenProducts = await ProductModel.updateMany(
              { shopId: shop._id },
              { $set: { isActive: false } }
            );
            console.log(`[users] Blocked shop ${shop._id} and hidden ${hiddenProducts.modifiedCount} products for inactive user ${id}`);
          } else if (data.status === UserStatus.ACTIVE && currentUser.status === UserStatus.INACTIVE) {
            // User được mở khóa (từ INACTIVE sang ACTIVE) → mở khóa shop và hiện lại sản phẩm
            await ShopModel.findByIdAndUpdate(shop._id, {
              status: ShopStatus.ACTIVE,
              isActive: true,
            });
            
            const shownProducts = await ProductModel.updateMany(
              { shopId: shop._id },
              { $set: { isActive: true } }
            );
            console.log(`[users] Unlocked shop ${shop._id} and shown ${shownProducts.modifiedCount} products for active user ${id}`);
          }
        }
      } catch (error) {
        console.error("[users] Error updating shop and products status:", error);
        // Không fail nếu xử lý shop lỗi
      }
    }

    return { ok: true as const, user };
  }
  // xóa user
  static async deleteUser(id: string) {
    const user = await UserModel.findById(id);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }

    // Tìm shop của user
    const shop = await ShopModel.findOne({ userId: id }).select("_id").lean();
    
    if (shop) {
      try {
        // Xóa tất cả sản phẩm của shop
        const deletedProducts = await ProductModel.deleteMany({ shopId: shop._id });
        console.log(`[users] Deleted ${deletedProducts.deletedCount} products for shop ${shop._id} (user ${id})`);
        
        // Xóa shop
        await ShopModel.findByIdAndDelete(shop._id);
        console.log(`[users] Deleted shop ${shop._id} for user ${id}`);
      } catch (error) {
        console.error("[users] Error deleting shop and products:", error);
        // Tiếp tục xóa user dù có lỗi khi xóa shop
      }
    }

    // Xóa tất cả conversations và messages của user
    try {
      // Tìm tất cả conversations có user trong participants
      const conversations = await ChatConversationModel.find({
        "participants.userId": id,
      }).select("_id").lean();

      const conversationIds = conversations.map((c) => c._id);

      if (conversationIds.length > 0) {
        // Xóa tất cả messages của các conversations này
        const deletedMessages = await ChatMessageModel.deleteMany({
          conversationId: { $in: conversationIds },
        });
        console.log(`[users] Deleted ${deletedMessages.deletedCount} messages for user ${id}`);

        // Xóa conversations
        const deletedConversations = await ChatConversationModel.deleteMany({
          _id: { $in: conversationIds },
        });
        console.log(`[users] Deleted ${deletedConversations.deletedCount} conversations for user ${id}`);
      }
    } catch (error) {
      console.error("[users] Error deleting conversations and messages:", error);
      // Tiếp tục xóa user dù có lỗi khi xóa conversations
    }

    // Xóa user
    await UserModel.findByIdAndDelete(id);
    return { ok: true as const, user };
  }
  // lấy danh sách user với pagination và filter
  static async getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: "active" | "inactive" | "suspended",
    role?: "admin" | "user" | "moderator",
    sortBy?: string,
    sortOrder?: "asc" | "desc"
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 10;
      const skip = (safePage - 1) * safeLimit;

      // Build filter query
      const filterQuery: any = {};

      // Add search filter (case insensitive) - search by name or email
      if (search && search.trim()) {
        filterQuery.$or = [
          { name: { $regex: search.trim(), $options: "i" } },
          { email: { $regex: search.trim(), $options: "i" } },
        ];
      }

      // Add status filter - map "suspended" to "inactive" for compatibility
      if (status) {
        if (status === "suspended") {
          filterQuery.status = "inactive";
        } else {
          filterQuery.status = status;
        }
      }

      // Add role filter
      if (role) {
        filterQuery.role = role;
      }

      // Build sort
      const sort: any = {};
      if (sortBy) {
        sort[sortBy] = sortOrder === "desc" ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort by createdAt desc
      }

      const [users, total] = await Promise.all([
        UserModel.find(filterQuery)
          .skip(skip)
          .limit(safeLimit)
          .sort(sort)
          .select("-password -refreshToken -accessToken -forgotPasswordToken -verifyToken -twoFactorAuthSecret"),
        UserModel.countDocuments(filterQuery),
      ]);

      return {
        ok: true as const,
        users,
        total,
        page: safePage,
        limit: safeLimit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // cập nhật avatar của user
  static async updateAvatar(id: string, avatarUrl: string) {
    if (!avatarUrl || typeof avatarUrl !== "string") {
      return {
        ok: false as const,
        status: 400,
        message: "avatar là bắt buộc và phải là string",
      };
    }
    const user = await UserModel.findByIdAndUpdate(
      id,
      { avatar: avatarUrl },
      { new: true }
    );
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    return { ok: true as const, user };
  }

  // Suspend user (admin only) - khóa người dùng
  static async suspendUser(id: string) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { status: UserStatus.INACTIVE },
        { new: true }
      );
      if (!user) {
        return {
          ok: false as const,
          status: 404,
          message: "Người dùng không tồn tại",
        };
      }

      // Khóa shop và ẩn sản phẩm nếu user có shop
      try {
        const shop = await ShopModel.findOne({ userId: id }).select("_id status").lean();
        
        if (shop) {
          await ShopModel.findByIdAndUpdate(shop._id, {
            status: ShopStatus.BLOCKED,
            isActive: false,
          });
          
          const hiddenProducts = await ProductModel.updateMany(
            { shopId: shop._id },
            { $set: { isActive: false } }
          );
          console.log(`[users] Suspended user ${id}, blocked shop ${shop._id} and hidden ${hiddenProducts.modifiedCount} products`);
        }
      } catch (error) {
        console.error("[users] Error blocking shop and products:", error);
        // Không fail nếu xử lý shop lỗi
      }

      return { ok: true as const, user };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  // Unlock user (admin only) - mở khóa người dùng
  static async unlockUser(id: string) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        id,
        { status: UserStatus.ACTIVE },
        { new: true }
      );
      if (!user) {
        return {
          ok: false as const,
          status: 404,
          message: "Người dùng không tồn tại",
        };
      }

      // Mở khóa shop và hiện lại sản phẩm nếu user có shop
      try {
        const shop = await ShopModel.findOne({ userId: id }).select("_id status").lean();
        
        if (shop) {
          await ShopModel.findByIdAndUpdate(shop._id, {
            status: ShopStatus.ACTIVE,
            isActive: true,
          });
          
          const shownProducts = await ProductModel.updateMany(
            { shopId: shop._id },
            { $set: { isActive: true } }
          );
          console.log(`[users] Unlocked user ${id}, activated shop ${shop._id} and shown ${shownProducts.modifiedCount} products`);
        }
      } catch (error) {
        console.error("[users] Error activating shop and products:", error);
        // Không fail nếu xử lý shop lỗi
      }

      return { ok: true as const, user };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }
}
