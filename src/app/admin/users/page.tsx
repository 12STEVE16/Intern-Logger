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
  const { getToken } = useAuth();

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

      const enriched = await Promise.all(
        data.map(async (user) => {
          const { count } = await supabase
            .from("work_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          return { ...user, totalLogs: count ?? 0 };
        })
      );

      setUsers(enriched);
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
    <div className="max-w-6xl w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Dashboard</h1>
      </div>

      <Card className="w-full overflow-hidden rounded-2xl shadow">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] table-auto text-sm bg-white">
              <thead className="bg-gray-100 text-xs font-semibold text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">No</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Total Logs</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 border-t transition cursor-pointer"
                      onClick={() => router.push(`/admin/users/${u.id}/logs`)}
                    >
                      <td className="px-4 py-3">{i + 1}</td>
                      <td className="px-4 py-3">{u.full_name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
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
                      <td className="px-4 py-3">{u.totalLogs}</td>
                      <td
                        className="px-4 py-3 flex gap-2 flex-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/users/${u.id}/logs`)
                          }
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
