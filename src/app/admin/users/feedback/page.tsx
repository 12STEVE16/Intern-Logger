"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";

export default function FeedbackForm() {
  const searchParams = useSearchParams();
  const logId = searchParams.get("log_id");
  const router = useRouter();
  const { getToken } = useAuth();

  const [feedbackText, setFeedbackText] = useState("");
  const [fullName, setFullName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!logId) return;

    const fetchData = async () => {
      // build token‑aware client
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      // fetch the log
      const { data: logData, error: logError } = await supabase
        .from("work_logs")
        .select("id, task_title, description, user_id")
        .eq("id", logId)
        .single();

      if (logError) {
        console.error("Error fetching log:", logError.message);
        return;
      }

      // fetch the user who owns the log
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", logData?.user_id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError.message);
        return;
      }

      setFullName(userData?.full_name || "");
      setTaskTitle(logData?.task_title || "");
      setDescription(logData?.description || "");

      // fetch existing feedback if any
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("id, feedback_text")
        .eq("log_id", logId)
        .single();

      if (feedbackData) {
        setFeedbackText(feedbackData.feedback_text || "");
      }

      // ignore “not found” error code PGRST116
      if (feedbackError && feedbackError.code !== "PGRST116") {
        console.error("Error fetching feedback:", feedbackError.message);
      }
    };

    fetchData();
  }, [logId, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // build token‑aware client
    const token = await getToken();
    const supabase = createSupabaseClient(token || "");

    // check if feedback exists
    const { data: existingFeedback, error: feedbackError } = await supabase
      .from("feedback")
      .select("id")
      .eq("log_id", logId)
      .single();

    if (feedbackError && feedbackError.code !== "PGRST116") {
      console.error("Error checking existing feedback:", feedbackError.message);
      return;
    }

    if (existingFeedback) {
      // update
      const { error: updateError } = await supabase
        .from("feedback")
        .update({ feedback_text: feedbackText })
        .eq("id", existingFeedback.id);

      if (updateError) {
        console.error("Error updating feedback:", updateError.message);
        return;
      }
      alert("Feedback updated.");
    } else {
      // insert
      const { error: insertError } = await supabase.from("feedback").insert([
        {
          log_id: logId,
          feedback_text: feedbackText,
        },
      ]);

      if (insertError) {
        console.error("Error inserting feedback:", insertError.message);
        return;
      }
      alert("Feedback submitted.");
    }

    // redirect back to the logs list for that user
    if (logId) {
      const { data: logInfo } = await supabase
        .from("work_logs")
        .select("user_id")
        .eq("id", logId)
        .single();

      if (logInfo?.user_id) {
        router.push(`/admin/users/${logInfo.user_id}/logs`);
      }
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Submit Feedback</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Name"
          className="w-full p-2 border rounded bg-gray-100"
          disabled
        />
        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Task Title"
          className="w-full p-2 border rounded bg-gray-100"
          disabled
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="w-full p-2 border rounded bg-gray-100"
          disabled
        />
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="Feedback"
          className="w-full p-2 border rounded min-h-[150px]"
          rows={6}
          required
        />

        <div className="flex gap-4 justify-end mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-32"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="border border-gray-300 px-6 py-2 rounded-md w-32 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
