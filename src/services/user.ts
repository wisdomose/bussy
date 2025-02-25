import { COLLECTIONS, User } from "@/types";
import axios from "axios";
import { getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  updateDoc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

export type LoginResponse = User;
export type SignUpResponse = User;

export default class UserService {
  auth;
  storage;
  db;
  app;

  constructor() {
    this.app = getApp();
    this.auth = getAuth();
    this.db = getFirestore();
    this.storage = getStorage();

    this.login = this.login.bind(this);
    this.profile = this.profile.bind(this);
    this.signUp = this.signUp.bind(this);
    this.deleteOne = this.deleteOne.bind(this);
    this.logout = this.logout.bind(this);
    this.update = this.update.bind(this);
  }

  async login({ email, password }: { email: string; password: string }) {
    return new Promise<LoginResponse>(async (resolve, reject) => {
      try {
        const userCredential = await signInWithEmailAndPassword(
          this.auth,
          email,
          password
        );

        if (userCredential.user) {
          const profile = await this.profile();
          resolve(profile);
        }

        throw new Error("Failed to login");
      } catch (error: any) {
        console.log(error);
        reject(error?.response?.data ?? error?.message ?? "Failed to login");
      }
    });
  }

  async signUp(
    params: Pick<User, "email" | "name" | "role"> & {
      password: string;
    }
  ) {
    return new Promise<SignUpResponse>(async (resolve, reject) => {
      try {
        if (this.auth.currentUser)
          throw new Error("You cannot perform this operation");

        const result = await axios({
          url: `/api/create-user`,
          method: "POST",
          data: params,
        });

        resolve(result.data);
      } catch (error: any) {
        reject(error?.response?.data ?? error.message);
      }
    });
  }

  async profile(id?: string) {
    return new Promise<User>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const userRef = doc(
          this.db,
          COLLECTIONS.users,
          id ?? this.auth.currentUser.uid
        );

        const querySnapshot = await getDoc(userRef);

        if (querySnapshot.exists()) {
          const data = querySnapshot.data;
          resolve(data as unknown as User);
        } else {
          throw new Error("User doesn't exist");
        }
      } catch (error: any) {
        reject(error?.message ?? error);
      }
    });
  }

  async deleteOne(id: string) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const userRef = doc(this.db, COLLECTIONS.users, id);

        await axios({
          url: `/api/delete-user`,
          method: "DELETE",
          data: { id },
        });

        await deleteDoc(userRef);

        resolve(true);
      } catch (error: any) {
        reject(error.message);
      }
    });
  }

  async update(id: string, params: Partial<Pick<User, "name">>) {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const userRef = doc(this.db, COLLECTIONS.users, id);
        await updateDoc(userRef, params);

        resolve(true);
      } catch (error: any) {
        reject(error.message);
      }
    });
  }

  async logout() {
    await this.auth.signOut();
  }
}
