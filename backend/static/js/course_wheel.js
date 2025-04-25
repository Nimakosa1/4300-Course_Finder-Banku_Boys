document.addEventListener("DOMContentLoaded", function () {
  const courseWheelContainer = document.getElementById("course-wheel");
  if (!courseWheelContainer) return;

  let classes = [];
  let selectedIndex = 0;
  let autoScrollPaused = false;
  let autoScrollInterval = null;

  fetch("/api/get_courses")
    .then((response) => response.json())
    .then((data) => {
      if (data && data.courses && data.courses.length > 0) {
        classes = getRandomCourses(data.courses, 30);
        renderCourseWheel();
        startAutoScroll();
      }
    })
    .catch((error) => {
      console.error("Error fetching courses for wheel:", error);
    });

  function getRandomCourses(allCourses, count) {
    if (allCourses.length <= count) return allCourses;

    const shuffled = [...allCourses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function renderCourseWheel() {
    courseWheelContainer.innerHTML = "";

    const wheelItemsContainer = document.createElement("div");
    wheelItemsContainer.className =
      "w-full h-full relative overflow-visible pt-0";
    wheelItemsContainer.style.perspective = "1000px";

    const innerContainer = document.createElement("div");
    innerContainer.className = "absolute inset-0";

    classes.forEach((classItem, index) => {
      const distance = index - selectedIndex;
      const wrappedDistance =
        distance > classes.length / 2
          ? distance - classes.length
          : distance < -classes.length / 2
          ? distance + classes.length
          : distance;

      const isVisible = Math.abs(wrappedDistance) <= 3;

      if (!isVisible) return;

      const angleRange = 160;
      const angleStep = angleRange / 6;
      const angle = wrappedDistance * angleStep;
      const angleRad = (angle * Math.PI) / 180;

      const radius = 35;
      const xPosition = 60 - radius * Math.cos(angleRad);
      const yPosition = 50 + radius * Math.sin(angleRad);

      const zOffset = Math.abs(wrappedDistance) * 18;
      const opacity = 1 - Math.min(Math.abs(wrappedDistance) * 0.15, 0.6);
      const scale = 1 - Math.min(Math.abs(wrappedDistance) * 0.12, 0.4);
      const rotateY = wrappedDistance * -12;

      const displayCode = classItem.classCode || classItem.course_code || "";

      const courseItem = document.createElement("div");
      courseItem.className =
        "absolute cursor-pointer transition-all duration-200 ease-out";
      courseItem.style.left = `${xPosition}%`;
      courseItem.style.top = `${yPosition}%`;
      courseItem.style.transform = `translate(-50%, -50%) translateZ(${-zOffset}px) rotateY(${rotateY}deg) scale(${scale})`;
      courseItem.style.opacity = opacity;
      courseItem.style.zIndex = 100 - Math.abs(wrappedDistance);
      courseItem.dataset.index = index;

      const classStyle =
        wrappedDistance === 0
          ? "border-black bg-white/90 text-black"
          : "border-gray-400 bg-[#CACACA] text-gray-800";

      const textStyle = wrappedDistance === 0 ? "text-2xl" : "text-xl";

      courseItem.innerHTML = `
          <div class="rounded-lg shadow-lg p-4 min-w-[100px] min-h-[60px] border-2 transition-colors duration-300 ${classStyle}">
            <div class="text-center">
              <div class="font-bold ${textStyle}">
                ${displayCode}
              </div>
            </div>
          </div>
        `;

      courseItem.addEventListener("click", () => {
        setSelectedIndex(index);
        pauseAutoScroll();
      });

      innerContainer.appendChild(courseItem);
    });

    const controlButton = document.createElement("button");
    controlButton.className =
      "absolute bottom-5 right-4 flex items-center gap-4 px-10 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500";
    controlButton.innerHTML = autoScrollPaused
      ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          <span class="text-sm font-medium">Play</span>`
      : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm font-medium">Pause</span>`;

    controlButton.addEventListener("click", toggleAutoScroll);

    wheelItemsContainer.appendChild(innerContainer);
    courseWheelContainer.appendChild(wheelItemsContainer);
    courseWheelContainer.appendChild(controlButton);

    courseWheelContainer.addEventListener("wheel", handleWheel);
  }

  function setSelectedIndex(index) {
    selectedIndex = index;
    renderCourseWheel();
  }

  function startAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
    }

    autoScrollInterval = setInterval(() => {
      if (!autoScrollPaused && classes.length > 0) {
        selectedIndex =
          selectedIndex >= classes.length - 1 ? 0 : selectedIndex + 1;
        renderCourseWheel();
      }
    }, 2000);
  }

  function pauseAutoScroll() {
    autoScrollPaused = true;
    renderCourseWheel();
  }

  function toggleAutoScroll() {
    autoScrollPaused = !autoScrollPaused;
    renderCourseWheel();
  }

  function handleWheel(e) {
    e.preventDefault();

    pauseAutoScroll();

    if (e.deltaY < 0) {
      selectedIndex =
        selectedIndex <= 0 ? classes.length - 1 : selectedIndex - 1;
    } else {
      selectedIndex =
        selectedIndex >= classes.length - 1 ? 0 : selectedIndex + 1;
    }

    renderCourseWheel();
  }
});
