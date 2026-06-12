/* ============================================================
   EcoSort — script.js
   Game Engine, Interactions, LocalStorage, Animations
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────
   1. CONSTANTS & DATA
───────────────────────────────────────── */

const TRASH_ITEMS = [
  { name: 'Kulit Pisang',    type: 'organik',    emoji: '🍌' },
  { name: 'Daun Kering',     type: 'organik',    emoji: '🍂' },
  { name: 'Ampas Kopi',      type: 'organik',    emoji: '☕' },
  { name: 'Cangkang Telur',  type: 'organik',    emoji: '🥚' },
  { name: 'Kulit Apel',      type: 'organik',    emoji: '🍎' },
  { name: 'Nasi Basi',       type: 'organik',    emoji: '🍚' },
  { name: 'Tulang Ikan',     type: 'organik',    emoji: '🐟' },
  { name: 'Botol Plastik',   type: 'anorganik',  emoji: '🍶' },
  { name: 'Kaleng Soda',     type: 'anorganik',  emoji: '🥫' },
  { name: 'Kardus',          type: 'anorganik',  emoji: '📦' },
  { name: 'Kantong Kresek',  type: 'anorganik',  emoji: '🛍️' },
  { name: 'Styrofoam',       type: 'anorganik',  emoji: '🧊' },
  { name: 'Gelas Kaca',      type: 'anorganik',  emoji: '🥛' },
  { name: 'Sedotan Plastik', type: 'anorganik',  emoji: '🥤' },
  { name: 'Baterai Bekas',   type: 'b3',         emoji: '🔋' },
  { name: 'Lampu Neon',      type: 'b3',         emoji: '💡' },
  { name: 'Cat Bekas',       type: 'b3',         emoji: '🎨' },
  { name: 'Aki Mobil',       type: 'b3',         emoji: '🚗' },
  { name: 'Obat Kadaluarsa', type: 'b3',         emoji: '💊' },
  { name: 'Kemasan Pestisida', type: 'b3',       emoji: '🧪' },
];

const BADGES = [
  { id: 'beginner',    name: 'Pemula Hijau',   emoji: '🌱', req: 'Main 1 game',         condition: s => s.gamesPlayed >= 1 },
  { id: 'tenGames',    name: 'Petualang Eco',  emoji: '🌿', req: 'Main 10 game',         condition: s => s.gamesPlayed >= 10 },
  { id: 'firstScore',  name: 'Skor Perdana',   emoji: '⭐', req: 'Raih skor ≥50',        condition: s => s.bestScores.classic >= 50 },
  { id: 'masterPilah', name: 'Master Pilah',   emoji: '🏆', req: 'Skor Classic ≥150',    condition: s => s.bestScores.classic >= 150 },
  { id: 'ecoWarrior',  name: 'Eco Warrior',    emoji: '🛡️', req: 'Akurasi ≥80%',         condition: s => s.totalCorrect > 0 && (s.totalCorrect / (s.totalCorrect + s.totalWrong)) >= 0.8 },
  { id: 'daily',       name: 'Pejuang Harian', emoji: '📅', req: 'Selesaikan Daily',     condition: s => s.dailyComplete },
];

const MODE_CONFIG = {
  classic: {
    label: 'Classic Mode',
    desc: 'Pilah sebanyak mungkin dalam 60 detik. Benar +10, Salah -5. 3 nyawa tersedia. Combo 3× = +20 bonus!',
    time: 60,
    lives: 3,
    scoreMultiplier: 1,
    hasCombo: true,
    hasTimer: true,
    hasLives: true,
    endOnMiss: false,
    itemCount: null,
  },
  timeattack: {
    label: 'Time Attack',
    desc: 'Hanya 30 detik! Setiap jawaban benar ×2 poin. Bonus +2 detik setiap 5 jawaban benar. Tanpa nyawa!',
    time: 30,
    lives: Infinity,
    scoreMultiplier: 2,
    hasCombo: false,
    hasTimer: true,
    hasLives: false,
    endOnMiss: false,
    itemCount: null,
  },
  endless: {
    label: 'Endless Mode',
    desc: 'Tanpa batas waktu, tanpa toleransi! Satu kesalahan = Game Over. Multiplier meningkat setiap 10 benar!',
    time: null,
    lives: 1,
    scoreMultiplier: 1,
    hasCombo: false,
    hasTimer: false,
    hasLives: true,
    endOnMiss: true,
    itemCount: null,
  },
  daily: {
    label: 'Daily Challenge',
    desc: 'Tantangan 20 item unik hari ini. Selesaikan semuanya untuk meraih badge spesial!',
    time: null,
    lives: Infinity,
    scoreMultiplier: 1,
    hasCombo: false,
    hasTimer: false,
    hasLives: false,
    endOnMiss: false,
    itemCount: 20,
  },
};

