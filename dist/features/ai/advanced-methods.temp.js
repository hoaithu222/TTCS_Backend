"use strict";
// This file will be inserted into ai.service.ts after the searchWalletForChat method
async;
getProductRecommendations(userId, string);
Promise < any[] > {
    try: {
        console, : .log("[AI] getProductRecommendations called with userId:", userId),
        // Get user's order history
        const: orders = await OrderModel.find({ userId })
            .populate({
            path: "orderItems",
            populate: { path: "productId", select: "category brand" }
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        // Extract categories and brands from purchased products
        const: purchasedCategories = new Set(),
        const: purchasedBrands = new Set(),
        orders, : .forEach((order) => {
            order.orderItems?.forEach((item) => {
                if (item.productId?.category)
                    purchasedCategories.add(item.productId.category);
                if (item.productId?.brand)
                    purchasedBrands.add(item.productId.brand);
            });
        }),
        console, : .log("[AI] Found categories:", Array.from(purchasedCategories)),
        console, : .log("[AI] Found brands:", Array.from(purchasedBrands)),
        // Find similar products
        const: recommendations = await ProductModel.find({
            $or: [
                { category: { $in: Array.from(purchasedCategories) } },
                { brand: { $in: Array.from(purchasedBrands) } }
            ],
            isActive: true,
            stock: { $gt: 0 }
        })
            .populate("shopId", "name logo rating")
            .sort({ rating: -1, soldCount: -1 })
            .limit(8)
            .lean(),
        console, : .log("[AI] Found recommendations:", recommendations.length),
        return: recommendations
    }, catch(error) {
        console.error("[AI] Recommendation failed:", error);
        return [];
    }
};
async;
findBestDeals(userMessage, string);
Promise < any[] > {
    try: {
        console, : .log("[AI] findBestDeals called with message:", userMessage),
        // Extract product keywords (remove deal-related words)
        const: keywords = userMessage
            .toLowerCase()
            .replace(/giá rẻ|rẻ nhất|deal|khuyến mãi|giảm giá|sale|ưu đãi|tốt nhất|tìm|cho tôi/gi, "")
            .trim(),
        const: filter, any = {
            isActive: true,
            stock: { $gt: 0 }
        },
        if(keywords) {
            filter.$or = [
                { name: { $regex: keywords, $options: "i" } },
                { brand: { $regex: keywords, $options: "i" } }
            ];
        }
        // Sort by discount and price
        ,
        // Sort by discount and price
        const: deals = await ProductModel.find(filter)
            .populate("shopId", "name logo")
            .sort({ discount: -1, price: 1 })
            .limit(10)
            .lean(),
        console, : .log("[AI] Found deals:", deals.length),
        return: deals
    }, catch(error) {
        console.error("[AI] Deal finder failed:", error);
        return [];
    }
};
async;
checkCartStock(userId, string);
Promise < any > {
    try: {
        console, : .log("[AI] checkCartStock called with userId:", userId),
        const: cart = await Cart.findOne({ userId })
            .populate({
            path: "cartItems",
            populate: { path: "productId", select: "name stock isActive" }
        })
            .lean(),
        if(, cart, cartItems) { }, return: { inStock: [], outOfStock: [] },
        const: inStock, any, []:  = [],
        const: outOfStock, any, []:  = [],
        cart, : .cartItems.forEach((item) => {
            const product = item.productId;
            if (!product?.isActive || product.stock === 0) {
                outOfStock.push({
                    name: product?.name || "Unknown",
                    quantity: item.quantity,
                    reason: !product?.isActive ? "Sản phẩm không còn bán" : "Hết hàng"
                });
            }
            else if (product.stock < item.quantity) {
                outOfStock.push({
                    name: product.name,
                    quantity: item.quantity,
                    available: product.stock,
                    reason: `Chỉ còn ${product.stock} sản phẩm`
                });
            }
            else {
                inStock.push({
                    name: product.name,
                    quantity: item.quantity,
                    stock: product.stock
                });
            }
        }),
        console, : .log("[AI] Stock check - In stock:", inStock.length, "Out of stock:", outOfStock.length),
        return: { inStock, outOfStock }
    }, catch(error) {
        console.error("[AI] Stock check failed:", error);
        return { inStock: [], outOfStock: [] };
    }
};
handleFAQ(userMessage, string, language, string);
string | null;
{
    const isVietnamese = language === "vi";
    const lowerMessage = userMessage.toLowerCase();
    const faqs = {
        "đổi trả": isVietnamese
            ? "📦 **Chính sách đổi trả hàng:**\n\n1. Vào 'Đơn hàng của tôi'\n2. Chọn đơn cần đổi trả\n3. Nhấn 'Yêu cầu đổi trả'\n4. Điền lý do và chờ xác nhận\n\n⏰ **Lưu ý:** Chỉ đổi trả trong 7 ngày kể từ khi nhận hàng.\n✅ Sản phẩm còn nguyên tem, chưa qua sử dụng."
            : "📦 **Return/Exchange Policy:**\n\n1. Go to 'My Orders'\n2. Select order\n3. Click 'Request Return'\n4. Fill reason and wait\n\n⏰ **Note:** Within 7 days of receipt.\n✅ Product must be unused with tags.",
        "thanh toán": isVietnamese
            ? "💳 **Phương thức thanh toán:**\n\n✅ COD (Thanh toán khi nhận hàng)\n✅ Chuyển khoản ngân hàng\n✅ Ví điện tử (Momo, ZaloPay)\n✅ Thẻ tín dụng/ghi nợ\n\n🔒 An toàn & bảo mật 100%"
            : "💳 **Payment Methods:**\n\n✅ COD\n✅ Bank transfer\n✅ E-wallet\n✅ Credit/Debit card\n\n🔒 100% Secure",
        "vận chuyển": isVietnamese
            ? "🚚 **Thời gian giao hàng:**\n\n📍 Nội thành: 1-2 ngày\n📍 Ngoại thành: 3-5 ngày\n📍 Miền khác: 5-7 ngày\n\n💰 **Phí ship:** 15,000đ - 30,000đ tùy khu vực\n🎁 Miễn phí ship cho đơn từ 500,000đ"
            : "🚚 **Delivery Time:**\n\n📍 City: 1-2 days\n📍 Suburb: 3-5 days\n📍 Other regions: 5-7 days\n\n💰 **Shipping:** 15,000đ - 30,000đ\n🎁 Free shipping for orders over 500,000đ",
        "hoàn tiền": isVietnamese
            ? "💰 **Chính sách hoàn tiền:**\n\n✅ Hoàn tiền trong 3-7 ngày làm việc\n✅ Hoàn về tài khoản/ví gốc\n✅ Áp dụng khi:\n   - Sản phẩm lỗi\n   - Giao sai hàng\n   - Hủy đơn trước khi giao\n\n📞 Liên hệ CSKH để được hỗ trợ nhanh nhất!"
            : "💰 **Refund Policy:**\n\n✅ Refund within 3-7 business days\n✅ Return to original account/wallet\n✅ Applicable when:\n   - Defective product\n   - Wrong item delivered\n   - Order cancelled before delivery\n\n📞 Contact support for quick assistance!",
    };
    for (const [keyword, answer] of Object.entries(faqs)) {
        if (lowerMessage.includes(keyword)) {
            console.log("[AI] FAQ matched keyword:", keyword);
            return answer;
        }
    }
    return null;
}
