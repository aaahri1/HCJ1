/**
 * Smart QR - Application Logic (Ultra HD & Interactive Cursor Gradient)
 * Real-time QR generation, Mouse-Tracking Gradients, Theme Customization, JPG Export, Clipboard Copy
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 0. Smooth Interactive Mouse Cursor Gradient Tracking (LERP 60fps)
  // =========================================================================
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
    }
  }, { passive: true });

  function updateMouseGradient() {
    // Smooth linear interpolation for a luxurious liquid glide feel
    currentX += (mouseX - currentX) * 0.07;
    currentY += (mouseY - currentY) * 0.07;

    const width = window.innerWidth || 1920;
    const height = window.innerHeight || 1080;
    const xNorm = currentX / width;
    const yNorm = currentY / height;

    // Angle relative to center of screen
    const dx = currentX - (width / 2);
    const dy = currentY - (height / 2);
    const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
    const angleNorm = (angleDeg / 180).toFixed(3);

    // Dynamic hue shift (-24deg to +24deg) shifting between golden honey, warm apricot, and soft coral
    const hueShift = ((xNorm - 0.5) * 36 + (yNorm - 0.5) * 14).toFixed(2);

    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--mouse-x', `${currentX.toFixed(1)}px`);
    rootStyle.setProperty('--mouse-y', `${currentY.toFixed(1)}px`);
    rootStyle.setProperty('--mouse-x-norm', xNorm.toFixed(3));
    rootStyle.setProperty('--mouse-y-norm', yNorm.toFixed(3));
    rootStyle.setProperty('--mouse-angle-norm', angleNorm);
    rootStyle.setProperty('--hue-shift', `${hueShift}deg`);

    requestAnimationFrame(updateMouseGradient);
  }

  updateMouseGradient();

  // =========================================================================
  // DOM Elements
  // =========================================================================
  const appLayout = document.querySelector('.app-layout');
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const inputWrapper = document.querySelector('.input-wrapper');
  const clearBtn = document.getElementById('clearBtn');
  const qrSection = document.getElementById('qrSection');
  const qrCard = document.getElementById('qrCard');
  const qrCodeContainer = document.getElementById('qrcode');
  const qrCodeWrapper = document.getElementById('qrCodeWrapper');
  const qrTargetUrl = document.getElementById('qrTargetUrl');
  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const toastContainer = document.getElementById('toastContainer');
  const hintChips = document.querySelectorAll('.chip-item');
  const colorDots = document.querySelectorAll('.color-dot');
  
  // Action Buttons
  const downloadJpgBtn = document.getElementById('downloadJpgBtn');
  const copyImgBtn = document.getElementById('copyImgBtn');
  const openLinkBtn = document.getElementById('openLinkBtn');

  // Application State
  let currentQrCodeInstance = null;
  let activeUrl = '';
  let activeColor = '#1c1917'; // Default Classic Noir

  // =========================================================================
  // 1. Input Change & Clear Button
  // =========================================================================
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      inputWrapper.classList.add('has-value');
    } else {
      inputWrapper.classList.remove('has-value');
    }
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    inputWrapper.classList.remove('has-value');
    urlInput.focus();
  });

  // =========================================================================
  // 2. Preset Quick Chips
  // =========================================================================
  hintChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const targetUrl = chip.getAttribute('data-url');
      if (targetUrl) {
        urlInput.value = targetUrl;
        inputWrapper.classList.add('has-value');
        generateQR(targetUrl);
      }
    });
  });

  // =========================================================================
  // 3. Color Theme Customization
  // =========================================================================
  colorDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const selectedColor = dot.getAttribute('data-color');
      if (!selectedColor || selectedColor === activeColor) return;

      // Update UI active state
      colorDots.forEach(d => {
        d.classList.remove('active');
        d.setAttribute('aria-checked', 'false');
      });
      dot.classList.add('active');
      dot.setAttribute('aria-checked', 'true');

      activeColor = selectedColor;

      // If a QR code is already visible, regenerate it immediately
      if (activeUrl) {
        generateQR(activeUrl, false);
        showToast('🎨 테마 색상이 반영되었습니다.');
      }
    });
  });

  // =========================================================================
  // 4. Form Submit Handler
  // =========================================================================
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputVal = urlInput.value.trim();
    if (!inputVal) {
      showToast('⚠️ 변환할 URL 주소를 입력해 주세요.');
      urlInput.focus();
      return;
    }

    const finalUrl = normalizeUrl(inputVal);
    urlInput.value = finalUrl;
    inputWrapper.classList.add('has-value');
    
    generateQR(finalUrl, true);
  });

  // =========================================================================
  // 5. QR Code Generator Core
  // =========================================================================
  function generateQR(url, isNew = true) {
    activeUrl = url;

    // Clear previous QR code canvas
    qrCodeContainer.innerHTML = '';

    // Create high-resolution QR code with QRCode.js
    currentQrCodeInstance = new QRCode(qrCodeContainer, {
      text: url,
      width: 256,
      height: 256,
      colorDark: activeColor,
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H // Highest 30% error correction
    });

    // Update target URL label
    qrTargetUrl.textContent = url;
    qrTargetUrl.title = url;

    // Layout Transition
    if (!appLayout.classList.contains('has-qr')) {
      appLayout.classList.add('has-qr');
      showToast('✨ QR 코드가 성공적으로 생성되었습니다!');
    } else if (isNew) {
      showToast('🔄 QR 코드가 새로 갱신되었습니다.');
    }
  }

  // =========================================================================
  // 6. Action Handlers: Download, Copy Image, Copy URL, Open Link
  // =========================================================================
  
  // Click on QR code directly also triggers download
  qrCodeWrapper.addEventListener('click', () => {
    if (!activeUrl) return;
    downloadQRCodeAsJpg();
  });

  // Download JPG button
  downloadJpgBtn.addEventListener('click', () => {
    if (!activeUrl) return;
    downloadQRCodeAsJpg();
  });

  // Copy Image to Clipboard button
  copyImgBtn.addEventListener('click', () => {
    if (!activeUrl) return;
    copyQRCodeToClipboard();
  });

  // Copy URL text button
  copyUrlBtn.addEventListener('click', () => {
    if (!activeUrl) return;
    navigator.clipboard.writeText(activeUrl).then(() => {
      showToast('🔗 URL 주소가 클립보드에 복사되었습니다.');
    }).catch(() => {
      showToast('🔗 URL 주소 복사에 성공했습니다.');
    });
  });

  // Open link in new tab button
  openLinkBtn.addEventListener('click', () => {
    if (!activeUrl) return;
    window.open(activeUrl, '_blank', 'noopener,noreferrer');
  });

  // =========================================================================
  // 7. High-Res Canvas Rendering & Export Helpers
  // =========================================================================

  /**
   * Generates a high-resolution export canvas with quiet-zone padding & pure white background
   */
  function createExportCanvas(callback) {
    const qrCanvas = qrCodeContainer.querySelector('canvas');
    const qrImg = qrCodeContainer.querySelector('img');

    if (!qrCanvas && !qrImg) {
      showToast('❌ 생성된 QR 코드를 찾을 수 없습니다.');
      return;
    }

    const padding = 44; // Comfortable quiet zone for scanners
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');

    const render = (source, width, height) => {
      exportCanvas.width = width + padding * 2;
      exportCanvas.height = height + padding * 2;

      // 1. Fill solid pure white background (Vital for scanner contrast & JPEG export)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      // 2. Draw QR code centrally
      ctx.drawImage(source, padding, padding, width, height);

      // 3. Subtle outer aesthetic frame
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, exportCanvas.width - 20, exportCanvas.height - 20);

      callback(exportCanvas);
    };

    if (qrCanvas && qrCanvas.width > 0) {
      render(qrCanvas, qrCanvas.width, qrCanvas.height);
    } else if (qrImg && qrImg.complete && qrImg.naturalWidth > 0) {
      render(qrImg, qrImg.naturalWidth, qrImg.naturalHeight);
    } else if (qrImg) {
      qrImg.onload = () => {
        render(qrImg, qrImg.naturalWidth || 256, qrImg.naturalHeight || 256);
      };
    }
  }

  /**
   * Export the rendered QR code as high-quality JPG
   */
  function downloadQRCodeAsJpg() {
    createExportCanvas((exportCanvas) => {
      try {
        const jpgUrl = exportCanvas.toDataURL('image/jpeg', 0.96);
        const fileName = createFileName(activeUrl);

        const downloadLink = document.createElement('a');
        downloadLink.href = jpgUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showToast('🎉 고화질 JPG 파일로 저장되었습니다!');
      } catch (err) {
        console.error('Download error:', err);
        showToast('❌ 파일 다운로드 중 오류가 발생했습니다.');
      }
    });
  }

  /**
   * Copy the QR Code Image directly to user's clipboard
   */
  function copyQRCodeToClipboard() {
    createExportCanvas((exportCanvas) => {
      if (!navigator.clipboard || !window.ClipboardItem) {
        showToast('⚠️ 클립보드 복사를 지원하지 않는 브라우저입니다. 다운로드를 이용해 주세요.');
        return;
      }

      exportCanvas.toBlob((blob) => {
        if (!blob) {
          showToast('❌ 이미지 생성에 실패했습니다.');
          return;
        }

        const item = new ClipboardItem({ 'image/png': blob });
        navigator.clipboard.write([item]).then(() => {
          showToast('📋 QR 이미지가 클립보드에 복사되었습니다! (붙여넣기 가능)');
        }).catch((err) => {
          console.error('Clipboard copy error:', err);
          showToast('⚠️ 클립보드 권한이 필요합니다. JPG 다운로드를 이용하세요.');
        });
      }, 'image/png');
    });
  }

  /**
   * Helper: Normalize URL string
   */
  function normalizeUrl(str) {
    if (!/^https?:\/\//i.test(str) && !/^(mailto|tel|sms|ftp):/i.test(str)) {
      if (str.includes('.') && !str.includes(' ')) {
        return 'https://' + str;
      }
    }
    return str;
  }

  /**
   * Helper: Create clean filename from URL
   */
  function createFileName(url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const time = new Date().toISOString().slice(0, 10);
      return `smart-qr-${host}-${time}.jpg`;
    } catch {
      const clean = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
      return `smart-qr-${clean || 'code'}.jpg`;
    }
  }

  /**
   * Helper: Toast notification
   */
  let toastTimeout = null;
  function showToast(message) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastContainer.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    toastTimeout = setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 2800);
  }
});
