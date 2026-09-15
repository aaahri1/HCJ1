(() => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileListSection = document.getElementById('file-list-section');
  const fileListEl = document.getElementById('file-list');
  const fileCountEl = document.getElementById('file-count');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const mergeBtn = document.getElementById('merge-btn');
  const statusEl = document.getElementById('status');
  const resultEl = document.getElementById('result');
  const downloadLink = document.getElementById('download-link');

  /** @type {{id: number, file: File}[]} */
  let files = [];
  let nextId = 1;
  let lastDownloadUrl = null;

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle('error', isError);
  }

  function render() {
    fileListSection.hidden = files.length === 0;
    fileCountEl.textContent = String(files.length);
    mergeBtn.disabled = files.length < 2;

    fileListEl.innerHTML = '';
    files.forEach((entry, index) => {
      const li = document.createElement('li');
      li.className = 'file-item';

      const badge = document.createElement('div');
      badge.className = 'order-badge';
      badge.textContent = String(index + 1);

      const info = document.createElement('div');
      info.className = 'file-info';
      const name = document.createElement('div');
      name.className = 'file-name';
      name.textContent = entry.file.name;
      name.title = entry.file.name;
      const size = document.createElement('div');
      size.className = 'file-size';
      size.textContent = formatSize(entry.file.size);
      info.appendChild(name);
      info.appendChild(size);

      const actions = document.createElement('div');
      actions.className = 'file-actions';

      const upBtn = document.createElement('button');
      upBtn.className = 'icon-btn';
      upBtn.textContent = '▲';
      upBtn.title = '위로 이동';
      upBtn.disabled = index === 0;
      upBtn.addEventListener('click', () => moveFile(index, -1));

      const downBtn = document.createElement('button');
      downBtn.className = 'icon-btn';
      downBtn.textContent = '▼';
      downBtn.title = '아래로 이동';
      downBtn.disabled = index === files.length - 1;
      downBtn.addEventListener('click', () => moveFile(index, 1));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'icon-btn remove';
      removeBtn.textContent = '✕';
      removeBtn.title = '삭제';
      removeBtn.addEventListener('click', () => removeFile(entry.id));

      actions.appendChild(upBtn);
      actions.appendChild(downBtn);
      actions.appendChild(removeBtn);

      li.appendChild(badge);
      li.appendChild(info);
      li.appendChild(actions);
      fileListEl.appendChild(li);
    });
  }

  function moveFile(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= files.length) return;
    [files[index], files[target]] = [files[target], files[index]];
    render();
  }

  function removeFile(id) {
    files = files.filter((entry) => entry.id !== id);
    render();
    setStatus('');
    hideResult();
  }

  function hideResult() {
    resultEl.hidden = true;
    if (lastDownloadUrl) {
      URL.revokeObjectURL(lastDownloadUrl);
      lastDownloadUrl = null;
    }
  }

  function addFiles(fileListLike) {
    const incoming = Array.from(fileListLike || []);
    const pdfFiles = incoming.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    const rejected = incoming.length - pdfFiles.length;

    pdfFiles.forEach((file) => {
      files.push({ id: nextId++, file });
    });

    render();
    hideResult();

    if (rejected > 0) {
      setStatus(`PDF 파일이 아닌 ${rejected}개 항목은 제외되었습니다.`, true);
    } else if (pdfFiles.length > 0) {
      setStatus(`${pdfFiles.length}개 파일이 추가되었습니다.`);
    }
  }

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });
  dropZone.setAttribute('tabindex', '0');
  dropZone.setAttribute('role', 'button');

  fileInput.addEventListener('change', (e) => {
    addFiles(e.target.files);
    fileInput.value = '';
  });

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
    addFiles(e.dataTransfer.files);
  });

  clearAllBtn.addEventListener('click', () => {
    files = [];
    render();
    setStatus('');
    hideResult();
  });

  mergeBtn.addEventListener('click', async () => {
    if (files.length < 2) return;

    mergeBtn.disabled = true;
    setStatus('병합 중입니다...');
    hideResult();

    try {
      const { PDFDocument } = PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const entry of files) {
        const arrayBuffer = await entry.file.arrayBuffer();
        let sourcePdf;
        try {
          sourcePdf = await PDFDocument.load(arrayBuffer);
        } catch (err) {
          throw new Error(`"${entry.file.name}" 파일을 읽을 수 없습니다. 손상되었거나 암호로 보호된 PDF일 수 있습니다.`);
        }
        const pageIndices = sourcePdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });
      lastDownloadUrl = URL.createObjectURL(blob);

      downloadLink.href = lastDownloadUrl;
      resultEl.hidden = false;
      setStatus(`병합 완료: 총 ${files.length}개 파일을 하나로 합쳤습니다.`);
    } catch (err) {
      console.error(err);
      setStatus(err.message || '병합 중 오류가 발생했습니다.', true);
    } finally {
      mergeBtn.disabled = files.length < 2;
    }
  });

  render();
})();
