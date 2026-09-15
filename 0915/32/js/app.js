(() => {
  "use strict";

  // ---------- DOM ----------
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadSection = document.getElementById("uploadSection");
  const editorSection = document.getElementById("editorSection");
  const fileNameLabel = document.getElementById("fileNameLabel");
  const fileSubLabel = document.getElementById("fileSubLabel");
  const changeFileBtn = document.getElementById("changeFileBtn");
  const themeToggle = document.getElementById("themeToggle");

  const canvas = document.getElementById("waveformCanvas");
  const ctx2d = canvas.getContext("2d");
  const waveformWrap = document.getElementById("waveformWrap");
  const selectionRegion = document.getElementById("selectionRegion");
  const startHandle = document.getElementById("startHandle");
  const endHandle = document.getElementById("endHandle");
  const playhead = document.getElementById("playhead");
  const hoverTime = document.getElementById("hoverTime");

  const currentTimeLabel = document.getElementById("currentTimeLabel");
  const durationLabel = document.getElementById("durationLabel");
  const selectionInfo = document.getElementById("selectionInfo");

  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetBtn = document.getElementById("resetBtn");

  const trimStartInput = document.getElementById("trimStartInput");
  const trimEndInput = document.getElementById("trimEndInput");
  const setStartBtn = document.getElementById("setStartBtn");
  const setEndBtn = document.getElementById("setEndBtn");
  const applyTrimBtn = document.getElementById("applyTrimBtn");
  const resetTrimBtn = document.getElementById("resetTrimBtn");

  const volumeSlider = document.getElementById("volumeSlider");
  const volumeLabel = document.getElementById("volumeLabel");
  const volumeIcon = document.getElementById("volumeIcon");
  const applyVolumeBtn = document.getElementById("applyVolumeBtn");
  const presetBtns = Array.from(document.querySelectorAll(".btn-chip[data-volume]"));

  const formatBtns = Array.from(document.querySelectorAll(".format-btn[data-format]"));
  const bitrateWrap = document.getElementById("bitrateWrap");
  const bitrateSelect = document.getElementById("bitrateSelect");
  const exportBtn = document.getElementById("exportBtn");
  const exportStatus = document.getElementById("exportStatus");

  // ---------- State ----------
  let audioCtx = null;
  let originalBuffer = null;
  let currentBuffer = null;
  let baseFileName = "audio";
  let originalExt = "wav";
  let exportFormat = "wav";

  let sourceNode = null;
  let liveGainNode = null;
  let isPlaying = false;
  let playStartCtxTime = 0;
  let playStartOffset = 0;
  let pausedOffset = 0;
  let rafId = null;

  let selection = { start: 0, end: 0 };
  let dragging = null; // 'start' | 'end' | null

  const MIN_GAP = 0.02; // seconds, minimum trim selection width

  // ---------- Theme ----------
  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.textContent = "☀️";
    } else {
      document.documentElement.removeAttribute("data-theme");
      themeToggle.textContent = "🌙";
    }
  }
  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem("audioEditorTheme"); } catch (e) {}
    applyTheme(saved === "light" ? "light" : "dark");
  })();
  themeToggle.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem("audioEditorTheme", next); } catch (e) {}
  });

  // ---------- Helpers ----------
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function pad(n) {
    return String(Math.floor(n)).padStart(2, "0");
  }

  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec - Math.floor(sec)) * 100);
    return `${pad(m)}:${pad(s)}.${pad(cs)}`;
  }

  function parseTime(str) {
    const m = String(str).trim().match(/^(\d+):(\d{1,2})(?:\.(\d{1,2}))?$/);
    if (m) {
      const min = parseInt(m[1], 10);
      const s = parseInt(m[2], 10);
      const cs = m[3] ? parseInt((m[3] + "00").slice(0, 2), 10) : 0;
      return min * 60 + s + cs / 100;
    }
    const f = parseFloat(str);
    return isNaN(f) ? 0 : f;
  }

  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }

  function getEventX(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientX;
    return e.clientX;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  // ---------- Buffer utilities ----------
  function cloneAudioBuffer(buffer) {
    const ac = getAudioCtx();
    const out = ac.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      out.copyToChannel(buffer.getChannelData(ch).slice(), ch);
    }
    return out;
  }

  function sliceAudioBuffer(buffer, startSec, endSec) {
    const ac = getAudioCtx();
    const sr = buffer.sampleRate;
    const startSample = clamp(Math.floor(startSec * sr), 0, buffer.length);
    const endSample = clamp(Math.floor(endSec * sr), startSample, buffer.length);
    const frameCount = Math.max(1, endSample - startSample);
    const out = ac.createBuffer(buffer.numberOfChannels, frameCount, sr);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch).slice(startSample, endSample);
      out.copyToChannel(data, ch);
    }
    return out;
  }

  function applyGainToBuffer(buffer, factor) {
    const ac = getAudioCtx();
    const out = ac.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = new Float32Array(src.length);
      for (let i = 0; i < src.length; i++) {
        dst[i] = clamp(src[i] * factor, -1, 1);
      }
      out.copyToChannel(dst, ch);
    }
    return out;
  }

  // ---------- Waveform drawing ----------
  function drawWaveform(buffer) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = waveformWrap.clientWidth;
    const cssHeight = 140;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = cssWidth + "px";
    canvas.style.height = cssHeight + "px";
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, cssWidth, cssHeight);

    const styles = getComputedStyle(document.documentElement);
    const surface2 = styles.getPropertyValue("--surface-2").trim() || "#171b2e";
    const accent = styles.getPropertyValue("--accent").trim() || "#6c8cff";
    const accent2 = styles.getPropertyValue("--accent-2").trim() || "#22d3ee";

    ctx2d.fillStyle = surface2;
    ctx2d.fillRect(0, 0, cssWidth, cssHeight);

    if (!buffer) return;

    const channels = buffer.numberOfChannels;
    const length = buffer.length;
    const mid = cssHeight / 2;
    const samplesPerPixel = Math.max(1, Math.floor(length / cssWidth));

    const gradient = ctx2d.createLinearGradient(0, 0, cssWidth, 0);
    gradient.addColorStop(0, accent);
    gradient.addColorStop(1, accent2);
    ctx2d.strokeStyle = gradient;
    ctx2d.lineWidth = 1;
    ctx2d.beginPath();

    const chData = [];
    for (let ch = 0; ch < channels; ch++) chData.push(buffer.getChannelData(ch));

    for (let x = 0; x < cssWidth; x++) {
      const start = x * samplesPerPixel;
      const end = Math.min(length, start + samplesPerPixel);
      let min = 1.0;
      let max = -1.0;
      for (let ch = 0; ch < channels; ch++) {
        const data = chData[ch];
        for (let i = start; i < end; i++) {
          const v = data[i];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      if (min > max) { min = 0; max = 0; }
      const y1 = mid - max * mid * 0.9;
      const y2 = mid - min * mid * 0.9;
      ctx2d.moveTo(x + 0.5, y1);
      ctx2d.lineTo(x + 0.5, Math.max(y1 + 1, y2));
    }
    ctx2d.stroke();

    ctx2d.strokeStyle = "rgba(128,128,128,0.25)";
    ctx2d.beginPath();
    ctx2d.moveTo(0, mid);
    ctx2d.lineTo(cssWidth, mid);
    ctx2d.stroke();
  }

  // ---------- UI sync ----------
  function updateFileInfo() {
    if (!currentBuffer) { fileNameLabel.textContent = "-"; fileSubLabel.textContent = "-"; return; }
    fileNameLabel.textContent = `${baseFileName}.${originalExt}`;
    const chLabel = currentBuffer.numberOfChannels === 1 ? "모노" : "스테레오";
    fileSubLabel.textContent = `${formatTime(currentBuffer.duration)} · ${currentBuffer.sampleRate.toLocaleString()} Hz · ${chLabel}`;
    durationLabel.textContent = formatTime(currentBuffer.duration);
  }

  function updateSelectionUI() {
    const dur = currentBuffer ? currentBuffer.duration : 1;
    const startPct = dur > 0 ? (selection.start / dur) * 100 : 0;
    const endPct = dur > 0 ? (selection.end / dur) * 100 : 100;
    selectionRegion.style.left = startPct + "%";
    selectionRegion.style.width = Math.max(0, endPct - startPct) + "%";
    startHandle.style.left = startPct + "%";
    endHandle.style.left = endPct + "%";
    trimStartInput.value = formatTime(selection.start);
    trimEndInput.value = formatTime(selection.end);

    if (dur > 0 && (selection.end - selection.start) < dur - 0.005) {
      selectionInfo.textContent = `선택 구간 ${formatTime(selection.end - selection.start)}`;
    } else {
      selectionInfo.textContent = "";
    }
  }

  function updatePlayheadUI(offsetSec) {
    const dur = currentBuffer ? currentBuffer.duration : 1;
    const pct = dur > 0 ? clamp((offsetSec / dur) * 100, 0, 100) : 0;
    playhead.style.left = pct + "%";
    currentTimeLabel.textContent = formatTime(offsetSec);
  }

  function resetSelectionToFull() {
    selection = { start: 0, end: currentBuffer ? currentBuffer.duration : 0 };
    updateSelectionUI();
  }

  function setVolumeUI(pct) {
    volumeSlider.value = pct;
    volumeLabel.textContent = pct + "%";
    volumeSlider.style.setProperty("--pct", pct / 2 + "%");
    volumeIcon.textContent = pct === 0 ? "🔇" : pct < 100 ? "🔉" : "🔊";
    presetBtns.forEach((b) => b.classList.toggle("active", parseInt(b.dataset.volume, 10) === pct));
  }

  // ---------- Playback ----------
  function stopSourceNode() {
    if (sourceNode) {
      try { sourceNode.onended = null; sourceNode.stop(); } catch (e) {}
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (liveGainNode) {
      liveGainNode.disconnect();
      liveGainNode = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function playFrom(offsetSec) {
    if (!currentBuffer) return;
    const ac = getAudioCtx();
    if (ac.state === "suspended") ac.resume();
    stopSourceNode();

    sourceNode = ac.createBufferSource();
    sourceNode.buffer = currentBuffer;
    liveGainNode = ac.createGain();
    liveGainNode.gain.value = parseInt(volumeSlider.value, 10) / 100;
    sourceNode.connect(liveGainNode).connect(ac.destination);

    const startOffset = clamp(offsetSec, 0, currentBuffer.duration);
    sourceNode.start(0, startOffset);
    playStartCtxTime = ac.currentTime;
    playStartOffset = startOffset;
    isPlaying = true;

    sourceNode.onended = () => {
      if (!isPlaying) return; // stopped manually / superseded
      isPlaying = false;
      pausedOffset = 0;
      updatePlayheadUI(0);
      setPlaybackButtons();
    };

    setPlaybackButtons();
    tick();
  }

  function tick() {
    if (!isPlaying) return;
    const ac = getAudioCtx();
    const elapsed = ac.currentTime - playStartCtxTime;
    const pos = playStartOffset + elapsed;
    if (pos >= currentBuffer.duration) {
      updatePlayheadUI(currentBuffer.duration);
      return;
    }
    updatePlayheadUI(pos);
    rafId = requestAnimationFrame(tick);
  }

  function pausePlayback() {
    if (!isPlaying) return;
    const ac = getAudioCtx();
    const elapsed = ac.currentTime - playStartCtxTime;
    pausedOffset = clamp(playStartOffset + elapsed, 0, currentBuffer.duration);
    isPlaying = false;
    stopSourceNode();
    updatePlayheadUI(pausedOffset);
    setPlaybackButtons();
  }

  function stopPlayback() {
    isPlaying = false;
    stopSourceNode();
    pausedOffset = 0;
    updatePlayheadUI(0);
    setPlaybackButtons();
  }

  function togglePlayback() {
    if (!currentBuffer) return;
    if (isPlaying) pausePlayback();
    else playFrom(pausedOffset);
  }

  function setPlaybackButtons() {
    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
    stopBtn.disabled = !isPlaying && pausedOffset === 0;
  }

  function seekTo(sec) {
    const wasPlaying = isPlaying;
    pausedOffset = clamp(sec, 0, currentBuffer ? currentBuffer.duration : 0);
    updatePlayheadUI(pausedOffset);
    if (wasPlaying) {
      playFrom(pausedOffset);
    }
  }

  // ---------- File loading ----------
  function showUploadScreen() {
    stopPlayback();
    originalBuffer = null;
    currentBuffer = null;
    editorSection.classList.add("hidden");
    uploadSection.classList.remove("hidden");
    fileInput.value = "";
  }

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const ac = getAudioCtx();
      ac.decodeAudioData(
        e.target.result.slice(0),
        (decoded) => {
          stopPlayback();
          originalBuffer = decoded;
          currentBuffer = cloneAudioBuffer(decoded);

          const dotIdx = file.name.lastIndexOf(".");
          baseFileName = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
          originalExt = dotIdx > 0 ? file.name.slice(dotIdx + 1).toLowerCase() : "wav";

          setVolumeUI(100);

          uploadSection.classList.add("hidden");
          editorSection.classList.remove("hidden");

          resetSelectionToFull();
          updateFileInfo();
          drawWaveform(currentBuffer);
          updatePlayheadUI(0);
          exportStatus.textContent = "";
        },
        (err) => {
          alert("오디오 파일을 디코딩할 수 없습니다: " + (err && err.message ? err.message : err));
        }
      );
    };
    reader.readAsArrayBuffer(file);
  }

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
  });
  ["dragenter", "dragover"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) loadFile(file);
  });

  changeFileBtn.addEventListener("click", showUploadScreen);

  // ---------- Playback controls ----------
  playBtn.addEventListener("click", () => playFrom(pausedOffset));
  pauseBtn.addEventListener("click", pausePlayback);
  stopBtn.addEventListener("click", stopPlayback);

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space") return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) return;
    if (!currentBuffer) return;
    e.preventDefault();
    togglePlayback();
  });

  resetBtn.addEventListener("click", () => {
    if (!originalBuffer) return;
    stopPlayback();
    currentBuffer = cloneAudioBuffer(originalBuffer);
    setVolumeUI(100);
    resetSelectionToFull();
    updateFileInfo();
    drawWaveform(currentBuffer);
    updatePlayheadUI(0);
    exportStatus.textContent = "원본으로 복원되었습니다.";
  });

  canvas.addEventListener("click", (e) => {
    if (!currentBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    seekTo(frac * currentBuffer.duration);
  });

  waveformWrap.addEventListener("mousemove", (e) => {
    if (!currentBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    hoverTime.textContent = formatTime(frac * currentBuffer.duration);
    hoverTime.style.left = frac * 100 + "%";
    hoverTime.classList.add("visible");
  });
  waveformWrap.addEventListener("mouseleave", () => {
    hoverTime.classList.remove("visible");
  });

  // ---------- Trim ----------
  function startDrag(handle, e) {
    e.preventDefault();
    dragging = handle;
  }
  startHandle.addEventListener("mousedown", (e) => startDrag("start", e));
  endHandle.addEventListener("mousedown", (e) => startDrag("end", e));
  startHandle.addEventListener("touchstart", (e) => startDrag("start", e), { passive: false });
  endHandle.addEventListener("touchstart", (e) => startDrag("end", e), { passive: false });

  function onDragMove(e) {
    if (!dragging || !currentBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const x = getEventX(e);
    const frac = clamp((x - rect.left) / rect.width, 0, 1);
    const t = frac * currentBuffer.duration;
    if (dragging === "start") {
      selection.start = clamp(t, 0, selection.end - MIN_GAP);
    } else {
      selection.end = clamp(t, selection.start + MIN_GAP, currentBuffer.duration);
    }
    updateSelectionUI();
  }
  function onDragEnd() {
    dragging = null;
  }
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("touchend", onDragEnd);

  trimStartInput.addEventListener("change", () => {
    if (!currentBuffer) return;
    const t = clamp(parseTime(trimStartInput.value), 0, selection.end - MIN_GAP);
    selection.start = t;
    updateSelectionUI();
  });
  trimEndInput.addEventListener("change", () => {
    if (!currentBuffer) return;
    const t = clamp(parseTime(trimEndInput.value), selection.start + MIN_GAP, currentBuffer.duration);
    selection.end = t;
    updateSelectionUI();
  });

  setStartBtn.addEventListener("click", () => {
    if (!currentBuffer) return;
    const pos = isPlaying
      ? playStartOffset + (getAudioCtx().currentTime - playStartCtxTime)
      : pausedOffset;
    selection.start = clamp(pos, 0, selection.end - MIN_GAP);
    updateSelectionUI();
  });
  setEndBtn.addEventListener("click", () => {
    if (!currentBuffer) return;
    const pos = isPlaying
      ? playStartOffset + (getAudioCtx().currentTime - playStartCtxTime)
      : pausedOffset;
    selection.end = clamp(pos, selection.start + MIN_GAP, currentBuffer.duration);
    updateSelectionUI();
  });

  applyTrimBtn.addEventListener("click", () => {
    if (!currentBuffer) return;
    if (selection.end - selection.start < MIN_GAP) {
      alert("자를 구간이 너무 짧습니다.");
      return;
    }
    stopPlayback();
    currentBuffer = sliceAudioBuffer(currentBuffer, selection.start, selection.end);
    resetSelectionToFull();
    updateFileInfo();
    drawWaveform(currentBuffer);
    updatePlayheadUI(0);
    exportStatus.textContent = "트림이 적용되었습니다.";
  });

  resetTrimBtn.addEventListener("click", () => {
    resetSelectionToFull();
  });

  // ---------- Volume ----------
  volumeSlider.addEventListener("input", () => {
    const pct = parseInt(volumeSlider.value, 10);
    setVolumeUI(pct);
    if (isPlaying && liveGainNode) {
      liveGainNode.gain.value = pct / 100;
    }
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const pct = parseInt(btn.dataset.volume, 10);
      setVolumeUI(pct);
      if (isPlaying && liveGainNode) liveGainNode.gain.value = pct / 100;
    });
  });

  applyVolumeBtn.addEventListener("click", () => {
    if (!currentBuffer) return;
    const factor = parseInt(volumeSlider.value, 10) / 100;
    if (factor === 1) {
      exportStatus.textContent = "볼륨이 100%이므로 변경 사항이 없습니다.";
      return;
    }
    const wasPlaying = isPlaying;
    const resumeOffset = wasPlaying
      ? playStartOffset + (getAudioCtx().currentTime - playStartCtxTime)
      : pausedOffset;
    stopPlayback();
    currentBuffer = applyGainToBuffer(currentBuffer, factor);
    setVolumeUI(100);
    drawWaveform(currentBuffer);
    exportStatus.textContent = "볼륨 변경이 적용되었습니다.";
    pausedOffset = clamp(resumeOffset, 0, currentBuffer.duration);
    updatePlayheadUI(pausedOffset);
    if (wasPlaying) playFrom(pausedOffset);
  });

  // ---------- Export ----------
  formatBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      exportFormat = btn.dataset.format;
      formatBtns.forEach((b) => b.classList.toggle("active", b === btn));
      bitrateWrap.style.display = exportFormat === "mp3" ? "inline-flex" : "none";
    });
  });

  function encodeWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = numFrames * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    function writeString(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    const channelData = [];
    for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let s = clamp(channelData[ch][i], -1, 1);
        s = s < 0 ? s * 0x8000 : s * 0x7fff;
        view.setInt16(offset, s, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  function floatTo16(data) {
    const out = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      let s = clamp(data[i], -1, 1);
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  function encodeMp3(buffer, kbps) {
    const numChannels = Math.min(2, buffer.numberOfChannels);
    const sampleRate = buffer.sampleRate;
    const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
    const blockSize = 1152;

    const left16 = floatTo16(buffer.getChannelData(0));
    const right16 = numChannels > 1 ? floatTo16(buffer.getChannelData(1)) : null;

    const mp3Chunks = [];
    for (let i = 0; i < left16.length; i += blockSize) {
      const leftChunk = left16.subarray(i, i + blockSize);
      let mp3buf;
      if (numChannels > 1) {
        const rightChunk = right16.subarray(i, i + blockSize);
        mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = encoder.encodeBuffer(leftChunk);
      }
      if (mp3buf.length > 0) mp3Chunks.push(mp3buf);
    }
    const endBuf = encoder.flush();
    if (endBuf.length > 0) mp3Chunks.push(endBuf);

    return new Blob(mp3Chunks, { type: "audio/mpeg" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  exportBtn.addEventListener("click", () => {
    if (!currentBuffer) return;
    exportBtn.disabled = true;
    exportStatus.textContent = "인코딩 중입니다. 잠시만 기다려 주세요...";

    setTimeout(() => {
      try {
        let blob, filename;
        if (exportFormat === "wav") {
          blob = encodeWav(currentBuffer);
          filename = `${baseFileName}.wav`;
        } else {
          const kbps = parseInt(bitrateSelect.value, 10);
          blob = encodeMp3(currentBuffer, kbps);
          filename = `${baseFileName}.mp3`;
        }
        downloadBlob(blob, filename);
        exportStatus.textContent = `내보내기 완료: ${filename} (${formatBytes(blob.size)})`;
      } catch (err) {
        console.error(err);
        exportStatus.textContent = "내보내기 중 오류가 발생했습니다: " + err.message;
      } finally {
        exportBtn.disabled = false;
      }
    }, 30);
  });

  // ---------- Resize ----------
  window.addEventListener("resize", () => {
    if (currentBuffer) drawWaveform(currentBuffer);
  });

  bitrateWrap.style.display = exportFormat === "mp3" ? "inline-flex" : "none";
  setVolumeUI(100);
  setPlaybackButtons();
})();
