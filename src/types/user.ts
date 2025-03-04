import { FieldValue, Timestamp } from "firebase/firestore";

export enum USER_ROLE {
  admin = "admin",
  student = "student",
  driver = "driver",
}

export type User = {
  id: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  role: USER_ROLE;
  email: string;
  name: string;
};
