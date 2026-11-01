import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { URL } from "url";

function isIpAddress(hostname: string) {
  return (
    /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname) || hostname.includes(":")
  );
}

function isInternalUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Block localhost and common internal domains
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname)) return true;
    if (hostname.endsWith(".local") || hostname.endsWith(".internal"))
      return true;

    // Block private IP ranges (generic check for simplicity)
    if (isIpAddress(hostname)) {
      // Very basic private IP check
      if (
        hostname.startsWith("10.") ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("172.")
      ) {
        return true;
      }
    }

    // Only allow http and https
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")
      return true;

    return false;
  } catch (e) {
    return true; // If it's not a valid URL, treat it as dangerous
  }
}

import { verifyIdToken } from "@/lib/auth-edge";
import { z } from "zod";

const scrapeSchema = z.object({
  url: z.string().url("Invalid URL format").min(1, "URL is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Check for session cookie
    const session = request.cookies.get("__session");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the JWT for admin status
    const payload = await verifyIdToken(session.value);
    if (!payload || !payload.admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = scrapeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 },
      );
    }

    const { url } = result.data;

    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      normalizedUrl = `https://${url}`;
    }

    // SSRF Prevention: Validate URL
    if (isInternalUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Invalid or restricted URL provided" },
        { status: 403 },
      );
    }

    // Fetch the webpage
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Debug: Log some basic HTML structure info
    console.log(`Page title: "${$("title").text().trim()}"`);
    console.log(`Number of H1 tags: ${$("h1").length}`);
    console.log(`Number of H2 tags: ${$("h2").length}`);
    console.log(`Number of H3 tags: ${$("h3").length}`);
    console.log(`Number of IMG tags: ${$("img").length}`);

    // Log all H1 tags for debugging
    $("h1").each((i, el) => {
      console.log(`H1[${i}]: "${$(el).text().trim()}"`);
    });

    // Log some image information for debugging
    $("img")
      .slice(0, 10)
      .each((i, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        const alt = $(el).attr("alt") || "";
        const className = $(el).attr("class") || "";
        console.log(
          `IMG[${i}]: src="${src}", alt="${alt}", class="${className}"`,
        );
      });

    // Extract product information based on common selectors
    // This is a generic approach - you may need to customize for specific websites
    const scrapedData: any = {};

    // Website-specific selectors for better accuracy
    const isTunisianet = normalizedUrl.includes("tunisianet.com.tn");
    const isMytek = normalizedUrl.includes("mytek.tn");
    const isJumia = normalizedUrl.includes("jumia.com.tn");
    const isElectroplanet = normalizedUrl.includes("electroplanet.tn");
    const isFnac = normalizedUrl.includes("fnac.tn");

    // Product name - try multiple common selectors with better targeting
    let nameSelectors = [];

    // Website-specific selectors (more targeted)
    if (isTunisianet) {
      nameSelectors = [
        "h1.product-name",
        "h1.product-title",
        ".product-name h1",
        ".product-title h1",
        ".product-info h1",
        ".product-details h1",
        'h1[itemprop="name"]',
        ".product-name",
        ".product-title",
        '[data-testid="product-title"]',
        ".product-header h1",
        ".product-main h1",
      ];
    } else if (isMytek) {
      nameSelectors = [
        "h1.product-title",
        ".product-details h1",
        ".product-title h1",
        'h1[itemprop="name"]',
        ".product-name",
        ".product-title",
        '[data-testid="product-title"]',
        ".product-header h1",
      ];
    } else if (isJumia) {
      nameSelectors = [
        "h1.product-name",
        "h1.product-title",
        ".product-name h1",
        ".product-title h1",
        'h1[itemprop="name"]',
        ".product-name",
        ".product-title",
        '[data-testid="product-title"]',
        ".product-header h1",
      ];
    } else if (isElectroplanet) {
      nameSelectors = [
        "h1.product-title",
        "h1.product-name",
        ".product-title h1",
        ".product-name h1",
        'h1[itemprop="name"]',
        ".product-name",
        ".product-title",
        '[data-testid="product-title"]',
        ".product-header h1",
      ];
    } else if (isFnac) {
      nameSelectors = [
        "h1.product-title",
        "h1.product-name",
        ".product-title h1",
        ".product-name h1",
        'h1[itemprop="name"]',
        ".product-name",
        ".product-title",
        '[data-testid="product-title"]',
        ".product-header h1",
      ];
    } else {
      // Generic selectors for unknown websites
      nameSelectors = [
        'h1[itemprop="name"]',
        "h1.product-title",
        "h1.product-name",
        "h1.title",
        ".product-title h1",
        ".product-name h1",
        ".product-title",
        ".product-name",
        ".title",
        '[data-testid="product-title"]',
        ".product-header h1",
        ".product-main h1",
      ];
    }

    // Try to find the product name
    scrapedData.name = "";
    for (const selector of nameSelectors) {
      const name = $(selector).first().text().trim();
      console.log(`Trying selector "${selector}": "${name}"`);
      if (name && name.length > 3 && name.length < 200) {
        scrapedData.name = name;
        console.log(`Found product name: "${name}"`);
        break;
      }
    }

    // If still no name, try more aggressive selectors
    if (!scrapedData.name) {
      console.log(
        "No name found with specific selectors, trying all H1 tags...",
      );
      // Look for any h1 tag that might contain the product name
      $("h1").each((_, el) => {
        const text = $(el).text().trim();
        console.log(`Found H1 tag: "${text}"`);
        if (
          text &&
          text.length > 3 &&
          text.length < 200 &&
          !text.toLowerCase().includes("home") &&
          !text.toLowerCase().includes("welcome") &&
          !text.toLowerCase().includes("login") &&
          !text.toLowerCase().includes("register")
        ) {
          scrapedData.name = text;
          console.log(`Selected H1 as product name: "${text}"`);
          return false; // break the loop
        }
      });
    }

    // If still no name, try H2 and H3 tags
    if (!scrapedData.name) {
      console.log("No name found in H1 tags, trying H2 and H3...");
      const headings = $("h2, h3");
      headings.each((_, el) => {
        const text = $(el).text().trim();
        console.log(`Found heading tag: "${text}"`);
        if (
          text &&
          text.length > 3 &&
          text.length < 200 &&
          !text.toLowerCase().includes("home") &&
          !text.toLowerCase().includes("welcome") &&
          !text.toLowerCase().includes("login") &&
          !text.toLowerCase().includes("register") &&
          !text.toLowerCase().includes("menu") &&
          !text.toLowerCase().includes("navigation")
        ) {
          scrapedData.name = text;
          console.log(`Selected heading as product name: "${text}"`);
          return false; // break the loop
        }
      });
    }

    // Last resort: look for any element with common product name classes
    if (!scrapedData.name) {
      console.log(
        "No name found in headings, trying common product name classes...",
      );
      const commonNameSelectors = [
        '[class*="product-name"]',
        '[class*="product-title"]',
        '[class*="item-name"]',
        '[class*="goods-name"]',
        '[id*="product-name"]',
        '[id*="product-title"]',
      ];

      for (const selector of commonNameSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          console.log(`Found element with selector "${selector}": "${text}"`);
          if (text && text.length > 3 && text.length < 200) {
            scrapedData.name = text;
            console.log(`Selected element as product name: "${text}"`);
            break;
          }
        }
      }
    }

    // Fallback to meta tags and title
    if (!scrapedData.name) {
      const ogTitle = $('meta[property="og:title"]').attr("content");
      const metaTitle = $('meta[name="title"]').attr("content");
      const pageTitle = $("title").text().trim();

      // Try to find the best title from meta tags
      if (ogTitle && ogTitle.length > 3 && ogTitle.length < 200) {
        scrapedData.name = ogTitle;
      } else if (metaTitle && metaTitle.length > 3 && metaTitle.length < 200) {
        scrapedData.name = metaTitle;
      } else if (pageTitle && pageTitle.length > 3 && pageTitle.length < 200) {
        // Clean up page title (remove site name, etc.)
        let cleanTitle = pageTitle;
        if (cleanTitle.includes("|")) {
          cleanTitle = cleanTitle.split("|")[0].trim();
        }
        if (cleanTitle.includes("-")) {
          cleanTitle = cleanTitle.split("-")[0].trim();
        }
        scrapedData.name = cleanTitle;
      }
    }

    // Product description
    scrapedData.description =
      $(".product-description, .description, .product-details, .product-info")
        .first()
        .text()
        .trim() ||
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    // Price - try multiple common selectors
    let priceSelectors = [
      ".price",
      ".product-price",
      ".current-price",
      ".regular-price",
      ".sale-price",
      "[data-price]",
      ".price-value",
      ".product-price-value",
    ];

    // Website-specific price selectors
    if (isTunisianet) {
      priceSelectors.unshift(
        ".product-price .price",
        ".price-current",
        ".product-info .price",
      );
    } else if (isMytek) {
      priceSelectors.unshift(".product-price .current-price", ".price-value");
    } else if (isJumia) {
      priceSelectors.unshift(".product-price .price", ".price-current");
    } else if (isElectroplanet) {
      priceSelectors.unshift(".product-price .price", ".price-current");
    } else if (isFnac) {
      priceSelectors.unshift(".product-price .price", ".price-current");
    }

    let priceText = "";
    for (const selector of priceSelectors) {
      const price =
        $(selector).first().text().trim() ||
        $(selector).first().attr("data-price");
      console.log(`Trying price selector "${selector}": "${price}"`);
      if (price) {
        priceText = price;
        console.log(`Found price with selector "${selector}": "${price}"`);
        break;
      }
    }

    if (priceText) {
      console.log(`Processing price text: "${priceText}"`);

      // Extract numeric price from text (handle various formats)
      let priceMatch = priceText.match(/[\d\s,]+\.?\d*/);
      console.log(
        `First price match: "${priceMatch ? priceMatch[0] : "none"}"`,
      );

      // If no match, try alternative patterns for Tunisian Dinar format
      if (!priceMatch) {
        // Try to find price in format like "49,000 DT" or "99.99 DT"
        priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        console.log(
          `Second price match: "${priceMatch ? priceMatch[0] : "none"}"`,
        );
      }

      // If still no match, try to find any sequence of digits with commas
      if (!priceMatch) {
        priceMatch = priceText.match(/(\d+(?:,\d+)*)/);
        console.log(
          `Third price match: "${priceMatch ? priceMatch[0] : "none"}"`,
        );
      }

      if (priceMatch) {
        const cleanPrice = priceMatch[0].replace(/[\s,]/g, "");
        scrapedData.price = parseFloat(cleanPrice);
        console.log(`Extracted price: ${scrapedData.price}`);

        // Store the original formatted price text for display
        scrapedData.originalPriceText = priceText.trim();

        // Also store a properly formatted version with commas
        if (!isNaN(scrapedData.price)) {
          // Convert price to millimes for storage
          scrapedData.price = scrapedData.price * 1000;
          scrapedData.formattedPrice = new Intl.NumberFormat("ar-TN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(scrapedData.price / 1000);
          console.log(`Formatted price: ${scrapedData.formattedPrice}`);
        }
      } else {
        console.log("No price pattern matched");
      }
    }

    // Brand - try multiple common selectors
    scrapedData.brand =
      $(".brand, .product-brand, .manufacturer, .vendor")
        .first()
        .text()
        .trim() ||
      $('meta[property="product:brand"]').attr("content") ||
      "";

    // Images - try multiple common selectors with better targeting
    const images: string[] = [];

    // Website-specific image selectors
    let imageSelectors = [];

    if (isTunisianet) {
      imageSelectors = [
        ".product-image img",
        ".product-gallery img",
        ".product-photos img",
        ".product-images img",
        ".gallery img",
        "img[data-zoom-image]",
        "img[data-large-image]",
        "img[data-image]",
        ".zoom-image",
        ".large-image",
        // Additional Tunisianet-specific selectors
        ".product-thumb img",
        ".product-thumbnail img",
        ".product-preview img",
        "img[data-thumb]",
        "img[data-preview]",
        ".product-main img",
        ".product-content img",
        ".product-details img",
      ];
    } else if (isMytek) {
      imageSelectors = [
        ".product-image img",
        ".product-gallery img",
        ".product-photos img",
        ".gallery img",
        "img[data-zoom-image]",
        "img[data-large-image]",
      ];
    } else if (isJumia) {
      imageSelectors = [
        ".product-image img",
        ".product-gallery img",
        ".gallery img",
        "img[data-zoom-image]",
        "img[data-large-image]",
      ];
    } else {
      // Generic selectors
      imageSelectors = [
        "img.product-image",
        "img.main-image",
        ".product-gallery img",
        ".gallery img",
        "img[data-zoom-image]",
        "img[data-large-image]",
      ];
    }

    // Try website-specific selectors first
    console.log(`Trying ${imageSelectors.length} image selectors...`);
    for (const selector of imageSelectors) {
      const elements = $(selector);
      console.log(`Selector "${selector}" found ${elements.length} elements`);

      elements.each((_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-zoom-image") ||
          $(el).attr("data-large-image");
        console.log(`Found image with selector "${selector}": src="${src}"`);

        if (
          src &&
          !src.includes("placeholder") &&
          !src.includes("logo") &&
          !src.includes("icon")
        ) {
          // Convert relative URLs to absolute
          const absoluteUrl = src.startsWith("http")
            ? src
            : new URL(src, normalizedUrl).href;
          if (!images.includes(absoluteUrl)) {
            console.log(`Adding image: ${absoluteUrl}`);
            images.push(absoluteUrl);
          }
        }
      });
    }

    // If still no images, try more aggressive selectors
    if (images.length === 0) {
      console.log(
        "No images found with specific selectors, trying all images...",
      );

      // Look for any image that might be a product image
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        const alt = $(el).attr("alt") || "";
        const className = $(el).attr("class") || "";

        if (
          src &&
          !src.includes("placeholder") &&
          !src.includes("logo") &&
          !src.includes("icon") &&
          !src.includes("banner") &&
          !src.includes("advertisement") &&
          !src.includes("social") &&
          src.length > 10 && // Avoid very short URLs
          (src.includes("product") ||
            src.includes("item") ||
            src.includes("goods") ||
            src.includes("camera") ||
            src.includes("surveillance") ||
            alt.toLowerCase().includes("product") ||
            alt.toLowerCase().includes("camera") ||
            className.toLowerCase().includes("product"))
        ) {
          const absoluteUrl = src.startsWith("http")
            ? src
            : new URL(src, normalizedUrl).href;
          if (!images.includes(absoluteUrl)) {
            console.log(`Found potential product image: ${absoluteUrl}`);
            images.push(absoluteUrl);
          }
        }
      });
    }

    // Additional fallback: look for images in product-related containers
    if (images.length === 0) {
      console.log("Still no images, trying product containers...");

      const productContainers = [
        ".product",
        ".product-details",
        ".product-info",
        ".product-main",
        ".product-content",
        ".product-wrapper",
        ".product-container",
        ".product-box",
        ".item",
        ".goods",
      ];

      for (const containerSelector of productContainers) {
        $(containerSelector)
          .find("img")
          .each((_, el) => {
            const src = $(el).attr("src") || $(el).attr("data-src");
            if (
              src &&
              !src.includes("placeholder") &&
              !src.includes("logo") &&
              !src.includes("icon") &&
              src.length > 10
            ) {
              const absoluteUrl = src.startsWith("http")
                ? src
                : new URL(src, normalizedUrl).href;
              if (!images.includes(absoluteUrl)) {
                console.log(
                  `Found image in container ${containerSelector}: ${absoluteUrl}`,
                );
                images.push(absoluteUrl);
              }
            }
          });
      }
    }

    // Last resort: look for any image with product-related attributes or content
    if (images.length === 0) {
      console.log("Last resort: looking for any product-related images...");

      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        const alt = $(el).attr("alt") || "";
        const title = $(el).attr("title") || "";
        const parentClass = $(el).parent().attr("class") || "";
        const grandParentClass = $(el).parent().parent().attr("class") || "";

        if (
          src &&
          !src.includes("placeholder") &&
          !src.includes("logo") &&
          !src.includes("icon") &&
          !src.includes("banner") &&
          !src.includes("advertisement") &&
          !src.includes("social") &&
          src.length > 10 &&
          (alt.toLowerCase().includes("camera") ||
            alt.toLowerCase().includes("surveillance") ||
            alt.toLowerCase().includes("product") ||
            title.toLowerCase().includes("camera") ||
            title.toLowerCase().includes("surveillance") ||
            title.toLowerCase().includes("product") ||
            parentClass.toLowerCase().includes("product") ||
            parentClass.toLowerCase().includes("camera") ||
            grandParentClass.toLowerCase().includes("product") ||
            grandParentClass.toLowerCase().includes("camera"))
        ) {
          const absoluteUrl = src.startsWith("http")
            ? src
            : new URL(src, normalizedUrl).href;
          if (!images.includes(absoluteUrl)) {
            console.log(
              `Found product-related image: ${absoluteUrl} (alt: "${alt}", title: "${title}")`,
            );
            images.push(absoluteUrl);
          }
        }
      });
    }

    // Limit to first 5 images
    scrapedData.images = images.slice(0, 5);

    // Debug: Log the final image results
    console.log(`Total images found: ${images.length}`);
    console.log(`Final images array:`, scrapedData.images);

    // Specifications - try to extract from product details
    const specs: Record<string, any> = {};
    $(
      ".specifications, .product-specs, .tech-specs, .features, .attributes",
    ).each((_, el) => {
      $(el)
        .find("tr, .spec-item, .feature-item")
        .each((_, specEl) => {
          const key = $(specEl)
            .find("td:first-child, .spec-key, .feature-key")
            .text()
            .trim();
          const value = $(specEl)
            .find("td:last-child, .spec-value, .feature-value")
            .text()
            .trim();
          if (key && value && key.length < 50 && value.length < 200) {
            specs[key] = value;
          }
        });
    });

    // Also try to extract from product details sections
    $(".product-details, .product-info, .details").each((_, el) => {
      $(el)
        .find("p, li, div")
        .each((_, detailEl) => {
          const text = $(detailEl).text().trim();
          if (text.includes(":") && text.length < 200) {
            const [key, ...valueParts] = text.split(":");
            const value = valueParts.join(":").trim();
            if (key && value && key.length < 50) {
              specs[key] = value;
            }
          }
        });
    });

    scrapedData.specs = specs;

    // Clean up the data
    if (scrapedData.name) {
      scrapedData.name = scrapedData.name.replace(/\s+/g, " ").trim();
      if (scrapedData.name.length > 100) {
        scrapedData.name = scrapedData.name.substring(0, 97) + "...";
      }
      console.log(`Final product name: "${scrapedData.name}"`);
    } else {
      console.log("No product name found after all attempts");
    }

    if (scrapedData.description) {
      scrapedData.description = scrapedData.description
        .replace(/\s+/g, " ")
        .trim();
      if (scrapedData.description.length > 1000) {
        scrapedData.description =
          scrapedData.description.substring(0, 997) + "...";
      }
    }

    if (scrapedData.brand) {
      scrapedData.brand = scrapedData.brand.replace(/\s+/g, " ").trim();
      if (scrapedData.brand.length > 50) {
        scrapedData.brand = scrapedData.brand.substring(0, 47) + "...";
      }
    }

    return NextResponse.json(scrapedData);
  } catch (error) {
    console.error("Error scraping product:", error);
    return NextResponse.json(
      { error: "Failed to scrape product information" },
      { status: 500 },
    );
  }
}
