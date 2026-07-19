/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, BusinessDetails, UserAccount, UserSession } from './types';

export const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  name: "",
  tagline: "",
  ownerName: "",
  address: "",
  phone: "",
  email: "",
  gstin: "",
  bankName: "",
  bankAccountNo: "",
  bankIfsc: "",
  termsAndConditions: "1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.",
  stateCode: "",
  dashboardPrefix: "223-Dashboard",
  themeColor: "black",
  themeMode: "light",
  customHexColor: "#1A1A1A"
};

export const INITIAL_DATA: AppData = {
  inventory: [],
  dealers: [],
  dealerPayments: [],
  employees: [],
  invoices: [],
  businessDetails: DEFAULT_BUSINESS_DETAILS
};

const STORAGE_KEY = "VERTEX_BIZ_APP_DATA";
const USERS_REGISTRY_KEY = "VERTEX_USERS_REGISTRY_V1";
const ACTIVE_SESSIONS_KEY = "VERTEX_ACTIVE_SESSIONS_V1";
const CURRENT_SESSION_KEY = "VERTEX_CURRENT_SESSION_V1";

export function loadAppData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        inventory: parsed.inventory || [],
        dealers: parsed.dealers || [],
        dealerPayments: parsed.dealerPayments || [],
        employees: parsed.employees || [],
        invoices: parsed.invoices || [],
        businessDetails: parsed.businessDetails || DEFAULT_BUSINESS_DETAILS,
      };
    }
  } catch (error) {
    console.error("Error loading app data", error);
  }
  return INITIAL_DATA;
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving app data", error);
  }
}

// Multi-User isolated data persistence
export function loadUserAppData(mobileNumber: string): AppData {
  try {
    const key = `VERTEX_USER_DATA_${mobileNumber}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        inventory: parsed.inventory || [],
        dealers: parsed.dealers || [],
        dealerPayments: parsed.dealerPayments || [],
        employees: parsed.employees || [],
        invoices: parsed.invoices || [],
        businessDetails: {
          ...DEFAULT_BUSINESS_DETAILS,
          ...(parsed.businessDetails || {}),
          phone: mobileNumber // default business phone to the login number
        },
      };
    }
  } catch (error) {
    console.error(`Error loading user data for ${mobileNumber}`, error);
  }
  return {
    ...INITIAL_DATA,
    businessDetails: {
      ...DEFAULT_BUSINESS_DETAILS,
      phone: mobileNumber
    }
  };
}

export function saveUserAppData(mobileNumber: string, data: AppData): void {
  try {
    const key = `VERTEX_USER_DATA_${mobileNumber}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving user data for ${mobileNumber}`, error);
  }
}

// User accounts registry
export function loadUserRegistry(): UserAccount[] {
  try {
    const saved = localStorage.getItem(USERS_REGISTRY_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading users registry", error);
  }
  return [];
}

export function saveUserRegistry(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Error saving users registry", error);
  }
}

// Active sessions list
export function loadActiveSessions(): UserSession[] {
  try {
    const saved = localStorage.getItem(ACTIVE_SESSIONS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Error loading active sessions", error);
  }
  return [];
}

export function saveActiveSessions(sessions: UserSession[]): void {
  try {
    localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving active sessions", error);
  }
}

// Current active session indicator
export function loadCurrentSession(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error("Error loading current session", error);
  }
  return null;
}

export function saveCurrentSession(mobileNumber: string | null): void {
  try {
    if (mobileNumber) {
      localStorage.setItem(CURRENT_SESSION_KEY, mobileNumber);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  } catch (error) {
    console.error("Error saving current session", error);
  }
}

