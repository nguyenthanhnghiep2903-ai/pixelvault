/**
 * PixelVault - Photo Library App
 * Main JavaScript Application
 */

'use strict';

// =============================================
// Configuration & Data
// =============================================

const CONFIG = {
  PHOTOS_PER_PAGE: 20,
  PICSUM_BASE: 'https://picsum.photos',
  PICSUM_LIST: 'https://picsum.photos/v2/list',
  UNSPLASH_KEYWORDS: [
    'nature', 'architecture', 'city', 'travel', 'food', 'technology',
    'animals', 'people', 'abstract', 'ocean', 'forest', 'mountain'
  ]
};

const CATEGORIES = [
  { id: 'all', label: 'Tất Cả', icon: '✦' },
  { id: 'nature', label: 'Thiên Nhiên', icon: '🌿' },
  { id: 'architecture', label: 'Kiến Trúc', icon: '🏛️' },
  { id: 'people', label: 'Con Người', icon: '👤' },
  { id: 'travel', label: 'Du Lịch', icon: '✈️' },
  { id: 'food', label: 'Ẩm Thực', icon: '🍜' },
  { id: 'technology', label: 'Công Nghệ', icon: '💻' },
  { id: 'animals', label: 'Động Vật', icon: '🦋' },
  { id: 'ocean', label: 'Đại Dương', icon: '🌊' },
  { id: 'abstract', label: 'Trừu Tượng', icon: '🎨' },
];

const PHOTOGRAPHERS = [
  { name: 'Anh Phong', handle: '@anhphong', photos: 342, seed: 10 },
  { name: 'Minh Châu', handle: '@minhchau', photos: 218, seed: 20 },
  { name: 'Tuấn Anh', handle: '@tuananh', photos: 189, seed: 30 },
  { name: 'Lan Anh', handle: '@lananh', photos: 267, seed: 40 },
  { name: 'Đức Minh', handle: '@ducminh', photos: 155, seed: 50 },
  { name: 'Thu Hà', handle: '@thuha', photos: 301, seed: 60 },
];

const COLLECTIONS = [
  { name: 'Việt Nam Tươi Đẹp', count: 128, imgId: 1003 },
  { name: 'Đô Thị Hiện Đại', count: 256, imgId: 1019 },
  { name: 'Thiên Nhiên Hoang Dã', count: 89, imgId: 1036 },
  { name: 'Kiến Trúc Cổ Điển', count: 174, imgId: 1042 },
  { name: 'Ẩm Thực Đường Phố', count: 93, imgId: 1060 },
  { name: 'Chân Dung Nghệ Thuật', count: 211, imgId: 1080 },
];

const HERO_TAGS = ['Việt Nam', 'Đại dương', 'Rừng rậm', 'Thành phố', 'Hoàng hôn', 'Ẩm thực'];

// Pre-generated photo data with varying aspect ratios
const ASPECT_RATIOS = [
  { w: 800, h: 1200 }, // portrait tall
  { w: 1200, h: 800 }, // landscape
  { w: 800, h: 800 },  // square
  { w: 800, h: 1000 }, // portrait
  { w: 1200, h: 700 }, // wide landscape
  { w: 800, h: 600 },  // landscape standard
  { w: 900, h: 1350 }, // portrait instagram
  { w: 1000, h: 750 }, // landscape golden
];

const PHOTO_TAGS_POOL = [
  'thiên nhiên', 'kiến trúc', 'con người', 'du lịch', 'ẩm thực',
  'công nghệ', 'động vật', 'đại dương', 'trừu tượng', 'phong cảnh',
  'đô thị', 'cổ điển', 'hiện đại', 'nghệ thuật', 'màu sắc'
];

// =============================================
// State Management
// =============================================

const state = {
  currentPage: 1,
  currentCategory: 'all',
  currentSearch: '',
  photos: [],
  allPhotos: [],
  isLoading: false,
  hasMore: true,
  totalLoaded: 0,
  likedPhotos: new Set(JSON.parse(localStorage.getItem('pv_likes') || '[]')),
  theme: localStorage.getItem('pv_theme') || 'dark',
  modalIndex: -1,
};

// =============================================
// Photo Data Generator (Picsum)
// =============================================

