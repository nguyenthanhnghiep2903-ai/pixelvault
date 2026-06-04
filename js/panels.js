/**
 * PixelVault — Side Panels
 * Hồ sơ, Ảnh đã thích, Bộ sưu tập
 */

'use strict';

// =============================================
// Panel System
// =============================================

const panelBackdrop = document.getElementById('panel-backdrop');

function openPanel(name) {
  // Đóng tất cả panels khác
  document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));

  const panel = document.getElementById(`panel-${name}`);
  if (!panel) return;

  // Đóng user dropdown nếu đang mở
  document.getElementById('user-dropdown')?.classList.remove('open');

  panelBackdrop.classList.add('open');
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Load nội dung
  switch (name) {
    case 'profile':     loadProfilePanel();     break;
    case 'likes':       loadLikesPanel();        break;
    case 'collections': loadCollectionsPanel();  break;
  }
}

function closePanel() {
  panelBackdrop.classList.remove('open');
  document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
  document.body.style.overflow = '';
}

// Events
panelBackdrop.addEventListener('click', closePanel);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && panelBackdrop.classList.contains('open')) closePanel();
});

document.querySelectorAll('.panel-close-btn').forEach(btn => {
  btn.addEventListener('click', closePanel);
});

// Data-panel links (dropdown menu)
document.querySelectorAll('[data-panel]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    openPanel(item.dataset.panel);
  });
});

// Expose API
window.panelModule = { openPanel, closePanel };

// =============================================
// Helpers
// =============================================

function createPanelHeader(title, subtitle) {
  return `
    <div class="panel-hero-title">${title}</div>
    ${subtitle ? `<div class="panel-hero-subtitle">${subtitle}</div>` : ''}
  `;
}

function createEmptyState(icon, title, desc) {
  return `
    <div class="panel-empty">
      <div class="panel-empty-icon">${icon}</div>
      <h3 class="panel-empty-title">${title}</h3>
      <p class="panel-empty-desc">${desc}</p>
    </div>
  `;
}

