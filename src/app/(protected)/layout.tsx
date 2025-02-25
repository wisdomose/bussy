"use client";
import SplashScreen from "@/components/splash-screen";
import { pages } from "@/data/page";
import UserService from "@/services/user";
import { useAuthStore } from "@/store/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const { setProfile, setRole } = useAuthStore((s) => s);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userService = new UserService();
        const profile = await userService.profile();
        setProfile(profile);
        setRole(profile.role);
        setLoaded(true);
      } else router.replace(pages.login.href);
    });
  }, []);

  if (loaded) return <>{children}</>;

  return <SplashScreen />;
}
