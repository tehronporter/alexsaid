import { getBrandConfig, productIDSchema, type ProductID } from "@/domain/product";

export function resolveProductID(value = process.env.SAID_PRODUCT): ProductID {
  if (!value?.trim()) return "alex";
  return productIDSchema.parse(value.trim().toLocaleLowerCase());
}

export const activeProductID = resolveProductID();
export const activeBrand = getBrandConfig(activeProductID);
export const isLeilaProduct = activeProductID === "leila";
