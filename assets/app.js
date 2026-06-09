/* ============================================================
   PyNotes — Shared App Logic
   Author : Rohan Patil
   Repo   : github.com/RohanPatil01/pynotes
   Version: 3.0
   ============================================================ */

'use strict';

/* ── Topic registry ──────────────────────────────────────── */
const TOPICS = [
  { id:'python-basics',          title:'Python Basics',            file:'topics/python-basics.html' },
  { id:'data-types',             title:'Data Types & Variables',    file:'topics/data-types.html' },
  { id:'operators',              title:'Operators',                 file:'topics/operators.html' },
  { id:'conditionals',           title:'Conditional Statements',    file:'topics/conditionals.html' },
  { id:'loops-for',              title:'for Loop',                  file:'topics/loops-for.html' },
  { id:'loops-while',            title:'while Loop',                file:'topics/loops-while.html' },
  { id:'strings-basics',         title:'Strings Basics',            file:'topics/strings-basics.html' },
  { id:'strings-methods',        title:'String Methods',            file:'topics/strings-methods.html' },
  { id:'lists',                  title:'Lists',                     file:'topics/lists.html' },
  { id:'tuples',                 title:'Tuples',                    file:'topics/tuples.html' },
  { id:'dictionaries',           title:'Dictionaries',              file:'topics/dictionaries.html' },
  { id:'sets',                   title:'Sets',                      file:'topics/sets.html' },
  { id:'functions-basics',       title:'Functions Basics',          file:'topics/functions-basics.html' },
  { id:'functions-advanced',     title:'Functions Advanced',        file:'topics/functions-advanced.html' },
  { id:'modules-packages',       title:'Modules & Packages',        file:'topics/modules-packages.html' },
  { id:'file-handling-read',     title:'Reading Files',             file:'topics/file-handling-read.html' },
  { id:'file-handling-write',    title:'Writing Files',             file:'topics/file-handling-write.html' },
  { id:'exceptions-basics',      title:'Exception Handling Basics', file:'topics/exceptions-basics.html' },
  { id:'exceptions-advanced',    title:'Exception Handling Advanced',file:'topics/exceptions-advanced.html' },
  { id:'oop-classes',            title:'Classes & Objects',         file:'topics/oop-classes.html' },
  { id:'oop-inheritance',        title:'Inheritance',               file:'topics/oop-inheritance.html' },
  { id:'oop-advanced',           title:'Advanced OOP',              file:'topics/oop-advanced.html' },
  { id:'iterators-generators',   title:'Iterators & Generators',    file:'topics/iterators-generators.html' },
  { id:'decorators',             title:'Decorators',                file:'topics/decorators.html' },
  { id:'numpy-arrays',           title:'NumPy Arrays',              file:'topics/numpy-arrays.html' },
  { id:'numpy-operations',       title:'NumPy Operations',          file:'topics/numpy-operations.html' },
  { id:'pandas-series',          title:'Pandas Series',             file:'topics/pandas-series.html' },
  { id:'pandas-dataframe',       title:'Pandas DataFrame',          file:'topics/pandas-dataframe.html' },
  { id:'data-visualization',     title:'Data Visualization',        file:'topics/data-visualization.html' },
];
const TOTAL_TOPICS = TOPICS.length;

/* ── Storage keys ────────────────────────────────────────── */
const KEYS = {
  THEME:        'pynotes_theme',
  PROGRESS:     'pynotes_progress',
  BOOKMARKS:    'pynotes_bookmarks',
  STREAK:       'pynotes_streak',
  LAST_TOPIC:   'pynotes_last_topic',
  QUIZ_SCORES:  'pynotes_quiz_scores',
  SIDEBAR_OPEN: 'pynotes_sidebar_open',
};

/* ── Storage helpers ─────────────────────────────────────── */
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
};

/* ═══════════════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════════════ */
const Theme = {
  init() {
    const saved = Store.get(KEYS.THEME, 'dark');
    this._apply(saved);
  },
  _apply(mode) {
    document.body.classList.toggle('light', mode === 'light');
    Store.set(KEYS.THEME, mode);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.classList.toggle('on', mode === 'light');
  },
  toggle() {
    const isLight = document.body.classList.contains('light');
    this._apply(isLight ? 'dark' : 'light');
  },
};

