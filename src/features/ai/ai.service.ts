import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import ProductModel from "../../models/ProductModal";
import ShopModel from "../../models/ShopModel";
import CategoryModel from "../../models/CategoryModel";
import OrderModel from "../../models/OrderModel";
import Cart from "../../models/Cart";
import WalletModel from "../../models/WalletModel";
import type {
  AiProductDescriptionResult,
  AiProductMetaResult,
  GenerateProductDescriptionDto,
  GenerateProductMetaDto,
  GenerateChatResponseDto,
  AiChatResponse,
  GenerateProductComparisonDto,
  AiComparisonResponse,
  ComparisonProductDto,
  VisualSearchDto,
  VisualSearchResult,
} from "./types";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL =
  process.env.OPENAI_PRODUCT_MODEL ||
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

const systemPrompt =
  "Bạn là chuyên gia copywriting và SEO chuyên nghiệp trong lĩnh vực thương mại điện tử. " +
  "Hãy viết mô tả sản phẩm hiện đại, thu hút với phong cách marketing đương đại. " +
  "QUAN TRỌNG: Bắt đầu trực tiếp với nội dung về sản phẩm, KHÔNG có phần chào hỏi, giới thiệu bản thân hay câu mở đầu. " +
  "KHÔNG sử dụng dấu '---' để phân cách. " +
  "Sử dụng emoji/icon phù hợp để làm nổi bật thông tin quan trọng, tạo điểm nhấn trực quan. " +
  "Văn phong tự nhiên, chia thành nhiều đoạn rõ ràng với tiêu đề phụ có icon, " +
  "tập trung vào lợi ích khách hàng và tối ưu SEO. Luôn viết bằng ngôn ngữ được yêu cầu.";

interface NormalizedComparisonProduct {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  finalPrice?: number;
  rating?: number;
  reviewCount?: number;
  highlights: string[];
  specs?: Record<string, string>;
  meta?: Record<string, string>;
  images?: string[];
  extra?: Record<string, unknown>;
}

interface NormalizedComparisonPayload {
  products: NormalizedComparisonProduct[];
  language: "vi" | "en";
  context: "product-detail" | "compare-page";
}

class AiService {
  private openaiClient: OpenAI | null;
  private geminiClient: GoogleGenAI | null;
  private provider: "openai" | "gemini" | "fallback";

  constructor() {
    if (GEMINI_API_KEY) {
      // New SDK automatically picks up GEMINI_API_KEY from env
      this.geminiClient = new GoogleGenAI({});
      this.openaiClient = null;
      this.provider = "gemini";
      console.log("[AI] Using Google Gemini as AI provider");
    } else if (OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
      this.geminiClient = null;
      this.provider = "openai";
      console.log("[AI] Using OpenAI as AI provider");
    } else {
      this.openaiClient = null;
      this.geminiClient = null;
      this.provider = "fallback";
      console.warn(
        "[AI] No AI API key found. Falling back to rule-based generator."
      );
    }
  }

  async generateProductDescription(
    dto: GenerateProductDescriptionDto
  ): Promise<AiProductDescriptionResult> {
    const payload = this.normalizePayload(dto);
    const prompt = this.buildPrompt(payload);

    // Try Gemini first if available
    if (this.geminiClient) {
      try {
        return await this.generateWithGemini(payload, prompt);
      } catch (error) {
        console.error("[AI] Gemini generation failed. Trying fallback.", error);
        return this.generateFallbackResponse(payload);
      }
    }

    // Try OpenAI if available
    if (this.openaiClient) {
      try {
        return await this.generateWithOpenAI(payload, prompt);
      } catch (error) {
        console.error("[AI] OpenAI generation failed. Using fallback.", error);
        return this.generateFallbackResponse(payload);
      }
    }

    // Fallback to rule-based
    return this.generateFallbackResponse(payload);
  }

