(() => {
  const STORAGE_KEY = 'away-screen-state';

  const setupScreen = document.getElementById('setup-screen');
  const displayScreen = document.getElementById('display-screen');
  const form = document.getElementById('setup-form');
  const scheduleInput = document.getElementById('scheduleInput');
  const returnTimeInput = document.getElementById('returnTimeInput');
  const extraInput = document.getElementById('extraInput');
  const errorMsg = document.getElementById('errorMsg');
  const quickPicks = document.getElementById('quickPicks');

  const scheduleText = document.getElementById('scheduleText');
  const returnTimeText = document.getElementById('returnTimeText');
  const countdownLabel = document.getElementById('countdownLabel');
  const countdownText = document.getElementById('countdownText');
  const extraText = document.getElementById('extraText');

  const editBtn = document.getElementById('editBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const overlay = document.getElementById('transitionOverlay');

  let countdownTimer = null;
  let currentData = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatClock(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  // 자유 형식 시간 입력을 파싱: "14:30", "1430", "14.30", "14시 30분", "14시", "9" 등 지원
  function parseTimeInput(raw) {
    if (!raw) return null;
    let s = raw.trim();
    if (!s) return null;

    // 한글 표기 정규화: "14시 30분" -> "14:30", "14시" -> "14:"
    s = s.replace(/\s+/g, '');
    s = s.replace(/시/g, ':').replace(/분/g, '');
    s = s.replace(/[.]/g, ':');

    let h, m;

    if (s.includes(':')) {
      const parts = s.split(':');
      if (parts.length !== 2) return null;
      if (parts[0] === '' || !/^\d{1,2}$/.test(parts[0])) return null;
      const minutePart = parts[1] === '' ? '0' : parts[1];
      if (!/^\d{1,2}$/.test(minutePart)) return null;
      h = Number(parts[0]);
      m = Number(minutePart);
    } else if (/^\d+$/.test(s)) {
      if (s.length <= 2) {
        h = Number(s);
        m = 0;
      } else if (s.length === 3) {
        h = Number(s.slice(0, 1));
        m = Number(s.slice(1));
      } else if (s.length === 4) {
        h = Number(s.slice(0, 2));
        m = Number(s.slice(2));
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
      return null;
    }

    return { h, m };
  }

  // 오늘 기준 h:m 시점의 Date 객체 (이미 지난 시각이면 내일로 계산)
  function resolveReturnDate({ h, m }) {
    const target = new Date();
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  function startCountdown(targetTime) {
    clearInterval(countdownTimer);

    function tick() {
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        countdownLabel.textContent = '경과 시간';
        const overdue = Math.abs(diff);
        const h = Math.floor(overdue / 3600000);
        const m = Math.floor((overdue % 3600000) / 60000);
        const s = Math.floor((overdue % 60000) / 1000);
        countdownText.textContent = `+${pad(h)}:${pad(m)}:${pad(s)}`;
        return;
      }

      countdownLabel.textContent = '남은 시간';
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdownText.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function showDisplay(data) {
    scheduleText.textContent = data.schedule;
    returnTimeText.textContent = formatClock(new Date(data.targetTime));
    extraText.textContent = data.extra || '';

    setupScreen.classList.remove('active');
    displayScreen.classList.add('active');

    startCountdown(data.targetTime);
  }

  function playTransitionThen(callback) {
    overlay.classList.remove('playing');
    // 리플로우를 강제해 애니메이션 재시작이 가능하도록 함
    void overlay.offsetWidth;
    overlay.classList.add('playing');

    // 오버레이가 화면을 완전히 덮는 시점(55%)에 화면 전환
    setTimeout(callback, 620);

    overlay.addEventListener('animationend', () => {
      overlay.classList.remove('playing');
    }, { once: true });
  }

  function saveState(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function clearState() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.schedule || !data.targetTime) return null;
      return data;
    } catch {
      return null;
    }
  }

  quickPicks.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-btn');
    if (!btn) return;

    const minutes = Number(btn.dataset.minutes);
    const target = new Date(Date.now() + minutes * 60000);
    returnTimeInput.value = formatClock(target);

    quickPicks.querySelectorAll('.quick-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
  });

  returnTimeInput.addEventListener('input', () => {
    quickPicks.querySelectorAll('.quick-btn').forEach((b) => b.classList.remove('selected'));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const schedule = scheduleInput.value.trim();
    const extra = extraInput.value.trim();

    if (!schedule) {
      errorMsg.textContent = '일정을 입력해 주세요.';
      errorMsg.hidden = false;
      return;
    }

    const parsedTime = parseTimeInput(returnTimeInput.value);
    if (!parsedTime) {
      errorMsg.textContent = '돌아오는 시간을 확인해 주세요. (예: 14:30, 1430, 14시 30분)';
      errorMsg.hidden = false;
      return;
    }
    errorMsg.hidden = true;

    const targetDate = resolveReturnDate(parsedTime);
    const data = { schedule, extra, targetTime: targetDate.getTime() };
    currentData = data;
    saveState(data);

    playTransitionThen(() => showDisplay(data));
  });

  editBtn.addEventListener('click', () => {
    clearInterval(countdownTimer);
    clearState();

    if (currentData) {
      scheduleInput.value = currentData.schedule;
      returnTimeInput.value = formatClock(new Date(currentData.targetTime));
      extraInput.value = currentData.extra || '';
    }

    displayScreen.classList.remove('active');
    setupScreen.classList.add('active');
  });

  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && displayScreen.classList.contains('active')) {
      editBtn.click();
    }
  });

  // 새로고침 시 진행 중이던 안내를 복원
  const saved = loadState();
  if (saved) {
    currentData = saved;
    scheduleInput.value = saved.schedule;
    returnTimeInput.value = formatClock(new Date(saved.targetTime));
    extraInput.value = saved.extra || '';
    showDisplay(saved);
  }
})();
