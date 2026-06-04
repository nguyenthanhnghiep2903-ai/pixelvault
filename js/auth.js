/**
 * PixelVault — Firebase Authentication
 * Đăng nhập, Đăng ký, Google Sign-In, Đặt lại mật khẩu, Đồng bộ Likes
 */

'use strict';

// =============================================
// Firebase Init
// =============================================

const firebaseConfig = {
  apiKey: "AIzaSyCTlRnWHY7GcVagFRu4-UMx-P7lH2BR2RA",
  authDomain: "pixelvault-682e6.firebaseapp.com",
  projectId: "pixelvault-682e6",
  storageBucket: "pixelvault-682e6.firebasestorage.app",
  messagingSenderId: "601124471832",
  appId: "1:601124471832:web:e06ce96975cbd914d1ef6d"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// =============================================
// Helpers
// =============================================

const toast = (msg, type = 'success') => window.showToast?.(msg, type);

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<div class="spinner"></div> Đang xử lý...';
  } else {
    btn.innerHTML = btn.dataset.original || btn.innerHTML;
  }
}

function showFormError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<span>⚠</span> ${msg}`;
  el.classList.add('visible');
}

function clearErrors() {
  document.querySelectorAll('.auth-error').forEach(el => {
    el.innerHTML = '';
    el.classList.remove('visible');
  });
}

function clearForms() {
  document.querySelectorAll('.auth-form input').forEach(el => (el.value = ''));
  const forgotSuccess = document.getElementById('forgot-success');
  const forgotBtn = document.getElementById('forgot-submit-btn');
  if (forgotSuccess) forgotSuccess.classList.add('hidden');
  if (forgotBtn) forgotBtn.classList.remove('hidden');
}

function getAuthError(code) {
  const map = {
    'auth/email-already-in-use'   : 'Email này đã được đăng ký. Hãy đăng nhập!',
    'auth/invalid-email'           : 'Email không hợp lệ.',
    'auth/weak-password'           : 'Mật khẩu quá yếu. Cần ít nhất 6 ký tự.',
    'auth/user-not-found'          : 'Không tìm thấy tài khoản với email này.',
    'auth/wrong-password'          : 'Mật khẩu không đúng.',
    'auth/invalid-credential'      : 'Email hoặc mật khẩu không đúng.',
    'auth/too-many-requests'       : 'Quá nhiều lần thử. Vui lòng thử lại sau.',
    'auth/network-request-failed'  : 'Lỗi kết nối mạng. Kiểm tra internet.',
    'auth/popup-closed-by-user'    : '',
    'auth/popup-blocked'           : 'Trình duyệt chặn popup. Cho phép popup và thử lại.',
    'auth/user-disabled'           : 'Tài khoản này đã bị vô hiệu hóa.',
  };
  return map[code] || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
}

// =============================================
// Auth State
// =============================================

let currentUser = null;

auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (user) {
    updateNavbarLoggedIn(user);
    await syncLikesFromCloud(user);
    const name = user.displayName || user.email.split('@')[0];
    toast(`Chào mừng, ${name}! 👋`, 'success');
  } else {
    updateNavbarLoggedOut();
  }
});

// =============================================
// Navbar Update
// =============================================

function updateNavbarLoggedIn(user) {
  const authBtns  = document.getElementById('auth-buttons');
  const userMenu  = document.getElementById('user-menu');
  const avatarImg = document.getElementById('user-avatar');
  const avatarLetter = document.getElementById('user-avatar-initial');
  const userName  = document.getElementById('user-name');
  const ddName    = document.getElementById('dropdown-user-name');
  const ddEmail   = document.getElementById('dropdown-user-email');

  if (authBtns)  authBtns.classList.add('hidden');
  if (userMenu)  userMenu.classList.remove('hidden');

  const displayName = user.displayName || user.email.split('@')[0];

  if (user.photoURL && avatarImg) {
    avatarImg.src = user.photoURL;
    avatarImg.classList.remove('hidden');
    if (avatarLetter) avatarLetter.classList.add('hidden');
  } else {
    if (avatarImg) avatarImg.classList.add('hidden');
    if (avatarLetter) {
      avatarLetter.textContent = displayName.charAt(0).toUpperCase();
      avatarLetter.classList.remove('hidden');
    }
  }

  if (userName) userName.textContent = displayName.length > 14 ? displayName.slice(0, 14) + '…' : displayName;
  if (ddName)   ddName.textContent   = displayName;
  if (ddEmail)  ddEmail.textContent  = user.email;
}

function updateNavbarLoggedOut() {
  const authBtns = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  if (authBtns) authBtns.classList.remove('hidden');
  if (userMenu) userMenu.classList.add('hidden');
}

// =============================================
// Modal Control
// =============================================

const authBackdrop = document.getElementById('auth-backdrop');

function openAuthModal(tab = 'login') {
  authBackdrop.classList.add('open');
  authBackdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  switchTab(tab);
  clearErrors();
  clearForms();

  // Focus first input
  setTimeout(() => {
    const first = authBackdrop.querySelector(`#${tab}-form .form-input`);
    if (first) first.focus();
  }, 300);
}

