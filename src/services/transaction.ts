import {
  Bus,
  COLLECTIONS,
  Route,
  Transaction,
  TransactionWithRefs,
  Trip,
  User,
} from "@/types";
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
import TripService from "./trip";

export type TransactionWithPagination = {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

export default class TransactionService {
  auth;
  storage;
  db;
  app;

  constructor() {
    this.app = getApp();
    this.auth = getAuth();
    this.db = getFirestore();
    this.storage = getStorage();

    this.create = this.create.bind(this);
    this.findOne = this.findOne.bind(this);
    this.findAll = this.findAll.bind(this);
  }

  async create(params: {
    driverId: string;
    studentId: string;
    tripId: string;
    amount: number;
  }) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const studentRef = doc(this.db, COLLECTIONS.users, params.studentId);
        const driverRef = doc(this.db, COLLECTIONS.users, params.driverId);
        const tripRef = doc(this.db, COLLECTIONS.trips, params.tripId);

        const transaction: Pick<
          TransactionWithRefs,
          "driver" | "student" | "createdAt" | "trip" | "amount"
        > = {
          driver: driverRef,
          student: studentRef,
          trip: tripRef,
          amount: params.amount,
          createdAt: serverTimestamp(),
        };

        const saved = await addDoc(
          collection(this.db, COLLECTIONS.transactions),
          transaction
        );

        // update id
        const transactionRef = doc(this.db, COLLECTIONS.transactions, saved.id);

        await updateDoc(transactionRef, {
          id: saved.id,
          updatedAt: serverTimestamp(),
        });

        resolve(true);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async findOne({
    trnxId = "",
    driverId = "",
    studentId = "",
  }: {
    trnxId?: string;
    driverId?: string;
    studentId?: string;
  }) {
    return new Promise<Transaction | null>(async (resolve, reject) => {
      try {
        // check if at least one search parameter is present
        if (!trnxId && !driverId && !studentId)
          throw new Error("Invalid search parameters");

        if (!this.auth.currentUser) throw new Error("You need to be logged in");
        const userRepo = new UserService();
        const tripRepo = new TripService();

        // create references for driver and student
        const driverRef = !driverId
          ? undefined
          : doc(this.db, COLLECTIONS.users, driverId);
        const studentRef = !studentId
          ? undefined
          : doc(this.db, COLLECTIONS.users, studentId);

        const q = trnxId
          ? where("id", "==", trnxId)
          : studentRef
          ? where("student", "==", studentRef)
          : driverRef
          ? where("driver", "==", driverRef)
          : null;

        if (!q) throw new Error("Invalid query");

        const col = collection(this.db, COLLECTIONS.transactions);
        const querySnapshot = query(col, q);

        const docSnapshot = await getDocs(querySnapshot);

        if (docSnapshot.empty) throw new Error("transaction doesn't exist");
        const transaction =
          docSnapshot.docs[0].data() as unknown as TransactionWithRefs;

        // declare variables to hold results
        let driver: User, student: User, trip: Trip | null;

        // driver
        driver = await userRepo.profile(transaction.driver.id);
        student = await userRepo.profile(transaction.student.id);
        trip = await tripRepo.findOne(transaction.trip.id);

        if (!trip) throw new Error("No trip found");

        // result
        let result: Transaction = {
          id: transaction.id,
          driver: driver!,
          student: student!,
          trip: trip!,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
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
    driverId?: string;
    studentId?: string;
  }) {
    const limit = props?.limit ?? 10,
      page = props?.page ?? 1,
      driverId = props?.driverId ?? "",
      studentId = props?.studentId ?? "";

    return new Promise<TransactionWithPagination>(async (resolve, reject) => {
      try {
        const col = collection(this.db, COLLECTIONS.transactions);

        // create references for driver and student
        const driverRef = !driverId
          ? undefined
          : doc(this.db, COLLECTIONS.users, driverId);
        const studentRef = !studentId
          ? undefined
          : doc(this.db, COLLECTIONS.users, studentId);

        // genereate the query
        const q = studentRef
          ? where("student", "==", studentRef)
          : driverRef
          ? where("driver", "==", driverRef)
          : null;

        const querySnapshot = !q ? query(col) : query(col, q);
        const transactionSnapshot = await getDocs(querySnapshot);

        if (transactionSnapshot.empty)
          resolve({
            transactions: [],
            pagination: {
              page: 1,
              limit,
              total_pages: 1,
              total: 0,
            },
          });

        const transactionPromise = transactionSnapshot.docs.map(
          (transaction) => {
            return new Promise<Transaction | null>(async (res, rej) => {
              await this.findOne({ trnxId: transaction.id }).then((data) =>
                res(data)
              );
              res(null);
            });
          }
        );

        const transactions = (await Promise.all(transactionPromise)).filter(
          (s) => !!s
        );

        const result: TransactionWithPagination = {
          transactions,
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
}
