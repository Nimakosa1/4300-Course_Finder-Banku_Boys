import { Suspense } from "react";
import SearchPageClient from "./client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
