import * as admin from "firebase-admin";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth } from "firebase-admin/auth";
import {
  serverTimestamp,
  getFirestore,
  connectFirestoreEmulator,
  setDoc,
  doc,
} from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { COLLECTIONS, User, USER_ROLE } from "@/types";
import { firebaseConfig } from "@/data/firebase";
import { z } from "zod";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST")
      return res.status(200).send("API up and running");

    const { email, password, name = "", role } = req.body;

    const validEmail = z.string().email().safeParse(email);
    if (!validEmail.success) {
      throw new Error(validEmail.error.issues[0].message);
    }
    const validPassword = z
      .string()
      .min(6, "Password must be at least 6 characters")
      .safeParse(password);
    if (!validPassword.success) {
      throw new Error(validPassword.error.issues[0].message);
    }
    if (typeof role !== "string") {
      throw new Error("User role is required");
    }
    if (
      !Object.values(USER_ROLE)
        .map((role) => role.toLowerCase())
        .includes(role.toLowerCase())
    )
      throw new Error("Invalid user role");

    const admin2 =
      admin.apps.length > 0
        ? admin.app("admin")
        : admin.initializeApp(
            {
              credential: admin.credential.cert({
                projectId: process.env.projectId,
                clientEmail: process.env.clientEmail,
                privateKey: process.env.privateKey,
              }),
            },
            "admin"
          );

    initializeClientApp(firebaseConfig);
    const db = getFirestore();

    try {
      if (process.env.NODE_ENV === "development") {
        // connectStorageEmulator(storage, "localhost", 9199);
        connectFirestoreEmulator(db, "localhost", 8080);
        // connectAuthEmulator(auth, "http://localhost:9099");
      }
    } catch {}

    const userRecord = await getAuth(admin2).createUser({
      email,
      password,
      displayName:name,
      emailVerified: false,
      disabled: false,
    });

    const userDoc: User = {
      id: userRecord.uid,
      role: role as USER_ROLE,
      email,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const userRef = doc(db, COLLECTIONS.users, userRecord.uid);

    await setDoc(userRef, userDoc);

    res.status(200).json(userDoc);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
}
