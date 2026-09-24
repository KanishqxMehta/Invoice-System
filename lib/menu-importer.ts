import { MenuItem, ItemModifier, PortionVariant } from "./types";

export interface ImportValidationResult {
  validItems: MenuItem[];
  errors: string[];
}

export const SAMPLE_CSV_TEMPLATE = `Name,Category,PricingType,SinglePrice,ZomatoPrice,HalfPrice,ZomatoHalfPrice,FullPrice,ZomatoFullPrice,VegOrNonVeg,Description,Modifiers,AvailableOnZomato
Affogato al Caffe,Espresso,Single,220,260,,,,Veg,Freshly pulled double shot over artisanal vanilla gelato,Extra Shot:45;Hazelnut Syrup:35,Yes
Truffle Parmesan Fries,Sandwiches,Portions,,,150,180,260,310,Veg,Hand cut golden crisps tossed in white truffle oil and Grana Padano,Dip:30;Extra Cheese:50,Yes
Steamed Himalayan Momos,Sandwiches,Portions,,,140,170,240,290,Veg,Delicate Tibetan dumplings served with spicy roasted sesame chutney,Schezwan Dip:25;Extra Chutney:0,Yes
Creamy Pesto Penne,Sandwiches,Portions,,,210,250,340,399,Veg,Durum wheat penne in rich basil walnut pesto cream,Extra Bocconcini:60;Garlic Bread:50,Yes
Cold Brew Bottle,Cold Brews,Portions,,,180,210,320,370,Veg,Slow dripped single origin cold brew bottle (Regular / Large),Less Ice:0;Sweet Cream:35,Yes
French Butter Croissant,Pastries,Single,190,230,,,,Veg,72 layer lamination Normandy butter croissant,Warm in Oven:0;Fig Jam:40,Yes`;

export const SAMPLE_JSON_TEMPLATE = JSON.stringify(
  [
    {
      name: "Affogato al Caffe",
      category: "Espresso",
      price: 220,
      hasPortions: false,
      isVeg: true,
      description: "Freshly pulled double shot over artisanal vanilla gelato",
      selectedForPOS: true,
      isAvailable: true,
      availableModifiers: [
        { id: "mod-1", name: "Extra Shot", price: 45 },
        { id: "mod-2", name: "Hazelnut Syrup", price: 35 },
      ],
    },
    {
      name: "Truffle Parmesan Fries",
      category: "Sandwiches",
      price: 150,
      hasPortions: true,
      portions: [
        { id: "p-half", name: "Half Plate", price: 150 },
        { id: "p-full", name: "Full Plate", price: 260 },
      ],
      isVeg: true,
      description: "Hand cut golden crisps tossed in white truffle oil and Grana Padano",
      selectedForPOS: true,
      isAvailable: true,
      availableModifiers: [
        { id: "mod-3", name: "Extra Cheese", price: 50 },
      ],
    },
    {
      name: "French Butter Croissant",
      category: "Pastries",
      price: 190,
      hasPortions: false,
      isVeg: true,
      description: "72-layer lamination Normandy butter croissant",
      selectedForPOS: true,
      isAvailable: true,
      availableModifiers: [],
    },
  ],
  null,
  2
);

