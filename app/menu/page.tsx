"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MenuItem, CategoryType, ItemModifier, PortionVariant } from "@/lib/types";
import {
  getMenuItems,
  saveMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  updateItemPOSSelection,
  bulkUpdatePOSSelection,
  importMenuItems,
  resetToDefaults,
} from "@/lib/storage";
import {
  parseCSVMenu,
  exportMenuToCSV,
  SAMPLE_CSV_TEMPLATE,
} from "@/lib/menu-importer";
import { formatINR } from "@/lib/calculator";
import {
  Coffee,
  Plus,
  Upload,
  Download,
  Search,
  Check,
  X,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  CheckCircle2,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Store,
  RefreshCw,
  Utensils,
  Eye,
  Copy,
  FileText,
  HelpCircle,
  Table as TableIcon,
  Code as CodeIcon,
} from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import Portal from "@/components/Portal";

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom confirmation modal for deletion
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"csv" | "paste" | "sample">("csv");
  const [sampleView, setSampleView] = useState<"table" | "raw">("table");
  const [copiedSample, setCopiedSample] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importPreview, setImportPreview] = useState<MenuItem[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Memoized parsed sample template
  const sampleCSVItems = useMemo(() => parseCSVMenu(SAMPLE_CSV_TEMPLATE).validItems, []);

  const handleCopySample = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleLoadSampleIntoEditor = () => {
    const text = SAMPLE_CSV_TEMPLATE;
    setPasteContent(text);
    setImportTab("paste");
    const res = parseCSVMenu(text);
    setImportPreview(res.validItems);
    setImportErrors(res.errors);
    showToast("Loaded sample CSV template into paste box.");
  };

  // Add / Edit Modal State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("Espresso");
  const [pricingType, setPricingType] = useState<"single" | "portion">("single");
  const [itemPrice, setItemPrice] = useState("");
  const [itemZomatoPrice, setItemZomatoPrice] = useState("");
  const [itemHalfPrice, setItemHalfPrice] = useState("");
  const [itemZomatoHalfPrice, setItemZomatoHalfPrice] = useState("");
  const [itemFullPrice, setItemFullPrice] = useState("");
  const [itemZomatoFullPrice, setItemZomatoFullPrice] = useState("");
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemDesc, setItemDesc] = useState("");
  const [itemSelectedForPOS, setItemSelectedForPOS] = useState(true);
  const [itemAvailableOnZomato, setItemAvailableOnZomato] = useState(true);
  const [itemModifiers, setItemModifiers] = useState<ItemModifier[]>([]);
  const [newModName, setNewModName] = useState("");
  const [newModPrice, setNewModPrice] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    setItems(getMenuItems());
    const handleStorage = () => setItems(getMenuItems());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const refreshItems = () => {
    const updated = getMenuItems();
    setItems(updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("storage"));
    }
  };

  // Keyboard escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (validationAlert) setValidationAlert(null);
        else if (deleteTarget) setDeleteTarget(null);
        else if (showEditModal) setShowEditModal(false);
        else if (showImportModal) setShowImportModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [validationAlert, deleteTarget, showEditModal, showImportModal]);

  // Handlers for POS Toggle
  const handleTogglePOS = (id: string, currentVal: boolean) => {
    updateItemPOSSelection(id, !currentVal);
    refreshItems();
    showToast(!currentVal ? "Item enabled for POS terminal." : "Item removed from POS terminal.");
  };

  // Toggle single item stock status
  const handleToggleStock = (id: string) => {
    const updated = toggleItemAvailability(id);
    setItems(updated);
  };

  // Bulk actions
  const handleSelectAllPOS = () => {
    bulkUpdatePOSSelection(items.map((i) => i.id), true);
    refreshItems();
    showToast("All items are now active in the Cashier POS.");
  };

  const handleDeselectAllPOS = () => {
    bulkUpdatePOSSelection(items.map((i) => i.id), false);
    refreshItems();
    showToast("All items have been deselected from POS.");
  };

  // Delete Action
  const handleDeletePrompt = (item: MenuItem) => {
    setDeleteTarget(item);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMenuItem(deleteTarget.id);
    refreshItems();
    showToast(`Deleted "${deleteTarget.name}".`);
    setDeleteTarget(null);
  };

  // Open Edit Modal
  const handleOpenEdit = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemCategory(item.category);
      if (item.hasPortions && item.portions && item.portions.length > 0) {
        setPricingType("portion");
        const half = item.portions.find(
          (p) => p.id === "half" || p.name.toLowerCase().includes("half")
        ) || item.portions[0];
        const full = item.portions.find(
          (p) => p.id === "full" || p.name.toLowerCase().includes("full")
        ) || item.portions[1] || item.portions[0];
        setItemHalfPrice(half ? half.price.toString() : "");
        setItemFullPrice(full ? full.price.toString() : "");
        setItemZomatoHalfPrice(half && half.zomatoPrice ? half.zomatoPrice.toString() : "");
        setItemZomatoFullPrice(full && full.zomatoPrice ? full.zomatoPrice.toString() : "");
        setItemPrice(half ? half.price.toString() : item.price.toString());
        setItemZomatoPrice(item.zomatoPrice ? item.zomatoPrice.toString() : "");
      } else {
        setPricingType("single");
        setItemPrice(item.price.toString());
        setItemZomatoPrice(item.zomatoPrice ? item.zomatoPrice.toString() : "");
        setItemHalfPrice("");
        setItemFullPrice("");
        setItemZomatoHalfPrice("");
        setItemZomatoFullPrice("");
      }
      setItemIsVeg(true);
      setItemDesc(item.description || "");
      setItemSelectedForPOS(item.selectedForPOS !== false);
      setItemAvailableOnZomato(item.availableOnZomato !== false);
      setItemModifiers(item.availableModifiers || []);
    } else {
      setEditingItem(null);
      setItemName("");
      setItemCategory("Espresso");
      setPricingType("single");
      setItemPrice("180");
      setItemZomatoPrice("220");
      setItemHalfPrice("140");
      setItemZomatoHalfPrice("170");
      setItemFullPrice("240");
      setItemZomatoFullPrice("290");
      setItemIsVeg(true);
      setItemDesc("");
      setItemSelectedForPOS(true);
      setItemAvailableOnZomato(true);
      setItemModifiers([]);
    }
    setNewModName("");
    setNewModPrice("");
    setShowEditModal(true);
  };

  // Helper to auto-calculate +20% markup
  const handleApplyMarkup = (percent: number = 20) => {
    if (pricingType === "single") {
      const base = parseFloat(itemPrice);
      if (!isNaN(base) && base > 0) {
        setItemZomatoPrice(Math.round(base * (1 + percent / 100)).toString());
      }
    } else {
      const half = parseFloat(itemHalfPrice);
      const full = parseFloat(itemFullPrice);
      if (!isNaN(half) && half > 0) {
        setItemZomatoHalfPrice(Math.round(half * (1 + percent / 100)).toString());
      }
      if (!isNaN(full) && full > 0) {
        setItemZomatoFullPrice(Math.round(full * (1 + percent / 100)).toString());
      }
    }
  };

  // Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    let basePrice = 0;
    let hasPortions = false;
    let portions: PortionVariant[] | undefined = undefined;

    const zSingle = parseFloat(itemZomatoPrice);
    const zomatoSinglePrice = !isNaN(zSingle) && zSingle > 0 ? zSingle : undefined;

    if (pricingType === "portion") {
      const half = parseFloat(itemHalfPrice) || 0;
      const full = parseFloat(itemFullPrice) || 0;
      if (half <= 0 && full <= 0) {
        setValidationAlert("Please enter a valid price for Half Plate or Full Plate.");
        return;
      }
      hasPortions = true;
      basePrice = half > 0 ? half : full;

      const zHalf = parseFloat(itemZomatoHalfPrice);
      const zFull = parseFloat(itemZomatoFullPrice);
      const zomatoHalfVal = !isNaN(zHalf) && zHalf > 0 ? zHalf : undefined;
      const zomatoFullVal = !isNaN(zFull) && zFull > 0 ? zFull : undefined;

      portions = [
        { id: "half", name: "Half Plate", price: half, zomatoPrice: zomatoHalfVal },
        { id: "full", name: "Full Plate", price: full, zomatoPrice: zomatoFullVal },
      ];
    } else {
      const price = parseFloat(itemPrice);
      if (isNaN(price) || price < 0) {
        setValidationAlert("Please enter a valid price for this menu item.");
        return;
      }
      basePrice = price;
      hasPortions = false;
      portions = undefined;
    }

    const itemToSave: MenuItem = {
      id: editingItem ? editingItem.id : `item-${Date.now()}`,
      name: itemName.trim(),
      category: itemCategory.trim(),
      price: basePrice,
      zomatoPrice: hasPortions ? undefined : zomatoSinglePrice,
      hasPortions,
      portions,
      isVeg: true,
      description: itemDesc.trim(),
      isAvailable: editingItem ? editingItem.isAvailable : true,
      selectedForPOS: itemSelectedForPOS,
      availableOnZomato: itemAvailableOnZomato,
      availableModifiers: itemModifiers,
    };

    saveMenuItem(itemToSave);
    refreshItems();
    setShowEditModal(false);
    showToast(editingItem ? `Updated "${itemToSave.name}".` : `Added "${itemToSave.name}" to catalog.`);
  };

  // Add modifier to item draft
  const handleAddModifier = () => {
    if (!newModName.trim()) return;
    const price = parseFloat(newModPrice) || 0;
    setItemModifiers([
      ...itemModifiers,
      { id: `mod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name: newModName.trim(), price },
    ]);
    setNewModName("");
    setNewModPrice("");
  };

  const handleRemoveModifier = (modId: string) => {
    setItemModifiers(itemModifiers.filter((m) => m.id !== modId));
  };

  // Import Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseCSVMenu(text);
      setImportPreview(res.validItems);
      setImportErrors(res.errors);
    };
    reader.readAsText(file);
  };

  const handleParsePasted = () => {
    if (!pasteContent.trim()) return;
    const res = parseCSVMenu(pasteContent);
    setImportPreview(res.validItems);
    setImportErrors(res.errors);
  };

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.length === 0) return;
    const updated = importMenuItems(importPreview, importMode);
    setItems(updated);
    setShowImportModal(false);
    setImportPreview(null);
    setImportErrors([]);
    setPasteContent("");
    showToast(`Successfully imported ${importPreview.length} menu items (${importMode} mode).`);
  };

  // Download Templates
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter items for table
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const posActiveCount = items.filter((i) => i.selectedForPOS !== false).length;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-6 space-y-6 transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header with Metrics & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <span>Menu & Item Catalog Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure catalog items, import/export menus, and select which items appear in the Cashier POS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Link directly to Cashier POS */}
          <Link
            href="/pos"
            className="flex items-center gap-2 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <Store className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </Link>

          {/* Import Menu Button */}
          <button
            onClick={() => {
              setImportPreview(null);
              setImportErrors([]);
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Import Menu (CSV)</span>
          </button>

          {/* Export Menu Dropdown/Buttons */}
          <button
            onClick={() => downloadFile(exportMenuToCSV(items), "menu_catalog.csv", "text/csv")}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs"
            title="Export full catalog to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Add Item Button */}
          <button
            onClick={() => handleOpenEdit()}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* POS Selection Guidance Card */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-800/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>POS Terminal Selection:</span>
              <span className="font-mono text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/30">
                {posActiveCount} of {items.length} items active in POS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Items marked with <span className="text-amber-600 dark:text-amber-300 font-semibold">Show in POS</span> will be immediately available for the cashier to punch and bill.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAllPOS}
            className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-600 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white border border-amber-200 dark:border-amber-500/40 text-xs font-semibold transition-all shadow-xs"
          >
            Select All for POS
          </button>
          <button
            onClick={handleDeselectAllPOS}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-xs"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search items by name, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Show in POS</th>
                <th className="px-5 py-3.5">Item Details</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Cafe Price</th>
                <th className="px-5 py-3.5">Zomato Price</th>
                <th className="px-5 py-3.5">Customizations</th>
                <th className="px-5 py-3.5">Stock Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No items found matching filter &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.selectedForPOS !== false;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !isSelected ? "opacity-60 bg-slate-50/50 dark:bg-slate-950/20" : ""
                      }`}
                    >
                      {/* POS Selector Checkbox */}
                      <td className="px-5 py-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePOS(item.id, isSelected)}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              isSelected ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {isSelected ? "Active in POS" : "Hidden"}
                          </span>
                        </label>
                      </td>

                      {/* Name & Pure Veg Icon */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <span
                            className="w-3 h-3 rounded-xs mt-0.5 flex-shrink-0 flex items-center justify-center border border-emerald-500 text-emerald-500"
                            title="100% Pure Vegetarian"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {item.name}
                            </span>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>

                      {/* Cafe In-Store Price */}
                      <td className="px-5 py-4">
                        {item.hasPortions && item.portions && item.portions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
                              Portion Pricing
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.portions.map((p) => (
                                <span
                                  key={p.id}
                                  className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-mono text-xs border border-amber-200 dark:border-slate-700 font-semibold"
                                >
                                  {p.name.replace(" Plate", "")}: {formatINR(p.price)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                            {formatINR(item.price)}
                          </span>
                        )}
                      </td>

                      {/* Zomato Delivery Price */}
                      <td className="px-5 py-4">
                        {item.availableOnZomato === false ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                            Hidden on Zomato
                          </span>
                        ) : item.hasPortions && item.portions && item.portions.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                              Zomato Rate
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {item.portions.map((p) => {
                                const zPrice = p.zomatoPrice ?? p.price;
                                return (
                                  <span
                                    key={p.id}
                                    className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-mono text-xs border border-red-200 dark:border-red-900/50 font-semibold"
                                  >
                                    {p.name.replace(" Plate", "")}: {formatINR(zPrice)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm">
                              {formatINR(item.zomatoPrice ?? item.price)}
                            </span>
                            {!item.zomatoPrice || item.zomatoPrice === item.price ? (
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Default)
                              </span>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* Modifiers */}
                      <td className="px-5 py-4">
                        {item.availableModifiers && item.availableModifiers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.availableModifiers.slice(0, 2).map((m) => (
                              <span
                                key={m.id}
                                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-mono"
                              >
                                +{m.name} ({formatINR(m.price)})
                              </span>
                            ))}
                            {item.availableModifiers.length > 2 && (
                              <span className="text-[10px] text-slate-400">
                                +{item.availableModifiers.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">None</span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStock(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-colors ${
                            item.isAvailable
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                          }`}
                        >
                          {item.isAvailable ? "In Stock" : "86'd / Out"}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors border border-slate-200 dark:border-slate-700"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- IMPORT MENU MODAL ---------------- */}
      {showImportModal && (
        <Portal>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowImportModal(false);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
          >
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-900 dark:text-white">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Import Menu Catalog
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Upload CSV file, inspect sample format, or paste table rows
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Import Mode Tabs */}
              <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportTab("csv");
                  setImportPreview(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  importTab === "csv"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportTab("paste");
                  setImportPreview(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  importTab === "paste"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportTab("sample");
                  setImportPreview(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  importTab === "sample"
                    ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/30"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>Preview Sample CSV</span>
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadFile(SAMPLE_CSV_TEMPLATE, "sample_menu.csv", "text/csv")}
                  className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  title="Download starter CSV template"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Sample CSV</span>
                </button>
              </div>
            </div>

            {/* Input area */}
            <div className="space-y-4">
              {importTab === "sample" ? (
                /* ---------------- SAMPLE DATA & FORMAT PREVIEW TAB ---------------- */
                <div className="space-y-3.5">
                  {/* Sub-bar: View toggle & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {/* View Mode Toggle: Formatted Table vs Raw Code */}
                    <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setSampleView("table")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          sampleView === "table"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>Parsed Table</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSampleView("raw")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                          sampleView === "raw"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        <CodeIcon className="w-3.5 h-3.5" />
                        <span>Raw CSV Text</span>
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopySample(SAMPLE_CSV_TEMPLATE)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Copy template data"
                      >
                        {copiedSample ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span>{copiedSample ? "Copied!" : "Copy CSV"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadFile(SAMPLE_CSV_TEMPLATE, "sample_menu.csv", "text/csv")
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Download sample file"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLoadSampleIntoEditor}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        title="Load this sample into the paste editor"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Use This Sample</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Table or Raw Code Box */}
                  {sampleView === "table" ? (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <span>
                          Sample Items Preview ({sampleCSVItems.length} items parsed)
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          ✓ Valid CSV Format
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Item Name</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3">Price / Portions</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3">Modifiers</th>
                              <th className="py-2 px-3">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                            {sampleCSVItems.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                              >
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                                  {item.name}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-mono">
                                  {item.hasPortions && item.portions ? (
                                    <div className="space-y-0.5 text-[11px]">
                                      {item.portions.map((p, pIdx) => (
                                        <div
                                          key={pIdx}
                                          className="text-amber-600 dark:text-amber-400"
                                        >
                                          {p.name}: {formatINR(p.price)}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                                      {formatINR(item.price)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    PURE VEG
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  {item.availableModifiers && item.availableModifiers.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {item.availableModifiers.map((m, mIdx) => (
                                        <span
                                          key={mIdx}
                                          className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                                        >
                                          +{m.name} ({formatINR(m.price)})
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-[11px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-[200px] truncate">
                                  {item.description || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Raw Code View */
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 font-mono text-xs shadow-inner">
                      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>sample_menu.csv</span>
                        <span>CSV Comma-Separated Values</span>
                      </div>
                      <pre className="p-4 max-h-60 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed text-[11px] text-emerald-400 select-all">
                        {SAMPLE_CSV_TEMPLATE}
                      </pre>
                    </div>
                  )}

                  {/* Format & Column Reference Guide */}
                  <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 text-xs">
                    <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                      <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>CSV Column Structure Guide</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
                      <div>
                        <strong className="text-slate-900 dark:text-white">Name:</strong> (Required) Title of the item.
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">Category:</strong> Menu category (e.g. Espresso, Sandwiches).
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">PricingType:</strong> <code>Single</code> or <code>Portions</code>.
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">SinglePrice:</strong> Fixed item price (leave blank if Portions).
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">HalfPrice &amp; FullPrice:</strong> Rates for half / full plates.
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">FoodClassification:</strong> <code>Veg</code> (Pure Vegetarian Cafe).
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">Modifiers:</strong> Semicolon list: <code>Extra Shot:45;Vanilla:30</code>.
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white">Description:</strong> Short item description or tasting notes.
                      </div>
                    </div>
                  </div>
                </div>
              ) : importTab === "csv" ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/60 dark:bg-slate-950/40">
                    <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Click to select CSV file from your device
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports .csv and .txt formats
                    </p>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="mt-3 text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white cursor-pointer"
                    />
                  </div>

                  {/* Format Helper Banner */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>
                        Need to verify required columns and format before uploading?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImportTab("sample")}
                      className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <span>Preview CSV Sample</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                      Paste raw CSV lines:
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setPasteContent(SAMPLE_CSV_TEMPLATE);
                          const res = parseCSVMenu(SAMPLE_CSV_TEMPLATE);
                          setImportPreview(res.validItems);
                          setImportErrors(res.errors);
                        }}
                        className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                      >
                        Insert Sample CSV
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder={`Name,Category,PricingType,SinglePrice,HalfPrice,FullPrice,VegOrNonVeg,Description,Modifiers\nAffogato al Caffe,Espresso,Single,220,,,Veg,Double shot over gelato,Extra Shot:45`}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleParsePasted}
                      disabled={!pasteContent.trim()}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Parse Pasted Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportTab("sample")}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Format Guide</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Import Mode: Merge vs Replace */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Import Strategy:</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "merge"}
                      onChange={() => setImportMode("merge")}
                      className="accent-indigo-600"
                    />
                    <span>Merge with existing</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-600 dark:text-rose-300">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === "replace"}
                      onChange={() => setImportMode("replace")}
                      className="accent-rose-500"
                    />
                    <span>Replace catalog</span>
                  </label>
                </div>
              </div>

              {/* Errors Display */}
              {importErrors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 rounded-xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Import Warnings ({importErrors.length}):</span>
                  </div>
                  {importErrors.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}

              {/* Parsed Preview Table */}
              {importPreview && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Ready to Import: {importPreview.length} items parsed successfully
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono">
                    {importPreview.slice(0, 10).map((p, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200">
                        <span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1">[VEG]</span>
                          {p.name} ({p.category})
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {formatINR(p.price)}
                        </span>
                      </div>
                    ))}
                    {importPreview.length > 10 && (
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        ...and {importPreview.length - 10} more items
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5 bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!importPreview || importPreview.length === 0}
                className="px-5 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                Confirm Import ({importPreview ? importPreview.length : 0} items)
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* ---------------- ADD / EDIT ITEM MODAL ---------------- */}
      {showEditModal && (
        <Portal>
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md no-print animate-in fade-in duration-150"
          >
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-900 dark:text-white">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{editingItem ? "Edit Menu Item" : "Add New Item"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body with proper padding & gutter */}
            <form id="edit-menu-item-form" onSubmit={handleSaveItem} className="space-y-4 px-6 py-5 flex-1 overflow-y-auto min-h-0">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vanilla Sweet Cream Cold Brew"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cold Brews, Pasta, Starters"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              {/* Pricing Model Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Pricing Variety
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPricingType("single")}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pricingType === "single"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Single Price
                  </button>
                  <button
                    type="button"
                    onClick={() => setPricingType("portion")}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pricingType === "portion"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Half & Full Plate
                  </button>
                </div>

                {pricingType === "single" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Cafe Price (₹ INR)
                      </label>
                      <input
                        type="number"
                        step="1"
                        required={pricingType === "single"}
                        placeholder="e.g. 180"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                          Zomato Price (₹ INR)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleApplyMarkup(20)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 cursor-pointer"
                        >
                          +20% Markup
                        </button>
                      </div>
                      <input
                        type="number"
                        step="1"
                        placeholder="Leave blank for same price"
                        value={itemZomatoPrice}
                        onChange={(e) => setItemZomatoPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500/80 focus:border-rose-500 focus:outline-none placeholder:text-slate-400 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Portion Pricing</span>
                      <button
                        type="button"
                        onClick={() => handleApplyMarkup(20)}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 cursor-pointer"
                      >
                        Auto +20% Markup for Zomato
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Half: Cafe Price (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          required={pricingType === "portion"}
                          placeholder="e.g. 140"
                          value={itemHalfPrice}
                          onChange={(e) => setItemHalfPrice(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                          Half: Zomato Price (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder="Default: Cafe"
                          value={itemZomatoHalfPrice}
                          onChange={(e) => setItemZomatoHalfPrice(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                          Full: Cafe Price (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          required={pricingType === "portion"}
                          placeholder="e.g. 240"
                          value={itemFullPrice}
                          onChange={(e) => setItemFullPrice(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block mb-1">
                          Full: Zomato Price (₹)
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder="Default: Cafe"
                          value={itemZomatoFullPrice}
                          onChange={(e) => setItemZomatoFullPrice(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Food Classification */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Classification
                  </label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                    <span>Pure Veg</span>
                  </div>
                </div>

                {/* Show in POS */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    In-Store POS
                  </label>
                  <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemSelectedForPOS}
                      onChange={(e) => setItemSelectedForPOS(e.target.checked)}
                      className="accent-amber-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-900 dark:text-white font-medium">Show in POS</span>
                  </label>
                </div>

                {/* Show on Zomato */}
                <div>
                  <label className="text-xs font-semibold text-rose-700 dark:text-rose-300 block mb-1">
                    Zomato Delivery
                  </label>
                  <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemAvailableOnZomato}
                      onChange={(e) => setItemAvailableOnZomato(e.target.checked)}
                      className="accent-rose-500 h-4 w-4"
                    />
                    <span className="text-xs text-rose-900 dark:text-rose-200 font-medium">Available on Zomato</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Tasting Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe beans, brewing method, or ingredients..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>

              {/* Modifiers Builder */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Add-ons & Modifiers ({itemModifiers.length})
                </label>

                {itemModifiers.length > 0 && (
                  <div className="space-y-1.5 mb-2.5">
                    {itemModifiers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="font-medium text-slate-900 dark:text-white">{m.name}</span>
                        <div className="flex items-center gap-2.5 font-mono">
                          <span className="text-amber-600 dark:text-amber-400 font-bold">+{formatINR(m.price)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveModifier(m.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add-on Name (e.g. Oat Milk)"
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={newModPrice}
                    onChange={(e) => setNewModPrice(e.target.value)}
                    className="w-28 px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-amber-500/80 focus:border-amber-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddModifier}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/80 dark:bg-slate-900/60 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-menu-item-form"
                className="px-5 py-2 text-xs rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {editingItem ? "Save Changes" : "Create Item"}
              </button>
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* Custom Confirmation Modal for Deleting Menu Item */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Menu Item"
        description={`Are you sure you want to remove "${deleteTarget?.name}" from the cafe menu? This will remove it from all menu categories and the POS terminal.`}
        confirmText="Delete Item"
        cancelText="Keep Item"
        variant="danger"
      />

      {/* Custom Warning Modal for Price / Validation Notice */}
      <ConfirmModal
        isOpen={Boolean(validationAlert)}
        onClose={() => setValidationAlert(null)}
        title="Notice"
        description={validationAlert || ""}
        confirmText="Got It"
        variant="warning"
        isAlertOnly={true}
      />
    </div>
  );
}
