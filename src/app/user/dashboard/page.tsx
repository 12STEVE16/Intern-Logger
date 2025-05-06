"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { subDays } from "date-fns";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { createSupabaseClient } from "@/lib/supabase";

export default function UserDashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [totalLogs, setTotalLogs] = useState<number | null>(null);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [heatmapValues, setHeatmapValues] = useState<
    { date: string; count: number }[] | null
  >(null);

  useEffect(() => {
    if (!user) return;

    (async () => {
      // Build a RLS‑aware Supabase client
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      // Fetch logs from the past year for this user
      const since = subDays(new Date(), 365).toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("work_logs")
        .select("date_worked, hours_worked")
        .eq("user_id", user.id)
        .gte("date_worked", since);

      if (error) {
        console.error("Error fetching logs:", error.message);
        return;
      }

      // Aggregate totals
      setTotalLogs(data.length);
      setTotalHours(data.reduce((sum, r) => sum + (r.hours_worked || 0), 0));

      // Build heatmap values: count per day
      const counts: Record<string, number> = {};
      data.forEach(({ date_worked }) => {
        counts[date_worked] = (counts[date_worked] || 0) + 1;
      });
      setHeatmapValues(
        Object.entries(counts).map(([date, count]) => ({ date, count }))
      );
    })();
  }, [user, getToken]);

  // Show loading while Clerk is initializing
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  const today = new Date();
  const oneYearAgo = subDays(today, 365);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.firstName}!</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-4">
            Easily access your most-used features.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push("/user/log")}
              className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
            >
              ➕ Add Log
            </button>
            <button
              onClick={() => router.push("/user/logs")}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-xl hover:bg-gray-300 transition"
            >
              📄 View Logs
            </button>
          </div>
        </div>

        {/* Your Stats */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
          {totalLogs !== null && totalHours !== null ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Total Logs</p>
                <p className="text-2xl font-bold text-blue-600">{totalLogs}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Hours Spent</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalHours}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading stats...</p>
          )}
        </div>
      </section>

      {/* Activity Heatmap */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Activity Heatmap</h2>
        {heatmapValues ? (
          <CalendarHeatmap
            startDate={oneYearAgo}
            endDate={today}
            values={heatmapValues}
            showWeekdayLabels
            tooltipDataAttrs={(value: { date: string; count: number }) => ({
              "data-tip": value.date
                ? `${value.date}: ${value.count} log${
                    value.count !== 1 ? "s" : ""
                  }`
                : undefined,
            })}
            classForValue={(value: { date: string; count: number }) => {
              if (!value || value.count === 0) return "color-empty";
              if (value.count >= 4) return "color-github-4";
              return `color-github-${value.count}`;
            }}
          />
        ) : (
          <p className="text-gray-500">Loading heatmap...</p>
        )}
      </div>
    </div>
  );
}
