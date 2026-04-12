// ===== СОСТОЯНИЕ =====
let currentSlide = 0;
const totalSlides = 4;
let isAnimating = false;

// ===== ЗАГОТОВЛЕННЫЕ ОТВЕТЫ AI =====
const AI_ANSWERS = {
  work: {
    q: 'Чем занимался в Cortexa?',
    a: `В Cortexa я работал Backend/AI-инженером в команде, которая развивала платформу автоматизации бизнес-процессов — до 1.5 миллиона API-запросов в сутки.

Писал микросервисы на FastAPI, проектировал базы данных, делал миграции PostgreSQL. Параллельно был частью AI-инициативы: первыми в компании начали внедрять LLM в продукт.`
  },
  rag: {
    q: 'Что такое RAG и зачем?',
    a: `RAG — Retrieval-Augmented Generation. Это архитектура, при которой языковая модель перед ответом сначала ищет нужные документы в базе знаний.

Мы использовали это, чтобы LLM опиралась на внутренние данные компании, а не «выдумывала» ответы. Для хранения и поиска — векторное расширение pgvector в PostgreSQL.`
  },
  age: {
    q: 'Как попал на работу в 18?',
    a: `Начал писать код ещё до поступления в университет. Когда появился оффер — просто был готов.

Честно: первые задачи были страшновато брать. Но я делал, получал код-ревью от сеньора, переделывал. Так и работает.`
  },
  result: {
    q: 'Самый крутой результат?',
    a: `Думаю, Redis-кэширование семантических ответов LLM. Звучит просто, но за этим стоит: понять, какие запросы повторяются, настроить правильный TTL, не сломать консистентность.

Результат — минус 30% платных запросов к внешнему AI-провайдеру в рамках пилота. Реальные деньги, сэкономленные кодом студента первого курса.`
  },
  stack: {
    q: 'Какой стек использовал?',
    a: `Backend: Python, FastAPI, SQLAlchemy, Alembic, Pytest, Celery, Redis, Docker.

База данных: PostgreSQL + pgvector для хранения эмбеддингов.

AI/ML: OpenAI API, Anthropic API, RAG-пайплайн, MCP. Всё в связке с реальной production-нагрузкой.`
  },
  hard: {
    q: 'Самое сложное что делал?',
    a: `Нетривиальная миграция с изменением типов полей и пересчётом данных на лету. Под ревью сеньора, в production, без даунтайма и потери данных.

Когда всё прошло — это было одно из лучших ощущений. Это уже не учебный проект.`
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
  // Прогресс-бар
  const fill = document.getElementById('progressFill');
  fill.style.width = `${((currentSlide + 1) / totalSlides) * 100}%`;

  // Счётчик
  document.getElementById('navCurrent').textContent =
    String(currentSlide + 1).padStart(2, '0');

  // Точки
  document.querySelectorAll('.nav-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  // Кнопки стрелок
  document.getElementById('btnPrev').disabled = currentSlide === 0;
  document.getElementById('btnNext').disabled = currentSlide === totalSlides - 1;
}

// ===== AI ЧАТ (ИМИТАЦИЯ) =====
function askQuestion(btn, key) {
  if (btn.disabled) return;

  const data = AI_ANSWERS[key];
  if (!data) return;

  // Дизейблим все кнопки на время
  const chips = document.querySelectorAll('.chip');
  chips.forEach(c => c.disabled = true);
  btn.classList.add('used');

  addUserMessage(data.q);

  // Имитируем "думает"
  const typingEl = addTypingIndicator();

  // Задержка как будто думает
  const delay = 600 + Math.random() * 600;
  setTimeout(() => {
    typingEl.remove();
    addAIMessage(data.a);
    // Разблокируем остальные чипы
    chips.forEach(c => {
      if (c !== btn) c.disabled = false;
    });
  }, delay);
}

function addUserMessage(text) {
  const win = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--user';
  msg.innerHTML = `
    <div class="chat-bubble">${escapeHtml(text)}</div>
    <div class="chat-avatar chat-avatar--user">Вы</div>
  `;
  win.appendChild(msg);
  scrollChat();
}

function addAIMessage(text) {
  const win = document.getElementById('chatWindow');
  const msg = document.createElement('div');
  msg.className = 'chat-msg chat-msg--ai';

  // Форматируем переносы строк
  const formatted = escapeHtml(text).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  msg.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-bubble">${formatted}</div>
  `;

  // Анимация появления
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
  msg.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-bubble">
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  win.appendChild(msg);
  scrollChat();
  return msg;
}

function scrollChat() {
  const win = document.getElementById('chatWindow');
  setTimeout(() => {
    win.scrollTop = win.scrollHeight;
  }, 50);
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

// ===== SWIPE (мобилка) =====
let touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) go(dy > 0 ? 1 : -1);
}, { passive: true });

// ===== INIT =====
document.getElementById('slide-0').classList.add('active');
updateUI();