/* ─────────────────────────────────────────
   2. LOCAL STORAGE HELPERS
───────────────────────────────────────── */

const LS_KEY = 'ecosort_data';

function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return getDefaultData();
    return { ...getDefaultData(), ...JSON.parse(raw) };
  } catch {
    return getDefaultData();
  }
}

function saveData(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function getDefaultData() {
  return {
    theme: 'light',
    gamesPlayed: 0,
    totalScore: 0,
    totalCorrect: 0,
    totalWrong: 0,
    dailyComplete: false,
    dailyDate: '',
    bestScores: { classic: 0, timeattack: 0, endless: 0, daily: 0 },
    leaderboards: { classic: [], timeattack: [], endless: [] },
    badgesEarned: [],
    suggestions: [],
  };
}

/* ─────────────────────────────────────────
   3. THEME TOGGLE
───────────────────────────────────────── */

const html = document.documentElement;
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  if (themeIcon) {
    themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

function initTheme() {
  const data = loadData();
  applyTheme(data.theme);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const data = loadData();
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    data.theme = next;
    saveData(data);
  });
}

/* ─────────────────────────────────────────
   4. NAVBAR
───────────────────────────────────────── */

const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const navLinkItems = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
  updateActiveNavLink();
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('lock-scroll', isOpen);
  });
}

navLinkItems.forEach(link => {
  link.addEventListener('click', () => {
    if (navLinks) navLinks.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');
    document.body.classList.remove('lock-scroll');
  });
});

function updateActiveNavLink() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(sec => {
    const top = sec.getBoundingClientRect().top;
    if (top <= 100) current = sec.id;
  });
  navLinkItems.forEach(link => {
    const href = link.getAttribute('href')?.replace('#', '');
    link.classList.toggle('active', href === current);
  });
}

const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────
   5. SCROLL REVEAL
───────────────────────────────────────── */

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────
   6. HERO COUNTER ANIMATION
───────────────────────────────────────── */

function animateCounters() {
  const counters = document.querySelectorAll('.hstat-num[data-count]');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.count, 10);
    const duration = 1800;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current = Math.min(current + step, target);
      counter.textContent = Math.round(current);
      if (current < target) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

const heroSection = document.getElementById('beranda');
if (heroSection) {
  const heroObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      animateCounters();
      heroObserver.disconnect();
    }
  }, { threshold: 0.3 });
  heroObserver.observe(heroSection);
}

/* ─────────────────────────────────────────
   7. PARTICLE CANVAS (DISABLED)
───────────────────────────────────────── */

function initParticles() {
  // Particle canvas disabled - menggunakan background image statis
  return;
}

/* ─────────────────────────────────────────
   8. EDUCATION CARD MODALS
───────────────────────────────────────── */

function initModals() {
  const cards = document.querySelectorAll('.edu-card[data-modal]');
  const overlays = document.querySelectorAll('.modal-overlay');

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('open');
    document.body.classList.add('lock-scroll');
    overlay.querySelector('.modal-close')?.focus();
  }

  function closeModal(overlay) {
    overlay.classList.remove('open');
    document.body.classList.remove('lock-scroll');
  }

  cards.forEach(card => {
    const trigger = () => openModal(card.dataset.modal);
    card.addEventListener('click', trigger);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
    });
  });

  overlays.forEach(overlay => {
    overlay.querySelector('.modal-close')?.addEventListener('click', () => closeModal(overlay));
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      overlays.forEach(o => { if (o.classList.contains('open')) closeModal(o); });
    }
  });
}

/* ─────────────────────────────────────────
   9. TABLE SORT
───────────────────────────────────────── */

