import { FieldValue, Timestamp } from "firebase/firestore";

export type Route = {
  id: string;
  route: string;
  cost: number;
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};