export function parseCSVMenu(csvText: string): ImportValidationResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const validItems: MenuItem[] = [];
  const errors: string[] = [];

  if (lines.length <= 1) {
    return { validItems: [], errors: ["CSV file is empty or only has a header row."] };
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\s_]/g, ""));
  const nameIdx = header.findIndex((h) => h.includes("name") || h.includes("item"));
  const catIdx = header.findIndex((h) => h.includes("cat"));
  const singlePriceIdx = header.findIndex(
    (h) => (h.includes("single") && h.includes("price")) || (h.includes("price") && !h.includes("zomato")) || h === "rate"
  );
  const zomatoPriceIdx = header.findIndex(
    (h) => h.includes("zomato") && (h.includes("price") || h.includes("single") || h.includes("rate"))
  );
  const halfPriceIdx = header.findIndex((h) => h.includes("half") && !h.includes("zomato"));
  const zomatoHalfPriceIdx = header.findIndex((h) => h.includes("zomato") && h.includes("half"));
  const fullPriceIdx = header.findIndex((h) => h.includes("full") && !h.includes("zomato"));
  const zomatoFullPriceIdx = header.findIndex((h) => h.includes("zomato") && h.includes("full"));
  const typeIdx = header.findIndex((h) => h.includes("pricing") || h.includes("portion"));
  const vegIdx = header.findIndex((h) => h.includes("veg") || h.includes("type"));
  const descIdx = header.findIndex((h) => h.includes("desc") || h.includes("detail"));
  const modIdx = header.findIndex((h) => h.includes("mod") || h.includes("addon"));
  const zomatoAvailIdx = header.findIndex(
    (h) => h.includes("zomato") && (h.includes("avail") || h.includes("order") || h.includes("deliv"))
  );

  if (nameIdx === -1) {
    return {
      validItems: [],
      errors: ["Missing required columns. Header must include at least 'Name'."],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = parseCSVLine(rawLine);
    if (!cells || cells.length <= nameIdx) continue;

    const name = cells[nameIdx]?.trim();
    if (!name) {
      errors.push(`Row ${i + 1}: Name is empty. Skipping.`);
      continue;
    }

    const category = catIdx >= 0 && cells[catIdx]?.trim() ? cells[catIdx].trim() : "Specialty";
    const desc = descIdx >= 0 ? cells[descIdx]?.trim() : "";
    const vegRaw = vegIdx >= 0 ? cells[vegIdx]?.toLowerCase().trim() : "veg";
    const isVeg = !(vegRaw.includes("non") || vegRaw === "nv" || vegRaw === "false");

    // Check Zomato availability
    let availableOnZomato = true;
    if (zomatoAvailIdx >= 0 && cells[zomatoAvailIdx]?.trim()) {
      const rawAvail = cells[zomatoAvailIdx].trim().toLowerCase();
      if (rawAvail === "no" || rawAvail === "false" || rawAvail === "0" || rawAvail === "hidden") {
        availableOnZomato = false;
      }
    }

    // Check if item has Half / Full plate pricing
    const halfRaw = halfPriceIdx >= 0 ? cells[halfPriceIdx]?.replace(/[^\d.]/g, "") : "";
    const fullRaw = fullPriceIdx >= 0 ? cells[fullPriceIdx]?.replace(/[^\d.]/g, "") : "";
    const halfVal = halfRaw ? parseFloat(halfRaw) : NaN;
    const fullVal = fullRaw ? parseFloat(fullRaw) : NaN;

    const zomatoHalfRaw = zomatoHalfPriceIdx >= 0 ? cells[zomatoHalfPriceIdx]?.replace(/[^\d.]/g, "") : "";
    const zomatoFullRaw = zomatoFullPriceIdx >= 0 ? cells[zomatoFullPriceIdx]?.replace(/[^\d.]/g, "") : "";
    const zomatoHalfVal = zomatoHalfRaw ? parseFloat(zomatoHalfRaw) : NaN;
    const zomatoFullVal = zomatoFullRaw ? parseFloat(zomatoFullRaw) : NaN;

    let hasPortions = false;
    let portions: PortionVariant[] = [];
    let basePrice = 0;
    let zomatoPrice: number | undefined = undefined;

    if (!isNaN(halfVal) && !isNaN(fullVal) && (halfVal > 0 || fullVal > 0)) {
      hasPortions = true;
      basePrice = halfVal > 0 ? halfVal : fullVal;
      portions = [
        {
          id: `p-half-${i}`,
          name: "Half Plate",
          price: halfVal,
          zomatoPrice: !isNaN(zomatoHalfVal) && zomatoHalfVal > 0 ? zomatoHalfVal : undefined,
        },
        {
          id: `p-full-${i}`,
          name: "Full Plate",
          price: fullVal,
          zomatoPrice: !isNaN(zomatoFullVal) && zomatoFullVal > 0 ? zomatoFullVal : undefined,
        },
      ];
    } else {
      // Single price fallback
      const singleRaw = singlePriceIdx >= 0 ? cells[singlePriceIdx]?.replace(/[^\d.]/g, "") : "";
      const singleVal = singleRaw ? parseFloat(singleRaw) : NaN;
      if (isNaN(singleVal) || singleVal < 0) {
        errors.push(`Row ${i + 1} (${name}): No valid single price or half/full price found. Skipping.`);
        continue;
      }
      basePrice = singleVal;
      hasPortions = false;

      const zomatoRaw = zomatoPriceIdx >= 0 ? cells[zomatoPriceIdx]?.replace(/[^\d.]/g, "") : "";
      const zomatoVal = zomatoRaw ? parseFloat(zomatoRaw) : NaN;
      if (!isNaN(zomatoVal) && zomatoVal > 0) {
        zomatoPrice = zomatoVal;
      }
    }

    // Parse modifiers string like "Extra Shot:45;Oat Milk:50"
    const availableModifiers: ItemModifier[] = [];
    if (modIdx >= 0 && cells[modIdx]?.trim()) {
      const modPairs = cells[modIdx].split(/[;,|]/);
      modPairs.forEach((pair, pIdx) => {
        const parts = pair.split(":");
        if (parts.length >= 2) {
          const modName = parts[0].trim();
          const modPrice = parseFloat(parts[1].replace(/[^\d.]/g, "")) || 0;
          if (modName) {
            availableModifiers.push({
              id: `mod-${Date.now()}-${i}-${pIdx}`,
              name: modName,
              price: modPrice,
            });
          }
        } else if (parts[0]?.trim()) {
          availableModifiers.push({
            id: `mod-${Date.now()}-${i}-${pIdx}`,
            name: parts[0].trim(),
            price: 0,
          });
        }
      });
    }

    validItems.push({
      id: `imp-${Date.now()}-${i}`,
      name,
      category,
      price: basePrice,
      zomatoPrice,
      hasPortions,
      portions: hasPortions ? portions : undefined,
      isVeg,
      description: desc,
      isAvailable: true,
      selectedForPOS: true,
      availableOnZomato,
      availableModifiers,
    });
  }

  return { validItems, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseJSONMenu(jsonText: string): ImportValidationResult {
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { validItems: [], errors: ["JSON root must be an array of menu items."] };
    }

    const validItems: MenuItem[] = [];
    const errors: string[] = [];

    parsed.forEach((item, idx) => {
      if (!item.name || typeof item.name !== "string") {
        errors.push(`Item ${idx + 1}: Missing name.`);
        return;
      }
      const price = typeof item.price === "number" ? item.price : parseFloat(item.price);
      const hasPortions = Boolean(item.hasPortions || (item.portions && item.portions.length > 0));

      let portions: PortionVariant[] = [];
      if (hasPortions && Array.isArray(item.portions)) {
        portions = item.portions.map((p: any, pIdx: number) => ({
          id: p.id || `p-${idx}-${pIdx}`,
          name: p.name || (pIdx === 0 ? "Half Plate" : "Full Plate"),
          price: Number(p.price) || 0,
        }));
      }

      validItems.push({
        id: item.id || `imp-json-${Date.now()}-${idx}`,
        name: item.name.trim(),
        category: item.category || "General",
        price: isNaN(price) ? (portions[0]?.price || 0) : price,
        hasPortions,
        portions: hasPortions && portions.length > 0 ? portions : undefined,
        isVeg: item.isVeg !== undefined ? Boolean(item.isVeg) : true,
        description: item.description || "",
        isAvailable: item.isAvailable !== undefined ? Boolean(item.isAvailable) : true,
        selectedForPOS: item.selectedForPOS !== undefined ? Boolean(item.selectedForPOS) : true,
        availableModifiers: Array.isArray(item.availableModifiers)
          ? item.availableModifiers.map((m: any, mIdx: number) => ({
              id: m.id || `mod-${idx}-${mIdx}`,
              name: m.name,
              price: Number(m.price) || 0,
            }))
          : [],
      });
    });

    return { validItems, errors };
  } catch (e: any) {
    return { validItems: [], errors: [`Invalid JSON format: ${e.message}`] };
  }
}

