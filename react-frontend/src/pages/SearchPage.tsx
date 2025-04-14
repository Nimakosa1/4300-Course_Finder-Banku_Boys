import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import OrganizedTagCloud from '@/components/WordCloud';
import FilterPanel from '@/components/FilterPanel';
import ResultsList from '@/components/ResultsList';
import CourseDetails from '@/components/CourseDetails';
import { searchCourses, filterCourses, Course, Filters, WordData } from '@/services/api';

function SearchPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('q') || '';

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    semester: [],
    classLevel: [],
    difficulty: [],
    workload: [],
  });
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [cloudWords, setCloudWords] = useState<WordData[] | undefined>(undefined);

  useEffect(() => {
    if (query) {
      setShowLoadingAnimation(true);
      setShowResults(false);
    } else {
      setShowLoadingAnimation(false);
      setShowResults(true);
    }
  }, [query]);

  useEffect(() => {
    if (cloudWords && cloudWords.length > 0) {
      setShowLoadingAnimation(true);
      const timer = setTimeout(() => {
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cloudWords]);

  useEffect(() => {
    const fetchData = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);
      setCloudWords(undefined); 

      try {
        const results = await searchCourses(query);
        console.log('Search results:', results);
        
        if (results.courses && Array.isArray(results.courses) && results.courses.length > 0) {
          setSearchResults(results.courses);
          setSelectedCourse(results.courses[0]); 
          
          setCloudWords(results.keywords);
          console.log('Keywords for cloud:', results.keywords);
        } else {
          console.log('No results found or results not in expected format');
          setSearchResults([]);
          setSelectedCourse(null);
          setCloudWords(undefined);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch search results. Please try again.');
        setSearchResults([]);
        setSelectedCourse(null);
        setCloudWords(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [query]);

  const handleTagCloudComplete = () => {
    setTimeout(() => {
      setShowLoadingAnimation(false);
      setShowResults(true);
    }, 300);
  };

  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters };

      if (updatedFilters[filterType].includes(value)) {
        updatedFilters[filterType] = updatedFilters[filterType].filter(
          item => item !== value
        );
      } else {
        updatedFilters[filterType] = [...updatedFilters[filterType], value];
      }

      return updatedFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      semester: [],
      classLevel: [],
      difficulty: [],
      workload: [],
    });
  };

  const filteredResults = Array.isArray(searchResults) 
    ? filterCourses(searchResults, filters)
    : [];

  const handleClassSelect = (course: Course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Search bar at the top */}
      <SearchBar initialQuery={query} />
      
      {showLoadingAnimation && query ? (
        <div className="absolute inset-0 z-50">
          <OrganizedTagCloud 
            onLoadComplete={handleTagCloudComplete} 
            words={cloudWords}
          />
        </div>
      ) : showResults || !query ? (
        
        /* Main content area */
        <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Left column - Class List */}
          <div className="md:col-span-3">
            <ResultsList 
              results={filteredResults}
              loading={loading}
              error={error}
              selectedCourse={selectedCourse}
              onSelectCourse={handleClassSelect}
              query={query}
            />
          </div>
  
          {/* Middle column - Course Details & Reviews */}
          <div className="md:col-span-6">
            <CourseDetails 
              course={selectedCourse} 
              loading={loading} 
            />
          </div>
  
          {/* Right column - Filters */}
          <div className="md:col-span-3">
            <FilterPanel 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SearchPage;