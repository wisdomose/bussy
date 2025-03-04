"use client";
import { useAuthStore } from "@/store/auth";
import { USER_ROLE } from "@/types";
import { DriverDashboard } from "./_driver dashboard";
import StudentDashboard from "./_student dashboard";
import AdminDashboard from "./_admin dashboard";

export default function DashboardPage() {
  const { role } = useAuthStore((s) => s);
  return (
    <main className="px-6 pt-3 pb-6">
      {role === USER_ROLE.admin && <AdminDashboard />}
      {role === USER_ROLE.driver && <DriverDashboard />}
      {role === USER_ROLE.student && <StudentDashboard />}
    </main>
  );
}
