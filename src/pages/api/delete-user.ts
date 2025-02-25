import { User } from "@/types";
import * as admin from "firebase-admin";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth } from "firebase-admin/auth";
import { getAuth as getAuth2 } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { connectAuthEmulator } from "firebase/auth";
import { firebaseConfig } from "@/data/firebase";

interface ExtendedNextApiRequest extends NextApiRequest {
  body: Pick<User, "id">;
}

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "DELETE")
      return res.status(200).send("API up and running");

    const { id } = req.body;

    const admin2 =
      admin.apps.length > 0
        ? admin.app("admin")
        : admin.initializeApp(
            {
              // TODO: don't put this in production level code
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
        const auth = getAuth2();
        // connectStorageEmulator(storage, "localhost", 9199);
        connectFirestoreEmulator(db, "localhost", 8080);
        connectAuthEmulator(auth, "http://localhost:9099");
      }
    } catch {}

    await getAuth(admin2).deleteUser(id);

    return res.status(200).send("user deleted");
  } catch (error: any) {
    res.status(400).send(error?.response?.data ?? error.message);
  }
}
