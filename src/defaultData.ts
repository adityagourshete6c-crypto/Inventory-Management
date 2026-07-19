/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, BusinessDetails } from './types';

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
  stateCode: ""
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

export function loadAppData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure all top level fields exist
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
