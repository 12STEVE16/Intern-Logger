// app/page.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gray-50">
      <div className="max-w-xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Intern Logger
        </h1>
        <p className="text-gray-600 text-lg">
          A simple way for interns to log work, track skills, and receive
          feedback — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="http://localhost:3000" passHref>
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>

      <footer className="mt-20 text-sm text-gray-400">
        © 2025 Intern Logger. All rights reserved.
      </footer>
    </main>
  );
}
