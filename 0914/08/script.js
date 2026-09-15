(() => {
  const MAX_FPS = 29;        // hard cap requested by spec
  const MAX_FRAMES = 150;    // keeps long videos from taking forever
  const MAX_WIDTH = 480;     // downscale for fast, reasonably small GIFs

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileList = document.getElementById('fileList');

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length) handleFiles(dt.files);
  });

  function handleFiles(fileListObj) {
    const files = Array.from(fileListObj).filter(f => f.type.startsWith('video/'));
    files.forEach(processFile);
  }

  function processFile(file) {
    const item = createFileItem(file);
    fileList.prepend(item.el);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = URL.createObjectURL(file);

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) {
        item.setError('영상 길이를 읽을 수 없습니다');
        return;
      }

      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      const width = Math.max(1, Math.round(video.videoWidth * scale));
      const height = Math.max(1, Math.round(video.videoHeight * scale));

      const fps = Math.min(MAX_FPS, Math.max(1, Math.floor(MAX_FRAMES / duration)));
      const totalFrames = Math.max(1, Math.min(MAX_FRAMES, Math.round(duration * fps)));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      video.currentTime = 0;
      video.addEventListener('seeked', function onFirstSeek() {
        video.removeEventListener('seeked', onFirstSeek);
        ctx.drawImage(video, 0, 0, width, height);
        item.setThumb(canvas.toDataURL('image/jpeg', 0.8));
        extractFrames(video, canvas, ctx, width, height, totalFrames, fps, duration, item, file);
      }, { once: true });
    });

    video.addEventListener('error', () => {
      item.setError('동영상을 불러올 수 없습니다');
    });
  }

  function extractFrames(video, canvas, ctx, width, height, totalFrames, fps, duration, item, file) {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: 'libs/gif.worker.js'
    });

    let frameIndex = 0;
    // GIF delay is stored in 10ms units; round UP so playback never exceeds the fps cap
    const delay = Math.ceil(1000 / fps / 10) * 10;

    function finish() {
      video.removeEventListener('seeked', onSeek);
      item.setStatus('GIF로 변환 중...');
      gif.on('progress', (p) => {
        item.setProgress(50 + p * 50);
      });
      gif.on('finished', (blob) => {
        item.setProgress(100);
        item.setDone(blob, file.name);
      });
      gif.render();
    }

    function processFrame() {
      ctx.drawImage(video, 0, 0, width, height);
      gif.addFrame(ctx, { copy: true, delay });
      frameIndex++;
      item.setProgress((frameIndex / totalFrames) * 50);

      if (frameIndex >= totalFrames) {
        finish();
      } else {
        captureNext();
      }
    }

    function captureNext() {
      const t = Math.min(duration - 0.001, (frameIndex / totalFrames) * duration);
      if (Math.abs(video.currentTime - t) < 0.0005) {
        // already at the target time (e.g. the first frame reused from the thumbnail) - no seek event will fire
        processFrame();
      } else {
        video.currentTime = t;
      }
    }

    function onSeek() {
      processFrame();
    }

    video.addEventListener('seeked', onSeek);
    captureNext();
  }

  function createFileItem(file) {
    const el = document.createElement('div');
    el.className = 'file-item';

    const thumb = document.createElement('img');
    thumb.className = 'file-thumb';
    thumb.alt = file.name;

    const info = document.createElement('div');
    info.className = 'file-info';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;

    const track = document.createElement('div');
    track.className = 'progress-track';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    track.appendChild(fill);

    const status = document.createElement('div');
    status.className = 'file-status';
    status.textContent = '프레임 추출 중...';

    info.appendChild(name);
    info.appendChild(track);
    info.appendChild(status);

    const action = document.createElement('div');
    action.className = 'file-action';

    el.appendChild(thumb);
    el.appendChild(info);
    el.appendChild(action);

    return {
      el,
      setThumb(dataUrl) { thumb.src = dataUrl; },
      setProgress(pct) {
        const clamped = Math.max(0, Math.min(100, pct));
        fill.style.width = clamped.toFixed(0) + '%';
        if (clamped < 50) status.textContent = `프레임 추출 중... (${clamped.toFixed(0)}%)`;
        else if (clamped < 100) status.textContent = `GIF 인코딩 중... (${clamped.toFixed(0)}%)`;
      },
      setStatus(text) { status.textContent = text; },
      setError(text) {
        status.textContent = text;
        status.classList.add('error');
        fill.style.background = '#ff5c5c';
      },
      setDone(blob, originalName) {
        status.textContent = '완료!';
        const url = URL.createObjectURL(blob);
        const dlName = originalName.replace(/\.[^/.]+$/, '') + '.gif';
        const link = document.createElement('a');
        link.className = 'download-btn';
        link.href = url;
        link.download = dlName;
        link.textContent = '다운로드';
        action.innerHTML = '';
        action.appendChild(link);
      }
    };
  }
})();
