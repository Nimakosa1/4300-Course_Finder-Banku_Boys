"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchBar({ initialQuery = "" }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const router = useRouter();

  // Update searchQuery when initialQuery changes
  useEffect(() => {
    setSearchQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          CourseFinder
        </Link>
        <form onSubmit={handleSearch} className="flex w-full max-w-xl">
          <Input
            type="text"
            placeholder="Search for classes"
            className="rounded-r-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" className="rounded-l-none">
            Search
          </Button>
        </form>
      </div>
    </div>
  );
}