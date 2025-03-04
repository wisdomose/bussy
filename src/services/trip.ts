import { Bus, COLLECTIONS, Route, Trip, TripWithRefs, User } from "@/types";
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
import UserService from "./user";

export type TripWithPagination = {
  trips: Trip[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export default class TripService {
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
    this.join = this.join.bind(this);
  }

  async create(params: { destinationId: string; busId: string }) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const busRef = doc(this.db, COLLECTIONS.buses, params.busId);
        const routeRef = doc(this.db, COLLECTIONS.routes, params.destinationId);
        // this assumes the driver is the one creating the trip
        const driverRef = doc(
          this.db,
          COLLECTIONS.users,
          this.auth.currentUser.uid
        );

        const trip: Pick<
          TripWithRefs,
          "destination" | "driver" | "occupants" | "createdAt" | "bus"
        > = {
          destination: routeRef,
          bus: busRef,
          driver: driverRef,
          occupants: [],
          createdAt: serverTimestamp(),
        };

        const saved = await addDoc(
          collection(this.db, COLLECTIONS.trips),
          trip
        );

        // update id
        const tripRef = doc(this.db, COLLECTIONS.trips, saved.id);

        await updateDoc(tripRef, {
          id: saved.id,
          updatedAt: serverTimestamp(),
        });

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async update({
    id,
    destinationId,
    busId,
  }: Pick<Trip, "id"> & { destinationId?: string; busId?: string }) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const newTrip: Partial<TripWithRefs> = {
          updatedAt: serverTimestamp(),
        };

        if (destinationId)
          newTrip.destination = doc(this.db, COLLECTIONS.routes, destinationId);
        if (busId) newTrip.bus = doc(this.db, COLLECTIONS.buses, busId);

        // update trip
        const tripRef = doc(this.db, COLLECTIONS.trips, id);
        await updateDoc(tripRef, newTrip);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async join({ id, studentId }: Pick<Trip, "id"> & { studentId: string }) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");
        const trip = await this.findOne(id);

        if (!trip) throw new Error("Invalid trip");

        const occupants = [...trip.occupants.map((a) => a.id), studentId].map(
          (a) => doc(this.db, COLLECTIONS.users, a)
        );

        const newTrip: Partial<TripWithRefs> = {
          occupants,
          updatedAt: serverTimestamp(),
        };

        // update trip
        const tripRef = doc(this.db, COLLECTIONS.trips, id);
        await updateDoc(tripRef, newTrip);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findOne(id: string) {
    return new Promise<Trip | null>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");
        const userRepo = new UserService();

        // fetch the trip
        const tripRef = doc(this.db, COLLECTIONS.trips, id);
        const tripSnapshot = await getDoc(tripRef);

        if (!tripSnapshot.exists) throw new Error("trip doesn't exist");
        const trip = tripSnapshot.data() as unknown as TripWithRefs;

        // declare variables to hold results
        let driver: User, destination: Route, bus: Bus, occupants: User[];

        // driver
        driver = await userRepo.profile(trip.driver.id);

        // destination
        const destinationSnap = await getDoc(trip.destination);
        if (destinationSnap.exists())
          destination = destinationSnap.data() as Route;

        // bus
        const busSnap = await getDoc(trip.bus);
        if (busSnap.exists()) bus = busSnap.data() as Bus;

        // occupants
        const occupantsPromise = trip.occupants.map((occupant) => {
          return new Promise<User | null>(async (res, rej) => {
            const occupantSnap = await getDoc(occupant);
            if (occupantSnap.exists()) res(occupantSnap.data() as User);
            else res(null);
          });
        });
        occupants = (await Promise.all(occupantsPromise)).filter(
          (entry) => !!entry
        );

        // result
        let result: Trip = {
          id: trip.id,
          bus: bus!,
          destination: destination!,
          occupants,
          driver: driver!,
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt,
        };

        resolve(result);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findAll(props?: {
    page?: number;
    limit?: number;
    studentId?: string;
    driverId?: string;
  }) {
    const limit = props?.limit ?? 10,
      page = props?.page ?? 1,
      driverId = props?.driverId ?? "",
      studentId = props?.studentId ?? "";

    return new Promise<TripWithPagination>(async (resolve, reject) => {
      try {
        const col = collection(this.db, COLLECTIONS.trips);

        // create references for driver and student
        const driverRef = !driverId
          ? undefined
          : doc(this.db, COLLECTIONS.users, driverId);
        const studentRef = !studentId
          ? undefined
          : doc(this.db, COLLECTIONS.users, studentId);

        // genereate the query
        const q = studentRef
          ? where("occupants", "array-contains", studentRef)
          : driverRef
          ? where("driver", "==", driverRef)
          : null;

        const querySnapshot = !q ? query(col) : query(col, q);
        const tripSnapshot = await getDocs(querySnapshot);

        if (tripSnapshot.empty)
          resolve({
            trips: [],
            pagination: {
              page: 1,
              limit,
              total_pages: 1,
              total: 0,
            },
          });

        const tripPromise = tripSnapshot.docs.map((trip) => {
          return new Promise<Trip | null>(async (res, rej) => {
            await this.findOne(trip.id).then((data) => res(data));
            res(null);
          });
        });

        const trips = (await Promise.all(tripPromise)).filter((s) => !!s);

        const result: TripWithPagination = {
          trips,
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

        const tripRef = doc(this.db, COLLECTIONS.trips, id);
        await deleteDoc(tripRef);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error?.message ?? error);
      }
    });
  }
}
