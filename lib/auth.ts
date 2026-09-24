import { CafeAccount, AuthSession, UserRole, CafeLocation, CafeStatus } from "./types";

const ACCOUNTS_STORAGE_KEY = "cafe_pos_accounts_v1";
const SESSION_STORAGE_KEY = "cafe_pos_session_v1";
const ACTIVE_CAFE_STORAGE_KEY = "cafe_pos_active_cafe_id_v1";

export const INITIAL_CAFE_ACCOUNTS: CafeAccount[] = [
  {
    id: "admin-hq",
    username: "admin",
    password: "admin123",
    role: "SUPER_ADMIN",
    cafeName: "Chandni Chowk HQ (Admin Console)",
    branchCode: "CC-HQ",
    tagline: "Central Operations & Network Command",
    location: {
      addressLine: "Executive Suite 401, Statesman House, Barakhamba Road",
      landmark: "Near Barakhamba Metro Station Gate 2",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
    },
    managerName: "Master Administrator",
    contactPhone: "+91 99100 00001",
    contactEmail: "hq.admin@chandnichowkcheese.in",
    gstin: "07AAAAA0000A1Z5",
    fssaiNumber: "10019011000001",
    tableCount: 0,
    seatingCapacity: 0,
    upiId: "chandnihq@hdfcbank",
    upiPayeeName: "Chandni Chowk Cheese Cafe HQ",
    status: "ACTIVE",
    openingHours: "24/7 Central Operations",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cafe-delhi-flagship",
    username: "chandni_flagship",
    password: "cafe123",
    pin: "1122",
    role: "CAFE_MANAGER",
    cafeName: "Chandni Chowk Cheese Cafe - Flagship",
    branchCode: "CC-DEL-01",
    tagline: "Heritage Flavours & Artisan Melts",
    location: {
      addressLine: "Shop 48-49, Opposite Town Hall, Main Chandni Chowk Road",
      landmark: "Adjacent to Sis Ganj Sahib Gurudwara",
      city: "Old Delhi",
      state: "Delhi",
      pincode: "110006",
    },
    managerName: "Devendra Sharma",
    contactPhone: "+91 98765 43210",
    contactEmail: "flagship@chandnichowkcheese.in",
    gstin: "07AABCC8492M1ZX",
    fssaiNumber: "11223334000892",
    tableCount: 12,
    seatingCapacity: 48,
    upiId: "chandnichowkcheese@hdfcbank",
    upiPayeeName: "Chandni Chowk Cheese Cafe",
    status: "ACTIVE",
    openingHours: "08:30 AM - 11:30 PM",
    createdAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "cafe-cp-02",
    username: "chandni_cp",
    password: "cafe123",
    pin: "2233",
    role: "CAFE_MANAGER",
    cafeName: "Chandni Chowk Cheese Cafe - Connaught Place",
    branchCode: "CC-CP-02",
    tagline: "Colonial Charm & Handcrafted Brews",
    location: {
      addressLine: "C-12, Inner Circle, Connaught Place",
      landmark: "Opposite Odeon Social, Block C",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
    },
    managerName: "Vikramaditya Rao",
    contactPhone: "+91 98111 22334",
    contactEmail: "cp.branch@chandnichowkcheese.in",
    gstin: "07AABCC9900N1ZZ",
    fssaiNumber: "11223334000893",
    tableCount: 16,
    seatingCapacity: 64,
    upiId: "chandni.cp@okhdfcbank",
    upiPayeeName: "Chandni Chowk Cheese Cafe CP",
    status: "ACTIVE",
    openingHours: "09:00 AM - 12:00 AM",
    createdAt: "2026-02-01T10:00:00.000Z",
  },
  {
    id: "cafe-gurgaon-03",
    username: "chandni_gurgaon",
    password: "cafe123",
    pin: "3344",
    role: "CAFE_MANAGER",
    cafeName: "Chandni Chowk Cheese Cafe - Cyber Hub",
    branchCode: "CC-GGN-03",
    tagline: "Tech Corridor Artisan Roastery",
    location: {
      addressLine: "Unit 4B, Ground Floor, DLF Cyber Hub, DLF Phase 2",
      landmark: "Near Cyber City Rapid Metro Station",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122002",
    },
    managerName: "Simran Kaur",
    contactPhone: "+91 99999 88888",
    contactEmail: "cyberhub@chandnichowkcheese.in",
    gstin: "06AABCC7711K1Z2",
    fssaiNumber: "11223334000894",
    tableCount: 20,
    seatingCapacity: 80,
    upiId: "chandni.cyberhub@icici",
    upiPayeeName: "Chandni Chowk Cheese Cyber Hub",
    status: "ACTIVE",
    openingHours: "08:00 AM - 01:00 AM",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
];

let memoryAccounts: CafeAccount[] = [...INITIAL_CAFE_ACCOUNTS];
let memorySession: AuthSession | null = null;
let memoryActiveCafeId: string = "cafe-delhi-flagship";

function isClient(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function dispatchStorageEvent(name: string = "storage") {
  if (isClient()) {
    window.dispatchEvent(new Event(name));
    window.dispatchEvent(new Event("auth-changed"));
  }
}

// ---------------- ACCOUNTS CRUD ----------------

export function getAllCafeAccounts(): CafeAccount[] {
  if (!isClient()) return memoryAccounts;
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_CAFE_ACCOUNTS));
      return INITIAL_CAFE_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_CAFE_ACCOUNTS));
      return INITIAL_CAFE_ACCOUNTS;
    }

    // Ensure the super admin account is always present
    const hasAdmin = parsed.some((acc: CafeAccount) => acc.role === "SUPER_ADMIN" || acc.username === "admin");
    if (!hasAdmin) {
      const merged = [INITIAL_CAFE_ACCOUNTS[0], ...parsed];
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }

    return parsed;
  } catch (e) {
    console.error("Error reading cafe accounts:", e);
    return INITIAL_CAFE_ACCOUNTS;
  }
}