function generatePhotos(count, startSeed = 0) {
  return Array.from({ length: count }, (_, i) => {
    const seed = startSeed + i + 1;
    const ratio = ASPECT_RATIOS[(seed - 1) % ASPECT_RATIOS.length];
    const photographer = PHOTOGRAPHERS[(seed - 1) % PHOTOGRAPHERS.length];
    const tags = getRandomTags(3, seed);
    const category = CATEGORIES[1 + (seed % (CATEGORIES.length - 1))];

    return {
      id: seed,
      seed,
      width: ratio.w,
      height: ratio.h,
      url: `${CONFIG.PICSUM_BASE}/seed/${seed}/${ratio.w}/${ratio.h}`,
      thumbUrl: `${CONFIG.PICSUM_BASE}/seed/${seed}/400/${Math.round(400 * ratio.h / ratio.w)}`,
      fullUrl: `${CONFIG.PICSUM_BASE}/seed/${seed}/1920/1080`,
      photographer: photographer.name,
      photographerHandle: photographer.handle,
      photographerAvatar: `${CONFIG.PICSUM_BASE}/seed/${seed + 200}/80/80`,
      category: category.id,
      tags,
      likes: Math.floor(Math.random() * 2000 + 50),
      downloads: Math.floor(Math.random() * 5000 + 100),
      views: Math.floor(Math.random() * 20000 + 1000),
      uploadDate: getRandomDate(),
    };
  });
}

function getRandomTags(count, seed) {
  const tags = [];
  for (let i = 0; i < count; i++) {
    tags.push(PHOTO_TAGS_POOL[(seed + i * 3) % PHOTO_TAGS_POOL.length]);
  }
  return [...new Set(tags)];
}

function getRandomDate() {
  const now = new Date();
  const days = Math.floor(Math.random() * 365);
  now.setDate(now.getDate() - days);
  return now.toLocaleDateString('vi-VN');
}

// =============================================
// DOM Utilities
// =============================================

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// =============================================
// Theme Management
// =============================================

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  localStorage.setItem('pv_theme', theme);
  const btn = $('#theme-toggle');
  if (btn) btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// =============================================
// Toast Notification
// =============================================

function showToast(message, type = 'success') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const container = $('#toast-container');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// =============================================
// Navbar Scroll Behavior
// =============================================

function initNavbarScroll() {
  const navbar = $('.navbar');
  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 60);
    lastScrollY = scrollY;
  }, { passive: true });
}

// =============================================
// Scroll to Top Button
// =============================================

function initScrollTop() {
  const btn = $('#scroll-top-btn');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// =============================================
// Hero Section
// =============================================

function initHero() {
  // Random hero background
  const heroImg = $('#hero-bg-img');
  const heroSeed = Math.floor(Math.random() * 100) + 500;
  heroImg.src = `${CONFIG.PICSUM_BASE}/seed/${heroSeed}/1920/700`;
  heroImg.alt = 'PixelVault Hero';

  // Hero tags click
  $$('.hero-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const query = tag.dataset.query;
      performSearch(query);
      window.scrollTo({ top: document.querySelector('.categories-section').offsetTop - 68, behavior: 'smooth' });
    });
  });

  // Hero search
  const heroSearchInput = $('#hero-search-input');
  const heroSearchBtn = $('#hero-search-btn');

  heroSearchBtn.addEventListener('click', () => {
    const q = heroSearchInput.value.trim();
    if (q) performSearch(q);
  });

  heroSearchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = heroSearchInput.value.trim();
      if (q) performSearch(q);
    }
  });
}

// =============================================
// Categories
// =============================================

function initCategories() {
  const container = $('#categories-container');

  container.innerHTML = CATEGORIES.map(cat => `
    <button
      class="category-btn ${cat.id === 'all' ? 'active' : ''}"
      data-category="${cat.id}"
      id="cat-${cat.id}"
      aria-pressed="${cat.id === 'all'}"
    >
      <span class="category-icon">${cat.icon}</span>
      ${cat.label}
    </button>
  `).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;

    $$('.category-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');

    state.currentCategory = btn.dataset.category;
    state.currentSearch = '';
    filterAndRenderPhotos();

    // Sync navbar search
    const navSearch = $('#navbar-search-input');
    if (navSearch) navSearch.value = '';
  });
}

// =============================================
// Photo Rendering
// =============================================

