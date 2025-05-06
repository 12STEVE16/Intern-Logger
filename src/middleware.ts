// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/unauthorized(.*)",
  "/api/webhooks(.*)",
]);

interface PublicMetadata {
  role?: string;
}

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // If there's no userId and the route isn't public, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return redirectToSignIn();
  }

  // If the user is logged in, check the role and route accordingly
  if (userId) {
    const metadata = sessionClaims?.metadata as PublicMetadata; // Access metadata
    const role = metadata?.role; // Get role from metadata
    const url = req.nextUrl.pathname;

    // Redirect based on the role if accessing protected routes
    if (url.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (url.startsWith("/user") && role !== "user") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // If user is already signed in, redirect based on role when accessing the root page
    if (url === "/" && role === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (url === "/" && role === "user") {
      return NextResponse.redirect(new URL("/user/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
