let currentPage = 1;

async function loadStory(page) {
  const res = await fetch(`/api/stories?page=${page}`);
  const data = await res.json();
  if (data.stories.length === 0) return;

  const story = data.stories[0];
  document.getElementById('story-title').textContent = story.title;
  document.getElementById('story-content').textContent = story.content;
  document.getElementById('story-moral').textContent = story.moral;

  currentPage = data.current_page;
  document.getElementById('current-page').textContent = currentPage;

  document.getElementById('prev-btn').disabled = !data.has_prev;
  document.getElementById('next-btn').disabled = !data.has_next;
}

async function loadRandomStory() {
  const res = await fetch(`/api/stories/random`);
  const story = await res.json();

  document.getElementById('story-title').textContent = story.title;
  document.getElementById('story-content').textContent = story.content;
  document.getElementById('story-moral').textContent = story.moral;

  // 更新当前页码，使翻页功能继续有效
  currentPage = story.page;
  document.getElementById('current-page').textContent = currentPage;

  // 尝试加载此页确认是否有前/后一页
  const checkRes = await fetch(`/api/stories?page=${currentPage}`);
  const checkData = await checkRes.json();
  document.getElementById('prev-btn').disabled = !checkData.has_prev;
  document.getElementById('next-btn').disabled = !checkData.has_next;
}

document.getElementById('prev-btn').addEventListener('click', () => loadStory(currentPage - 1));
document.getElementById('next-btn').addEventListener('click', () => loadStory(currentPage + 1));
document.getElementById('random-btn').addEventListener('click', loadRandomStory);

// 初始加载第一页
loadStory(currentPage);