/* ═══════════════════════════════════════════════════════════
   PROGRESS
═══════════════════════════════════════════════════════════ */
const Progress = {
  getAll()        { return Store.get(KEYS.PROGRESS, {}); },
  isCompleted(id) { return !!this.getAll()[id]; },
  getCount()      { return Object.keys(this.getAll()).length; },
  getPercent()    { return Math.round((this.getCount() / TOTAL_TOPICS) * 100); },

  markComplete(id) {
    const p = this.getAll();
    p[id] = { completedAt: Date.now() };
    Store.set(KEYS.PROGRESS, p);
    Store.set(KEYS.LAST_TOPIC, id);
    this.updateUI();
    Streak.recordActivity();
    showToast('Topic completed! Keep going.', '🎉');
    launchConfetti();
  },

  markIncomplete(id) {
    const p = this.getAll();
    delete p[id];
    Store.set(KEYS.PROGRESS, p);
    this.updateUI();
  },

  updateUI() {
    const count   = this.getCount();
    const percent = this.getPercent();
    document.querySelectorAll('.progress-fill').forEach(el => el.style.width = percent + '%');
    document.querySelectorAll('[data-progress-count]').forEach(el => el.textContent = `${count}/${TOTAL_TOPICS} topics`);
    document.querySelectorAll('[data-progress-percent]').forEach(el => el.textContent = percent + '%');
    document.querySelectorAll('[data-completed-count]').forEach(el => el.textContent = count);
  },
};

/* ═══════════════════════════════════════════════════════════
   BOOKMARKS
═══════════════════════════════════════════════════════════ */
const Bookmarks = {
  getAll()         { return Store.get(KEYS.BOOKMARKS, []); },
  isBookmarked(id) { return this.getAll().includes(id); },

  toggle(id) {
    let bm = this.getAll();
    const wasBookmarked = bm.includes(id);
    bm = wasBookmarked ? bm.filter(x => x !== id) : [...bm, id];
    Store.set(KEYS.BOOKMARKS, bm);
    this._updateBtn(id);
    showToast(wasBookmarked ? 'Bookmark removed.' : 'Topic bookmarked!', wasBookmarked ? '🗑️' : '🔖');
  },

  _updateBtn(id) {
    const btn = document.querySelector(`[data-bookmark="${id}"]`);
    if (!btn) return;
    const active = this.isBookmarked(id);
    btn.classList.toggle('active', active);
    btn.textContent = active ? '🔖 Bookmarked' : '🔖 Bookmark';
    btn.title = active ? 'Remove bookmark' : 'Bookmark this topic';
  },

  initBtn(id) {
    this._updateBtn(id);
    const btn = document.querySelector(`[data-bookmark="${id}"]`);
    if (btn) btn.addEventListener('click', () => this.toggle(id));
  },
};

/* ═══════════════════════════════════════════════════════════
   QUIZ SCORES
═══════════════════════════════════════════════════════════ */
const QuizScores = {
  getAll()  { return Store.get(KEYS.QUIZ_SCORES, {}); },
  save(id, score, total) {
    const s = this.getAll();
    s[id] = { score, total, savedAt: Date.now() };
    Store.set(KEYS.QUIZ_SCORES, s);
  },
  get(id)   { return this.getAll()[id] || null; },
  getAverage() {
    const all = Object.values(this.getAll());
    if (!all.length) return 0;
    return Math.round(all.reduce((a, s) => a + Math.round((s.score / s.total) * 100), 0) / all.length);
  },
};