function createPhotoItem(photo, index) {
  const isLiked = state.likedPhotos.has(photo.id);
  const delay = (index % CONFIG.PHOTOS_PER_PAGE) * 40;

  return `
    <div
      class="photo-item"
      data-photo-id="${photo.id}"
      data-photo-index="${state.allPhotos.indexOf(photo)}"
      role="article"
      tabindex="0"
      aria-label="Ảnh của ${photo.photographer}"
      style="animation-delay: ${delay}ms;"
    >
      <img
        src="${photo.thumbUrl}"
        alt="Ảnh nghệ thuật bởi ${photo.photographer}"
        loading="lazy"
        onerror="this.src='${CONFIG.PICSUM_BASE}/seed/${photo.seed}/400/300'"
      />
      <div class="photo-overlay" aria-hidden="true">
        <div class="photo-overlay-top">
          <button
            class="overlay-btn ${isLiked ? 'liked' : ''}"
            data-like-btn
            data-photo-id="${photo.id}"
            aria-label="${isLiked ? 'Bỏ thích' : 'Thích ảnh'}"
            title="${isLiked ? 'Bỏ thích' : 'Thích'}"
          >
            ${isLiked ? '❤️' : '🤍'}
          </button>
          <button
            class="overlay-btn"
            data-collect-btn
            data-photo-id="${photo.id}"
            aria-label="Lưu vào bộ sưu tập"
            title="Lưu"
          >
            🔖
          </button>
        </div>
        <div class="photo-overlay-bottom">
          <div class="photo-author">
            <img
              class="photo-author-avatar"
              src="${photo.photographerAvatar}"
              alt="${photo.photographer}"
              loading="lazy"
            />
            <span class="photo-author-name">${photo.photographer}</span>
          </div>
          <a
            href="${photo.fullUrl}"
            download="pixelvault-${photo.id}.jpg"
            class="photo-download-btn"
            aria-label="Tải ảnh"
            target="_blank"
            rel="noopener"
            data-download-btn
          >
            ⬇ Tải
          </a>
        </div>
      </div>
    </div>
  `;
}

function createSkeletons(count) {
  const heights = [280, 380, 200, 320, 260, 420, 300, 240];
  return Array.from({ length: count }, (_, i) =>
    `<div class="photo-skeleton" style="height: ${heights[i % heights.length]}px;"></div>`
  ).join('');
}

function renderPhotos(photos, append = false) {
  const grid = $('#photo-grid');
  const noResults = $('#no-results');

  if (!photos.length && !append) {
    grid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  if (!append) {
    grid.innerHTML = '';
  }

  const fragment = photos.map((p, i) => createPhotoItem(p, append ? state.totalLoaded + i : i)).join('');
  grid.insertAdjacentHTML('beforeend', fragment);

  // Update count
  state.totalLoaded = grid.querySelectorAll('.photo-item').length;
  updateLoadMoreState();
}

function updateLoadMoreState() {
  const btn = $('#load-more-btn');
  const countEl = $('#load-more-count');
  if (countEl) countEl.textContent = `${state.totalLoaded} / ${getFilteredPhotos().length} ảnh`;
  if (btn) {
    const filtered = getFilteredPhotos();
    btn.disabled = state.totalLoaded >= filtered.length;
    if (state.totalLoaded >= filtered.length) {
      btn.innerHTML = '<span>✓</span> Đã tải tất cả';
    } else {
      btn.innerHTML = '<span>↓</span> Tải thêm ảnh';
    }
  }
}

function getFilteredPhotos() {
  let photos = state.allPhotos;

  if (state.currentCategory !== 'all') {
    photos = photos.filter(p => p.category === state.currentCategory);
  }

  if (state.currentSearch) {
    const q = state.currentSearch.toLowerCase();
    photos = photos.filter(p =>
      p.photographer.toLowerCase().includes(q) ||
      p.tags.some(t => t.includes(q)) ||
      p.category.includes(q)
    );
  }

  return photos;
}

function filterAndRenderPhotos() {
  const filtered = getFilteredPhotos();
  const firstBatch = filtered.slice(0, CONFIG.PHOTOS_PER_PAGE);
  state.currentPage = 1;
  state.totalLoaded = 0;

  // Update search header
  updateSearchHeader(filtered.length);

  // Add skeleton loading effect
  const grid = $('#photo-grid');
  grid.innerHTML = createSkeletons(8);

  setTimeout(() => {
    renderPhotos(firstBatch, false);
  }, 400);
}

function updateSearchHeader(count) {
  const header = $('#search-results-header');
  const q = state.currentSearch;

  if (q) {
    header.classList.remove('hidden');
    header.innerHTML = `
      <h2 class="search-results-title">Kết quả cho "<span>${q}</span>"</h2>
      <p class="search-results-count">Tìm thấy ${formatNumber(count)} hình ảnh</p>
    `;
  } else {
    header.classList.add('hidden');
  }
}

function loadMorePhotos() {
  const filtered = getFilteredPhotos();
  const start = state.totalLoaded;
  const end = Math.min(start + CONFIG.PHOTOS_PER_PAGE, filtered.length);
  const nextPhotos = filtered.slice(start, end);

  if (!nextPhotos.length) return;

  const btn = $('#load-more-btn');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="spinner spinner-dark"></div> Đang tải...';
  btn.disabled = true;

  setTimeout(() => {
    renderPhotos(nextPhotos, true);
    btn.innerHTML = originalHtml;
    updateLoadMoreState();
  }, 600);
}

// =============================================
// Search
// =============================================

function performSearch(query) {
  state.currentSearch = query;
  state.currentCategory = 'all';

  // Update UI
  const navInput = $('#navbar-search-input');
  const heroInput = $('#hero-search-input');
  if (navInput) navInput.value = query;
  if (heroInput) heroInput.value = query;

  // Reset category buttons
  $$('.category-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-pressed', 'false');
  });
  const allBtn = $('#cat-all');
  if (allBtn) { allBtn.classList.add('active'); allBtn.setAttribute('aria-pressed', 'true'); }

  filterAndRenderPhotos();
  window.scrollTo({ top: document.querySelector('.main-content').offsetTop - 120, behavior: 'smooth' });
}

