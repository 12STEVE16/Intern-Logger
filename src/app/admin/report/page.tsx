// src/app/admin/report/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@clerk/nextjs";
import { jsPDF } from "jspdf";

interface Task {
  task_title: string;
  hours_worked: number;
}

export default function AdminReportPage() {
  const params = useSearchParams();
  const userId = params.get("user_id") || "";
  const { getToken } = useAuth();

  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [trainingDelivery, setTrainingDelivery] = useState("");
  const [skillDevelopment, setSkillDevelopment] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      // Fetch user name
      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single();
      setUserName(userData?.full_name || "Unknown User");

      // Fetch top 5 tasks by hours_worked
      const { data: logs } = await supabase
        .from("work_logs")
        .select("task_title, hours_worked")
        .eq("user_id", userId)
        .order("hours_worked", { ascending: false })
        .limit(5);

      setTasks(logs || []);
    })();
  }, [userId, getToken]);

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(16);
    doc.text(`Report for ${userName}`, 20, y);

    // Top 5 Tasks
    y += 10;
    doc.setFontSize(12);
    doc.text("Top 5 Tasks by Hours Worked:", 20, y);
    tasks.forEach((t, i) => {
      y += 7;
      doc.text(`${i + 1}. ${t.task_title} — ${t.hours_worked} hrs`, 25, y);
    });

    // Training Delivery
    y += 10;
    doc.setFontSize(12);
    doc.text("Training Delivery:", 20, y);
    doc.setFontSize(11);
    y += 5;
    doc.text(doc.splitTextToSize(trainingDelivery, 170), 20, y);

    // Skill Development
    y += 5 + (trainingDelivery.length / 50) * 7 + 10;
    doc.setFontSize(12);
    doc.text("Skill Development:", 20, y);
    doc.setFontSize(11);
    y += 5;
    doc.text(doc.splitTextToSize(skillDevelopment, 170), 20, y);

    // Feedback
    y += 5 + (skillDevelopment.length / 50) * 7 + 10;
    doc.setFontSize(12);
    doc.text("Feedback:", 20, y);
    doc.setFontSize(11);
    y += 5;
    doc.text(doc.splitTextToSize(feedback, 170), 20, y);

    doc.save(`${userName.replace(/\s+/g, "_")}_Report.pdf`);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Report for {userName}</h1>

      {/* Top 5 Tasks */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Top 5 Tasks</h2>
        <ul className="list-decimal list-inside space-y-1">
          {tasks.length > 0 ? (
            tasks.map((t, i) => (
              <li key={i}>
                <span className="font-medium">{t.task_title}</span> —{" "}
                {t.hours_worked} hrs
              </li>
            ))
          ) : (
            <li className="text-gray-500">No tasks found.</li>
          )}
        </ul>
      </section>

      {/* Training Delivery */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Training Delivery</h2>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={4}
          value={trainingDelivery}
          onChange={(e) => setTrainingDelivery(e.target.value)}
          placeholder="Enter training delivery details..."
        />
      </section>

      {/* Skill Development */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Skill Development</h2>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={4}
          value={skillDevelopment}
          onChange={(e) => setSkillDevelopment(e.target.value)}
          placeholder="Enter skill development details..."
        />
      </section>

      {/* Feedback */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Feedback</h2>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter feedback..."
        />
      </section>

      <div className="text-right">
        <button
          onClick={generatePDF}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          Generate PDF
        </button>
      </div>
    </div>
  );
}
