"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

interface LogItem {
  id: string;
  task_title: string;
  date_worked: string;
  hours_worked: number;
  feedback?: {
    id: string;
  } | null;
}

export default function LogsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLogs = async () => {
      setLoading(true);

      // Create a session‑aware Supabase client so RLS policies see the JWT
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      const { data, error } = await supabase
        .from("work_logs")
        .select("id, task_title, date_worked, hours_worked, feedback(id)")
        .eq("user_id", user.id)
        .order("date_worked", { ascending: false });

      if (error) {
        console.error(error.message);
      } else {
        setLogs(
          (data || []).map((log) => ({
            ...log,
            feedback:
              Array.isArray(log.feedback) && log.feedback.length > 0
                ? log.feedback[0]
                : null,
          }))
        );
      }

      setLoading(false);
    };

    fetchLogs();
  }, [user?.id, getToken]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Logs</h1>
        <Link
          href="/user/log"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Log
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-8">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-center py-8">No logs found. Start by adding one!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Task Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Feedback
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Date Worked
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Hours
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    window.location.href = `/user/log-view?id=${log.id}`;
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.task_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.feedback ? "Received" : "Pending"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.date_worked}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.hours_worked}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
