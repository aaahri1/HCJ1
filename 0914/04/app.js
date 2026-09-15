/**
 * Mobile Wedding Invitation - Dmitry & Lorelei
 * Date: 2099.12.26 12:00:00 (Saturday)
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initContactModals();
  initGalleryLightbox();
  initAccountAccordions();
  initCopyButtons();
  initGuestbook();
  initShareFeatures();
  initScrollAnimations();
  initFallingPetals();
  initAmbientBGM();
});

/* ==========================================================================
   1. REAL-TIME COUNTDOWN TIMER & CALENDAR
   ========================================================================== */
function initCountdown() {
  // Wedding Date: 2099년 12월 26일 12:00:00 KST
  const weddingDate = new Date(2099, 11, 26, 12, 0, 0); // Month is 0-indexed (11 = Dec)

  const elDays = document.getElementById('count-days');
  const elHours = document.getElementById('count-hours');
  const elMins = document.getElementById('count-minutes');
  const elSecs = document.getElementById('count-seconds');
  const elDdayHighlight = document.getElementById('dday-days-highlight');
  const elDdaySummary = document.getElementById('dday-summary-text');

  function updateTimer() {
    const now = new Date();
    const diff = weddingDate.getTime() - now.getTime();

    if (diff <= 0) {
      if (elDays) elDays.textContent = '00';
      if (elHours) elHours.textContent = '00';
      if (elMins) elMins.textContent = '00';
      if (elSecs) elSecs.textContent = '00';
      if (elDdaySummary) elDdaySummary.innerHTML = '드미트리 ♥ 로렐라이의 <strong>결혼식이 시작되었습니다!</strong>';
      return;
    }

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / (3600 * 24));
    const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (elDays) elDays.textContent = String(days).padStart(2, '0');
    if (elHours) elHours.textContent = String(hours).padStart(2, '0');
    if (elMins) elMins.textContent = String(minutes).padStart(2, '0');
    if (elSecs) elSecs.textContent = String(seconds).padStart(2, '0');

    if (elDdayHighlight) {
      elDdayHighlight.textContent = `${days.toLocaleString()}일`;
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   2. CONTACT MODAL (GROOM / BRIDE CALL & SMS)
   ========================================================================== */
function initContactModals() {
  const modalOverlay = document.getElementById('contact-modal');
  const modalTitle = document.getElementById('contact-modal-title');
  const modalBody = document.getElementById('contact-modal-body');
  const closeBtn = document.getElementById('modal-close-btn');

  const btnGroom = document.getElementById('btn-contact-groom');
  const btnBride = document.getElementById('btn-contact-bride');

  const contactData = {
    groom: {
      title: '신랑측 연락처',
      people: [
        { role: '신랑', name: '드미트리', phone: '010-2099-1226' },
        { role: '아버지', name: '루크사트', phone: '010-1111-2222' },
        { role: '어머니', name: '파르벤', phone: '010-3333-4444' }
      ]
    },
    bride: {
      title: '신부측 연락처',
      people: [
        { role: '신부', name: '로렐라이', phone: '010-2099-1227' },
        { role: '아버지', name: '마키아토', phone: '010-5555-6666' },
        { role: '어머니', name: '페르시카', phone: '010-7777-8888' }
      ]
    }
  };

  function openContactModal(side) {
    const data = contactData[side];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalBody.innerHTML = data.people.map(person => `
      <div class="contact-row-item">
        <div class="contact-person-info">
          <span class="contact-role">${person.role}</span>
          <span class="contact-name">${person.name}</span>
          <span class="contact-phone-num">${person.phone}</span>
        </div>
        <div class="contact-actions">
          <a href="tel:${person.phone}" class="action-btn btn-tel" title="${person.name}님께 전화걸기" aria-label="전화">
            📞
          </a>
          <a href="sms:${person.phone}" class="action-btn btn-sms" title="${person.name}님께 문자보내기" aria-label="문자">
            💬
          </a>
        </div>
      </div>
    `).join('');

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnGroom) {
    btnGroom.addEventListener('click', () => openContactModal('groom'));
  }
  if (btnBride) {
    btnBride.addEventListener('click', () => openContactModal('bride'));
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   3. GALLERY LIGHTBOX MODAL
   ========================================================================== */
function initGalleryLightbox() {
  const images = [
    { src: 'pictures/함께1.png', caption: '드미트리 & 로렐라이' },
    { src: 'pictures/신랑.png', caption: '신랑 드미트리' },
    { src: 'pictures/신부.png', caption: '신부 로렐라이' },
    { src: 'pictures/함께2.png', caption: '함께 걷는 발걸음' },
    { src: 'pictures/함께3.png', caption: '영원한 약속' }
  ];

  let currentIndex = 0;
  const lightbox = document.getElementById('gallery-lightbox');
  const mainImg = document.getElementById('lightbox-main-img');
  const counter = document.getElementById('lightbox-counter');
  const btnClose = document.getElementById('lightbox-close-btn');
  const btnPrev = document.getElementById('lightbox-prev-btn');
  const btnNext = document.getElementById('lightbox-next-btn');

  const galleryItems = document.querySelectorAll('.gallery-item');

  function showImage(index) {
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    currentIndex = index;

    mainImg.src = images[currentIndex].src;
    mainImg.alt = images[currentIndex].caption;
    counter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function openLightbox(index) {
    showImage(index);
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  galleryItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      const targetIndex = parseInt(item.getAttribute('data-index'), 10) || idx;
      openLightbox(targetIndex);
    });
  });

  if (btnClose) btnClose.addEventListener('click', closeLightbox);
  if (btnPrev) btnPrev.addEventListener('click', () => showImage(currentIndex - 1));
  if (btnNext) btnNext.addEventListener('click', () => showImage(currentIndex + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
  });

  // Touch swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      showImage(currentIndex + 1); // Swipe left -> next
    } else if (touchEndX > touchStartX + swipeThreshold) {
      showImage(currentIndex - 1); // Swipe right -> prev
    }
  }, { passive: true });
}

