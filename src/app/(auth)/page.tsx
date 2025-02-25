"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useFetcher from "@/hooks/useFetcher";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import SplashScreen from "@/components/splash-screen";
import UserService from "@/services/user";
import { User } from "@/types";
import { pages } from "@/data/page";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password is too short"),
});

export default function LoginPage() {
  const [loggedin, setLoggedin] = useState(false);
  const router = useRouter();
  const userService = new UserService();
  const { loading, error, data, wrapper } = useFetcher<User>(null);
  const { setRole, setProfile } = useAuthStore((s) => s);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await userService.profile();
        setProfile(profile);
        setRole(profile.role);
        setLoggedin(true);
        router.replace(pages.dashboard.href);
      }
    });
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof loginSchema>) {
    wrapper(() => {
      return userService.login(data);
    });
  }

  useEffect(() => {
    if (data) toast.success("Login successful. You'll be redirected shortly");
  }, [data]);

  useEffect(() => {
    if (error) toast.error(error?.message ?? error);
  }, [error]);

  if (loggedin) return <SplashScreen />;

  return (
    <>
      <div className="h-full w-full max-w-md mx-auto mt-14 p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <p className="font-bold text-2xl capitalize text-center">Login</p>

            {/* email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="string" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Password <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2Icon className="animate-spin" /> : "Login"}
            </Button>

            <p className="text-sm text-center">
              Dont have an account?{" "}
              <Link href={pages.signup.href} className="underline font-medium">
                Signup
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </>
  );
}
