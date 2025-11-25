export type AiTone = "default" | "marketing" | "technical" | "casual";
export type AiContentType = "description" | "keywords" | "warranty" | "highlights";

export interface GenerateProductDescriptionDto {
  productName: string;
  specs?: Record<string, string>;
  tone?: AiTone;
  language?: string;
  keywords?: string[];
}

export interface GenerateProductMetaDto {
  productName: string;
  specs?: Record<string, string>;
  category?: string;
  language?: string;
}

export interface AiProductDescriptionMeta {
  keywords: string[];
  seoTitle: string;
  metaDescription: string;
}

export interface AiProductDescriptionResult {
  content: string;
  outline: string[];
  meta: AiProductDescriptionMeta;
  provider: "openai" | "gemini" | "fallback";
}

export interface AiProductMetaResult {
  keywords: string[];
  warrantyInfo?: string;
  highlights?: string[];
  provider: "openai" | "gemini" | "fallback";
}

export interface GenerateChatResponseDto {
  message: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  language?: string;
}

export interface AiChatResponse {
  response: string;
  suggestedProducts?: Array<{
    _id: string;
    name: string;
    price: number;
    finalPrice: number;
    images?: Array<{ url: string }>;
    shop?: { name: string; _id: string };
  }>;
  suggestedShops?: Array<{
    _id: string;
    name: string;
    logo?: string;
    description?: string;
    rating?: number;
    followCount?: number;
    productCount?: number;
    reviewCount?: number;
    isVerified?: boolean;
  }>;
  suggestedCategories?: Array<{
    _id: string;
    name: string;
    description?: string;
    image?: string;
    productCount?: number;
    slug?: string;
  }>;
  responseType?: "text" | "product" | "shop" | "category" | "mixed";
  provider: "openai" | "gemini" | "fallback";
}

export interface ComparisonProductDto {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  price?: number;
  finalPrice?: number;
  rating?: number;
  reviewCount?: number;
  highlights?: string[];
  specs?: Record<string, string | number>;
  meta?: Record<string, string | number>;
  images?: string[];
  extra?: Record<string, unknown>;
}

export type AiComparisonContext = "product-detail" | "compare-page";

export interface GenerateProductComparisonDto {
  products: ComparisonProductDto[];
  language?: string;
  context?: AiComparisonContext;
}

export interface AiComparisonResponse {
  summary: string;
  prosCons?: Record<
    string,
    {
      pros: string[];
      cons: string[];
    }
  >;
  audienceFit?: Record<
    string,
    {
      title: string;
      description?: string;
    }
  >;
  verdict?: string;
  tips?: string[];
  provider: "openai" | "gemini" | "fallback";
}

export interface VisualSearchDto {
  image: string; // base64 data or data URL
  mimeType?: string;
  limit?: number;
  language?: string;
}

export interface VisualSearchResult {
  keywords: string[];
  rawDescription?: string;
  products: any[];
  provider: "gemini" | "fallback";
}

