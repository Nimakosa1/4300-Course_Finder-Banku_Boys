function isSimilaritySidebarOpen() {
  const sidebar = document.getElementById("similarity-sidebar");
  if (sidebar) {
    return sidebar.style.width === "350px";
  }
  return false;
}

function openSimilaritySidebar() {
  const sidebar = document.getElementById("similarity-sidebar");
  if (sidebar) {
    sidebar.style.width = "350px";

    generateSimilarityData();
  }
}

function closeSimilaritySidebar() {
  const sidebar = document.getElementById("similarity-sidebar");
  if (sidebar) {
    sidebar.style.width = "0";
  }
}

function generateSimilarityData() {
  if (!window.selectedCourse || !window.query) return;

  const similarityScore = window.selectedCourse.BERT_similarity_score || 0;

  const percentageElement = document.getElementById("similarity-percentage");
  if (percentageElement) {
    percentageElement.textContent = `${similarityScore.toFixed(1)}%`;
  }

  const radarData = {
    content: window.selectedCourse.BERT_similarity_score || 0,
    keywords: window.selectedCourse.keyword_score || 0,
    title: window.selectedCourse.BERT_title_similarity_score || 0,
    sentiment: window.selectedCourse.sentiment_score || 0,
    reviews: calculateReviewScore(window.selectedCourse),
    relevance: calculateOverallRelevance(window.selectedCourse),
  };

  createSpiderChart(radarData);

  generateTags();
}

function calculateReviewScore(course) {
  if (course.avgOverall && course.avgOverall > 0) {
    return course.avgOverall * 20;
  }

  if (course.avgDifficulty && course.avgDifficulty > 0) {
    return (6 - course.avgDifficulty) * 20;
  }

  return 50;
}

function calculateOverallRelevance(course) {
  const scores = [
    course.BERT_similarity_score || 0,
    course.keyword_score || 0,
    course.BERT_title_similarity_score || 0,
  ];

  const sum = scores.reduce((total, score) => total + score, 0);
  return sum / scores.length;
}

function createSpiderChart(data) {
  const ctx = document.getElementById("similarity-chart");
  if (!ctx) return;

  if (window.similarityChart) {
    window.similarityChart.destroy();
  }

  window.similarityChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: [
        "Content Match",
        "Keyword Match",
        "Title Match",
        "Sentiment",
        "Reviews",
        "Overall Relevance",
      ],
      datasets: [
        {
          label: window.selectedCourse
            ? window.selectedCourse.course_code
            : "Course",
          data: [
            data.content,
            data.keywords,
            data.title,
            data.sentiment,
            data.reviews,
            data.relevance,
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
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.label}: ${context.raw.toFixed(1)}%`;
            },
          },
        },
      },
    },
  });
}

function generateTags() {
  const tagsContainer = document.getElementById("similarity-tags");
  if (!tagsContainer || !window.selectedCourse) return;

  tagsContainer.innerHTML = "";

  const svdTopWords = window.selectedCourse.svd_top_words || [];

  if (svdTopWords.length > 0) {
    svdTopWords.forEach((word) => {
      if (word && word.trim()) {
        const tagElement = document.createElement("div");
        tagElement.className = "px-3 py-1 bg-gray-200 rounded-full text-sm";
        tagElement.textContent = word;
        tagsContainer.appendChild(tagElement);
      }
    });
  } else {
    const noTagsElement = document.createElement("p");
    noTagsElement.className = "text-sm text-gray-500";
    noTagsElement.textContent = "No key concepts available for this course";
    tagsContainer.appendChild(noTagsElement);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.updateSimilaritySidebar = function () {
    if (isSimilaritySidebarOpen()) {
      generateSimilarityData();
    }
  };
});
