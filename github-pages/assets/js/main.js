/* ============================================================
   YetyVisuals — интерактив
   ============================================================ */
(function () {
  'use strict';

  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  /* --- Конфиг хостинга и реклама --- */
  var config = window.YV_CONFIG || {};
  var adClient = config.adClient || '';
  var adSlots = config.adSlots || {};
  var downloadMode = config.downloadMode || 'local';
  var isStatic = config.mode === 'static';
  var supabaseUrl = (config.supabaseUrl || '').replace(/\/+$/, '');
  var supabaseKey = config.supabaseAnonKey || '';
  var jarUrl = config.jarUrl || 'downloads/yeti-visuals.jar';
  var session = null;

  function initAds() {
    if (!adClient) return;
    var script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(adClient);
    document.head.appendChild(script);

    $$('[data-ad-slot]').forEach(function (slot) {
      var name = slot.getAttribute('data-ad-slot');
      var id = adSlots[name];
      if (!id) return;
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', adClient);
      ins.setAttribute('data-ad-slot', id);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      slot.innerHTML = '';
      slot.appendChild(ins);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
      catch (_) {}
    });
  }
  initAds();

  /* --- Год в футере --- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* --- Навбар: активная ссылка и эффект прокрутки --- */
  var nav = $('#nav');
  var navLinks = $$('.nav__links a');
  var sections = navLinks
    .map(function (link) { return $(link.getAttribute('href')); })
    .filter(Boolean);

  function onScroll() {
    if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);

    var current = '';
    var offset = window.scrollY + window.innerHeight * 0.32;
    sections.forEach(function (section) {
      if (section.offsetTop <= offset) current = section.id;
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Мобильное меню --- */
  var burger = $('#burger');
  var links = $('#navLinks');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    $$('a', links).forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Появление блоков при скролле --- */
  var revealItems = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach(function (el) { observer.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* --- Превью: переключатели --- */
  $$('.toggle').forEach(function (button) {
    button.addEventListener('click', function () {
      button.classList.toggle('is-on');
    });
  });

  /* --- Превью: вкладки --- */
  var appTabs = $$('[data-app-tab]');
  var mods = $$('.mod');
  appTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      appTabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var filter = tab.getAttribute('data-app-tab');
      mods.forEach(function (mod) {
        mod.hidden = filter !== 'all' && mod.getAttribute('data-cat') !== filter;
      });
    });
  });

  /* --- FAQ аккордеон --- */
  $$('.faq__q').forEach(function (button) {
    button.addEventListener('click', function () {
      var item = button.parentElement;
      var open = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  /* --- Toast --- */
  var toast = $('#toast');
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-show'); }, 3200);
  }

  /* --- Регистрация и вход --- */
  var loginBtn = $('#loginBtn');
  var loginModal = $('#loginModal');
  var authForm = $('#authForm');
  var authLogin = $('#authLogin');
  var authPassword = $('#authPassword');
  var authConfirm = $('#authConfirm');
  var confirmLabel = $('#confirmLabel');
  var authError = $('#authError');
  var authSubmit = $('#authSubmit');
  var loginTitle = $('#loginTitle');
  var authTabs = $$('[data-auth-tab]');
  var userMenu = $('#userMenu');
  var userName = $('#userName');
  var logoutBtn = $('#logoutBtn');
  var authMode = 'login';

  function renderUser(login) {
    if (login) {
      if (loginBtn) loginBtn.hidden = true;
      if (userMenu) userMenu.hidden = false;
      if (userName) userName.textContent = login;
    } else {
      if (loginBtn) loginBtn.hidden = false;
      if (userMenu) userMenu.hidden = true;
      if (userName) userName.textContent = '';
    }
  }

  function setAuthMode(mode) {
    authMode = mode;
    var register = mode === 'register';
    authTabs.forEach(function (tab) {
      tab.classList.toggle('is-active', tab.getAttribute('data-auth-tab') === mode);
    });
    authConfirm.hidden = !register;
    confirmLabel.hidden = !register;
    authPassword.autocomplete = register ? 'new-password' : 'current-password';
    if (authSubmit) authSubmit.textContent = register ? 'Зарегистрироваться' : 'Войти';
    if (loginTitle) loginTitle.textContent = register ? 'Регистрация' : 'Вход';
    if (authError) authError.hidden = true;
  }

  function openLogin() {
    if (!loginModal) return;
    setAuthMode('login');
    loginModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (authLogin) authLogin.focus();
  }

  function closeLogin() {
    if (!loginModal || loginModal.hidden) return;
    loginModal.hidden = true;
    document.body.style.overflow = '';
  }

  function isLocalPreview() {
    return location.protocol === 'file:' || location.protocol === 'oc-preview:';
  }

  function apiUrl(path) {
    return isLocalPreview() ? 'http://127.0.0.1:3000' + path : path;
  }

  function api(path, options) {
    return fetch(apiUrl(path), Object.assign({ credentials: 'include' }, options || {}));
  }

  /* --- Supabase: вход/регистрация без сервера --- */
  function supabaseHeaders(withAuth) {
    var headers = { 'apikey': supabaseKey, 'Content-Type': 'application/json' };
    if (withAuth && session && session.access_token) {
      headers.Authorization = 'Bearer ' + session.access_token;
    }
    return headers;
  }

  function emailFor(login) {
    return login.toLowerCase() + '@yetyvisuals.local';
  }

  function saveSession(tokens, login) {
    session = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      login: login
    };
    try { localStorage.setItem('yv_session', JSON.stringify(session)); } catch (_) {}
  }

  async function recordRegistration(login) {
    if (!supabaseUrl) return;
    try {
      var ipRes = await fetch(config.ipService || 'https://api.ipify.org?format=json');
      var ipData = await ipRes.json();
      await fetch(supabaseUrl + '/rest/v1/registrations', {
        method: 'POST',
        headers: supabaseHeaders(true),
        body: JSON.stringify({ login: login, ip: ipData.ip || '' })
      });
    } catch (_) {}
  }

  async function supabaseAuth(mode, login, password) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Укажите Supabase URL и anon key в config.js');
    }
    var endpoint = mode === 'register'
      ? '/auth/v1/signup'
      : '/auth/v1/token?grant_type=password';
    var res = await fetch(supabaseUrl + endpoint, {
      method: 'POST',
      headers: supabaseHeaders(false),
      body: JSON.stringify({
        email: emailFor(login),
        password: password,
        data: { login: login }
      })
    });
    var data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || data.message || data.error_description || 'Ошибка');
    }
    var tokens = data.session || data;
    if (!tokens.access_token) {
      throw new Error('Включите выход без подтверждения почты в Supabase → Auth → Providers → Email');
    }
    saveSession(tokens, login);
    if (mode === 'register') await recordRegistration(login);
    return login;
  }

  function showAuthError(message) {
    if (!authError) return;
    authError.textContent = message;
    authError.hidden = false;
  }

  async function initAuth() {
    if (isStatic) {
      var raw = null;
      try { raw = localStorage.getItem('yv_session'); } catch (_) {}
      if (!raw || !supabaseUrl || !supabaseKey) { renderUser(null); return; }
      try {
        session = JSON.parse(raw);
        var check = await fetch(supabaseUrl + '/auth/v1/user', {
          headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + session.access_token }
        });
        if (!check.ok) throw new Error('expired');
        renderUser(session.login);
      } catch (_) {
        session = null;
        try { localStorage.removeItem('yv_session'); } catch (_) {}
        renderUser(null);
      }
      return;
    }
    try {
      var res = await api('/api/me');
      var data = await res.json();
      renderUser(data.login);
    } catch (_) {
      renderUser(null);
    }
  }

  if (loginBtn) loginBtn.addEventListener('click', openLogin);
  authTabs.forEach(function (tab) {
    tab.addEventListener('click', function () { setAuthMode(tab.getAttribute('data-auth-tab')); });
  });

  if (authForm) {
    authForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      var login = authLogin.value.trim();
      var password = authPassword.value;
      if (authMode === 'register' && password !== authConfirm.value) {
        showAuthError('Пароли не совпадают');
        return;
      }
      try {
        var userNameResult;
        if (isStatic) {
          userNameResult = await supabaseAuth(authMode, login, password);
        } else {
          var res = await api('/api/' + authMode, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: login, password: password })
          });
          var data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка');
          userNameResult = data.login;
        }
        renderUser(userNameResult);
        closeLogin();
        showToast(authMode === 'register'
          ? 'Аккаунт создан. Добро пожаловать, ' + userNameResult
          : 'Вы вошли как ' + userNameResult);
      } catch (error) {
        showAuthError(error.message || 'Сервер недоступен. Попробуйте позже.');
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      if (isStatic) {
        try {
          await fetch(supabaseUrl + '/auth/v1/logout', {
            method: 'POST',
            headers: supabaseHeaders(true)
          });
        } catch (_) {}
        session = null;
        try { localStorage.removeItem('yv_session'); } catch (_) {}
      } else {
        try { await api('/api/logout', { method: 'POST' }); } catch (_) {}
      }
      renderUser(null);
      showToast('Вы вышли');
    });
  }
  if (loginModal) {
    $$('[data-login-close]', loginModal).forEach(function (el) {
      el.addEventListener('click', closeLogin);
    });
  }
  document.addEventListener('click', function (event) {
    if (userMenu && !userMenu.hidden && !event.target.closest('.nav__user')) userMenu.hidden = true;
  });
  initAuth();

  /* --- Рекламный гейт перед скачиванием --- */
  var modal = $('#modal');
  var modalContinue = $('#modalContinue');
  var lastFocused = null;
  var adPassed = false;

  function openAdGate() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var close = $('.modal__close', modal);
    if (close) close.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    adPassed = true;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  async function startDownload(file) {
    if (!file || file === '#') {
      showToast('Файл не найден — проверь ссылку в каталоге.');
      return;
    }
    if (isStatic) {
      window.location.href = jarUrl;
      showToast('Скачивание началось');
      return;
    }
    if (downloadMode === 'stream') {
      window.location.href = apiUrl('/api/download');
      showToast('Скачивание началось');
      return;
    }
    try {
      var res = await api('/api/download', { method: 'POST' });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Ошибка сохранения');
      showToast('Файл сохранён в «Загрузки»');
      return;
    } catch (_) {
      var beacon = new Image();
      beacon.onload = function () {
        showToast('Файл сохранён в «Загрузки»');
      };
      beacon.onerror = function () {
        var link = document.createElement('a');
        link.href = file;
        link.setAttribute('download', 'Yeti Visuals.jar');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Не удалось сохранить файл');
      };
      beacon.src = apiUrl('/api/download.gif?t=' + Date.now());
    }
  }

  $$('[data-download]').forEach(function (button) {
    button.addEventListener('click', function () {
      var file = button.getAttribute('data-file');
      if (adPassed) {
        startDownload(file);
      } else {
        openAdGate();
      }
    });
  });

  if (modalContinue) modalContinue.addEventListener('click', closeModal);
  if (modal) {
    $$('[data-close]', modal).forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeModal();
      closeLogin();
    }
  });

  /* --- Галерея: автоперелистывание скриншотов --- */
  var gallery = $('#gallery');
  var slides = gallery ? $$('.gallery__slide', gallery) : [];
  var dotsWrap = $('#galleryDots');
  var galleryTimer;
  var slideIndex = 0;

  if (gallery && slides.length) {
    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', 'Фото ' + (i + 1));
      dot.addEventListener('click', function () { showSlide(i); restartGallery(); });
      dotsWrap.appendChild(dot);
    });
    var dots = $$('button', dotsWrap);

    function showSlide(i) {
      slideIndex = (i + slides.length) % slides.length;
      slides.forEach(function (slide, k) { slide.classList.toggle('is-active', k === slideIndex); });
      dots.forEach(function (dot, k) { dot.classList.toggle('is-active', k === slideIndex); });
    }
    function restartGallery() {
      clearInterval(galleryTimer);
      galleryTimer = setInterval(function () { showSlide(slideIndex + 1); }, 4500);
    }

    $('#galleryPrev').addEventListener('click', function () { showSlide(slideIndex - 1); restartGallery(); });
    $('#galleryNext').addEventListener('click', function () { showSlide(slideIndex + 1); restartGallery(); });
    gallery.addEventListener('mouseenter', function () { clearInterval(galleryTimer); });
    gallery.addEventListener('mouseleave', restartGallery);

    showSlide(0);
    restartGallery();
  }

  /* --- Открытую как файл страницу переводим на рабочий адрес сервера --- */
  if (isLocalPreview()) {
    var ping = new Image();
    ping.onload = function () {
      location.replace('http://127.0.0.1:3000/' + location.hash);
    };
    ping.src = 'http://127.0.0.1:3000/api/ping.gif?t=' + Date.now();
  }
})();