export function getOnlyCafeBranches(): CafeAccount[] {
  return getAllCafeAccounts().filter((acc) => acc.role !== "SUPER_ADMIN");
}

export function getCafeAccountById(id: string): CafeAccount | undefined {
  const accounts = getAllCafeAccounts();
  return accounts.find((acc) => acc.id === id);
}

export function getCafeAccountByUsername(username: string): CafeAccount | undefined {
  const accounts = getAllCafeAccounts();
  return accounts.find(
    (acc) => acc.username.trim().toLowerCase() === username.trim().toLowerCase()
  );
}

export interface CreateCafeAccountInput {
  username: string;
  password: string;
  pin?: string;
  role?: UserRole;
  cafeName: string;
  branchCode: string;
  tagline?: string;
  location: CafeLocation;
  managerName: string;
  contactPhone: string;
  contactEmail: string;
  gstin: string;
  fssaiNumber: string;
  tableCount?: number;
  seatingCapacity?: number;
  upiId?: string;
  upiPayeeName?: string;
  status?: CafeStatus;
  openingHours?: string;
}

export function createCafeAccount(input: CreateCafeAccountInput): CafeAccount {
  const accounts = getAllCafeAccounts();

  // Check unique username
  const existingUsername = accounts.find(
    (a) => a.username.trim().toLowerCase() === input.username.trim().toLowerCase()
  );
  if (existingUsername) {
    throw new Error(`Username "${input.username}" is already taken.`);
  }

  // Check unique branch code
  const existingCode = accounts.find(
    (a) => a.branchCode.trim().toUpperCase() === input.branchCode.trim().toUpperCase()
  );
  if (existingCode) {
    throw new Error(`Branch Code "${input.branchCode}" is already in use.`);
  }

  const newId = `cafe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newAccount: CafeAccount = {
    id: newId,
    username: input.username.trim(),
    password: input.password.trim(),
    pin: input.pin?.trim() || "1234",
    role: input.role || "CAFE_MANAGER",
    cafeName: input.cafeName.trim(),
    branchCode: input.branchCode.trim().toUpperCase(),
    tagline: input.tagline?.trim() || "Artisan Melts & Specialty Roastery",
    location: {
      addressLine: input.location.addressLine.trim(),
      landmark: input.location.landmark?.trim() || undefined,
      city: input.location.city.trim(),
      state: input.location.state.trim(),
      pincode: input.location.pincode.trim(),
    },
    managerName: input.managerName.trim(),
    contactPhone: input.contactPhone.trim(),
    contactEmail: input.contactEmail.trim(),
    gstin: input.gstin.trim().toUpperCase(),
    fssaiNumber: input.fssaiNumber.trim(),
    tableCount: input.tableCount || 12,
    seatingCapacity: input.seatingCapacity || (input.tableCount || 12) * 4,
    upiId: input.upiId?.trim() || `${input.username.toLowerCase()}@okhdfcbank`,
    upiPayeeName: input.upiPayeeName?.trim() || input.cafeName.trim(),
    status: input.status || "ACTIVE",
    openingHours: input.openingHours?.trim() || "09:00 AM - 11:00 PM",
    createdAt: new Date().toISOString(),
  };

  const updated = [...accounts, newAccount];
  if (!isClient()) {
    memoryAccounts = updated;
  } else {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
  }
  dispatchStorageEvent();
  return newAccount;
}

export function updateCafeAccount(id: string, updates: Partial<CafeAccount>): CafeAccount {
  const accounts = getAllCafeAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error("Cafe account not found.");
  }

  // If username changed, ensure uniqueness
  if (updates.username && updates.username.toLowerCase() !== accounts[index].username.toLowerCase()) {
    const existing = accounts.find(
      (a) => a.id !== id && a.username.toLowerCase() === updates.username!.toLowerCase()
    );
    if (existing) {
      throw new Error(`Username "${updates.username}" is already in use.`);
    }
  }

  const updatedAccount: CafeAccount = {
    ...accounts[index],
    ...updates,
    location: updates.location
      ? { ...accounts[index].location, ...updates.location }
      : accounts[index].location,
  };

  accounts[index] = updatedAccount;
  if (!isClient()) {
    memoryAccounts = accounts;
  } else {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  }

  // If current session is this user, update session user object
  const currentSession = getSession();
  if (currentSession && currentSession.user.id === id) {
    saveSession({
      ...currentSession,
      user: updatedAccount,
    });
  }

  dispatchStorageEvent();
  return updatedAccount;
}

export function deleteCafeAccount(id: string): boolean {
  const accounts = getAllCafeAccounts();
  const target = accounts.find((a) => a.id === id);
  if (!target) return false;
  if (target.role === "SUPER_ADMIN" || target.username === "admin") {
    throw new Error("The Master Super Admin account cannot be deleted.");
  }

  const filtered = accounts.filter((a) => a.id !== id);
  if (!isClient()) {
    memoryAccounts = filtered;
  } else {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
  }

  // If active cafe was deleted, revert active cafe to flagship
  if (getActiveCafeId() === id) {
    setActiveCafeId("cafe-delhi-flagship");
  }

  dispatchStorageEvent();
  return true;
}

// ---------------- AUTH SESSION & LOGIN ----------------

export function getSession(): AuthSession | null {
  if (!isClient()) return memorySession;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthSession;
    return session;
  } catch (e) {
    return null;
  }
}

export function saveSession(session: AuthSession | null): void {
  if (!isClient()) {
    memorySession = session;
    return;
  }
  if (!session) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  dispatchStorageEvent();
}

export function getCurrentUser(): CafeAccount | null {
  const session = getSession();
  return session ? session.user : null;
}

export function isSuperAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "SUPER_ADMIN" || user?.username === "admin";
}

export function login(
  username: string,
  password: string
): { success: boolean; session?: AuthSession; error?: string } {
  const accounts = getAllCafeAccounts();
  const user = accounts.find(
    (a) =>
      a.username.trim().toLowerCase() === username.trim().toLowerCase() &&
      a.password === password.trim()
  );

  if (!user) {
    return { success: false, error: "Invalid username or password. Please try again." };
  }

  if (user.status === "INACTIVE") {
    return { success: false, error: "This account has been deactivated. Contact HQ Admin." };
  }

  // Update last login
  updateCafeAccount(user.id, { lastLoginAt: new Date().toISOString() });

  // For Super Admin, default active cafe is either their last picked cafe or "ALL_CAFES"
  // For branch user, active cafe is always their own branch id!
  const defaultActiveCafeId =
    user.role === "SUPER_ADMIN"
      ? getActiveCafeId() || "ALL_CAFES"
      : user.id;

  const session: AuthSession = {
    user,
    activeCafeId: defaultActiveCafeId,
    token: `token-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
    loginAt: new Date().toISOString(),
  };

  saveSession(session);
  setActiveCafeId(defaultActiveCafeId);
  return { success: true, session };
}

