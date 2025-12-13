import { Request, Response } from "express";
import { ResponseUtil } from "../../shared/utils/response.util";
import { aiService } from "./ai.service";
import type {
  GenerateProductDescriptionDto,
  GenerateProductMetaDto,
  GenerateChatResponseDto,
  GenerateProductComparisonDto,
  VisualSearchDto,
} from "./types";

const normalizeSpecsInput = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (acc: Record<string, string>, [key, val]: [string, unknown]): Record<string, string> => {
      if (val != null && val !== "") {
        acc[key] = String(val);
      }
      return acc;
    },
    {} as Record<string, string>
  );
};

export const generateProductDescriptionController = async (req: Request, res: Response) => {
  try {
    const { productName, tone, language, keywords } = req.body as GenerateProductDescriptionDto;
    const specs = normalizeSpecsInput(req.body?.specs);

    if (!productName || typeof productName !== "string") {
      return ResponseUtil.validationError(res, [
        { field: "productName", message: "Tên sản phẩm là bắt buộc" },
      ]);
    }

    const result = await aiService.generateProductDescription({
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

    const providerMessages: Record<string, string> = {
      gemini: "AI product description generated (Google Gemini)",
      openai: "AI product description generated (OpenAI)",
      fallback: "AI fallback description generated",
    };

    return ResponseUtil.success(
      res,
      normalizedResult,
      providerMessages[result.provider] || "AI product description generated",
      200
    );
  } catch (error) {
    console.error("[AI] Controller error", error);
    return ResponseUtil.internalServerError(
      res,
      "Không thể tạo mô tả sản phẩm. Vui lòng thử lại sau."
    );
  }
};

export const generateProductMetaController = async (
  req: Request,
  res: Response
) => {
  try {
    const { productName, specs, category, language } =
      req.body as GenerateProductMetaDto;
    const normalizedSpecs = normalizeSpecsInput(specs);

    if (!productName || typeof productName !== "string") {
      return ResponseUtil.validationError(res, [
        { field: "productName", message: "Tên sản phẩm là bắt buộc" },
      ]);
    }

    const result = await aiService.generateProductMeta({
      productName,
      specs: normalizedSpecs,
      category,
      language,
    });

    const providerMessages: Record<string, string> = {
      gemini: "AI meta information generated (Google Gemini)",
      openai: "AI meta information generated (OpenAI)",
      fallback: "AI fallback meta information generated",
    };

    return ResponseUtil.success(
      res,
      result,
      providerMessages[result.provider] || "AI meta information generated",
      200
    );
  } catch (error) {
    console.error("[AI] Meta controller error", error);
    return ResponseUtil.internalServerError(
      res,
      "Không thể tạo thông tin meta. Vui lòng thử lại sau."
    );
  }
};

export const generateChatResponseController = async (
  req: Request,
  res: Response
) => {
  try {
    const { message, conversationHistory, language } =
      req.body as GenerateChatResponseDto;

    if (!message || typeof message !== "string" || !message.trim()) {
      return ResponseUtil.validationError(res, [
        { field: "message", message: "Tin nhắn là bắt buộc" },
      ]);
    }

    // Validate conversation history format
    let normalizedHistory: Array<{ role: "user" | "assistant"; content: string }> | undefined;
    if (conversationHistory) {
      if (!Array.isArray(conversationHistory)) {
        return ResponseUtil.validationError(res, [
          { field: "conversationHistory", message: "Lịch sử hội thoại phải là mảng" },
        ]);
      }
      
      normalizedHistory = conversationHistory
        .filter((msg) => 
          msg && 
          typeof msg === "object" &&
          (msg.role === "user" || msg.role === "assistant") &&
          typeof msg.content === "string"
        )
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content.trim(),
        }))
        .filter((msg) => msg.content.length > 0)
        .slice(-10); // Limit to last 10 messages
    }

    const result = await aiService.generateChatResponse({
      message: message.trim(),
      conversationHistory: normalizedHistory,
      language: language || "vi",
    });

    const providerMessages: Record<string, string> = {
      gemini: "AI chat response generated (Google Gemini)",
      openai: "AI chat response generated (OpenAI)",
      fallback: "AI fallback chat response generated",
    };

    return ResponseUtil.success(
      res,
      result,
      providerMessages[result.provider] || "AI chat response generated",
      200
    );
  } catch (error) {
    console.error("[AI] Chat controller error", error);
    return ResponseUtil.internalServerError(
      res,
      "Không thể tạo phản hồi chat. Vui lòng thử lại sau."
    );
  }
};

export const generateProductComparisonController = async (
  req: Request,
  res: Response
) => {
  try {
    const { products, language, context } = req.body as GenerateProductComparisonDto;

    if (!Array.isArray(products) || products.length < 2) {
      return ResponseUtil.validationError(res, [
        {
          field: "products",
          message: "Vui lòng cung cấp ít nhất 2 sản phẩm để so sánh",
        },
      ]);
    }

    const result = await aiService.generateProductComparison({
      products,
      language,
      context,
    });

    const successMessage =
      result.provider === "gemini"
        ? "AI comparison generated (Gemini)"
        : result.provider === "openai"
          ? "AI comparison generated (OpenAI)"
          : "AI fallback comparison generated";

    return ResponseUtil.success(res, result, successMessage, 200);
  } catch (error) {
    console.error("[AI] Comparison controller error", error);
    return ResponseUtil.internalServerError(
      res,
      "Không thể so sánh sản phẩm lúc này. Vui lòng thử lại sau."
    );
  }
};

export const visualSearchController = async (req: Request, res: Response) => {
  try {
    const { image, mimeType, limit, language } = req.body as VisualSearchDto;

    if (!image || typeof image !== "string") {
      return ResponseUtil.validationError(res, [
        { field: "image", message: "Vui lòng tải ảnh sản phẩm (base64 hoặc data URL)" },
      ]);
    }

    const result = await aiService.visualSearchByImage({
      image,
      mimeType,
      limit,
      language,
    });

    return ResponseUtil.success(
      res,
      result,
      "Visual search completed",
      200
    );
  } catch (error) {
    console.error("[AI] Visual search controller error", error);
    return ResponseUtil.internalServerError(
      res,
      error instanceof Error ? error.message : "Không thể tìm kiếm bằng hình ảnh lúc này."
    );
  }
};

