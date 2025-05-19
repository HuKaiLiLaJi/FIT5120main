// --------------------------------------------------------
// UTILITY: Fisher-Yates Shuffle
// --------------------------------------------------------
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --------------------------------------------------------
// FETCH FUNCTIONS
// --------------------------------------------------------

/**
 * Fetch a specific story by page number.
 * @param {number} pageParam 
 */
async function fetchStory(pageParam) {
  const res = await fetch(`/api/stories?page=${pageParam}`);
  const data = await res.json();
  return data.stories.length ? data.stories[0] : null;
}

/**
 * Fetch random incorrect morals, excluding the correct one.
 * @param {number} count 
 * @param {string} exclude 
 */
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

// --------------------------------------------------------
// RENDER STORY + QUIZ UI
// --------------------------------------------------------

/**
 * Render story content to the DOM
 */
function renderStory(story) {
  document.getElementById('story-title').textContent = story.title;
  document.getElementById('story-content').textContent = story.content;
  document.getElementById('current-page').textContent = currentPage;
}

/**
 * Build multiple-choice quiz using correct + 3 incorrect morals
 */
async function buildQuiz(correctMoral) {
  const wrongs = await fetchRandomWrongMorals(3, correctMoral);
  const options = shuffle([correctMoral, ...wrongs]);

  const quizBox = document.getElementById('quiz-box');
  const quizForm = document.getElementById('quiz-form');
  const feedback = document.getElementById('answer-feedback');

  quizBox.classList.remove('d-none');
  quizForm.innerHTML = '';
  feedback.textContent = '';

  // Render options
  options.forEach((option, idx) => {
    const id = `opt${idx}`;
    quizForm.insertAdjacentHTML('beforeend', `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="moralOption" id="${id}" value="${option}">
        <label class="form-check-label" for="${id}">${option}</label>
      </div>`);
  });

  // Add submit button
  quizForm.insertAdjacentHTML('beforeend', `
    <button id="check-btn" class="btn btn-primary mt-2" type="submit">Check Answer</button>`);

  // Handle quiz submission
  quizForm.onsubmit = (e) => {
    e.preventDefault();
    const sel = quizForm.moralOption.value;
    if (!sel) return;

    const checkBtn = document.getElementById('check-btn');
    if (sel === correctMoral) {
      feedback.innerHTML = '<span class="text-success fw-semibold">Correct! 👍</span>';
      checkBtn.remove();

      // Add next story button
      quizForm.insertAdjacentHTML('beforeend', `
        <button id="next-story-btn" class="btn btn-secondary mt-2" type="button">Next Story</button>`);
      document.getElementById('next-story-btn').addEventListener('click', loadRandomStory);
    } else {
      feedback.innerHTML = `<span class="text-danger fw-semibold">Oops! The correct moral is: “${correctMoral}”.</span>`;
    }
  };
}

// --------------------------------------------------------
// LOADERS: BY PAGE OR RANDOM
// --------------------------------------------------------

/**
 * Load a story by page number and update nav state
 */
async function loadStory(page) {
  const story = await fetchStory(page);
  if (!story) return;

  currentPage = page;
  renderStory(story);

  // Check nav availability
  const navRes = await fetch(`/api/stories?page=${page}`);
  const navData = await navRes.json();
  document.getElementById('prev-btn').disabled = !navData.has_prev;
  document.getElementById('next-btn').disabled = !navData.has_next;

  await buildQuiz(story.moral);
}

/**
 * Load a completely random story
 */
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

// --------------------------------------------------------
// PAGE INITIALIZATION
// --------------------------------------------------------

let currentPage = 1; // Track the current story page

document.addEventListener('DOMContentLoaded', () => {
  // Button actions
  document.getElementById('prev-btn').addEventListener('click', () => loadStory(currentPage - 1));
  document.getElementById('next-btn').addEventListener('click', () => loadStory(currentPage + 1));
  document.getElementById('random-btn').addEventListener('click', loadRandomStory);

  // Load initial story (random)
  loadRandomStory();
});