"use client";
import SplashScreen from "@/components/splash-screen";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { pages } from "@/data/page";
import { cn } from "@/lib/utils";
import UserService from "@/services/user";
import { useAuthStore } from "@/store/auth";
import { USER_ROLE } from "@/types";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

export default function ProtectedLayout({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const { setProfile, setRole, logout, profile } = useAuthStore((s) => s);
  const auth = getAuth();
  const { role } = useAuthStore((s) => s);
  const pathname = usePathname();

  function logoutHandler() {
    logout();
    auth.signOut();
  }

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

  if (loaded)
    return (
      <>
        <nav className="px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex gap-4 items-center">
            <Popover>
              <PopoverTrigger>
                <MenuIcon className="size-5" />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={20}
                className="p-0 max-w-[200px]"
              >
                <Link
                  href={pages.dashboard.href}
                  className={cn(
                    "hover:bg-gray-100 w-full inline-block px-4 py-3 text-sm capitalize",
                    pathname === pages.dashboard.href && "text-blue-700"
                  )}
                >
                  {pages.dashboard.label}
                </Link>
                <Link
                  href={pages.transactions.href}
                  className={cn(
                    "hover:bg-gray-100 w-full inline-block px-4 py-3 text-sm capitalize",
                    pathname === pages.transactions.href && "text-blue-700"
                  )}
                >
                  {pages.transactions.label}
                </Link>
                {role === USER_ROLE.driver && (
                  <Link
                    href={pages.buses.href}
                    className={cn(
                      "hover:bg-gray-100 w-full inline-block px-4 py-3 text-sm capitalize",
                      pathname === pages.buses.href && "text-blue-700"
                    )}
                  >
                    {pages.buses.label}
                  </Link>
                )}
                {role === USER_ROLE.admin && (
                  <Link
                    href={pages.routes.href}
                    className={cn(
                      "hover:bg-gray-100 w-full inline-block px-4 py-3 text-sm capitalize",
                      pathname === pages.routes.href && "text-blue-700"
                    )}
                  >
                    {pages.routes.label}
                  </Link>
                )}
                <button
                  onClick={logoutHandler}
                  className="hover:bg-gray-100 w-full inline-block text-left px-4 py-3 text-sm capitalize"
                >
                  Logout
                </button>
              </PopoverContent>
            </Popover>
            <Image
              src="/logo.png"
              alt="logo"
              width={384}
              height={285}
              quality={100}
              className="w-10 h-auto"
            />
          </div>

          {profile && (
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-slate-200"></div>
              <div className="">
                <p className="capitalize text-xs">{profile.name}</p>
                <p className="text-[10px] uppercase font-medium rounded-full w-fit">
                  {profile.role}
                </p>
              </div>
            </div>
          )}
        </nav>
        {children}
      </>
    );

  return <SplashScreen />;
}
