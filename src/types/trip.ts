import { DocumentReference, FieldValue, Timestamp } from "firebase/firestore";
import { Route } from "./route";
import { Bus } from "./bus";
import { User } from "./user";

export type TripWithRefs = {
  id: string;
  destination: DocumentReference;
  bus: DocumentReference;
  driver: DocumentReference;
  occupants: DocumentReference[];
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};

export type Trip = {
  id: string;
  destination: Route;
  bus: Bus;
  driver: User;
  occupants: User[];
  createdAt: FieldValue | Timestamp;
  updatedAt: FieldValue | Timestamp;
};