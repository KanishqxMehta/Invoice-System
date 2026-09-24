"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Customer } from "@/lib/types";
import { saveCustomer, updateCustomer, getCustomerByPhone, getSettings } from "@/lib/storage";
import { toast } from "@/lib/toast";
import { X, UserPlus, Phone, User, Mail, AlertCircle, Check, ArrowRight } from "lucide-react";
import Portal from "./Portal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
  onCustomerAdded: (customer: Customer) => void;
}

export default function QuickAddCustomerModal({
  isOpen,
  onClose,
  initialPhone = "",
  initialName = "",
  onCustomerAdded,
}: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Check if current phone already belongs to an existing customer
  const existingCustomer = useMemo(() => {
    if (!phone || phone.trim().length < 5) return null;
    return getCustomerByPhone(phone) || null;
  }, [phone]);

  // Sync initialPhone and initialName whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone || "");
      setName(initialName || "");
      setEmail("");
      setError("");
      setShowDuplicatePrompt(false);

      // Smart autofocus: if phone was provided, focus name; if name provided, focus phone
      const timer = setTimeout(() => {
        if (initialPhone && initialPhone.trim().length > 0 && !initialName) {
          nameInputRef.current?.focus();
        } else if (initialName && initialName.trim().length > 0 && !initialPhone) {
          phoneInputRef.current?.focus();
        } else {
          phoneInputRef.current?.focus();
        }
      }, 60);

      return () => clearTimeout(timer);
    }
  }, [isOpen, initialPhone, initialName]);

  // Escape key listener - MUST be declared unconditionally before any early returns!
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUseExisting = () => {
    if (!existingCustomer) return;
    toast.success(`Attached existing customer "${existingCustomer.name}" (${existingCustomer.pointsBalance} pts)`);
    onCustomerAdded(existingCustomer);
    onClose();
  };

  const handleUpdateExistingName = () => {
    if (!existingCustomer) return;
    if (!name.trim()) {
      setError("Please enter a valid customer name");
      nameInputRef.current?.focus();
      return;
    }
    try {
      const updated = updateCustomer(existingCustomer.id, {
        name: name.trim(),
        email: email.trim() || existingCustomer.email,
      });
      toast.success(`Customer name updated to "${updated.name}"`);
      onCustomerAdded(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update customer";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter a valid phone number");
      toast.error("Please enter a valid mobile number");
      phoneInputRef.current?.focus();
      return;
    }

    // If customer already exists
    if (existingCustomer) {
      // If cashier didn't change name or matched existing name, attach existing
      if (!name.trim() || name.trim().toLowerCase() === existingCustomer.name.toLowerCase()) {
        handleUseExisting();
        return;
      }
      // If a different name was typed, trigger the confirmation prompt
      setShowDuplicatePrompt(true);
      return;
    }

    if (!name.trim()) {
      setError("Please enter customer name");
      toast.error("Please enter customer name");
      nameInputRef.current?.focus();
      return;
    }

    let cleanPhone = phone.trim();
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = `+91 ${cleanPhone.replace(/^0+/, "")}`;
    }

    try {
      const bonus = getSettings().welcomeBonusPoints ?? 50;
      const saved = saveCustomer({
        phone: cleanPhone,
        name: name.trim(),
        email: email.trim() || undefined,
        pointsBalance: bonus,
      });

      toast.success(`Customer "${saved.name}" registered with +${bonus} welcome points!`);
      onCustomerAdded(saved);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register customer";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Quick Add Customer
            </h3>
            <p className="text-xs text-slate-500">
              Auto-enrolls +50 welcome loyalty points
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Mobile Number (+91)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setShowDuplicatePrompt(false);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Existing Customer Detected Banner */}
          {existingCustomer && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Number Already Registered</span>
                </span>
                <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full font-bold">
                  {existingCustomer.pointsBalance} pts • {existingCustomer.visitCount} visits
                </span>
              </div>
              <p className="mt-1.5 text-slate-700 dark:text-slate-300 text-xs">
                Currently registered as: <strong className="text-slate-900 dark:text-white font-bold">{existingCustomer.name}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Customer Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                ref={nameInputRef}
                type="text"
                placeholder={existingCustomer ? existingCustomer.name : "e.g. Rahul Mehta"}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowDuplicatePrompt(false);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder={existingCustomer?.email || "rahul@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Conflict Resolution Box if user typed a different name */}
          {showDuplicatePrompt && existingCustomer && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs space-y-2.5 animate-in fade-in duration-150">
              <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Existing Customer Name</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                This number belongs to <strong className="text-slate-900 dark:text-white">"{existingCustomer.name}"</strong>.
                Do you want to keep the existing name or update it to <strong className="text-amber-700 dark:text-amber-400">"{name.trim()}"</strong>?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleUseExisting}
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-600 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Keep "{existingCustomer.name}"</span>
                </button>
                <button
                  type="button"
                  onClick={handleUpdateExistingName}
                  className="flex-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Update to "{name.trim()}"</span>
                </button>
              </div>
            </div>
          )}

          {!showDuplicatePrompt && (
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md active:scale-95 transition-all"
              >
                {existingCustomer
                  ? (!name.trim() || name.trim().toLowerCase() === existingCustomer.name.toLowerCase()
                    ? `Attach "${existingCustomer.name}"`
                    : "Review & Attach")
                  : "Save & Attach"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
    </Portal>
  );
}
