import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

export default class StorageService {
  auth;
  storage;
  app;

  constructor() {
    this.app = getApp();
    this.auth = getAuth();
    this.storage = getStorage();

    this.upload = this.upload.bind(this);
  }

  async upload(file: File) {
    return new Promise<string>(async (resolve, reject) => {
      try {
        if (!this.auth.currentUser) throw new Error("You need to be logged in");

        const storageRef = ref(
          this.storage,
          `${file.name + "-" + Date.now().toString()}.${
            file.type.split("/")[1]
          }`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        resolve(url);
      } catch (error: any) {
        reject(error.message);
      }
    });
  }
}
