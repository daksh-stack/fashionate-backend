import axios from "axios";
import { rankresults } from "./aiService.js";

// --- Helper: extract structured fields from one item ---
function extractFashionFields(item) {
  let productData = {
    title: item.title || "",
    link: item.link || "",
    snippet: item.snippet || "",
    price: null,
    size: null,
    color: null,
    brand: null,
    material: null,
  };

  // ✅ 1. Structured metadata (pagemap)
  if (item.pagemap) {
    if (item.pagemap.product && item.pagemap.product[0]) {
      const prod = item.pagemap.product[0];
      productData.color = prod.color || productData.color;
      productData.size = prod.size || productData.size;
      productData.brand = prod.brand || productData.brand;
      productData.material = prod.material || productData.material;
    }
    if (item.pagemap.offer && item.pagemap.offer[0]) {
      const offer = item.pagemap.offer[0];
      if (offer.price) {
        productData.price =
          (offer.priceCurrency ? `${offer.priceCurrency} ` : "₹") + offer.price;
      }
    }
  }

  // ✅ 2. Regex fallback (title first, then snippet)
  const textTitle = (item.title || "").toLowerCase();
  const textSnippet = (item.snippet || "").toLowerCase();

  // Price
  let priceMatch =
    textTitle.match(/(?:₹|rs\.?\s?|inr\s?|usd\s?\$?\s?)(\d+[,.]?\d*)/i) ||
    textSnippet.match(/(?:₹|rs\.?\s?|inr\s?|usd\s?\$?\s?)(\d+[,.]?\d*)/i);
  if (priceMatch) productData.price = priceMatch[0];

  // Size
  const sizeMatch =
    textTitle.match(/\b(xs|s|m|l|xl|xxl|\d{2})\b/i) ||
    textSnippet.match(/\b(xs|s|m|l|xl|xxl|\d{2})\b/i);
  if (sizeMatch) productData.size = sizeMatch[0];

  // Color
  const colorMatch =
    textTitle.match(
      /\b(black|white|red|blue|green|yellow|pink|purple|brown|grey|gray|orange)\b/i
    ) ||
    textSnippet.match(
      /\b(black|white|red|blue|green|yellow|pink|purple|brown|grey|gray|orange)\b/i
    );
  if (colorMatch) productData.color = colorMatch[0];

  return productData;
}

// --- Main Google Search function ---
export const googleSearch = async (query) => {
  try {
    const apiKey = process.env.CSE_API;
    const cx = process.env.SEARCH_ENGINE_ID;
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      query
    )}&key=${apiKey}&cx=${cx}`;

    const { data } = await axios.get(url);
    const items = data.items || [];

    // Extract structured fields
    const products = items.map(extractFashionFields);

    // AI cleanup / ranking
    const ranked = await rankresults(query, products);

    // Final clean JSON output
    return ranked.map((p) => ({
      title: p.title,
      link: p.link,
      price: p.price || "N/A",
      size: p.size || "N/A",
      color: p.color || "N/A",
      brand: p.brand || "N/A",
      material: p.material || "N/A",
    }));
  } catch (error) {
    console.log("error in googleServices", error.message);
    throw new Error("Internal server error");
  }
};
