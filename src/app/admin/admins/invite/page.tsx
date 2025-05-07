"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function InviteAdminPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Confirmation before sending invite
    const confirmed = window.confirm(
      `Are you sure you want to send an invite to ${email}?`
    );
    if (!confirmed) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json();
      if (res.ok && body.success) {
        alert("Invite sent successfully!");
        router.push("/admin/admins");
      } else {
        setError(body.error || "Failed to send invite");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Invite User as Admin</h1>
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
