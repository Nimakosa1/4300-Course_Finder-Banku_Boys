import { Card, CardContent } from '@/components/ui/card';
import { Review } from '@/services/api';

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const renderStars = (rating: string | undefined, maxRating = 5) => {
    const numRating = typeof rating === 'string' ? 
      (rating === '-' ? 0 : parseInt(rating)) : 
      (rating || 0);
    
    return (
      <div className="flex">
        {[...Array(maxRating)].map((_, i) => (
          <svg
            key={i}
            className={`w-5 h-5 ${
              i < numRating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (!review) return null;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        {review.professor && review.professor !== 'N/A' && (
          <div className="mb-2">
            <div className="text-sm text-gray-600 font-medium">
              Professor: {review.professor}
            </div>
          </div>
        )}

        {review.major && review.major !== 'N/A' && (
          <div className="mb-2">
            <div className="text-sm text-gray-600">
              Major: {review.major}
            </div>
          </div>
        )}

        {review.grade && review.grade !== 'N/A' && (
          <div className="mb-2">
            <div className="text-sm text-gray-600">
              Grade: {review.grade}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-3">
          {review.overall && review.overall !== '-' && (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Overall:</span>
              {renderStars(review.overall)}
            </div>
          )}
          
          {review.difficulty && review.difficulty !== '-' && (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Difficulty:</span>
              {renderStars(review.difficulty)}
            </div>
          )}
          
          {review.workload && review.workload !== '-' && (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Workload:</span>
              {renderStars(review.workload)}
            </div>
          )}
        </div>

        {review.comment && (
          <p className="text-gray-700 mb-3">{review.comment}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default ReviewCard;