function initTableSort() {
  const sortBtns = document.querySelectorAll('.sort-btn');
  sortBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sortBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ─────────────────────────────────────────
   10. TIMELINE NAVIGATION
───────────────────────────────────────── */

function initTimeline() {
  const track = document.getElementById('timelineTrack');
  const prevBtn = document.getElementById('tlPrev');
  const nextBtn = document.getElementById('tlNext');
  const dotsContainer = document.getElementById('tlDots');
  if (!track) return;

  const items = track.querySelectorAll('.timeline-item');
  let currentIdx = 0;

  items.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'tl-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => scrollTo(i));
    if (dotsContainer) dotsContainer.appendChild(dot);
  });

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.querySelectorAll('.tl-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIdx);
    });
  }

  function scrollTo(idx) {
    if (idx < 0) idx = items.length - 1;
    if (idx >= items.length) idx = 0;
    currentIdx = idx;
    const item = items[idx];
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    updateDots();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => scrollTo(currentIdx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollTo(currentIdx + 1));

  let touchX = 0;
  track.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) scrollTo(diff > 0 ? currentIdx + 1 : currentIdx - 1);
  }, { passive: true });
}

/* ─────────────────────────────────────────
   11. AUDIO ENGINE
───────────────────────────────────────── */

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { }
  }
  return audioCtx;
}

function playTone(type) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'correct') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, now);
    osc.frequency.setValueAtTime(659, now + 0.1);
    osc.frequency.setValueAtTime(784, now + 0.2);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  } else if (type === 'wrong') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(150, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.5);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  } else if (type === 'win') {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, now + i * 0.12);
      g.gain.setValueAtTime(0.15, now + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      o.start(now + i * 0.12);
      o.stop(now + i * 0.12 + 0.3);
    });
  }
}

/* ─────────────────────────────────────────
   12. CONFETTI
───────────────────────────────────────── */

function launchConfetti() {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = ['#2E7D32', '#1565C0', '#F9A825', '#C62828', '#7B1FA2', '#00838F', '#E64A19'];
  const count = 80;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}vw;
      top: -20px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      width: ${Math.random() * 8 + 6}px;
      height: ${Math.random() * 8 + 6}px;
      --duration: ${Math.random() * 1.5 + 1.5}s;
      --delay: ${Math.random() * 0.8}s;
    `;
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 3000);
  }
}

/* ─────────────────────────────────────────
   13. TOAST NOTIFICATION
───────────────────────────────────────── */

let toastTimer = null;

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toastNotif');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ─────────────────────────────────────────
   14. GAME VARIABLES & UI
───────────────────────────────────────── */

let gameState = null;
let currentMode = 'classic';

const GameUI = {
  screenStart: document.getElementById('screenStart'),
  screenPlay: document.getElementById('screenPlay'),
  screenResult: document.getElementById('screenResult'),
  modeTitle: document.getElementById('modeTitle'),
  modeDesc: document.getElementById('modeDesc'),
  displayHS: document.getElementById('displayHS'),
  hudScore: document.getElementById('hudScore'),
  hudTime: document.getElementById('hudTime'),
  hudCombo: document.getElementById('hudCombo'),
  hudLives: document.getElementById('hudLives'),
  hudTimeWrap: document.getElementById('hudTimeWrap'),
  hudComboWrap: document.getElementById('hudComboWrap'),
  hudLivesWrap: document.getElementById('hudLivesWrap'),
  timerBar: document.getElementById('timerBar'),
  timerBarWrap: document.getElementById('timerBarWrap'),
  trashCard: document.getElementById('trashCard'),
  trashEmoji: document.getElementById('trashEmoji'),
  trashName: document.getElementById('trashName'),
  progressDots: document.getElementById('progressDots'),
  feedbackEl: document.getElementById('gameFeedback'),
  particlesEl: document.getElementById('particlesContainer'),
  resultTrophy: document.getElementById('resultTrophy'),
  resultTitle: document.getElementById('resultTitle'),
  resultScore: document.getElementById('resultScore'),
  resultCorrect: document.getElementById('resultCorrect'),
  resultWrong: document.getElementById('resultWrong'),
  resultAccuracy: document.getElementById('resultAccuracy'),
  resultBadge: document.getElementById('resultBadge'),
  resultHSWrap: document.getElementById('resultHSWrap'),
  btnStart: document.getElementById('btnStartGame'),
  btnPlayAgain: document.getElementById('btnPlayAgain'),
  btnBackMenu: document.getElementById('btnBackToMenu'),
};

function showScreen(name) {
  if (GameUI.screenStart) GameUI.screenStart.classList.toggle('active', name === 'start');
  if (GameUI.screenPlay) GameUI.screenPlay.classList.toggle('active', name === 'play');
  if (GameUI.screenResult) GameUI.screenResult.classList.toggle('active', name === 'result');
}

function updateModeUI() {
  const cfg = MODE_CONFIG[currentMode];
  const data = loadData();
  if (GameUI.modeTitle) GameUI.modeTitle.textContent = cfg.label;
  if (GameUI.modeDesc) GameUI.modeDesc.textContent = cfg.desc;
  if (GameUI.displayHS) GameUI.displayHS.textContent = data.bestScores[currentMode] ?? 0;
}

/* ─────────────────────────────────────────
   15. GAME MODE SELECTOR
───────────────────────────────────────── */

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    updateModeUI();
  });
});

/* ─────────────────────────────────────────
   16. GAME CORE FUNCTIONS
───────────────────────────────────────── */

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function clearGameTimers() {
  if (gameState?.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function updateHUD() {
  if (!gameState) return;
  if (GameUI.hudScore) GameUI.hudScore.textContent = gameState.score;
  if (GameUI.hudTime && gameState.cfg.hasTimer) GameUI.hudTime.textContent = gameState.timeLeft;
  if (GameUI.hudCombo && gameState.cfg.hasCombo) GameUI.hudCombo.textContent = `${gameState.combo}×`;
  if (GameUI.hudLives && gameState.cfg.hasLives && gameState.lives !== Infinity) {
    const hearts = '❤️'.repeat(Math.max(0, gameState.lives)) + '🖤'.repeat(Math.max(0, 3 - gameState.lives));
    GameUI.hudLives.textContent = hearts;
  }
}

function showFeedback(text, type) {
  if (!GameUI.feedbackEl) return;
  GameUI.feedbackEl.className = `game-feedback feedback-${type}`;
  GameUI.feedbackEl.textContent = text;
  GameUI.feedbackEl.style.animation = 'none';
  requestAnimationFrame(() => { if (GameUI.feedbackEl) GameUI.feedbackEl.style.animation = ''; });
}

function triggerShake() {
  if (!GameUI.trashCard) return;
  GameUI.trashCard.classList.remove('shake');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (GameUI.trashCard) GameUI.trashCard.classList.add('shake');
    });
  });
}

function spawnParticles(type) {
  const emojis = type === 'correct' ? ['⭐', '✨', '💚', '♻️', '🌿'] : ['💥'];
  const container = GameUI.particlesEl;
  if (!container) return;

  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const dx = (Math.random() - 0.5) * 200;
    const dy = -(Math.random() * 150 + 50);
    el.style.cssText = `left: ${30 + Math.random() * 40}%; top: 40%; --dx: ${dx}px; --dy: ${dy}px; animation-delay: ${Math.random() * 0.2}s;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

