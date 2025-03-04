import { COLLECTIONS, Bus, BusWithRefs } from "@/types";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

export type BusWithPagination = {
  buses: Bus[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export default class BusService {
  auth;
  storage;
  db;
  app;

  constructor() {
    this.app = getApp();
    this.auth = getAuth();
    this.db = getFirestore();
    this.storage = getStorage();

    this.delete = this.delete.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.findOne = this.findOne.bind(this);
    this.findAll = this.findAll.bind(this);
  }

  async create(params: Pick<Bus, "seats">) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const driverRef = doc(
          this.db,
          COLLECTIONS.users,
          this.auth.currentUser.uid
        );

        const bus: Pick<BusWithRefs, "createdAt" | "seats" | "driver"> = {
          seats: params.seats,
          driver: driverRef,
          createdAt: serverTimestamp(),
        };

        const saved = await addDoc(collection(this.db, COLLECTIONS.buses), bus);

        // update id
        const busRef = doc(this.db, COLLECTIONS.buses, saved.id);

        await updateDoc(busRef, {
          id: saved.id,
          updatedAt: serverTimestamp(),
        });

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async update({ id, seats }: Pick<Bus, "seats" | "id">) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const newBus: Partial<Bus> = {
          seats,
          updatedAt: serverTimestamp(),
        };

        // update bus
        const busRef = doc(this.db, COLLECTIONS.buses, id);
        await updateDoc(busRef, newBus);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findOne(id: string) {
    return new Promise<Bus | null>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        // fetch the bus
        const busRef = doc(this.db, COLLECTIONS.buses, id);
        const busSnapshot = await getDoc(busRef);

        if (!busSnapshot.exists) throw new Error("bus doesn't exist");
        const bus = busSnapshot.data() as unknown as Bus;

        resolve(bus);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findAll(props?: { page?: number; limit?: number; driverId?: string }) {
    const limit = props?.limit ?? 10,
      page = props?.page ?? 1,
      driverId = props?.driverId ?? "";

    return new Promise<BusWithPagination>(async (resolve, reject) => {
      try {
        const col = collection(this.db, COLLECTIONS.buses);

        // create references for driver and student
        const driverRef = !driverId
          ? undefined
          : doc(this.db, COLLECTIONS.users, driverId);

        // genereate the query
        const q = driverRef ? where("driver", "==", driverRef) : null;

        const querySnapshot = !q ? query(col) : query(col, q);
        const busSnapshot = await getDocs(querySnapshot);

        if (busSnapshot.empty)
          resolve({
            buses: [],
            pagination: {
              page: 1,
              limit,
              total_pages: 1,
              total: 0,
            },
          });

        const buses: Bus[] = [];
        busSnapshot.forEach((a) => buses.push(a.data() as unknown as Bus));

        const result: BusWithPagination = {
          buses,
          pagination: {
            page: 1,
            limit,
            total_pages: 1,
            total: 10,
          },
        };

        resolve(result);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async delete(id: string) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const busRef = doc(this.db, COLLECTIONS.buses, id);
        await deleteDoc(busRef);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error?.message ?? error);
      }
    });
  }
}
