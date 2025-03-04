"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useFetcher from "@/hooks/useFetcher";
import TripService, { TripWithPagination } from "@/services/trip";
import { Bus, Route, Trip } from "@/types";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import RouteService, { RouteWithPagination } from "@/services/routes";
import BusService, { BusWithPagination } from "@/services/buses";
import { useAuthStore } from "@/store/auth";

const addSchema = z.object({
  destinationId: z
    .string({ required_error: "Destination is required" })
    .min(1, "Destination is required"),
  busId: z
    .string({ required_error: "Bus is required" })
    .min(1, "Bus is required"),
});

export function DriverDashboard() {
  const addFetcher = useFetcher<boolean>(null);
  const tripFetcher = useFetcher<TripWithPagination>(null);
  const busFetcher = useFetcher<BusWithPagination>(null);
  const routeFetcher = useFetcher<RouteWithPagination>(null);
  const tripRepo = new TripService();
  const busRepo = new BusService();
  const routeRepo = new RouteService();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const profile = useAuthStore((s) => s.profile);

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      destinationId: "",
      busId: "",
    },
  });

  function fetchTripHandler() {
    if (!profile) return;
    tripFetcher.wrapper(() => tripRepo.findAll({ driverId: profile?.id }));
  }
  function fetchBusesHandler() {
    busFetcher.wrapper(() => busRepo.findAll());
  }
  function fetchRoutesHandler() {
    routeFetcher.wrapper(() => routeRepo.findAll());
  }

  function onSubmit(data: z.infer<typeof addSchema>) {
    addFetcher.wrapper(() => {
      return tripRepo.create(data);
    });
  }

  useEffect(() => {
    fetchTripHandler();
    fetchBusesHandler();
    fetchRoutesHandler();
  }, []);

  useEffect(() => {
    if (tripFetcher.data) setTrips(tripFetcher.data.trips);
  }, [tripFetcher.data]);

  useEffect(() => {
    if (busFetcher.data) setBuses(busFetcher.data.buses);
  }, [busFetcher.data]);

  useEffect(() => {
    if (routeFetcher.data) setRoutes(routeFetcher.data.routes);
  }, [routeFetcher.data]);

  useEffect(() => {
    if (addFetcher.data) {
      toast.success("Trip created successfully");
      fetchTripHandler();
      form.reset();
    }
  }, [addFetcher.data]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between">
        <h1 className="text-2xl">My trips</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Start a trip</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="sr-only">Start a trip</DialogTitle>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <p className="font-bold text-2xl capitalize text-center">
                  Start a new trip
                </p>

                {/* destination */}
                <FormField
                  control={form.control}
                  name="destinationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Destination <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={routes.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder="Pick a destination"
                              className="capitalize"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routes.map((route) => (
                            <SelectItem value={route.id} key={route.id}>
                              {route.route}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* bus */}
                <FormField
                  control={form.control}
                  name="busId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Bus <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={buses.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder="Pick a bus"
                              className="capitalize"
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buses.map((bus) => (
                            <SelectItem value={bus.id} key={bus.id}>
                              {bus.seats}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    "Start trip"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5">
        {trips.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destination</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>No of seats</TableHead>
                <TableHead>No of occupants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.destination.route}</TableCell>
                  <TableCell>
                    {format(
                      (trip.createdAt as Timestamp).toDate(),
                      "MM/dd/yyyy"
                    )}
                  </TableCell>
                  <TableCell>{trip.bus.seats}</TableCell>
                  <TableCell>{trip.occupants.length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : tripFetcher.loading ? (
          <div className="w-full flex items-center justify-center">
            <Loader2Icon className="animate-spin" />
          </div>
        ) : tripFetcher.error ? (
          <p className="text-sm text-red-500 text-center">
            {tripFetcher.error?.message ?? "Something went wrong"}
          </p>
        ) : trips.length === 0 ? (
          <p className="text-sm text-center">You have no trips</p>
        ) : null}
      </div>
    </div>
  );
}
