"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import SearchBar from "@/components/SearchBar";
import ClassCard from "@/components/ClassCard";
import ReviewCard from "@/components/ReviewCard";
import SimilarityGraph from "@/components/SimilarityGraph";

// Mock data for search results with the updated schema
const MOCK_CLASSES = [
  {
    id: 1,
    classCode: "CS101",
    title: "Introduction to Computer Science",
    semester: ["Fall", "Spring"],
    distribution: ["Science", "Technology"],
    description:
      "Introduction to computer science principles and programming fundamentals",
  },
  {
    id: 2,
    classCode: "MATH202",
    title: "Calculus II",
    semester: ["Spring"],
    distribution: ["Mathematics", "QR"],
    description:
      "Advanced calculus concepts including integration techniques and applications",
  },
  {
    id: 3,
    classCode: "PHYS101",
    title: "Physics I",
    semester: ["Summer", "Fall"],
    distribution: ["Science", "Laboratory"],
    description:
      "Basic physics principles covering mechanics, waves, and thermodynamics",
  },
  {
    id: 4,
    classCode: "PHYS101",
    title: "Physics I",
    semester: ["Summer", "Fall"],
    distribution: ["Science", "Laboratory"],
    description:
      "Basic physics principles covering mechanics, waves, and thermodynamics",
  },
  {
    id: 5,
    classCode: "PHYS101",
    title: "Physics I",
    semester: ["Summer", "Fall"],
    distribution: ["Science", "Laboratory"],
    description:
      "Basic physics principles covering mechanics, waves, and thermodynamics",
  },
  {
    id: 6,
    classCode: "PHYS101",
    title: "Physics I",
    semester: ["Summer", "Fall"],
    distribution: ["Science", "Laboratory"],
    description:
      "Basic physics principles covering mechanics, waves, and thermodynamics",
  },
];

// Mock data for reviews with the updated schema
const MOCK_REVIEWS = [
  {
    id: 1,
    reviewer: "Student123",
    date: "1 day ago",
    overall: 5,
    difficulty: 3,
    workload: 4,
    reviewText:
      "Great class with excellent materials. The professor explains concepts clearly.",
    professor: "Dr. Smith",
    likes: 10,
    dislikes: 1,
  },
  {
    id: 2,
    reviewer: "GradStudent22",
    date: "2 days ago",
    overall: 4,
    difficulty: 4,
    workload: 5,
    reviewText:
      "Good class but could use more examples. Assignments are challenging but rewarding.",
    professor: "Dr. Johnson",
    likes: 8,
    dislikes: 2,
  },
];

// Mock data for filters
const FILTERS = [
  { id: "filter1", label: "Fall Semester" },
  { id: "filter2", label: "Spring Semester" },
  { id: "filter3", label: "Low Workload" },
  { id: "filter4", label: "Science Distribution" },
  { id: "filter5", label: "Humanities Distribution" },
];

// Mock data for similarity graph
const KEYWORDS = [
  "Programming",
  "Mathematics",
  "Theory",
  "Practical",
  "Projects",
];
const SIMILARITY = [80, 65, 90, 75, 85];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar at the top */}
      <SearchBar initialQuery={query} />

      {/* Main content area */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        {/* Left column - Class List */}
        <div className="md:col-span-3">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-4">
            {MOCK_CLASSES.map((classItem) => (
              <ClassCard key={classItem.id} classItem={classItem} />
            ))}
          </div>
        </div>

        {/* Middle column - Graph and Reviews */}
        <div className="md:col-span-6">
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-4">
            <SimilarityGraph keywords={KEYWORDS} similarity={SIMILARITY} />

            <h2 className="text-xl font-semibold my-4">Reviews</h2>
            <div className="space-y-6">
              {MOCK_REVIEWS.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <div className="mt-6">
              <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                See more about class
              </button>
            </div>
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
                    <div className="flex items-center space-x-2">
                      <Checkbox id="fall" />
                      <label
                        htmlFor="fall"
                        className="text-sm font-medium leading-none"
                      >
                        Fall
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="spring" />
                      <label
                        htmlFor="spring"
                        className="text-sm font-medium leading-none"
                      >
                        Spring
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="summer" />
                      <label
                        htmlFor="summer"
                        className="text-sm font-medium leading-none"
                      >
                        Summer
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="winter" />
                      <label
                        htmlFor="winter"
                        className="text-sm font-medium leading-none"
                      >
                        Winter
                      </label>
                    </div>
                  </div>
                </div>
                {/* Class Level Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Class Level
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="level1000" />
                      <label
                        htmlFor="level1000"
                        className="text-sm font-medium leading-none"
                      >
                        1000
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="level2000" />
                      <label
                        htmlFor="level2000"
                        className="text-sm font-medium leading-none"
                      >
                        2000
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="level3000" />
                      <label
                        htmlFor="level3000"
                        className="text-sm font-medium leading-none"
                      >
                        3000
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="level4000" />
                      <label
                        htmlFor="level4000"
                        className="text-sm font-medium leading-none"
                      >
                        4000
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="level5000" />
                      <label
                        htmlFor="level5000"
                        className="text-sm font-medium leading-none"
                      >
                        5000+
                      </label>
                    </div>
                  </div>
                </div>

                {/* Distribution Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Distribution
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="science" />
                      <label
                        htmlFor="science"
                        className="text-sm font-medium leading-none"
                      >
                        Science
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="humanities" />
                      <label
                        htmlFor="humanities"
                        className="text-sm font-medium leading-none"
                      >
                        Humanities
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="socialScience" />
                      <label
                        htmlFor="socialScience"
                        className="text-sm font-medium leading-none"
                      >
                        Social Science
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="language" />
                      <label
                        htmlFor="language"
                        className="text-sm font-medium leading-none"
                      >
                        Language
                      </label>
                    </div>
                  </div>
                </div>

                {/* Difficulty Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Difficulty
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="easy" />
                      <label
                        htmlFor="easy"
                        className="text-sm font-medium leading-none"
                      >
                        Easy (1-2)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="medium" />
                      <label
                        htmlFor="medium"
                        className="text-sm font-medium leading-none"
                      >
                        Medium (3)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="hard" />
                      <label
                        htmlFor="hard"
                        className="text-sm font-medium leading-none"
                      >
                        Hard (4-5)
                      </label>
                    </div>
                  </div>
                </div>

                {/* Workload Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Workload
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="light" />
                      <label
                        htmlFor="light"
                        className="text-sm font-medium leading-none"
                      >
                        Light (1-2)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="moderate" />
                      <label
                        htmlFor="moderate"
                        className="text-sm font-medium leading-none"
                      >
                        Moderate (3)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="heavy" />
                      <label
                        htmlFor="heavy"
                        className="text-sm font-medium leading-none"
                      >
                        Heavy (4-5)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