export function exportMenuToCSV(items: MenuItem[]): string {
  const headers = "Name,Category,PricingType,SinglePrice,ZomatoPrice,HalfPrice,ZomatoHalfPrice,FullPrice,ZomatoFullPrice,VegOrNonVeg,Description,Modifiers,SelectedForPOS,AvailableOnZomato";
  const rows = items.map((item) => {
    const isPortion = Boolean(item.hasPortions && item.portions && item.portions.length >= 2);
    const pricingType = isPortion ? "Portions" : "Single";
    const singlePrice = !isPortion ? item.price : "";
    const zomatoPrice = !isPortion ? (item.zomatoPrice ?? "") : "";
    const halfPrice = isPortion ? (item.portions?.[0]?.price || "") : "";
    const zomatoHalfPrice = isPortion ? (item.portions?.[0]?.zomatoPrice ?? "") : "";
    const fullPrice = isPortion ? (item.portions?.[1]?.price || "") : "";
    const zomatoFullPrice = isPortion ? (item.portions?.[1]?.zomatoPrice ?? "") : "";

    const modsStr = item.availableModifiers
      ? item.availableModifiers.map((m) => `${m.name}:${m.price}`).join(";")
      : "";
    const cleanDesc = (item.description || "").replace(/"/g, '""');
    const cleanName = item.name.replace(/"/g, '""');
    const zomatoAvail = item.availableOnZomato !== false ? "Yes" : "No";

    return `"${cleanName}","${item.category}","${pricingType}",${singlePrice},${zomatoPrice},${halfPrice},${zomatoHalfPrice},${fullPrice},${zomatoFullPrice},"Veg","${cleanDesc}","${modsStr}",${item.selectedForPOS ? "Yes" : "No"},${zomatoAvail}`;
  });
  return [headers, ...rows].join("\n");
}

export function exportMenuToJSON(items: MenuItem[]): string {
  return JSON.stringify(items, null, 2);
}