function showTrashItem() {
  if (!gameState) return;
  const item = gameState.queue[gameState.queueIdx];
  if (!item) { endGame('complete'); return; }

  if (GameUI.trashEmoji) GameUI.trashEmoji.textContent = item.emoji;
  if (GameUI.trashName) GameUI.trashName.textContent = item.name;

  if (GameUI.trashCard) {
    GameUI.trashCard.classList.remove('shake');
    GameUI.trashCard.style.animation = 'none';
    requestAnimationFrame(() => { if (GameUI.trashCard) GameUI.trashCard.style.animation = ''; });
  }
}

function updateProgressDot(correct) {
  if (currentMode !== 'daily') return;
  const dot = document.getElementById(`pd-${gameState.queueIdx}`);
  if (!dot) return;
  dot.classList.remove('current');
  dot.classList.add(correct ? 'correct' : 'wrong');
  const next = document.getElementById(`pd-${gameState.queueIdx + 1}`);
  if (next) next.classList.add('current');
}

function startTimer() {
  clearGameTimers();
  const cfg = gameState.cfg;
  const totalTime = cfg.time;

  if (GameUI.timerBar) {
    GameUI.timerBar.style.transition = 'none';
    GameUI.timerBar.style.width = '100%';
    requestAnimationFrame(() => {
      if (GameUI.timerBar) {
        GameUI.timerBar.style.transition = `width ${gameState.timeLeft}s linear`;
        GameUI.timerBar.style.width = '0%';
      }
    });
  }

  gameState.timerInterval = setInterval(() => {
    if (!gameState || !gameState.active) { clearGameTimers(); return; }
    gameState.timeLeft--;
    if (GameUI.hudTime) GameUI.hudTime.textContent = gameState.timeLeft;
    if (gameState.timeLeft <= 0) {
      clearGameTimers();
      endGame('timeout');
    }
  }, 1000);
}