function initSearch() {
  const navInput = $('#navbar-search-input');
  const navForm = $('#navbar-search-form');

  navForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = navInput.value.trim();
    if (q) performSearch(q);
    else {
      state.currentSearch = '';
      filterAndRenderPhotos();
    }
  });

  navInput.addEventListener('input', () => {
    if (!navInput.value.trim()) {
      state.currentSearch = '';
      filterAndRenderPhotos();
    }
  });
}

// =============================================
// Photo Modal
// =============================================

function openModal(photoIndex) {
  state.modalIndex = photoIndex;
  const photo = state.allPhotos[photoIndex];
  if (!photo) return;

  updateModal(photo, photoIndex);
  $('#modal-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal-backdrop').classList.remove('open');
  document.body.style.overflow = '';
  state.modalIndex = -1;
}

function navigateModal(direction) {
  const filtered = getFilteredPhotos();
  const currentInFiltered = filtered.indexOf(state.allPhotos[state.modalIndex]);
  const nextInFiltered = (currentInFiltered + direction + filtered.length) % filtered.length;
  const nextPhoto = filtered[nextInFiltered];
  const nextIndex = state.allPhotos.indexOf(nextPhoto);
  state.modalIndex = nextIndex;
  updateModal(nextPhoto, nextIndex);

  // Animate
  const img = $('#modal-image');
  img.style.opacity = '0';
  img.style.transform = `translateX(${direction > 0 ? '20px' : '-20px'})`;
  setTimeout(() => {
    img.style.transition = 'all 0.3s ease';
    img.style.opacity = '1';
    img.style.transform = 'translateX(0)';
    setTimeout(() => { img.style.transition = ''; }, 300);
  }, 50);
}

