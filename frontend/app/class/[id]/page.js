"use client";

import { Card, CardContent } from "@/components/ui/card";
import SearchBar from "@/components/SearchBar";
import ReviewCard from "@/components/ReviewCard";

// Mock data for a class with updated schema
const CLASS_DATA = {
  id: 1,
  classCode: "CS101",
  title: "Introduction to Computer Science",
  semester: ["Fall", "Spring"],
  distribution: ["Science", "Technology"],
  description:
    "This course provides a comprehensive introduction to computer science principles, including basic programming concepts, algorithms, data structures, and problem-solving techniques. Students will learn fundamental programming skills using Python and apply computational thinking to real-world problems.",
  details:
    "The course is designed for students with little to no prior programming experience. It covers variables, data types, control structures, functions, object-oriented programming basics, and elementary algorithms. Weekly programming assignments reinforce concepts covered in lectures.",
  enrollment:
    "Limited to 150 students. Priority given to Computer Science majors and minors. Students from other departments require instructor permission.",
  reviews: [
    {
      id: 1,
      reviewer: "ComputerWhiz",
      date: "2023-10-01",
      overall: 5,
      difficulty: 3,
      workload: 4,
      reviewText:
        "Excellent introduction to CS concepts! The professor made difficult concepts accessible with clear explanations and helpful examples.",
      professor: "Dr. Smith",
      likes: 10,
      dislikes: 1,
    },
    {
      id: 2,
      reviewer: "NewCoder22",
      date: "2023-10-02",
      overall: 4,
      difficulty: 2,
      workload: 3,
      reviewText:
        "Very informative and well-structured course. The assignments were challenging but doable. The professor was always available during office hours.",
      professor: "Dr. Smith",
      likes: 8,
      dislikes: 2,
    },
    {
      id: 3,
      reviewer: "StemStudent",
      date: "2023-10-03",
      overall: 3,
      difficulty: 4,
      workload: 5,
      reviewText:
        "The content was interesting, but the pace was too fast for beginners. Could use more review sessions and practice problems.",
      professor: "Dr. Johnson",
      likes: 5,
      dislikes: 3,
    },
  ],
};

export default function ClassDetailsPage({ params }) {
  const classId = params.id;
  const classData = CLASS_DATA; // In a real app, you'd fetch this based on classId

  // Function to display distribution and semester tags
  const renderTags = (items, colorClass) => {
    return items && items.length > 0 ? (
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((item, index) => (
          <span
            key={index}
            className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
          >
            {item}
          </span>
        ))}
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar at the top */}
      <SearchBar />

      {/* Class title and metadata */}
      <div className="max-w-7xl mx-auto p-4 mt-6">
        <div className="mb-2 flex items-center">
          <span className="text-lg font-medium text-gray-500 mr-2">
            {classData.classCode}
          </span>
          {renderTags(classData.semester, "bg-blue-100 text-blue-800")}
        </div>
        <h1 className="text-4xl font-bold mb-2">{classData.title}</h1>
        {renderTags(classData.distribution, "bg-purple-100 text-purple-800")}
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
        {/* Left side - Class details */}
        <div className="md:col-span-7">
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <p className="text-gray-700 mb-6">{classData.description}</p>

                <h2 className="text-2xl font-semibold mb-4">Other Details</h2>
                <p className="text-gray-700 mb-6">{classData.details}</p>

                <h2 className="text-2xl font-semibold mb-4">
                  Enrollment Information
                </h2>
                <p className="text-gray-700">{classData.enrollment}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Reviews */}
        <div className="md:col-span-5">
          <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
          <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 pb-4">
            {classData.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
