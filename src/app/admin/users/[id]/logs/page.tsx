// admin/user/[id]/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilLine } from "lucide-react";

interface Log {
  id: string;
  task_title: string;
  date_worked: string;
  hours_worked: number | null;
  feedback:
    | {
        log_id: string;
        feedback_text: string;
      }[]
    | null;
}

export default function UserLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchLogsAndUser = async () => {
      setLoading(true);

      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      const [
        { data: logsData, error: logsError },
        { data: userData, error: userError },
      ] = await Promise.all([
        supabase
          .from("work_logs")
          .select(
            `
            id,
            task_title,
            date_worked,
            hours_worked,
            feedback:feedback(log_id, feedback_text)
          `
          )
          .eq("user_id", id),
        supabase.from("users").select("full_name").eq("id", id).single(),
      ]);

      if (logsError) console.error("Error fetching logs:", logsError);
      else setLogs(logsData ?? []);

      if (userError) console.error("Error fetching user:", userError);
      else setUserName(userData?.full_name ?? "Unknown User");

      setLoading(false);
    };

    if (id) fetchLogsAndUser();
  }, [id, getToken]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header section with margin */}
      <div className="flex justify-between items-center mt-12 mb-12">
        <h1 className="text-3xl font-bold tracking-tight">
          Logs for <span className="text-blue-600">{userName}</span>
        </h1>
        <Button onClick={() => router.push(`/admin/report?user_id=${id}`)}>
          Generate Report
        </Button>
      </div>

      {/* Logs Table Card */}
      <Card className="mt-12 mb-12">
        <CardContent className="overflow-x-auto p-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Task</th>
                <th className="p-3">Date</th>
                <th className="p-3">Hours</th>
                <th className="p-3">Feedback</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr
                    key={log.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{log.task_title}</td>
                    <td className="p-3">{log.date_worked}</td>
                    <td className="p-3">
                      {log.hours_worked !== null
                        ? `${log.hours_worked} hrs`
                        : "N/A"}
                    </td>
                    <td className="p-3">
                      {log.feedback?.length ? "✅ Yes" : "❌ No"}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/users/feedback?log_id=${log.id}`)
                        }
                      >
                        <PencilLine className="w-4 h-4 mr-1" />
                        {log.feedback?.length ? "Edit" : "Add"} Feedback
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
