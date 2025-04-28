let currentPage = 0; // not meaningful when we load random first

// Utility: Fisher‑Yates shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function fetchStory(pageParam) {
  const res = await fetch(`/api/stories?page=${pageParam}`);
  const data = await res.json();
  return data.stories.length ? data.stories[0] : null;
}

async function fetchRandomWrongMorals(count, exclude) {
  const morals = new Set();
  while (morals.size < count) {
    const res = await fetch('/api/stories/random');
    const s = await res.json();
    if (s.moral !== exclude) {
      morals.add(s.moral);
    }
  }
  return Array.from(morals);
}

function renderStory(story) {
  document.getElementById('story-title').textContent = story.title;
  document.getElementById('story-content').textContent = story.content;
  document.getElementById('current-page').textContent = currentPage;
}

async function buildQuiz(correctMoral) {
  const wrongs = await fetchRandomWrongMorals(3, correctMoral);
  const options = shuffle([correctMoral, ...wrongs]);

  const quizBox = document.getElementById('quiz-box');
  const quizForm = document.getElementById('quiz-form');
  const feedback = document.getElementById('answer-feedback');

  quizBox.classList.remove('d-none');
  quizForm.innerHTML = '';
  feedback.textContent = '';

  options.forEach((option, idx) => {
    const id = `opt${idx}`;
    quizForm.insertAdjacentHTML('beforeend', `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="moralOption" id="${id}" value="${option}">
        <label class="form-check-label" for="${id}">${option}</label>
      </div>`);
  });

  // Primary action button
  quizForm.insertAdjacentHTML('beforeend', '<button id="check-btn" class="btn btn-primary mt-2" type="submit">Check Answer</button>');

  quizForm.onsubmit = (e) => {
    e.preventDefault();
    const sel = quizForm.moralOption.value;
    if (!sel) return;
    const checkBtn = document.getElementById('check-btn');
    if (sel === correctMoral) {
      feedback.innerHTML = '<span class="text-success fw-semibold">Correct! 👍</span>';
      // Replace button with "Next Story"
      checkBtn.remove();
      quizForm.insertAdjacentHTML('beforeend', '<button id="next-story-btn" class="btn btn-secondary mt-2" type="button">Next Story</button>');
      document.getElementById('next-story-btn').addEventListener('click', loadRandomStory);
    } else {
      feedback.innerHTML = `<span class="text-danger fw-semibold">Oops! The correct moral is: “${correctMoral}”.</span>`;
    }
  };
}

// === On page load, go straight to a random story ===
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prev-btn').addEventListener('click', () => loadStory(currentPage - 1));
  document.getElementById('next-btn').addEventListener('click', () => loadStory(currentPage + 1));
  document.getElementById('random-btn').addEventListener('click', loadRandomStory);
  loadRandomStory(); // initial fetch is random
});


async function loadStory(page) {
  const story = await fetchStory(page);
  if (!story) return;
  currentPage = page;
  renderStory(story);

  // Enable/disable nav buttons via a lightweight check
  const navRes = await fetch(`/api/stories?page=${page}`);
  const navData = await navRes.json();
  document.getElementById('prev-btn').disabled = !navData.has_prev;
  document.getElementById('next-btn').disabled = !navData.has_next;

  await buildQuiz(story.moral);
}

async function loadRandomStory() {
  const res = await fetch('/api/stories/random');
  const story = await res.json();
  currentPage = story.page;
  renderStory(story);
  await buildQuiz(story.moral);

  // Refresh nav button state
  const navRes = await fetch(`/api/stories?page=${currentPage}`);
  const navData = await navRes.json();
  document.getElementById('prev-btn').disabled = !navData.has_prev;
  document.getElementById('next-btn').disabled = !navData.has_next;
}

// Button hooks

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('prev-btn').addEventListener('click', () => loadStory(currentPage - 1));
  document.getElementById('next-btn').addEventListener('click', () => loadStory(currentPage + 1));
  document.getElementById('random-btn').addEventListener('click', loadRandomStory);
  loadStory(currentPage); // first load
});