function handleAnswer(chosen) {
  if (!gameState || !gameState.active) return;
  const item = gameState.queue[gameState.queueIdx];
  if (!item) return;

  const isCorrect = chosen === item.type;

  if (isCorrect) {
    const cfg = gameState.cfg;
    gameState.combo++;
    let bonus = 0;
    if (cfg.hasCombo && gameState.combo > 0 && gameState.combo % 3 === 0) bonus = 20;

    if (gameState.mode === 'endless') gameState.multiplier = 1 + Math.floor(gameState.correct / 10);

    if (gameState.mode === 'timeattack') {
      gameState.bonusAnswers++;
      if (gameState.bonusAnswers % 5 === 0) {
        gameState.timeLeft += 2;
        if (GameUI.hudTime) GameUI.hudTime.textContent = gameState.timeLeft;
        showFeedback('+2s ⏱️', 'correct');
      }
    }

    const points = (10 + bonus) * cfg.scoreMultiplier * gameState.multiplier;
    gameState.score += points;
    gameState.correct++;

    updateHUD();
    showFeedback(`+${points}${bonus ? ' COMBO!' : ''}`, 'correct');
    spawnParticles('correct');
    playTone('correct');
    updateProgressDot(true);

    gameState.queueIdx++;
    if (gameState.queue[gameState.queueIdx]) {
      setTimeout(showTrashItem, 200);
    } else {
      if (gameState.mode === 'daily') {
        endGame('complete');
      } else {
        gameState.queue.push(...shuffle([...TRASH_ITEMS]));
        setTimeout(showTrashItem, 200);
      }
    }
  } else {
    const cfg = gameState.cfg;
    if (cfg.endOnMiss) {
      playTone('gameover');
      endGame('fail');
      return;
    }

    gameState.combo = 0;
    gameState.score = Math.max(0, gameState.score - 5);
    gameState.wrong++;

    if (cfg.hasLives && gameState.lives !== Infinity) gameState.lives = Math.max(0, gameState.lives - 1);

    updateHUD();
    showFeedback('-5 ✗', 'wrong');
    triggerShake();
    playTone('wrong');
    updateProgressDot(false);

    if (cfg.hasLives && gameState.lives <= 0) {
      setTimeout(() => endGame('fail'), 500);
      return;
    }

    gameState.queueIdx++;
    if (gameState.queue[gameState.queueIdx]) {
      setTimeout(showTrashItem, 300);
    } else {
      if (gameState.mode === 'daily') {
        endGame('complete');
      } else {
        gameState.queue.push(...shuffle([...TRASH_ITEMS]));
        setTimeout(showTrashItem, 300);
      }
    }
  }
}

function endGame(reason) {
  if (!gameState || !gameState.active) return;
  gameState.active = false;
  clearGameTimers();

  const { score, correct, wrong, mode } = gameState;
  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const data = loadData();
  data.gamesPlayed++;
  data.totalScore += score;
  data.totalCorrect += correct;
  data.totalWrong += wrong;

  let isNewHS = false;
  if (score > data.bestScores[mode]) {
    data.bestScores[mode] = score;
    isNewHS = true;
  }

  if (mode !== 'daily' && data.leaderboards[mode] !== undefined) {
    data.leaderboards[mode].push(score);
    data.leaderboards[mode].sort((a, b) => b - a);
    data.leaderboards[mode] = data.leaderboards[mode].slice(0, 5);
  }

  if (mode === 'daily' && reason === 'complete') {
    data.dailyComplete = true;
    data.dailyDate = new Date().toDateString();
  }

  const newlyEarned = [];
  BADGES.forEach(badge => {
    if (!data.badgesEarned.includes(badge.id) && badge.condition(data)) {
      data.badgesEarned.push(badge.id);
      newlyEarned.push(badge);
      setTimeout(() => showToast(`🏅 Badge baru: ${badge.name}!`), 600);
    }
  });

  saveData(data);

  if (GameUI.resultScore) GameUI.resultScore.textContent = score;
  if (GameUI.resultCorrect) GameUI.resultCorrect.textContent = correct;
  if (GameUI.resultWrong) GameUI.resultWrong.textContent = wrong;
  if (GameUI.resultAccuracy) GameUI.resultAccuracy.textContent = accuracy + '%';

  let trophy = '🏆', title = 'Game Over!';
  if (reason === 'complete') { trophy = accuracy === 100 ? '🌟' : '🎉'; title = accuracy === 100 ? 'Sempurna!' : 'Selesai!'; }
  else if (reason === 'timeout') { trophy = score >= 100 ? '⭐' : '⏱️'; title = score >= 100 ? 'Luar Biasa!' : 'Waktu Habis!'; }
  else { trophy = '😔'; title = 'Nyawa Habis!'; }

  if (GameUI.resultTrophy) GameUI.resultTrophy.textContent = trophy;
  if (GameUI.resultTitle) GameUI.resultTitle.textContent = title;
  if (GameUI.resultBadge) GameUI.resultBadge.textContent = newlyEarned.map(b => b.emoji + ' ' + b.name).join('  ');

  if (isNewHS) {
    if (GameUI.resultHSWrap) GameUI.resultHSWrap.textContent = '🎊 New High Score! 🎊';
    launchConfetti();
    playTone('win');
  } else {
    if (GameUI.resultHSWrap) GameUI.resultHSWrap.textContent = `Rekor terbaik: ${data.bestScores[mode]}`;
    if (reason !== 'fail') playTone('win');
    else playTone('gameover');
  }

  showScreen('result');
  refreshStatsDashboard();
  refreshLeaderboards();
  refreshBadges();
}

