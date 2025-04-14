import React from 'react';
import ClassCard from '@/components/ClassCard';
import { Course } from '@/services/api';

interface ResultsListProps {
  results: Course[];
  loading: boolean;
  error: string | null;
  selectedCourse: Course | null;
  onSelectCourse: (course: Course) => void;
  query: string;
}

const ResultsList: React.FC<ResultsListProps> = ({
  results,
  loading,
  error,
  selectedCourse,
  onSelectCourse,
  query
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Search Results ({results.length})
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 pb-4">
        {loading ? (
          <p className="text-gray-500">Loading courses...</p>
        ) : results.length > 0 ? (
          results.map((classItem) => (
            <ClassCard
              key={classItem.course_code}
              classItem={classItem}
              isSelected={
                selectedCourse ? selectedCourse.course_code === classItem.course_code : false
              }
              onClick={() => onSelectCourse(classItem)}
            />
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
  );
};

export default ResultsList;