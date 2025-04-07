import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import SearchPage from '@/pages/SearchPage';
import ClassDetailsPage from '@/pages/ClassDetailsPage';
import CloudPage from '@/pages/CloudPage';
import ScrollPage from '@/pages/ScrollPage';
import AnemonePage from './pages/AnemonePage';
import RobotDemo from './pages/RobotPage';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/class/:id" element={<ClassDetailsPage />} />
        <Route path="/cloud" element={<CloudPage />} />
        <Route path="/scroll" element={<ScrollPage />} />
        <Route path="/anemone" element={<AnemonePage />} />
        <Route path = "/robot" element = {<RobotDemo/>}/>


      </Routes>
    </Router>
  );
}

export default App;