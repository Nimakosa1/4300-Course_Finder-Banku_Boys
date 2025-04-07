import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import ReviewCard from '@/components/ReviewCard';
import { Card, CardContent } from '@/components/ui/card';
import { getCourse} from '@/services/api';
import { cn } from '@/lib/utils';

interface ClassData {
  id?: string;
  classCode: string;
  course_code: string; 
  title?: string;
  "course title"?: string;
  description?: string;
  semester?: string[];
  distribution?: string[];
  reviews?: Review[];
  avgDifficulty?: number;
  avgWorkload?: number;
  avgOverall?: number;
}

interface Review {
  professor?: string;
  major?: string;
  grade?: string;
  overall?: string;
  difficulty?: string;
  workload?: string;
  comment?: string;
}

function ClassDetailsPage() {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const classId = params.id;
  const passedData = searchParams.get('data');

  useEffect(() => {
    const loadClassData = async () => {
      if (!classId) return;

      setLoading(true);
      setError(null);

      try {
        if (passedData) {
          try {
            const parsedData = JSON.parse(passedData);
            console.log('Using data passed from search page:', parsedData);
            setClassData(parsedData);
            setLoading(false);
            return; 
          } catch (e) {
            console.error('Error parsing passed data:', e);
          }
        }

        const originalClassId = classId.replace(/-/g, ' ');
        console.log('Fetching data for class:', originalClassId);

        const courseInfo = await getCourse(originalClassId);

        if (courseInfo) {
          setClassData({
            id: courseInfo.course_code,
            course_code: courseInfo.course_code, 
            classCode: courseInfo.course_code,
            title: courseInfo['course title'] || 'No Title',
            description: courseInfo.description || 'No description available',
            semester: courseInfo.term_offered || [],
            distribution: courseInfo.distributions || [],
            reviews: courseInfo.reviews || [],
            avgDifficulty: courseInfo.avgDifficulty || 0,
            avgWorkload: courseInfo.avgWorkload || 0,
            avgOverall: courseInfo.avgOverall || 0,
          });
        } else {
          setError('Course not found. Please check the course ID.');
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        setError('Failed to load course data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadClassData();
  }, [classId, passedData]);

  const renderTags = (items: string[] | undefined, colorClass: string) => {
    return items && items.length > 0 ? (
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((item, index) => (
          <span
            key={index}
            className={cn(`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`)}
          >
            {item}
          </span>
        ))}
      </div>
    ) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SearchBar />
        <div className="max-w-7xl mx-auto p-4 mt-6 flex justify-center items-center">
          <p className="text-lg">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SearchBar />
        <div className="max-w-7xl mx-auto p-4 mt-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SearchBar />
        <div className="max-w-7xl mx-auto p-4 mt-6">
          <p className="text-lg text-center">
            Course not found. Please check the course ID and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar at the top */}
      <SearchBar />

      {/* Class title and metadata */}
      <div className="max-w-7xl mx-auto p-4 mt-6">
        <div className="mb-2 flex items-start">
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

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold mb-1">
                      Difficulty
                    </span>
                    <span className="text-gray-700">
                      {(classData.avgDifficulty || 0) > 0
                        ? `${(classData.avgDifficulty || 0).toFixed(1)}/5`
                        : "No data available"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold mb-1">Workload</span>
                    <span className="text-gray-700">
                      {(classData.avgWorkload || 0) > 0
                        ? `${(classData.avgWorkload || 0).toFixed(1)}/5`
                        : "No data available"}
                    </span>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold mb-4">Terms Offered</h2>
                <p className="text-gray-700 mb-6">
                  {classData.semester && classData.semester.length > 0
                    ? classData.semester.join(", ")
                    : "No term information available"}
                </p>

                <h2 className="text-2xl font-semibold mb-4">
                  Distribution Requirements
                </h2>
                <p className="text-gray-700">
                  {classData.distribution && classData.distribution.length > 0
                    ? classData.distribution.join(", ")
                    : "No distribution information available"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Reviews */}
        <div className="md:col-span-5">
          <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
          <div className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-2 pb-4">
            {classData.reviews && classData.reviews.length > 0 ? (
              classData.reviews.map((review, index) => (
                <ReviewCard key={index} review={review} />
              ))
            ) : (
              <p className="text-gray-500">
                No reviews available for this course.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClassDetailsPage;