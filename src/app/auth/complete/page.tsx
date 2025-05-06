"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

// Correctly type the user with metadata
interface UserWithMetadata {
  publicMetadata?: {
    role?: string;
  };
}

export default function AuthCompletePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  // Type user as UserWithMetadata
  const typedUser = user as UserWithMetadata;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    // Access role from publicMetadata (if available)
    const role = typedUser?.publicMetadata?.role;
    console.log("sdfs", role);
    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else if (role === "user") {
      router.replace("/user/dashboard");
    } else {
      // Optional: handle any other cases
      router.replace("/unauthorized");
    }
  }, [isLoaded, isSignedIn, typedUser, router]); // Ensure this line has the closing parenthesis

  return <div>Redirecting...</div>;
}
