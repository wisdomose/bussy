import { FieldValue, Timestamp } from "firebase/firestore";

export type Company = {
  id: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyPostCode: string;
  companyPhoneNo: string;
  companyEmail: string;
  companyVatNo: string;
  companyLogo?: string;
};
