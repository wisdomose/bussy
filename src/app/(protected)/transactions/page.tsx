"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import useFetcher from "@/hooks/useFetcher";
import TransactionService, {
  TransactionWithPagination,
} from "@/services/transaction";
import { useAuthStore } from "@/store/auth";
import { Transaction, USER_ROLE } from "@/types";
import { useEffect, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Timestamp } from "firebase/firestore";

export default function TransactionsPage() {
  const searchFetcher = useFetcher<TransactionWithPagination>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const transactionRepo = new TransactionService();
  const { role, profile } = useAuthStore((s) => s);

  function fetchRoutesHandler(query: {
    driverId?: string;
    studentId?: string;
  }) {
    searchFetcher.wrapper(() => transactionRepo.findAll(query));
  }

  useEffect(() => {
    fetchRoutesHandler(
      role === USER_ROLE.admin
        ? {}
        : {
            studentId: role === USER_ROLE.student ? profile?.id : "",
            driverId: role === USER_ROLE.driver ? profile?.id : "",
          }
    );
  }, [role, profile]);

  useEffect(() => {
    if (searchFetcher.data) setTransactions(searchFetcher.data.transactions);
  }, [searchFetcher.data]);

  return (
    <div className="px-6 mt-5">
      <h1 className="text-2xl mb-5">
        {role === USER_ROLE.admin ? "All transactions" : "All my transactions"}
      </h1>
      <div className="">
        {transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S/N</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date Paid</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Student</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={transaction.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{transaction.id}</TableCell>
                  <TableCell>
                    {format(
                      (transaction.createdAt as Timestamp).toDate(),
                      "MM/dd/yyyy"
                    )}
                  </TableCell>
                  <TableCell>
                    {Intl.NumberFormat("en-NG", {
                      style: "currency",
                      currency: "NGN",
                    }).format(transaction.amount)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {transaction.driver.name}
                  </TableCell>
                  <TableCell className="capitalize">
                    {transaction.student.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : searchFetcher.loading ? (
          <div className="flex items-center justify-center">
            <Loader2Icon className="animate-spin" />
          </div>
        ) : searchFetcher.error ? (
          <p className="text-sm text-red-500 text-center">
            {searchFetcher.error?.message ?? "Something went wrong"}
          </p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-center">There are no transactions</p>
        ) : null}
      </div>
    </div>
  );
}