function startGame() {
  const cfg = MODE_CONFIG[currentMode];

  let queue;
  if (currentMode === 'daily') {
    const today = new Date().toDateString();
    const seed = [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const shuffled = [...TRASH_ITEMS].sort(() => seed - 0.5);
    queue = shuffled.slice(0, cfg.itemCount);
  } else {
    queue = shuffle([...TRASH_ITEMS]);
  }

  gameState = {
    mode: currentMode,
    cfg,
    queue,
    queueIdx: 0,
    score: 0,
    lives: cfg.lives,
    timeLeft: cfg.time,
    combo: 0,
    correct: 0,
    wrong: 0,
    multiplier: 1,
    timerInterval: null,
    bonusAnswers: 0,
    active: true,
  };

  if (GameUI.timerBarWrap) GameUI.timerBarWrap.style.display = cfg.hasTimer ? 'block' : 'none';
  if (GameUI.hudTimeWrap) GameUI.hudTimeWrap.style.display = cfg.hasTimer ? 'flex' : 'none';
  if (GameUI.hudComboWrap) GameUI.hudComboWrap.style.display = cfg.hasCombo ? 'flex' : 'none';
  if (GameUI.hudLivesWrap) GameUI.hudLivesWrap.style.display = cfg.hasLives ? 'flex' : 'none';

  if (GameUI.progressDots) GameUI.progressDots.innerHTML = '';
  if (currentMode === 'daily' && GameUI.progressDots) {
    queue.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'prog-dot' + (i === 0 ? ' current' : '');
      dot.id = `pd-${i}`;
      GameUI.progressDots.appendChild(dot);
    });
  }

  updateHUD();
  showTrashItem();
  showScreen('play');
  if (cfg.hasTimer) startTimer();
}

/* ─────────────────────────────────────────
   17. CONTACT FORM
───────────────────────────────────────── */

function initContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const nameVal = document.getElementById('formName')?.value.trim() || '';
    const emailVal = document.getElementById('formEmail')?.value.trim() || '';
    const msgVal = document.getElementById('formMessage')?.value.trim() || '';

    let valid = true;

    if (!nameVal) {
      const err = document.getElementById('errName');
      if (err) { err.textContent = 'Nama tidak boleh kosong'; err.style.display = 'block'; }
      valid = false;
    } else {
      const err = document.getElementById('errName');
      if (err) { err.textContent = ''; err.style.display = 'none'; }
    }

    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      const err = document.getElementById('errEmail');
      if (err) { err.textContent = 'Masukkan email yang valid'; err.style.display = 'block'; }
      valid = false;
    } else {
      const err = document.getElementById('errEmail');
      if (err) { err.textContent = ''; err.style.display = 'none'; }
    }

    if (msgVal.length < 10) {
      const err = document.getElementById('errMessage');
      if (err) { err.textContent = 'Pesan minimal 10 karakter'; err.style.display = 'block'; }
      valid = false;
    } else {
      const err = document.getElementById('errMessage');
      if (err) { err.textContent = ''; err.style.display = 'none'; }
    }

    if (!valid) return;

    const data = loadData();
    data.suggestions.push({ name: nameVal, email: emailVal, msg: msgVal, date: new Date().toISOString() });
    saveData(data);

    if (success) {
      success.textContent = '✅ Pesan berhasil terkirim! Terima kasih atas masukanmu.';
      success.style.display = 'block';
    }
    form.reset();
    setTimeout(() => { if (success) success.style.display = 'none'; }, 5000);
    showToast('💬 Saran berhasil disimpan!');
  });
}

