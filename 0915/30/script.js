// ===== 구슬 대포 추첨기 =====
// 이름마다 구슬(공)을 하나씩 대포로 발사 → 장애물(페그/회전 바) 통과
// → 가장 마지막에 멈춘 구슬이 당첨자.

(() => {
  const { Engine, Bodies, Composite, Body, Common } = Matter;

  // ---------- 상태 ----------
  let names = []; // { id, name, color }
  let nextId = 1;

  // ---------- DOM ----------
  const nameInput = document.getElementById("name-input");
  const addBtn = document.getElementById("add-btn");
  const clearBtn = document.getElementById("clear-btn");
  const startBtn = document.getElementById("start-btn");
  const nameListEl = document.getElementById("name-list");
  const nameCountEl = document.getElementById("name-count");

  const setupStage = document.getElementById("setup-stage");
  const runningStage = document.getElementById("running-stage");
  const statusText = document.getElementById("status-text");
  const orderList = document.getElementById("order-list");
  const replayBtn = document.getElementById("replay-btn");
  const resetBtn = document.getElementById("reset-btn");

  const winnerBanner = document.getElementById("winner-banner");
  const winnerNameEl = document.getElementById("winner-name");

  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  // ---------- 색상 팔레트 ----------
  function colorForIndex(i) {
    const hue = (i * 47) % 360; // 겹치지 않도록 분산
    return `hsl(${hue} 75% 60%)`;
  }

  // ---------- 이름 입력 UI ----------
  function renderNameList() {
    nameListEl.innerHTML = "";
    names.forEach((p, idx) => {
      const li = document.createElement("li");
      li.className = "name-chip";
      li.innerHTML = `
        <span class="chip-dot" style="background:${p.color}"></span>
        <span>${escapeHtml(p.name)}</span>
        <button class="chip-remove" data-id="${p.id}" aria-label="삭제">✕</button>
      `;
      nameListEl.appendChild(li);
    });
    nameCountEl.textContent = `총 ${names.length}명`;
    startBtn.disabled = names.length < 2;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function addNames(raw) {
    const parts = raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    parts.forEach((n) => {
      names.push({ id: nextId, name: n, color: colorForIndex(names.length) });
      nextId++;
    });
    renderNameList();
  }

  addBtn.addEventListener("click", () => {
    if (nameInput.value.trim()) {
      addNames(nameInput.value);
      nameInput.value = "";
      nameInput.focus();
    }
  });

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && nameInput.value.trim()) {
      addNames(nameInput.value);
      nameInput.value = "";
    }
  });

  nameListEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip-remove");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    names = names.filter((p) => p.id !== id);
    renderNameList();
  });

  clearBtn.addEventListener("click", () => {
    names = [];
    renderNameList();
  });

  startBtn.addEventListener("click", () => {
    if (names.length < 2) return;
    setupStage.classList.add("hidden");
    runningStage.classList.remove("hidden");
    replayBtn.disabled = true;
    resetBtn.disabled = true;
    startDraw(names);
  });

  replayBtn.addEventListener("click", () => {
    if (replayBtn.disabled) return;
    replayBtn.disabled = true;
    resetBtn.disabled = true;
    startDraw(names);
  });

  resetBtn.addEventListener("click", () => {
    if (resetBtn.disabled) return;
    runningStage.classList.add("hidden");
    setupStage.classList.remove("hidden");
    winnerBanner.classList.add("hidden");
    orderList.innerHTML = "";
    statusText.textContent = "";
  });

  // ================= 물리 시뮬레이션 =================

  let engine, world;
  let obstacles = []; // { body, kind, spin }
  let cannonAngle = 0;
  let flashTimer = 0;
  let balls = []; // { id, name, color, body, fired, settled, restFrames, settleOrder }
  let fireQueue = [];
  let fireTimer = null;
  let animHandle = null;
  let settledCount = 0;
  let winnerDeclared = false;
  let safetyTimeoutStart = null;

  const CANNON_X = W / 2;
  const CANNON_Y = 70;
  const BALL_RADIUS = 11;
  const SETTLE_SPEED = 0.12;
  const SETTLE_FRAMES = 45; // ~0.75s @60fps
  const FIRE_INTERVAL_MS = 380;
  const SAFETY_TIMEOUT_MS = 12000; // 마지막 발사 후 이 시간이 지나면 강제 정산

  function buildWorld() {
    engine = Engine.create();
    engine.gravity.y = 1.05;
    world = engine.world;
    obstacles = [];

    const wallOpts = { isStatic: true, render: {}, friction: 0.1, restitution: 0.3 };
    const walls = [
      Bodies.rectangle(W / 2, H + 20, W, 40, wallOpts), // floor
      Bodies.rectangle(-14, H / 2, 28, H, wallOpts), // left
      Bodies.rectangle(W + 14, H / 2, 28, H, wallOpts), // right
    ];
    Composite.add(world, walls);

    // 페그(장애물 핀) - 지그재그 배열
    const pegRows = 10;
    const topY = 170;
    const bottomY = 620;
    const rowGap = (bottomY - topY) / (pegRows - 1);
    const cols = 10;
    const marginX = 55;
    const colGap = (W - marginX * 2) / (cols - 1);

    for (let r = 0; r < pegRows; r++) {
      const y = topY + r * rowGap;
      const offset = r % 2 === 0 ? 0 : colGap / 2;
      const colCount = r % 2 === 0 ? cols : cols - 1;
      for (let c = 0; c < colCount; c++) {
        const x = marginX + offset + c * colGap;
        if (x < 10 || x > W - 10) continue;
        const peg = Bodies.circle(x, y, 7, {
          isStatic: true,
          restitution: 0.55,
          friction: 0.05,
        });
        obstacles.push({ body: peg, kind: "peg" });
        Composite.add(world, peg);
      }
    }

    // 회전하는 바 장애물 (여러 장애물 느낌 추가)
    const spinBars = [
      { x: W * 0.28, y: 300, w: 110, h: 14, spin: 0.018 },
      { x: W * 0.72, y: 300, w: 110, h: 14, spin: -0.018 },
      { x: W * 0.5, y: 430, w: 150, h: 14, spin: 0.014 },
      { x: W * 0.24, y: 550, w: 100, h: 14, spin: -0.02 },
      { x: W * 0.76, y: 550, w: 100, h: 14, spin: 0.02 },
    ];
    spinBars.forEach((cfg) => {
      const bar = Bodies.rectangle(cfg.x, cfg.y, cfg.w, cfg.h, {
        isStatic: true,
        restitution: 0.6,
        friction: 0.02,
      });
      obstacles.push({ body: bar, kind: "bar", spin: cfg.spin, w: cfg.w, h: cfg.h });
      Composite.add(world, bar);
    });

    // 고정 경사 디플렉터 (좌우로 튕겨내는 판)
    const deflectors = [
      { x: 130, y: 220, w: 130, h: 12, angle: 0.35 },
      { x: W - 130, y: 220, w: 130, h: 12, angle: -0.35 },
    ];
    deflectors.forEach((cfg) => {
      const d = Bodies.rectangle(cfg.x, cfg.y, cfg.w, cfg.h, {
        isStatic: true,
        angle: cfg.angle,
        restitution: 0.5,
        friction: 0.05,
      });
      obstacles.push({ body: d, kind: "deflector", w: cfg.w, h: cfg.h });
      Composite.add(world, d);
    });
  }

  function startDraw(participants) {
    winnerDeclared = false;
    settledCount = 0;
    safetyTimeoutStart = null;
    winnerBallCache = null;
    winnerBanner.classList.add("hidden");
    orderList.innerHTML = "";
    statusText.textContent = "🔥 대포 발사 준비 중...";

    if (animHandle) cancelAnimationFrame(animHandle);
    if (fireTimer) clearTimeout(fireTimer);

    buildWorld();

    // shuffle 발사 순서(재미 요소) - 명단 표시 순서는 유지, 발사 순서만 섞음
    const shuffled = [...participants];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    balls = participants.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      body: null,
      fired: false,
      settled: false,
      restFrames: 0,
      settleOrder: null,
    }));

    fireQueue = shuffled.map((p) => p.id);
    fireNext();
    loop();
  }

  function fireNext() {
    if (fireQueue.length === 0) {
      statusText.textContent = "모든 구슬 발사 완료! 착지를 기다리는 중...";
      return;
    }
    const id = fireQueue.shift();
    const entry = balls.find((b) => b.id === id);
    const remaining = fireQueue.length;
    const totalFired = balls.length - remaining;
    statusText.textContent = `💥 ${totalFired}/${balls.length}번째 구슬 발사! (${entry.name})`;

    // 대포 각도 랜덤 + 발사
    cannonAngle = Common.random(-0.35, 0.35);
    flashTimer = 8;

    const body = Bodies.circle(CANNON_X, CANNON_Y, BALL_RADIUS, {
      restitution: 0.5,
      friction: 0.06,
      frictionAir: 0.0022,
      density: 0.0018,
    });
    const speed = Common.random(6, 8.5);
    Body.setVelocity(body, {
      x: Math.sin(cannonAngle) * speed,
      y: Math.cos(cannonAngle) * speed,
    });
    Body.setAngularVelocity(body, Common.random(-0.2, 0.2));
    entry.body = body;
    entry.fired = true;
    Composite.add(world, body);

    if (fireQueue.length > 0) {
      fireTimer = setTimeout(fireNext, FIRE_INTERVAL_MS);
    } else {
      fireTimer = setTimeout(() => {
        statusText.textContent = "모든 구슬 발사 완료! 착지를 기다리는 중...";
      }, FIRE_INTERVAL_MS);
    }
  }

  function loop() {
    Engine.update(engine, 1000 / 60);

    // 회전 장애물 회전
    obstacles.forEach((o) => {
      if (o.kind === "bar") {
        Body.setAngle(o.body, o.body.angle + o.spin);
      }
    });

    // 정산 판정
    const allFired = fireQueue.length === 0;
    let allSettled = true;
    let anyFired = false;

    balls.forEach((b) => {
      if (!b.fired) {
        allSettled = false;
        return;
      }
      anyFired = true;
      if (b.settled) return;
      allSettled = false;

      const speed = Matter.Vector.magnitude(b.body.velocity);
      const inBounds = b.body.position.y < H + 60;
      if (!inBounds) {
        // 안전장치: 이탈한 경우 즉시 정산 처리
        markSettled(b);
        return;
      }
      if (speed < SETTLE_SPEED) {
        b.restFrames++;
        if (b.restFrames > SETTLE_FRAMES) {
          markSettled(b);
        }
      } else {
        b.restFrames = 0;
      }
    });

    if (allFired && anyFired) {
      if (allSettled) {
        if (!winnerDeclared) declareWinner();
      } else {
        if (safetyTimeoutStart === null) safetyTimeoutStart = performance.now();
        if (performance.now() - safetyTimeoutStart > SAFETY_TIMEOUT_MS) {
          // 안전장치: 너무 오래 걸리면 현재 속도 기준으로 강제 정산
          balls
            .filter((b) => b.fired && !b.settled)
            .sort((a, b2) => Matter.Vector.magnitude(a.body.velocity) - Matter.Vector.magnitude(b2.body.velocity))
            .forEach((b) => markSettled(b));
        }
      }
    }

    draw();
    animHandle = requestAnimationFrame(loop);
  }

  function markSettled(b) {
    b.settled = true;
    settledCount++;
    b.settleOrder = settledCount;
    appendOrderRow(b);
  }

  function appendOrderRow(b) {
    const li = document.createElement("li");
    li.textContent = b.name;
    li.style.color = b.color;
    orderList.appendChild(li);
    orderList.scrollTop = orderList.scrollHeight;
  }

  function declareWinner() {
    winnerDeclared = true;
    const winner = balls.reduce((latest, b) =>
      !latest || (b.settleOrder ?? 0) > (latest.settleOrder ?? 0) ? b : latest
    , null);

    statusText.textContent = "🏁 모든 구슬 착지 완료!";
    if (winner) {
      winnerNameEl.textContent = winner.name;
      winnerNameEl.style.color = "inherit";
      winnerBanner.classList.remove("hidden");

      const lastLi = orderList.lastElementChild;
      if (lastLi) lastLi.classList.add("is-winner");
    }
    replayBtn.disabled = false;
    resetBtn.disabled = false;
  }

  // ================= 렌더링 =================

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 배경
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#141a2c");
    bg.addColorStop(1, "#0a0d18");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawCannon();

    // 장애물
    obstacles.forEach((o) => drawObstacle(o));

    // 구슬
    balls.forEach((b) => {
      if (!b.fired) return;
      drawBall(b);
    });

    // 바닥 라인
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.stroke();
  }

  function drawCannon() {
    ctx.save();
    ctx.translate(CANNON_X, CANNON_Y);
    ctx.rotate(cannonAngle);

    // 포신
    ctx.fillStyle = "#5a6484";
    ctx.fillRect(-14, -10, 28, 56);
    ctx.fillStyle = "#3a4260";
    ctx.beginPath();
    ctx.arc(0, -10, 20, 0, Math.PI * 2);
    ctx.fill();

    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 180, 80, ${flashTimer / 8})`;
      ctx.beginPath();
      ctx.arc(0, -20, 22, 0, Math.PI * 2);
      ctx.fill();
      flashTimer--;
    }
    ctx.restore();

    // 받침대
    ctx.fillStyle = "#242c47";
    ctx.beginPath();
    ctx.moveTo(CANNON_X - 30, CANNON_Y + 34);
    ctx.lineTo(CANNON_X + 30, CANNON_Y + 34);
    ctx.lineTo(CANNON_X + 18, CANNON_Y + 54);
    ctx.lineTo(CANNON_X - 18, CANNON_Y + 54);
    ctx.closePath();
    ctx.fill();
  }

  function drawObstacle(o) {
    const { body, kind } = o;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);

    if (kind === "peg") {
      ctx.translate(-body.position.x, -body.position.y);
      ctx.beginPath();
      ctx.arc(body.position.x, body.position.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#7a86b8";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.arc(body.position.x - 2, body.position.y - 2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === "bar") {
      ctx.fillStyle = "#ff8a5b";
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, 3);
    } else if (kind === "deflector") {
      ctx.fillStyle = "#4a9eff";
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    }
    ctx.restore();
  }

  function drawBall(b) {
    const { position } = b.body;
    ctx.save();
    ctx.translate(position.x, position.y);

    if (b.settled && winnerDeclared && b === getWinnerBall()) {
      const pulse = 4 + Math.sin(performance.now() / 120) * 3;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_RADIUS + pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 200, 80, 0.35)";
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.globalAlpha = b.settled ? 0.9 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(-3, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  let winnerBallCache = null;
  function getWinnerBall() {
    if (winnerBallCache && winnerBallCache.settled) return winnerBallCache;
    winnerBallCache = balls.reduce((latest, b) =>
      !latest || (b.settleOrder ?? 0) > (latest.settleOrder ?? 0) ? b : latest
    , null);
    return winnerBallCache;
  }

  // 초기 안내 화면 (정적) 그리기
  buildWorld();
  draw();
})();
