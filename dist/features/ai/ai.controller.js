"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.visualSearchController = exports.generateProductComparisonController = exports.generateChatResponseController = exports.generateProductMetaController = exports.generateProductDescriptionController = void 0;
const response_util_1 = require("../../shared/utils/response.util");
const ai_service_1 = require("./ai.service");
const normalizeSpecsInput = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return Object.entries(value).reduce((acc, [key, val]) => {
        if (val != null && val !== "") {
            acc[key] = String(val);
        }
        return acc;
    }, {});
};
const generateProductDescriptionController = async (req, res) => {
    try {
        const { productName, tone, language, keywords } = req.body;
        const specs = normalizeSpecsInput(req.body?.specs);
        if (!productName || typeof productName !== "string") {
            return response_util_1.ResponseUtil.validationError(res, [
                { field: "productName", message: "Tên sản phẩm là bắt buộc" },
            ]);
        }
        const result = await ai_service_1.aiService.generateProductDescription({
            productName,
            tone,
            language,
            keywords,
            specs,
        });
        // Normalize response: only return content and provider
        const normalizedResult = {
            content: result.content,
            provider: result.provider,
        };
        const providerMessages = {
            gemini: "AI product description generated (Google Gemini)",
            openai: "AI product description generated (OpenAI)",
            fallback: "AI fallback description generated",
        };
        return response_util_1.ResponseUtil.success(res, normalizedResult, providerMessages[result.provider] || "AI product description generated", 200);
    }
    catch (error) {
        console.error("[AI] Controller error", error);
        return response_util_1.ResponseUtil.internalServerError(res, "Không thể tạo mô tả sản phẩm. Vui lòng thử lại sau.");
    }
};
exports.generateProductDescriptionController = generateProductDescriptionController;
const generateProductMetaController = async (req, res) => {
    try {
        const { productName, specs, category, language } = req.body;
        const normalizedSpecs = normalizeSpecsInput(specs);
        if (!productName || typeof productName !== "string") {
            return response_util_1.ResponseUtil.validationError(res, [
                { field: "productName", message: "Tên sản phẩm là bắt buộc" },
            ]);
        }
        const result = await ai_service_1.aiService.generateProductMeta({
            productName,
            specs: normalizedSpecs,
            category,
            language,
        });
        const providerMessages = {
            gemini: "AI meta information generated (Google Gemini)",
            openai: "AI meta information generated (OpenAI)",
            fallback: "AI fallback meta information generated",
        };
        return response_util_1.ResponseUtil.success(res, result, providerMessages[result.provider] || "AI meta information generated", 200);
    }
    catch (error) {
        console.error("[AI] Meta controller error", error);
        return response_util_1.ResponseUtil.internalServerError(res, "Không thể tạo thông tin meta. Vui lòng thử lại sau.");
    }
};
exports.generateProductMetaController = generateProductMetaController;
const generateChatResponseController = async (req, res) => {
    try {
        const { message, conversationHistory, language } = req.body;
        if (!message || typeof message !== "string" || !message.trim()) {
            return response_util_1.ResponseUtil.validationError(res, [
                { field: "message", message: "Tin nhắn là bắt buộc" },
            ]);
        }
        // Validate conversation history format
        let normalizedHistory;
        if (conversationHistory) {
            if (!Array.isArray(conversationHistory)) {
                return response_util_1.ResponseUtil.validationError(res, [
                    { field: "conversationHistory", message: "Lịch sử hội thoại phải là mảng" },
                ]);
            }
            normalizedHistory = conversationHistory
                .filter((msg) => msg &&
                typeof msg === "object" &&
                (msg.role === "user" || msg.role === "assistant") &&
                typeof msg.content === "string")
                .map((msg) => ({
                role: msg.role,
                content: msg.content.trim(),
            }))
                .filter((msg) => msg.content.length > 0)
                .slice(-10); // Limit to last 10 messages
        }
        const result = await ai_service_1.aiService.generateChatResponse({
            message: message.trim(),
            conversationHistory: normalizedHistory,
            language: language || "vi",
        });
        const providerMessages = {
            gemini: "AI chat response generated (Google Gemini)",
            openai: "AI chat response generated (OpenAI)",
            fallback: "AI fallback chat response generated",
        };
        return response_util_1.ResponseUtil.success(res, result, providerMessages[result.provider] || "AI chat response generated", 200);
    }
    catch (error) {
        console.error("[AI] Chat controller error", error);
        return response_util_1.ResponseUtil.internalServerError(res, "Không thể tạo phản hồi chat. Vui lòng thử lại sau.");
    }
};
exports.generateChatResponseController = generateChatResponseController;
const generateProductComparisonController = async (req, res) => {
    try {
        const { products, language, context } = req.body;
        if (!Array.isArray(products) || products.length < 2) {
            return response_util_1.ResponseUtil.validationError(res, [
                {
                    field: "products",
                    message: "Vui lòng cung cấp ít nhất 2 sản phẩm để so sánh",
                },
            ]);
        }
        const result = await ai_service_1.aiService.generateProductComparison({
            products,
            language,
            context,
        });
        const successMessage = result.provider === "gemini"
            ? "AI comparison generated (Gemini)"
            : result.provider === "openai"
                ? "AI comparison generated (OpenAI)"
                : "AI fallback comparison generated";
        return response_util_1.ResponseUtil.success(res, result, successMessage, 200);
    }
    catch (error) {
        console.error("[AI] Comparison controller error", error);
        return response_util_1.ResponseUtil.internalServerError(res, "Không thể so sánh sản phẩm lúc này. Vui lòng thử lại sau.");
    }
};
exports.generateProductComparisonController = generateProductComparisonController;
const visualSearchController = async (req, res) => {
    try {
        const { image, mimeType, limit, language } = req.body;
        if (!image || typeof image !== "string") {
            return response_util_1.ResponseUtil.validationError(res, [
                { field: "image", message: "Vui lòng tải ảnh sản phẩm (base64 hoặc data URL)" },
            ]);
        }
        const result = await ai_service_1.aiService.visualSearchByImage({
            image,
            mimeType,
            limit,
            language,
        });
        return response_util_1.ResponseUtil.success(res, result, "Visual search completed", 200);
    }
    catch (error) {
        console.error("[AI] Visual search controller error", error);
        return response_util_1.ResponseUtil.internalServerError(res, error instanceof Error ? error.message : "Không thể tìm kiếm bằng hình ảnh lúc này.");
    }
};
exports.visualSearchController = visualSearchController;