function closeAuthModal() {
  authBackdrop.classList.remove('open');
  authBackdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  closeUserDropdown();
}

authBackdrop.addEventListener('click', e => {
  if (e.target === authBackdrop) closeAuthModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && authBackdrop.classList.contains('open')) closeAuthModal();
});

// =============================================
// Tab Switching
// =============================================

const TAB_TITLES = {
  login    : { title: 'Chào mừng trở lại',    sub: 'Đăng nhập để khám phá kho ảnh vô tận' },
  register : { title: 'Tạo tài khoản mới',     sub: 'Miễn phí và luôn luôn miễn phí' },
  forgot   : { title: 'Đặt lại mật khẩu',      sub: 'Nhập email để nhận hướng dẫn đặt lại' },
};

function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
    t.setAttribute('aria-selected', t.dataset.tab === tab);
  });

  // Show/hide tabs section
  const tabBar = document.getElementById('auth-tab-bar');
  if (tabBar) tabBar.style.display = tab === 'forgot' ? 'none' : 'flex';

  // Show/hide forms
  ['login', 'register', 'forgot'].forEach(f => {
    const el = document.getElementById(`${f}-form`);
    if (el) el.classList.toggle('hidden', f !== tab);
  });

  // Update titles
  const info = TAB_TITLES[tab] || TAB_TITLES.login;
  const titleEl = document.getElementById('auth-title');
  const subEl   = document.getElementById('auth-subtitle');
  if (titleEl) titleEl.textContent = info.title;
  if (subEl)   subEl.textContent   = info.sub;
}

// Tab button clicks
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// Link clicks
const on = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
on('switch-to-register',   e => { e.preventDefault(); switchTab('register'); });
on('switch-to-login',      e => { e.preventDefault(); switchTab('login'); });
on('forgot-password-link', e => { e.preventDefault(); switchTab('forgot'); });
on('back-to-login',        e => { e.preventDefault(); switchTab('login'); });
on('auth-close-btn',       () => closeAuthModal());
on('open-login-btn',       () => openAuthModal('login'));
on('open-register-btn',    () => openAuthModal('register'));

// =============================================
// Register
// =============================================

on('register-submit-btn', async () => {
  clearErrors();
  const name     = document.getElementById('register-name')?.value.trim();
  const email    = document.getElementById('register-email')?.value.trim();
  const pass     = document.getElementById('register-password')?.value;
  const confirm  = document.getElementById('register-confirm-password')?.value;

  if (!name)               return showFormError('register-error', 'Vui lòng nhập tên của bạn.');
  if (!email)              return showFormError('register-error', 'Vui lòng nhập email.');
  if (!pass)               return showFormError('register-error', 'Vui lòng nhập mật khẩu.');
  if (pass.length < 6)     return showFormError('register-error', 'Mật khẩu cần ít nhất 6 ký tự.');
  if (pass !== confirm)    return showFormError('register-error', 'Mật khẩu xác nhận không khớp.');

  setLoading('register-submit-btn', true);
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    await db.collection('users').doc(cred.user.uid).set({
      displayName : name,
      email,
      photoURL    : '',
      createdAt   : firebase.firestore.FieldValue.serverTimestamp(),
      likes       : [],
    });
    closeAuthModal();
    toast(`Đăng ký thành công! Chào mừng ${name} 🎉`, 'success');
  } catch (err) {
    showFormError('register-error', getAuthError(err.code));
  } finally {
    setLoading('register-submit-btn', false);
  }
});

document.getElementById('register-confirm-password')
  ?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('register-submit-btn')?.click(); });

// =============================================
// Login
// =============================================

on('login-submit-btn', async () => {
  clearErrors();
  const email = document.getElementById('login-email')?.value.trim();
  const pass  = document.getElementById('login-password')?.value;

  if (!email) return showFormError('login-error', 'Vui lòng nhập email.');
  if (!pass)  return showFormError('login-error', 'Vui lòng nhập mật khẩu.');

  setLoading('login-submit-btn', true);
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeAuthModal();
  } catch (err) {
    showFormError('login-error', getAuthError(err.code));
  } finally {
    setLoading('login-submit-btn', false);
  }
});