/* ─────────────────────────────────────────
   18. STATS DASHBOARD
───────────────────────────────────────── */

function refreshStatsDashboard() {
  const data = loadData();

  const statTotalScore = document.getElementById('statTotalScore');
  const statGamesPlayed = document.getElementById('statGamesPlayed');
  const statAccuracy = document.getElementById('statAccuracy');
  const statBadges = document.getElementById('statBadges');

  if (statTotalScore) statTotalScore.textContent = data.totalScore;
  if (statGamesPlayed) statGamesPlayed.textContent = data.gamesPlayed;

  const total = data.totalCorrect + data.totalWrong;
  const acc = total > 0 ? Math.round((data.totalCorrect / total) * 100) : 0;
  if (statAccuracy) statAccuracy.textContent = acc + '%';
  if (statBadges) statBadges.textContent = `${data.badgesEarned.length}/${BADGES.length}`;
}

function refreshLeaderboards() {
  const data = loadData();

  ['classic', 'timeattack', 'endless'].forEach(mode => {
    const listEl = document.getElementById(`lb${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (!listEl) return;

    const scores = data.leaderboards[mode] || [];
    if (!scores.length) {
      listEl.innerHTML = '<li class="lb-empty">Belum ada skor</li>';
      return;
    }

    const rankClass = ['gold', 'silver', 'bronze'];
    listEl.innerHTML = '';
    scores.slice(0, 5).forEach((score, i) => {
      const li = document.createElement('li');
      li.className = 'lb-entry';
      li.innerHTML = `<div class="lb-rank ${rankClass[i] || ''}">${i + 1}</div><span>Game #${i + 1}</span><span class="lb-score">${score}</span>`;
      listEl.appendChild(li);
    });
  });
}

function refreshBadges() {
  const grid = document.getElementById('badgesGrid');
  if (!grid) return;
  const data = loadData();
  grid.innerHTML = '';

  BADGES.forEach(badge => {
    const earned = data.badgesEarned.includes(badge.id);
    const el = document.createElement('div');
    el.className = 'badge-item' + (earned ? ' earned' : ' locked');
    el.innerHTML = `<span class="badge-emoji">${badge.emoji}</span><div class="badge-name">${badge.name}</div><div class="badge-req">${badge.req}</div>`;
    grid.appendChild(el);
  });
}

/* ─────────────────────────────────────────
   19. GAME BUTTON LISTENERS
───────────────────────────────────────── */

if (GameUI.btnStart) {
  GameUI.btnStart.addEventListener('click', startGame);
}
if (GameUI.btnPlayAgain) {
  GameUI.btnPlayAgain.addEventListener('click', startGame);
}
if (GameUI.btnBackMenu) {
  GameUI.btnBackMenu.addEventListener('click', () => {
    clearGameTimers();
    showScreen('start');
    updateModeUI();
  });
}

document.querySelectorAll('.basket-btn').forEach(btn => {
  btn.addEventListener('click', () => handleAnswer(btn.dataset.type));
});

document.addEventListener('keydown', e => {
  if (!gameState || !gameState.active) return;
  if (document.querySelector('.modal-overlay.open')) return;

  switch (e.key) {
    case '1': case 'q': case 'Q': handleAnswer('organik'); break;
    case '2': case 'w': case 'W': handleAnswer('anorganik'); break;
    case '3': case 'e': case 'E': handleAnswer('b3'); break;
  }
});

/* ─────────────────────────────────────────
   20. INIT ON DOM READY
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollReveal();
  initParticles();
  initModals();
  initTableSort();
  initTimeline();
  initContactForm();
  refreshStatsDashboard();
  refreshLeaderboards();
  refreshBadges();
  updateModeUI();
  showScreen('start');
});