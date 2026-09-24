"use client";

import React, { useState, useEffect, useRef } from "react";
import { MenuItem, CategoryType, CartModifier, PortionVariant } from "@/lib/types";
import { formatINR } from "@/lib/calculator";
import { bulkUpdatePOSSelection, getMenuItems } from "@/lib/storage";
import ModifierModal from "./ModifierModal";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Coffee,
  Sparkles,
  Check,
  X,
  Sliders,
  Store,
  Layers,
  Utensils,
} from "lucide-react";
import Link from "next/link";

interface Props {
  menuItems: MenuItem[];
  onAddToCart: (
    item: MenuItem,
    portion: PortionVariant | null,
    modifiers: CartModifier[],
    notes: string,
    quantity: number
  ) => void;
  onRefreshMenu?: () => void;
  isLoading?: boolean;
}

function getCategoryIcon(cat: string, isSelected: boolean) {
  const iconClass = `w-3.5 h-3.5 flex-shrink-0 ${
    isSelected ? "text-white" : "text-amber-500"
  }`;
  switch (cat.toLowerCase()) {
    case "all":
      return <Layers className={iconClass} />;
    case "espresso":
      return <Coffee className={iconClass} />;
    case "cold brews":
      return <Sparkles className={iconClass} />;
    case "teas":
      return <Coffee className={iconClass} />;
    case "pastries":
      return <Utensils className={iconClass} />;
    case "sandwiches":
      return <Utensils className={iconClass} />;
    default:
      return <Store className={iconClass} />;
  }
}

export default function MenuGrid({ menuItems, onAddToCart, onRefreshMenu, isLoading = false }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCustomizingItem, setActiveCustomizingItem] = useState<MenuItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press `/` to focus search input instantly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items that are active for the cashier POS
  const posSelectableItems = menuItems.filter(
    (item) => item.selectedForPOS !== false && item.isAvailable !== false
  );

  // Dynamic categories from selectable items
  const dynamicCategories = [
    "All",
    ...Array.from(new Set(posSelectableItems.map((i) => i.category))),
  ];

  // Filter items
  const filteredItems = posSelectableItems.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCategory) return false;
    }
    return true;
  });

  const handleItemClick = (item: MenuItem) => {
    const hasModifiers = item.availableModifiers && item.availableModifiers.length > 0;
    const hasPortions = item.hasPortions && item.portions && item.portions.length > 0;

    if (hasModifiers || hasPortions) {
      setActiveCustomizingItem(item);
    } else {
      onAddToCart(item, null, [], "", 1);
    }
  };

  const handleActivateAll = () => {
    const all = getMenuItems();
    const ids = all.map((i) => i.id);
    bulkUpdatePOSSelection(ids, true);
    if (onRefreshMenu) onRefreshMenu();
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Search and Global Category Controls Bar */}
      <div className="p-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 flex-shrink-0">
        {/* Search Bar with instant '/' shortcut */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder='Search dishes, drinks... (press "/" to focus)'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-300 dark:border-slate-700 select-none">
              /
            </span>
          )}
        </div>

        {/* 100% Pure Veg Badge */}
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 flex-shrink-0 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span>Pure Veg Cafe</span>
        </div>

        {/* Manage Menu Link */}
        <Link
          href="/menu"
          className="hidden md:flex flex-shrink-0 items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-2.5 py-2 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          title="Configure which items are active in POS from the Menu Dashboard"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Menu ({posSelectableItems.length})</span>
        </Link>
      </div>

      {/* Main Body Split: Left Side Category Tab Bar + Right Side Scrollable Items Grid */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* LEFT SIDE: Category Tab Bar (Pinned, DOES NOT scroll with items) */}
        <aside className="w-28 sm:w-36 md:w-40 lg:w-44 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 flex flex-col min-h-0 overflow-hidden select-none">
          <div className="p-2 sm:p-2.5 border-b border-slate-100 dark:border-slate-800/70 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Categories
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.2 rounded">
              {dynamicCategories.length}
            </span>
          </div>

          {/* Categories Tab List - Independent scroll if categories overflow, never scrolls with items */}
          <div className="flex-1 min-h-0 overflow-y-auto p-1.5 space-y-1 scrollbar-none overscroll-contain">
            {dynamicCategories.map((cat) => {
              const isSelected = selectedCategory === cat;
              const count =
                cat === "All"
                  ? posSelectableItems.length
                  : posSelectableItems.filter((i) => i.category === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left flex items-center justify-between gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-amber-600 text-white font-bold shadow-sm ring-1 ring-amber-500"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getCategoryIcon(cat, isSelected)}
                    <span className="truncate">{cat}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full flex-shrink-0 ${
                      isSelected
                        ? "bg-white/20 text-white font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT SIDE: Only This Items Area Scrolls! */}
        <div className="pos-menu-scroll-container flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 overscroll-contain">
          {isLoading ? (
            <div className="pos-adaptive-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 p-3.5 flex flex-col justify-between animate-pulse"
                >
                  <div className="space-y-2">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center max-w-md mx-auto p-6 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 mt-6 shadow-sm">
              <Coffee className="w-12 h-12 mb-3 stroke-[1.5] text-amber-500 opacity-60" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {posSelectableItems.length === 0
                  ? "No Menu Items Selected for POS"
                  : "No matching items found"}
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                {posSelectableItems.length === 0
                  ? "Items are selectable from the Menu Dashboard only. You can enable specific items or activate all starter items now."
                  : `Try clearing your search "${searchQuery}" or selecting another category.`}
              </p>

              {posSelectableItems.length === 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleActivateAll}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    Activate All Items for POS
                  </button>
                  <Link
                    href="/menu"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                  >
                    Open Menu Dashboard
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="pos-adaptive-grid">
              {filteredItems.map((item) => {
                const hasModifiers =
                  item.availableModifiers && item.availableModifiers.length > 0;
                const hasPortions =
                  item.hasPortions && item.portions && item.portions.length > 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex flex-col justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-amber-500/80 hover:shadow-md transition-all cursor-pointer select-none active:scale-[0.98] ${
                      !item.isAvailable ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <div>
                      {/* Top row: veg tag + category */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-xs flex items-center justify-center border border-emerald-600 text-emerald-600"
                          title="100% Pure Vegetarian"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        </span>

                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                      </div>

                      {/* Item Name */}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 min-h-[2.5rem] flex items-start leading-snug">
                        {item.name}
                      </h4>

                      {/* Description */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-tight">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom: Price + Customization badge + Add action */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                      <div>
                        {hasPortions ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                              {item.portions!.map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-800/40"
                                >
                                  {p.name.replace(" Plate", "")}: {formatINR(p.price)}
                                </span>
                              ))}
                            </div>
                            <span className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold mt-0.5">
                              Portion Size
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-amber-400">
                              {formatINR(item.price)}
                            </span>
                            {hasModifiers && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-500 font-semibold">
                                Customizable
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasModifiers || hasPortions) {
                            setActiveCustomizingItem(item);
                          } else {
                            onAddToCart(item, null, [], "", 1);
                          }
                        }}
                        className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-600 text-amber-700 dark:text-amber-400 hover:text-white flex items-center justify-center transition-all shadow-xs group-hover:scale-105"
                        title={
                          hasPortions
                            ? "Choose portion & add"
                            : hasModifiers
                            ? "Customize add-ons"
                            : "Add to cart"
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modifier / Add-on Modal */}
      <ModifierModal
        item={activeCustomizingItem}
        isOpen={!!activeCustomizingItem}
        onClose={() => setActiveCustomizingItem(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
