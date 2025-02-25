import { FieldValue, Timestamp } from "firebase/firestore";

export enum USER_ROLE {
  admin = "admin",
  user = "user",
}

export type User = {
  id: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  role: USER_ROLE;
  email: string;
  name: string;
};
