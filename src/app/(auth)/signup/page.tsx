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
import UserService, { SignUpResponse } from "@/services/user";
import { User, USER_ROLE } from "@/types";
import { pages } from "@/data/page";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name is too short"),
  password: z.string().min(6, "Password is too short"),
  role: z.enum([USER_ROLE.admin, USER_ROLE.student, USER_ROLE.driver]),
});

export default function SignupPage() {
  const [loggedin, setLoggedin] = useState(false);
  const router = useRouter();
  const userService = new UserService();
  const { loading, error, data, wrapper } = useFetcher<SignUpResponse>(null);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoggedin(true);
        router.replace(pages.dashboard.href);
      }
    });
  }, []);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      name: "",
      role: USER_ROLE.student,
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof signupSchema>) {
    wrapper(() => {
      return userService.signUp(data);
    });
  }

  useEffect(() => {
    if (data) {
      toast.success("Registration successful. You'll be redirected shortly");

      router.replace(pages.login.href);
    }
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
            <p className="font-bold text-2xl capitalize text-center">Signup</p>

            {/* name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="string" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input type="email" {...field} />
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

            {/* role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Role <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Select a user role"
                          className="capitalize"
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem
                        value={USER_ROLE.student}
                        className="capitalize"
                      >
                        {USER_ROLE.student}
                      </SelectItem>
                      <SelectItem
                        value={USER_ROLE.driver}
                        className="capitalize"
                      >
                        {USER_ROLE.driver}
                      </SelectItem>
                      {/* <SelectItem
                        value={USER_ROLE.admin}
                        className="capitalize"
                      >
                        {USER_ROLE.admin}
                      </SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2Icon className="animate-spin" /> : "Signup"}
            </Button>

            <p className="text-sm text-center">
              Already have an account?{" "}
              <Link href={pages.login.href} className="underline font-medium">
                Login
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </>
  );
}