document.getElementById('login-password')
  ?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-submit-btn')?.click(); });

// =============================================
// Google Sign-In
// =============================================

async function signInWithGoogle() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user   = result.user;
    const ref    = db.collection('users').doc(user.uid);
    const snap   = await ref.get();
    if (!snap.exists) {
      await ref.set({
        displayName : user.displayName,
        email       : user.email,
        photoURL    : user.photoURL || '',
        createdAt   : firebase.firestore.FieldValue.serverTimestamp(),
        likes       : [],
      });
    }
    closeAuthModal();
  } catch (err) {
    const msg = getAuthError(err.code);
    if (msg) toast(msg, 'error');
  }
}

on('google-login-btn',    signInWithGoogle);
on('google-register-btn', signInWithGoogle);

// =============================================
// Forgot Password
// =============================================

on('forgot-submit-btn', async () => {
  clearErrors();
  const email = document.getElementById('forgot-email')?.value.trim();
  if (!email) return showFormError('forgot-error', 'Vui lòng nhập email.');

  setLoading('forgot-submit-btn', true);
  try {
    await auth.sendPasswordResetEmail(email);
    document.getElementById('forgot-success')?.classList.remove('hidden');
    document.getElementById('forgot-submit-btn')?.classList.add('hidden');
    toast('Email đặt lại mật khẩu đã được gửi! 📧', 'success');
  } catch (err) {
    showFormError('forgot-error', getAuthError(err.code));
  } finally {
    setLoading('forgot-submit-btn', false);
  }
});

// =============================================
// Logout
// =============================================

on('logout-btn', async () => {
  closeUserDropdown();
  await auth.signOut();
  // Restore local likes
  if (window.state) {
    window.state.likedPhotos = new Set(JSON.parse(localStorage.getItem('pv_likes') || '[]'));
    window.refreshLikeButtons?.();
  }
  toast('Đã đăng xuất thành công 👋', 'info');
});

// =============================================
// User Dropdown
// =============================================

const userMenuEl = document.getElementById('user-menu');
const userDropdownEl = document.getElementById('user-dropdown');
const chevronEl = document.querySelector('.user-chevron');

function toggleUserDropdown(e) {
  e.stopPropagation();
  const isOpen = userDropdownEl?.classList.toggle('open');
  if (chevronEl) chevronEl.style.transform = isOpen ? 'rotate(180deg)' : '';
  document.getElementById('user-avatar-btn')?.setAttribute('aria-expanded', isOpen);
}

function closeUserDropdown() {
  userDropdownEl?.classList.remove('open');
  if (chevronEl) chevronEl.style.transform = '';
}

on('user-avatar-btn', toggleUserDropdown);

document.addEventListener('click', e => {
  if (!userMenuEl?.contains(e.target)) closeUserDropdown();
});

// =============================================
// Password Visibility Toggle
// =============================================

document.querySelectorAll('.toggle-password').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? '🙈' : '👁️';
  });
});

// =============================================
// Firestore — Likes Sync
// =============================================

async function syncLikesFromCloud(user) {
  try {
    const snap = await db.collection('users').doc(user.uid).get();
    if (!snap.exists) return;

    const cloudLikes = new Set(snap.data().likes || []);
    const localLikes = new Set(JSON.parse(localStorage.getItem('pv_likes') || '[]'));
    const merged = new Set([...cloudLikes, ...localLikes]);

    if (window.state) window.state.likedPhotos = merged;

    // Push any local-only likes to cloud
    if (localLikes.size > 0) {
      await db.collection('users').doc(user.uid)
        .update({ likes: [...merged] }).catch(() => {});
    }

    window.refreshLikeButtons?.();
  } catch (err) {
    console.warn('[PixelVault] Likes sync error:', err);
  }
}

// =============================================
// Expose API for app.js
// =============================================

window.authModule = {
  getCurrentUser: () => currentUser,
  openAuthModal,

  async saveLike(photoId, isNowLiked) {
    if (!currentUser) return;
    try {
      const ref = db.collection('users').doc(currentUser.uid);
      if (isNowLiked) {
        await ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(photoId) });
      } else {
        await ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(photoId) });
      }
    } catch (err) {
      console.warn('[PixelVault] Save like error:', err);
    }
  }
};
