import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/express"; // updated import
import type { WebhookEvent } from "@clerk/nextjs/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!;

type UserCreatedData = {
  id: string;
  email_addresses: { email_address: string }[];
  first_name?: string;
  last_name?: string;
};

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const headers = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };

  let event: WebhookEvent;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    event = wh.verify(payload, headers) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } =
      event.data as UserCreatedData;

    if (!id || !email_addresses?.[0]?.email_address) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const fullName = `${first_name || ""} ${last_name || ""}`.trim();
    const email = email_addresses[0].email_address;

    // 🛑 Wait for metadata to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 🛑 Fetch fresh user from Clerk
    let userRole = "user"; // default role if metadata is not available

    try {
      const user = await clerkClient.users.getUser(id);
      const publicMetadata = user.publicMetadata as { role?: string };

      // If publicMetadata doesn't exist or doesn't have a role, assign 'user'
      if (publicMetadata?.role) {
        userRole = publicMetadata.role;
      } else {
        // Optionally, update the role to 'user' if it's not set
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            role: "user", // Adding role as part of publicMetadata
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user publicMetadata from Clerk:", error);
    }

    // Insert/Update in Supabase
    const { error: supabaseError } = await supabase.from("users").upsert(
      {
        id: id,
        full_name: fullName,
        email: email,
        role: userRole, // Use role from Clerk metadata, defaulting to 'user' if not found
        active: true,
      },
      { onConflict: "email" }
    );

    if (supabaseError) {
      console.error("Supabase upsert error:", supabaseError);
      return NextResponse.json(
        { error: supabaseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json(
    { error: "Unsupported event type" },
    { status: 400 }
  );
}
