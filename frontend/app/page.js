"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("/background-image.jpg")',
          filter: "brightness(0.7)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-black mb-6">
          CourseFinder
        </h1>

        <div className="max-w-2xl w-full mb-8">
          <p className="text-xl md:text-2xl text-black mb-8">
            &quot;I want a class that teaches coding but with minimal
            assignments&quot;
          </p>

          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-xl mx-auto"
          >
            <Input
              type="text"
              placeholder="Search for classes"
              className="flex-grow bg-white/90 text-black text-lg placeholder:text-gray-500 rounded-l-lg focus:ring-2 focus:ring-blue-500 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white rounded-l-none rounded-r-lg px-6 text-lg"
            >
              Search
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
