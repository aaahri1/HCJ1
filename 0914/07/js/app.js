/**
 * Smart Image Resizer - Main Application Logic
 * NanaLab (https://nanalab.kr)
 */

(function () {
  'use strict';

  // --- State Configuration ---
  const state = {
    aspectRatio: '1:1',
    customWidth: 5,
    customHeight: 7,
    mode: 'padding', // 'padding' | 'crop'
    marginColor: '#ffffff',
    outputFormat: 'original', // 'original' | 'image/png' | 'image/jpeg' | 'image/webp'
    outputResolution: 'auto', // 'auto' | '1080' | '1440' | '2160'
    items: [], // Array of image items
    isProcessingQueue: false
  };

  // --- DOM Elements ---
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  const itemsList = document.getElementById('itemsList');
  const emptyQueue = document.getElementById('emptyQueue');
  const queueCountBadge = document.getElementById('queueCountBadge');
  const queueStatusDesc = document.getElementById('queueStatusDesc');
  const batchZipBtn = document.getElementById('batchZipBtn');
  const batchZipText = document.getElementById('batchZipText');
  const reprocessAllBtn = document.getElementById('reprocessAllBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Controls
  const ratioBtns = document.querySelectorAll('.ratio-btn');
  const customRatioContainer = document.getElementById('customRatioContainer');
  const customWidthInput = document.getElementById('customWidth');
  const customHeightInput = document.getElementById('customHeight');
  const applyCustomRatioBtn = document.getElementById('applyCustomRatioBtn');

  const modePaddingRadio = document.getElementById('modePadding');
  const modeCropRadio = document.getElementById('modeCrop');
  const modePaddingLabel = document.getElementById('modePaddingLabel');
  const modeCropLabel = document.getElementById('modeCropLabel');

  const marginColorPicker = document.getElementById('marginColorPicker');
  const marginColorHex = document.getElementById('marginColorHex');
  const colorPresetBtns = document.querySelectorAll('.color-preset-btn');
  const colorHelperTag = document.getElementById('colorHelperTag');

  const outputFormatSelect = document.getElementById('outputFormat');
  const outputResolutionSelect = document.getElementById('outputResolution');

  // Modal
  const previewModal = document.getElementById('previewModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCloseBtnFooter = document.getElementById('modalCloseBtnFooter');
  const modalOrigImg = document.getElementById('modalOrigImg');
  const modalResultImg = document.getElementById('modalResultImg');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalDownloadLink = document.getElementById('modalDownloadLink');

  const toastContainer = document.getElementById('toastContainer');

  // --- Initialization ---
  function init() {
    setupEventListeners();
    updateConfigUI();
    updateBatchStatus();
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // 1. Ratio Selection
    ratioBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        ratioBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');

        const ratio = btn.dataset.ratio;
        state.aspectRatio = ratio;

        if (ratio === 'custom') {
          customRatioContainer.classList.add('visible');
        } else {
          customRatioContainer.classList.remove('visible');
          reprocessAllItems();
        }
      });
    });

    // Custom Ratio Apply
    applyCustomRatioBtn.addEventListener('click', () => {
      const w = Math.max(1, parseInt(customWidthInput.value, 10) || 1);
      const h = Math.max(1, parseInt(customHeightInput.value, 10) || 1);
      state.customWidth = w;
      state.customHeight = h;
      showToast(`커스텀 비율 ${w}:${h} 설정 완료`, 'info');
      reprocessAllItems();
    });

    customWidthInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyCustomRatioBtn.click();
    });
    customHeightInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyCustomRatioBtn.click();
    });

    // 2. Mode Selection (Padding vs Crop)
    [modePaddingRadio, modeCropRadio].forEach((radio) => {
      radio.addEventListener('change', () => {
        state.mode = modePaddingRadio.checked ? 'padding' : 'crop';
        modePaddingLabel.classList.toggle('active', state.mode === 'padding');
        modeCropLabel.classList.toggle('active', state.mode === 'crop');

        if (state.mode === 'crop') {
          colorHelperTag.textContent = '(Crop 모드 미적용)';
          colorHelperTag.style.color = 'var(--text-muted)';
        } else {
          colorHelperTag.textContent = '(Padding 전용)';
          colorHelperTag.style.color = 'var(--text-secondary)';
        }

        reprocessAllItems();
      });
    });

    // 3. Margin Color Picker & Presets
    marginColorPicker.addEventListener('input', (e) => {
      setColor(e.target.value);
    });

    marginColorHex.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#') && val !== 'transparent') val = '#' + val;
      setColor(val);
    });

    colorPresetBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        setColor(btn.dataset.color);
      });
    });

    // 4. Output Format & Resolution
    outputFormatSelect.addEventListener('change', (e) => {
      state.outputFormat = e.target.value;
      if (state.mode === 'padding' && state.outputFormat === 'image/jpeg' && state.marginColor === 'transparent') {
        // JPEG has no alpha channel, so transparent margins would render as black.
        setColor('#ffffff');
        showToast('JPEG 포맷은 투명 배경을 지원하지 않아 여백 색상이 흰색으로 변경되었습니다.', 'info');
      } else {
        reprocessAllItems();
      }
    });

    outputResolutionSelect.addEventListener('change', (e) => {
      state.outputResolution = e.target.value;
      reprocessAllItems();
    });

    // 5. Drag & Drop Zone
    ['dragenter', 'dragover'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleIncomingFiles(files);
      }
    });

    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    dropZone.addEventListener('click', (e) => {
      if (e.target !== browseBtn && e.target !== loadSampleBtn) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleIncomingFiles(e.target.files);
        fileInput.value = ''; // Reset for re-selection
      }
    });

    // Sample Images
    loadSampleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      generateSampleImages();
    });

    // 6. Queue Actions
    reprocessAllBtn.addEventListener('click', () => {
      reprocessAllItems();
      showToast('모든 이미지를 새 설정으로 다시 처리합니다.', 'info');
    });

    clearAllBtn.addEventListener('click', () => {
      if (state.items.length === 0) return;
      if (confirm('대기열의 모든 이미지를 삭제하시겠습니까?')) {
        state.items.forEach((item) => {
          if (item.origUrl) URL.revokeObjectURL(item.origUrl);
          if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
        });
        state.items = [];
        renderQueueList();
        updateBatchStatus();
        showToast('대기열이 초기화되었습니다.', 'info');
      }
    });

    // 7. Batch Zip Download
    batchZipBtn.addEventListener('click', () => {
      downloadAllAsZip();
    });

    // 8. Modal Events
    [modalCloseBtn, modalCloseBtnFooter].forEach((btn) => {
      btn.addEventListener('click', closeModal);
    });

    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && previewModal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // --- Helper: Set Color ---
  function setColor(color) {
    state.marginColor = color;
    if (color === 'transparent') {
      marginColorHex.value = 'TRANSPARENT';
      // Switch format to PNG automatically if transparent
      if (state.outputFormat === 'original' || state.outputFormat === 'image/jpeg') {
        outputFormatSelect.value = 'image/png';
        state.outputFormat = 'image/png';
        showToast('투명 배경을 위해 PNG 포맷으로 자동 변경되었습니다.', 'info');
      }
    } else {
      marginColorPicker.value = color.startsWith('#') && color.length === 7 ? color : '#ffffff';
      marginColorHex.value = color.toUpperCase();
    }

    colorPresetBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.color.toLowerCase() === color.toLowerCase());
    });

    if (state.mode === 'padding') {
      reprocessAllItems();
    }
  }

  function updateConfigUI() {
    marginColorPicker.value = state.marginColor;
    marginColorHex.value = state.marginColor.toUpperCase();
  }

  // --- Aspect Ratio Calculation ---
  function getCurrentAspectRatio() {
    if (state.aspectRatio === '1:1') return { w: 1, h: 1, ratio: 1 };
    if (state.aspectRatio === '3:4') return { w: 3, h: 4, ratio: 3 / 4 };
    if (state.aspectRatio === '4:3') return { w: 4, h: 3, ratio: 4 / 3 };
    if (state.aspectRatio === '9:16') return { w: 9, h: 16, ratio: 9 / 16 };
    if (state.aspectRatio === '16:9') return { w: 16, h: 9, ratio: 16 / 9 };
    if (state.aspectRatio === 'custom') {
      const w = Math.max(1, state.customWidth);
      const h = Math.max(1, state.customHeight);
      return { w, h, ratio: w / h };
    }
    return { w: 1, h: 1, ratio: 1 };
  }

  // --- Target Dimensions Calculation ---
  function computeTargetDimensions(origW, origH, targetRatio) {
    const origRatio = origW / origH;
    let targetW, targetH;

    if (state.outputResolution === 'auto') {
      if (state.mode === 'padding') {
        // In padding mode, fit original inside canvas without shrinking original quality
        if (origRatio >= targetRatio) {
          targetW = origW;
          targetH = Math.round(origW / targetRatio);
        } else {
          targetH = origH;
          targetW = Math.round(origH * targetRatio);
        }
      } else {
        // In crop mode, canvas is covered by original image
        if (origRatio >= targetRatio) {
          targetH = origH;
          targetW = Math.round(origH * targetRatio);
        } else {
          targetW = origW;
          targetH = Math.round(origW / targetRatio);
        }
      }
    } else {
      // Fixed resolution presets: longest edge
      const maxDim = parseInt(state.outputResolution, 10);
      if (targetRatio >= 1) {
        targetW = maxDim;
        targetH = Math.round(maxDim / targetRatio);
      } else {
        targetH = maxDim;
        targetW = Math.round(maxDim * targetRatio);
      }
    }

    // Ensure dimensions are at least 1px
    targetW = Math.max(1, Math.round(targetW));
    targetH = Math.max(1, Math.round(targetH));

    return { targetW, targetH };
  }

  // --- Handle Incoming Files ---
  function handleIncomingFiles(fileList) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/bmp'];
    const newItems = [];

    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith('image/') && !validImageTypes.includes(file.type)) {
        showToast(`${file.name} 파일은 이미지 형식이 아닙니다.`, 'error');
        return;
      }

      const id = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const item = {
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        origUrl: URL.createObjectURL(file),
        imgElement: null,
        origWidth: 0,
        origHeight: 0,
        targetWidth: 0,
        targetHeight: 0,
        resultBlob: null,
        resultUrl: null,
        progress: 0,
        status: 'queued', // 'queued' | 'processing' | 'done' | 'error'
        errorMsg: ''
      };

      state.items.unshift(item); // Add to beginning of queue
      newItems.push(item);
    });

    if (newItems.length > 0) {
      renderQueueList();
      showToast(`${newItems.length}개의 이미지가 추가되었습니다.`, 'info');
      // Process new items
      newItems.forEach((item) => processItem(item));
    }
  }

  // --- Render Queue List ---
  function renderQueueList() {
    emptyQueue.style.display = state.items.length === 0 ? 'flex' : 'none';
    queueCountBadge.textContent = `${state.items.length}개 이미지`;

    // Retain existing DOM cards if already present, or re-render
    itemsList.innerHTML = '';
    if (state.items.length === 0) {
      itemsList.appendChild(emptyQueue);
      return;
    }

    state.items.forEach((item) => {
      const card = createItemCardDOM(item);
      itemsList.appendChild(card);
    });

    updateBatchStatus();
  }

  // --- Create Single Item Card DOM ---
  function createItemCardDOM(item) {
    const card = document.createElement('div');
    card.className = 'queue-item-card';
    card.id = `card_${item.id}`;

    const formattedSize = formatBytes(item.size);
    const origSpec = item.origWidth > 0 ? `${item.origWidth}×${item.origHeight}` : '분석 중';
    const targetSpec = item.targetWidth > 0 ? `${item.targetWidth}×${item.targetHeight}` : '대기';

    const statusText = item.status === 'done' ? '완료' : (item.status === 'processing' ? '처리 중' : '대기 중');
    const statusClass = item.status === 'done' ? 'completed' : 'processing';

    card.innerHTML = `
      <div class="item-thumb-wrapper" title="클릭하여 미리보기">
        <img src="${item.resultUrl || item.origUrl}" class="item-thumb-img" alt="${escapeHtml(item.name)}">
      </div>
      <div class="item-center-wrap">
        <div class="item-title-row">
          <span class="item-filename" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="item-status-pill ${statusClass}" id="statusPill_${item.id}">${statusText}</span>
        </div>
        <div class="item-meta-row">
          <span class="meta-spec">원본: <strong id="origSpec_${item.id}">${origSpec}</strong> (${formattedSize})</span>
          <span class="meta-arrow">→</span>
          <span class="meta-spec">변환: <strong id="targetSpec_${item.id}">${targetSpec}</strong></span>
          <span class="meta-spec">모드: <strong id="modeSpec_${item.id}">${state.mode.toUpperCase()}</strong></span>
        </div>
        <div class="progress-container">
          <div class="progress-track">
            <div class="progress-bar-fill" id="pBar_${item.id}" style="width: ${item.progress}%"></div>
          </div>
          <span class="progress-percent-text" id="pText_${item.id}">${item.progress}%</span>
        </div>
      </div>
      <div class="item-actions">
        <button type="button" class="action-icon-btn btn-preview" title="상세 미리보기" id="btnPreview_${item.id}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <a class="btn btn-primary btn-sm btn-download-single" id="btnDownload_${item.id}" ${item.progress < 100 ? 'disabled' : ''} download="${getDownloadFileName(item)}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          다운로드
        </a>
        <button type="button" class="action-icon-btn btn-remove" title="목록에서 삭제" id="btnRemove_${item.id}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    // Attach card action events
    const thumbWrapper = card.querySelector('.item-thumb-wrapper');
    const previewBtn = card.querySelector(`#btnPreview_${item.id}`);
    const downloadBtn = card.querySelector(`#btnDownload_${item.id}`);
    const removeBtn = card.querySelector(`#btnRemove_${item.id}`);

    const openPreview = () => openModal(item);
    thumbWrapper.addEventListener('click', openPreview);
    previewBtn.addEventListener('click', openPreview);

    downloadBtn.addEventListener('click', (e) => {
      if (item.progress < 100 || !item.resultBlob) {
        e.preventDefault();
        return;
      }
      // Native download will proceed with href
    });

    removeBtn.addEventListener('click', () => {
      removeItem(item.id);
    });

    if (item.resultUrl) {
      downloadBtn.href = item.resultUrl;
    }

    return card;
  }

  // --- Remove Single Item ---
  function removeItem(id) {
    const idx = state.items.findIndex((it) => it.id === id);
    if (idx !== -1) {
      const item = state.items[idx];
      if (item.origUrl) URL.revokeObjectURL(item.origUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      state.items.splice(idx, 1);
      renderQueueList();
      showToast('이미지가 삭제되었습니다.', 'info');
    }
  }

  // --- Process Single Item with Animated Progress ---
  async function processItem(item) {
    item.status = 'processing';
    item.progress = 0;
    updateItemCardUI(item);

    try {
      // 1. Load image object if not loaded
      if (!item.imgElement) {
        item.imgElement = await loadImageAsync(item.origUrl);
        item.origWidth = item.imgElement.naturalWidth;
        item.origHeight = item.imgElement.naturalHeight;
      }

      await updateProgressStep(item, 25);

      // 2. Compute target canvas size
      const targetRatioObj = getCurrentAspectRatio();
      const { targetW, targetH } = computeTargetDimensions(
        item.origWidth,
        item.origHeight,
        targetRatioObj.ratio
      );
      item.targetWidth = targetW;
      item.targetHeight = targetH;

      await updateProgressStep(item, 55);

      // 3. Render on Offscreen Canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      // Quality rendering settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (state.mode === 'padding') {
        // Fill canvas background if not transparent
        if (state.marginColor === 'transparent') {
          ctx.clearRect(0, 0, targetW, targetH);
        } else {
          ctx.fillStyle = state.marginColor;
          ctx.fillRect(0, 0, targetW, targetH);
        }

        // Fit image maintaining aspect ratio
        const scale = Math.min(targetW / item.origWidth, targetH / item.origHeight);
        const drawW = item.origWidth * scale;
        const drawH = item.origHeight * scale;
        const drawX = (targetW - drawW) / 2;
        const drawY = (targetH - drawH) / 2;

        ctx.drawImage(item.imgElement, drawX, drawY, drawW, drawH);
      } else {
        // Crop mode: fill canvas completely and center crop
        const scale = Math.max(targetW / item.origWidth, targetH / item.origHeight);
        const drawW = item.origWidth * scale;
        const drawH = item.origHeight * scale;
        const drawX = (targetW - drawW) / 2;
        const drawY = (targetH - drawH) / 2;

        ctx.drawImage(item.imgElement, drawX, drawY, drawW, drawH);
      }

      await updateProgressStep(item, 85);

      // 4. Export Canvas to Blob
      const mimeType = resolveMimeType(item.type, state.outputFormat);
      const quality = mimeType === 'image/jpeg' || mimeType === 'image/webp' ? 0.92 : undefined;

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, mimeType, quality);
      });

      if (item.resultUrl) {
        URL.revokeObjectURL(item.resultUrl);
      }
      item.resultBlob = blob;
      item.resultUrl = URL.createObjectURL(blob);
      item.mimeType = mimeType;

      await updateProgressStep(item, 100);

      // Done
      item.status = 'done';
      updateItemCardUI(item);
    } catch (err) {
      console.error('Image processing failed:', err);
      item.status = 'error';
      item.errorMsg = err.message || '처리 오류';
      updateItemCardUI(item);
      showToast(`'${item.name}' 처리 중 오류가 발생했습니다.`, 'error');
    }

    updateBatchStatus();
  }

  // --- Smooth Progress Bar Step ---
  function updateProgressStep(item, targetPercent) {
    return new Promise((resolve) => {
      const current = item.progress;
      const step = targetPercent > current ? 5 : -5;
      const interval = setInterval(() => {
        if ((step > 0 && item.progress >= targetPercent) || (step < 0 && item.progress <= targetPercent)) {
          item.progress = targetPercent;
          clearInterval(interval);
          updateItemCardUI(item);
          resolve();
        } else {
          item.progress += step;
          updateItemCardUI(item);
        }
      }, 16);
    });
  }

  // --- Update Single Item UI ---
  function updateItemCardUI(item) {
    const pBar = document.getElementById(`pBar_${item.id}`);
    const pText = document.getElementById(`pText_${item.id}`);
    const statusPill = document.getElementById(`statusPill_${item.id}`);
    const origSpec = document.getElementById(`origSpec_${item.id}`);
    const targetSpec = document.getElementById(`targetSpec_${item.id}`);
    const modeSpec = document.getElementById(`modeSpec_${item.id}`);
    const downloadBtn = document.getElementById(`btnDownload_${item.id}`);
    const card = document.getElementById(`card_${item.id}`);

    if (pBar) pBar.style.width = `${item.progress}%`;
    if (pText) pText.textContent = `${item.progress}%`;

    if (origSpec && item.origWidth > 0) {
      origSpec.textContent = `${item.origWidth}×${item.origHeight}`;
    }
    if (targetSpec && item.targetWidth > 0) {
      targetSpec.textContent = `${item.targetWidth}×${item.targetHeight}`;
    }
    if (modeSpec) {
      modeSpec.textContent = state.mode.toUpperCase();
    }

    if (statusPill) {
      if (item.status === 'done') {
        statusPill.textContent = '완료';
        statusPill.className = 'item-status-pill completed';
      } else if (item.status === 'processing') {
        statusPill.textContent = `처리중 ${item.progress}%`;
        statusPill.className = 'item-status-pill processing';
      } else if (item.status === 'error') {
        statusPill.textContent = '오류';
        statusPill.className = 'item-status-pill';
        statusPill.style.background = 'rgba(244, 63, 94, 0.2)';
        statusPill.style.color = '#fda4af';
      }
    }

    // Update thumbnail when result is ready
    if (card && item.resultUrl) {
      const img = card.querySelector('.item-thumb-img');
      if (img && img.src !== item.resultUrl) {
        img.src = item.resultUrl;
      }
    }

    // Enable / Disable Download button
    if (downloadBtn) {
      if (item.progress === 100 && item.resultBlob) {
        downloadBtn.removeAttribute('disabled');
        downloadBtn.href = item.resultUrl;
        downloadBtn.download = getDownloadFileName(item);
      } else {
        downloadBtn.setAttribute('disabled', 'true');
      }
    }
  }

  // --- Reprocess All Items ---
  function reprocessAllItems() {
    if (state.items.length === 0) return;
    state.items.forEach((item) => {
      processItem(item);
    });
  }

  // --- Update Batch Download Button Status ---
  function updateBatchStatus() {
    if (state.items.length === 0) {
      batchZipBtn.disabled = true;
      batchZipText.textContent = '일괄 다운로드 (.ZIP)';
      queueStatusDesc.textContent = '사진을 추가하면 자동으로 리사이즈 처리가 시작됩니다.';
      return;
    }

    const allCompleted = state.items.every((it) => it.status === 'done' && it.progress === 100 && it.resultBlob);
    const completedCount = state.items.filter((it) => it.status === 'done').length;

    if (allCompleted) {
      batchZipBtn.disabled = false;
      batchZipText.textContent = `일괄 다운로드 (${state.items.length}개 .ZIP)`;
      queueStatusDesc.textContent = `모든 사진(${state.items.length}개)의 변환 작업이 완료되었습니다. 일괄 다운로드 가능합니다.`;
    } else {
      batchZipBtn.disabled = true;
      batchZipText.textContent = `처리 진행 중 (${completedCount}/${state.items.length})`;
      queueStatusDesc.textContent = `이미지 변환 진행 중... (${completedCount}/${state.items.length} 완료)`;
    }
  }

  // --- Batch Download as ZIP (JSZip) ---
  async function downloadAllAsZip() {
    if (!window.JSZip) {
      showToast('JSZip 라이브러리를 불러오지 못했습니다.', 'error');
      return;
    }

    const completedItems = state.items.filter((it) => it.resultBlob);
    if (completedItems.length === 0) {
      showToast('다운로드할 변환 완료 이미지가 없습니다.', 'error');
      return;
    }

    batchZipBtn.disabled = true;
    const origText = batchZipText.textContent;
    batchZipText.textContent = 'ZIP 압축 파일 생성 중...';
    showToast('압축 파일을 생성하고 있습니다. 잠시만 기다려주세요...', 'info');

    try {
      const zip = new window.JSZip();
      const folder = zip.folder('resized_images');

      // Add files with duplicate name collision handling
      const nameMap = new Map();
      completedItems.forEach((item) => {
        let filename = getDownloadFileName(item);
        if (nameMap.has(filename)) {
          const count = nameMap.get(filename) + 1;
          nameMap.set(filename, count);
          const parts = filename.split('.');
          const ext = parts.pop();
          filename = `${parts.join('.')}_${count}.${ext}`;
        } else {
          nameMap.set(filename, 1);
        }
        folder.file(filename, item.resultBlob);
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Trigger Zip Download
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `smart_resized_images_${state.aspectRatio.replace(':', 'x')}_${state.mode}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      showToast('성공적으로 ZIP 파일 다운로드를 시작했습니다!', 'success');
    } catch (err) {
      console.error('ZIP generation failed:', err);
      showToast('압축 파일 생성에 실패했습니다.', 'error');
    } finally {
      batchZipBtn.disabled = false;
      batchZipText.textContent = origText;
    }
  }

  // --- Image Loader Helper ---
  function loadImageAsync(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('이미지 로딩 실패'));
      img.src = url;
    });
  }

  // --- Filename Helper ---
  function getDownloadFileName(item) {
    const originalName = item.name;
    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
    
    // Determine extension
    let ext = 'png';
    const mime = item.mimeType || resolveMimeType(item.type, state.outputFormat);
    if (mime === 'image/jpeg') ext = 'jpg';
    else if (mime === 'image/webp') ext = 'webp';
    else if (mime === 'image/png') ext = 'png';

    const ratioTag = state.aspectRatio === 'custom' ? `${state.customWidth}x${state.customHeight}` : state.aspectRatio.replace(':', 'x');
    return `${baseName}_${ratioTag}_${state.mode}.${ext}`;
  }

  function resolveMimeType(originalMime, formatSetting) {
    if (formatSetting === 'image/png') return 'image/png';
    if (formatSetting === 'image/jpeg') return 'image/jpeg';
    if (formatSetting === 'image/webp') return 'image/webp';
    if (originalMime === 'image/jpeg' || originalMime === 'image/jpg') return 'image/jpeg';
    if (originalMime === 'image/webp') return 'image/webp';
    return 'image/png'; // Default safe format
  }

  // --- Modal Functions ---
  function openModal(item) {
    modalTitle.textContent = item.name;
    const ratioStr = state.aspectRatio === 'custom' ? `${state.customWidth}:${state.customHeight}` : state.aspectRatio;
    modalMeta.textContent = `비율 ${ratioStr} | 모드: ${state.mode.toUpperCase()} | 원본: ${item.origWidth}×${item.origHeight} → 결과: ${item.targetWidth}×${item.targetHeight}`;

    modalOrigImg.src = item.origUrl;
    modalResultImg.src = item.resultUrl || item.origUrl;

    if (item.resultBlob) {
      modalDownloadLink.removeAttribute('disabled');
      modalDownloadLink.href = item.resultUrl;
      modalDownloadLink.download = getDownloadFileName(item);
      modalDownloadLink.style.display = 'inline-flex';
    } else {
      modalDownloadLink.setAttribute('disabled', 'true');
      modalDownloadLink.style.display = 'none';
    }

    previewModal.classList.add('active');
    previewModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    previewModal.classList.remove('active');
    previewModal.setAttribute('aria-hidden', 'true');
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3200);
  }

  // --- Sample Images Generator ---
  function generateSampleImages() {
    showToast('체험용 샘플 이미지 3종을 생성하는 중입니다...', 'info');

    const samples = [
      { name: 'sample-landscape.jpg', width: 1200, height: 675, bg: '#3b82f6', text: '16:9 Landscape' },
      { name: 'sample-portrait.jpg', width: 720, height: 1280, bg: '#ec4899', text: '9:16 Portrait' },
      { name: 'sample-square.jpg', width: 900, height: 900, bg: '#10b981', text: '1:1 Square' }
    ];

    const blobs = [];
    samples.forEach((s) => {
      const c = document.createElement('canvas');
      c.width = s.width;
      c.height = s.height;
      const ctx = c.getContext('2d');

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, s.width, s.height);
      grad.addColorStop(0, s.bg);
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, s.width, s.height);

      // Decorative shapes
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(s.width * 0.7, s.height * 0.3, s.width * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(s.width * 0.06)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.text, s.width / 2, s.height / 2 - 20);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = `${Math.round(s.width * 0.035)}px Inter, sans-serif`;
      ctx.fillText(`${s.width} × ${s.height}`, s.width / 2, s.height / 2 + 40);

      c.toBlob((blob) => {
        const file = new File([blob], s.name, { type: 'image/jpeg' });
        blobs.push(file);
        if (blobs.length === samples.length) {
          handleIncomingFiles(blobs);
        }
      }, 'image/jpeg', 0.9);
    });
  }

  // --- Utility Functions ---
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
