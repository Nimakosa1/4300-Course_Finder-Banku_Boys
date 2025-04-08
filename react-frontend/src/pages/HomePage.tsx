// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import BackgroundMaskParticles from '@/components/ParticlesMask';
// import CourseWheel from '@/components/CourseWheel';
// import Anemone from '@/components/Anemone';

// function HomePage() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showAnemone, setShowAnemone] = useState(true);
//   const [fadeOut, setFadeOut] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fadeTimer = setTimeout(() => {
//       setFadeOut(true);
//     }, 5000);

//     const removeTimer = setTimeout(() => {
//       setShowAnemone(false);
//     }, 6500); 
//     return () => {
//       clearTimeout(fadeTimer);
//       clearTimeout(removeTimer);
//     };
//   }, []);

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (searchQuery.trim()) {
//       navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
//     }
//   };

//   return (
//     <div className="relative min-h-screen w-full overflow-hidden">
//       {/* Background particles with mask */}
//       <BackgroundMaskParticles className="absolute inset-0 w-full h-full" />

//       {/* Anemone overlay with fade out animation */}
//       {showAnemone && (
//         <div 
//           className={`absolute inset-0 z-20 grayscale transition-all duration-1500 ease-in-out ${
//             fadeOut ? 'opacity-0 scale-110' : 'opacity-100'
//           }`}
//         >
//           <Anemone id="intro-anemone" backgroundColor="#0a4766" particleSpeed={1.5} />
//         </div>
//       )}

//       {/* Main Content Layout */}
//       <div className="relative z-10 flex min-h-screen">
//         {/* Left side with content */}
//         <div className="w-2/3 bg-[#CACACA] flex flex-col items-center justify-center px-4 text-center">
//           <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
//             CourseFinder
//           </h1>

//           <div className="max-w-2xl w-full mb-8">
//             <p className="text-xl md:text-2xl text-black mb-8">
//               "I want a class that teaches coding but with minimal assignments"
//             </p>

//             <form
//               onSubmit={handleSearch}
//               className="flex w-full max-w-xl mx-auto"
//             >
//               <Input
//                 type="text"
//                 placeholder="Search for classes"
//                 className="flex-grow bg-white/90 text-black text-lg placeholder:text-gray-500 rounded-l-lg focus:ring-2 focus:ring-blue-500 border-0 p-3"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//               <Button
//                 type="submit"
//                 className="bg-black hover:bg-blue-700 text-white rounded-l-none rounded-r-lg px-6 text-lg"
//               >
//                 Search
//               </Button>
//             </form>
//           </div>
//         </div>

//         {/* Right side with CourseWheel */}
//         <div className="w-2/3 bg-transparent">
//           <CourseWheel />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default HomePage;


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CourseWheel from '@/components/CourseWheel';
import Robot from '@/components/Robot';

function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-1/2 bg-[#CACACA] flex flex-col items-center justify-center px-8">
        <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
          CourseFinder
        </h1>

        <div className="w-full max-w-xl mb-8">
          <p className="text-xl md:text-2xl text-black mb-8 text-center">
           Find classes easily with natural language
          </p>

          <form
            onSubmit={handleSearch}
            className="flex w-full"
          >
            <Input
              type="text"
              placeholder="Search for classes"
              className="flex-grow bg-white/90 text-black text-lg placeholder:text-gray-500 rounded-l-lg rounded-r-none border-0 p-3 "
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="bg-black hover:bg-gray-700 text-white rounded-l-none rounded-r-lg px-6 text-lg cursor-pointer"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="w-1/2 relative">
        <div className="w-full h-full">
          <Robot />
        </div>
        
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <CourseWheel />
        </div>
      </div>
    </div>
  );
}

export default HomePage;