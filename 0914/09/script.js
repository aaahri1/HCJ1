(() => {
  if (location.protocol === 'file:') {
    const warning = document.getElementById('fileProtocolWarning');
    if (warning) warning.hidden = false;
  }

  // ---------- DOM references ----------
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const chooseFileBtn = document.getElementById('chooseFileBtn');
  const intro = document.getElementById('intro');
  const editor = document.getElementById('editor');

  const gifPreview = document.getElementById('gifPreview');
  const fileNameEl = document.getElementById('fileName');
  const newFileBtn = document.getElementById('newFileBtn');
  const downloadOriginalBtn = document.getElementById('downloadOriginalBtn');
  const originalStatsEl = document.getElementById('originalStats');
  const originalPanel = document.getElementById('originalPanel');
  const toggleOriginalPanel = document.getElementById('toggleOriginalPanel');

  const outputPanel = document.getElementById('outputPanel');
  const outputPanelTitle = document.getElementById('outputPanelTitle');
  const outputPreview = document.getElementById('outputPreview');
  const outputVideoPreview = document.getElementById('outputVideoPreview');
  const outputStatsEl = document.getElementById('outputStats');
  const downloadOutputBtn = document.getElementById('downloadOutputBtn');
  const toggleOutputPanel = document.getElementById('toggleOutputPanel');

  const toolsView = document.getElementById('toolsView');

  // Resize
  const resizeToolBtn = document.getElementById('resizeToolBtn');
  const resizeView = document.getElementById('resizeView');
  const resizeXSlider = document.getElementById('resizeXSlider');
  const resizeYSlider = document.getElementById('resizeYSlider');
  const resizeXValue = document.getElementById('resizeXValue');
  const resizeYValue = document.getElementById('resizeYValue');
  const aspectLockBtn = document.getElementById('aspectLockBtn');
  const lockIcon = document.getElementById('lockIcon');
  const resizeBackBtn = document.getElementById('resizeBackBtn');
  const resizeGoBtn = document.getElementById('resizeGoBtn');

  // Crop
  const cropToolBtn = document.getElementById('cropToolBtn');
  const cropView = document.getElementById('cropView');
  const cropRatioChips = document.getElementById('cropRatioChips');
  const cropModeSegmented = document.getElementById('cropModeSegmented');
  const cropPadOptions = document.getElementById('cropPadOptions');
  const cropPadColor = document.getElementById('cropPadColor');
  const cropPadTransparent = document.getElementById('cropPadTransparent');
  const cropBackBtn = document.getElementById('cropBackBtn');
  const cropGoBtn = document.getElementById('cropGoBtn');

  // Downsizing
  const downsizingToolBtn = document.getElementById('downsizingToolBtn');
  const downsizingView = document.getElementById('downsizingView');
  const dsScaleCheck = document.getElementById('dsScaleCheck');
  const dsScaleControl = document.getElementById('dsScaleControl');
  const dsScaleSlider = document.getElementById('dsScaleSlider');
  const dsScaleValue = document.getElementById('dsScaleValue');
  const dsFramesCheck = document.getElementById('dsFramesCheck');
  const dsFramesControl = document.getElementById('dsFramesControl');
  const dsFramesSlider = document.getElementById('dsFramesSlider');
  const dsFramesValue = document.getElementById('dsFramesValue');
  const dsColorsCheck = document.getElementById('dsColorsCheck');
  const dsColorsControl = document.getElementById('dsColorsControl');
  const dsColorsSlider = document.getElementById('dsColorsSlider');
  const dsColorsValue = document.getElementById('dsColorsValue');
  const dsBackBtn = document.getElementById('dsBackBtn');
  const dsGoBtn = document.getElementById('dsGoBtn');

  // Format Convert
  const formatToolBtn = document.getElementById('formatToolBtn');
  const formatView = document.getElementById('formatView');
  const formatTypeSegmented = document.getElementById('formatTypeSegmented');
  const formatJpgOptions = document.getElementById('formatJpgOptions');
  const formatJpgQuality = document.getElementById('formatJpgQuality');
  const formatJpgQualityValue = document.getElementById('formatJpgQualityValue');
  const formatMp4Hint = document.getElementById('formatMp4Hint');
  const formatBackBtn = document.getElementById('formatBackBtn');
  const formatGoBtn = document.getElementById('formatGoBtn');

  // Rotate
  const rotateToolBtn = document.getElementById('rotateToolBtn');
  const rotateView = document.getElementById('rotateView');
  const rotateAngleChips = document.getElementById('rotateAngleChips');
  const rotateFlipChips = document.getElementById('rotateFlipChips');
  const rotateBackBtn = document.getElementById('rotateBackBtn');
  const rotateGoBtn = document.getElementById('rotateGoBtn');

  // Optimize
  const optimizeToolBtn = document.getElementById('optimizeToolBtn');
  const optimizeView = document.getElementById('optimizeView');
  const optimizeBackBtn = document.getElementById('optimizeBackBtn');
  const optimizeGoBtn = document.getElementById('optimizeGoBtn');

  // Reverse
  const reverseToolBtn = document.getElementById('reverseToolBtn');
  const reverseView = document.getElementById('reverseView');
  const reverseBackBtn = document.getElementById('reverseBackBtn');
  const reverseGoBtn = document.getElementById('reverseGoBtn');

  // Speed
  const speedToolBtn = document.getElementById('speedToolBtn');
  const speedView = document.getElementById('speedView');
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');
  const speedBackBtn = document.getElementById('speedBackBtn');
  const speedGoBtn = document.getElementById('speedGoBtn');

  // Cut
  const cutToolBtn = document.getElementById('cutToolBtn');
  const cutView = document.getElementById('cutView');
  const cutStartSlider = document.getElementById('cutStartSlider');
  const cutEndSlider = document.getElementById('cutEndSlider');
  const cutStartValue = document.getElementById('cutStartValue');
  const cutEndValue = document.getElementById('cutEndValue');
  const cutBackBtn = document.getElementById('cutBackBtn');
  const cutGoBtn = document.getElementById('cutGoBtn');

  const LOCK_ICON = '<rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  const UNLOCK_ICON = '<rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 11V7a4 4 0 017.75-1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';

  // ---------- App state ----------
  const state = {
    file: null,
    gifData: null, // { reader, width, height, numFrames, fps, hasTransparency }
    decodedFrames: null, // cached full-composited RGBA frames, decoded lazily
    targetWidth: null,
    targetHeight: null,
    originalObjectUrl: null,
    outputObjectUrl: null,
    outputBlob: null,
    outputFilename: null,
    aspectLocked: true,
    jobId: 0,

    cropRatio: 1,
    cropMode: 'fill',
    rotateAngle: 0,
    rotateFlip: 'none',
    formatType: 'jpg',
    cutStart: null,
    cutEnd: null,

    formatTimeoutId: null,
    formatRecorder: null,
  };

  const toolButtons = [
    { btn: resizeToolBtn, view: resizeView, onOpen: syncResizeSliders },
    { btn: cropToolBtn, view: cropView, onOpen: null },
    { btn: downsizingToolBtn, view: downsizingView, onOpen: null },
    { btn: formatToolBtn, view: formatView, onOpen: null },
    { btn: rotateToolBtn, view: rotateView, onOpen: null },
    { btn: optimizeToolBtn, view: optimizeView, onOpen: null },
    { btn: reverseToolBtn, view: reverseView, onOpen: null },
    { btn: speedToolBtn, view: speedView, onOpen: null },
    { btn: cutToolBtn, view: cutView, onOpen: syncCutSliders },
  ];

  // ---------- Helpers ----------
  function isGif(file) {
    return file && (file.type === 'image/gif' || /\.gif$/i.test(file.name));
  }

  function baseNameWithoutExt(name) {
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(0, idx) : name;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = -1;
    do {
      value /= 1024;
      unitIndex++;
    } while (value >= 1024 && unitIndex < units.length - 1);
    return `${value.toFixed(value < 10 ? 2 : 1)} ${units[unitIndex]}`;
  }

  function formatFps(fps) {
    const rounded = Math.round(fps * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function computeAverageDelayCs(reader) {
    const n = reader.numFrames();
    let total = 0;
    for (let i = 0; i < n; i++) total += reader.frameInfo(i).delay;
    return n ? total / n : 0;
  }

  function renderStats(container, { sizeBytes, width, height, fps, frames }) {
    const fpsDisplay = fps == null ? 'N/A' : `${formatFps(fps)} fps`;
    const framesDisplay = frames == null ? 'N/A' : String(frames);
    container.innerHTML = `
      <div class="stat-chip"><span class="stat-label">Size</span><span class="stat-value">${formatBytes(sizeBytes)}</span></div>
      <div class="stat-chip"><span class="stat-label">Resolution</span><span class="stat-value">${width}&times;${height}</span></div>
      <div class="stat-chip"><span class="stat-label">Frame Rate</span><span class="stat-value">${fpsDisplay}</span></div>
      <div class="stat-chip"><span class="stat-label">Frames</span><span class="stat-value">${framesDisplay}</span></div>
    `;
  }

  function setPanelCollapsed(panelEl, collapsed) {
    panelEl.classList.toggle('collapsed', collapsed);
    const toggleBtn = panelEl.querySelector('.collapse-toggle');
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(!collapsed));
  }

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function setToolProcessing(backBtn, goBtn, isProcessing) {
    goBtn.disabled = isProcessing;
    backBtn.disabled = isProcessing;
    goBtn.classList.toggle('is-processing', isProcessing);
    if (isProcessing) {
      if (goBtn.dataset.originalLabel === undefined) goBtn.dataset.originalLabel = goBtn.textContent;
      goBtn.textContent = 'Processing… 0%';
    } else if (goBtn.dataset.originalLabel !== undefined) {
      goBtn.textContent = goBtn.dataset.originalLabel;
      delete goBtn.dataset.originalLabel;
    }
  }

  function makeCanvasPair(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx };
  }

  function activeChip(container) {
    return container.querySelector('.chip.active');
  }

  function wireChipGroup(container, onSelect) {
    container.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        onSelect(chip);
      });
    });
  }

  function wireSegmented(container, onSelect) {
    container.querySelectorAll('.segmented-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.segmented-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(btn);
      });
    });
  }

  // ---------- GIF frame decoding (with disposal handling) ----------
  function clearRect(pixels, width, rect) {
    for (let row = 0; row < rect.height; row++) {
      const start = ((rect.y + row) * width + rect.x) * 4;
      pixels.fill(0, start, start + rect.width * 4);
    }
  }

  function snapshotRect(pixels, width, rect) {
    const snap = new Uint8ClampedArray(rect.width * rect.height * 4);
    let si = 0;
    for (let row = 0; row < rect.height; row++) {
      const start = ((rect.y + row) * width + rect.x) * 4;
      snap.set(pixels.subarray(start, start + rect.width * 4), si);
      si += rect.width * 4;
    }
    return snap;
  }

  function restoreRect(pixels, width, rect, snap) {
    let si = 0;
    for (let row = 0; row < rect.height; row++) {
      const start = ((rect.y + row) * width + rect.x) * 4;
      pixels.set(snap.subarray(si, si + rect.width * 4), start);
      si += rect.width * 4;
    }
  }

  function decodeGifFrames(reader) {
    const width = reader.width;
    const height = reader.height;
    const numFrames = reader.numFrames();
    const frames = [];
    const pixels = new Uint8ClampedArray(width * height * 4);

    let prevRect = null;
    let prevDisposal = 0;
    let prevSnapshot = null;

    for (let i = 0; i < numFrames; i++) {
      const info = reader.frameInfo(i);

      if (prevDisposal === 2 && prevRect) {
        clearRect(pixels, width, prevRect);
      } else if (prevDisposal === 3 && prevRect && prevSnapshot) {
        restoreRect(pixels, width, prevRect, prevSnapshot);
      }

      prevSnapshot = info.disposal === 3 ? snapshotRect(pixels, width, info) : null;

      reader.decodeAndBlitFrameRGBA(i, pixels);

      frames.push({ data: pixels.slice(), delay: info.delay });

      prevRect = info;
      prevDisposal = info.disposal;
    }

    return { width, height, frames };
  }

  function ensureDecodedFrames() {
    if (!state.decodedFrames) {
      state.decodedFrames = decodeGifFrames(state.gifData.reader);
    }
    return state.decodedFrames;
  }

  // ---------- Load a new GIF ----------
  function loadGif(file) {
    if (!isGif(file)) {
      alert('Please select a GIF file.');
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      const bytes = new Uint8Array(fileReader.result);
      let reader;
      try {
        reader = new GifReader(bytes);
      } catch (err) {
        alert('Could not read this GIF file. It may be corrupted.');
        return;
      }
      setupEditor(file, reader);
    };
    fileReader.readAsArrayBuffer(file);
  }

  function setupEditor(file, reader) {
    resetEditorState();

    const width = reader.width;
    const height = reader.height;
    const numFrames = reader.numFrames();
    const fps = 100 / (computeAverageDelayCs(reader) || 10);

    let hasTransparency = false;
    for (let i = 0; i < numFrames; i++) {
      if (reader.frameInfo(i).transparent_index !== null) {
        hasTransparency = true;
        break;
      }
    }

    state.file = file;
    state.gifData = { reader, width, height, numFrames, fps, hasTransparency };
    state.targetWidth = width;
    state.targetHeight = height;

    state.originalObjectUrl = URL.createObjectURL(file);
    gifPreview.src = state.originalObjectUrl;
    fileNameEl.textContent = file.name;
    fileNameEl.title = file.name;

    renderStats(originalStatsEl, { sizeBytes: file.size, width, height, fps, frames: numFrames });

    intro.hidden = true;
    editor.hidden = false;
  }

  function cancelFormatRecording() {
    if (state.formatTimeoutId) {
      clearTimeout(state.formatTimeoutId);
      state.formatTimeoutId = null;
    }
    if (state.formatRecorder && state.formatRecorder.state !== 'inactive') {
      state.formatRecorder.onstop = null;
      try { state.formatRecorder.stop(); } catch (err) { /* already stopped */ }
    }
    state.formatRecorder = null;
  }

  function resetToolControls() {
    // Crop
    cropRatioChips.querySelectorAll('.chip').forEach((c, idx) => c.classList.toggle('active', idx === 0));
    state.cropRatio = parseFloat(activeChip(cropRatioChips).dataset.ratio);
    cropModeSegmented.querySelectorAll('.segmented-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
    state.cropMode = 'fill';
    cropPadOptions.hidden = true;
    cropPadColor.value = '#ffffff';
    cropPadTransparent.checked = false;

    // Downsizing
    dsScaleCheck.checked = false;
    dsFramesCheck.checked = false;
    dsColorsCheck.checked = false;
    dsScaleSlider.value = '50';
    dsScaleValue.textContent = '50%';
    dsFramesSlider.value = '2';
    dsFramesValue.textContent = 'Keep 1 of 2';
    dsColorsSlider.value = '8';
    dsColorsValue.textContent = '256 colors';
    updateDownsizingUI();

    // Format
    formatTypeSegmented.querySelectorAll('.segmented-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
    state.formatType = 'jpg';
    formatJpgOptions.hidden = false;
    formatMp4Hint.hidden = true;
    formatJpgQuality.value = '85';
    formatJpgQualityValue.textContent = '85%';

    // Rotate
    rotateAngleChips.querySelectorAll('.chip').forEach((c, idx) => c.classList.toggle('active', idx === 0));
    state.rotateAngle = 0;
    rotateFlipChips.querySelectorAll('.chip').forEach((c, idx) => c.classList.toggle('active', idx === 0));
    state.rotateFlip = 'none';

    // Speed
    speedSlider.value = '100';
    speedValue.textContent = '1x';

    // Cut
    state.cutStart = null;
    state.cutEnd = null;
  }

  function resetEditorState() {
    cancelFormatRecording();

    if (state.originalObjectUrl) URL.revokeObjectURL(state.originalObjectUrl);
    if (state.outputObjectUrl) URL.revokeObjectURL(state.outputObjectUrl);

    state.file = null;
    state.gifData = null;
    state.decodedFrames = null;
    state.targetWidth = null;
    state.targetHeight = null;
    state.originalObjectUrl = null;
    state.outputObjectUrl = null;
    state.outputBlob = null;
    state.outputFilename = null;
    state.aspectLocked = true;
    state.jobId++; // invalidate any in-flight job

    gifPreview.src = '';
    fileNameEl.textContent = '';
    originalStatsEl.innerHTML = '';

    outputPreview.src = '';
    outputVideoPreview.pause();
    outputVideoPreview.src = '';
    outputPreview.hidden = false;
    outputVideoPreview.hidden = true;
    outputStatsEl.innerHTML = '';
    outputPanel.hidden = true;

    setPanelCollapsed(originalPanel, false);
    setPanelCollapsed(outputPanel, false);

    closeAllToolViews();
    resetToolControls();

    aspectLockBtn.setAttribute('aria-pressed', 'true');
    aspectLockBtn.classList.remove('unlocked');
    lockIcon.innerHTML = LOCK_ICON;
  }

  function resetToIntro() {
    resetEditorState();
    fileInput.value = '';
    editor.hidden = true;
    intro.hidden = false;
  }

  // ---------- Upload interactions ----------
  chooseFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) loadGif(file);
  });

  dropzone.addEventListener('click', (e) => {
    if (e.target === chooseFileBtn) return;
    fileInput.click();
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadGif(file);
  });

  newFileBtn.addEventListener('click', resetToIntro);

  // ---------- Panel collapse toggles ----------
  toggleOriginalPanel.addEventListener('click', () => {
    setPanelCollapsed(originalPanel, !originalPanel.classList.contains('collapsed'));
  });

  toggleOutputPanel.addEventListener('click', () => {
    setPanelCollapsed(outputPanel, !outputPanel.classList.contains('collapsed'));
  });

  // ---------- Downloads ----------
  downloadOriginalBtn.addEventListener('click', () => {
    if (!state.file || !state.originalObjectUrl) return;
    triggerDownload(state.originalObjectUrl, state.file.name);
  });

  downloadOutputBtn.addEventListener('click', () => {
    if (!state.outputObjectUrl || !state.outputFilename) return;
    triggerDownload(state.outputObjectUrl, state.outputFilename);
  });

  // ---------- Editor Tools: view switching ----------
  function closeAllToolViews() {
    toolButtons.forEach(({ view }) => {
      view.hidden = true;
    });
    toolsView.hidden = false;
  }

  toolButtons.forEach(({ btn, view, onOpen }) => {
    btn.addEventListener('click', () => {
      toolsView.hidden = true;
      view.hidden = false;
      if (onOpen) onOpen();
    });
  });

  // ---------- Output panel population ----------
  function onOutputReady({ blob, width, height, frames, fps, label, filename }) {
    if (state.outputObjectUrl) URL.revokeObjectURL(state.outputObjectUrl);
    state.outputBlob = blob;
    state.outputFilename = filename;
    state.outputObjectUrl = URL.createObjectURL(blob);

    const isVideo = blob.type.startsWith('video/');
    outputPreview.hidden = isVideo;
    outputVideoPreview.hidden = !isVideo;
    if (isVideo) {
      outputPreview.src = '';
      outputVideoPreview.src = state.outputObjectUrl;
    } else {
      outputVideoPreview.pause();
      outputVideoPreview.src = '';
      outputPreview.src = state.outputObjectUrl;
    }

    outputPanelTitle.textContent = label;
    renderStats(outputStatsEl, { sizeBytes: blob.size, width, height, fps, frames });

    outputPanel.hidden = false;
    setPanelCollapsed(outputPanel, false);
    setPanelCollapsed(originalPanel, true);
  }

  // ---------- Shared GIF encode pipeline ----------
  function buildGif({ width, height, hasTransparency, colors }) {
    return new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: 'vendor/gif.worker.js',
      repeat: 0,
      transparent: hasTransparency ? 0xff00ff : null,
      colors: colors || 256,
    });
  }

  function applyTransparencyKey(data) {
    const out = Uint8ClampedArray.from(data);
    for (let i = 0; i < out.length; i += 4) {
      if (out[i + 3] < 128) {
        out[i] = 255;
        out[i + 1] = 0;
        out[i + 2] = 255;
        out[i + 3] = 255;
      }
    }
    return out;
  }

  const WORKER_FAILURE_MESSAGE =
    'GIF 인코더(Web Worker)를 불러오지 못했습니다.\n\n' +
    '가장 흔한 원인은 이 페이지를 "file://"로 직접 연 경우입니다 — 브라우저 보안 정책상 file://에서는 Web Worker가 동작하지 않습니다.\n\n' +
    '터미널에서 프로젝트 폴더로 이동해 다음을 실행한 뒤,\n  python3 -m http.server 8765\n브라우저에서 http://localhost:8765 로 접속해 다시 시도해 주세요.';

  function handleEncodeFailure(backBtn, goBtn, jobId, message) {
    if (jobId !== state.jobId) return;
    state.jobId++; // invalidate this job so any late/stray events are ignored
    setToolProcessing(backBtn, goBtn, false);
    alert(message);
  }

  function encodeAndShowOutput({ frames, width, height, hasTransparency, colors, fps, label, prefix, backBtn, goBtn }) {
    const jobId = ++state.jobId;
    setToolProcessing(backBtn, goBtn, true);

    const gif = buildGif({ width, height, hasTransparency, colors });
    let sawProgress = false;

    gif.on('worker-error', () => {
      handleEncodeFailure(backBtn, goBtn, jobId, WORKER_FAILURE_MESSAGE);
    });

    // If the worker never even reports 0% progress within a few seconds, it almost
    // certainly never started (blocked script load, 404, file:// restriction, ...).
    // A genuinely slow-but-working job will have emitted at least one progress
    // event well before this fires, so this won't interrupt real long-running jobs.
    const stallTimer = setTimeout(() => {
      if (sawProgress) return;
      handleEncodeFailure(backBtn, goBtn, jobId, WORKER_FAILURE_MESSAGE);
    }, 10000);

    gif.on('progress', (fraction) => {
      if (jobId !== state.jobId) return;
      sawProgress = true;
      goBtn.textContent = `Processing… ${Math.round(fraction * 100)}%`;
    });

    frames.forEach((frame) => {
      const data = hasTransparency ? applyTransparencyKey(frame.data) : frame.data;
      const delayMs = Math.max(20, Math.round(frame.delay * 10));
      gif.addFrame(new ImageData(data, width, height), { delay: delayMs });
    });

    gif.on('finished', (blob) => {
      clearTimeout(stallTimer);
      if (jobId !== state.jobId) return;
      onOutputReady({
        blob,
        width,
        height,
        frames: frames.length,
        fps,
        label,
        filename: `${prefix}${baseNameWithoutExt(state.file.name)}.gif`,
      });
      setToolProcessing(backBtn, goBtn, false);
    });

    gif.render();
  }

  // ================= RESIZE =================
  function syncResizeSliders() {
    const { width, height } = state.gifData;
    const minW = Math.max(1, Math.round(width * 0.05));
    const maxW = Math.max(minW, Math.round(width * 3));
    const minH = Math.max(1, Math.round(height * 0.05));
    const maxH = Math.max(minH, Math.round(height * 3));

    resizeXSlider.min = String(minW);
    resizeXSlider.max = String(maxW);
    resizeYSlider.min = String(minH);
    resizeYSlider.max = String(maxH);

    resizeXSlider.value = String(state.targetWidth);
    resizeYSlider.value = String(state.targetHeight);
    resizeXValue.textContent = `${state.targetWidth} px`;
    resizeYValue.textContent = `${state.targetHeight} px`;
  }

  function aspectRatio() {
    return state.gifData.width / state.gifData.height;
  }

  resizeXSlider.addEventListener('input', () => {
    const x = parseInt(resizeXSlider.value, 10);
    state.targetWidth = x;
    resizeXValue.textContent = `${x} px`;

    if (state.aspectLocked) {
      const minH = parseInt(resizeYSlider.min, 10);
      const maxH = parseInt(resizeYSlider.max, 10);
      const y = Math.min(Math.max(Math.round(x / aspectRatio()), minH), maxH);
      resizeYSlider.value = String(y);
      state.targetHeight = y;
      resizeYValue.textContent = `${y} px`;
    }
  });

  resizeYSlider.addEventListener('input', () => {
    const y = parseInt(resizeYSlider.value, 10);
    state.targetHeight = y;
    resizeYValue.textContent = `${y} px`;

    if (state.aspectLocked) {
      const minW = parseInt(resizeXSlider.min, 10);
      const maxW = parseInt(resizeXSlider.max, 10);
      const x = Math.min(Math.max(Math.round(y * aspectRatio()), minW), maxW);
      resizeXSlider.value = String(x);
      state.targetWidth = x;
      resizeXValue.textContent = `${x} px`;
    }
  });

  aspectLockBtn.addEventListener('click', () => {
    state.aspectLocked = !state.aspectLocked;
    aspectLockBtn.classList.toggle('unlocked', !state.aspectLocked);
    aspectLockBtn.setAttribute('aria-pressed', String(state.aspectLocked));
    lockIcon.innerHTML = state.aspectLocked ? LOCK_ICON : UNLOCK_ICON;
  });

  resizeBackBtn.addEventListener('click', closeAllToolViews);

  function buildResizeFrames() {
    const { width: origW, height: origH, hasTransparency } = state.gifData;
    const targetW = state.targetWidth;
    const targetH = state.targetHeight;

    const src = makeCanvasPair(origW, origH);
    const dst = makeCanvasPair(targetW, targetH);
    dst.ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in dst.ctx) dst.ctx.imageSmoothingQuality = 'high';

    const { frames } = ensureDecodedFrames();
    const outFrames = frames.map((frame) => {
      src.ctx.putImageData(new ImageData(frame.data.slice(), origW, origH), 0, 0);
      dst.ctx.clearRect(0, 0, targetW, targetH);
      dst.ctx.drawImage(src.canvas, 0, 0, origW, origH, 0, 0, targetW, targetH);
      return { data: dst.ctx.getImageData(0, 0, targetW, targetH).data, delay: frame.delay };
    });

    return { frames: outFrames, width: targetW, height: targetH, hasTransparency };
  }

  resizeGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildResizeFrames(),
      colors: 256,
      fps: state.gifData.fps,
      label: 'Resized GIF',
      prefix: 'Resized_',
      backBtn: resizeBackBtn,
      goBtn: resizeGoBtn,
    });
  });

  // ================= CROP =================
  function computeFitRect(srcW, srcH, dstW, dstH, mode) {
    const scale = mode === 'cover' ? Math.max(dstW / srcW, dstH / srcH) : Math.min(dstW / srcW, dstH / srcH);
    const drawW = srcW * scale;
    const drawH = srcH * scale;
    return { drawW, drawH, dx: (dstW - drawW) / 2, dy: (dstH - drawH) / 2 };
  }

  wireChipGroup(cropRatioChips, (chip) => {
    state.cropRatio = parseFloat(chip.dataset.ratio);
  });

  wireSegmented(cropModeSegmented, (btn) => {
    state.cropMode = btn.dataset.mode;
    cropPadOptions.hidden = state.cropMode !== 'pad';
  });

  cropBackBtn.addEventListener('click', closeAllToolViews);

  function buildCropFrames() {
    const { width: origW, height: origH, hasTransparency: sourceHasTransparency } = state.gifData;
    const ratio = state.cropRatio;
    const targetW = origW;
    const targetH = Math.max(1, Math.round(origW / ratio));
    const mode = state.cropMode;
    const padTransparent = cropPadTransparent.checked;
    const padColor = cropPadColor.value;
    const hasTransparency = sourceHasTransparency || (mode === 'pad' && padTransparent);

    const src = makeCanvasPair(origW, origH);
    const dst = makeCanvasPair(targetW, targetH);
    dst.ctx.imageSmoothingEnabled = true;

    const { frames } = ensureDecodedFrames();
    const fit = computeFitRect(origW, origH, targetW, targetH, mode === 'fill' ? 'cover' : 'contain');

    const outFrames = frames.map((frame) => {
      src.ctx.putImageData(new ImageData(frame.data.slice(), origW, origH), 0, 0);
      dst.ctx.clearRect(0, 0, targetW, targetH);
      if (mode === 'pad' && !padTransparent) {
        dst.ctx.fillStyle = padColor;
        dst.ctx.fillRect(0, 0, targetW, targetH);
      }
      dst.ctx.drawImage(src.canvas, 0, 0, origW, origH, fit.dx, fit.dy, fit.drawW, fit.drawH);
      return { data: dst.ctx.getImageData(0, 0, targetW, targetH).data, delay: frame.delay };
    });

    return { frames: outFrames, width: targetW, height: targetH, hasTransparency };
  }

  cropGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildCropFrames(),
      colors: 256,
      fps: state.gifData.fps,
      label: 'Cropped GIF',
      prefix: 'Cropped_',
      backBtn: cropBackBtn,
      goBtn: cropGoBtn,
    });
  });

  // ================= DOWNSIZING =================
  function updateDownsizingUI() {
    dsScaleControl.hidden = !dsScaleCheck.checked;
    dsFramesControl.hidden = !dsFramesCheck.checked;
    dsColorsControl.hidden = !dsColorsCheck.checked;
    dsGoBtn.disabled = !(dsScaleCheck.checked || dsFramesCheck.checked || dsColorsCheck.checked);
  }

  [dsScaleCheck, dsFramesCheck, dsColorsCheck].forEach((cb) => cb.addEventListener('change', updateDownsizingUI));

  dsScaleSlider.addEventListener('input', () => {
    dsScaleValue.textContent = `${dsScaleSlider.value}%`;
  });

  dsFramesSlider.addEventListener('input', () => {
    dsFramesValue.textContent = `Keep 1 of ${dsFramesSlider.value}`;
  });

  dsColorsSlider.addEventListener('input', () => {
    const colors = Math.pow(2, parseInt(dsColorsSlider.value, 10));
    dsColorsValue.textContent = `${colors} colors`;
  });

  dsBackBtn.addEventListener('click', closeAllToolViews);

  function buildDownsizingFrames() {
    const { width: origW, height: origH, hasTransparency } = state.gifData;
    let { frames } = ensureDecodedFrames();

    if (dsFramesCheck.checked) {
      const keepEvery = parseInt(dsFramesSlider.value, 10);
      const reduced = [];
      for (let i = 0; i < frames.length; i += keepEvery) {
        let mergedDelay = 0;
        for (let j = i; j < Math.min(i + keepEvery, frames.length); j++) mergedDelay += frames[j].delay;
        reduced.push({ data: frames[i].data, delay: mergedDelay });
      }
      frames = reduced.length ? reduced : frames;
    }

    let targetW = origW;
    let targetH = origH;
    if (dsScaleCheck.checked) {
      const scalePct = parseInt(dsScaleSlider.value, 10);
      targetW = Math.max(1, Math.round((origW * scalePct) / 100));
      targetH = Math.max(1, Math.round((origH * scalePct) / 100));
    }

    let outFrames;
    if (targetW !== origW || targetH !== origH) {
      const src = makeCanvasPair(origW, origH);
      const dst = makeCanvasPair(targetW, targetH);
      dst.ctx.imageSmoothingEnabled = true;
      outFrames = frames.map((frame) => {
        src.ctx.putImageData(new ImageData(frame.data.slice(), origW, origH), 0, 0);
        dst.ctx.clearRect(0, 0, targetW, targetH);
        dst.ctx.drawImage(src.canvas, 0, 0, origW, origH, 0, 0, targetW, targetH);
        return { data: dst.ctx.getImageData(0, 0, targetW, targetH).data, delay: frame.delay };
      });
    } else {
      outFrames = frames.map((frame) => ({ data: frame.data.slice(), delay: frame.delay }));
    }

    const colors = dsColorsCheck.checked ? Math.pow(2, parseInt(dsColorsSlider.value, 10)) : 256;

    return { frames: outFrames, width: targetW, height: targetH, hasTransparency, colors };
  }

  dsGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildDownsizingFrames(),
      fps: state.gifData.fps,
      label: 'Downsized GIF',
      prefix: 'Downsized_',
      backBtn: dsBackBtn,
      goBtn: dsGoBtn,
    });
  });

  // ================= FORMAT CONVERT =================
  wireSegmented(formatTypeSegmented, (btn) => {
    state.formatType = btn.dataset.format;
    formatJpgOptions.hidden = state.formatType !== 'jpg';
    formatMp4Hint.hidden = state.formatType !== 'mp4';
  });

  formatJpgQuality.addEventListener('input', () => {
    formatJpgQualityValue.textContent = `${formatJpgQuality.value}%`;
  });

  formatBackBtn.addEventListener('click', closeAllToolViews);

  function runFormatJpg() {
    const { width, height } = state.gifData;
    ensureDecodedFrames();
    const firstFrame = state.decodedFrames.frames[0];

    const src = makeCanvasPair(width, height);
    src.ctx.putImageData(new ImageData(firstFrame.data.slice(), width, height), 0, 0);

    const dst = makeCanvasPair(width, height);
    dst.ctx.fillStyle = '#ffffff';
    dst.ctx.fillRect(0, 0, width, height);
    dst.ctx.drawImage(src.canvas, 0, 0);

    const quality = parseInt(formatJpgQuality.value, 10) / 100;
    const jobId = ++state.jobId;
    setToolProcessing(formatBackBtn, formatGoBtn, true);

    dst.canvas.toBlob(
      (blob) => {
        if (jobId !== state.jobId) return;
        setToolProcessing(formatBackBtn, formatGoBtn, false);
        if (!blob) {
          alert('Could not convert this GIF to JPG.');
          return;
        }
        onOutputReady({
          blob,
          width,
          height,
          frames: 1,
          fps: null,
          label: 'Converted JPG',
          filename: `${baseNameWithoutExt(state.file.name)}.jpg`,
        });
      },
      'image/jpeg',
      quality
    );
  }

  function pickVideoMimeType() {
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return null;
    const candidates = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return null;
  }

  function runFormatMp4() {
    const mimeType = pickVideoMimeType();
    if (!mimeType) {
      alert('This browser does not support recording MP4/WebM video. Try Chrome, Edge, or Safari.');
      return;
    }

    const { width, height, fps } = state.gifData;
    ensureDecodedFrames();
    const frames = state.decodedFrames.frames;

    const src = makeCanvasPair(width, height);
    const dst = makeCanvasPair(width, height);

    const stream = dst.canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunks.push(e.data);
    };

    const jobId = ++state.jobId;
    state.formatRecorder = recorder;
    setToolProcessing(formatBackBtn, formatGoBtn, true);

    recorder.onstop = () => {
      if (jobId !== state.jobId) return;
      state.formatRecorder = null;
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
      onOutputReady({
        blob,
        width,
        height,
        frames: frames.length,
        fps,
        label: ext === 'mp4' ? 'Converted MP4' : 'Converted Video (WebM)',
        filename: `${baseNameWithoutExt(state.file.name)}.${ext}`,
      });
      setToolProcessing(formatBackBtn, formatGoBtn, false);
    };

    recorder.start();

    let i = 0;
    function drawNext() {
      if (jobId !== state.jobId) return;
      if (i >= frames.length) {
        state.formatTimeoutId = setTimeout(() => {
          if (jobId === state.jobId && recorder.state !== 'inactive') recorder.stop();
        }, 80);
        return;
      }
      src.ctx.putImageData(new ImageData(frames[i].data.slice(), width, height), 0, 0);
      dst.ctx.fillStyle = '#ffffff';
      dst.ctx.fillRect(0, 0, width, height);
      dst.ctx.drawImage(src.canvas, 0, 0);

      const delayMs = Math.max(40, Math.round(frames[i].delay * 10));
      formatGoBtn.textContent = `Recording… ${i + 1}/${frames.length}`;
      i++;
      state.formatTimeoutId = setTimeout(drawNext, delayMs);
    }
    drawNext();
  }

  formatGoBtn.addEventListener('click', () => {
    if (state.formatType === 'jpg') runFormatJpg();
    else runFormatMp4();
  });

  // ================= ROTATE =================
  wireChipGroup(rotateAngleChips, (chip) => {
    state.rotateAngle = parseInt(chip.dataset.angle, 10);
  });

  wireChipGroup(rotateFlipChips, (chip) => {
    state.rotateFlip = chip.dataset.flip;
  });

  rotateBackBtn.addEventListener('click', closeAllToolViews);

  function buildRotateFrames() {
    const { width: origW, height: origH, hasTransparency } = state.gifData;
    const angle = state.rotateAngle;
    const flip = state.rotateFlip;
    const swapDims = angle === 90 || angle === 270;
    const targetW = swapDims ? origH : origW;
    const targetH = swapDims ? origW : origH;

    const src = makeCanvasPair(origW, origH);
    const dst = makeCanvasPair(targetW, targetH);

    const { frames } = ensureDecodedFrames();
    const outFrames = frames.map((frame) => {
      src.ctx.putImageData(new ImageData(frame.data.slice(), origW, origH), 0, 0);
      dst.ctx.save();
      dst.ctx.clearRect(0, 0, targetW, targetH);
      dst.ctx.translate(targetW / 2, targetH / 2);
      dst.ctx.rotate((angle * Math.PI) / 180);
      dst.ctx.scale(flip === 'horizontal' ? -1 : 1, flip === 'vertical' ? -1 : 1);
      dst.ctx.drawImage(src.canvas, -origW / 2, -origH / 2);
      dst.ctx.restore();
      return { data: dst.ctx.getImageData(0, 0, targetW, targetH).data, delay: frame.delay };
    });

    return { frames: outFrames, width: targetW, height: targetH, hasTransparency };
  }

  rotateGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildRotateFrames(),
      colors: 256,
      fps: state.gifData.fps,
      label: 'Rotated GIF',
      prefix: 'Rotated_',
      backBtn: rotateBackBtn,
      goBtn: rotateGoBtn,
    });
  });

  // ================= OPTIMIZE =================
  optimizeBackBtn.addEventListener('click', closeAllToolViews);

  function framesEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function buildOptimizeFrames() {
    const { width, height, hasTransparency } = state.gifData;
    const { frames } = ensureDecodedFrames();
    const merged = [];
    for (const f of frames) {
      const last = merged[merged.length - 1];
      if (last && framesEqual(last.data, f.data)) {
        last.delay += f.delay;
      } else {
        merged.push({ data: f.data.slice(), delay: f.delay });
      }
    }
    return { frames: merged, width, height, hasTransparency };
  }

  optimizeGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildOptimizeFrames(),
      colors: 256,
      fps: state.gifData.fps,
      label: 'Optimized GIF',
      prefix: 'Optimized_',
      backBtn: optimizeBackBtn,
      goBtn: optimizeGoBtn,
    });
  });

  // ================= REVERSE =================
  reverseBackBtn.addEventListener('click', closeAllToolViews);

  function buildReverseFrames() {
    const { width, height, hasTransparency } = state.gifData;
    const { frames } = ensureDecodedFrames();
    const reversed = frames
      .slice()
      .reverse()
      .map((f) => ({ data: f.data.slice(), delay: f.delay }));
    return { frames: reversed, width, height, hasTransparency };
  }

  reverseGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildReverseFrames(),
      colors: 256,
      fps: state.gifData.fps,
      label: 'Reversed GIF',
      prefix: 'Reversed_',
      backBtn: reverseBackBtn,
      goBtn: reverseGoBtn,
    });
  });

  // ================= SPEED =================
  speedSlider.addEventListener('input', () => {
    const factor = parseInt(speedSlider.value, 10) / 100;
    speedValue.textContent = `${factor.toFixed(2).replace(/\.?0+$/, '') || '1'}x`;
  });

  speedBackBtn.addEventListener('click', closeAllToolViews);

  function buildSpeedFrames() {
    const { width, height, hasTransparency, fps } = state.gifData;
    const factor = parseInt(speedSlider.value, 10) / 100;
    const { frames } = ensureDecodedFrames();
    const sped = frames.map((f) => ({ data: f.data.slice(), delay: Math.max(1, Math.round(f.delay / factor)) }));
    return { frames: sped, width, height, hasTransparency, fps: fps * factor };
  }

  speedGoBtn.addEventListener('click', () => {
    const built = buildSpeedFrames();
    encodeAndShowOutput({
      ...built,
      colors: 256,
      label: 'Speed-Adjusted GIF',
      prefix: 'SpeedAdjusted_',
      backBtn: speedBackBtn,
      goBtn: speedGoBtn,
    });
  });

  // ================= CUT =================
  function syncCutSliders() {
    const { numFrames } = state.gifData;
    const maxIdx = Math.max(0, numFrames - 1);
    cutStartSlider.min = '0';
    cutStartSlider.max = String(maxIdx);
    cutEndSlider.min = '0';
    cutEndSlider.max = String(maxIdx);

    if (state.cutStart == null) state.cutStart = 0;
    if (state.cutEnd == null) state.cutEnd = maxIdx;
    state.cutStart = Math.min(state.cutStart, maxIdx);
    state.cutEnd = Math.min(state.cutEnd, maxIdx);

    cutStartSlider.value = String(state.cutStart);
    cutEndSlider.value = String(state.cutEnd);
    updateCutLabels();
  }

  function updateCutLabels() {
    cutStartValue.textContent = `Frame ${state.cutStart + 1}`;
    cutEndValue.textContent = `Frame ${state.cutEnd + 1}`;
  }

  cutStartSlider.addEventListener('input', () => {
    let v = parseInt(cutStartSlider.value, 10);
    if (v > state.cutEnd) v = state.cutEnd;
    state.cutStart = v;
    cutStartSlider.value = String(v);
    updateCutLabels();
  });

  cutEndSlider.addEventListener('input', () => {
    let v = parseInt(cutEndSlider.value, 10);
    if (v < state.cutStart) v = state.cutStart;
    state.cutEnd = v;
    cutEndSlider.value = String(v);
    updateCutLabels();
  });

  cutBackBtn.addEventListener('click', closeAllToolViews);

  function buildCutFrames() {
    const { width, height, hasTransparency } = state.gifData;
    const { frames } = ensureDecodedFrames();
    const slice = frames.slice(state.cutStart, state.cutEnd + 1).map((f) => ({ data: f.data.slice(), delay: f.delay }));
    return { frames: slice, width, height, hasTransparency };
  }

  cutGoBtn.addEventListener('click', () => {
    encodeAndShowOutput({
      ...buildCutFrames(),
      colors: 256,
      fps: state.gifData.fps,
      label: 'Cut GIF',
      prefix: 'Cut_',
      backBtn: cutBackBtn,
      goBtn: cutGoBtn,
    });
  });
})();
