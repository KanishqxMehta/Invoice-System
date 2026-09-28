import React, { useState, useEffect, useRef, useMemo } from "react";
import { Customer, CafeSettings } from "@/lib/types";
import { getCustomers, updateCustomer } from "@/lib/storage";
import { formatINR } from "@/lib/calculator";
import { toast } from "@/lib/toast";
import {
  Phone,
  Search,
  Sparkles,
  UserPlus,
  X,
  Gift,
  Star,
  UserCheck,
  Edit2,
  Check,
} from "lucide-react";
import QuickAddCustomerModal from "./QuickAddCustomerModal";

interface Props {
  customer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  onClearCustomer?: () => void;
  redeemPointsChecked?: boolean;
  onToggleRedeemPoints?: (checked: boolean) => void;
  maxEligiblePoints?: number;
  settings?: CafeSettings;
}

export default function CustomerDrawer({
  customer,
  onSelectCustomer,
  onClearCustomer,
  redeemPointsChecked = false,
  onToggleRedeemPoints = () => {},
  maxEligiblePoints = 0,
  settings,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameVal, setEditNameVal] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh customer catalog
  const reloadCustomers = () => {
    try {
      setAllCustomers(getCustomers());
    } catch {
      setAllCustomers([]);
    }
  };

  useEffect(() => {
    reloadCustomers();
  }, [customer, showQuickAdd]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter customers matching query by Name OR Mobile Number
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const qDigits = searchQuery.replace(/\D/g, "");

    return allCustomers
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const phoneDigits = c.phone.replace(/\D/g, "");
        const phoneMatch = qDigits.length >= 2 && phoneDigits.includes(qDigits);
        return nameMatch || phoneMatch;
      })
      .sort((a, b) => {
        // Prioritize name startsWith
        const aNameStarts = a.name.toLowerCase().startsWith(q);
        const bNameStarts = b.name.toLowerCase().startsWith(q);
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;

        // Prioritize phone prefix
        if (qDigits.length >= 2) {
          const aClean = a.phone.replace(/\D/g, "");
          const bClean = b.phone.replace(/\D/g, "");
          const aPhoneStarts = aClean.endsWith(qDigits) || aClean.includes(qDigits);
          const bPhoneStarts = bClean.endsWith(qDigits) || bClean.includes(qDigits);
          if (aPhoneStarts && !bPhoneStarts) return -1;
          if (!aPhoneStarts && bPhoneStarts) return 1;
        }

        return b.visitCount - a.visitCount;
      })
      .slice(0, 7); // Max 7 suggestions
  }, [allCustomers, searchQuery]);

  // Determine whether current query looks like a phone number or a name
  const trimmedQuery = searchQuery.trim();
  const digitsOnly = trimmedQuery.replace(/\D/g, "");
  const isPrimarilyDigits =
    digitsOnly.length >= 3 && digitsOnly.length / trimmedQuery.length >= 0.5;

  const quickAddInitialPhone = isPrimarilyDigits ? trimmedQuery : "";
  const quickAddInitialName = !isPrimarilyDigits ? trimmedQuery : "";

  const handleSelectCustomer = (selected: Customer) => {
    onSelectCustomer(selected);
    setSearchQuery("");
    setIsOpenDropdown(false);
    setSelectedIndex(-1);
    toast.success(`Attached customer: ${selected.name} (${selected.pointsBalance} pts)`);
  };

  const handleStartEditName = () => {
    if (!customer) return;
    setEditNameVal(customer.name);
    setIsEditingName(true);
  };

  const handleSaveCustomerName = () => {
    if (!customer || !editNameVal.trim()) return;
    try {
      const updated = updateCustomer(customer.id, { name: editNameVal.trim() });
      onSelectCustomer(updated);
      setIsEditingName(false);
      reloadCustomers();
      toast.success(`Customer name updated to "${updated.name}"`);
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleClearCustomer = () => {
    if (onClearCustomer) {
      onClearCustomer();
    } else {
      onSelectCustomer(null);
      onToggleRedeemPoints(false);
    }
    setSearchQuery("");
    setIsOpenDropdown(false);
    setSelectedIndex(-1);
    setIsEditingName(false);
    toast.info("Customer detached from active bill");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpenDropdown && e.key !== "Enter") {
      if (searchQuery.trim()) setIsOpenDropdown(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCustomers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCustomers.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredCustomers.length) {
        handleSelectCustomer(filteredCustomers[selectedIndex]);
      } else if (filteredCustomers.length === 1) {
        handleSelectCustomer(filteredCustomers[0]);
      } else if (trimmedQuery) {
        setShowQuickAdd(true);
      }
    } else if (e.key === "Escape") {
      setIsOpenDropdown(false);
    }
  };

  const pointsDiscountValue = customer
    ? Math.min(customer.pointsBalance, maxEligiblePoints) *
      (settings?.pointRedeemRateInr ?? 1)
    : 0;

  const redeemablePoints = customer
    ? Math.min(customer.pointsBalance, maxEligiblePoints)
    : 0;

  return (
    <div
      ref={containerRef}
      className="relative z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-slate-900 dark:text-white shadow-xs"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{settings?.enableLoyaltyProgram !== false ? "Customer & Loyalty" : "Customer Details"}</span>
        </div>

        {!customer && (
          <button
            type="button"
            onClick={() => {
              reloadCustomers();
              setShowQuickAdd(true);
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/40 transition-colors active:scale-95"
          >
            <UserPlus className="w-3 h-3" />
            <span>Quick Add</span>
          </button>
        )}
      </div>

      {!customer ? (
        <div className="relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name or mobile (e.g. 98765 or Aarav)"
              value={searchQuery}
              onFocus={() => {
                reloadCustomers();
                if (searchQuery.trim()) setIsOpenDropdown(true);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpenDropdown(true);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsOpenDropdown(false);
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Interactive Suggestion Dropdown Menu */}
          {isOpenDropdown && trimmedQuery && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in-50 zoom-in-95 duration-100">
              {filteredCustomers.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Matching Customers ({filteredCustomers.length})</span>
                    <span className="text-[9px] text-slate-400">Click to attach</span>
                  </div>

                  {filteredCustomers.map((c, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-colors ${
                          isSelected
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-100"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0 border border-amber-300/60 dark:border-amber-500/30">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {c.visitCount > 10 && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300/40">
                                  Regular
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 truncate mt-0.5">
                              <Phone className="w-2.5 h-2.5 inline text-slate-400 flex-shrink-0" />
                              <span>{c.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 flex items-center gap-0.5 justify-end">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>{c.pointsBalance} pts</span>
                          </div>
                          <div className="text-[9px] text-slate-400">
                            {c.visitCount} visits
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Option to Quick Add new person if looking for different number */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenDropdown(false);
                      setShowQuickAdd(true);
                    }}
                    className="w-full px-3 py-2 text-left bg-slate-50/70 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      Not here? Quick Add <strong className="underline">"{trimmedQuery}"</strong> as new customer
                    </span>
                  </button>
                </>
              ) : (
                /* No match found */
                <div className="p-3.5 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      No customer matches "{trimmedQuery}"
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Enroll this customer to earn points on this order.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenDropdown(false);
                      setShowQuickAdd(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Quick Add Customer</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Customer Found & Attached Card - Compact 2-Line Layout */
        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2 animate-in fade-in-50 duration-150 space-y-1.5">
          {/* Top Line: Avatar, Name + Edit Icon (✏️), Phone, Visits, Clear Button (✕) */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>

              {isEditingName ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    type="text"
                    value={editNameVal}
                    onChange={(e) => setEditNameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveCustomerName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    autoFocus
                    placeholder="Customer Name"
                    className="flex-1 min-w-0 px-2 py-0.5 text-xs font-bold bg-white dark:bg-slate-900 border border-amber-500 rounded text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomerName}
                    className="p-1 rounded bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                    title="Save name"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    title="Cancel edit"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0 truncate">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate" title={customer.name}>
                    {customer.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleStartEditName}
                    className="text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 p-0.5 rounded transition-colors"
                    title="Edit customer name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">
                    ({customer.phone})
                  </span>
                  <span className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {customer.visitCount}v
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearCustomer}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors flex-shrink-0"
              title="Remove customer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom Line: Points Balance & Single Redeem Checkbox */}
          {settings?.enableLoyaltyProgram !== false && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/70 dark:border-slate-700/60">
              <div className="flex items-center gap-1 text-[11px]">
                <Gift className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">Balance:</span>
                <span className="font-bold font-mono text-amber-700 dark:text-amber-400">
                  {customer.pointsBalance} pts
                </span>
              </div>

              {customer.pointsBalance > 0 && (
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer select-none bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={redeemPointsChecked}
                    onChange={(e) => onToggleRedeemPoints(e.target.checked)}
                    disabled={redeemablePoints <= 0}
                    className="rounded border-slate-300 dark:border-slate-700 text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 accent-amber-500 cursor-pointer"
                  />
                  <span className="font-medium text-amber-900 dark:text-amber-200">
                    Redeem {redeemablePoints} pts (-{formatINR(pointsDiscountValue)})
                  </span>
                </label>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Add Modal */}
      <QuickAddCustomerModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        initialPhone={quickAddInitialPhone}
        initialName={quickAddInitialName}
        onCustomerAdded={(cust) => {
          onSelectCustomer(cust);
          setSearchQuery("");
          setIsOpenDropdown(false);
          reloadCustomers();
        }}
      />
    </div>
  );
}