/* ==========================================================================
   4. ACCOUNT ACCORDIONS
   ========================================================================== */
function initAccountAccordions() {
  const cards = document.querySelectorAll('.account-card');

  cards.forEach(card => {
    const toggleBtn = card.querySelector('.accordion-toggle');
    const content = card.querySelector('.account-content');
    const arrow = card.querySelector('.toggle-arrow');
    const toggleText = card.querySelector('.toggle-text');

    if (!toggleBtn || !content) return;

    toggleBtn.addEventListener('click', () => {
      const isOpen = content.classList.contains('open');
      if (isOpen) {
        content.classList.remove('open');
        arrow.classList.remove('open');
        toggleText.textContent = '열기';
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        content.classList.add('open');
        arrow.classList.add('open');
        toggleText.textContent = '접기';
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   5. COPY TO CLIPBOARD WITH TOAST
   ========================================================================== */
function showToast(message) {
  const toast = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');
  if (!toast) return;

  toastText.textContent = message;
  toast.classList.add('show');

  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }

  window.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(successMessage))
      .catch(() => fallbackCopy(text, successMessage));
  } else {
    fallbackCopy(text, successMessage);
  }
}

function fallbackCopy(text, successMessage) {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  tempInput.style.position = 'fixed';
  tempInput.style.left = '-9999px';
  document.body.appendChild(tempInput);
  tempInput.focus();
  tempInput.select();

  try {
    document.execCommand('copy');
    showToast(successMessage);
  } catch (err) {
    showToast('복사에 실패했습니다. 수동으로 복사해주세요.');
  } finally {
    document.body.removeChild(tempInput);
  }
}

function initCopyButtons() {
  // Account number copy
  const copyAccBtns = document.querySelectorAll('.btn-copy-acc');
  copyAccBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const copyText = btn.getAttribute('data-copy');
      copyToClipboard(copyText, '계좌번호가 복사되었습니다.');
    });
  });

  // Venue address copy
  const btnCopyAddress = document.getElementById('btn-copy-address');
  if (btnCopyAddress) {
    btnCopyAddress.addEventListener('click', () => {
      const address = '서울특별시 강남구 테헤란로 123 나나컨벤션타워 2층 플로렌스홀';
      copyToClipboard(address, '예식장 주소가 복사되었습니다.');
    });
  }
}

