"use client";

import useFetcher from "@/hooks/useFetcher";
import TripService, { TripWithPagination } from "@/services/trip";
import { Trip, User } from "@/types";
import { useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { EyeIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth";
import TransactionService from "@/services/transaction";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const tripFetcher = useFetcher<TripWithPagination>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const tripRepo = new TripService();
  const profile = useAuthStore((s) => s.profile);
  const [filter, setFilter] = useState("all");

  function fetchTripHandler(props?: { page?: number; limit?: number }) {
    tripFetcher.wrapper(() => tripRepo.findAll(props));
  }

  function updateFilterHandler(filter: string) {
    setFilter(filter);
  }

  useEffect(() => {
    if (!profile) return;
    fetchTripHandler();
    // fetchTripHandler({
    //   studentId: filter === "my trips" ? profile.id : "",
    // });
  }, [filter, profile]);

  useEffect(() => {
    if (tripFetcher.data) setTrips(tripFetcher.data.trips);
  }, [tripFetcher.data]);

  return (
    <div className="mt-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl mb-5">All trips</h1>

        {/* <Select value={filter} onValueChange={updateFilterHandler}>
          <SelectTrigger className="w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trips</SelectItem>
            <SelectItem value="my trips">My trips</SelectItem>
          </SelectContent>
        </Select> */}
      </div>
      {trips.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap min-w-[200px]">
                Destination
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">
                Cost
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">
                Date
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">
                Driver
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">
                No of seats
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">
                No of occupants
              </TableHead>

              <TableHead className="whitespace-nowrap"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => {
              return (
                <TableRow key={trip.id}>
                  <TableCell className="capitalize">
                    {trip.destination.route}
                  </TableCell>
                  <TableCell className="capitalize">
                    {Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(trip.destination.cost)}
                  </TableCell>
                  <TableCell>
                    {format(
                      (trip.createdAt as Timestamp).toDate(),
                      "MM/dd/yyyy"
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {trip.driver.name}
                  </TableCell>
                  <TableCell>{trip.bus.seats}</TableCell>
                  <TableCell>{trip.occupants.length}</TableCell>
                  <TableCell>
                    {profile && <DetailsPopup trip={trip} />}
                  </TableCell>
                </TableRow>
              );
            })}
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
        <p className="text-sm text-center">No trips exsists</p>
      ) : null}
    </div>
  );
}

function DetailsPopup({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);

  function openHandler(open: boolean) {
    setOpen(open);
  }

  return (
    <Dialog open={open} onOpenChange={openHandler}>
      <DialogTrigger asChild>
        <Button size={"icon"} variant={"outline"}>
          <EyeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="sr-only">Trip detail</DialogTitle>

        <div>
          <div className="grid grid-cols-2 gap-y-5 gap-x-20 border-b py-4">
            <p className="font-medium text-sm">Destination</p>
            <div className="place-self-left">
              <p className="capitalize text-sm">{trip.destination.route}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-20 border-b py-4">
            <p className="font-medium text-sm">Cost</p>
            <div className="place-self-left">
              <p className="capitalize text-sm">
                {Intl.NumberFormat("en-NG", {
                  style: "currency",
                  currency: "NGN",
                }).format(trip.destination.cost)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-20 border-b py-4">
            <p className="font-medium text-sm">Date</p>
            <div className="place-self-left">
              <p className="text-sm">
                {format((trip.createdAt as Timestamp).toDate(), "MM/dd/yyyy")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-20 border-b py-4">
            <p className="font-medium text-sm">Driver</p>
            <div className="place-self-left">
              <p className="capitalize text-sm">{trip.driver.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-20 border-b py-4">
            <p className="font-medium text-sm">No of seats</p>
            <div className="place-self-left">
              <p className="capitalize text-sm">{trip.bus.seats}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-5 gap-x-20 py-4">
            <p className="font-medium text-sm">No of occupants</p>
            <div className="place-self-left">
              <p className="capitalize text-sm">{trip.occupants.length}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
