import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Course } from '@/services/api';

interface ClassCardProps {
  classItem: Course;
  isSelected?: boolean;
  onClick?: () => void;
}

function ClassCard({ classItem, isSelected = false, onClick }: ClassCardProps) {
  const getSemesterColors = (semester: string) => {
    const trimmedSemester = semester.trim();
    switch (trimmedSemester) {
      case "Fall":
        return "bg-amber-100 text-amber-800";
      case "Spring":
        return "bg-green-100 text-green-800";
      case "Summer":
        return "bg-blue-100 text-blue-800";
      case "Winter":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card 
      className={cn(
        "transition-shadow cursor-pointer", 
        isSelected 
          ? "border-blue-500 shadow-md" 
          : "hover:shadow-md hover:border-blue-300"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-500">
            {classItem.classCode || classItem.course_code}
          </span>
          <div className="flex flex-wrap gap-1">
            {(classItem.semester || classItem.term_offered || []).map((sem, index) => (
              <span
                key={index}
                className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  getSemesterColors(sem)
                )}
              >
                {sem.trim()}
              </span>
            ))}
          </div>
        </div>
        <h3 className="font-semibold">{classItem.title || classItem['course title'] || 'No Title'}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {classItem.description || ''}
        </p>
        {(classItem.distribution || classItem.distributions || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(classItem.distribution || classItem.distributions || []).map((dist, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800"
              >
                {dist}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ClassCard;