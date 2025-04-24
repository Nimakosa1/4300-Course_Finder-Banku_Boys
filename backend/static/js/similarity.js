/**
 * Course Similarity Visualization
 *
 * This file contains functions to display and manage the similarity sidebar
 * that shows how a course relates to the user's search query.
 */

// Function to open the similarity sidebar
function openSimilaritySidebar() {
  const sidebar = document.getElementById("similarity-sidebar");
  if (sidebar) {
    sidebar.style.width = "350px";

    // Generate visualization data
    generateSimilarityData();
  }
}

// Function to close the similarity sidebar
function closeSimilaritySidebar() {
  const sidebar = document.getElementById("similarity-sidebar");
  if (sidebar) {
    sidebar.style.width = "0";
  }
}

// Generate the similarity data visualization
function generateSimilarityData() {
  if (!window.selectedCourse || !window.query) return;

  // Calculate similarity score (this would be replaced with actual algorithm)
  // In a real implementation, this would come from the backend
  const similarityScore = Math.random() * 30 + 70; // Random score between 70-100%

  // Update similarity percentage
  const percentageElement = document.getElementById("similarity-percentage");
  if (percentageElement) {
    percentageElement.textContent = `${similarityScore.toFixed(1)}%`;
  }

  // Generate radar chart data
  const radarData = {
    content: Math.random() * 0.8 + 0.2,
    description: Math.random() * 0.8 + 0.2,
    title: Math.random() * 0.8 + 0.2,
    reviews: Math.random() * 0.8 + 0.2,
    professor: Math.random() * 0.8 + 0.2,
    keywords: Math.random() * 0.8 + 0.2,
  };

  // Create spider chart
  createSpiderChart(radarData);

  // Generate tags
  generateTags();
}

// Create the spider chart visualization
function createSpiderChart(data) {
  const ctx = document.getElementById("similarity-chart");

  // Clear previous chart if it exists
  if (window.similarityChart) {
    window.similarityChart.destroy();
  }

  // Create the chart
  window.similarityChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Content Match",
        "Description",
        "Title",
        "Reviews",
        "Professor",
        "Keywords",
      ],
      datasets: [
        {
          label: window.selectedCourse
            ? window.selectedCourse.course_code
            : "Course",
          data: [
            data.content * 100,
            data.description * 100,
            data.title * 100,
            data.reviews * 100,
            data.professor * 100,
            data.keywords * 100,
          ],
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          pointBackgroundColor: "rgba(255, 99, 132, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(255, 99, 132, 1)",
        },
      ],
    },
    options: {
      scales: {
        r: {
          angleLines: {
            display: true,
          },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  });
}

// Generate tags related to the course and search query
function generateTags() {
  const tagsContainer = document.getElementById("similarity-tags");
  if (!tagsContainer) return;

  // Clear previous tags
  tagsContainer.innerHTML = "";

  // Generate 3-5 random tags related to the course
  const possibleTags = [
    "lecture",
    "discussion",
    "lab",
    "project",
    "research",
    "writing",
    "reading",
    "programming",
    "design",
    "analysis",
    "theory",
    "application",
    "teamwork",
    "individual",
    "exam",
    "paper",
    "presentation",
  ];

  // Select random tags
  const numTags = Math.floor(Math.random() * 3) + 3; // 3-5 tags
  const selectedTags = [];

  for (let i = 0; i < numTags; i++) {
    const randomIndex = Math.floor(Math.random() * possibleTags.length);
    const tag = possibleTags[randomIndex];

    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);

      // Create tag element
      const tagElement = document.createElement("div");
      tagElement.className = "px-3 py-1 bg-gray-200 rounded-full text-sm";
      tagElement.textContent = tag;
      tagsContainer.appendChild(tagElement);
    }
  }
}
