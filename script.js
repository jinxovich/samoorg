// ===== СОСТОЯНИЕ =====
let currentSlide = 0;
const totalSlides = 6;
let isAnimating = false;

// ===== LIVE COUNTER =====
const RPS = 1500000 / 86400;
let counterValue = 0;
let counterStartTime = Date.now();
let counterInterval = null;
let lastFlash = 0;

function startCounter() {
  counterStartTime = Date.now();
  counterValue = 0;
  if (counterInterval) clearInterval(counterInterval);
  counterInterval = setInterval(() => {
    const elapsed = (Date.now() - counterStartTime) / 1000;
    const newValue = Math.floor(elapsed * RPS);
    if (newValue !== counterValue) {
      counterValue = newValue;
      const el = document.getElementById('liveCount');
      if (el) {
        el.textContent = counterValue.toLocaleString('ru-RU');
        const now = Date.now();
        if (now - lastFlash > 80) {
          lastFlash = now;
          el.classList.add('tick');
          setTimeout(() => el.classList.remove('tick'), 120);
        }
      }
    }
  }, 50);
}

// ===== ХАРДКОД ОТВЕТЫ =====
const AI_ANSWERS = {
  work: {
    q: 'Чем занимался в Cortexa?',
    a: `Cortexa — платформа автоматизации бизнес-процессов с пиковой нагрузкой до 1.5 миллиона API-запросов в сутки. Дмитрий пришёл туда Junior Backend Developer-ом сразу после ЕГЭ.\n\nПроектировал микросервисы на FastAPI, занимался моделями БД и production-миграциями на Alembic/PostgreSQL. Параллельно вырос до AI Engineer — участвовал в инициативной группе, которая первой в компании начала внедрять LLM в продукт.`
  },
  rag: {
    q: 'Что такое RAG и зачем?',
    a: `RAG (Retrieval-Augmented Generation) — архитектура, при которой модель перед генерацией ответа сначала извлекает релевантные документы из базы знаний.\n\nВ Cortexa это решало конкретную задачу: вместо «галлюцинаций» LLM опиралась на реальные внутренние данные компании. Для хранения и поиска по эмбеддингам использовалось расширение pgvector прямо в PostgreSQL.`
  },
  age: {
    q: 'Как попал на работу после ЕГЭ?',
    a: `Дмитрий начал программировать до поступления в университет — к моменту первого оффера уже был готов к production-задачам.\n\nОффер пришёл ещё до первой пары. Именно такое давление ускоряет рост быстрее любого учебного курса.`
  },
  result: {
    q: 'Самый крутой результат?',
    a: `Redis-кэширование семантических ответов LLM. Задача нетривиальная: нужно определить, какие запросы достаточно похожи, чтобы переиспользовать кэш — не ломая консистентность.\n\nИтог пилота: минус 30% платных запросов к внешнему AI-провайдеру. Прямая экономия бюджета — достигнутая кодом человека, который только поступил в университет.`
  },
  stack: {
    q: 'Какой стек использовал?',
    a: `Backend: Python, FastAPI, SQLAlchemy, Alembic, Celery, Redis, Docker, Pytest.\n\nБаза данных: PostgreSQL + pgvector для хранения векторных эмбеддингов.\n\nAI-слой: OpenAI API, Anthropic API, RAG-пайплайн собственной разработки, MCP. Всё — под реальной production-нагрузкой.`
  },
  hard: {
    q: 'Самое сложное что делал?',
    a: `Нетривиальная миграция с изменением типов полей и пересчётом данных на лету. Production. Без даунтайма. Под контролем senior-инженера.\n\nAlembic-скрипт, временные столбцы, батчевое обновление, проверки на каждом шаге. Когда всё прошло чисто — это была настоящая production-задача с последствиями, не учебный проект.`
  },
  tests: {
    q: 'Как покрывал код тестами?',
    a: `Писал юнит- и интеграционные тесты на Pytest — покрыл около 50% критичного функционала. Намеренно фокусировался на бизнес-логике и точках интеграции, где баги стоят дороже всего.\n\nНастроил запуск тестов в CI-пайплайне — каждый PR проходил проверку автоматически.`
  }
};

// ===== НАВИГАЦИЯ =====
function goTo(index) {
  if (isAnimating || index === currentSlide) return;
  if (index < 0 || index >= totalSlides) return;
  isAnimating = true;
  const prevSlide = document.getElementById(`slide-${currentSlide}`);
  const nextSlide = document.getElementById(`slide-${index}`);
  prevSlide.classList.add('exit-up');
  prevSlide.classList.remove('active');
  setTimeout(() => {
    prevSlide.classList.remove('exit-up');
    currentSlide = index;
    nextSlide.classList.add('active');
    updateUI();
    setTimeout(() => { isAnimating = false; }, 600);
  }, 300);
}

function go(dir) {
  goTo(currentSlide + dir);
}

function updateUI() {
  document.getElementById('progressFill').style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;
  document.getElementById('navCurrent').textContent = String(currentSlide + 1).padStart(2, '0');
  document.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
  document.getElementById('btnPrev').disabled = currentSlide === 0;
  document.getElementById('btnNext').disabled = currentSlide === totalSlides - 1;
}

// ===== AI ЧАТ =====
function askQuestion(btn, key) {
  if (btn.disabled) return;
  const data = AI_ANSWERS[key];
  if (!data) return;
  const chips = document.querySelectorAll('.chip');
  chips.forEach(c => c.disabled = true);
  btn.classList.add('used');
  addUserMessage(data.q);
  const typingEl = addTypingIndicator();
  const delay = 700 + Math.random() * 600;
  setTimeout(() => {
    typingEl.remove();
    addAIMessage(data.a);
    chips.forEach(c => { if (c !== btn) c.disabled = false; });
  }, delay);
}

function addUserMessage(text) {
  const win = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--user';
  msg.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div><div class="chat-avatar chat-avatar--user">Вы</div>`;
  win.appendChild(msg);
  scrollChat();
}

function addAIMessage(text) {
  const win = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--ai';
  const formatted = escapeHtml(text).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  msg.innerHTML = `<div class="chat-avatar chat-avatar--ai">AI</div><div class="chat-bubble"><p>${formatted}</p></div>`;
  msg.style.opacity = '0';
  msg.style.transform = 'translateY(8px)';
  win.appendChild(msg);
  scrollChat();
  requestAnimationFrame(() => {
    msg.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    msg.style.opacity = '1';
    msg.style.transform = 'translateY(0)';
  });
}

function addTypingIndicator() {
  const win = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--ai';
  msg.innerHTML = `<div class="chat-avatar chat-avatar--ai">AI</div><div class="chat-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  win.appendChild(msg);
  scrollChat();
  return msg;
}

function scrollChat() {
  const win = document.getElementById('chatWindow');
  setTimeout(() => { win.scrollTop = win.scrollHeight; }, 50);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== КЛАВИАТУРА =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') go(-1);
});

// ===== SWIPE =====
let touchStartY = 0;
document.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) go(dy > 0 ? 1 : -1);
}, { passive: true });

// ===== ТЁМНАЯ ТЕМА =====
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
}

// ===== INIT =====
document.getElementById('slide-0').classList.add('active');
updateUI();
startCounter();