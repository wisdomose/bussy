import { COLLECTIONS, Route } from "@/types";
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
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

export type RouteWithPagination = {
  routes: Route[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export default class RouteService {
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

  async create(params: Pick<Route, "route" | "cost">) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const route: Pick<Route, "createdAt" | "route" | "cost"> = {
          route: params.route,
          cost: params.cost,
          createdAt: serverTimestamp(),
        };

        const saved = await addDoc(
          collection(this.db, COLLECTIONS.routes),
          route
        );

        // update id
        const routeRef = doc(this.db, COLLECTIONS.routes, saved.id);

        await updateDoc(routeRef, {
          id: saved.id,
          updatedAt: serverTimestamp(),
        });

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async update({ id, route, cost }: Pick<Route, "route" | "id" | "cost">) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const newRoute: Partial<Route> = {
          route,
          cost,
          updatedAt: serverTimestamp(),
        };

        // update route
        const routeRef = doc(this.db, COLLECTIONS.routes, id);
        await updateDoc(routeRef, newRoute);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findOne(id: string) {
    return new Promise<Route | null>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        // fetch the route
        const routeRef = doc(this.db, COLLECTIONS.routes, id);
        const routeSnapshot = await getDoc(routeRef);

        if (!routeSnapshot.exists) throw new Error("route doesn't exist");
        const route = routeSnapshot.data() as unknown as Route;

        resolve(route);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findAll(props?: { page?: number; limit?: number }) {
    const limit = props?.limit ?? 10;
    const page = props?.page ?? 1;

    return new Promise<RouteWithPagination>(async (resolve, reject) => {
      try {
        const querySnapshot = query(collection(this.db, COLLECTIONS.routes));
        const routeSnapshot = await getDocs(querySnapshot);

        if (routeSnapshot.empty)
          resolve({
            routes: [],
            pagination: {
              page: 1,
              limit,
              total_pages: 1,
              total: 0,
            },
          });

        const routes: Route[] = [];
        routeSnapshot.forEach((a) => routes.push(a.data() as unknown as Route));

        const result: RouteWithPagination = {
          routes,
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

        const routeRef = doc(this.db, COLLECTIONS.routes, id);
        await deleteDoc(routeRef);

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error?.message ?? error);
      }
    });
  }
}
