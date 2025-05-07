// src/app/admin/admins/page.tsx
import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const revalidate = 0; // always fetch fresh

export default async function AdminsPage() {
  // ➊ Get a real client instance
  const client = await clerkClient();

  // ➋ Fetch all users, then filter down to admins
  const { data: users } = await client.users.getUserList({ limit: 100 });
  const admins = users.filter((u) => u.publicMetadata?.role === "admin");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center mt-8 mb-16">
        <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
        <Link href="/admin/admins/invite">
          <Button size="lg">Invite Admin</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-xs uppercase tracking-wide">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-4 text-center text-gray-500">
                    No admins found.
                  </td>
                </tr>
              )}

              {admins.map((u, idx) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">
                    {u.firstName ?? ""} {u.lastName ?? ""}
                  </td>
                  <td className="p-3">
                    {u.emailAddresses[0]?.emailAddress ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
