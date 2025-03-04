"use client";

import useFetcher from "@/hooks/useFetcher";
import RouteService, { RouteWithPagination } from "@/services/routes";
import { Route } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { Timestamp } from "firebase/firestore";
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
import { toast } from "react-toastify";

const addSchema = z.object({
  route: z.string().min(1, "A route must have a minimum of 1 character"),
  cost: z.number().min(100, "Minimum charge is ₦100"),
});

export default function RoutesPage() {
  const routeFetcher = useFetcher<RouteWithPagination>(null);
  const addFetcher = useFetcher<boolean>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const routeRepo = new RouteService();

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      route: "",
      cost: 100,
    },
  });

  function onSubmit(data: z.infer<typeof addSchema>) {
    addFetcher.wrapper(() => {
      return routeRepo.create(data);
    });
  }

  function fetchRoutesHandler() {
    routeFetcher.wrapper(() => routeRepo.findAll());
  }

  useEffect(() => {
    fetchRoutesHandler();
  }, []);

  useEffect(() => {
    if (routeFetcher.data) setRoutes(routeFetcher.data.routes);
  }, [routeFetcher.data]);

  useEffect(() => {
    if (addFetcher.data) {
      toast.success("Route created successfully");
      fetchRoutesHandler();
      form.reset();
    }
  }, [addFetcher.data]);

  return (
    <div className="px-6 max-w-4xl mx-auto">
      <div className="flex justify-between mt-8">
        <h1 className="text-2xl">All routes</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Add a route</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="sr-only">Add a route</DialogTitle>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <p className="font-bold text-2xl capitalize text-center">
                  Add a new route
                </p>

                {/* route */}
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Route <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* cost */}
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Cost <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={addFetcher.loading || !form.formState.isValid}
                  className="w-full"
                >
                  {addFetcher.loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    "Add route"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5">
        {routes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route, index) => (
                <TableRow key={route.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{route.route}</TableCell>
                  <TableCell>
                    {" "}
                    {Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(route.cost)}
                  </TableCell>
                  <TableCell>
                    {format(
                      (route.createdAt as Timestamp).toDate(),
                      "MM/dd/yyyy"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : routeFetcher.loading ? (
          <Loader2Icon className="animate-spin" />
        ) : routeFetcher.error ? (
          <p className="text-sm text-red-500 text-center">
            {routeFetcher.error?.message ?? "Something went wrong"}
          </p>
        ) : routes.length === 0 ? (
          <p className="text-sm text-center">There are no bus stops</p>
        ) : null}
      </div>
    </div>
  );
}