export function loginWithPin(
  pin: string
): { success: boolean; session?: AuthSession; error?: string } {
  const accounts = getAllCafeAccounts();
  const user = accounts.find((a) => a.pin === pin.trim());

  if (!user) {
    return { success: false, error: "Incorrect 4-digit PIN." };
  }

  if (user.status === "INACTIVE") {
    return { success: false, error: "This cafe account is deactivated." };
  }

  updateCafeAccount(user.id, { lastLoginAt: new Date().toISOString() });

  const session: AuthSession = {
    user,
    activeCafeId: user.role === "SUPER_ADMIN" ? "ALL_CAFES" : user.id,
    token: `token-pin-${Date.now()}`,
    loginAt: new Date().toISOString(),
  };

  saveSession(session);
  setActiveCafeId(session.activeCafeId);
  return { success: true, session };
}

export function logout(): void {
  saveSession(null);
  dispatchStorageEvent();
}

// ---------------- ACTIVE STORE CONTEXT (For Admin Switcher) ----------------

export function getActiveCafeId(): string {
  if (!isClient()) return memoryActiveCafeId;
  const current = localStorage.getItem(ACTIVE_CAFE_STORAGE_KEY);
  if (current) return current;

  const session = getSession();
  if (session) {
    return session.activeCafeId || (session.user.role === "SUPER_ADMIN" ? "ALL_CAFES" : session.user.id);
  }
  return "cafe-delhi-flagship";
}

export function setActiveCafeId(cafeId: string): void {
  if (!isClient()) {
    memoryActiveCafeId = cafeId;
    return;
  }
  localStorage.setItem(ACTIVE_CAFE_STORAGE_KEY, cafeId);

  // Update session activeCafeId if logged in
  const session = getSession();
  if (session) {
    saveSession({
      ...session,
      activeCafeId: cafeId,
    });
  }
  dispatchStorageEvent();
}

export function getActiveCafe(): CafeAccount | null {
  const activeId = getActiveCafeId();
  if (activeId === "ALL_CAFES") {
    // If all cafes, return HQ admin or null
    return getAllCafeAccounts().find((a) => a.role === "SUPER_ADMIN") || null;
  }
  return getCafeAccountById(activeId) || getAllCafeAccounts().find((a) => a.id === "cafe-delhi-flagship") || null;
}

export function switchActiveCafe(cafeId: string): void {
  setActiveCafeId(cafeId);
}
