import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

// ✅ Define Zod schema for user (only once)
const UserSchema = z.object({
  id: z.string().min(1), // Relaxed to allow non-UUID id
  fullName: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.string().min(1),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

type UserType = z.infer<typeof UserSchema>;

const TABLE_NAME = "users";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { message: "Supabase credentials missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("id, full_name, email, role, active, created_at, updated_at");

    if (error || !data) {
      return NextResponse.json(
        { message: error?.message ?? "No data" },
        { status: 400 }
      );
    }

    const validatedData: UserType[] = [];

    for (const item of data) {
      try {
        // ✅ Map the fields properly
        const user = UserSchema.parse({
          id: item.id,
          fullName: item.full_name, // Mapping full_name to fullName
          email: item.email,
          role: item.role,
          active: item.active,
          createdAt: new Date(item.created_at).toISOString(),
          updatedAt: new Date(item.updated_at).toISOString(),
        });
        validatedData.push(user);
      } catch (parseError) {
        console.error("Zod validation error:", parseError);
        // Optional: you can choose to skip bad items or throw an error
      }
    }

    return NextResponse.json(validatedData);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