/* ==========================================================================
   6. GUESTBOOK (LOCAL STORAGE PERSISTED)
   ========================================================================== */
function initGuestbook() {
  const form = document.getElementById('guestbook-form');
  const listContainer = document.getElementById('guestbook-list');
  const STORAGE_KEY = 'wedding_guestbook_dmitry_lorelei';

  const defaultMessages = [
    {
      name: '아벨 & 미카엘라',
      relation: '신랑 절친',
      message: '드미트리야, 로렐라이야 진심으로 축하해! 둘이 서로를 아끼고 영원히 빛나는 인생을 만들어가길 응원한다!',
      date: '2099.12.01'
    },
    {
      name: '소피아 실장',
      relation: '신부 직장 동료',
      message: '로렐라이 님, 항상 따뜻한 마음씨처럼 행복 가득한 결혼 생활 되시길 온 마음으로 축복합니다 ✨',
      date: '2099.12.03'
    },
    {
      name: '나나컨벤션 일동',
      relation: '예식장',
      message: '두 분의 가장 성스러운 약속의 날, 나나컨벤션센터에서 최고의 예식으로 정성껏 모시겠습니다.',
      date: '2099.12.10'
    }
  ];

  function loadMessages() {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMessages));
      return defaultMessages;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return defaultMessages;
    }
  }

  function renderMessages() {
    const messages = loadMessages();
    if (!listContainer) return;

    listContainer.innerHTML = messages.map(msg => `
      <div class="guestbook-card">
        <div class="guest-card-header">
          <span class="guest-name-badge">
            ${escapeHtml(msg.name)}
            ${msg.relation ? `<span class="guest-relation">${escapeHtml(msg.relation)}</span>` : ''}
          </span>
          <span class="guest-date">${escapeHtml(msg.date)}</span>
        </div>
        <div class="guest-msg-content">
          ${escapeHtml(msg.message)}
        </div>
      </div>
    `).join('');
  }

  function addMessage(name, relation, message) {
    const messages = loadMessages();
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    const newEntry = {
      name: name.trim(),
      relation: relation ? relation.trim() : '하객',
      message: message.trim(),
      date: dateStr
    };

    messages.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    renderMessages();
    showToast('축하 메시지가 등록되었습니다. 감사합니다!');
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('guest-name');
      const relationInput = document.getElementById('guest-relationship');
      const msgInput = document.getElementById('guest-message');

      if (!nameInput.value.trim() || !msgInput.value.trim()) {
        showToast('성함과 메시지를 모두 입력해주세요.');
        return;
      }

      addMessage(nameInput.value, relationInput.value, msgInput.value);
      nameInput.value = '';
      if (relationInput) relationInput.value = '';
      msgInput.value = '';
    });
  }

  renderMessages();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

/* ==========================================================================
   7. SHARE BUTTONS
   ========================================================================== */
function initShareFeatures() {
  const btnKakao = document.getElementById('btn-share-kakao');
  const btnLink = document.getElementById('btn-share-link');

  const shareTitle = '드미트리 & 로렐라이 모바일 청첩장';
  const shareText = '저희의 영원한 사랑을 약속하는 자리에 소중한 분들을 초대합니다. (2099.12.26 나나컨벤션센터)';
  const currentUrl = window.location.href;

  if (btnKakao) {
    btnKakao.addEventListener('click', () => {
      if (navigator.share) {
        navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl
        }).catch(() => {});
      } else {
        copyToClipboard(currentUrl, '청첩장 주소가 복사되었습니다. 카카오톡에 붙여넣어 공유하세요!');
      }
    });
  }

  if (btnLink) {
    btnLink.addEventListener('click', () => {
      copyToClipboard(currentUrl, '청첩장 링크가 복사되었습니다.');
    });
  }
}

