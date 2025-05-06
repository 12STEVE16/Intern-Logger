"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

interface SessionClaims {
  metadata?: { role?: string };
}

export default function AdminDashboard() {
  const { user } = useUser();
  const { sessionClaims, isLoaded, getToken } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [numUsers, setNumUsers] = useState<number | null>(null);
  const [numLogs, setNumLogs] = useState<number | null>(null);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [avgHours, setAvgHours] = useState<number | null>(null);
  const router = useRouter();

  // Verify admin role
  useEffect(() => {
    if (!isLoaded) return;
    const r = (sessionClaims as SessionClaims)?.metadata?.role;
    if (r === "admin") setRole("admin");
    else router.push("/unauthorized");
  }, [isLoaded, sessionClaims, router]);

  // Fetch metrics once role is confirmed
  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      // Total users (exclude admins)
      const { count: userCount, error: userError } = await supabase
        .from("users")
        .select("id", { head: true, count: "exact" })
        .neq("role", "admin");
      if (userError) console.error(userError);
      else setNumUsers(userCount);

      // Work logs data
      const { data: logsData, error: logsError } = await supabase
        .from("work_logs")
        .select("hours_worked");
      if (logsError) console.error(logsError);
      else {
        const logCount = logsData.length;
        const sumHours = logsData.reduce(
          (sum, row) => sum + (row.hours_worked || 0),
          0
        );
        setNumLogs(logCount);
        setTotalHours(sumHours);
        setAvgHours(logCount > 0 ? sumHours / logCount : 0);
      }
    })();
  }, [role, getToken]);

  // Loading state
  if (!isLoaded || role === null) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-semibold">
            {numUsers !== null ? numUsers : "—"}
          </p>
        </div>

        {/* Total Logs */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Logs</p>
          <p className="text-2xl font-semibold">
            {numLogs !== null ? numLogs : "—"}
          </p>
        </div>

        {/* Total Hours */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Total Hours</p>
          <p className="text-2xl font-semibold">
            {totalHours !== null ? totalHours : "—"}
          </p>
        </div>

        {/* Avg Hours/Log */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <p className="text-sm text-gray-500">Avg Hours per Log</p>
          <p className="text-2xl font-semibold">
            {avgHours !== null ? avgHours.toFixed(1) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
