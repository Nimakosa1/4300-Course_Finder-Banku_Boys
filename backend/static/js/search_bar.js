document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggle-search-mode");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const searchModeInput = document.getElementById("search-mode");
  const courseSelectModal = document.getElementById("course-select-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const courseSearch = document.getElementById("course-search");
  const courseList = document.getElementById("course-list");

  console.log("Search bar script loaded");
  console.log("Toggle button exists:", !!toggleButton);
  console.log("Course select modal exists:", !!courseSelectModal);

  if (!toggleButton || !courseSelectModal) {
    console.error("Critical elements are missing");
    return;
  }

  let inSimilarityMode = false;
  let allCourses = [];

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      inSimilarityMode = !inSimilarityMode;

      if (inSimilarityMode) {
        searchInput.value = "";
        toggleButton.textContent = "Search by keywords instead";
        searchInput.placeholder = "Click to select a course";
        searchInput.readOnly = true;
        searchModeInput.value = "similar";

        searchInput.addEventListener("click", openCourseModal);
        searchInput.classList.add("cursor-pointer", "bg-gray-50");
      } else {
        toggleButton.textContent = "Search for similar courses instead";
        searchInput.value = "";
        searchInput.placeholder = "Search for classes";
        searchInput.readOnly = false;
        searchModeInput.value = "keyword";

        searchInput.removeEventListener("click", openCourseModal);
        searchInput.classList.remove("cursor-pointer", "bg-gray-50");

        if (searchInput.classList.contains("font-medium")) {
          searchInput.value = "";
          searchInput.classList.remove("font-medium");
        }
      }
    });
  }

  function openCourseModal() {
    console.log("Opening course modal");
    if (courseSelectModal) {
      courseSelectModal.classList.remove("hidden");
      if (courseSearch) courseSearch.focus();

      if (allCourses.length === 0) {
        fetchAllCourses();
      } else {
        renderCourseList(allCourses.slice(0, 100));
      }
    } else {
      console.error("Course select modal not found");
    }
  }

  function fetchAllCourses() {
    fetch("/api/get_courses")
      .then((response) => response.json())
      .then((data) => {
        allCourses = data.courses.sort((a, b) => {
          const codeA = a.course_code || "";
          const codeB = b.course_code || "";
          return codeA.localeCompare(codeB);
        });
        renderCourseList(allCourses.slice(0, 100));
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        courseList.innerHTML =
          '<p class="text-red-500 text-center py-4">Error loading courses. Please try again.</p>';
      });
  }

  function renderCourseList(courses) {
    if (!courses || courses.length === 0) {
      courseList.innerHTML =
        '<p class="text-gray-500 text-center py-4">No courses found</p>';
      return;
    }

    courseList.innerHTML = "";

    const letterIndex = {};
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    courses.forEach((course) => {
      const courseCode = course.course_code || "";
      if (courseCode.length > 0) {
        const firstLetter = courseCode[0].toUpperCase();
        if (!letterIndex[firstLetter]) {
          letterIndex[firstLetter] = [];
        }
        letterIndex[firstLetter].push(course);
      }
    });

    const letterNav = document.createElement("div");
    letterNav.className =
      "flex flex-wrap gap-2 mb-4 px-2 sticky top-0 bg-white py-2 border-b";

    alphabet.split("").forEach((letter) => {
      const letterBtn = document.createElement("button");
      letterBtn.className = `px-2 py-1 text-sm rounded ${
        letterIndex[letter]
          ? "bg-gray-200 hover:bg-gray-300"
          : "bg-gray-100 text-gray-400 cursor-not-allowed"
      }`;
      letterBtn.textContent = letter;

      if (letterIndex[letter]) {
        letterBtn.addEventListener("click", () => {
          document
            .getElementById(`letter-${letter}`)
            .scrollIntoView({ behavior: "smooth" });
        });
      }

      letterNav.appendChild(letterBtn);
    });

    courseList.appendChild(letterNav);

    for (const letter of alphabet) {
      if (letterIndex[letter] && letterIndex[letter].length > 0) {
        const letterGroup = document.createElement("div");
        letterGroup.id = `letter-${letter}`;
        letterGroup.className = "mb-4";

        const letterHeader = document.createElement("div");
        letterHeader.className =
          "bg-gray-100 px-3 py-1 font-bold text-gray-700 sticky top-12";
        letterHeader.textContent = letter;
        letterGroup.appendChild(letterHeader);

        letterIndex[letter].forEach((course) => {
          const courseCode = course.course_code;
          const courseTitle =
            course["course title"] || course.title || "No Title";

          const courseItem = document.createElement("div");
          courseItem.className =
            "border-b border-gray-200 p-3 hover:bg-gray-100 cursor-pointer";
          courseItem.innerHTML = `
              <div class="font-medium">${courseCode}</div>
              <div class="text-sm text-gray-600">${courseTitle}</div>
            `;

          courseItem.addEventListener("click", () => {
            selectCourse(course);
          });

          letterGroup.appendChild(courseItem);
        });

        courseList.appendChild(letterGroup);
      }
    }
  }

  function selectCourse(course) {
    const courseCode = course.course_code;
    const courseTitle = course["course title"] || course.title || courseCode;

    searchInput.value = courseCode;
    searchInput.setAttribute("title", courseTitle);

    searchInput.classList.add("font-medium");

    courseSelectModal.classList.add("hidden");
  }

  function filterCourses(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return allCourses.slice(0, 100);
    }

    searchTerm = searchTerm.toLowerCase();

    const exactMatches = allCourses.filter((course) => {
      const courseCode = (course.course_code || "").toLowerCase();
      return courseCode === searchTerm;
    });

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    return allCourses
      .filter((course) => {
        const courseCode = (course.course_code || "").toLowerCase();
        const courseTitle = (
          course["course title"] ||
          course.title ||
          ""
        ).toLowerCase();

        if (courseCode.startsWith(searchTerm)) {
          return true;
        }

        return (
          courseCode.includes(searchTerm) || courseTitle.includes(searchTerm)
        );
      })
      .slice(0, 100);
  }

  if (courseSearch) {
    courseSearch.addEventListener("input", function () {
      const searchTerm = this.value;
      const filteredCourses = filterCourses(searchTerm);
      renderCourseList(filteredCourses);
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", function () {
      courseSelectModal.classList.add("hidden");

      if (inSimilarityMode && searchInput) {
        searchInput.removeEventListener("click", openCourseModal);
        searchInput.addEventListener("click", openCourseModal);
      }
    });
  }

  window.addEventListener("click", function (event) {
    if (event.target === courseSelectModal) {
      courseSelectModal.classList.add("hidden");

      if (inSimilarityMode && searchInput) {
        searchInput.removeEventListener("click", openCourseModal);
        searchInput.addEventListener("click", openCourseModal);
      }
    }
  });

  window.openCourseModal = openCourseModal;
  window.fetchAllCourses = fetchAllCourses;
  window.renderCourseList = renderCourseList;
});
