import React, { useState, useRef, useEffect } from 'react';
import { getCourses } from '@/services/api'; 

interface ClassItem {
  classCode: string;
  course_code: string;
  title?: string;
  "course title"?: string;
}

const CourseWheel: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [autoScrollPaused, setAutoScrollPaused] = useState<boolean>(false);
  
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  const getRandomClasses = (allCourses: ClassItem[], count: number): ClassItem[] => {
    if (allCourses.length <= count) return allCourses;
    
    const shuffled = [...allCourses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  useEffect(() => {
   

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await getCourses();
        console.log("Fetched courses for CourseWheel:", response);
  
        const randomCourses = getRandomClasses(response.courses, 30);
        setClasses(randomCourses);
        setLoading(false);
      } catch (err) {
        console.error("CourseWheel error:", err);
        setError('Error loading courses. Please try again later.');
        setLoading(false);
      }
    };
    
    
    fetchCourses();
  }, []);

  useEffect(() => {
    if (classes.length === 0 || loading) return;
    
    startAutoScroll();
    
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [classes, loading]);

  useEffect(() => {
    if (autoScrollPaused) {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    } else {
      startAutoScroll();
    }
    
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [autoScrollPaused]);

  const startAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current);
    }
    
    autoScrollInterval.current = setInterval(() => {
      if (!autoScrollPaused && classes.length > 0) {
        setSelectedIndex((prevIndex) => {
          return prevIndex >= classes.length - 1 ? 0 : prevIndex + 1;
        });
      }
    }, 2000);
  };

  const toggleAutoScroll = () => {
    setAutoScrollPaused(!autoScrollPaused);
  };
  
  const pauseAutoscroll = () => {
    setAutoScrollPaused(true);
  };

  const handleScroll = (direction: 'up' | 'down'): void => {
    if (classes.length === 0) return;
    
    pauseAutoscroll();
    
    const newIndex = direction === 'up' 
      ? (selectedIndex <= 0 ? classes.length - 1 : selectedIndex - 1) 
      : (selectedIndex >= classes.length - 1 ? 0 : selectedIndex + 1);
    
    setSelectedIndex(newIndex);
  };

  const handleWheel = (e: React.WheelEvent): void => {
    if (scrollTimeout.current) return;
    
    scrollTimeout.current = setTimeout(() => {
      scrollTimeout.current = null;
    }, 100); 
    
    if (e.deltaY < 0) {
      handleScroll('up');
    } else {
      handleScroll('down');
    }
    e.preventDefault();
  };


  // if (loading) {
  //   return (
  //     <div className="w-full h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
  //         <p className="mt-4 text-gray-700">Loading courses...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center text-red-600 p-4 rounded-lg border border-red-300 bg-red-50">
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // if (classes.length === 0) {
  //   return (
  //     <div className="w-full h-screen flex items-center justify-center">
  //       <div className="text-center text-gray-600 p-4">
  //         <p>No courses available at this time.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div 
      ref={wheelRef}
      className="w-full h-screen bg-transparent" 
      onWheel={handleWheel}
    >
      <div 
        className="w-full h-full relative overflow-visible pt-0" 
        style={{ perspective: '1000px' }}
      >
        <div className="absolute inset-0">
          {classes.map((classItem, index) => {
            const distance = index - selectedIndex;
            const wrappedDistance = distance > classes.length / 2 
              ? distance - classes.length 
              : (distance < -classes.length / 2 ? distance + classes.length : distance);
            
            const isVisible = Math.abs(wrappedDistance) <= 3; 
            
            if (!isVisible) return null;
            
            const angleRange = 160; 
            const angleStep = angleRange / 6;
            const angle = wrappedDistance * angleStep;
            const angleRad = angle * Math.PI / 180;
            
            const radius = 35; 
            const xPosition = 60 - radius * Math.cos(angleRad); 
            const yPosition = 50 + radius * Math.sin(angleRad);
            
            const zOffset = Math.abs(wrappedDistance) * 18; 
            const opacity = 1 - Math.min(Math.abs(wrappedDistance) * 0.15, 0.6); 
            const scale = 1 - Math.min(Math.abs(wrappedDistance) * 0.12, 0.4);
            const rotateY = wrappedDistance * -12; 
            
            const displayCode = classItem.classCode || classItem.course_code || "";
            
            return (
              <div
                key={index}
                className="absolute cursor-pointer transition-all duration-200 ease-out"
                style={{
                  left: `${xPosition}%`,
                  top: `${yPosition}%`,
                  transform: `translate(-50%, -50%) 
                             translateZ(${-zOffset}px)
                             rotateY(${rotateY}deg)
                             scale(${scale})`,
                  opacity: opacity,
                  zIndex: 100 - Math.abs(wrappedDistance)
                }}
                onClick={() => {
                  setSelectedIndex(index);
                  pauseAutoscroll();
                }}
              >
                <div className={`
                  rounded-lg shadow-lg p-4 min-w-[100px] min-h-[60px]
                  border-2 transition-colors duration-300
                  ${wrappedDistance === 0 
                    ? 'border-black bg-white/90 text-black' 
                    : 'border-gray-400 bg-[#CACACA] text-gray-800'}
                `}>
                  <div className="text-center">
                    <div className={`
                      font-bold
                      ${wrappedDistance === 0 ? 'text-2xl' : 'text-xl'}
                    `}>
                      {displayCode}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <button 
        className="absolute bottom-5 right-4 flex items-center gap-4 px-10 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={toggleAutoScroll}
      >
        {autoScrollPaused ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            <span className="text-sm font-medium">Play</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Pause</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CourseWheel;