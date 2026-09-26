"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
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

export default function MenuGrid({
  menuItems,
  onAddToCart,
  onRefreshMenu,
  isLoading = false,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCustomizingItem, setActiveCustomizingItem] = useState<MenuItem | null>(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const posSelectableItems = useMemo(() => {
    return menuItems.filter(
      (item) => item.selectedForPOS !== false && item.isAvailable !== false
    );
  }, [menuItems]);

  // Dynamic categories from selectable items
  const dynamicCategories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(posSelectableItems.map((i) => i.category))),
    ];
  }, [posSelectableItems]);

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    return posSelectableItems.filter((item) => {
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
  }, [posSelectableItems, selectedCategory, searchQuery]);

  // Quick feedback flash on card
  const triggerVisualFeedback = (itemId: string) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setRecentlyAddedId(itemId);
    feedbackTimeoutRef.current = setTimeout(() => {
      setRecentlyAddedId(null);
    }, 700);
  };

  // Quick add standard version
  const handleQuickAdd = (
    item: MenuItem,
    portion: PortionVariant | null = null
  ) => {
    const defaultPortion =
      portion ||
      (item.hasPortions && item.portions && item.portions.length > 0
        ? item.portions[0]
        : null);

    onAddToCart(item, defaultPortion, [], "", 1);
    triggerVisualFeedback(item.id);
  };

  const handleActivateAll = () => {
    const all = getMenuItems();
    const ids = all.map((i) => i.id);
    bulkUpdatePOSSelection(ids, true);
    if (onRefreshMenu) onRefreshMenu();
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* 1. TOP BAR: Search & Controls */}
      <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 flex-shrink-0">
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
        <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 flex-shrink-0 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="hidden sm:inline">Pure Veg Cafe</span>
          <span className="sm:hidden">Veg</span>
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

      {/* 2. HORIZONTAL CATEGORY BAR: Replaces bulky vertical sidebar, saves 160px screen space */}
      <div className="relative bg-white/95 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center px-2 py-1.5 flex-shrink-0 select-none">
        <button
          type="button"
          onClick={() => scrollCategories("left")}
          className="hidden sm:flex w-6 h-7 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white flex-shrink-0"
          title="Scroll categories left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={categoryScrollRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth px-1"
        >
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isSelected
                    ? "bg-amber-600 text-white font-bold shadow-xs ring-1 ring-amber-500"
                    : "bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800"
                }`}
              >
                {getCategoryIcon(cat, isSelected)}
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white font-bold"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollCategories("right")}
          className="hidden sm:flex w-6 h-7 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white flex-shrink-0"
          title="Scroll categories right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. FULL-WIDTH SCROLLABLE ITEMS GRID */}
      <div className="pos-menu-scroll-container flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 overscroll-contain">
        {isLoading ? (
          <div className="pos-adaptive-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 p-3 flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-1.5">
                  <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
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
              const isRecentlyAdded = recentlyAddedId === item.id;

              const defaultPrice = hasPortions
                ? item.portions![0].price
                : item.price;

              return (
                <div
                  key={item.id}
                  onClick={() => handleQuickAdd(item)}
                  className={`group relative flex flex-col justify-between p-3 rounded-2xl bg-white dark:bg-slate-950 border transition-all cursor-pointer select-none active:scale-[0.98] ${
                    isRecentlyAdded
                      ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-md"
                      : "border-slate-200 dark:border-slate-800/80 hover:border-amber-500/80 hover:shadow-sm"
                  } ${!item.isAvailable ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {/* Floating +1 feedback pulse badge */}
                  {isRecentlyAdded && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs animate-in zoom-in-75 fade-in duration-150 z-10">
                      ✓ Added
                    </span>
                  )}

                  <div>
                    {/* Top row: veg tag + category + price */}
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-xs flex items-center justify-center border border-emerald-600 text-emerald-600 flex-shrink-0"
                          title="100% Pure Vegetarian"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        </span>

                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 truncate">
                          {item.category}
                        </span>
                      </div>

                      {/* Main Price */}
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-amber-400 flex-shrink-0">
                        {formatINR(defaultPrice)}
                      </span>
                    </div>

                    {/* Item Name */}
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {item.name}
                    </h4>
                  </div>

                  {/* Bottom Row: Clickable Portions & Actions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between gap-1.5">
                    {/* Left: Interactive Portion Buttons OR Customizable Tag */}
                    <div className="flex items-center gap-1 flex-wrap min-w-0 flex-1">
                      {hasPortions ? (
                        item.portions!.map((por) => (
                          <button
                            key={por.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAdd(item, por);
                            }}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100/90 hover:bg-amber-600 hover:text-white dark:bg-amber-950/60 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-300 border border-amber-300/50 dark:border-amber-800/50 transition-all active:scale-95 flex-shrink-0"
                            title={`Tap to add ${por.name} (${formatINR(por.price)})`}
                          >
                            {por.name.replace(" Plate", "")}: {formatINR(por.price)}
                          </button>
                        ))
                      ) : hasModifiers ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Customizable
                        </span>
                      ) : null}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Optional Customize Button: For modifiers, special notes & custom quantity */}
                      {(hasModifiers || hasPortions) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCustomizingItem(item);
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 hover:bg-amber-100 dark:bg-slate-900 dark:hover:bg-amber-950/60 text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-all shadow-2xs active:scale-95"
                          title="Customize modifiers, portion or kitchen instructions"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Quick Add (+) Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAdd(item);
                        }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-xs"
                        title="1-tap quick add to cart"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODIFIER MODAL (Full customization for portions, addons & special kitchen instructions) */}
      <ModifierModal
        item={activeCustomizingItem}
        isOpen={!!activeCustomizingItem}
        onClose={() => setActiveCustomizingItem(null)}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
