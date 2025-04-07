import axios from "axios";
import { removeStopwords } from "stopword";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? "http://4300showcase.infosci.cornell.edu:5239"
    : "http://localhost:5001");

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface WordData {
  text: string;
  size: number;
}

export interface Review {
  professor?: string;
  major?: string;
  grade?: string;
  overall?: string;
  difficulty?: string;
  workload?: string;
  comment?: string;
}

export interface Course {
  classCode: string;
  course_code: string;
  "course title"?: string;
  title?: string;
  description?: string;
  term_offered?: string[];
  semester?: string[];
  distributions?: string[];
  distribution?: string[];
  reviews?: Review[];
  avgDifficulty?: number;
  avgWorkload?: number;
  avgOverall?: number;
}

export interface Filters {
  semester: string[];
  classLevel: string[];
  difficulty: string[];
  workload: string[];
}

export interface SearchResults {
  courses: Course[];
  keywords: WordData[];
}

function extractKeywords(text: string, limit = 50): string[] {
  const wordCounts = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/);
  const filtered = removeStopwords(words);
  for (const word of filtered) {
    if (word.length <= 2) continue;
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function extractKeywordsFromSearchResults(courses: Course[]): WordData[] {
  if (!courses || courses.length === 0) return [];

  const combinedText = courses
    .map((course) => course.description || "")
    .join(" ");

  if (!combinedText.trim()) return [];

  const keywords = extractKeywords(combinedText);

  return keywords.map((word) => {
    const index = keywords.indexOf(word);
    const maxIndex = keywords.length - 1;
    const size = 3.0 + (1.0 * (maxIndex - index)) / maxIndex;

    return {
      text: word,
      size: size,
    };
  });
}

export const searchCourses = async (query: string): Promise<SearchResults> => {
  try {
    const response = await api.get(
      `/api/search?q=${encodeURIComponent(query)}`
    );
    console.log("api results", response.data);

    const courses = response.data;

    const keywords = extractKeywordsFromSearchResults(courses);

    return {
      courses,
      keywords,
    };
  } catch (error) {
    console.error("Error searching courses:", error);
    throw error;
  }
};

export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const formattedId = courseId.replace(/-/g, " ");
    const response = await api.get(
      `/api/search?q=${encodeURIComponent(formattedId)}`
    );

    if (response.data && response.data.length > 0) {
      const course = response.data.find(
        (course: Course) => course.course_code === formattedId
      );
      return course || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting course:", error);
    throw error;
  }
};

export const getCourses = async (): Promise<SearchResults> => {
  try {
    const response = await api.get("/api/get_courses");
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
};

export const calculateAverageRatings = (reviews?: Review[]) => {
  if (!reviews || reviews.length === 0) {
    return {
      avgDifficulty: 0,
      avgWorkload: 0,
      avgOverall: 0,
    };
  }

  let difficultySum = 0;
  let difficultyCount = 0;
  let workloadSum = 0;
  let workloadCount = 0;
  let overallSum = 0;
  let overallCount = 0;

  reviews.forEach((review) => {
    if (review.difficulty && review.difficulty !== "-") {
      difficultySum += parseInt(review.difficulty);
      difficultyCount++;
    }
    if (review.workload && review.workload !== "-") {
      workloadSum += parseInt(review.workload);
      workloadCount++;
    }
    if (review.overall && review.overall !== "-") {
      overallSum += parseInt(review.overall);
      overallCount++;
    }
  });

  return {
    avgDifficulty: difficultyCount > 0 ? difficultySum / difficultyCount : 0,
    avgWorkload: workloadCount > 0 ? workloadSum / workloadCount : 0,
    avgOverall: overallCount > 0 ? overallSum / overallCount : 0,
  };
};

export const filterCourses = (
  courses: Course[],
  filters: Filters
): Course[] => {
  if (!Array.isArray(courses)) {
    console.error("filterCourses received non-array input:", courses);
    return [];
  }

  if (!Object.values(filters).some((filter) => filter.length > 0)) {
    return courses;
  }

  return courses.filter((course) => {
    if (!course || typeof course !== "object") {
      return false;
    }

    if (filters.semester.length > 0) {
      const courseTerms = course.term_offered || course.semester || [];
      if (
        !Array.isArray(courseTerms) ||
        !courseTerms.some((term) => {
          if (typeof term !== "string") return false;
          return filters.semester.includes(term.trim());
        })
      ) {
        return false;
      }
    }

    if (filters.classLevel.length > 0) {
      const courseCode = course.course_code || "";
      const match = courseCode.match(/\d{3}/);
      if (match) {
        const level = match[0][0] + "000";
        const levelToCheck = parseInt(match[0][0]) >= 5 ? "5000+" : level;
        if (!filters.classLevel.includes(levelToCheck)) {
          return false;
        }
      } else {
        return false;
      }
    }

    if (filters.difficulty.length > 0) {
      const avgDifficulty = course.avgDifficulty || 0;
      const matchesDifficulty =
        (filters.difficulty.includes("Easy") &&
          avgDifficulty > 0 &&
          avgDifficulty < 2.5) ||
        (filters.difficulty.includes("Medium") &&
          avgDifficulty >= 2.5 &&
          avgDifficulty < 3.5) ||
        (filters.difficulty.includes("Hard") && avgDifficulty >= 3.5);

      if (!matchesDifficulty) {
        return false;
      }
    }

    if (filters.workload.length > 0) {
      const avgWorkload = course.avgWorkload || 0;
      const matchesWorkload =
        (filters.workload.includes("Light") &&
          avgWorkload > 0 &&
          avgWorkload < 2.5) ||
        (filters.workload.includes("Moderate") &&
          avgWorkload >= 2.5 &&
          avgWorkload < 3.5) ||
        (filters.workload.includes("Heavy") && avgWorkload >= 3.5);

      if (!matchesWorkload) {
        return false;
      }
    }

    return true;
  });
};

export default api;
