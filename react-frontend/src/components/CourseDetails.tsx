import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReviewCard from '@/components/ReviewCard';
import { Course } from '@/services/api';

interface CourseDetailsProps {
  course: Course | null;
  loading: boolean;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course, loading }) => {
  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          {loading ? "Loading..." : "Select a course to view details"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-4">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="mb-2 flex items-center">
            <span className="text-lg font-medium text-gray-500 mr-2">
              {course.course_code}
            </span>
          </div>
          <h2 className="text-2xl font-bold mb-4">
            {course['course title'] || course.title || 'No Title'}
          </h2>
          <p className="text-gray-700 mb-4">
            {course.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">
                Difficulty
              </span>
              <span className="font-semibold">
                {course.avgDifficulty && course.avgDifficulty > 0
                  ? `${course.avgDifficulty.toFixed(1)}/5`
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Workload</span>
              <span className="font-semibold">
                {course.avgWorkload && course.avgWorkload > 0
                  ? `${course.avgWorkload.toFixed(1)}/5`
                  : "N/A"}
              </span>
            </div>
          </div>

          {course.term_offered &&
            course.term_offered.length > 0 && (
              <div className="mb-4">
                <span className="font-semibold">Terms Offered: </span>
                {course.term_offered.join(", ")}
              </div>
            )}

          {course.distributions &&
            course.distributions.length > 0 && (
              <div className="mb-4">
                <span className="font-semibold">Distributions: </span>
                {course.distributions.join(", ")}
              </div>
            )}
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold my-4">Reviews</h2>
      <div className="space-y-6">
        {course.reviews &&
        course.reviews.length > 0 ? (
          course.reviews
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
          to={`/class/${course.course_code.replace(/\s+/g, "-")}?data=${encodeURIComponent(
            JSON.stringify({
              id: course.course_code,
              course_code: course.course_code,
              classCode: course.course_code,
              title: course['course title'] || course.title || 'No Title',
              description: course.description || '',
              semester: course.term_offered || [],
              distribution: course.distributions || [],
              reviews: course.reviews || [],
              avgDifficulty: course.avgDifficulty || 0,
              avgWorkload: course.avgWorkload || 0,
              avgOverall: course.avgOverall || 0,
            })
          )}`}
        >
          <Button className="w-full">
            See more about class
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CourseDetails;