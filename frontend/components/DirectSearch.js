"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DirectSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      // Send the search request to Next.js API route
      const response = await fetch("/api/courses/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "An error occurred while searching");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full my-4">
      <CardHeader>
        <CardTitle>Test Direct Search</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query"
            className="flex-grow"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>

        {error && (
          <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
            <p className="mb-2">
              Found {Array.isArray(results) ? results.length : 0} results
            </p>

            <div className="p-4 bg-gray-100 rounded overflow-auto max-h-96">
              <pre className="text-xs">
                {JSON.stringify(
                  Array.isArray(results) ? results.slice(0, 1) : results,
                  null,
                  2
                )}
                {Array.isArray(results) && results.length > 1
                  ? "\n... (more results truncated)"
                  : ""}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