/* ==========================================================================
   8. SCROLL FADE-IN ANIMATIONS
   ========================================================================== */
function initScrollAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(el => observer.observe(el));
  } else {
    fadeElements.forEach(el => el.classList.add('revealed'));
  }
}

/* ==========================================================================
   9. FALLING PETALS CANVAS ANIMATION
   ========================================================================== */
function initFallingPetals() {
  const canvas = document.getElementById('petals-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petalsCount = 22; // Delicate & lightweight count
  const petals = [];

  const petalColors = [
    'rgba(255, 215, 225, 0.7)',
    'rgba(255, 235, 240, 0.75)',
    'rgba(244, 218, 205, 0.65)',
    'rgba(255, 240, 245, 0.8)'
  ];

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : -20;
      this.size = Math.random() * 8 + 7;
      this.speedY = Math.random() * 0.8 + 0.6;
      this.speedX = Math.random() * 0.8 - 0.4;
      this.angle = Math.random() * 360;
      this.angularSpeed = (Math.random() - 0.5) * 1.2;
      this.flip = Math.random() * 360;
      this.flipSpeed = Math.random() * 1.5 + 0.5;
      this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.angle * Math.PI / 180) * 0.4;
      this.angle += this.angularSpeed;
      this.flip += this.flipSpeed;

      if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.angle * Math.PI) / 180);
      ctx.scale(Math.cos((this.flip * Math.PI) / 180), 1);

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(this.size / 2, -this.size / 2, this.size, 0, 0, this.size * 1.2);
      ctx.bezierCurveTo(-this.size, 0, -this.size / 2, -this.size / 2, 0, 0);
      ctx.fill();

      ctx.restore();
    }
  }

  for (let i = 0; i < petalsCount; i++) {
    petals.push(new Petal());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < petals.length; i++) {
      petals[i].update();
      petals[i].draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
}

/* ==========================================================================
   10. ROMANTIC AMBIENT BGM SYNTHESIZER (WEB AUDIO API)
   ========================================================================== */
function initAmbientBGM() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (!audioBtn) return;

  let audioCtx = null;
  let isPlaying = false;
  let timerId = null;

  // Romantic Waltz Chords & Arpeggios (C major / G / Am / F peaceful progression)
  const notes = [
    523.25, 659.25, 783.99, 1046.50, // C5, E5, G5, C6
    493.88, 587.33, 783.99, 987.77,  // B4, D5, G5, B5
    440.00, 523.25, 659.25, 880.00,  // A4, C5, E5, A5
    392.00, 523.25, 698.46, 783.99   // G4, C5, F5, G5
  ];

  let noteIndex = 0;

  function playChimeNote(freq) {
    if (!audioCtx || audioCtx.state === 'suspended') return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    // Warm bell / music-box envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.6);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.6);
  }

  function startMusicLoop() {
    isPlaying = true;
    audioBtn.classList.add('playing');
    audioBtn.querySelector('.audio-text').textContent = 'ON';

    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    timerId = setInterval(() => {
      const freq = notes[noteIndex % notes.length];
      playChimeNote(freq);
      noteIndex++;
    }, 600);
  }

  function stopMusicLoop() {
    isPlaying = false;
    audioBtn.classList.remove('playing');
    audioBtn.querySelector('.audio-text').textContent = 'BGM';
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  audioBtn.addEventListener('click', () => {
    if (isPlaying) {
      stopMusicLoop();
    } else {
      startMusicLoop();
    }
  });
}
