"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = void 0;
const openai_1 = __importDefault(require("openai"));
const genai_1 = require("@google/genai");
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const CategoryModel_1 = __importDefault(require("../../models/CategoryModel"));
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_PRODUCT_MODEL ||
    process.env.OPENAI_MODEL ||
    "gpt-4o-mini";
const OPENAI_TEMPERATURE = Number(process.env.OPENAI_TEMPERATURE || "0.8");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
// Try these models in order: gemini-2.5-flash (newest), gemini-1.5-flash-latest, gemini-pro
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || "0.8");
// Fallback models to try if primary model fails
const GEMINI_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-pro",
];
const systemPrompt = "Bạn là chuyên gia copywriting và SEO trong lĩnh vực thương mại điện tử. " +
    "Hãy viết mô tả sản phẩm giàu thông tin, văn phong tự nhiên, chia thành nhiều đoạn rõ ràng, có tiêu đề phụ, " +
    "tập trung vào lợi ích khách hàng và tối ưu SEO. Luôn viết bằng ngôn ngữ được yêu cầu.";
class AiService {
    constructor() {
        if (GEMINI_API_KEY) {
            // New SDK automatically picks up GEMINI_API_KEY from env
            this.geminiClient = new genai_1.GoogleGenAI({});
            this.openaiClient = null;
            this.provider = "gemini";
            console.log("[AI] Using Google Gemini as AI provider");
        }
        else if (OPENAI_API_KEY) {
            this.openaiClient = new openai_1.default({ apiKey: OPENAI_API_KEY });
            this.geminiClient = null;
            this.provider = "openai";
            console.log("[AI] Using OpenAI as AI provider");
        }
        else {
            this.openaiClient = null;
            this.geminiClient = null;
            this.provider = "fallback";
            console.warn("[AI] No AI API key found. Falling back to rule-based generator.");
        }
    }
    async generateProductDescription(dto) {
        const payload = this.normalizePayload(dto);
        const prompt = this.buildPrompt(payload);
        // Try Gemini first if available
        if (this.geminiClient) {
            try {
                return await this.generateWithGemini(payload, prompt);
            }
            catch (error) {
                console.error("[AI] Gemini generation failed. Trying fallback.", error);
                return this.generateFallbackResponse(payload);
            }
        }
        // Try OpenAI if available
        if (this.openaiClient) {
            try {
                return await this.generateWithOpenAI(payload, prompt);
            }
            catch (error) {
                console.error("[AI] OpenAI generation failed. Using fallback.", error);
                return this.generateFallbackResponse(payload);
            }
        }
        // Fallback to rule-based
        return this.generateFallbackResponse(payload);
    }
    async generateWithGemini(payload, prompt) {
        if (!this.geminiClient) {
            throw new Error("Gemini client not initialized");
        }
        try {
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            const response = await this.geminiClient.models.generateContent({
                model: GEMINI_MODEL,
                contents: fullPrompt,
                config: {
                    temperature: GEMINI_TEMPERATURE,
                },
            });
            const content = response.text?.trim() || "";
            if (!content) {
                console.warn("[AI] Gemini returned empty content");
                throw new Error("Empty response from Gemini");
            }
            return {
                content,
                outline: this.buildOutline(content),
                meta: this.buildMeta(content, payload),
                provider: "gemini",
            };
        }
        catch (error) {
            // If model not found (404), try fallback models
            if (error?.status === 404 || error?.statusCode === 404) {
                const triedModels = [GEMINI_MODEL];
                for (const fallbackModelName of GEMINI_FALLBACK_MODELS) {
                    // Skip if already tried
                    if (triedModels.includes(fallbackModelName)) {
                        continue;
                    }
                    console.warn(`[AI] Model ${GEMINI_MODEL} not found, trying ${fallbackModelName} as fallback`);
                    try {
                        const fullPrompt = `${systemPrompt}\n\n${prompt}`;
                        const response = await this.geminiClient.models.generateContent({
                            model: fallbackModelName,
                            contents: fullPrompt,
                            config: {
                                temperature: GEMINI_TEMPERATURE,
                            },
                        });
                        const content = response.text?.trim() || "";
                        if (content) {
                            console.log(`[AI] Successfully used model: ${fallbackModelName}`);
                            return {
                                content,
                                outline: this.buildOutline(content),
                                meta: this.buildMeta(content, payload),
                                provider: "gemini",
                            };
                        }
                    }
                    catch (fallbackError) {
                        console.warn(`[AI] Model ${fallbackModelName} also failed:`, fallbackError?.status || fallbackError?.message);
                        triedModels.push(fallbackModelName);
                        // Continue to next fallback model
                    }
                }
                console.error("[AI] All Gemini models failed. Falling back to rule-based generation.");
            }
            throw error;
        }
    }
    async generateWithOpenAI(payload, prompt) {
        if (!this.openaiClient) {
            throw new Error("OpenAI client not initialized");
        }
        const completion = await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: OPENAI_TEMPERATURE,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
        });
        const content = completion.choices?.[0]?.message?.content?.trim() ||
            this.buildFallbackCopy(payload);
        return {
            content,
            outline: this.buildOutline(content),
            meta: this.buildMeta(content, payload),
            provider: "openai",
        };
    }
    normalizePayload(dto) {
        return {
            productName: dto.productName.trim(),
            specs: this.normalizeSpecs(dto.specs),
            tone: dto.tone || "marketing",
            language: dto.language || "vi",
            keywords: dto.keywords?.filter(Boolean) || [],
        };
    }
    normalizeSpecs(specs) {
        if (!specs || typeof specs !== "object" || Array.isArray(specs)) {
            return undefined;
        }
        return Object.entries(specs).reduce((acc, [key, value]) => {
            if (value != null && value !== "") {
                acc[key] = String(value);
            }
            return acc;
        }, {});
    }
    buildPrompt(dto) {
        const specList = dto.specs
            ? Object.entries(dto.specs)
                .map(([key, value]) => `- ${key}: ${value}`)
                .join("\n")
            : "Không có thông số bổ sung.";
        const tone = dto.tone === "technical"
            ? "giọng điệu chuyên gia, nhiều thông tin kỹ thuật"
            : dto.tone === "casual"
                ? "giọng điệu gần gũi, thân thiện"
                : "giọng điệu marketing hiện đại, lôi cuốn";
        return `
Sản phẩm: ${dto.productName}
Giọng văn: ${tone}
Ngôn ngữ: ${dto.language === "vi" ? "Tiếng Việt" : dto.language}
Thông số nổi bật:
${specList}

Yêu cầu:
1. Viết khoảng 4-6 đoạn, mỗi đoạn có tiêu đề phụ rõ ràng.
2. Nhấn mạnh lợi ích, trải nghiệm người dùng, điểm khác biệt.
3. Kết thúc với lời kêu gọi hành động hấp dẫn.
4. Bổ sung gợi ý từ khóa SEO nếu phù hợp.
`;
    }
    buildOutline(content) {
        return content
            .split(/\n+/)
            .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
            .filter((line) => line.length > 0)
            .slice(0, 8);
    }
    buildMeta(content, dto) {
        const baseKeywords = new Set();
        baseKeywords.add(dto.productName);
        if (dto.specs) {
            Object.values(dto.specs).forEach((value) => {
                baseKeywords.add(value);
            });
        }
        dto.keywords?.forEach((value) => {
            baseKeywords.add(value);
        });
        const plain = content.replace(/\s+/g, " ").trim();
        const metaDescription = plain.slice(0, 158) + (plain.length > 158 ? "..." : "");
        return {
            keywords: Array.from(baseKeywords).filter(Boolean),
            seoTitle: `${dto.productName} - Chính hãng, giá tốt tại cửa hàng`,
            metaDescription,
        };
    }
    buildFallbackCopy(dto) {
        const specs = dto.specs
            ? Object.entries(dto.specs)
                .map(([key, value]) => `${key}: ${value}`)
                .join(" • ")
            : "Thông số đang được cập nhật.";
        return `
${dto.productName}: nâng tầm trải nghiệm mỗi ngày

• Hiệu năng vượt trội: ${specs}
• Thiết kế sang trọng, dễ dàng thu hút ánh nhìn.
• Tối ưu cho công việc, giải trí và chụp ảnh sắc nét.
• Bảo hành chính hãng, hỗ trợ đổi trả linh hoạt.

Đặt mua ngay hôm nay để nhận ưu đãi độc quyền và dịch vụ hỗ trợ tận tâm!`.trim();
    }
    generateFallbackResponse(dto) {
        const content = this.buildFallbackCopy(dto);
        return {
            content,
            outline: this.buildOutline(content),
            meta: this.buildMeta(content, dto),
            provider: "fallback",
        };
    }
    async generateProductMeta(dto) {
        const payload = this.normalizeMetaPayload(dto);
        const prompt = this.buildMetaPrompt(payload);
        const systemPromptMeta = "Bạn là chuyên gia SEO và marketing. Hãy tạo từ khóa tìm kiếm, thông tin bảo hành phù hợp cho sản phẩm.";
        // Try Gemini first if available
        if (this.geminiClient) {
            try {
                return await this.generateMetaWithGemini(payload, prompt, systemPromptMeta);
            }
            catch (error) {
                console.error("[AI] Gemini meta generation failed. Trying fallback.", error);
                return this.generateFallbackMeta(payload);
            }
        }
        // Try OpenAI if available
        if (this.openaiClient) {
            try {
                return await this.generateMetaWithOpenAI(payload, prompt, systemPromptMeta);
            }
            catch (error) {
                console.error("[AI] OpenAI meta generation failed. Using fallback.", error);
                return this.generateFallbackMeta(payload);
            }
        }
        // Fallback to rule-based
        return this.generateFallbackMeta(payload);
    }
    async generateMetaWithGemini(payload, prompt, systemPrompt) {
        if (!this.geminiClient) {
            throw new Error("Gemini client not initialized");
        }
        try {
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            const response = await this.geminiClient.models.generateContent({
                model: GEMINI_MODEL,
                contents: fullPrompt,
                config: {
                    temperature: 0.7,
                },
            });
            const content = response.text?.trim() || "";
            if (!content) {
                console.warn("[AI] Gemini returned empty meta content");
                throw new Error("Empty response from Gemini");
            }
            const parsed = this.parseMetaResponse(content, payload);
            return {
                ...parsed,
                provider: "gemini",
            };
        }
        catch (error) {
            // If model not found (404), try fallback models
            if (error?.status === 404 || error?.statusCode === 404) {
                const triedModels = [GEMINI_MODEL];
                for (const fallbackModelName of GEMINI_FALLBACK_MODELS) {
                    // Skip if already tried
                    if (triedModels.includes(fallbackModelName)) {
                        continue;
                    }
                    console.warn(`[AI] Model ${GEMINI_MODEL} not found for meta, trying ${fallbackModelName} as fallback`);
                    try {
                        const fullPrompt = `${systemPrompt}\n\n${prompt}`;
                        const response = await this.geminiClient.models.generateContent({
                            model: fallbackModelName,
                            contents: fullPrompt,
                            config: {
                                temperature: 0.7,
                            },
                        });
                        const content = response.text?.trim() || "";
                        if (content) {
                            console.log(`[AI] Successfully used model for meta: ${fallbackModelName}`);
                            const parsed = this.parseMetaResponse(content, payload);
                            return {
                                ...parsed,
                                provider: "gemini",
                            };
                        }
                    }
                    catch (fallbackError) {
                        console.warn(`[AI] Model ${fallbackModelName} also failed for meta:`, fallbackError?.status || fallbackError?.message);
                        triedModels.push(fallbackModelName);
                        // Continue to next fallback model
                    }
                }
                console.error("[AI] All Gemini models failed for meta. Falling back to rule-based generation.");
            }
            throw error;
        }
    }
    async generateMetaWithOpenAI(payload, prompt, systemPrompt) {
        if (!this.openaiClient) {
            throw new Error("OpenAI client not initialized");
        }
        const completion = await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: 0.7,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
        });
        const content = completion.choices?.[0]?.message?.content?.trim() || "";
        if (!content) {
            return this.generateFallbackMeta(payload);
        }
        const parsed = this.parseMetaResponse(content, payload);
        return {
            ...parsed,
            provider: "openai",
        };
    }
    normalizeMetaPayload(dto) {
        return {
            productName: dto.productName.trim(),
            specs: this.normalizeSpecs(dto.specs),
            category: dto.category?.trim(),
            language: dto.language || "vi",
        };
    }
    buildMetaPrompt(dto) {
        const specList = dto.specs
            ? Object.entries(dto.specs)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")
            : "";
        return `
Sản phẩm: ${dto.productName}
${dto.category ? `Danh mục: ${dto.category}` : ""}
${specList ? `Thông số: ${specList}` : ""}

Yêu cầu (trả về JSON):
{
  "keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3", ...], // 8-12 từ khóa SEO phù hợp
  "warrantyInfo": "Thông tin bảo hành ngắn gọn, ví dụ: '12 tháng chính hãng, đổi mới 7 ngày'",
  "highlights": ["Điểm nổi bật 1", "Điểm nổi bật 2", "Điểm nổi bật 3"] // 3-5 điểm nổi bật
}
`.trim();
    }
    parseMetaResponse(content, dto) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    keywords: Array.isArray(parsed.keywords)
                        ? parsed.keywords.slice(0, 12)
                        : [],
                    warrantyInfo: parsed.warrantyInfo || undefined,
                    highlights: Array.isArray(parsed.highlights)
                        ? parsed.highlights.slice(0, 5)
                        : undefined,
                };
            }
        }
        catch (error) {
            console.warn("[AI] Failed to parse meta response as JSON", error);
        }
        // Return fallback without provider (will be set by caller)
        const fallback = this.generateFallbackMeta(dto);
        return {
            keywords: fallback.keywords,
            warrantyInfo: fallback.warrantyInfo,
            highlights: fallback.highlights,
        };
    }
    generateFallbackMeta(dto) {
        const baseKeywords = [dto.productName];
        if (dto.specs) {
            Object.values(dto.specs).forEach((value) => {
                if (value)
                    baseKeywords.push(value);
            });
        }
        if (dto.category) {
            baseKeywords.push(dto.category);
        }
        return {
            keywords: [...new Set(baseKeywords)].slice(0, 10),
            warrantyInfo: "12 tháng chính hãng, đổi mới trong 7 ngày đầu",
            highlights: [
                `Sản phẩm ${dto.productName} chính hãng`,
                "Chất lượng đảm bảo, giá tốt",
                "Giao hàng nhanh, hỗ trợ tận tâm",
            ],
            provider: "fallback",
        };
    }
    /**
     * Check if user is requesting suggestions (wants to see product/shop list)
     */
    isRequestingSuggestions(userMessage) {
        const suggestionKeywords = [
            "gợi ý", "gợi ý cho", "cho tôi xem", "xem", "tìm", "tìm cho",
            "hiển thị", "danh sách", "list", "show", "suggest", "recommend",
            "có gì", "có những", "những sản phẩm", "sản phẩm nào", "shop nào",
            "cửa hàng nào", "mua", "muốn mua", "cần mua", "đang tìm mua"
        ];
        const lowerMessage = userMessage.toLowerCase();
        return suggestionKeywords.some(keyword => lowerMessage.includes(keyword));
    }
    /**
     * Generate AI chat response with product search (RAG Lite)
     * Searches products based on user message and provides intelligent recommendations
     */
    async generateChatResponse(dto) {
        const userMessage = dto.message.trim();
        const language = dto.language || "vi";
        if (!userMessage) {
            return {
                response: language === "vi"
                    ? "Xin chào! Tôi có thể giúp gì cho bạn?"
                    : "Hello! How can I help you?",
                provider: "fallback",
            };
        }
        // Check if user is requesting suggestions
        const isRequestingSuggestions = this.isRequestingSuggestions(userMessage);
        // Step 1: Search products, shops, and categories based on user message
        // Only search if user is requesting suggestions or asking about specific product
        const [products, shops, categories] = await Promise.all([
            isRequestingSuggestions ? this.searchProductsForChat(userMessage) : Promise.resolve([]),
            isRequestingSuggestions ? this.searchShopsForChat(userMessage) : Promise.resolve([]),
            isRequestingSuggestions ? this.searchCategoriesForChat(userMessage) : Promise.resolve([]),
        ]);
        // Step 2: Build prompt with product, shop, and category context
        const prompt = this.buildChatPrompt(userMessage, products, shops, categories, dto.conversationHistory || [], language, isRequestingSuggestions);
        // Step 3: Generate response using AI
        if (this.provider === "fallback") {
            return this.generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions);
        }
        try {
            let response;
            if (this.provider === "gemini" && this.geminiClient) {
                response = await this.generateChatWithGemini(prompt, language);
            }
            else if (this.provider === "openai" && this.openaiClient) {
                response = await this.generateChatWithOpenAI(prompt, language);
            }
            else {
                response = this.generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions).response;
            }
            // Determine response type
            const hasProducts = products.length > 0;
            const hasShops = shops.length > 0;
            const hasCategories = categories.length > 0;
            let responseType = "text";
            const typeCount = [hasProducts, hasShops, hasCategories].filter(Boolean).length;
            if (typeCount > 1) {
                responseType = "mixed";
            }
            else if (hasProducts) {
                responseType = "product";
            }
            else if (hasShops) {
                responseType = "shop";
            }
            else if (hasCategories) {
                responseType = "category";
            }
            // Only return suggested products/shops if user is requesting suggestions
            let suggestedProducts = [];
            let suggestedShops = [];
            let suggestedCategories = [];
            if (isRequestingSuggestions) {
                // Filter products to only show exact matches if user asked for specific product
                let filteredProducts = products;
                const productNamePattern = userMessage.match(/(iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|huawei|nokia|sony)\s*(\d+[a-z]*)/i);
                if (productNamePattern) {
                    const exactProductName = `${productNamePattern[1]} ${productNamePattern[2]}`.toLowerCase();
                    // Only show products that contain the exact product name
                    filteredProducts = products.filter((p) => {
                        const productName = (p.name || "").toLowerCase();
                        return productName.includes(exactProductName) ||
                            productName.includes(exactProductName.replace(/\s+/g, "")) ||
                            productName.includes(exactProductName.replace(/\s+/g, "-"));
                    });
                    // If no exact match, show closest match (first product)
                    if (filteredProducts.length === 0 && products.length > 0) {
                        filteredProducts = [products[0]]; // Show closest match as fallback
                    }
                }
                suggestedProducts = filteredProducts.slice(0, 5).map((p) => ({
                    _id: p._id.toString(),
                    name: p.name,
                    price: p.price,
                    finalPrice: p.price - (p.discount || 0),
                    images: p.images?.slice(0, 1) || [],
                    shop: p.shopId ? {
                        name: p.shopId.name || "",
                        _id: p.shopId._id?.toString() || "",
                    } : undefined,
                }));
                suggestedShops = shops.slice(0, 5).map((s) => ({
                    _id: s._id.toString(),
                    name: s.name,
                    logo: s.logo,
                    description: s.description,
                    rating: s.rating || 0,
                    followCount: s.followCount || 0,
                    productCount: s.productCount || 0,
                    reviewCount: s.reviewCount || 0,
                    isVerified: s.isVerified || false,
                }));
                suggestedCategories = categories.slice(0, 5).map((c) => ({
                    _id: c._id.toString(),
                    name: c.name,
                    description: c.description,
                    image: c.image_Icon?.url || c.image?.[0]?.url,
                    productCount: c.productCount || 0,
                    slug: c.slug,
                }));
            }
            // Update response type based on whether suggestions are returned
            let finalResponseType = "text";
            if (isRequestingSuggestions) {
                const hasProducts = suggestedProducts.length > 0;
                const hasShops = suggestedShops.length > 0;
                const hasCategories = suggestedCategories.length > 0;
                const typeCount = [hasProducts, hasShops, hasCategories].filter(Boolean).length;
                if (typeCount > 1) {
                    finalResponseType = "mixed";
                }
                else if (hasProducts) {
                    finalResponseType = "product";
                }
                else if (hasShops) {
                    finalResponseType = "shop";
                }
                else if (hasCategories) {
                    finalResponseType = "category";
                }
            }
            return {
                response,
                suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : undefined,
                suggestedShops: suggestedShops.length > 0 ? suggestedShops : undefined,
                suggestedCategories: suggestedCategories.length > 0 ? suggestedCategories : undefined,
                responseType: finalResponseType,
                provider: this.provider,
            };
        }
        catch (error) {
            console.error("[AI] Chat generation failed. Using fallback.", error);
            return this.generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions);
        }
    }
    /**
     * Search products based on user message
     * Extracts keywords like price range, category, features from message
     * Prioritizes exact matches over partial matches
     */
    async searchProductsForChat(userMessage) {
        try {
            // Extract product name/model from message (e.g., "iPhone 17", "Samsung S24")
            // Look for patterns like: brand + number, or specific product names
            const productNamePattern = userMessage.match(/(iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|huawei|nokia|sony)\s*(\d+[a-z]*)/i);
            const exactProductName = productNamePattern
                ? `${productNamePattern[1]} ${productNamePattern[2]}`.toLowerCase()
                : null;
            // Extract keywords for text search
            const keywords = userMessage
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .split(/\s+/)
                .filter((w) => w.length > 2 && !["mình", "cần", "tìm", "cho", "với", "để", "và", "tư", "vấn", "muốn"].includes(w))
                .slice(0, 5)
                .join(" ");
            // Extract price range from message (e.g., "15 triệu", "15tr", "15 million")
            const priceMatch = userMessage.match(/(\d+)\s*(triệu|tr|million|m)/i);
            // Step 1: Try exact match first (if we found a product name pattern)
            let exactMatchProducts = [];
            if (exactProductName) {
                const exactFilter = {
                    isActive: true,
                    $or: [
                        { name: { $regex: exactProductName, $options: "i" } },
                        { name: { $regex: exactProductName.replace(/\s+/g, ""), $options: "i" } }, // "iphone17"
                    ],
                };
                if (priceMatch) {
                    const priceValue = parseInt(priceMatch[1]) * 1000000;
                    exactFilter.price = { $lte: priceValue * 1.2, $gte: priceValue * 0.7 };
                }
                exactMatchProducts = await ProductModal_1.default.find(exactFilter)
                    .populate({
                    path: "images",
                    select: "url publicId _id",
                })
                    .populate({
                    path: "shopId",
                    select: "name logo rating _id",
                })
                    .populate({
                    path: "categoryId",
                    select: "name slug _id",
                })
                    .limit(10)
                    .sort({ price: priceMatch ? 1 : -1, createdAt: -1 })
                    .lean();
            }
            // Step 2: If exact match found, return it (prioritize exact matches)
            if (exactMatchProducts.length > 0) {
                return exactMatchProducts;
            }
            // Step 3: Fallback to broader search
            const filter = { isActive: true };
            if (priceMatch) {
                const priceValue = parseInt(priceMatch[1]) * 1000000;
                filter.price = { $lte: priceValue * 1.2, $gte: priceValue * 0.7 };
            }
            // Use regex for more precise matching
            if (keywords) {
                // Try to match product name more accurately
                const searchTerms = keywords.split(/\s+/).filter(t => t.length > 1);
                if (searchTerms.length > 0) {
                    // Build regex pattern that requires all terms to be present
                    const regexPattern = searchTerms.map(term => `(?=.*${term})`).join('') + '.*';
                    filter.$or = [
                        { name: { $regex: regexPattern, $options: "i" } },
                        { name: { $regex: keywords, $options: "i" } },
                    ];
                }
                else {
                    filter.$text = { $search: keywords };
                }
            }
            // Search products
            const products = await ProductModal_1.default.find(filter)
                .populate({
                path: "images",
                select: "url publicId _id",
            })
                .populate({
                path: "shopId",
                select: "name logo rating _id",
            })
                .populate({
                path: "categoryId",
                select: "name slug _id",
            })
                .limit(10)
                .lean();
            // Rank products by relevance (exact matches in name first)
            if (keywords && products.length > 0) {
                const searchTerms = keywords.toLowerCase().split(/\s+/);
                products.sort((a, b) => {
                    const aName = (a.name || "").toLowerCase();
                    const bName = (b.name || "").toLowerCase();
                    // Count how many search terms match in product name
                    const aMatches = searchTerms.filter(term => aName.includes(term)).length;
                    const bMatches = searchTerms.filter(term => bName.includes(term)).length;
                    // Also check if product name starts with search term (higher priority)
                    const aStartsWith = searchTerms.some(term => aName.startsWith(term)) ? 1 : 0;
                    const bStartsWith = searchTerms.some(term => bName.startsWith(term)) ? 1 : 0;
                    // Sort by: starts with match > number of matches > price (if priceMatch)
                    if (aStartsWith !== bStartsWith) {
                        return bStartsWith - aStartsWith;
                    }
                    if (aMatches !== bMatches) {
                        return bMatches - aMatches;
                    }
                    if (priceMatch) {
                        return a.price - b.price;
                    }
                    return 0;
                });
            }
            return products || [];
        }
        catch (error) {
            console.error("[AI] Product search failed:", error);
            return [];
        }
    }
    /**
     * Search shops based on user message
     * Extracts keywords and searches for relevant shops
     */
    async searchShopsForChat(userMessage) {
        try {
            const filter = {
                isActive: true,
                status: "active",
            };
            // Extract keywords for text search
            const keywords = userMessage
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .split(/\s+/)
                .filter((w) => w.length > 2 && !["mình", "cần", "tìm", "cho", "với", "để", "và", "shop", "cửa", "hàng"].includes(w))
                .slice(0, 5)
                .join(" ");
            if (keywords) {
                filter.$or = [
                    { name: { $regex: keywords, $options: "i" } },
                    { description: { $regex: keywords, $options: "i" } },
                ];
            }
            // Search shops
            const shops = await ShopModel_1.default.find(filter)
                .select("name logo description rating followCount productCount reviewCount isVerified")
                .limit(10)
                .sort({ rating: -1, followCount: -1, productCount: -1 })
                .lean();
            return shops || [];
        }
        catch (error) {
            console.error("[AI] Shop search failed:", error);
            return [];
        }
    }
    /**
     * Search categories based on user message
     */
    async searchCategoriesForChat(userMessage) {
        try {
            const filter = {
                isActive: true,
            };
            // Extract keywords for text search
            const keywords = userMessage
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .split(/\s+/)
                .filter((w) => w.length > 2 && !["mình", "cần", "tìm", "cho", "với", "để", "và", "danh", "mục"].includes(w))
                .slice(0, 5)
                .join(" ");
            if (keywords) {
                filter.$or = [
                    { name: { $regex: keywords, $options: "i" } },
                    { description: { $regex: keywords, $options: "i" } },
                ];
            }
            // Search categories
            const categories = await CategoryModel_1.default.find(filter)
                .select("name description image image_Icon slug")
                .limit(10)
                .sort({ order_display: 1, name: 1 })
                .lean();
            return categories || [];
        }
        catch (error) {
            console.error("[AI] Category search failed:", error);
            return [];
        }
    }
    /**
     * Get current date in Vietnamese format
     */
    getCurrentDateVietnamese() {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const dayNames = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
        const dayName = dayNames[now.getDay()];
        return `${dayName}, ngày ${day} tháng ${month} năm ${year}`;
    }
    /**
     * Get current date in English format
     */
    getCurrentDateEnglish() {
        const now = new Date();
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dayName = dayNames[now.getDay()];
        const monthName = monthNames[now.getMonth()];
        return `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`;
    }
    /**
     * Build chat prompt with product, shop, and category context
     */
    buildChatPrompt(userMessage, products, shops, categories, conversationHistory, language, isRequestingSuggestions = false) {
        const isVietnamese = language === "vi";
        const currentDate = isVietnamese ? this.getCurrentDateVietnamese() : this.getCurrentDateEnglish();
        let productContext = "";
        if (products.length > 0) {
            productContext = products
                .slice(0, 8)
                .map((p, idx) => {
                const finalPrice = p.price - (p.discount || 0);
                const priceStr = new Intl.NumberFormat("vi-VN").format(finalPrice);
                return `${idx + 1}. ${p.name} - ${priceStr}đ${p.description ? ` - ${p.description.substring(0, 100)}...` : ""}`;
            })
                .join("\n");
        }
        let shopContext = "";
        if (shops.length > 0) {
            shopContext = shops
                .slice(0, 5)
                .map((s, idx) => {
                const ratingStr = s.rating ? `⭐ ${s.rating.toFixed(1)}` : "";
                const verifiedStr = s.isVerified ? "✓ Đã xác thực" : "";
                return `${idx + 1}. ${s.name}${ratingStr ? ` - ${ratingStr}` : ""}${verifiedStr ? ` - ${verifiedStr}` : ""}${s.description ? ` - ${s.description.substring(0, 80)}...` : ""}`;
            })
                .join("\n");
        }
        let categoryContext = "";
        if (categories.length > 0) {
            categoryContext = categories
                .slice(0, 5)
                .map((c, idx) => {
                return `${idx + 1}. ${c.name}${c.description ? ` - ${c.description.substring(0, 80)}...` : ""}`;
            })
                .join("\n");
        }
        const historyContext = conversationHistory
            .slice(-4) // Last 4 messages
            .map((msg) => `${msg.role === "user" ? "Khách hàng" : "Bạn"}: ${msg.content}`)
            .join("\n");
        const suggestionInstruction = isRequestingSuggestions
            ? `\n\n**QUAN TRỌNG**: Khách hàng đang YÊU CẦU gợi ý/xem danh sách sản phẩm/cửa hàng. Hãy trả lời và hệ thống sẽ hiển thị danh sách các sản phẩm/cửa hàng phù hợp.`
            : `\n\n**QUAN TRỌNG**: Khách hàng đang TƯ VẤN/HỎI THÔNG TIN, KHÔNG yêu cầu xem danh sách. Hãy chỉ trả lời bằng text tư vấn, KHÔNG đề xuất hiển thị danh sách sản phẩm/cửa hàng. Tập trung vào việc tư vấn, giải đáp thắc mắc, so sánh, đưa ra lời khuyên.`;
        return isVietnamese
            ? `Bạn là nhân viên tư vấn bán hàng thân thiện và chuyên nghiệp của một nền tảng thương mại điện tử.

**THÔNG TIN QUAN TRỌNG VỀ THỜI GIAN:**
Hôm nay là: ${currentDate}
Khi khách hàng hỏi về ngày tháng hoặc thời gian, hãy sử dụng thông tin này. KHÔNG sử dụng thông tin ngày tháng từ training data cũ.

Khách hàng hỏi: "${userMessage}"

${historyContext ? `Lịch sử hội thoại gần đây:\n${historyContext}\n\n` : ""}${isRequestingSuggestions && productContext ? `Danh sách sản phẩm hiện có (đã được lọc phù hợp với yêu cầu):\n${productContext}\n\n` : ""}${isRequestingSuggestions && shopContext ? `Danh sách cửa hàng uy tín:\n${shopContext}\n\n` : ""}${isRequestingSuggestions && categoryContext ? `Danh sách danh mục sản phẩm:\n${categoryContext}\n\n` : ""}Yêu cầu QUAN TRỌNG:
1. Trả lời tự nhiên, thân thiện như đang tư vấn trực tiếp
2. **CHỈ giới thiệu các sản phẩm CHÍNH XÁC phù hợp với yêu cầu của khách hàng**. Ví dụ: nếu khách hỏi "iPhone 17" thì CHỈ giới thiệu iPhone 17, KHÔNG giới thiệu iPhone 15, iPhone 16 hay các model khác.
${isRequestingSuggestions ? `3. Khách hàng đang YÊU CẦU gợi ý/xem danh sách. Hãy trả lời và hệ thống sẽ hiển thị danh sách sản phẩm/cửa hàng phù hợp.` : `3. Khách hàng đang TƯ VẤN/HỎI THÔNG TIN, KHÔNG yêu cầu xem danh sách. Hãy chỉ trả lời bằng text tư vấn, KHÔNG đề xuất hiển thị danh sách. Tập trung vào việc tư vấn, giải đáp thắc mắc, so sánh, đưa ra lời khuyên.`}
4. Nếu có sản phẩm phù hợp CHÍNH XÁC, hãy giới thiệu cụ thể (tên, giá, lý do phù hợp)${isRequestingSuggestions ? ` và chỉ hiển thị những sản phẩm đó` : `. Chỉ mô tả bằng text, không đề xuất hiển thị danh sách`}.
5. Nếu không có sản phẩm CHÍNH XÁC phù hợp (ví dụ: hỏi iPhone 17 nhưng chỉ có iPhone 15), hãy thông báo rõ ràng và gợi ý sản phẩm tương tự gần nhất, giải thích tại sao.
6. Nếu khách hàng hỏi về cửa hàng hoặc muốn tìm shop${isRequestingSuggestions ? `, hãy gợi ý các cửa hàng uy tín từ danh sách trên` : `, hãy tư vấn bằng text, không đề xuất hiển thị danh sách`}.
7. Nếu khách hàng hỏi về danh mục hoặc loại sản phẩm${isRequestingSuggestions ? `, hãy gợi ý các danh mục phù hợp` : `, hãy tư vấn bằng text`}.
8. Nếu không có sản phẩm/cửa hàng/danh mục phù hợp, hãy gợi ý các tiêu chí khác hoặc hỏi thêm thông tin
9. Luôn tập trung vào lợi ích của khách hàng
10. Trả lời ngắn gọn, dễ hiểu (khoảng 3-5 câu)
${suggestionInstruction}

Hãy trả lời:`
            : `You are a friendly and professional sales consultant for an e-commerce platform.

**IMPORTANT TIME INFORMATION:**
Today is: ${currentDate}
When customers ask about dates or time, use this information. DO NOT use date information from old training data.

Customer asks: "${userMessage}"

${historyContext ? `Recent conversation history:\n${historyContext}\n\n` : ""}${isRequestingSuggestions && productContext ? `Available products (filtered to match request):\n${productContext}\n\n` : ""}${isRequestingSuggestions && shopContext ? `Trusted shops:\n${shopContext}\n\n` : ""}${isRequestingSuggestions && categoryContext ? `Product categories:\n${categoryContext}\n\n` : ""}IMPORTANT Requirements:
1. Respond naturally and friendly as if consulting directly
2. **ONLY recommend products that EXACTLY match the customer's request**. For example: if customer asks for "iPhone 17", ONLY recommend iPhone 17, NOT iPhone 15, iPhone 16 or other models.
${isRequestingSuggestions ? `3. Customer is REQUESTING suggestions/viewing list. Respond and the system will display the list of products/shops.` : `3. Customer is CONSULTING/ASKING FOR INFORMATION, NOT requesting to view list. Only respond with text consultation, DO NOT suggest displaying product/shop lists. Focus on consulting, answering questions, comparing, giving advice.`}
4. If there are EXACTLY matching products, introduce them specifically (name, price, why suitable)${isRequestingSuggestions ? ` and only show those products` : `. Only describe in text, do not suggest displaying list`}.
5. If no EXACTLY matching products exist (e.g., asking for iPhone 17 but only iPhone 15 available), clearly inform and suggest the closest similar product, explaining why.
6. If customer asks about shops or wants to find a shop${isRequestingSuggestions ? `, suggest trusted shops from the list above` : `, consult in text, do not suggest displaying list`}.
7. If customer asks about categories or product types${isRequestingSuggestions ? `, suggest suitable categories` : `, consult in text`}.
8. If no suitable products/shops/categories, suggest other criteria or ask for more information
9. Always focus on customer benefits
10. Keep response concise and easy to understand (about 3-5 sentences)
${isRequestingSuggestions ? `\n\n**IMPORTANT**: Customer is REQUESTING suggestions/viewing list. Respond and the system will display the list of matching products/shops.` : `\n\n**IMPORTANT**: Customer is CONSULTING/ASKING FOR INFORMATION, NOT requesting to view list. Only respond with text consultation, DO NOT suggest displaying product/shop lists.`}

Please respond:`;
    }
    /**
     * Generate chat response using Gemini
     */
    async generateChatWithGemini(prompt, language) {
        if (!this.geminiClient) {
            throw new Error("Gemini client not initialized");
        }
        try {
            const currentDate = language === "vi" ? this.getCurrentDateVietnamese() : this.getCurrentDateEnglish();
            const systemPrompt = language === "vi"
                ? `Bạn là nhân viên tư vấn bán hàng thân thiện, chuyên nghiệp. Trả lời tự nhiên, tập trung vào lợi ích khách hàng.\n\n**LƯU Ý QUAN TRỌNG:** Hôm nay là ${currentDate}. Khi trả lời về ngày tháng, hãy sử dụng thông tin này.`
                : `You are a friendly, professional sales consultant. Respond naturally, focusing on customer benefits.\n\n**IMPORTANT NOTE:** Today is ${currentDate}. When answering about dates, use this information.`;
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            const response = await this.geminiClient.models.generateContent({
                model: GEMINI_MODEL,
                contents: fullPrompt,
                config: {
                    temperature: 0.7,
                },
            });
            return response.text?.trim() || "";
        }
        catch (error) {
            // Try fallback models
            if (error?.status === 404 || error?.statusCode === 404) {
                for (const fallbackModel of GEMINI_FALLBACK_MODELS) {
                    if (fallbackModel === GEMINI_MODEL)
                        continue;
                    try {
                        const currentDate = language === "vi" ? this.getCurrentDateVietnamese() : this.getCurrentDateEnglish();
                        const systemPrompt = language === "vi"
                            ? `Bạn là nhân viên tư vấn bán hàng thân thiện, chuyên nghiệp.\n\n**LƯU Ý:** Hôm nay là ${currentDate}.`
                            : `You are a friendly, professional sales consultant.\n\n**NOTE:** Today is ${currentDate}.`;
                        const fullPrompt = `${systemPrompt}\n\n${prompt}`;
                        const response = await this.geminiClient.models.generateContent({
                            model: fallbackModel,
                            contents: fullPrompt,
                            config: { temperature: 0.7 },
                        });
                        const text = response.text?.trim();
                        if (text)
                            return text;
                    }
                    catch (e) {
                        continue;
                    }
                }
            }
            throw error;
        }
    }
    /**
     * Generate chat response using OpenAI
     */
    async generateChatWithOpenAI(prompt, language) {
        if (!this.openaiClient) {
            throw new Error("OpenAI client not initialized");
        }
        const currentDate = language === "vi" ? this.getCurrentDateVietnamese() : this.getCurrentDateEnglish();
        const systemPrompt = language === "vi"
            ? `Bạn là nhân viên tư vấn bán hàng thân thiện, chuyên nghiệp. Trả lời tự nhiên, tập trung vào lợi ích khách hàng.\n\n**LƯU Ý QUAN TRỌNG:** Hôm nay là ${currentDate}. Khi trả lời về ngày tháng, hãy sử dụng thông tin này.`
            : `You are a friendly, professional sales consultant. Respond naturally, focusing on customer benefits.\n\n**IMPORTANT NOTE:** Today is ${currentDate}. When answering about dates, use this information.`;
        const completion = await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: 0.7,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt },
            ],
        });
        return completion.choices?.[0]?.message?.content?.trim() || "";
    }
    /**
     * Generate fallback chat response when AI is unavailable
     */
    generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions = false) {
        const isVietnamese = language === "vi";
        // Determine response type
        const hasProducts = products.length > 0;
        const hasShops = shops.length > 0;
        const hasCategories = categories.length > 0;
        let responseType = "text";
        const typeCount = [hasProducts, hasShops, hasCategories].filter(Boolean).length;
        if (typeCount > 1) {
            responseType = "mixed";
        }
        else if (hasProducts) {
            responseType = "product";
        }
        else if (hasShops) {
            responseType = "shop";
        }
        else if (hasCategories) {
            responseType = "category";
        }
        if (products.length === 0 && shops.length === 0 && categories.length === 0) {
            return {
                response: isVietnamese
                    ? "Xin chào! Tôi có thể giúp bạn tìm sản phẩm hoặc cửa hàng phù hợp. Bạn có thể cho tôi biết thêm về nhu cầu của bạn không?"
                    : "Hello! I can help you find suitable products or shops. Could you tell me more about your needs?",
                responseType,
                provider: "fallback",
            };
        }
        let response = "";
        if (hasProducts && hasShops) {
            const topProduct = products[0];
            const topShop = shops[0];
            const finalPrice = topProduct.price - (topProduct.discount || 0);
            const priceStr = new Intl.NumberFormat("vi-VN").format(finalPrice);
            response = isVietnamese
                ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy sản phẩm "${topProduct.name}" với giá ${priceStr}đ từ cửa hàng "${topShop.name}" có thể phù hợp. Bạn có muốn xem thêm chi tiết không?`
                : `Hello! Based on your request, I found "${topProduct.name}" priced at ${priceStr}đ from "${topShop.name}" that might suit you. Would you like to see more details?`;
        }
        else if (hasProducts) {
            const topProduct = products[0];
            const finalPrice = topProduct.price - (topProduct.discount || 0);
            const priceStr = new Intl.NumberFormat("vi-VN").format(finalPrice);
            // Check if user asked for specific product
            const productNamePattern = userMessage.match(/(iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|huawei|nokia|sony)\s*(\d+[a-z]*)/i);
            if (productNamePattern) {
                const requestedProduct = `${productNamePattern[1]} ${productNamePattern[2]}`.toLowerCase();
                const productName = (topProduct.name || "").toLowerCase();
                // Check if it's an exact match
                if (productName.includes(requestedProduct) || productName.includes(requestedProduct.replace(/\s+/g, ""))) {
                    // Exact match
                    response = isVietnamese
                        ? `Dạ vâng, em rất vui vì đã tìm thấy sản phẩm "${topProduct.name}" với giá ${priceStr}đ mà anh/chị đang quan tâm rồi ạ!`
                        : `Yes, I'm happy to have found "${topProduct.name}" priced at ${priceStr}đ that you're interested in!`;
                }
                else {
                    // Not exact match - suggest closest
                    response = isVietnamese
                        ? `Xin lỗi, hiện tại chúng em chưa có sản phẩm "${requestedProduct}" mà anh/chị yêu cầu. Tuy nhiên, em có thể gợi ý sản phẩm tương tự "${topProduct.name}" với giá ${priceStr}đ. Anh/chị có muốn xem thêm chi tiết không ạ?`
                        : `Sorry, we currently don't have "${requestedProduct}" that you requested. However, I can suggest a similar product "${topProduct.name}" priced at ${priceStr}đ. Would you like to see more details?`;
                }
            }
            else {
                // General product search
                response = isVietnamese
                    ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy sản phẩm "${topProduct.name}" với giá ${priceStr}đ có thể phù hợp. Bạn có muốn xem thêm chi tiết không?`
                    : `Hello! Based on your request, I found "${topProduct.name}" priced at ${priceStr}đ that might suit you. Would you like to see more details?`;
            }
        }
        else if (hasShops) {
            const topShop = shops[0];
            response = isVietnamese
                ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy cửa hàng "${topShop.name}" có thể phù hợp. Bạn có muốn xem thêm chi tiết không?`
                : `Hello! Based on your request, I found shop "${topShop.name}" that might suit you. Would you like to see more details?`;
        }
        else if (hasCategories) {
            const topCategory = categories[0];
            response = isVietnamese
                ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy danh mục "${topCategory.name}" có thể phù hợp. Bạn có muốn xem các sản phẩm trong danh mục này không?`
                : `Hello! Based on your request, I found category "${topCategory.name}" that might suit you. Would you like to see products in this category?`;
        }
        return {
            response,
            suggestedProducts: products.slice(0, 3).map((p) => ({
                _id: p._id.toString(),
                name: p.name,
                price: p.price,
                finalPrice: p.price - (p.discount || 0),
                images: p.images?.slice(0, 1) || [],
                shop: p.shopId ? {
                    name: p.shopId.name || "",
                    _id: p.shopId._id?.toString() || "",
                } : undefined,
            })),
            suggestedShops: isRequestingSuggestions && shops.length > 0 ? shops.slice(0, 3).map((s) => ({
                _id: s._id.toString(),
                name: s.name,
                logo: s.logo,
                description: s.description,
                rating: s.rating || 0,
                followCount: s.followCount || 0,
                productCount: s.productCount || 0,
                reviewCount: s.reviewCount || 0,
                isVerified: s.isVerified || false,
            })) : undefined,
            suggestedCategories: isRequestingSuggestions && categories.length > 0 ? categories.slice(0, 3).map((c) => ({
                _id: c._id.toString(),
                name: c.name,
                description: c.description,
                image: c.image_Icon?.url || c.image?.[0]?.url,
                productCount: c.productCount || 0,
                slug: c.slug,
            })) : undefined,
            responseType: isRequestingSuggestions ? responseType : "text",
            provider: "fallback",
        };
    }
    async generateProductComparison(dto) {
        const payload = this.normalizeComparisonPayload(dto);
        const prompt = this.buildComparisonPrompt(payload);
        if (this.geminiClient) {
            try {
                return await this.generateComparisonWithGemini(prompt, payload);
            }
            catch (error) {
                console.error("[AI] Gemini comparison failed, trying next provider.", error);
            }
        }
        if (this.openaiClient) {
            try {
                return await this.generateComparisonWithOpenAI(prompt, payload);
            }
            catch (error) {
                console.error("[AI] OpenAI comparison failed, using fallback.", error);
            }
        }
        return this.generateComparisonFallback(payload);
    }
    normalizeComparisonPayload(dto) {
        const language = dto.language === "en" ? "en" : "vi";
        const context = dto.context === "compare-page" ? "compare-page" : "product-detail";
        if (!Array.isArray(dto.products) || dto.products.length < 2) {
            throw new Error("At least 2 products are required for comparison");
        }
        const products = dto.products
            .filter((product) => Boolean(product?._id && product?.name))
            .slice(0, 2)
            .map((product) => ({
            id: String(product._id),
            name: product.name,
            brand: product.brand,
            category: product.category,
            subCategory: product.subCategory,
            price: typeof product.price === "number"
                ? product.price
                : product.price
                    ? Number(product.price)
                    : undefined,
            finalPrice: typeof product.finalPrice === "number"
                ? product.finalPrice
                : product.finalPrice
                    ? Number(product.finalPrice)
                    : product.price
                        ? Number(product.price)
                        : undefined,
            rating: typeof product.rating === "number"
                ? product.rating
                : product.rating
                    ? Number(product.rating)
                    : undefined,
            reviewCount: typeof product.reviewCount === "number"
                ? product.reviewCount
                : product.reviewCount
                    ? Number(product.reviewCount)
                    : undefined,
            highlights: Array.isArray(product.highlights)
                ? product.highlights
                    .filter((item) => typeof item === "string")
                    .slice(0, 8)
                : [],
            specs: product.specs
                ? Object.entries(product.specs).reduce((acc, [key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        acc[key] = String(value);
                    }
                    return acc;
                }, {})
                : undefined,
            meta: product.meta
                ? Object.entries(product.meta).reduce((acc, [key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        acc[key] = String(value);
                    }
                    return acc;
                }, {})
                : undefined,
            images: Array.isArray(product.images)
                ? product.images
                    .filter((img) => typeof img === "string")
                    .slice(0, 3)
                : undefined,
            extra: product.extra,
        }));
        if (products.length < 2) {
            throw new Error("Valid products not found for comparison");
        }
        return { products, language, context };
    }
    buildComparisonPrompt(payload) {
        const languageLabel = payload.language === "en" ? "English" : "Vietnamese";
        const contextNote = payload.context === "compare-page"
            ? "User is on the comparison page reviewing both products."
            : "User is viewing the primary product detail page and wants AI advice about another product.";
        const productJson = JSON.stringify(payload.products, null, 2);
        return `
${contextNote}
Respond strictly in ${languageLabel}.

Product data (JSON):
${productJson}

Instructions:
1. Compare the products focusing on strengths, weaknesses, and ideal use cases.
2. Output ONLY valid JSON with this schema:
{
  "summary": "string",
  "prosCons": {
    "<productId>": { "pros": ["string"], "cons": ["string"] }
  },
  "audienceFit": {
    "<productId>": { "title": "string", "description": "string" }
  },
  "verdict": "string",
  "tips": ["string"]
}
3. Use the provided product IDs as keys.
4. Keep tone friendly, concise (max 5 sentences per section).
5. Do not include markdown or explanations outside the JSON object.
`;
    }
    async generateComparisonWithGemini(prompt, payload) {
        if (!this.geminiClient) {
            throw new Error("Gemini client not initialized");
        }
        const response = await this.geminiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
                temperature: 0.6,
            },
        });
        const content = response.text?.trim() || "";
        const parsed = this.parseComparisonOutput(content);
        const shaped = this.ensureComparisonShape(parsed, payload);
        return { ...shaped, provider: "gemini" };
    }
    async generateComparisonWithOpenAI(prompt, payload) {
        if (!this.openaiClient) {
            throw new Error("OpenAI client not initialized");
        }
        const systemMessage = payload.language === "en"
            ? "You are an expert shopping assistant. Always respond with valid JSON only."
            : "Bạn là trợ lý mua sắm chuyên nghiệp. Luôn trả JSON hợp lệ.";
        const completion = await this.openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            temperature: 0.65,
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt },
            ],
        });
        const content = completion.choices?.[0]?.message?.content?.trim() || "";
        const parsed = this.parseComparisonOutput(content);
        const shaped = this.ensureComparisonShape(parsed, payload);
        return { ...shaped, provider: "openai" };
    }
    parseComparisonOutput(raw) {
        if (!raw)
            return undefined;
        const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonStart = cleaned.indexOf("{");
        const candidate = jsonStart >= 0 ? cleaned.slice(jsonStart) : cleaned;
        try {
            return JSON.parse(candidate);
        }
        catch {
            const match = candidate.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                }
                catch {
                    return undefined;
                }
            }
            return undefined;
        }
    }
    ensureComparisonShape(parsed, payload) {
        const summary = typeof parsed?.summary === "string" && parsed.summary.trim().length > 0
            ? parsed.summary.trim()
            : this.buildComparisonSummary(payload);
        const prosCons = {};
        payload.products.forEach((product) => {
            const source = parsed?.prosCons?.[product.id];
            const pros = Array.isArray(source?.pros)
                ? source.pros
                    .filter((item) => typeof item === "string" && item.trim().length > 0)
                    .map((item) => item.trim())
                : [];
            const cons = Array.isArray(source?.cons)
                ? source.cons
                    .filter((item) => typeof item === "string" && item.trim().length > 0)
                    .map((item) => item.trim())
                : [];
            prosCons[product.id] = {
                pros: pros.length > 0
                    ? pros.slice(0, 5)
                    : [`${product.name} mang lại trải nghiệm ổn định cho nhu cầu hàng ngày.`],
                cons: cons.length > 0
                    ? cons.slice(0, 5)
                    : [`${product.name} cần cân nhắc ngân sách và nhu cầu thực tế trước khi mua.`],
            };
        });
        const audienceFit = {};
        payload.products.forEach((product) => {
            const source = parsed?.audienceFit?.[product.id];
            let title;
            let description;
            if (source) {
                if (typeof source === "string") {
                    title = source;
                }
                else {
                    title = typeof source.title === "string" ? source.title : undefined;
                    description =
                        typeof source.description === "string" ? source.description : undefined;
                }
            }
            if (!title) {
                title =
                    payload.language === "en"
                        ? `${product.name} suits users prioritizing stability`
                        : `${product.name} phù hợp với người dùng cần máy ổn định`;
            }
            if (!description) {
                description =
                    payload.language === "en"
                        ? "Great for daily tasks, social apps and casual media consumption."
                        : "Phù hợp cho nhu cầu hằng ngày, ứng dụng mạng xã hội và giải trí nhẹ.";
            }
            audienceFit[product.id] = {
                title,
                description,
            };
        });
        const verdict = typeof parsed?.verdict === "string" && parsed.verdict.trim().length > 0
            ? parsed.verdict.trim()
            : this.buildComparisonVerdict(payload);
        const tips = Array.isArray(parsed?.tips) && parsed.tips.length > 0
            ? parsed.tips
                .filter((tip) => typeof tip === "string" && tip.trim().length > 0)
                .map((tip) => tip.trim())
                .slice(0, 6)
            : [
                payload.language === "en"
                    ? "Decide whether battery endurance or camera performance matters more to you."
                    : "Hãy xác định ưu tiên giữa pin bền hay camera trước khi chốt lựa chọn.",
            ];
        return {
            summary,
            prosCons,
            audienceFit,
            verdict,
            tips,
        };
    }
    buildComparisonSummary(payload) {
        const [a, b] = payload.products;
        const priceA = this.formatMoney(a.finalPrice ?? a.price);
        const priceB = this.formatMoney(b.finalPrice ?? b.price);
        if (payload.language === "en") {
            return `Quick recap: ${a.name} (${priceA}) focuses on consistency while ${b.name} (${priceB}) leans toward all-day endurance and productivity.`;
        }
        return `Tóm tắt nhanh: ${a.name} (${priceA}) thiên về độ ổn định và trải nghiệm mượt, trong khi ${b.name} (${priceB}) nổi bật về pin và khả năng làm việc cả ngày.`;
    }
    buildComparisonVerdict(payload) {
        const [a, b] = payload.products;
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (payload.language === "en") {
            if (ratingA > ratingB) {
                return `${a.name} is the safer pick if you trust user ratings, while ${b.name} wins when long battery life matters more.`;
            }
            if (ratingB > ratingA) {
                return `${b.name} is favored by reviewers, but ${a.name} still shines for those who prefer polished camera processing.`;
            }
            return `Choose ${a.name} for tighter software ecosystem, and ${b.name} if you value longevity and multitasking.`;
        }
        if (ratingA > ratingB) {
            return `${a.name} là lựa chọn an toàn hơn nếu bạn ưu tiên đánh giá người dùng, còn ${b.name} vẫn ghi điểm ở thời lượng pin.`;
        }
        if (ratingB > ratingA) {
            return `${b.name} được người dùng đánh giá cao hơn, nhưng ${a.name} lại phù hợp với ai thích trải nghiệm camera trau chuốt.`;
        }
        return `Chọn ${a.name} nếu muốn hệ sinh thái tối ưu, chọn ${b.name} khi cần pin bền và đa nhiệm cả ngày.`;
    }
    generateComparisonFallback(payload) {
        const base = this.ensureComparisonShape(undefined, payload);
        return { ...base, provider: "fallback" };
    }
    formatMoney(value) {
        if (value === undefined || Number.isNaN(value)) {
            return "—";
        }
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(value);
    }
    async visualSearchByImage(dto) {
        if (!this.geminiClient) {
            throw new Error("Visual search requires Gemini Vision. Please configure GEMINI_API_KEY.");
        }
        if (!dto.image || typeof dto.image !== "string") {
            throw new Error("Image data is required for visual search");
        }
        const cleanBase64 = this.stripBase64Prefix(dto.image);
        const mimeType = dto.mimeType || this.extractMimeType(dto.image) || "image/jpeg";
        const language = dto.language === "en" ? "en" : "vi";
        const instruction = language === "vi"
            ? "Mô tả sản phẩm chính trong bức ảnh này bằng 3 cụm từ ngắn gọn (ví dụ: bàn phím cơ, màu hồng, layout 87 phím). Chỉ trả về danh sách từ khóa, không kèm câu dài."
            : "Describe the main product in this image using 3 concise keywords (e.g., mechanical keyboard, pink keycaps, 87 layout). Return only the keywords, no long sentences.";
        const response = await this.geminiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: instruction },
                        {
                            inlineData: {
                                data: cleanBase64,
                                mimeType,
                            },
                        },
                    ],
                },
            ],
            config: { temperature: 0.4 },
        });
        const rawDescription = response.text?.trim() || "";
        const keywords = this.normalizeKeywords(rawDescription);
        const products = await this.findProductsByKeywords(keywords, dto.limit);
        return {
            keywords,
            rawDescription,
            products,
            provider: "gemini",
        };
    }
    stripBase64Prefix(data) {
        return data.replace(/^data:.+;base64,/, "");
    }
    extractMimeType(data) {
        const match = data.match(/^data:(.+);base64,/);
        return match?.[1];
    }
    normalizeKeywords(raw) {
        if (!raw)
            return [];
        return raw
            .split(/[\n,|/-]+/)
            .map((word) => word
            .replace(/[*•\-]/g, "")
            .replace(/\s+/g, " ")
            .trim())
            .filter((word) => word.length > 0)
            .slice(0, 6);
    }
    async findProductsByKeywords(keywords, limit = 8) {
        if (!keywords.length)
            return [];
        const searchTerm = keywords.join(" ");
        try {
            const textResults = await ProductModal_1.default.find({ $text: { $search: searchTerm } }, { score: { $meta: "textScore" } })
                .sort({ score: { $meta: "textScore" } })
                .limit(limit)
                .lean();
            if (textResults.length > 0) {
                return textResults;
            }
        }
        catch (error) {
            console.warn("[Visual Search] Text search failed, fallback to regex", error);
        }
        const regex = new RegExp(keywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
        return ProductModal_1.default.find({ name: regex }).limit(limit).lean();
    }
}
exports.aiService = new AiService();
exports.default = exports.aiService;