function createPhotoGrid(photos, allPhotos, gridId, removeLabel) {
  return `
    <div class="panel-photo-grid" id="${gridId}">
      ${photos.map(photo => `
        <div class="panel-photo-item"
          data-photo-index="${allPhotos.indexOf(photo)}"
          role="button" tabindex="0"
          aria-label="Xem ảnh của ${photo.photographer}"
        >
          <img src="${photo.thumbUrl}" alt="${photo.photographer}" loading="lazy" />
          <div class="panel-photo-hover">
            <div class="panel-photo-info">
              <span class="panel-photo-author">${photo.photographer}</span>
            </div>
            <button class="panel-remove-btn" data-photo-id="${photo.id}" aria-label="${removeLabel}" title="${removeLabel}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// =============================================
// Profile Panel
// =============================================

function loadProfilePanel() {
  const user = window.authModule?.getCurrentUser();
  const body = document.getElementById('panel-profile-body');

  if (!user) {
    body.innerHTML = createEmptyState('🔒', 'Chưa đăng nhập', 'Vui lòng đăng nhập để xem hồ sơ.');
    return;
  }

  const displayName = user.displayName || user.email.split('@')[0];
  const likeCount   = window.state?.likedPhotos?.size || 0;
  const bmCount     = window.state?.bookmarks?.size   || 0;
  const joinDate    = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const avatarHtml = user.photoURL
    ? `<img src="${user.photoURL}" alt="Avatar" class="profile-avatar-img" />`
    : `<span class="profile-avatar-letter">${displayName.charAt(0).toUpperCase()}</span>`;

  const providers = user.providerData.map(p =>
    p.providerId === 'google.com'
      ? `<span class="provider-badge provider-google"><svg width="13" height="13" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google</span>`
      : `<span class="provider-badge provider-email">📧 Email</span>`
  ).join('');

  const hasPasswordProvider = user.providerData.some(p => p.providerId === 'password');

  body.innerHTML = `

    <!-- Avatar + Info -->
    <div class="profile-hero">
      <div class="profile-avatar-large">${avatarHtml}</div>
      <h2 class="profile-hero-name" id="profile-displayed-name">${displayName}</h2>
      <p class="profile-hero-email">${user.email}</p>
      <p class="profile-hero-date">📅 Thành viên từ ${joinDate}</p>
      <div class="profile-hero-providers">${providers}</div>
    </div>

    <!-- Stats -->
    <div class="profile-stats">
      <button class="profile-stat-item" data-panel="likes" aria-label="Xem ảnh đã thích">
        <div class="profile-stat-number" id="profile-stat-likes">${likeCount}</div>
        <div class="profile-stat-label">❤️ Đã thích</div>
      </button>
      <div class="profile-stat-divider"></div>
      <button class="profile-stat-item" data-panel="collections" aria-label="Xem bộ sưu tập">
        <div class="profile-stat-number" id="profile-stat-bookmarks">${bmCount}</div>
        <div class="profile-stat-label">🔖 Bộ sưu tập</div>
      </button>
      <div class="profile-stat-divider"></div>
      <div class="profile-stat-item">
        <div class="profile-stat-number">${likeCount + bmCount + 42}</div>
        <div class="profile-stat-label">🖼️ Đã xem</div>
      </div>
    </div>

    <!-- Edit Name -->
    <div class="profile-section">
      <h4 class="profile-section-title">✏️ Chỉnh sửa hồ sơ</h4>

      <div class="profile-field">
        <label class="profile-field-label" for="edit-display-name">Tên hiển thị</label>
        <div class="profile-field-row">
          <input
            type="text"
            class="profile-input"
            id="edit-display-name"
            value="${displayName}"
            placeholder="Nhập tên của bạn"
            maxlength="40"
          />
          <button class="profile-save-btn" id="save-name-btn">Lưu</button>
        </div>
      </div>

      <div class="profile-field">
        <label class="profile-field-label">Email</label>
        <div class="profile-input-readonly">${user.email}</div>
      </div>
    </div>

    <!-- Security -->
    <div class="profile-section">
      <h4 class="profile-section-title">🔒 Bảo mật</h4>
      ${hasPasswordProvider ? `
        <button class="profile-action-btn" id="reset-pass-btn">
          <span>🔑</span> Gửi email đổi mật khẩu
        </button>
      ` : `
        <p class="profile-note">Bạn đăng nhập bằng Google, không cần mật khẩu.</p>
      `}
    </div>

    <!-- Danger zone -->
    <div class="profile-section">
      <h4 class="profile-section-title">⚠️ Vùng nguy hiểm</h4>
      <button class="profile-action-btn danger" id="panel-logout-btn">
        <span>🚪</span> Đăng xuất khỏi tài khoản
      </button>
    </div>
  `;

  // Stats panel links
  body.querySelectorAll('[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => openPanel(btn.dataset.panel));
  });

  // Save display name
  document.getElementById('save-name-btn')?.addEventListener('click', async () => {
    const newName = document.getElementById('edit-display-name')?.value.trim();
    if (!newName || newName === displayName) return;

    const btn = document.getElementById('save-name-btn');
    btn.textContent = '...';
    btn.disabled = true;

    try {
      await user.updateProfile({ displayName: newName });
      await firebase.firestore().collection('users').doc(user.uid).update({ displayName: newName });

      document.getElementById('profile-displayed-name').textContent = newName;
      // Update navbar
      const navName = document.getElementById('user-name');
      const ddName  = document.getElementById('dropdown-user-name');
      if (navName) navName.textContent = newName.slice(0, 14) + (newName.length > 14 ? '…' : '');
      if (ddName)  ddName.textContent  = newName;

      window.showToast?.('Đã cập nhật tên thành công ✓', 'success');
    } catch {
      window.showToast?.('Không thể cập nhật tên. Thử lại!', 'error');
    } finally {
      btn.textContent = 'Lưu';
      btn.disabled = false;
    }
  });

  // Reset password
  document.getElementById('reset-pass-btn')?.addEventListener('click', async () => {
    try {
      await firebase.auth().sendPasswordResetEmail(user.email);
      window.showToast?.('Email đổi mật khẩu đã gửi! 📧', 'success');
    } catch {
      window.showToast?.('Không thể gửi email. Thử lại!', 'error');
    }
  });

  // Panel logout
  document.getElementById('panel-logout-btn')?.addEventListener('click', async () => {
    closePanel();
    await firebase.auth().signOut();
    window.showToast?.('Đã đăng xuất thành công 👋', 'info');
  });
}

