"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center border border-red-100">
        <div className="flex justify-center mb-4 text-red-600">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-semibold text-gray-800 mb-2">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 mb-6">
          Sorry, you don’t have permission to view this page.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-medium transition"
        >
          Go Back Home
        </button>
      </div>
    </main>
  );
}
