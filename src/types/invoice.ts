export type Invoice = {
  // company
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyCountry: string;
  companyPostCode: string;
  companyPhoneNo: string;
  companyEmail: string;
  companyVatNo: string;
  companyLogo?: string;
  // business
  businessName: string;
  businessAddress: string;
  businessCity: string;
  businessCountry: string;
  businessPostCode: string;
  businessPhoneNo: string;
  businessEmail: string;
  businessVatNo: string;
  // invoice
  invoiceDate?: Date;
  dueDate?: Date;
  invoiceNo?: string;
};
