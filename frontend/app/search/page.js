"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ClassCard from "@/components/ClassCard";
import ReviewCard from "@/components/ReviewCard";
import {
  searchCourses,
  filterCourses,
  calculateAverageRatings,
} from "@/lib/search-utils";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [filters, setFilters] = useState({
    semester: [],
    classLevel: [],
    difficulty: [],
    workload: [],
  });

  // Perform search when query changes
  useEffect(() => {
    const fetchData = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);
      setDebugInfo(null);

      try {
        const results = await searchCourses(query, null);
        console.log("Raw results:", results);

        if (!results || !Array.isArray(results)) {
          console.error("Invalid search results format:", results);
          setError("Received invalid data format from the server");
          setSearchResults([]);
          return;
        }

        // Format the results to match our component structure
        const formattedResults = results.map((course) => {
          // Note the space in "course title" vs underscore in others
          return {
            id: course.course_code || "Unknown",
            classCode: course.course_code || "Unknown",
            title: course["course title"] || "No Title", // Note the space in property name
            description: course.description || "",
            semester: course.term_offered || [],
            distribution: course.distributions || [],
            reviews: course.reviews || [],
            // Add calculated ratings
            ...calculateAverageRatings(course.reviews || []),
          };
        });

        console.log("Formatted results:", formattedResults.length);
        setSearchResults(formattedResults);

        // Set the first result as selected by default if available
        if (formattedResults.length > 0 && !selectedCourse) {
          setSelectedCourse(formattedResults[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch search results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };

      if (updatedFilters[filterType].includes(value)) {
        // Remove the filter if it's already selected
        updatedFilters[filterType] = updatedFilters[filterType].filter(
          (item) => item !== value
        );
      } else {
        // Add the filter
        updatedFilters[filterType] = [...updatedFilters[filterType], value];
      }

      return updatedFilters;
    });
  };

  // Apply filters to search results
  const filteredResults = filterCourses(searchResults, filters);

  // Handle class selection
  const handleClassSelect = (course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar at the top */}
      <SearchBar initialQuery={query} />

      {/* Main content area */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        {/* Left column - Class List */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">
            Search Results ({filteredResults.length})
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {debugInfo && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 text-xs">
              <details>
                <summary>API Debug Info (click to expand)</summary>
                <div className="mt-2">
                  {debugInfo.url && <p>URL: {debugInfo.url}</p>}
                  {debugInfo.status && (
                    <p>
                      Status: {debugInfo.status} {debugInfo.statusText}
                    </p>
                  )}
                  {debugInfo.error && <p>Error: {debugInfo.error}</p>}
                  {debugInfo.responseText && (
                    <div className="mt-2">
                      <p>Response:</p>
                      <pre className="bg-gray-100 p-2 mt-1 overflow-x-auto">
                        {debugInfo.responseText}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-4">
            {loading ? (
              <p className="text-gray-500">Loading courses...</p>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((classItem) => (
                <div
                  key={classItem.id}
                  onClick={() => handleClassSelect(classItem)}
                >
                  <ClassCard
                    classItem={{
                      ...classItem,
                      semester: classItem.semester || [],
                    }}
                    isSelected={
                      selectedCourse && selectedCourse.id === classItem.id
                    }
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500">
                {query
                  ? `No results found for "${query}"`
                  : "Enter a search query"}
              </p>
            )}
          </div>
        </div>

        {/* Middle column - Course Details & Reviews */}
        <div className="md:col-span-6">
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-4">
            {selectedCourse ? (
              <>
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="mb-2 flex items-center">
                      <span className="text-lg font-medium text-gray-500 mr-2">
                        {selectedCourse.classCode}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">
                      {selectedCourse.title}
                    </h2>
                    <p className="text-gray-700 mb-4">
                      {selectedCourse.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">
                          Difficulty
                        </span>
                        <span className="font-semibold">
                          {selectedCourse.avgDifficulty > 0
                            ? selectedCourse.avgDifficulty.toFixed(1)
                            : "N/A"}
                          {selectedCourse.avgDifficulty > 0 ? "/5" : ""}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Workload</span>
                        <span className="font-semibold">
                          {selectedCourse.avgWorkload > 0
                            ? selectedCourse.avgWorkload.toFixed(1)
                            : "N/A"}
                          {selectedCourse.avgWorkload > 0 ? "/5" : ""}
                        </span>
                      </div>
                    </div>

                    {selectedCourse.semester &&
                      selectedCourse.semester.length > 0 && (
                        <div className="mb-4">
                          <span className="font-semibold">Terms Offered: </span>
                          {selectedCourse.semester.join(", ")}
                        </div>
                      )}

                    {selectedCourse.distribution &&
                      selectedCourse.distribution.length > 0 && (
                        <div className="mb-4">
                          <span className="font-semibold">Distributions: </span>
                          {selectedCourse.distribution.join(", ")}
                        </div>
                      )}
                  </CardContent>
                </Card>

                <h2 className="text-xl font-semibold my-4">Reviews</h2>
                <div className="space-y-6">
                  {selectedCourse.reviews &&
                  selectedCourse.reviews.length > 0 ? (
                    selectedCourse.reviews
                      .slice(0, 2)
                      .map((review, index) => (
                        <ReviewCard key={index} review={review} />
                      ))
                  ) : (
                    <p className="text-gray-500">
                      No reviews available for this course.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <Link
                    href={{
                      pathname: `/class/${selectedCourse.id.replace(
                        /\s+/g,
                        "-"
                      )}`,
                      query: {
                        data: JSON.stringify({
                          id: selectedCourse.id,
                          classCode: selectedCourse.classCode,
                          title: selectedCourse.title,
                          description: selectedCourse.description,
                          semester: selectedCourse.semester,
                          distribution: selectedCourse.distribution,
                          reviews: selectedCourse.reviews,
                          avgDifficulty: selectedCourse.avgDifficulty,
                          avgWorkload: selectedCourse.avgWorkload,
                          avgOverall: selectedCourse.avgOverall,
                        }),
                      },
                    }}
                  >
                    <Button className="w-full px-4 py-2 text-sm font-medium">
                      See more about class
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">
                  {loading ? "Loading..." : "Select a course to view details"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Filters */}
        <div className="md:col-span-3">
          <Card className="max-h-[calc(100vh-180px)] overflow-y-auto">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Semester Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Semester
                  </h3>
                  <div className="space-y-2">
                    {["Fall", "Spring", "Summer", "Winter"].map((semester) => (
                      <div
                        key={semester}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={semester.toLowerCase()}
                          checked={filters.semester.includes(semester)}
                          onCheckedChange={() =>
                            handleFilterChange("semester", semester)
                          }
                        />
                        <label
                          htmlFor={semester.toLowerCase()}
                          className="text-sm font-medium leading-none"
                        >
                          {semester}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class Level Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Class Level
                  </h3>
                  <div className="space-y-2">
                    {["1000", "2000", "3000", "4000", "5000+"].map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <Checkbox
                          id={`level${level}`}
                          checked={filters.classLevel.includes(level)}
                          onCheckedChange={() =>
                            handleFilterChange("classLevel", level)
                          }
                        />
                        <label
                          htmlFor={`level${level}`}
                          className="text-sm font-medium leading-none"
                        >
                          {level}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Difficulty
                  </h3>
                  <div className="space-y-2">
                    {["Easy", "Medium", "Hard"].map((difficulty) => (
                      <div
                        key={difficulty}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`difficulty-${difficulty.toLowerCase()}`}
                          checked={filters.difficulty.includes(difficulty)}
                          onCheckedChange={() =>
                            handleFilterChange("difficulty", difficulty)
                          }
                        />
                        <label
                          htmlFor={`difficulty-${difficulty.toLowerCase()}`}
                          className="text-sm font-medium leading-none"
                        >
                          {difficulty}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workload Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Workload
                  </h3>
                  <div className="space-y-2">
                    {["Light", "Moderate", "Heavy"].map((workload) => (
                      <div
                        key={workload}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`workload-${workload.toLowerCase()}`}
                          checked={filters.workload.includes(workload)}
                          onCheckedChange={() =>
                            handleFilterChange("workload", workload)
                          }
                        />
                        <label
                          htmlFor={`workload-${workload.toLowerCase()}`}
                          className="text-sm font-medium leading-none"
                        >
                          {workload}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setFilters({
                      semester: [],
                      classLevel: [],
                      difficulty: [],
                      workload: [],
                    })
                  }
                >
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
