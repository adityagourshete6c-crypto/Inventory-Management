/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  rate: number; // custom rate / markup / wholesale rate
  category: string;
  hsnCode: string; // GST required HSN code
  gstPercentage: number; // e.g. 18, 12, 5, 0, 28
}

export interface Dealer {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstin: string; // GST Number
  address: string;
  type: 'Supplier' | 'Vendor' | 'Both';
  balance: number; // outstanding balance (positive means we owe them, negative means they owe us / advance)
}

export interface DealerPayment {
  id: string;
  dealerId: string;
  date: string;
  amount: number;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';
  referenceNo?: string;
  notes?: string;
  type: 'Debit' | 'Credit'; // Debit = We paid them, Credit = We bought goods from them or received payment
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number; // monthly salary
  joiningDate: string;
  isActive: boolean;
  attendance: Record<string, 'Present' | 'Absent' | 'Leave' | 'Half-Day'>; // key is YYYY-MM-DD
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  quantity: number;
  sellingPrice: number;
  rate: number; // rate or wholesale price
  hsnCode: string;
  gstPercentage: number;
  taxableAmount: number; // qty * price
  gstAmount: number; // taxableAmount * (gstPercentage / 100)
  totalAmount: number; // taxableAmount + gstAmount
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerGstin: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subTotal: number; // sum of taxableAmounts
  gstTotal: number; // sum of gstAmounts
  cgst: number; // gstTotal / 2
  sgst: number; // gstTotal / 2
  discount: number;
  grandTotal: number; // subTotal + gstTotal - discount
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Due';
  notes?: string;
  isInterstate: boolean; // if interstate, we charge IGST instead of CGST+SGST
}

export interface BusinessDetails {
  name: string;
  tagline: string;
  ownerName: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  termsAndConditions: string;
  stateCode: string; // GST state code
  dashboardPrefix?: string; // customizable prefix, default "223-Dashboard"
  themeColor?: string; // hex or color class (e.g. "black", "blue", "emerald", "violet", "amber", "rose", "custom")
  themeMode?: 'light' | 'dark' | 'retro' | 'minimal' | 'forest' | 'corporate' | 'neon';
  customHexColor?: string; // custom hex color code e.g. "#123456"
}

export interface AppData {
  inventory: InventoryItem[];
  dealers: Dealer[];
  dealerPayments: DealerPayment[];
  employees: Employee[];
  invoices: Invoice[];
  businessDetails: BusinessDetails;
}

export interface UserAccount {
  id: string;
  mobileNumber: string;
  uniqueCode: string;
  passwordHash: string; // Plain password for simple client verification
  createdAt: string;
  businessName: string;
  storageLimitGB: number; // e.g. 256 GB
  storageUsedBytes: number;
}

export interface UserSession {
  mobileNumber: string;
  uniqueCode: string;
  loggedInAt: string;
}

