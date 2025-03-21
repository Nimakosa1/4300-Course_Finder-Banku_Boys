// Function to search courses based on a query
// Function to search courses based on a query
export const searchCourses = async (query, setLoading) => {
  if (setLoading) setLoading(true);
  try {
    console.log("Searching for:", query);

    // In development, use the environment variable
    // In production, use a relative URL
    const baseUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || "";
    const apiUrl = `${baseUrl}/api/courses/search`;

    console.log("API Endpoint:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      // Add cache: 'no-store' to prevent caching issues
      cache: "no-store",
    });

    if (!response.ok) {
      let errorText;
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      console.error(`Search API error (${response.status}):`, errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(
      "Search results:",
      Array.isArray(data) ? data.length : "Not an array"
    );
    return data;
  } catch (error) {
    console.error("Error searching courses:", error);
    return [];
  } finally {
    if (setLoading) setLoading(false);
  }
};

// Calculate average ratings from reviews
export const calculateAverageRatings = (reviews) => {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return {
      avgOverall: 0,
      avgDifficulty: 0,
      avgWorkload: 0,
    };
  }

  // Helper function to parse ratings
  const parseRating = (rating) => {
    if (rating === "-" || rating === undefined || rating === null) {
      return null;
    }
    return typeof rating === "string" ? parseFloat(rating) : rating;
  };

  // Calculate averages
  let overallSum = 0;
  let difficultySum = 0;
  let workloadSum = 0;
  let overallCount = 0;
  let difficultyCount = 0;
  let workloadCount = 0;

  reviews.forEach((review) => {
    if (!review) return;

    const overall = parseRating(review.overall);
    const difficulty = parseRating(review.difficulty);
    const workload = parseRating(review.workload);

    if (overall !== null) {
      overallSum += overall;
      overallCount++;
    }

    if (difficulty !== null) {
      difficultySum += difficulty;
      difficultyCount++;
    }

    if (workload !== null) {
      workloadSum += workload;
      workloadCount++;
    }
  });

  return {
    avgOverall: overallCount > 0 ? overallSum / overallCount : 0,
    avgDifficulty: difficultyCount > 0 ? difficultySum / difficultyCount : 0,
    avgWorkload: workloadCount > 0 ? workloadSum / workloadCount : 0,
  };
};

// Function to filter courses based on selected filters
export const filterCourses = (courses, filters) => {
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return [];
  }

  return courses.filter((course) => {
    try {
      if (!course) return false;

      // Filter by semester
      if (
        filters.semester.length > 0 &&
        course.semester &&
        Array.isArray(course.semester) &&
        !course.semester.some((sem) => {
          // Handle null or undefined semester
          if (!sem) return false;

          // Trim whitespace from semester names
          const trimmedSem = typeof sem === "string" ? sem.trim() : sem;
          return filters.semester.includes(trimmedSem);
        })
      ) {
        return false;
      }

      // Filter by class level
      if (filters.classLevel.length > 0 && course.classCode) {
        // Extract class level from course code (e.g., "CS 1101" -> "1000")
        const courseCodeMatch = course.classCode.match(/\d{1}/);
        const classLevel = courseCodeMatch
          ? `${courseCodeMatch[0]}000`
          : "Unknown";

        // Check if 5000+ filter is selected and class level is >= 5000
        const is5000Plus =
          filters.classLevel.includes("5000+") &&
          courseCodeMatch &&
          parseInt(courseCodeMatch[0]) >= 5;

        // Check if class level matches any selected filters or is 5000+
        if (!filters.classLevel.includes(classLevel) && !is5000Plus) {
          return false;
        }
      }

      // Filter by difficulty
      if (
        filters.difficulty.length > 0 &&
        typeof course.avgDifficulty === "number" &&
        course.avgDifficulty > 0
      ) {
        const difficultyRange = getDifficultyRange(filters.difficulty);
        if (
          !difficultyRange.some(
            (range) =>
              course.avgDifficulty >= range[0] &&
              course.avgDifficulty <= range[1]
          )
        ) {
          return false;
        }
      }

      // Filter by workload
      if (
        filters.workload.length > 0 &&
        typeof course.avgWorkload === "number" &&
        course.avgWorkload > 0
      ) {
        const workloadRange = getWorkloadRange(filters.workload);
        if (
          !workloadRange.some(
            (range) =>
              course.avgWorkload >= range[0] && course.avgWorkload <= range[1]
          )
        ) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error filtering course:", error, course);
      return true; // Include course if filtering fails
    }
  });
};

// Helper function to convert difficulty filters to ranges
const getDifficultyRange = (difficultyFilters) => {
  return difficultyFilters.map((filter) => {
    switch (filter) {
      case "Easy":
        return [1, 2];
      case "Medium":
        return [2.1, 3.5];
      case "Hard":
        return [3.6, 5];
      default:
        return [0, 5];
    }
  });
};

// Helper function to convert workload filters to ranges
const getWorkloadRange = (workloadFilters) => {
  return workloadFilters.map((filter) => {
    switch (filter) {
      case "Light":
        return [1, 2];
      case "Moderate":
        return [2.1, 3.5];
      case "Heavy":
        return [3.6, 5];
      default:
        return [0, 5];
    }
  });
};