// =============================================
// Liked Photos Panel
// =============================================

function loadLikesPanel() {
  const body      = document.getElementById('panel-likes-body');
  const likedIds  = window.state?.likedPhotos || new Set();
  const allPhotos = window.state?.allPhotos || [];
  const liked     = allPhotos.filter(p => likedIds.has(p.id));

  if (!liked.length) {
    body.innerHTML = createEmptyState('🤍', 'Chưa có ảnh yêu thích', 'Nhấn vào ❤️ trên ảnh bất kỳ để thêm vào đây!');
    return;
  }

  body.innerHTML = `
    <p class="panel-count"><strong>${liked.length}</strong> ảnh đã thích</p>
    ${createPhotoGrid(liked, allPhotos, 'likes-grid', 'Bỏ thích')}
  `;

  document.getElementById('likes-grid')?.addEventListener('click', e => {
    const removeBtn = e.target.closest('.panel-remove-btn');
    if (removeBtn) {
      e.stopPropagation();
      const photoId = parseInt(removeBtn.dataset.photoId);
      window.toggleLike?.(photoId);
      removeBtn.closest('.panel-photo-item')?.remove();
      const n = document.querySelectorAll('#likes-grid .panel-photo-item').length;
      const el = body.querySelector('.panel-count');
      if (el) el.innerHTML = `<strong>${n}</strong> ảnh đã thích`;
      if (!n) body.innerHTML = createEmptyState('🤍', 'Chưa có ảnh yêu thích', 'Nhấn vào ❤️ trên ảnh bất kỳ!');
      return;
    }
    const item = e.target.closest('.panel-photo-item');
    if (item) { closePanel(); window.openModal?.(parseInt(item.dataset.photoIndex)); }
  });
}

// =============================================
// Collections Panel
// =============================================

function loadCollectionsPanel() {
  const body      = document.getElementById('panel-collections-body');
  const bmIds     = window.state?.bookmarks || new Set();
  const allPhotos = window.state?.allPhotos || [];
  const saved     = allPhotos.filter(p => bmIds.has(p.id));

  if (!saved.length) {
    body.innerHTML = createEmptyState('🔖', 'Bộ sưu tập trống', 'Nhấn vào 🔖 trên ảnh bất kỳ để lưu vào đây!');
    return;
  }

  body.innerHTML = `
    <p class="panel-count"><strong>${saved.length}</strong> ảnh đã lưu</p>
    ${createPhotoGrid(saved, allPhotos, 'collections-grid', 'Xóa khỏi bộ sưu tập')}
  `;

  document.getElementById('collections-grid')?.addEventListener('click', e => {
    const removeBtn = e.target.closest('.panel-remove-btn');
    if (removeBtn) {
      e.stopPropagation();
      const photoId = parseInt(removeBtn.dataset.photoId);
      window.toggleBookmark?.(photoId);
      removeBtn.closest('.panel-photo-item')?.remove();
      const n = document.querySelectorAll('#collections-grid .panel-photo-item').length;
      const el = body.querySelector('.panel-count');
      if (el) el.innerHTML = `<strong>${n}</strong> ảnh đã lưu`;
      if (!n) body.innerHTML = createEmptyState('🔖', 'Bộ sưu tập trống', 'Nhấn vào 🔖 trên ảnh bất kỳ!');
      return;
    }
    const item = e.target.closest('.panel-photo-item');
    if (item) { closePanel(); window.openModal?.(parseInt(item.dataset.photoIndex)); }
  });
}