/* ═══════════════════════════════════════════════════════════
   STREAK
═══════════════════════════════════════════════════════════ */
const Streak = {
  getData() { return Store.get(KEYS.STREAK, { count:0, lastDate:null, history:[] }); },

  recordActivity() {
    const data  = this.getData();
    const today = new Date().toDateString();
    if (data.lastDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    data.count = data.lastDate === yesterday ? data.count + 1 : 1;
    data.lastDate = today;
    if (!data.history.includes(today)) data.history.push(today);
    if (data.history.length > 30) data.history = data.history.slice(-30);
    Store.set(KEYS.STREAK, data);
    this.updateUI();
  },

  getCount() { return this.getData().count; },

  updateUI() {
    document.querySelectorAll('[data-streak]').forEach(el => el.textContent = this.getCount());
    this._renderDots();
  },

  _renderDots() {
    const container = document.getElementById('streakDots');
    if (!container) return;
    const history = this.getData().history || [];
    const days    = ['S','M','T','W','T','F','S'];
    const today   = new Date();
    container.innerHTML = '';
    for (let i = 6; i >= 0; i--) {
      const d  = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toDateString();
      const el = document.createElement('div');
      el.className = 'streak-dot' + (history.includes(ds) ? ' done' : '') + (i === 0 ? ' today' : '');
      el.title = ds;
      el.textContent = days[d.getDay()];
      container.appendChild(el);
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════ */
const Sidebar = {
  toggle() {
    const sb      = document.querySelector('.sidebar');
    const main    = document.querySelector('.main');
    const overlay = document.querySelector('.sidebar-overlay');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      sb.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    } else {
      sb.classList.toggle('collapsed');
      if (main) main.classList.toggle('expanded');
    }
  },

  initGroups() {
    const openGroups = Store.get(KEYS.SIDEBAR_OPEN, []);

    document.querySelectorAll('.nav-group').forEach(group => {
      const groupId = group.dataset.group;
      const header  = group.querySelector('.nav-group-header');
      const sub     = group.querySelector('.nav-sub');
      if (!header || !sub) return;

      if (openGroups.includes(groupId)) group.classList.add('open');

      header.addEventListener('click', () => {
        group.classList.toggle('open');
        const current = Store.get(KEYS.SIDEBAR_OPEN, []);
        const updated = group.classList.contains('open')
          ? [...new Set([...current, groupId])]
          : current.filter(id => id !== groupId);
        Store.set(KEYS.SIDEBAR_OPEN, updated);
      });
    });

    // Auto-open group containing active sub-item
    document.querySelectorAll('.nav-sub-item.active').forEach(item => {
      const group = item.closest('.nav-group');
      if (group && !group.classList.contains('open')) {
        group.classList.add('open');
      }
    });
  },

  closeOnOverlay() {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },
};

/* ═══════════════════════════════════════════════════════════
   LAST VISITED BANNER
═══════════════════════════════════════════════════════════ */
const LastVisit = {
  init() {
    const banner = document.getElementById('lastVisitBanner');
    if (!banner) return;
    const lastId = Store.get(KEYS.LAST_TOPIC);
    if (!lastId) { banner.style.display = 'none'; return; }
    const topic = TOPICS.find(t => t.id === lastId);
    if (!topic) { banner.style.display = 'none'; return; }
    const nameEl = document.getElementById('lastVisitName');
    const linkEl = document.getElementById('lastVisitLink');
    if (nameEl) nameEl.textContent = topic.title;
    if (linkEl) linkEl.href = topic.file;
    banner.style.display = 'flex';
  },
};

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════════════════════════ */
function showToast(message, icon = '✅') {
  let toast = document.getElementById('pyToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pyToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

/* ═══════════════════════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════════════════════ */
function launchConfetti() {
  if (typeof confetti === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js';
    s.onload = () => _fire();
    document.head.appendChild(s);
  } else {
    _fire();
  }
}
function _fire() {
  confetti({ particleCount:100, spread:70, origin:{ y:0.6 }, colors:['#4f7fff','#34d399','#fbbf24','#f472b6'] });
}

/* ═══════════════════════════════════════════════════════════
   COPY CODE BUTTONS
═══════════════════════════════════════════════════════════ */
function initCopyButtons() {
  document.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block')?.querySelector('pre');
      if (!pre) return;
      navigator.clipboard.writeText(pre.innerText || pre.textContent).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   MCQ ENGINE (Submit-first flow)
   Students select all answers, then click Submit.
   Results revealed all at once.
═══════════════════════════════════════════════════════════ */
function initMCQ(topicId) {
  const questions  = document.querySelectorAll('.mcq-question');
  const submitBtn  = document.getElementById('mcqSubmitBtn');
  const warning    = document.getElementById('mcqWarning');
  const dashboard  = document.getElementById('mcqResultDashboard');
  const total      = questions.length;
  if (!submitBtn) return;

  // Track selections per question index
  const selections = {};

  questions.forEach((qBlock, qi) => {
    qBlock.querySelectorAll('.mcq-option').forEach(opt => {
      opt.addEventListener('click', () => {
        if (qBlock.dataset.locked) return;
        qBlock.querySelectorAll('.mcq-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selections[qi] = opt;
        // Remove unanswered highlight when student selects an answer
        qBlock.classList.remove('mcq-unanswered');
        if (warning) warning.style.display = 'none';
      });
    });
  });

  submitBtn.addEventListener('click', () => {
    // Find first unanswered question
    const answeredCount = Object.keys(selections).length;
    if (answeredCount < total) {
      let firstUnanswered = null;
      questions.forEach((qBlock, qi) => {
        qBlock.classList.remove('mcq-unanswered');
        if (!selections[qi]) {
          qBlock.classList.add('mcq-unanswered');
          if (!firstUnanswered) firstUnanswered = qBlock;
        }
      });
      if (firstUnanswered) {
        firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (warning) {
        warning.style.display = 'block';
        warning.textContent = `${total - answeredCount} question${total - answeredCount > 1 ? 's' : ''} still unanswered. Please answer all questions before submitting.`;
      }
      return;
    }

    // Reveal results and collect metadata
    let score = 0;
    const missedConcepts = [];

    questions.forEach((qBlock, qi) => {
      qBlock.dataset.locked = '1';
      qBlock.classList.remove('mcq-unanswered');

      const selected   = selections[qi];
      const isCorrect  = selected?.dataset.correct === 'true';
      const concept    = qBlock.dataset.concept  || null;
      const explanation= qBlock.dataset.explanation || null;

      if (isCorrect) {
        selected.classList.add('correct');
        score++;
      } else {
        if (selected) selected.classList.add('wrong');
        qBlock.querySelectorAll('[data-correct="true"]').forEach(o => o.classList.add('reveal-correct'));
        // Collect missed concept for revision list (deduplicated)
        if (concept && !missedConcepts.includes(concept)) {
          missedConcepts.push(concept);
        }
      }

      qBlock.querySelectorAll('.mcq-option').forEach(o => o.classList.add('disabled'));

      // Inject explanation
      if (explanation) {
        const expEl = document.createElement('div');
        expEl.className = 'mcq-explanation';
        expEl.innerHTML = `<span class="mcq-explanation-icon">💡</span><span>${explanation}</span>`;
        qBlock.appendChild(expEl);
      }
    });

    // Disable submit button
    submitBtn.textContent = 'Submitted';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '.6';

    // Save score to localStorage
    if (topicId) QuizScores.save(topicId, score, total);

    // Build result dashboard
    if (dashboard) {
      const pct     = Math.round((score / total) * 100);
      const wrong   = total - score;
      const isPpass = pct >= 60;

      const message = pct === 100
        ? 'Excellent! You answered every question correctly. You have a strong grasp of this topic.'
        : pct >= 80
        ? 'Great work. You understand the core concepts well. Review the explanations for the questions you missed.'
        : pct >= 60
        ? 'Good effort. You passed, but a few concepts need revision. Check the explanations above and revisit the Notes tab.'
        : pct >= 40
        ? 'You are getting there. Several concepts need more attention. Go through the Notes tab once more before retrying.'
        : 'This topic needs more study time. Read through the Notes and Examples tabs carefully, then come back to the quiz.';

      const revisionHTML = missedConcepts.length
        ? `<div class="mcq-result-revision">
            <div class="mcq-result-revision-title">Recommended Revision</div>
            <div class="mcq-revision-tags">
              ${missedConcepts.map(c =>
                `<span class="mcq-revision-tag">${c.replace(/-/g, ' ')}</span>`
              ).join('')}
            </div>
          </div>`
        : '';

      dashboard.innerHTML = `
        <div class="mcq-result-header">Quiz Results</div>
        <div class="mcq-result-grid">
          <div class="mcq-result-stat">
            <div class="mcq-result-stat-num" style="color:var(--accent)">${pct}%</div>
            <div class="mcq-result-stat-label">Score</div>
          </div>
          <div class="mcq-result-stat">
            <div class="mcq-result-stat-num" style="color:var(--green)">${score}</div>
            <div class="mcq-result-stat-label">Correct</div>
          </div>
          <div class="mcq-result-stat">
            <div class="mcq-result-stat-num" style="color:var(--red)">${wrong}</div>
            <div class="mcq-result-stat-label">Incorrect</div>
          </div>
          <div class="mcq-result-stat">
            <div class="mcq-result-stat-num" style="color:${isPpass ? 'var(--green)' : 'var(--red)'}">${isPpass ? 'Pass' : 'Fail'}</div>
            <div class="mcq-result-stat-label">Status</div>
          </div>
        </div>
        <div class="mcq-result-message">${message}</div>
        ${revisionHTML}
      `;
      dashboard.style.display = 'block';
      setTimeout(() => dashboard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }

    // Toast
    const pct = Math.round((score / total) * 100);
    if (pct === 100) showToast('Perfect score! Excellent work.', '🏆');
    else if (pct >= 75) showToast(`Good job! ${score}/${total} correct.`, '👏');
    else showToast(`${score}/${total} correct. Check the explanations above.`, '📖');
  });
}

/* ═══════════════════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════════════════ */
function initTabs() {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  if (!tabBtns.length) return;

  const count = Math.min(tabBtns.length, tabPanels.length);
  let currentIdx = 0;

  // Set initial state: only first panel visible
  tabPanels.forEach((p, i) => {
    p.style.display = i === 0 ? 'block' : 'none';
    p.classList.toggle('active', i === 0);
  });

  function switchTab(idx) {
    if (idx < 0 || idx >= count) return;
    currentIdx = idx;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
    tabBtns[idx].classList.add('active');
    if (tabPanels[idx]) {
      tabPanels[idx].classList.add('active');
      tabPanels[idx].style.display = 'block';
    }
    updateArrows();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => switchTab(i));
  });

  // Inject arrow buttons around the tabs-wrap
  const tabsWrap = document.querySelector('.tabs-wrap');
  if (!tabsWrap) return;

  const tabsNav = document.createElement('div');
  tabsNav.className = 'tabs-nav';
  tabsWrap.parentNode.insertBefore(tabsNav, tabsWrap);
  tabsNav.appendChild(tabsWrap);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'tab-arrow';
  prevBtn.innerHTML = '&#8249;';
  prevBtn.setAttribute('aria-label', 'Previous tab');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'tab-arrow';
  nextBtn.innerHTML = '&#8250;';
  nextBtn.setAttribute('aria-label', 'Next tab');

  tabsNav.insertBefore(prevBtn, tabsWrap);
  tabsNav.appendChild(nextBtn);

  prevBtn.addEventListener('click', () => switchTab(currentIdx - 1));
  nextBtn.addEventListener('click', () => switchTab(currentIdx + 1));

  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft')  switchTab(currentIdx - 1);
    if (e.key === 'ArrowRight') switchTab(currentIdx + 1);
  });

  function updateArrows() {
    prevBtn.disabled = currentIdx === 0;
    nextBtn.disabled = currentIdx === count - 1;
  }

  updateArrows();
}

/* ═══════════════════════════════════════════════════════════
   SEARCH (home page topic cards)
═══════════════════════════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('[data-searchable]').forEach(el => {
      el.style.display = (!q || el.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   COMPLETE BUTTON
═══════════════════════════════════════════════════════════ */
function initCompleteBtn(topicId) {
  document.querySelectorAll('.complete-btn').forEach(btn => {
    const refresh = () => {
      const done = Progress.isCompleted(topicId);
      btn.textContent   = done ? 'Completed' : 'Mark as Complete';
      btn.style.background   = done ? 'var(--green)' : '';
      btn.style.borderColor  = done ? 'var(--green)' : '';
      btn.classList.toggle('btn-primary', !done);
    };
    refresh();
    btn.addEventListener('click', () => {
      if (Progress.isCompleted(topicId)) Progress.markIncomplete(topicId);
      else Progress.markComplete(topicId);
      refresh();
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════════ */
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    switch(e.key) {
      case '/':
        e.preventDefault();
        document.getElementById('globalSearch')?.focus();
        break;
      case 'n': case 'N':
        document.getElementById('nextTopicBtn')?.click();
        break;
      case 'p': case 'P':
        document.getElementById('prevTopicBtn')?.click();
        break;
      case 'b': case 'B':
        document.querySelector('[data-bookmark]')?.click();
        break;
      case 'd': case 'D':
        Theme.toggle();
        break;
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR DOT SYNC (topic pages)
═══════════════════════════════════════════════════════════ */
function syncSidebarDots() {
  const progress = Progress.getAll();
  document.querySelectorAll('[id^="dot-"]').forEach(dot => {
    const id = dot.id.replace('dot-', '');
    if (progress[id]) dot.classList.add('done');
  });
}

/* ═══════════════════════════════════════════════════════════
   INTERVIEW ACCORDION
   All collapsed by default. One open at a time.
═══════════════════════════════════════════════════════════ */
function initInterviewAccordion() {
  const accordions = document.querySelectorAll('.interview-accordion');
  if (!accordions.length) return;

  accordions.forEach(acc => {
    const header = acc.querySelector('.interview-acc-header');
    if (!header) return;
    header.addEventListener('click', () => {
      const isOpen = acc.classList.contains('open');
      // Close all
      accordions.forEach(a => a.classList.remove('open'));
      // Open clicked one only if it was closed
      if (!isOpen) acc.classList.add('open');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   MISTAKE ACCORDION
   Each mistake card collapses/expands independently.
═══════════════════════════════════════════════════════════ */
function initMistakeAccordion() {
  const accordions = document.querySelectorAll('.mistake-accordion');
  if (!accordions.length) return;
  accordions.forEach(acc => {
    const header = acc.querySelector('.mistake-acc-header');
    if (!header) return;
    header.addEventListener('click', () => {
      acc.classList.toggle('open');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   HINT TOGGLE (practice tasks)
═══════════════════════════════════════════════════════════ */
function toggleHint(btn) {
  const card    = btn.closest('.practice-card');
  const hint    = card ? card.querySelector('.practice-hint') : btn.nextElementSibling;
  const visible = hint.style.display === 'block';
  hint.style.display = visible ? 'none' : 'block';
  btn.textContent    = visible ? 'Show Hint' : 'Hide Hint';
}

function markPracticeDone(btn) {
  const card = btn.closest('.practice-card');
  if (!card) return;
  card.classList.toggle('done');
  const id = card.dataset.practiceId;
  if (id) {
    if (card.classList.contains('done')) localStorage.setItem(id, 'done');
    else localStorage.removeItem(id);
  }
  // trigger any per-page progress update
  const event = new CustomEvent('practiceDoneChanged', { bubbles: true });
  card.dispatchEvent(event);
}

/* ═══════════════════════════════════════════════════════════
   PERSONAL NOTES
═══════════════════════════════════════════════════════════ */
function initPersonalNotes(topicId) {
  const area = document.getElementById('personalNotes');
  if (!area) return;
  const key = 'pynotes_notes_' + topicId;
  area.value = Store.get(key, '');
  let timer;
  area.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      Store.set(key, area.value);
      showToast('Notes saved!', '💾');
    }, 800);
  });
}

/* ═══════════════════════════════════════════════════════════
   DIFFICULTY RATING
═══════════════════════════════════════════════════════════ */
function initDifficultyRating(topicId) {
  const key = 'pynotes_difficulty_' + topicId;
  const saved = Store.get(key);
  const btns = document.querySelectorAll('.diff-btn');
  if (!btns.length) return;
  if (saved) btns.forEach(b => b.classList.toggle('active', b.dataset.diff === saved));
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      Store.set(key, btn.dataset.diff);
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast('Difficulty saved!', '📊');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   COMING SOON LINK HANDLER
═══════════════════════════════════════════════════════════ */
function initComingSoonLinks() {
  const EXISTING = new Set(['python-basics.html', 'data-types.html', 'operators.html', 'conditionals.html', 'coming-soon.html', 'index.html', '404.html']);
  const inTopics = window.location.pathname.includes('/topics/');
  const target   = inTopics ? 'coming-soon.html' : 'topics/coming-soon.html';

  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
    const file = href.split('/').pop();
    if (file.endsWith('.html') && !EXISTING.has(file) && file !== '') {
      a.setAttribute('href', target);
      a.setAttribute('title', 'Coming soon!');
      a.classList.add('coming-soon-link');
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   INIT (runs on every page)
═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  Progress.updateUI();
  Streak.updateUI();
  LastVisit.init();
  Sidebar.initGroups();
  Sidebar.closeOnOverlay();
  syncSidebarDots();
  initCopyButtons();
  initSearch();
  initTabs();
  initKeyboardShortcuts();

  document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());
  document.getElementById('sidebarToggle')?.addEventListener('click', () => Sidebar.toggle());
  initInterviewAccordion();
  initMistakeAccordion();
  initComingSoonLinks();
});