function updateModal(photo, index) {
  const isLiked = state.likedPhotos.has(photo.id);

  // Image
  const img = $('#modal-image');
  img.src = photo.url;
  img.alt = `Ảnh của ${photo.photographer}`;

  // Photographer
  $('#modal-photographer-avatar').src = photo.photographerAvatar;
  $('#modal-photographer-name').textContent = photo.photographer;
  $('#modal-photographer-handle').textContent = photo.photographerHandle;

  // Actions
  const likeBtn = $('#modal-like-btn');
  likeBtn.classList.toggle('liked', isLiked);
  likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} <span>${formatNumber(photo.likes + (isLiked ? 1 : 0))}</span>`;
  likeBtn.dataset.photoId = photo.id;

  // Download link
  const dlBtn = $('#modal-download-btn');
  dlBtn.href = photo.fullUrl;

  // Meta
  $('#modal-meta-views').textContent = formatNumber(photo.views);
  $('#modal-meta-downloads').textContent = formatNumber(photo.downloads);
  $('#modal-meta-size').textContent = `${photo.width} × ${photo.height}`;
  $('#modal-meta-date').textContent = photo.uploadDate;

  // Tags
  $('#modal-tags').innerHTML = photo.tags.map(tag =>
    `<button class="modal-tag" data-query="${tag}">${tag}</button>`
  ).join('');

  // Related images
  const relatedPhotos = state.allPhotos
    .filter(p => p.id !== photo.id && p.category === photo.category)
    .slice(0, 4);

  $('#modal-related-grid').innerHTML = relatedPhotos.map(rp => `
    <div class="modal-related-item" data-photo-index="${state.allPhotos.indexOf(rp)}" tabindex="0" role="button" aria-label="Xem ảnh liên quan">
      <img src="${rp.thumbUrl}" alt="Ảnh liên quan" loading="lazy" />
    </div>
  `).join('');
}

function initModal() {
  const backdrop = $('#modal-backdrop');
  const closeBtn = $('#modal-close-btn');
  const prevBtn = $('#modal-nav-prev');
  const nextBtn = $('#modal-nav-next');

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal();
  });

  prevBtn.addEventListener('click', () => navigateModal(-1));
  nextBtn.addEventListener('click', () => navigateModal(1));

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!backdrop.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
  });

  // Modal like button
  const likeBtn = $('#modal-like-btn');
  likeBtn.addEventListener('click', () => {
    const photoId = parseInt(likeBtn.dataset.photoId);
    toggleLike(photoId);
    const photo = state.allPhotos.find(p => p.id === photoId);
    if (photo) updateModal(photo, state.modalIndex);
  });

  // Modal tags
  $('#modal-tags').addEventListener('click', e => {
    const tag = e.target.closest('.modal-tag');
    if (!tag) return;
    closeModal();
    performSearch(tag.dataset.query);
  });

  // Related images
  $('#modal-related-grid').addEventListener('click', e => {
    const item = e.target.closest('.modal-related-item');
    if (!item) return;
    openModal(parseInt(item.dataset.photoIndex));
  });
}

// =============================================
// Like System
// =============================================

function toggleLike(photoId) {
  const isLiked = state.likedPhotos.has(photoId);

  if (isLiked) {
    state.likedPhotos.delete(photoId);
    showToast('Đã bỏ thích ảnh', 'info');
  } else {
    state.likedPhotos.add(photoId);
    showToast('Đã thêm vào yêu thích ❤️', 'success');
  }

  localStorage.setItem('pv_likes', JSON.stringify([...state.likedPhotos]));

  // Đồng bộ lên Firestore nếu đã đăng nhập
  window.authModule?.saveLike(photoId, !isLiked);

  // Cập nhật UI
  refreshLikeButtons(photoId);
}

// =============================================
// Refresh Like Buttons (dùng bởi auth.js)
// =============================================

function refreshLikeButtons(specificPhotoId = null) {
  const selector = specificPhotoId
    ? `[data-like-btn][data-photo-id="${specificPhotoId}"]`
    : '[data-like-btn]';

  $$(selector).forEach(btn => {
    const photoId = parseInt(btn.dataset.photoId);
    const liked = state.likedPhotos.has(photoId);
    btn.classList.toggle('liked', liked);
    btn.innerHTML = liked ? '❤️' : '🤍';
    btn.setAttribute('aria-label', liked ? 'Bỏ thích' : 'Thích ảnh');
  });
}


function initGridEvents() {
  const grid = $('#photo-grid');

  grid.addEventListener('click', e => {
    // Like button
    const likeBtn = e.target.closest('[data-like-btn]');
    if (likeBtn) {
      e.stopPropagation();
      toggleLike(parseInt(likeBtn.dataset.photoId));
      return;
    }

    // Download button - let default behavior handle
    const dlBtn = e.target.closest('[data-download-btn]');
    if (dlBtn) {
      e.stopPropagation();
      showToast('Đang tải ảnh...', 'info');
      return;
    }

    // Collect button
    const collectBtn = e.target.closest('[data-collect-btn]');
    if (collectBtn) {
      e.stopPropagation();
      showToast('Đã lưu vào bộ sưu tập 🔖', 'success');
      return;
    }

    // Open modal on card click
    const photoItem = e.target.closest('.photo-item');
    if (photoItem) {
      const photoIndex = parseInt(photoItem.dataset.photoIndex);
      openModal(photoIndex);
    }
  });

  // Keyboard accessibility
  grid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const photoItem = e.target.closest('.photo-item');
      if (photoItem) {
        e.preventDefault();
        const photoIndex = parseInt(photoItem.dataset.photoIndex);
        openModal(photoIndex);
      }
    }
  });
}

// =============================================
// Collections Section
// =============================================

function renderCollections() {
  const grid = $('#collections-grid');
  grid.innerHTML = COLLECTIONS.map(col => `
    <div class="collection-card" role="button" tabindex="0" aria-label="${col.name}">
      <img
        src="${CONFIG.PICSUM_BASE}/seed/${col.imgId}/800/600"
        alt="${col.name}"
        loading="lazy"
      />
      <div class="collection-overlay">
        <div class="collection-info">
          <div class="collection-name">${col.name}</div>
          <div class="collection-count">${col.count} ảnh</div>
        </div>
      </div>
    </div>
  `).join('');

  // Click event
  $$('.collection-card').forEach(card => {
    card.addEventListener('click', () => {
      showToast(`Đang mở bộ sưu tập...`, 'info');
    });
  });
}

// =============================================
// Photographers Section
// =============================================

function renderPhotographers() {
  const grid = $('#photographers-grid');
  grid.innerHTML = PHOTOGRAPHERS.map(p => `
    <div class="photographer-card" role="article">
      <div class="photographer-avatar-wrapper">
        <img
          class="photographer-avatar"
          src="${CONFIG.PICSUM_BASE}/seed/${p.seed}/80/80"
          alt="${p.name}"
          loading="lazy"
        />
        <div class="photographer-badge">✓</div>
      </div>
      <div class="photographer-name">${p.name}</div>
      <div class="photographer-count">${p.photos} ảnh</div>
      <button class="photographer-follow-btn" data-follow-btn>Theo dõi</button>
    </div>
  `).join('');

  // Follow buttons
  $$('[data-follow-btn]').forEach(btn => {
    btn.addEventListener('click', function() {
      const isFollowing = this.classList.toggle('following');
      this.textContent = isFollowing ? '✓ Đang theo dõi' : 'Theo dõi';
      if (isFollowing) {
        this.style.background = 'var(--accent)';
        this.style.borderColor = 'var(--accent)';
        this.style.color = '#fff';
        showToast('Đã theo dõi nhiếp ảnh gia ✓', 'success');
      } else {
        this.style.background = '';
        this.style.borderColor = '';
        this.style.color = '';
        showToast('Đã hủy theo dõi', 'info');
      }
    });
  });
}

// =============================================
// Infinite Scroll
// =============================================

function initInfiniteScroll() {
  const loadMoreBtn = $('#load-more-btn');
  loadMoreBtn.addEventListener('click', loadMorePhotos);

  // IntersectionObserver for auto-loading
  const sentinel = document.createElement('div');
  sentinel.id = 'scroll-sentinel';
  sentinel.style.height = '1px';
  loadMoreBtn.parentElement.insertAdjacentElement('beforebegin', sentinel);

  const observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !loadMoreBtn.disabled && !state.isLoading) {
      // Auto-load when near bottom
      // (keeping manual button by default for UX)
    }
  }, { threshold: 0.1 });

  observer.observe(sentinel);
}

// =============================================
// Animate on Scroll
// =============================================

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  $$('.collection-card, .photographer-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

// =============================================
// Initialize App
// =============================================

function init() {
  // Apply saved theme
  applyTheme(state.theme);

  // Generate all photos
  state.allPhotos = generatePhotos(200, 0);

  // Initialize components
  initNavbarScroll();
  initScrollTop();
  initHero();
  initCategories();
  initSearch();
  initModal();
  initGridEvents();
  initInfiniteScroll();

  // Render content
  renderCollections();
  renderPhotographers();

  // Initial photo load
  filterAndRenderPhotos();

  // Theme toggle
  $('#theme-toggle').addEventListener('click', toggleTheme);

  // After grid renders, animate observers
  setTimeout(initScrollAnimations, 600);

  // Expose globals for auth.js
  window.state      = state;
  window.showToast  = showToast;
  window.refreshLikeButtons = refreshLikeButtons;

  console.log('🎨 PixelVault initialized successfully!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
