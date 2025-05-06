"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, RefreshCcw } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
  role: string;
  totalLogs: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { getToken } = useAuth(); // Clerk hook

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      const token = await getToken();
      const supabase = createSupabaseClient(token || "");

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, active, role")
        .eq("role", "user");

      if (error) {
        console.error("Failed to fetch users", error);
        setLoading(false);
        return;
      }

      const usersWithLogCount = await Promise.all(
        data.map(async (user) => {
          const { count } = await supabase
            .from("work_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

          return { ...user, totalLogs: count ?? 0 };
        })
      );

      setUsers(usersWithLogCount);
      setLoading(false);
    };

    fetchUsers();
  }, [getToken]);

  const toggleStatus = async (userId: string, current: boolean) => {
    const token = await getToken();
    const supabase = createSupabaseClient(token || "");

    await supabase.from("users").update({ active: !current }).eq("id", userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: !current } : u))
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Users Dashboard</h1>

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Logs</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    <td colSpan={6} className="p-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{u.full_name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">{u.totalLogs}</td>
                    <td className="p-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${u.id}/logs`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(u.id, u.active)}
                      >
                        <RefreshCcw className="w-4 h-4 mr-1" />
                        Toggle
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
