// keep in module scope
let relevantIds = [];
let nonRelevantIds = [];

document.addEventListener("DOMContentLoaded", function () {
  const query = window.serverData?.query || "";
  const searchResults = document.getElementById("search-results");
  const loadingMessage = document.getElementById("loading-message");
  const noResultsMessage = document.getElementById("no-results-message");
  const resultsCount = document.getElementById("results-count");
  const errorMessage = document.getElementById("error-message");
  const courseDetails = document.getElementById("course-details");
  const selectCourseMessage = document.getElementById("select-course-message");
  const mainContent = document.getElementById("main-content");
  const wordCloudContainer = document.getElementById("word-cloud-container");
  const similaritySidebar = document.getElementById("similarity-sidebar");

  window.query = query;
  let allCourses = [];
  let selectedCourse = null;
  window.selectedCourse = null;
  let wordCloud = null;

  if (query && wordCloudContainer) {
    wordCloud = new WordCloud(wordCloudContainer);
    wordCloud.setOnComplete(() => {
      wordCloudContainer.classList.add("hidden");
      mainContent.classList.remove("hidden");
    });
  } else {
    if (wordCloudContainer) {
      wordCloudContainer.classList.add("hidden");
    }
    mainContent.classList.remove("hidden");
  }

  if (query) {
    fetchSearchResults(query);
  } else {
    loadingMessage.classList.add("hidden");
    noResultsMessage.classList.remove("hidden");
  }

  document
    .querySelectorAll(
      ".semester-filter, .level-filter, .difficulty-filter, .workload-filter"
    )
    .forEach((filter) => {
      filter.addEventListener("change", applyFilters);
    });

  document
    .getElementById("clear-filters")
    .addEventListener("click", clearFilters);

  document.addEventListener("click", function (e) {
    if (
      e.target.id === "show-similarity" ||
      e.target.closest("#show-similarity")
    ) {
      openSimilaritySidebar();
    }

    if (
      e.target.id === "close-similarity" ||
      e.target.closest("#close-similarity")
    ) {
      closeSimilaritySidebar();
    }
  });

  function fetchSearchResults(query) {
    loadingMessage.classList.remove("hidden");
    noResultsMessage.classList.add("hidden");
    errorMessage.classList.add("hidden");

    const params = new URLSearchParams({
      q: query,
      relevant_ids: JSON.stringify(relevantIds),
      non_relevant_ids: JSON.stringify(nonRelevantIds)
    });

    searchResults.innerHTML = "";
    searchResults.appendChild(loadingMessage);

    const apiUrl = `/api/search?${params.toString()}`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`API returned ${response.status}: ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        loadingMessage.classList.add("hidden");
        allCourses = data;

        if (!data || data.length === 0) {
          noResultsMessage.classList.remove("hidden");
          resultsCount.textContent = "0";
        } else {
          resultsCount.textContent = data.length;
          renderSearchResults(data);

          if (data.length > 0) {
            selectCourse(data[0]);
          }

          if (data.keywords && wordCloud) {
            wordCloud.words = data.keywords;
            wordCloud.positionWords();
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching search results:", error);
        loadingMessage.classList.add("hidden");
        errorMessage.textContent = `Failed to fetch search results: ${error.message}`;
        errorMessage.classList.remove("hidden");

        if (wordCloudContainer) {
          wordCloudContainer.classList.add("hidden");
        }
        mainContent.classList.remove("hidden");
      });
  }

  function renderSearchResults(courses) {
    searchResults.innerHTML = "";

    courses.forEach((course) => {
      const classItem = document.createElement("div");

      const isSelected =
        selectedCourse && selectedCourse.course_code === course.course_code;
      const borderClass = isSelected
        ? "border-blue-500 shadow-md"
        : "hover:shadow-md hover:border-blue-300";

      const semesterHtml = (course.term_offered || course.semester || [])
        .map((sem) => {
          let colorClass = "bg-gray-100 text-gray-800";
          if (sem.trim() === "Fall") colorClass = "bg-amber-100 text-amber-800";
          else if (sem.trim() === "Spring")
            colorClass = "bg-green-100 text-green-800";
          else if (sem.trim() === "Summer")
            colorClass = "bg-blue-100 text-blue-800";
          else if (sem.trim() === "Winter")
            colorClass = "bg-indigo-100 text-indigo-800";

          return `<span class="text-xs px-2 py-0.5 rounded ${colorClass}">${sem.trim()}</span>`;
        })
        .join("");

      const distHtml =
        (course.distribution || course.distributions || []).length > 0
          ? `<div class="mt-2 flex flex-wrap gap-1">
              ${(course.distribution || course.distributions || [])
            .map(
              (dist) =>
                `<span class="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">${dist}</span>`
            )
            .join("")}
            </div>`
          : "";

      classItem.innerHTML = `
            <div class="border rounded-lg transition-shadow cursor-pointer ${borderClass}" data-id="${course.course_code
        }">
              <div class="p-4">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-medium text-gray-500">
                    ${course.course_code}
                  </span>
                  <div class="flex flex-wrap gap-1">
                    ${semesterHtml}
                  </div>
                </div>
                <h3 class="font-semibold">${course["course title"] || course.title || "No Title"
        }</h3>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2">
                  ${course.description || ""}
                </p>
                ${distHtml}
              </div>
            </div>
          `;

      classItem.querySelector("[data-id]").addEventListener("click", () => {
        selectCourse(course);
      });

      searchResults.appendChild(classItem);
    });
  }

  window.selectCourse = function (course) {
    selectedCourse = course;
    window.selectedCourse = course;

    document.querySelectorAll("[data-id]").forEach((element) => {
      if (element.getAttribute("data-id") === course.course_code) {
        element.classList.add("border-blue-500", "shadow-md");
        element.classList.remove("hover:border-blue-300");
      } else {
        element.classList.remove("border-blue-500", "shadow-md");
        element.classList.add("hover:border-blue-300");
      }
    });

    if (selectCourseMessage) {
      selectCourseMessage.style.display = "none";
    }

    renderCourseDetails(course);

    if (window.updateSimilaritySidebar) {
      window.updateSimilaritySidebar();
    }
  };

  function renderCourseDetails(course) {
    const courseData = {
      course_code: course.course_code || "",
      title: course["course title"] || course.title || "No Title",
      description: course.description || "No description available",
      avgDifficulty: course.avgDifficulty || 0,
      avgWorkload: course.avgWorkload || 0,
      term_offered: course.term_offered || course.semester || [],
      distributions: course.distributions || course.distribution || [],
      reviews: course.reviews || [],
      BERT_similarity_score: course.BERT_similarity_score || 0,
      keyword_score: course.keyword_score || 0,
      BERT_title_similarity_score: course.BERT_title_similarity_score || 0,
      sentiment_score: course.sentiment_score || 0,
      svd_top_words: course.svd_top_words || [],
    };

    let detailsHtml = `
          <div class="border rounded-lg shadow-sm mb-6">
            <div class="p-6">
              <div class="mb-2 flex justify-between items-center">
                <span class="text-lg font-medium text-gray-500">
                  ${courseData.course_code}
                </span>
                <button id="show-similarity" class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-sm font-medium transition">
                  <span>Show Similarity</span>
                 
                </button>
              </div>
              <h2 class="text-2xl font-bold mb-4">${courseData.title}</h2>
              <p class="text-gray-700 mb-4">${courseData.description}</p>
    
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="flex flex-col">
                  <span class="text-sm text-gray-500">Difficulty</span>
                  <span class="font-semibold">
                    ${courseData.avgDifficulty > 0
        ? `${courseData.avgDifficulty.toFixed(1)}/5`
        : "N/A"
      }
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-sm text-gray-500">Workload</span>
                  <span class="font-semibold">
                    ${courseData.avgWorkload > 0
        ? `${courseData.avgWorkload.toFixed(1)}/5`
        : "N/A"
      }
                </span>
              </div>
            </div>
  
            <div class="mb-4">
              <span class="font-semibold">Terms Offered: </span>
              <span>${courseData.term_offered.length > 0
        ? courseData.term_offered.join(", ")
        : "Not specified"
      }</span>
            </div>
  
            <div class="mb-4">
              <span class="font-semibold">Distributions: </span>
              <span>${courseData.distributions.length > 0
        ? courseData.distributions.join(", ")
        : "None"
      }</span>
            </div>
          </div>
        </div>
    // < !--Relevance Feedback Buttons-- >

        <div class="mt-4 flex gap-2">
      <button
        type="button"
        data-relevant-btn
        data-idx="${courseData.course_code}"
        class="px-3 py-1 rounded bg-gray-200"
      >
        ✅ Relevant
      </button>
      <button
        type="button"
        data-nonrelevant-btn
        data-idx="${courseData.course_code}"
        class="px-3 py-1 rounded bg-gray-200"
      >
        ❌ Not Relevant
      </button>
    </div>
      `;
    // < !--Relevance Feedback Buttons-- >



    detailsHtml += `<h2 class="text-xl font-semibold my-4">Reviews</h2><div class="space-y-6">`;

    if (courseData.reviews && courseData.reviews.length > 0) {
      courseData.reviews.slice(0, 2).forEach((review) => {
        detailsHtml += `<div class="border rounded-lg shadow-sm mb-4"><div class="p-4">`;

        if (review.professor && review.professor !== "N/A") {
          detailsHtml += `
              <div class="mb-2">
                <div class="text-sm text-gray-600 font-medium">
                  Professor: ${review.professor}
                </div>
              </div>
            `;
        }

        if (review.major && review.major !== "N/A") {
          detailsHtml += `
              <div class="mb-2">
                <div class="text-sm text-gray-600">
                  Major: ${review.major}
                </div>
              </div>
            `;
        }

        if (review.grade && review.grade !== "N/A") {
          detailsHtml += `
              <div class="mb-2">
                <div class="text-sm text-gray-600">
                  Grade: ${review.grade}
                </div>
              </div>
            `;
        }

        detailsHtml += `<div class="flex flex-wrap gap-4 mb-3">`;

        if (review.overall && review.overall !== "-") {
          detailsHtml += `
              <div class="flex items-center">
                <span class="text-sm font-medium mr-2">Overall:</span>
                ${renderStarsClient(parseInt(review.overall))}
              </div>
            `;
        }

        if (review.difficulty && review.difficulty !== "-") {
          detailsHtml += `
              <div class="flex items-center">
                <span class="text-sm font-medium mr-2">Difficulty:</span>
                ${renderStarsClient(parseInt(review.difficulty))}
              </div>
            `;
        }

        if (review.workload && review.workload !== "-") {
          detailsHtml += `
              <div class="flex items-center">
                <span class="text-sm font-medium mr-2">Workload:</span>
                ${renderStarsClient(parseInt(review.workload))}
              </div>
            `;
        }

        detailsHtml += `</div>`;

        if (review.comment) {
          detailsHtml += `<p class="text-gray-700 mb-3">${review.comment}</p>`;
        }

        detailsHtml += `</div></div>`;
      });
    } else {
      detailsHtml += `<p class="text-gray-500">No reviews available for this course.</p>`;
    }

    detailsHtml += `</div>`;

    const courseDataForLink = {
      id: courseData.course_code,
      classCode: courseData.course_code,
      title: courseData.title,
      description: courseData.description,
      semester: courseData.term_offered,
      distribution: courseData.distributions,
      reviews: courseData.reviews,
      avgDifficulty: courseData.avgDifficulty,
      avgWorkload: courseData.avgWorkload,
      avgOverall: course.avgOverall || 0,
    };

    detailsHtml += `
        <div class="mt-6">
          <a 
            href="/class/${courseData.course_code.replace(
      /\s+/g,
      "-"
    )}?data=${encodeURIComponent(JSON.stringify(courseDataForLink))}"
            class="inline-block w-full px-4 py-2 bg-black hover:bg-gray-700 text-white text-center font-medium rounded-md"
          >
            See more about class
          </a>
        </div>
      `;

    courseDetails.innerHTML = detailsHtml;

    const relBtn = courseDetails.querySelector("[data-relevant-btn]");
    const nonRelBtn = courseDetails.querySelector("[data-nonrelevant-btn]");
    const cid = course.course_code;

    relBtn.addEventListener("click", () => {
      if (!relevantIds.includes(cid)) relevantIds.push(cid);
      // if previously marked non-relevant, unmark
      nonRelevantIds = nonRelevantIds.filter(id => id !== cid);
      // optional: visual toggle
      relBtn.classList.add("bg-green-200");
      nonRelBtn.classList.remove("bg-red-200");
      fetchSearchResults(window.query);
    });

    nonRelBtn.addEventListener("click", () => {
      if (!nonRelevantIds.includes(cid)) nonRelevantIds.push(cid);
      relevantIds = relevantIds.filter(id => id !== cid);
      nonRelBtn.classList.add("bg-red-200");
      relBtn.classList.remove("bg-green-200");
      fetchSearchResults(window.query);
    });


  }

  function renderStarsClient(rating, maxRating = 5) {
    let stars = "";
    const numRating = parseInt(rating) || 0;

    for (let i = 0; i < maxRating; i++) {
      const starColor = i < numRating ? "text-yellow-400" : "text-gray-300";
      stars += `
          <svg class="w-5 h-5 ${starColor}" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        `;
    }

    return stars;
  }

  function applyFilters() {
    const filters = {
      semester: Array.from(
        document.querySelectorAll(".semester-filter:checked")
      ).map((el) => el.value),
      classLevel: Array.from(
        document.querySelectorAll(".level-filter:checked")
      ).map((el) => el.value),
      difficulty: Array.from(
        document.querySelectorAll(".difficulty-filter:checked")
      ).map((el) => el.value),
      workload: Array.from(
        document.querySelectorAll(".workload-filter:checked")
      ).map((el) => el.value),
    };

    const filteredCourses = filterCourses(allCourses, filters);

    resultsCount.textContent = filteredCourses.length;

    renderSearchResults(filteredCourses);

    if (filteredCourses.length === 0) {
      noResultsMessage.classList.remove("hidden");
    } else {
      noResultsMessage.classList.add("hidden");

      const isSelectedCourseInResults =
        selectedCourse &&
        filteredCourses.some(
          (course) => course.course_code === selectedCourse.course_code
        );

      if (!isSelectedCourseInResults && filteredCourses.length > 0) {
        selectCourse(filteredCourses[0]);
      }
    }
  }

  function clearFilters() {
    document
      .querySelectorAll(
        ".semester-filter, .level-filter, .difficulty-filter, .workload-filter"
      )
      .forEach((checkbox) => {
        checkbox.checked = false;
      });

    applyFilters();
  }

  function filterCourses(courses, filters) {
    if (
      !filters.semester.length &&
      !filters.classLevel.length &&
      !filters.difficulty.length &&
      !filters.workload.length
    ) {
      return courses;
    }

    return courses.filter((course) => {
      if (filters.semester.length > 0) {
        const courseTerms = course.term_offered || course.semester || [];
        const hasMatchingSemester = courseTerms.some((sem) =>
          filters.semester.includes(sem.trim())
        );

        if (!hasMatchingSemester) return false;
      }

      if (filters.classLevel.length > 0) {
        const match = (course.course_code || "").match(/\d{3}/);
        if (match) {
          const courseLevel = match[0][0] + "000";

          const levelToCheck =
            parseInt(match[0][0]) >= 5 ? "5000+" : courseLevel;

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

        if (!matchesDifficulty) return false;
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

        if (!matchesWorkload) return false;
      }

      return true;
    });
  }

  window.selectCourse = selectCourse;
  window.renderCourseDetails = renderCourseDetails;
  window.renderStarsClient = renderStarsClient;
  window.applyFilters = applyFilters;
  window.clearFilters = clearFilters;
  window.filterCourses = filterCourses;
});
