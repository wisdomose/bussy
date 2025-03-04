import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";
import { User } from "./user";

export type Bus = {
  id: string;
  seats: number;
  driver: User;
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};

export type BusWithRefs = {
  id: string;
  seats: number;
  driver: DocumentReference;
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};