  private async generateWithGemini(
    payload: GenerateProductDescriptionDto,
    prompt: string
  ): Promise<AiProductDescriptionResult> {
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
    } catch (error: any) {
      // If model not found (404), try fallback models
      if (error?.status === 404 || error?.statusCode === 404) {
        const triedModels = [GEMINI_MODEL];

        for (const fallbackModelName of GEMINI_FALLBACK_MODELS) {
          // Skip if already tried
          if (triedModels.includes(fallbackModelName)) {
            continue;
          }

          console.warn(
            `[AI] Model ${GEMINI_MODEL} not found, trying ${fallbackModelName} as fallback`
          );

          try {
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            const response = await this.geminiClient!.models.generateContent({
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
          } catch (fallbackError: any) {
            console.warn(
              `[AI] Model ${fallbackModelName} also failed:`,
              fallbackError?.status || fallbackError?.message
            );
            triedModels.push(fallbackModelName);
            // Continue to next fallback model
          }
        }

        console.error(
          "[AI] All Gemini models failed. Falling back to rule-based generation."
        );
      }
      throw error;
    }
  }

  private async generateWithOpenAI(
    payload: GenerateProductDescriptionDto,
    prompt: string
  ): Promise<AiProductDescriptionResult> {
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

    const content =
      completion.choices?.[0]?.message?.content?.trim() ||
      this.buildFallbackCopy(payload);

    return {
      content,
      outline: this.buildOutline(content),
      meta: this.buildMeta(content, payload),
      provider: "openai",
    };
  }

  private normalizePayload(
    dto: GenerateProductDescriptionDto
  ): GenerateProductDescriptionDto {
    return {
      productName: dto.productName.trim(),
      specs: this.normalizeSpecs(dto.specs),
      tone: dto.tone || "marketing",
      language: dto.language || "vi",
      keywords: dto.keywords?.filter(Boolean) || [],
    };
  }

  private normalizeSpecs(
    specs?: Record<string, string>
  ): Record<string, string> | undefined {
    if (!specs || typeof specs !== "object" || Array.isArray(specs)) {
      return undefined;
    }
    return Object.entries(specs).reduce<Record<string, string>>(
      (acc: Record<string, string>, [key, value]: [string, string]): Record<string, string> => {
        if (value != null && value !== "") {
          acc[key] = String(value);
        }
        return acc;
      },
      {} as Record<string, string>
    );
  }

  private buildPrompt(dto: GenerateProductDescriptionDto): string {
    const specList: string = dto.specs
      ? Object.entries(dto.specs)
        .map(([key, value]: [string, string]): string => `- ${key}: ${value}`)
        .join("\n")
      : "Không có thông số bổ sung.";

    const tone: string =
      dto.tone === "technical"
        ? "giọng điệu chuyên gia, nhiều thông tin kỹ thuật"
        : dto.tone === "casual"
          ? "giọng điệu gần gũi, thân thiện"
          : "giọng điệu marketing hiện đại, lôi cuốn, trẻ trung";

    return `
Sản phẩm: ${dto.productName}
Giọng văn: ${tone}
Ngôn ngữ: ${dto.language === "vi" ? "Tiếng Việt" : dto.language}
Thông số nổi bật:
${specList}

Yêu cầu QUAN TRỌNG - Tạo mô tả hiện đại và thu hút:
1. BẮT ĐẦU TRỰC TIẾP với nội dung chính về sản phẩm. KHÔNG có phần chào hỏi, giới thiệu bản thân, hay câu mở đầu kiểu "Chào bạn", "Xin chào", "Chuyên gia đây", v.v.
2. KHÔNG sử dụng dấu "---" để phân cách các đoạn. Chỉ sử dụng xuống dòng và tiêu đề phụ.
3. Viết khoảng 4-6 đoạn, mỗi đoạn có tiêu đề phụ với emoji/icon phù hợp (ví dụ: ✨, 🎯, 💎, 🚀, ⚡, 🎁, 🔥, 💪, 🌟, 📱, 🎨, ⭐).
4. Sử dụng emoji một cách thông minh và có chủ đích để:
   - Làm nổi bật điểm mạnh chính (ví dụ: ⚡ cho hiệu năng, 💎 cho chất lượng cao cấp)
   - Tạo điểm nhấn cho lợi ích quan trọng (ví dụ: 🎁 cho ưu đãi, 🔥 cho tính năng hot)
   - Thu hút sự chú ý đến thông tin quan trọng (ví dụ: ⭐ cho đánh giá, 💪 cho độ bền)
5. Nhấn mạnh lợi ích, trải nghiệm người dùng, điểm khác biệt với ngôn ngữ sống động.
6. Sử dụng bullet points với icon khi liệt kê tính năng nổi bật.
7. Kết thúc với lời kêu gọi hành động hấp dẫn, có emoji phù hợp.
8. Tạo cảm giác cấp thiết và giá trị độc quyền.
9. Tránh lạm dụng emoji - chỉ dùng ở những vị trí quan trọng để tăng hiệu quả.

LƯU Ý: Bắt đầu ngay với tiêu đề sản phẩm hoặc đoạn mô tả đầu tiên về sản phẩm, không có phần mở đầu hay chào hỏi.
`;
  }

  private buildOutline(content: string): string[] {
    return content
      .split(/\n+/)
      .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
      .filter((line) => line.length > 0)
      .slice(0, 8);
  }

  private buildMeta(
    content: string,
    dto: GenerateProductDescriptionDto
  ): AiProductDescriptionResult["meta"] {
    const baseKeywords: Set<string> = new Set<string>();
    baseKeywords.add(dto.productName);

    if (dto.specs) {
      Object.values(dto.specs).forEach((value: string): void => {
        baseKeywords.add(value);
      });
    }

    dto.keywords?.forEach((value: string): void => {
      baseKeywords.add(value);
    });

    const plain: string = content.replace(/\s+/g, " ").trim();
    const metaDescription: string = plain.slice(0, 158) + (plain.length > 158 ? "..." : "");

    return {
      keywords: Array.from(baseKeywords).filter(Boolean),
      seoTitle: `${dto.productName} - Chính hãng, giá tốt tại cửa hàng`,
      metaDescription,
    };
  }

  private buildFallbackCopy(dto: GenerateProductDescriptionDto): string {
    const specs: string = dto.specs
      ? Object.entries(dto.specs)
        .map(([key, value]: [string, string]): string => `${key}: ${value}`)
        .join(" • ")
      : "Thông số đang được cập nhật.";

    return `
✨ **${dto.productName}**: Nâng tầm trải nghiệm mỗi ngày

🚀 **Hiệu năng vượt trội**
${specs}

💎 **Thiết kế sang trọng**
Thiết kế hiện đại, tinh tế, dễ dàng thu hút ánh nhìn và tạo ấn tượng mạnh mẽ.

⚡ **Đa năng và tiện ích**
Tối ưu cho công việc, giải trí và chụp ảnh sắc nét. Trải nghiệm hoàn hảo cho mọi nhu cầu.

🛡️ **Bảo hành và hỗ trợ**
Bảo hành chính hãng, hỗ trợ đổi trả linh hoạt. An tâm tuyệt đối khi sử dụng.

🎁 **Đặt mua ngay hôm nay** để nhận ưu đãi độc quyền và dịch vụ hỗ trợ tận tâm!`.trim();
  }

  private generateFallbackResponse(
    dto: GenerateProductDescriptionDto
  ): AiProductDescriptionResult {
    const content = this.buildFallbackCopy(dto);
    return {
      content,
      outline: this.buildOutline(content),
      meta: this.buildMeta(content, dto),
      provider: "fallback",
    };
  }

  async generateProductMeta(
    dto: GenerateProductMetaDto
  ): Promise<AiProductMetaResult> {
    const payload = this.normalizeMetaPayload(dto);
    const prompt = this.buildMetaPrompt(payload);
    const systemPromptMeta =
      "Bạn là chuyên gia SEO và marketing. Hãy tạo từ khóa tìm kiếm, thông tin bảo hành phù hợp cho sản phẩm.";

    // Try Gemini first if available
    if (this.geminiClient) {
      try {
        return await this.generateMetaWithGemini(payload, prompt, systemPromptMeta);
      } catch (error) {
        console.error("[AI] Gemini meta generation failed. Trying fallback.", error);
        return this.generateFallbackMeta(payload);
      }
    }

    // Try OpenAI if available
    if (this.openaiClient) {
      try {
        return await this.generateMetaWithOpenAI(payload, prompt, systemPromptMeta);
      } catch (error) {
        console.error("[AI] OpenAI meta generation failed. Using fallback.", error);
        return this.generateFallbackMeta(payload);
      }
    }

    // Fallback to rule-based
    return this.generateFallbackMeta(payload);
  }

  private async generateMetaWithGemini(
    payload: GenerateProductMetaDto,
    prompt: string,
    systemPrompt: string
  ): Promise<AiProductMetaResult> {
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
    } catch (error: any) {
      // If model not found (404), try fallback models
      if (error?.status === 404 || error?.statusCode === 404) {
        const triedModels = [GEMINI_MODEL];

        for (const fallbackModelName of GEMINI_FALLBACK_MODELS) {
          // Skip if already tried
          if (triedModels.includes(fallbackModelName)) {
            continue;
          }

          console.warn(
            `[AI] Model ${GEMINI_MODEL} not found for meta, trying ${fallbackModelName} as fallback`
          );

          try {
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            const response = await this.geminiClient!.models.generateContent({
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
          } catch (fallbackError: any) {
            console.warn(
              `[AI] Model ${fallbackModelName} also failed for meta:`,
              fallbackError?.status || fallbackError?.message
            );
            triedModels.push(fallbackModelName);
            // Continue to next fallback model
          }
        }

        console.error(
          "[AI] All Gemini models failed for meta. Falling back to rule-based generation."
        );
      }
      throw error;
    }
  }

  private async generateMetaWithOpenAI(
    payload: GenerateProductMetaDto,
    prompt: string,
    systemPrompt: string
  ): Promise<AiProductMetaResult> {
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

  private normalizeMetaPayload(
    dto: GenerateProductMetaDto
  ): GenerateProductMetaDto {
    return {
      productName: dto.productName.trim(),
      specs: this.normalizeSpecs(dto.specs),
      category: dto.category?.trim(),
      language: dto.language || "vi",
    };
  }

  private buildMetaPrompt(dto: GenerateProductMetaDto): string {
    const specList: string = dto.specs
      ? Object.entries(dto.specs)
        .map(([key, value]: [string, string]): string => `${key}: ${value}`)
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

  private parseMetaResponse(
    content: string,
    dto: GenerateProductMetaDto
  ): Omit<AiProductMetaResult, "provider"> {
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
    } catch (error) {
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

  private generateFallbackMeta(
    dto: GenerateProductMetaDto
  ): AiProductMetaResult {
    const baseKeywords: string[] = [dto.productName];
    if (dto.specs) {
      Object.values(dto.specs).forEach((value: string): void => {
        if (value) baseKeywords.push(value);
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
   * Detect what the user is specifically looking for (Products, Shops, or Categories)
   */
  private detectSearchIntent(userMessage: string): { products: boolean, shops: boolean, categories: boolean, orders: boolean, cart: boolean, wallet: boolean, recommend: boolean, deals: boolean, stockCheck: boolean, faq: boolean, support: boolean } {
    const lowerMessage = userMessage.toLowerCase();

    // Explicit keywords
    const shopKeywords = ["shop", "cửa hàng", "gian hàng", "người bán", "tiệm", "địa chỉ mua"];
    const categoryKeywords = ["danh mục", "loại sản phẩm", "nhóm sản phẩm", "thể loại", "ngành hàng", "phân loại"];
    const productKeywords = ["sản phẩm", "mẫu", "chiếc", "cái", "con", "máy", "thiết bị", "đồ", "mua"];

    // System data keywords
    const orderKeywords = ["đơn hàng", "đơn", "order", "mua hàng", "đã đặt", "đặt hàng", "giao hàng", "vận chuyển", "tracking"];
    const cartKeywords = ["giỏ hàng", "cart", "giỏ", "trong giỏ", "đã thêm"];
    const walletKeywords = ["ví", "wallet", "số dư", "balance", "tiền", "nạp tiền", "rút tiền"];

    // Advanced feature keywords
    const recommendKeywords = ["gợi ý", "recommend", "đề xuất", "nên mua", "phù hợp với tôi", "cho tôi", "dành cho tôi"];
    const dealKeywords = ["giá rẻ", "rẻ nhất", "deal", "khuyến mãi", "giảm giá", "sale", "ưu đãi", "tốt nhất"];
    const stockKeywords = ["còn hàng", "hết hàng", "stock", "available", "sẵn hàng", "tồn kho"];
    const faqKeywords = ["làm sao", "how to", "cách", "hướng dẫn", "đổi trả", "hoàn tiền", "thanh toán", "vận chuyển"];
    const supportKeywords = ["hỗ trợ", "support", "help", "liên hệ", "cskh", "customer service", "báo lỗi", "khiếu nại"];

    const isAskingForShop = shopKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForCategory = categoryKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForProduct = productKeywords.some(kw => lowerMessage.includes(kw));

    const isAskingForOrders = orderKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForCart = cartKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForWallet = walletKeywords.some(kw => lowerMessage.includes(kw));

    const isAskingForRecommend = recommendKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForDeals = dealKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForStock = stockKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForFAQ = faqKeywords.some(kw => lowerMessage.includes(kw));
    const isAskingForSupport = supportKeywords.some(kw => lowerMessage.includes(kw));

    // Determine intent based on priority
    let products = false;
    let shops = false;
    let categories = false;
    let orders = false;
    let cart = false;
    let wallet = false;
    let recommend = false;
    let deals = false;
    let stockCheck = false;
    let faq = false;
    let support = false;

    // FAQ and Support have highest priority (instant response)
    if (isAskingForFAQ) {
      faq = true;
      return { products, shops, categories, orders, cart, wallet, recommend, deals, stockCheck, faq, support };
    }

    if (isAskingForSupport) {
      support = true;
      return { products, shops, categories, orders, cart, wallet, recommend, deals, stockCheck, faq, support };
    }

    // System data has higher priority
    if (isAskingForOrders) {
      orders = true;
    }

    if (isAskingForCart) {
      cart = true;
    }

    if (isAskingForWallet) {
      wallet = true;
    }

    // Advanced features
    if (isAskingForRecommend) {
      recommend = true;
    }

    if (isAskingForDeals) {
      deals = true;
    }

    if (isAskingForStock) {
      stockCheck = true;
    }

    // Only search products/shops/categories if not asking for system data or advanced features
    if (!orders && !cart && !wallet && !recommend && !deals && !stockCheck) {
      if (isAskingForShop) {
        shops = true;
      }

      if (isAskingForCategory) {
        categories = true;
      }

      // If user explicitly asks for products, OR if they didn't ask for shop/category but used a brand/model
      const brandModelPattern = /(iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|huawei|nokia|sony|macbook|ipad|laptop|dell|hp|asus|acer|lenovo|msi)/i;
      const hasBrandModel = brandModelPattern.test(lowerMessage);

      if (isAskingForProduct || hasBrandModel || (!isAskingForShop && !isAskingForCategory)) {
        products = true;
        // If user specifically asked for "sản phẩm", we might want to suppress shops/categories 
        // unless they also mentioned them
        if (isAskingForProduct && !isAskingForShop) shops = false;
        if (isAskingForProduct && !isAskingForCategory) categories = false;
      }
    }

    return { products, shops, categories, orders, cart, wallet, recommend, deals, stockCheck, faq, support };
  }

  /**
   * Check if user is requesting suggestions (wants to see product/shop list)
   */
  private isRequestingSuggestions(userMessage: string): boolean {
    const suggestionKeywords = [
      "gợi ý", "gợi ý cho", "cho tôi xem", "xem", "tìm", "tìm cho",
      "hiển thị", "danh sách", "list", "show", "suggest", "recommend",
      "có gì", "có những", "những sản phẩm", "sản phẩm nào", "shop nào",
      "cửa hàng nào", "mua", "muốn mua", "cần mua", "đang tìm mua",
      "tư vấn", "loại nào tốt", "nên mua", "phù hợp", "giá rẻ", "cao cấp",
      "iphone", "samsung", "xiaomi", "oppo", "vivo", "realme", "laptop",
      "điện thoại", "tai nghe", "phụ kiện", "thời trang", "giày", "áo",
      "danh mục", "shop", "cửa hàng"
    ];

    const lowerMessage = userMessage.toLowerCase();

    // Check for explicit keywords
    const hasExplicitKeyword = suggestionKeywords.some(keyword => lowerMessage.includes(keyword));

    // Check for implicit search (e.g., brand + model)
    const brandModelPattern = /(iphone|samsung|xiaomi|oppo|vivo|macbook|ipad|laptop)\s*(\d+[a-z]*|pro|air|ultra|plus|s|x|max)/i;
    const hasBrandModel = brandModelPattern.test(lowerMessage);

    return hasExplicitKeyword || hasBrandModel;
  }

  /**
   * Generate AI chat response with product search (RAG Lite)
   * Searches products based on user message and provides intelligent recommendations
   */
  async generateChatResponse(
    dto: GenerateChatResponseDto
  ): Promise<AiChatResponse> {
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

    // Check if user is requesting suggestions and detect specific intent
    const isRequestingSuggestions = this.isRequestingSuggestions(userMessage);
    const intent = this.detectSearchIntent(userMessage);

    // DEBUG: Log intent detection
    console.log("[AI DEBUG] User message:", userMessage);
    console.log("[AI DEBUG] userId:", dto.userId);
    console.log("[AI DEBUG] Intent detected:", intent);
    console.log("[AI DEBUG] Is requesting suggestions:", isRequestingSuggestions);

    // Step 1: Search products, shops, categories, and system data based on user message
    // Only search what the user actually asked for
    const userId = dto.userId;
    const [products, shops, categories, orders, cart, wallet] = await Promise.all([
      (isRequestingSuggestions && intent.products) ? this.searchProductsForChat(userMessage) : Promise.resolve([]),
      (isRequestingSuggestions && intent.shops) ? this.searchShopsForChat(userMessage) : Promise.resolve([]),
      (isRequestingSuggestions && intent.categories) ? this.searchCategoriesForChat(userMessage) : Promise.resolve([]),
      (userId && intent.orders) ? this.searchOrdersForChat(userId, userMessage) : Promise.resolve([]),
      (userId && intent.cart) ? this.searchCartForChat(userId) : Promise.resolve([]),
      (userId && intent.wallet) ? this.searchWalletForChat(userId) : Promise.resolve(null),
    ]);

    // DEBUG: Log search results
    console.log("[AI DEBUG] Search results:");
    console.log("  - Products:", products.length);
    console.log("  - Shops:", shops.length);
    console.log("  - Categories:", categories.length);
    console.log("  - Orders:", orders?.length || 0);
    console.log("  - Cart items:", cart?.length || 0);
    console.log("  - Wallet:", wallet ? "Found" : "Not found");

    // Step 2: Build prompt with product, shop, category, and system data context
    const prompt = this.buildChatPrompt(userMessage, products, shops, categories, dto.conversationHistory || [], language, isRequestingSuggestions, intent, orders, cart, wallet);

    // Step 3: Generate response using AI
    if (this.provider === "fallback") {
      return this.generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions, orders, cart, wallet);
    }

    try {
      let response: string;

      if (this.provider === "gemini" && this.geminiClient) {
        response = await this.generateChatWithGemini(prompt, language);
      } else if (this.provider === "openai" && this.openaiClient) {
        response = await this.generateChatWithOpenAI(prompt, language);
      } else {
        response = this.generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions, orders, cart, wallet).response;
      }

      // Step 4: Determine final response type and filter suggestions
      let suggestedProducts: any[] = [];
      let suggestedShops: any[] = [];
      let suggestedCategories: any[] = [];

      if (isRequestingSuggestions) {
        // Post-filter products based on AI's response if possible, 
        // or just use the highly ranked ones from searchProductsForChat
        const brandModelPattern = /(iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|huawei|nokia|sony|macbook|ipad|laptop)\s*(\d+[a-z]*|pro|air|ultra|plus|s|x|max)/i;
        const brandMatch = userMessage.match(brandModelPattern);
        const exactBrandModel = brandMatch ? brandMatch[0].toLowerCase() : null;

        let filteredProducts = products;
        if (exactBrandModel) {
          filteredProducts = products.filter((p: any) => {
            const name = (p.name || "").toLowerCase();
            return name.includes(exactBrandModel) || name.includes(exactBrandModel.replace(/\s+/g, ""));
          });

          // If filtering too much, fallback to original top results
          if (filteredProducts.length === 0 && products.length > 0) {
            filteredProducts = products.slice(0, 3);
          }
        }

        suggestedProducts = filteredProducts.slice(0, 5).map((p: any) => ({
          _id: p._id.toString(),
          name: p.name,
          price: p.price,
          finalPrice: p.price - (p.price * (p.discount || 0)) / 100,
          images: p.images?.slice(0, 1).map((img: any) => ({ url: img.url })) || [],
          shop: p.shopId ? {
            name: p.shopId.name || "",
            _id: p.shopId._id?.toString() || "",
          } : undefined,
        }));

        suggestedShops = shops.slice(0, 5).map((s: any) => ({
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

        suggestedCategories = categories.slice(0, 5).map((c: any) => ({
          _id: c._id.toString(),
          name: c.name,
          description: c.description,
          image: c.image_Icon?.url || (Array.isArray(c.image) ? c.image[0]?.url : c.image?.url),
          productCount: c.productCount || 0,
          slug: c.slug,
        }));
      }

      // Determine response type based on what we actually have
      let finalResponseType: "text" | "product" | "shop" | "category" | "mixed" | "order" | "cart" | "wallet" | "system" = "text";

      // Check for system data
      const hasOrders = orders && orders.length > 0;
      const hasCart = cart && cart.length > 0;
      const hasWallet = wallet !== null;

      if (hasOrders || hasCart || hasWallet) {
        const systemDataCount = [hasOrders, hasCart, hasWallet].filter(Boolean).length;
        if (systemDataCount > 1) {
          finalResponseType = "system";
        } else if (hasOrders) {
          finalResponseType = "order";
        } else if (hasCart) {
          finalResponseType = "cart";
        } else if (hasWallet) {
          finalResponseType = "wallet";
        }
      } else if (isRequestingSuggestions) {
        const hasProducts = suggestedProducts.length > 0;
        const hasShops = suggestedShops.length > 0;
        const hasCategories = suggestedCategories.length > 0;
        const typeCount = [hasProducts, hasShops, hasCategories].filter(Boolean).length;

        if (typeCount > 1) {
          finalResponseType = "mixed";
        } else if (hasProducts) {
          finalResponseType = "product";
        } else if (hasShops) {
          finalResponseType = "shop";
        } else if (hasCategories) {
          finalResponseType = "category";
        }
      }

      return {
        response,
        suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : undefined,
        suggestedShops: suggestedShops.length > 0 ? suggestedShops : undefined,
        suggestedCategories: suggestedCategories.length > 0 ? suggestedCategories : undefined,
        orders: hasOrders ? orders : undefined,
        cart: hasCart ? cart : undefined,
        wallet: hasWallet ? wallet : undefined,
        responseType: finalResponseType,
        provider: this.provider,
      };
    } catch (error) {
      console.error("[AI] Chat generation failed. Using fallback.", error);
      return this.generateFallbackChatResponse(userMessage, products, shops, categories, language, isRequestingSuggestions, orders, cart, wallet);
    }
  }

  /**
   * Search products based on user message
   * Extracts keywords like price range, category, features from message
   * Prioritizes exact matches over partial matches
   */
  private async searchProductsForChat(userMessage: string): Promise<any[]> {
    try {
      // Extract product name/model from message
      const brandModelPattern = /(iphone|samsung|xiaomi|oppo|vivo|realme|oneplus|huawei|nokia|sony|macbook|ipad|laptop|dell|hp|asus|acer|lenovo|msi)\s*(\d+[a-z]*|pro|air|ultra|plus|s|x|max|ti|super)?/i;
      const brandMatch = userMessage.match(brandModelPattern);
      const exactBrand = brandMatch ? brandMatch[1].toLowerCase() : null;
      const exactModel = brandMatch && brandMatch[2] ? brandMatch[2].toLowerCase() : null;
      const exactProductName = brandMatch ? `${exactBrand}${exactModel ? ' ' + exactModel : ''}` : null;

      // Extract keywords for text search
      const stopWords = ["mình", "cần", "tìm", "cho", "với", "để", "và", "tư", "vấn", "muốn", "bạn", "shop", "cái", "chiếc", "loại", "nào"];
      const keywords = userMessage
        .toLowerCase()
        .replace(/[^\w\sàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !stopWords.includes(w))
        .slice(0, 7)
        .join(" ");

      console.log("[AI] Product search - exactBrand:", exactBrand);
      console.log("[AI] Product search - exactModel:", exactModel);
      console.log("[AI] Product search - keywords:", keywords);

      // Extract price range from message
      // Matches "15 triệu", "15tr", "dưới 10tr", "tầm 20 triệu", "khoảng 5tr"
      const priceMatch = userMessage.match(/(dưới|trên|tầm|khoảng|đến|-)\s*(\d+)\s*(triệu|tr|trđ|m|k)/i) ||
        userMessage.match(/(\d+)\s*(triệu|tr|trđ|m|k)/i);

      let minPrice = 0;
      let maxPrice = Number.MAX_SAFE_INTEGER;

      if (priceMatch) {
        const value = parseInt(priceMatch[2] || priceMatch[1]);
        const unit = (priceMatch[3] || priceMatch[2]).toLowerCase();
        const multiplier = ["triệu", "tr", "trđ", "m"].some(u => unit.includes(u)) ? 1000000 : 1000;
        const totalValue = value * multiplier;

        const prefix = priceMatch[1] ? priceMatch[1].toLowerCase() : "";
        if (prefix === "dưới") {
          maxPrice = totalValue;
        } else if (prefix === "trên") {
          minPrice = totalValue;
        } else {
          // Range ± 20%
          minPrice = totalValue * 0.8;
          maxPrice = totalValue * 1.2;
        }
      }

      // Step 1: Build filter
      const filter: any = { isActive: true };

      if (minPrice > 0 || maxPrice < Number.MAX_SAFE_INTEGER) {
        filter.price = { $gte: minPrice };
        if (maxPrice < Number.MAX_SAFE_INTEGER) {
          filter.price.$lte = maxPrice;
        }
      }

      // Step 2: Try to match by brand/model first if available
      if (exactBrand) {
        filter.$or = [
          { name: { $regex: exactBrand, $options: "i" } },
          { brand: { $regex: exactBrand, $options: "i" } }
        ];

        if (exactModel) {
          // If we have a model, make it more specific
          const modelRegex = new RegExp(`(?=.*${exactBrand})(?=.*${exactModel})`, "i");
          filter.$or.push({ name: { $regex: modelRegex } });
        }
      } else if (keywords) {
        // Fallback to keyword search
        const searchTerms = keywords.split(/\s+/).filter(t => t.length > 1);
        console.log("[AI] Product search - searchTerms:", searchTerms);

        if (searchTerms.length > 0) {
          // Simple OR search for each term
          filter.$or = searchTerms.flatMap(term => [
            { name: { $regex: term, $options: "i" } },
            { description: { $regex: term, $options: "i" } },
            { brand: { $regex: term, $options: "i" } },
            { category: { $regex: term, $options: "i" } }
          ]);
        }
      }

      console.log("[AI] Product search filter:", JSON.stringify(filter));

      // Step 3: Execute search
      let products = await ProductModel.find(filter)
        .populate({ path: "images", select: "url" })
        .populate({ path: "shopId", select: "name logo rating" })
        .populate({ path: "categoryId", select: "name slug" })
        .limit(20)
        .lean();

      console.log("[AI] Product search - Found products:", products.length);
      if (products.length > 0) {
        console.log("[AI] Product search - First product:", products[0].name);
      }

      // Step 4: Better ranking
      if (products.length > 0) {
        const searchTerms = (exactProductName || keywords).toLowerCase().split(/\s+/);

        products.sort((a: any, b: any) => {
          const aName = (a.name || "").toLowerCase();
          const bName = (b.name || "").toLowerCase();

          // 1. Priority: Exact product name match
          if (exactProductName) {
            const aHasExact = aName.includes(exactProductName);
            const bHasExact = bName.includes(exactProductName);
            if (aHasExact !== bHasExact) return bHasExact ? 1 : -1;
          }

          // 2. Priority: Starts with search terms
          const aStartsWith = searchTerms.some(term => aName.startsWith(term)) ? 1 : 0;
          const bStartsWith = searchTerms.some(term => bName.startsWith(term)) ? 1 : 0;
          if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith;

          // 3. Priority: Number of matching terms
          const aMatches = searchTerms.filter(term => aName.includes(term)).length;
          const bMatches = searchTerms.filter(term => bName.includes(term)).length;
          if (aMatches !== bMatches) return bMatches - aMatches;

          // 4. Priority: Shop rating
          const aRating = a.shopId?.rating || 0;
          const bRating = b.shopId?.rating || 0;
          if (aRating !== bRating) return bRating - aRating;

          // 5. Priority: Discount
          const aDiscount = a.discount || 0;
          const bDiscount = b.discount || 0;
          if (aDiscount !== bDiscount) return bDiscount - aDiscount;

          return 0;
        });
      }

      return products.slice(0, 10);
    } catch (error) {
      console.error("[AI] Product search failed:", error);
      return [];
    }
  }

  /**
   * Search shops based on user message
   * Extracts keywords and searches for relevant shops
   */
  private async searchShopsForChat(userMessage: string): Promise<any[]> {
    try {
      const filter: any = {
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
      const shops = await ShopModel.find(filter)
        .select("name logo description rating followCount productCount reviewCount isVerified")
        .limit(10)
        .sort({ rating: -1, followCount: -1, productCount: -1 })
        .lean();

      return shops || [];
    } catch (error) {
      console.error("[AI] Shop search failed:", error);
      return [];
    }
  }

  /**
   * Search categories based on user message
   */
  private async searchCategoriesForChat(userMessage: string): Promise<any[]> {
    try {
      const filter: any = {
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
      const categories = await CategoryModel.find(filter)
        .select("name description image image_Icon slug")
        .limit(10)
        .sort({ order_display: 1, name: 1 })
        .lean();

      return categories || [];
    } catch (error) {
      console.error("[AI] Category search failed:", error);
      return [];
    }
  }

  /**
   * Search user's orders based on user message and userId
   * Returns recent orders with status information
   */
  private async searchOrdersForChat(userId: string, userMessage?: string): Promise<any[]> {
    try {
      console.log("[AI] searchOrdersForChat called with userId:", userId);
      const filter: any = { userId };

      // Check if user is asking about specific order status
      const lowerMessage = (userMessage || "").toLowerCase();
      const statusKeywords = {
        "chờ xác nhận": "pending",
        "đang xử lý": "processing",
        "đang giao": "shipping",
        "đã giao": "delivered",
        "đã hủy": "cancelled",
        "hoàn thành": "completed",
      };

      for (const [keyword, status] of Object.entries(statusKeywords)) {
        if (lowerMessage.includes(keyword)) {
          filter.status = status;
          break;
        }
      }

      console.log("[AI] Order filter:", filter);

      // Get orders - populate orderItems instead of items.productId
      const orders = await OrderModel.find(filter)
        .populate({
          path: "orderItems",
          populate: {
            path: "productId",
            select: "name images price"
          }
        })
        .populate({ path: "shopId", select: "name logo" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      console.log("[AI] Found orders:", orders.length);
      return orders || [];
    } catch (error) {
      console.error("[AI] Order search failed:", error);
      return [];
    }
  }

  /**
   * Get user's cart items
   */
  private async searchCartForChat(userId: string): Promise<any[]> {
    try {
      console.log("[AI] searchCartForChat called with userId:", userId);
      const cart = await Cart.findOne({ userId })
        .populate({
          path: "cartItems",
          populate: {
            path: "productId",
            select: "name images price discount stock"
          }
        })
        .populate({
          path: "cartItems",
          populate: {
            path: "shopId",
            select: "name logo"
          }
        })
        .lean();

      console.log("[AI] Found cart items:", cart?.cartItems?.length || 0);
      return cart?.cartItems || [];
    } catch (error) {
      console.error("[AI] Cart search failed:", error);
      return [];
    }
  }

  /**
   * Get user's wallet balance
   */
  private async searchWalletForChat(userId: string): Promise<any> {
    try {
      console.log("[AI] searchWalletForChat called with userId:", userId);
      const wallet = await WalletModel.findOne({ userId })
        .select("balance currency")
        .lean();

      console.log("[AI] Found wallet:", wallet ? "Yes" : "No");
      return wallet || null;
    } catch (error) {
      console.error("[AI] Wallet search failed:", error);
      return null;
    }
  }

  /**
   * Get current date in Vietnamese format
   */
  private getCurrentDateVietnamese(): string {
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
  private getCurrentDateEnglish(): string {
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayName = dayNames[now.getDay()];
    const monthName = monthNames[now.getMonth()];

    return `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`;
  }

  /**
   * Build chat prompt with product, shop, category, and system data context
   */
  private buildChatPrompt(
    userMessage: string,
    products: any[],
    shops: any[],
    categories: any[],
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    language: string,
    isRequestingSuggestions: boolean = false,
    intent?: { products: boolean, shops: boolean, categories: boolean, orders: boolean, cart: boolean, wallet: boolean },
    orders?: any[],
    cart?: any[],
    wallet?: any
  ): string {
    const isVietnamese = language === "vi";
    const currentDate = isVietnamese ? this.getCurrentDateVietnamese() : this.getCurrentDateEnglish();

    let productContext = "";
    if (products.length > 0) {
      productContext = products
        .slice(0, 8)
        .map((p: any, idx: number) => {
          const finalPrice = p.price - (p.price * (p.discount || 0)) / 100;
          const priceStr = new Intl.NumberFormat("vi-VN").format(finalPrice);
          return `${idx + 1}. ${p.name} - ${priceStr}đ${p.description ? ` - ${p.description.substring(0, 100)}...` : ""}`;
        })
        .join("\n");
    }

    let shopContext = "";
    if (shops.length > 0) {
      shopContext = shops
        .slice(0, 5)
        .map((s: any, idx: number) => {
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
        .map((c: any, idx: number) => {
          return `${idx + 1}. ${c.name}${c.description ? ` - ${c.description.substring(0, 80)}...` : ""}`;
        })
        .join("\n");
    }

    // System data context
    let systemDataContext = "";
    if (orders && orders.length > 0) {
      const orderSummary = orders.slice(0, 5).map((o: any, idx: number) => {
        const statusMap: any = {
          pending: "Chờ xác nhận",
          processing: "Đang xử lý",
          shipping: "Đang giao",
          shipped: "Đang giao", // Map shipped to "Đang giao"
          delivered: "Đã giao",
          cancelled: "Đã hủy",
          completed: "Hoàn thành"
        };
        const status = statusMap[o.status] || o.status;
        const totalStr = new Intl.NumberFormat("vi-VN").format(o.totalAmount || 0);
        const itemCount = o.orderItems?.length || 0; // Use orderItems instead of items
        return `${idx + 1}. Đơn hàng #${o._id.toString().slice(-6)} - ${status} - ${totalStr}đ - ${itemCount} sản phẩm`;
      }).join("\n");
      systemDataContext += `\n\nĐơn hàng của khách:\n${orderSummary}`;
    }

    if (cart && cart.length > 0) {
      const cartSummary = cart.slice(0, 5).map((item: any, idx: number) => {
        // item is a CartItem with populated productId and shopId
        const product = item.productId;
        const priceStr = product?.price ? new Intl.NumberFormat("vi-VN").format(product.price) : "N/A";
        return `${idx + 1}. ${product?.name || "Sản phẩm"} - SL: ${item.quantity} - ${priceStr}đ`;
      }).join("\n");
      systemDataContext += `\n\nGiỏ hàng hiện tại:\n${cartSummary}`;
    }

    if (wallet) {
      const balanceStr = new Intl.NumberFormat("vi-VN").format(wallet.balance || 0);
      systemDataContext += `\n\nSố dư ví: ${balanceStr}đ`;
    }

    const historyContext = conversationHistory
      .slice(-6) // Last 6 messages for better context
      .map((msg) => `${msg.role === "user" ? "Khách hàng" : "Bạn"}: ${msg.content}`)
      .join("\n");

    let suggestionInstruction = "";
    if (isRequestingSuggestions) {
      let focus = "sản phẩm/cửa hàng/danh mục";
      if (intent) {
        const parts = [];
        if (intent.products) parts.push("sản phẩm");
        if (intent.shops) parts.push("cửa hàng");
        if (intent.categories) parts.push("danh mục");
        if (intent.orders) parts.push("đơn hàng");
        if (intent.cart) parts.push("giỏ hàng");
        if (intent.wallet) parts.push("ví tiền");
        if (parts.length > 0) focus = parts.join("/");
      }

      suggestionInstruction = isVietnamese
        ? `\n\n**QUAN TRỌNG**: Khách hàng đang YÊU CẦU gợi ý hoặc tìm kiếm tập trung vào **${focus}**. Hãy xem xét danh sách đã tìm thấy ở trên và đưa ra lời khuyên phù hợp nhất. TUYỆT ĐỐI KHÔNG giới thiệu loại khác nếu khách đã chỉ định rõ (ví dụ khách hỏi sản phẩm thì đừng giới thiệu shop).`
        : `\n\n**IMPORTANT**: Customer is REQUESTING suggestions/search focusing on **${focus}**. Review the list above and provide the best advice. DO NOT recommend other types if the customer specified clearly (e.g., if they asked for products, don't recommend shops).`;
    } else {
      suggestionInstruction = isVietnamese
        ? `\n\n**QUAN TRỌNG**: Khách hàng đang hỏi thông tin chung hoặc tư vấn. Hãy trả lời bằng văn bản, không cần đề xuất xem danh sách.`
        : `\n\n**IMPORTANT**: Customer is asking for general info or consultation. Respond with text, no need to suggest viewing lists.`;
    }

    return isVietnamese
      ? `Bạn là một trợ lý mua sắm thông minh, thân thiện và am hiểu sản phẩm. 
Nhiệm vụ của bạn là giúp khách hàng tìm được sản phẩm ưng ý nhất trên nền tảng của chúng tôi.

**THÔNG TIN QUẬN TRỌNG VỀ THỜI GIAN:**
Hôm nay là: ${currentDate}

**DỮ LIỆU TÌM KIẾM THỰC TẾ (RAG):**
${productContext ? `Sản phẩm phù hợp tìm thấy:\n${productContext}\n` : ""}${shopContext ? `Cửa hàng uy tín:\n${shopContext}\n` : ""}${categoryContext ? `Danh mục liên quan:\n${categoryContext}\n` : ""}${systemDataContext || ""}

**LỊCH SỬ HỘI THOẠI:**
${historyContext || "Mới bắt đầu cuộc hội thoại."}

Khách hàng hỏi: "${userMessage}"

**NGUYÊN TẮC TRẢ LỜI:**
1. **TRUNG THỰC**: Chỉ giới thiệu những gì có trong dữ liệu tìm kiếm ở trên. Nếu không thấy iPhone 17, đừng bịa ra là có.
2. **CHÍNH XÁC**: Nếu khách hỏi model cụ thể (ví dụ: iPhone 13 Pro Max), hãy ưu tiên giới thiệu đúng model đó. Nếu chỉ có iPhone 13, hãy nói rõ là chúng ta có iPhone 13 và nó gần nhất với yêu cầu.
3. **TỰ NHIÊN**: Trả lời như một người tư vấn thật thụ, không máy móc. Sử dụng ngôn ngữ gần gũi (ví dụ: "Dạ", "Chào bạn", "Theo mình thấy...").
4. **HỖ TRỢ**: Nếu khách hỏi "iPhone nào tốt nhất để chụp ảnh", hãy dựa vào thông tin sản phẩm (nếu có mô tả) hoặc kiến thức chung để tư vấn trong số các sản phẩm chúng ta CÓ.
5. **KÊU GỌI**: Khuyến khích khách hàng xem chi tiết sản phẩm hoặc đặt câu hỏi thêm.
${suggestionInstruction}

Hãy trả lời ngắn gọn (3-5 câu), tập trung vào giá trị:
`
      : `You are an intelligent, friendly, and knowledgeable shopping assistant.
Your mission is to help customers find the best products on our platform.

**IMPORTANT TIME INFORMATION:**
Today is: ${currentDate}

**REAL SEARCH DATA (RAG):**
${productContext ? `Matching products found:\n${productContext}\n` : "No specific products found.\n"}${shopContext ? `Trusted shops:\n${shopContext}\n` : ""}${categoryContext ? `Related categories:\n${categoryContext}\n` : ""}

**CONVERSATION HISTORY:**
${historyContext || "Started a new conversation."}

Customer asks: "${userMessage}"

**RESPONSE PRINCIPLES:**
1. **HONESTY**: Only recommend what is in the search data above. If iPhone 17 is not found, do not make it up.
2. **ACCURACY**: If the customer asks for a specific model (e.g., iPhone 13 Pro Max), prioritize recommending that exact model. If only iPhone 13 is available, clearly state that we have iPhone 13 and it's the closest to their request.
3. **NATURAL**: Respond like a real consultant, not a machine. Use friendly language.
4. **SUPPORTIVE**: If the customer asks "Which iPhone is best for photography?", use product info (if available) or general knowledge to advise among the products we HAVE.
5. **CALL TO ACTION**: Encourage customers to view product details or ask more questions.
${suggestionInstruction}

Please respond concisely (3-5 sentences), focusing on value:
`;
  }

  /**
   * Generate chat response using Gemini
   */
  private async generateChatWithGemini(prompt: string, language: string): Promise<string> {
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
    } catch (error: any) {
      // Try fallback models
      if (error?.status === 404 || error?.statusCode === 404) {
        for (const fallbackModel of GEMINI_FALLBACK_MODELS) {
          if (fallbackModel === GEMINI_MODEL) continue;

          try {
            const currentDate = language === "vi" ? this.getCurrentDateVietnamese() : this.getCurrentDateEnglish();
            const systemPrompt = language === "vi"
              ? `Bạn là nhân viên tư vấn bán hàng thân thiện, chuyên nghiệp.\n\n**LƯU Ý:** Hôm nay là ${currentDate}.`
              : `You are a friendly, professional sales consultant.\n\n**NOTE:** Today is ${currentDate}.`;

            const fullPrompt = `${systemPrompt}\n\n${prompt}`;
            const response = await this.geminiClient!.models.generateContent({
              model: fallbackModel,
              contents: fullPrompt,
              config: { temperature: 0.7 },
            });

            const text = response.text?.trim();
            if (text) return text;
          } catch (e) {
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
  private async generateChatWithOpenAI(prompt: string, language: string): Promise<string> {
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
  private generateFallbackChatResponse(
    userMessage: string,
    products: any[],
    shops: any[],
    categories: any[],
    language: string,
    isRequestingSuggestions: boolean = false,
    orders?: any[],
    cart?: any[],
    wallet?: any
  ): AiChatResponse {
    const isVietnamese = language === "vi";

    // Determine response type
    const hasProducts = products.length > 0;
    const hasShops = shops.length > 0;
    const hasCategories = categories.length > 0;
    const hasOrders = orders && orders.length > 0;
    const hasCart = cart && cart.length > 0;
    const hasWallet = wallet !== null && wallet !== undefined;

    let responseType: "text" | "product" | "shop" | "category" | "mixed" | "order" | "cart" | "wallet" | "system" = "text";

    // System data has priority
    if (hasOrders || hasCart || hasWallet) {
      const systemDataCount = [hasOrders, hasCart, hasWallet].filter(Boolean).length;
      if (systemDataCount > 1) {
        responseType = "system";
      } else if (hasOrders) {
        responseType = "order";
      } else if (hasCart) {
        responseType = "cart";
      } else if (hasWallet) {
        responseType = "wallet";
      }
    } else {
      const typeCount = [hasProducts, hasShops, hasCategories].filter(Boolean).length;
      if (typeCount > 1) {
        responseType = "mixed";
      } else if (hasProducts) {
        responseType = "product";
      } else if (hasShops) {
        responseType = "shop";
      } else if (hasCategories) {
        responseType = "category";
      }
    }

    // Handle system data responses first
    if (hasOrders || hasCart || hasWallet) {
      let response = "";
      if (hasOrders) {
        const orderCount = orders!.length;
        response = isVietnamese
          ? `Dạ, hiện tại bạn có ${orderCount} đơn hàng. Mình đã liệt kê chi tiết bên dưới để bạn xem nhé!`
          : `You currently have ${orderCount} order(s). I've listed the details below for you!`;
      } else if (hasCart) {
        const cartCount = cart!.length;
        response = isVietnamese
          ? `Giỏ hàng của bạn hiện có ${cartCount} sản phẩm. Mình đã hiển thị chi tiết bên dưới ạ!`
          : `Your cart currently has ${cartCount} item(s). I've displayed the details below!`;
      } else if (hasWallet) {
        const balanceStr = new Intl.NumberFormat("vi-VN").format(wallet!.balance || 0);
        response = isVietnamese
          ? `Số dư ví của bạn hiện tại là ${balanceStr}đ ạ.`
          : `Your current wallet balance is ${balanceStr}đ.`;
      }

      return {
        response,
        orders: hasOrders ? orders : undefined,
        cart: hasCart ? cart : undefined,
        wallet: hasWallet ? wallet : undefined,
        responseType,
        provider: "fallback",
      };
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
      const finalPrice = topProduct.price - (topProduct.price * (topProduct.discount || 0)) / 100;
      const priceStr = new Intl.NumberFormat("vi-VN").format(finalPrice);
      response = isVietnamese
        ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy sản phẩm "${topProduct.name}" với giá ${priceStr}đ từ cửa hàng "${topShop.name}" có thể phù hợp. Bạn có muốn xem thêm chi tiết không?`
        : `Hello! Based on your request, I found "${topProduct.name}" priced at ${priceStr}đ from "${topShop.name}" that might suit you. Would you like to see more details?`;
    } else if (hasProducts) {
      const topProduct = products[0];
      const finalPrice = topProduct.price - (topProduct.price * (topProduct.discount || 0)) / 100;
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
        } else {
          // Not exact match - suggest closest
          response = isVietnamese
            ? `Xin lỗi, hiện tại chúng em chưa có sản phẩm "${requestedProduct}" mà anh/chị yêu cầu. Tuy nhiên, em có thể gợi ý sản phẩm tương tự "${topProduct.name}" với giá ${priceStr}đ. Anh/chị có muốn xem thêm chi tiết không ạ?`
            : `Sorry, we currently don't have "${requestedProduct}" that you requested. However, I can suggest a similar product "${topProduct.name}" priced at ${priceStr}đ. Would you like to see more details?`;
        }
      } else {
        // General product search
        response = isVietnamese
          ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy sản phẩm "${topProduct.name}" với giá ${priceStr}đ có thể phù hợp. Bạn có muốn xem thêm chi tiết không?`
          : `Hello! Based on your request, I found "${topProduct.name}" priced at ${priceStr}đ that might suit you. Would you like to see more details?`;
      }
    } else if (hasShops) {
      const topShop = shops[0];
      response = isVietnamese
        ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy cửa hàng "${topShop.name}" có thể phù hợp. Bạn có muốn xem thêm chi tiết không?`
        : `Hello! Based on your request, I found shop "${topShop.name}" that might suit you. Would you like to see more details?`;
    } else if (hasCategories) {
      const topCategory = categories[0];
      response = isVietnamese
        ? `Chào bạn! Dựa trên yêu cầu của bạn, tôi thấy danh mục "${topCategory.name}" có thể phù hợp. Bạn có muốn xem các sản phẩm trong danh mục này không?`
        : `Hello! Based on your request, I found category "${topCategory.name}" that might suit you. Would you like to see products in this category?`;
    }

    return {
      response,
      suggestedProducts: products.slice(0, 3).map((p: any) => ({
        _id: p._id.toString(),
        name: p.name,
        price: p.price,
        finalPrice: p.price - (p.price * (p.discount || 0)) / 100,
        images: p.images?.slice(0, 1) || [],
        shop: p.shopId ? {
          name: p.shopId.name || "",
          _id: p.shopId._id?.toString() || "",
        } : undefined,
      })),
      suggestedShops: isRequestingSuggestions && shops.length > 0 ? shops.slice(0, 3).map((s: any) => ({
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
      suggestedCategories: isRequestingSuggestions && categories.length > 0 ? categories.slice(0, 3).map((c: any) => ({
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

  async generateProductComparison(
    dto: GenerateProductComparisonDto
  ): Promise<AiComparisonResponse> {
    const payload = this.normalizeComparisonPayload(dto);
    const prompt = this.buildComparisonPrompt(payload);

    if (this.geminiClient) {
      try {
        return await this.generateComparisonWithGemini(prompt, payload);
      } catch (error) {
        console.error("[AI] Gemini comparison failed, trying next provider.", error);
      }
    }

    if (this.openaiClient) {
      try {
        return await this.generateComparisonWithOpenAI(prompt, payload);
      } catch (error) {
        console.error("[AI] OpenAI comparison failed, using fallback.", error);
      }
    }

    return this.generateComparisonFallback(payload);
  }

  private normalizeComparisonPayload(
    dto: GenerateProductComparisonDto
  ): NormalizedComparisonPayload {
    const language = dto.language === "en" ? "en" : "vi";
    const context: "product-detail" | "compare-page" =
      dto.context === "compare-page" ? "compare-page" : "product-detail";

    if (!Array.isArray(dto.products) || dto.products.length < 2) {
      throw new Error("At least 2 products are required for comparison");
    }

    const products = dto.products
      .filter((product): product is ComparisonProductDto => Boolean(product?._id && product?.name))
      .slice(0, 2)
      .map(
        (product: ComparisonProductDto): NormalizedComparisonProduct => ({
          id: String(product._id),
          name: product.name,
          brand: product.brand,
          category: product.category,
          subCategory: product.subCategory,
          price:
            typeof product.price === "number"
              ? product.price
              : product.price
                ? Number(product.price)
                : undefined,
          finalPrice:
            typeof product.finalPrice === "number"
              ? product.finalPrice
              : product.finalPrice
                ? Number(product.finalPrice)
                : product.price
                  ? Number(product.price)
                  : undefined,
          rating:
            typeof product.rating === "number"
              ? product.rating
              : product.rating
                ? Number(product.rating)
                : undefined,
          reviewCount:
            typeof product.reviewCount === "number"
              ? product.reviewCount
              : product.reviewCount
                ? Number(product.reviewCount)
                : undefined,
          highlights: Array.isArray(product.highlights)
            ? product.highlights
              .filter((item): item is string => typeof item === "string")
              .slice(0, 8)
            : [],
          specs: product.specs
            ? Object.entries(product.specs).reduce<Record<string, string>>((acc, [key, value]) => {
              if (value !== undefined && value !== null && value !== "") {
                acc[key] = String(value);
              }
              return acc;
            }, {})
            : undefined,
          meta: product.meta
            ? Object.entries(product.meta).reduce<Record<string, string>>((acc, [key, value]) => {
              if (value !== undefined && value !== null && value !== "") {
                acc[key] = String(value);
              }
              return acc;
            }, {})
            : undefined,
          images: Array.isArray(product.images)
            ? product.images
              .filter((img): img is string => typeof img === "string")
              .slice(0, 3)
            : undefined,
          extra: product.extra,
        })
      );

    if (products.length < 2) {
      throw new Error("Valid products not found for comparison");
    }

    return { products, language, context };
  }

  private buildComparisonPrompt(payload: NormalizedComparisonPayload): string {
    const languageLabel = payload.language === "en" ? "English" : "Vietnamese";
    const contextNote =
      payload.context === "compare-page"
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

  private async generateComparisonWithGemini(
    prompt: string,
    payload: NormalizedComparisonPayload
  ): Promise<AiComparisonResponse> {
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

  private async generateComparisonWithOpenAI(
    prompt: string,
    payload: NormalizedComparisonPayload
  ): Promise<AiComparisonResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const systemMessage =
      payload.language === "en"
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

  private parseComparisonOutput(raw: string) {
    if (!raw) return undefined;
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const candidate = jsonStart >= 0 ? cleaned.slice(jsonStart) : cleaned;
    try {
      return JSON.parse(candidate);
    } catch {
      const match = candidate.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return undefined;
        }
      }
      return undefined;
    }
  }

  private ensureComparisonShape(
    parsed: any,
    payload: NormalizedComparisonPayload
  ): Omit<AiComparisonResponse, "provider"> {
    const summary =
      typeof parsed?.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : this.buildComparisonSummary(payload);

    const prosCons: Record<string, { pros: string[]; cons: string[] }> = {};
    payload.products.forEach((product) => {
      const source = parsed?.prosCons?.[product.id];
      const pros = Array.isArray(source?.pros)
        ? source.pros
          .filter(
            (item: unknown): item is string =>
              typeof item === "string" && item.trim().length > 0
          )
          .map((item: any) => item.trim())
        : [];
      const cons = Array.isArray(source?.cons)
        ? source.cons
          .filter(
            (item: unknown): item is string =>
              typeof item === "string" && item.trim().length > 0
          )
          .map((item: any) => item.trim())
        : [];
      prosCons[product.id] = {
        pros:
          pros.length > 0
            ? pros.slice(0, 5)
            : [`${product.name} mang lại trải nghiệm ổn định cho nhu cầu hàng ngày.`],
        cons:
          cons.length > 0
            ? cons.slice(0, 5)
            : [`${product.name} cần cân nhắc ngân sách và nhu cầu thực tế trước khi mua.`],
      };
    });

    const audienceFit: Record<string, { title: string; description?: string }> = {};
    payload.products.forEach((product) => {
      const source = parsed?.audienceFit?.[product.id];
      let title: string | undefined;
      let description: string | undefined;
      if (source) {
        if (typeof source === "string") {
          title = source;
        } else {
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

    const verdict =
      typeof parsed?.verdict === "string" && parsed.verdict.trim().length > 0
        ? parsed.verdict.trim()
        : this.buildComparisonVerdict(payload);

    const tips =
      Array.isArray(parsed?.tips) && parsed.tips.length > 0
        ? parsed.tips
          .filter(
            (tip: unknown): tip is string =>
              typeof tip === "string" && tip.trim().length > 0
          )
          .map((tip: any) => tip.trim())
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

  private buildComparisonSummary(payload: NormalizedComparisonPayload): string {
    const [a, b] = payload.products;
    const priceA = this.formatMoney(a.finalPrice ?? a.price);
    const priceB = this.formatMoney(b.finalPrice ?? b.price);
    if (payload.language === "en") {
      return `Quick recap: ${a.name} (${priceA}) focuses on consistency while ${b.name} (${priceB}) leans toward all-day endurance and productivity.`;
    }
    return `Tóm tắt nhanh: ${a.name} (${priceA}) thiên về độ ổn định và trải nghiệm mượt, trong khi ${b.name} (${priceB}) nổi bật về pin và khả năng làm việc cả ngày.`;
  }

  private buildComparisonVerdict(payload: NormalizedComparisonPayload): string {
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

  private generateComparisonFallback(
    payload: NormalizedComparisonPayload
  ): AiComparisonResponse {
    const base = this.ensureComparisonShape(undefined, payload);
    return { ...base, provider: "fallback" };
  }

  private formatMoney(value?: number): string {
    if (value === undefined || Number.isNaN(value)) {
      return "—";
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  async visualSearchByImage(dto: VisualSearchDto): Promise<VisualSearchResult> {
    if (!this.geminiClient) {
      throw new Error(
        "Visual search requires Gemini Vision. Please configure GEMINI_API_KEY."
      );
    }

    if (!dto.image || typeof dto.image !== "string") {
      throw new Error("Image data is required for visual search");
    }

    const cleanBase64 = this.stripBase64Prefix(dto.image);
    const mimeType = dto.mimeType || this.extractMimeType(dto.image) || "image/jpeg";
    const language: "vi" | "en" = dto.language === "en" ? "en" : "vi";
    const instruction =
      language === "vi"
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

  private stripBase64Prefix(data: string): string {
    return data.replace(/^data:.+;base64,/, "");
  }

  private extractMimeType(data: string): string | undefined {
    const match = data.match(/^data:(.+);base64,/);
    return match?.[1];
  }

  private normalizeKeywords(raw: string): string[] {
    if (!raw) return [];
    return raw
      .split(/[\n,|/-]+/)
      .map((word) =>
        word
          .replace(/[*•\-]/g, "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((word) => word.length > 0)
      .slice(0, 6);
  }

  private async findProductsByKeywords(
    keywords: string[],
    limit = 8
  ): Promise<any[]> {
    if (!keywords.length) return [];

    const searchTerm = keywords.join(" ");
    try {
      const textResults = await ProductModel.find(
        { $text: { $search: searchTerm } },
        { score: { $meta: "textScore" } }
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();

      if (textResults.length > 0) {
        return textResults;
      }
    } catch (error) {
      console.warn("[Visual Search] Text search failed, fallback to regex", error);
    }

    const regex = new RegExp(
      keywords.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
      "i"
    );

    return ProductModel.find({ name: regex }).limit(limit).lean();
  }
}

export const aiService = new AiService();

export default aiService;

