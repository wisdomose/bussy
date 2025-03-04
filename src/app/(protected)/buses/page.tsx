"use client";

import useFetcher from "@/hooks/useFetcher";
import BusService, { BusWithPagination } from "@/services/buses";
import { Bus, USER_ROLE } from "@/types";
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
import { useAuthStore } from "@/store/auth";

const addSchema = z.object({
  seats: z.number().min(1, "A bus must have a minimum of 1 seat"),
});

export default function BusPage() {
  const busFetcher = useFetcher<BusWithPagination>(null);
  const addFetcher = useFetcher<boolean>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const busRepo = new BusService();
  const { role, profile } = useAuthStore((s) => s);

  const form = useForm<z.infer<typeof addSchema>>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      seats: 1,
    },
  });

  function onSubmit(data: z.infer<typeof addSchema>) {
    addFetcher.wrapper(() => {
      return busRepo.create(data);
    });
  }

  function fetchBusesHandler() {
    if (!profile) return;
    busFetcher.wrapper(() =>
      busRepo.findAll({ driverId: role === USER_ROLE.driver ? profile.id : "" })
    );
  }

  useEffect(() => {
    fetchBusesHandler();
  }, []);

  useEffect(() => {
    if (busFetcher.data) setBuses(busFetcher.data.buses);
  }, [busFetcher.data]);

  useEffect(() => {
    if (addFetcher.data) {
      toast.success("Bus created successfully");
      fetchBusesHandler();
      form.reset();
    }
  }, [addFetcher.data]);

  return (
    <div className="px-6 max-w-3xl mx-auto">
      <div className="flex justify-end mt-8">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add a bus</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="sr-only">Add a bus</DialogTitle>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <p className="font-bold text-2xl capitalize text-center">
                  Add a new bus
                </p>

                {/* email */}
                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        No of seats <span className="text-red-500">*</span>
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
                  disabled={addFetcher.loading}
                  className="w-full"
                >
                  {addFetcher.loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : (
                    "Add bus"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5">
        {buses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>No of seats</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buses.map((bus, index) => (
                <TableRow key={bus.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {format(
                      (bus.createdAt as Timestamp).toDate(),
                      "MM/dd/yyyy"
                    )}
                  </TableCell>
                  <TableCell>{bus.seats}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : busFetcher.loading ? (
          <Loader2Icon className="animate-spin" />
        ) : busFetcher.error ? (
          <p className="text-sm text-red-500 text-center">
            {busFetcher.error?.message ?? "Something went wrong"}
          </p>
        ) : buses.length === 0 ? (
          <p className="text-sm text-center">You have no buses</p>
        ) : null}
      </div>
    </div>
  );
}
