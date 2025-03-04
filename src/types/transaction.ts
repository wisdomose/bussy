import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";
import { User } from "./user";
import { Trip } from "./trip";

export type Transaction = {
  id: string;
  driver: User;
  student: User;
  trip: Trip;
  amount: number;
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};

export type TransactionWithRefs = {
  id: string;
  driver: DocumentReference;
  student: DocumentReference;
  trip: DocumentReference;
  amount: number;
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};
