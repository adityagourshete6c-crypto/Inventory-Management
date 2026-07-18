/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, BusinessDetails } from './types';

export const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  name: "Vertex Enterprises",
  tagline: "Quality Electricals & Industrial Goods",
  ownerName: "Aditya G.",
  address: "Plot 42, Sector 11, Industrial Area, Bangalore, Karnataka - 560001",
  phone: "+91 98765 43210",
  email: "billing@vertexenterprises.com",
  gstin: "29AAAAA0000A1Z1",
  bankName: "State Bank of India",
  bankAccountNo: "300918273645",
  bankIfsc: "SBIN0001234",
  termsAndConditions: "1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Interest @ 18% p.a. will be charged for delayed payments after 15 days.",
  stateCode: "29 (Karnataka)"
};

export const INITIAL_DATA: AppData = {
  inventory: [
    {
      id: "item-1",
      name: "Premium Copper Wire 1.5 Sqmm (90m)",
      quantity: 120,
      buyingPrice: 850,
      sellingPrice: 1150,
      rate: 1100,
      category: "Cables & Wires",
      hsnCode: "8544",
      gstPercentage: 18
    },
    {
      id: "item-2",
      name: "Modular 6-Amp Switch (White)",
      quantity: 450,
      buyingPrice: 22,
      sellingPrice: 45,
      rate: 40,
      category: "Electrical Switches",
      hsnCode: "8536",
      gstPercentage: 18
    },
    {
      id: "item-3",
      name: "LED Ceiling Panel 15W Round",
      quantity: 85,
      buyingPrice: 180,
      sellingPrice: 320,
      rate: 300,
      category: "LED Lighting",
      hsnCode: "9405",
      gstPercentage: 12
    },
    {
      id: "item-4",
      name: "Industrial Circuit Breaker MCB 32A DP",
      quantity: 40,
      buyingPrice: 420,
      sellingPrice: 650,
      rate: 610,
      category: "Switchgears",
      hsnCode: "8536",
      gstPercentage: 18
    },
    {
      id: "item-5",
      name: "Heavy Duty PVC Insulation Tape 10m",
      quantity: 1000,
      buyingPrice: 6,
      sellingPrice: 15,
      rate: 12,
      category: "Accessories",
      hsnCode: "3919",
      gstPercentage: 18
    }
  ],
  dealers: [
    {
      id: "dealer-1",
      name: "Supreme Cables Ltd.",
      contactPerson: "Mr. Ramesh Kumar",
      phone: "+91 91122 33445",
      email: "sales@supremecables.com",
      gstin: "27AAACS1234F1Z0",
      address: "B-12, MIDC Phase 2, Pune, Maharashtra",
      type: "Supplier",
      balance: 14500
    },
    {
      id: "dealer-2",
      name: "Anchor Electrical Distributors",
      contactPerson: "Ankit Shah",
      phone: "+91 99887 76655",
      email: "ankit@anchordistributors.com",
      gstin: "29AABCA9876E1Z5",
      address: "4th Cross, Chickpet, Bangalore, Karnataka",
      type: "Both",
      balance: -3200
    },
    {
      id: "dealer-3",
      name: "Schneider Electric Power Point",
      contactPerson: "Deepak Sharma",
      phone: "+91 88776 65544",
      email: "deepak@powerpointindia.com",
      gstin: "07AAACS7890C1Z4",
      address: "Okhla Industrial Area Phase 1, New Delhi",
      type: "Supplier",
      balance: 0
    }
  ],
  dealerPayments: [
    {
      id: "payment-1",
      dealerId: "dealer-1",
      date: "2026-07-10",
      amount: 15000,
      paymentMode: "Bank Transfer",
      referenceNo: "TXN98172635",
      notes: "Part payment for Invoice SC/26/102",
      type: "Debit"
    },
    {
      id: "payment-2",
      dealerId: "dealer-2",
      date: "2026-07-12",
      amount: 8200,
      paymentMode: "UPI",
      referenceNo: "UPI22918237",
      notes: "Advance payment received for next order",
      type: "Credit"
    }
  ],
  employees: [
    {
      id: "emp-1",
      name: "Rajesh Patil",
      role: "Sales Executive",
      phone: "+91 96543 21098",
      salary: 18000,
      joiningDate: "2025-01-10",
      isActive: true,
      attendance: {
        "2026-07-15": "Present",
        "2026-07-16": "Present",
        "2026-07-17": "Present",
        "2026-07-18": "Present"
      }
    },
    {
      id: "emp-2",
      name: "Sonia Rao",
      role: "Store Manager",
      phone: "+91 95432 10987",
      salary: 22000,
      joiningDate: "2025-03-15",
      isActive: true,
      attendance: {
        "2026-07-15": "Present",
        "2026-07-16": "Present",
        "2026-07-17": "Leave",
        "2026-07-18": "Present"
      }
    },
    {
      id: "emp-3",
      name: "Karan Singh",
      role: "Delivery Associate",
      phone: "+91 94321 09876",
      salary: 14000,
      joiningDate: "2025-06-01",
      isActive: true,
      attendance: {
        "2026-07-15": "Present",
        "2026-07-16": "Half-Day",
        "2026-07-17": "Present",
        "2026-07-18": "Present"
      }
    }
  ],
  invoices: [
    {
      id: "inv-1",
      invoiceNo: "INV-2026-001",
      date: "2026-07-15",
      customerName: "Rohan Electricals Store",
      customerPhone: "+91 93210 98765",
      customerGstin: "29AABCR4567M1ZN",
      customerAddress: "Main Road, Indiranagar, Bangalore",
      items: [
        {
          itemId: "item-1",
          name: "Premium Copper Wire 1.5 Sqmm (90m)",
          quantity: 10,
          sellingPrice: 1150,
          rate: 1100,
          hsnCode: "8544",
          gstPercentage: 18,
          taxableAmount: 11500,
          gstAmount: 2070,
          totalAmount: 13570
        },
        {
          itemId: "item-3",
          name: "LED Ceiling Panel 15W Round",
          quantity: 5,
          sellingPrice: 320,
          rate: 300,
          hsnCode: "9405",
          gstPercentage: 12,
          taxableAmount: 1600,
          gstAmount: 192,
          totalAmount: 1792
        }
      ],
      subTotal: 13100,
      gstTotal: 2262,
      cgst: 1131,
      sgst: 1131,
      discount: 100,
      grandTotal: 15262,
      paymentMode: "UPI",
      isInterstate: false,
      notes: "Thanks for your business!"
    },
    {
      id: "inv-2",
      invoiceNo: "INV-2026-002",
      date: "2026-07-17",
      customerName: "National Power Grid Co.",
      customerPhone: "+91 92109 87654",
      customerGstin: "27AABCN8888D1Z2",
      customerAddress: "MIDC Area, Nagpur, Maharashtra",
      items: [
        {
          itemId: "item-4",
          name: "Industrial Circuit Breaker MCB 32A DP",
          quantity: 2,
          sellingPrice: 650,
          rate: 610,
          hsnCode: "8536",
          gstPercentage: 18,
          taxableAmount: 1300,
          gstAmount: 234,
          totalAmount: 1534
        }
      ],
      subTotal: 1300,
      gstTotal: 234,
      cgst: 0,
      sgst: 0,
      discount: 0,
      grandTotal: 1534,
      paymentMode: "Due",
      isInterstate: true, // Karnataka to Maharashtra -> IGST = 234
      notes: "Payment due within 15 days"
    }
  ],
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
