"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import Link from "next/link";

interface LogData {
  id: string;
  task_title: string;
  description: string;
  date_worked: string;
  hours_worked: number;
  feedback?: {
    feedback_text: string;
  } | null;
}

export default function LogViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const logId = searchParams.get("id");
  const [log, setLog] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!logId) {
      router.push("/user/logs");
      return;
    }

    const fetchLog = async () => {
      setLoading(true);

      // create session‑aware supabase client
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      const { data, error } = await supabase
        .from("work_logs")
        .select(
          `
          id,
          task_title,
          description,
          date_worked,
          hours_worked,
          feedback(feedback_text)
        `
        )
        .eq("id", logId)
        .single();

      if (error) {
        console.error(error.message);
      } else {
        setLog({
          ...data,
          feedback: data.feedback?.[0] || null,
        });
      }

      setLoading(false);
    };

    fetchLog();
  }, [logId, router, getToken]);

  if (loading) {
    return <p className="text-center py-8">Loading...</p>;
  }

  if (!log) {
    return <p className="text-center py-8">Log not found.</p>;
  }

  const feedbackGiven = !!log.feedback;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Log Details</h1>

      <div className="space-y-4">
        <div>
          <span className="font-semibold">Date Worked: </span>
          {log.date_worked}
        </div>

        <div>
          <span className="font-semibold">Task Title: </span>
          {log.task_title}
        </div>

        <div>
          <span className="font-semibold">Description: </span>
          {log.description}
        </div>

        <div>
          <span className="font-semibold">Hours Worked: </span>
          {log.hours_worked}
        </div>

        <div>
          <span className="font-semibold">Feedback: </span>
          {feedbackGiven ? log.feedback?.feedback_text : "No feedback yet."}
        </div>
      </div>

      <div className="flex space-x-4 mt-8">
        {!feedbackGiven && (
          <Link
            href={`/user/log?id=${log.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Edit Log
          </Link>
        )}
        <Link
          href="/user/logs"
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400"
        >
          Back to Logs
        </Link>
      </div>
    </div>
  );
}
