import mongoose from "mongoose";
import AttributeTypeModel from "../../src/models/AttributeType";
import AttributeValueModel from "../../src/models/AttributeValue";
import { humanizeCode, slugify } from "../../src/shared/utils/slugify";

type VariantAttributes = Array<{
  attributes?: Record<string, string>;
}>;

export type AttributeCollector = Map<
  string,
  Map<
    string,
    {
      code: string;
      displayName: string;
      values: Set<string>;
    }
  >
>;

const ATTRIBUTE_LABEL_OVERRIDES: Record<string, string> = {
  color: "Màu sắc",
  mau: "Màu sắc",
  mau_sac: "Màu sắc",
  storage: "Dung lượng",
  dung_luong: "Dung lượng",
  capacity: "Dung lượng",
  ram: "Bộ nhớ RAM",
  rom: "Bộ nhớ trong",
  size: "Kích thước",
  kich_thuoc: "Kích thước",
  cong_suat: "Công suất",
  cong_suât: "Công suất",
  day: "Loại dây",
};

function getAttributeDisplayName(code: string, rawKey?: string) {
  if (ATTRIBUTE_LABEL_OVERRIDES[code]) return ATTRIBUTE_LABEL_OVERRIDES[code];
  if (rawKey) {
    const normalizedRaw = rawKey
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalizedRaw) {
      return normalizedRaw
        .split(" ")
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(" ");
    }
  }
  return humanizeCode(code);
}

export function collectVariantAttributes(
  collector: AttributeCollector,
  categoryId: mongoose.Types.ObjectId,
  variants?: VariantAttributes
) {
  if (!variants || variants.length === 0) return;
  const categoryKey = categoryId.toString();
  if (!collector.has(categoryKey)) {
    collector.set(categoryKey, new Map());
  }
  const attributeMap = collector.get(categoryKey)!;

  variants.forEach((variant) => {
    if (!variant || !variant.attributes) return;
    Object.entries(variant.attributes).forEach(([rawKey, value]) => {
      if (!rawKey || value === undefined || value === null) return;
      const code = slugify(rawKey, { separator: "_" }) || slugify(humanizeCode(rawKey), { separator: "_" });
      if (!code) return;
      const normalizedValue = String(value).trim();
      if (!normalizedValue) return;

      if (!attributeMap.has(code)) {
        attributeMap.set(code, {
          code,
          displayName: getAttributeDisplayName(code, rawKey),
          values: new Set<string>(),
        });
      }
      attributeMap.get(code)!.values.add(normalizedValue);
    });
  });
}

export async function syncCollectedVariantAttributes(collector: AttributeCollector) {
  for (const [categoryId, attrMap] of collector.entries()) {
    for (const attr of attrMap.values()) {
      let attributeType = await AttributeTypeModel.findOne({
        categoryId,
        code: attr.code,
      });

      if (!attributeType) {
        attributeType = await AttributeTypeModel.create({
          categoryId,
          code: attr.code,
          name: attr.displayName,
          isActive: true,
          is_multiple: attr.values.size > 1,
          inputType: attr.values.size > 1 ? "select" : "text",
          helperText: `Tự động sinh từ seed (${attr.code})`,
        } as any);
        console.log(
          `✨ Created attribute type "${attr.displayName}" (${attr.code}) for category ${categoryId}`
        );
      }

      const existingValues = await AttributeValueModel.find({
        attributeTypeId: attributeType._id,
      });
      const existingValueSet = new Set(existingValues.map((v) => v.value));
      let sortOrder = existingValues.length;

      for (const value of attr.values) {
        if (existingValueSet.has(value)) continue;
        sortOrder += 1;
        await AttributeValueModel.create({
          attributeTypeId: attributeType._id,
          value,
          label: value,
          sortOrder,
          isActive: true,
        } as any);
        console.log(
          `  ▸ Added value "${value}" to attribute "${attr.displayName}" (${attr.code})`
        );
      }
    }
  }
}

