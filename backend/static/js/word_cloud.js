class WordCloud {
  constructor(container, words = []) {
    this.container = container;
    this.words = words.length > 0 ? words : this.getRandomWords();
    this.radius = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    this.isLoading = true;
    this.completedCount = 0;
    this.onCompleteCallback = null;

    this.canvas = document.createElement("canvas");
    this.canvas.width = container.offsetWidth || window.innerWidth;
    this.canvas.height = container.offsetHeight || window.innerHeight;
    this.canvas.style.backgroundColor = "#111111";
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");

    this.positionWords();

    this.animate();

    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }

  getRandomWords() {
    const allWords = [
      // Natural Sciences
      { text: "physics", size: 3.7 },
      { text: "chemistry", size: 3.8 },
      { text: "biology", size: 3.9 },
      { text: "astronomy", size: 3.6 },
      { text: "geology", size: 3.5 },
      { text: "ecology", size: 3.4 },
      { text: "quantum", size: 3.8 },
      { text: "relativity", size: 3.6 },
      { text: "molecule", size: 3.5 },
      { text: "cell", size: 3.4 },

      // Mathematics
      { text: "algebra", size: 3.7 },
      { text: "calculus", size: 3.9 },
      { text: "geometry", size: 3.6 },
      { text: "statistics", size: 3.8 },
      { text: "probability", size: 3.7 },
      { text: "theorem", size: 3.5 },
      { text: "equation", size: 3.6 },
      { text: "algorithm", size: 3.9 },
      { text: "function", size: 3.5 },
      { text: "matrix", size: 3.4 },

      // Computer Science
      { text: "programming", size: 4.0 },
      { text: "database", size: 3.7 },
      { text: "network", size: 3.6 },
      { text: "security", size: 3.7 },
      { text: "artificial", size: 3.9 },
      { text: "intelligence", size: 3.8 },
      { text: "software", size: 3.6 },
      { text: "hardware", size: 3.5 },
      { text: "internet", size: 3.7 },
      { text: "data", size: 3.9 },

      // Engineering
      { text: "mechanical", size: 3.7 },
      { text: "electrical", size: 3.8 },
      { text: "civil", size: 3.5 },
      { text: "robotics", size: 3.9 },
      { text: "aerospace", size: 3.7 },
      { text: "chemical", size: 3.6 },
      { text: "design", size: 3.8 },
      { text: "structure", size: 3.5 },
      { text: "system", size: 3.7 },
      { text: "control", size: 3.4 },

      // Social Sciences
      { text: "psychology", size: 3.9 },
      { text: "sociology", size: 3.7 },
      { text: "economics", size: 3.8 },
      { text: "politics", size: 3.6 },
      { text: "anthropology", size: 3.7 },
      { text: "archaeology", size: 3.5 },
      { text: "geography", size: 3.4 },
      { text: "history", size: 3.8 },
      { text: "philosophy", size: 3.9 },
      { text: "ethics", size: 3.7 },

      // Humanities
      { text: "literature", size: 3.8 },
      { text: "language", size: 3.7 },
      { text: "art", size: 3.5 },
      { text: "music", size: 3.6 },
      { text: "theater", size: 3.4 },
      { text: "film", size: 3.5 },
      { text: "religion", size: 3.7 },
      { text: "culture", size: 3.8 },
      { text: "writing", size: 3.6 },
      { text: "classics", size: 3.4 },

      // Business & Economics
      { text: "finance", size: 3.8 },
      { text: "marketing", size: 3.7 },
      { text: "management", size: 3.6 },
      { text: "accounting", size: 3.5 },
      { text: "business", size: 3.9 },
      { text: "entrepreneurship", size: 3.7 },
      { text: "investment", size: 3.6 },
      { text: "market", size: 3.8 },
      { text: "trade", size: 3.5 },
      { text: "economy", size: 3.9 },

      // Health & Medicine
      { text: "medicine", size: 3.9 },
      { text: "nursing", size: 3.7 },
      { text: "pharmacy", size: 3.6 },
      { text: "anatomy", size: 3.8 },
      { text: "physiology", size: 3.7 },
      { text: "disease", size: 3.5 },
      { text: "therapy", size: 3.6 },
      { text: "neuroscience", size: 3.9 },
      { text: "surgery", size: 3.7 },
      { text: "health", size: 3.8 },

      // Education
      { text: "teaching", size: 3.8 },
      { text: "learning", size: 3.9 },
      { text: "curriculum", size: 3.6 },
      { text: "assessment", size: 3.5 },
      { text: "education", size: 3.9 },
      { text: "pedagogy", size: 3.7 },
      { text: "student", size: 3.8 },
      { text: "classroom", size: 3.6 },
      { text: "school", size: 3.7 },
      { text: "university", size: 3.8 },

      // General academic terms
      { text: "research", size: 4.0 },
      { text: "theory", size: 3.8 },
      { text: "analysis", size: 3.9 },
      { text: "knowledge", size: 3.7 },
      { text: "study", size: 3.6 },
      { text: "science", size: 3.9 },
      { text: "experiment", size: 3.7 },
      { text: "innovation", size: 3.8 },
      { text: "discovery", size: 3.9 },
      { text: "seminar", size: 3.5 },
    ];

    const numWords = Math.floor(Math.random() * 11) + 40;
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numWords);
  }

  positionWords() {
    const phi = Math.PI * (3 - Math.sqrt(5));

    this.words = this.words.map((word, i) => {
      const y = 1 - (i / (this.words.length - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);

      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      return {
        ...word,
        x: x * this.radius,
        y: y * this.radius,
        z: z * this.radius,
        rotation: Math.random() * 360,
        opacity: 1,
        completed: false,
      };
    });
  }

  animate() {
    this.ctx.fillStyle = "#111111";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    const time = Date.now() * 0.0002;

    const sortedWords = [...this.words].sort((a, b) => {
      const aZ = a.z * Math.cos(time) - a.x * Math.sin(time);
      const bZ = b.z * Math.cos(time) - b.x * Math.sin(time);
      return aZ - bZ;
    });

    sortedWords.forEach((word) => {
      const x = word.x * Math.cos(time) + word.z * Math.sin(time);
      const z = word.z * Math.cos(time) - word.x * Math.sin(time);

      const scale = 1500 / (1500 + z);
      const screenX = centerX + x * scale;
      const screenY = centerY + word.y * scale;

      if (!this.isLoading && !word.completed) {
        word.opacity = Math.max(0, word.opacity - 0.05);
        if (word.opacity <= 0.05) {
          word.completed = true;
          this.completedCount++;
          if (
            this.completedCount >= this.words.length &&
            this.onCompleteCallback
          ) {
            this.onCompleteCallback();
            return;
          }
        }
      }

      this.ctx.save();
      this.ctx.translate(screenX, screenY);
      this.ctx.rotate((word.rotation * Math.PI) / 180);
      this.ctx.font = `${Math.max(12, word.size * 6 * scale)}px Arial`;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${word.opacity})`;
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(word.text, 0, 0);
      this.ctx.restore();
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  setOnComplete(callback) {
    this.onCompleteCallback = callback;
    if (this.completedCount >= this.words.length) {
      callback();
    }
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }
  }
}
