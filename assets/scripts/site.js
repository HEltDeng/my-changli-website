const CONFIG_URL = '/config/site-config.json';
const SUPPORT_CONFIG_URL = '/config/support-config.json';
const PUBLIC_ANNOUNCEMENT_TIMEOUT_MS = 4500;
const PUBLIC_ANNOUNCEMENT_REFRESH_MS = 5 * 60 * 1000;
const ANNOUNCEMENT_READ_KEY_PREFIX = 'mychangli:web-announcement-read:';

const setText = (selector, value) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
};

const setupNavigation = () => {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-site-nav]');
  if (!button || !menu) return;

  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '打开导航菜单');
    menu.dataset.open = 'false';
  };

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!isOpen));
    button.setAttribute('aria-label', isOpen ? '打开导航菜单' : '关闭导航菜单');
    menu.dataset.open = String(!isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
};

const setupCurrentPage = () => {
  const page = document.body.dataset.page;
  document.querySelectorAll('[data-nav-page]').forEach((link) => {
    if (link.dataset.navPage === page) link.setAttribute('aria-current', 'page');
  });
};

const setupFeatureAnchor = () => {
  const centerHashTarget = () => {
    if (!window.location.hash) return;

    let targetId;
    try {
      targetId = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
  };

  if (document.readyState === 'complete') centerHashTarget();
  else window.addEventListener('load', centerHashTarget, { once: true });
  window.addEventListener('hashchange', centerHashTarget);
};

const announcementTimestamp = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const normalizeAnnouncement = (value) => {
  if (!value || typeof value !== 'object') return null;
  const id = value.id === undefined || value.id === null ? '' : String(value.id).trim();
  const title = typeof value.title === 'string' ? value.title.trim() : '';
  const content = typeof value.content === 'string' ? value.content : '';
  if (!id || !title || !content.trim()) return null;

  const publishedAt = value.published_at ?? value.publishedAt ?? '';
  const updatedAt = value.updated_at ?? value.updatedAt ?? publishedAt;
  return { id, title, content, publishedAt, updatedAt };
};

const extractAnnouncements = (payload) => {
  const data = payload && typeof payload === 'object' && payload.data && typeof payload.data === 'object'
    ? payload.data
    : payload;
  if (!data || !Array.isArray(data.websiteAnnouncements)) return [];

  return data.websiteAnnouncements
    .map(normalizeAnnouncement)
    .filter(Boolean)
    .sort((left, right) => (
      announcementTimestamp(right.publishedAt) - announcementTimestamp(left.publishedAt)
      || announcementTimestamp(right.updatedAt) - announcementTimestamp(left.updatedAt)
    ));
};

const formatAnnouncementDate = (value) => {
  const timestamp = announcementTimestamp(value);
  if (!timestamp) return '发布日期待配置';
  const date = new Date(timestamp < 100000000000 ? timestamp * 1000 : timestamp);
  if (Number.isNaN(date.getTime())) return '发布日期待配置';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date).replaceAll('/', '-');
};

const announcementReadKey = (announcement) => (
  `${ANNOUNCEMENT_READ_KEY_PREFIX}${announcement.id}:${String(announcement.updatedAt || announcement.publishedAt || '')}`
);

const isAnnouncementRead = (announcement) => {
  try {
    return window.localStorage.getItem(announcementReadKey(announcement)) === '1';
  } catch {
    return false;
  }
};

const markAnnouncementRead = (announcement) => {
  try {
    window.localStorage.setItem(announcementReadKey(announcement), '1');
  } catch {
    // A storage-disabled browser should still be able to read the notice.
  }
};

const publicWebsiteAnnouncementsUrl = (config) => {
  const configuredBase = typeof config.publicApiBaseUrl === 'string'
    ? config.publicApiBaseUrl.trim()
    : '';
  const base = (configuredBase || '/api/v1').replace(/\/+$/, '');
  if (base.endsWith('/public/website-announcements')) return base;
  const configuredPath = typeof config.publicWebsiteAnnouncementsPath === 'string'
    ? config.publicWebsiteAnnouncementsPath.trim()
    : '/public/website-announcements';
  return `${base}/${configuredPath.replace(/^\/+/, '')}`;
};

const setupAnnouncements = (config) => {
  const region = document.querySelector('[data-announcement-region]');
  const dialog = document.querySelector('[data-announcement-dialog]');
  const trigger = document.querySelector('[data-announcement-trigger]');
  if (!region || !dialog || !trigger || typeof dialog.showModal !== 'function') return;

  const summary = region.querySelector('[data-announcement-summary]');
  const dialogTitle = dialog.querySelector('[data-announcement-dialog-title]');
  const dialogDate = dialog.querySelector('[data-announcement-date]');
  const dialogContent = dialog.querySelector('[data-announcement-content]');
  const closeButton = dialog.querySelector('[data-announcement-close]');
  const confirmButton = dialog.querySelector('[data-announcement-confirm]');
  if (!summary || !dialogTitle || !dialogDate || !dialogContent || !closeButton || !confirmButton) return;

  let latestAnnouncement = null;
  let lastLoadedAt = 0;
  let previouslyFocused = trigger;

  const focusableElements = () => Array.from(dialog.querySelectorAll(
    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  )).filter((element) => !element.hidden && element.getClientRects().length > 0);

  const closeDialog = () => {
    if (dialog.open) dialog.close();
    if (previouslyFocused && previouslyFocused.isConnected) previouslyFocused.focus();
  };

  const openDialog = (announcement) => {
    if (!announcement) return;
    latestAnnouncement = announcement;
    dialogTitle.textContent = announcement.title;
    dialogDate.textContent = formatAnnouncementDate(announcement.publishedAt);
    dialogDate.dateTime = String(announcement.publishedAt || '');
    dialogContent.textContent = announcement.content;
    const activeElement = document.activeElement;
    previouslyFocused = activeElement instanceof HTMLElement
      && activeElement !== document.body
      && !dialog.contains(activeElement)
      ? activeElement
      : trigger;
    if (!dialog.open) dialog.showModal();
    window.requestAnimationFrame(() => {
      closeButton.focus();
    });
  };

  const handleDialogKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = focusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const renderAnnouncement = (announcement) => {
    latestAnnouncement = announcement;
    summary.textContent = announcement.title;
    region.hidden = false;
  };

  const hideAnnouncement = () => {
    latestAnnouncement = null;
    region.hidden = true;
    if (dialog.open) closeDialog();
  };

  const loadAnnouncements = async ({ force = false } = {}) => {
    if (!force && lastLoadedAt && Date.now() - lastLoadedAt < PUBLIC_ANNOUNCEMENT_REFRESH_MS) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PUBLIC_ANNOUNCEMENT_TIMEOUT_MS);
    try {
      const response = await fetch(publicWebsiteAnnouncementsUrl(config), {
        cache: 'no-cache',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Website announcement request failed: ${response.status}`);
      const announcements = extractAnnouncements(await response.json());
      lastLoadedAt = Date.now();
      if (!announcements.length) {
        hideAnnouncement();
        return;
      }
      const announcement = announcements[0];
      renderAnnouncement(announcement);
      if (!isAnnouncementRead(announcement)) {
        window.requestAnimationFrame(() => openDialog(announcement));
      }
    } catch (error) {
      hideAnnouncement();
      console.warn('Announcement feed unavailable; continuing without it.', error);
    } finally {
      window.clearTimeout(timeout);
    }
  };

  trigger.addEventListener('click', () => openDialog(latestAnnouncement));
  closeButton.addEventListener('click', closeDialog);
  confirmButton.addEventListener('click', () => {
    if (latestAnnouncement) markAnnouncementRead(latestAnnouncement);
    closeDialog();
  });
  dialog.addEventListener('keydown', handleDialogKeydown);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadAnnouncements();
  });

  loadAnnouncements();
};

const setupMailLinks = (config) => {
  const address = `${config.contact.localPart}@${config.contact.domain}`;
  const subjects = {
    contact: '我的长理联系反馈',
    complaint: '我的长理投诉举报',
  };

  document.querySelectorAll('[data-mail-kind]').forEach((link) => {
    const subject = subjects[link.dataset.mailKind] || subjects.contact;
    link.href = `mailto:${address}?subject=${encodeURIComponent(subject)}`;
  });
};

const setupFiling = (config) => {
  document.querySelectorAll('[data-filing]').forEach((container) => {
    const filing = config.filing || {};
    const icpNumber = typeof filing.icpNumber === 'string' ? filing.icpNumber.trim() : '';
    const icpUrl = typeof filing.icpUrl === 'string' ? filing.icpUrl.trim() : '';
    const publicSecurityNumber = typeof filing.publicSecurityNumber === 'string'
      ? filing.publicSecurityNumber.trim()
      : '';
    const publicSecurityUrl = typeof filing.publicSecurityUrl === 'string'
      ? filing.publicSecurityUrl.trim()
      : '';
    const publicSecurityIcon = typeof filing.publicSecurityIcon === 'string'
      ? filing.publicSecurityIcon.trim()
      : '';

    container.replaceChildren();
    if (!icpNumber && !(publicSecurityNumber && publicSecurityUrl)) {
      container.hidden = true;
      return;
    }

    const copyright = document.createElement('span');
    copyright.textContent = '© 2026 我的长理';
    container.append(copyright);
    if (icpNumber && icpUrl) {
      const link = document.createElement('a');
      link.href = icpUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = icpNumber;
      container.append(link);
    }
    if (publicSecurityNumber && publicSecurityUrl) {
      const link = document.createElement('a');
      link.href = publicSecurityUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (publicSecurityIcon) {
        const icon = document.createElement('img');
        icon.src = publicSecurityIcon;
        icon.alt = '';
        icon.width = 18;
        icon.height = 18;
        link.append(icon);
      }
      link.append(document.createTextNode(publicSecurityNumber));
      container.append(link);
    }
    container.hidden = false;
  });
};

const setupDownload = (config) => {
  setText('[data-release-date]', config.releaseDate || '待配置');
  setText('[data-apk-size]', config.apkSize || '待配置');
  setText('[data-apk-sha256]', config.apkSha256 || '待配置');

  document.querySelectorAll('[data-android-download]').forEach((link) => {
    if (config.androidDownloadUrl) {
      link.href = config.androidDownloadUrl;
      link.removeAttribute('aria-disabled');
      link.classList.remove('button-disabled');
      link.classList.add('button-primary');
      link.textContent = '立即下载 APK';
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.classList.remove('button-primary');
      link.classList.add('button-disabled');
      link.textContent = '下载地址待配置';
    }
  });

  document.querySelectorAll('[data-download-state]').forEach((element) => {
    element.textContent = config.androidDownloadUrl
      ? '安装包下载已启用。'
      : 'Android 平台已开放，安装包地址尚未写入配置。';
  });
};

const setupIos = (config) => {
  const isOpen = config.iosStatus === 'open' && Boolean(config.iosDownloadUrl);

  document.querySelectorAll('[data-ios-download]').forEach((link) => {
    if (isOpen) {
      link.href = config.iosDownloadUrl;
      link.removeAttribute('aria-disabled');
      link.classList.remove('button-disabled');
      link.classList.add('button-primary');
      link.textContent = '下载 iOS 版本';
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.classList.remove('button-primary');
      link.classList.add('button-disabled');
      link.innerHTML = 'iOS 版本 <small>敬请期待</small>';
    }
  });

  document.querySelectorAll('[data-ios-platform]').forEach((link) => {
    if (isOpen) {
      link.href = config.iosDownloadUrl;
      link.removeAttribute('aria-disabled');
      link.classList.remove('is-closed');
      link.classList.add('is-open');
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.classList.remove('is-open');
      link.classList.add('is-closed');
    }
  });

  setText('[data-ios-platform-state]', isOpen ? '开放' : '暂未开放');
  setText('[data-ios-platform-note]', isOpen ? '前往下载' : '敬请期待');
};

const setupTimeline = (config) => {
  document.querySelectorAll('[data-release-timeline]').forEach((container) => {
    container.innerHTML = config.releases.map((release) => {
      const summary = release.summary
        ? `<p class="timeline-summary">${release.summary}</p>`
        : '';
      const items = release.items.length
        ? `<ul>${release.items.map((item) => `<li>${item}</li>`).join('')}</ul>`
        : '';
      return `
        <article class="timeline-item${release.current ? ' is-current' : ''}">
          <div class="timeline-dot" aria-hidden="true"></div>
          <div class="timeline-card">
            <div class="timeline-heading">
              <h2>${release.version}</h2>
              <span>${release.status}</span>
            </div>
            ${summary}
            ${items}
          </div>
        </article>`;
    }).join('');
  });
};

const setupSupport = async () => {
  const buttons = Array.from(document.querySelectorAll('[data-support-button]'));
  if (!buttons.length) return;

  const panels = Array.from(document.querySelectorAll('[data-support-panel]'));
  const emptyState = document.querySelector('[data-support-empty]');
  let supportConfig = {
    alipaySupportUrl: '',
    wechatSupportUrl: '',
    alipayQrImage: '',
    wechatQrImage: '',
  };
  const supportFields = {
    alipay: { url: 'alipaySupportUrl', image: 'alipayQrImage' },
    wechat: { url: 'wechatSupportUrl', image: 'wechatQrImage' },
  };
  const getSupportValue = (field) => {
    const value = supportConfig[field];
    return typeof value === 'string' ? value.trim() : '';
  };
  const getSupportUrl = (field) => {
    const value = getSupportValue(field);
    if (!value) return '';

    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname ? url.href : '';
    } catch {
      return '';
    }
  };

  const renderPanel = (kind) => {
    const image = document.querySelector(`[data-support-image="${kind}"]`);
    const placeholder = document.querySelector(`[data-support-placeholder="${kind}"]`);
    const fields = supportFields[kind];
    if (!image || !placeholder || !fields) return;

    const source = getSupportValue(fields.image);
    image.hidden = true;
    image.removeAttribute('src');
    placeholder.hidden = false;

    if (!source) return;

    image.onload = () => {
      image.hidden = false;
      placeholder.hidden = true;
    };
    image.onerror = () => {
      image.hidden = true;
      placeholder.hidden = false;
    };
    image.src = source;
  };

  try {
    const response = await fetch(SUPPORT_CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Support config request failed: ${response.status}`);
    supportConfig = { ...supportConfig, ...await response.json() };
    document.documentElement.dataset.supportConfigState = 'ready';
  } catch (error) {
    console.error('Unable to load support configuration.', error);
    document.documentElement.dataset.supportConfigState = 'error';
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.supportButton;
      const fields = supportFields[kind];
      if (!fields) return;

      const supportUrl = getSupportUrl(fields.url);
      if (supportUrl) {
        window.location.assign(supportUrl);
        return;
      }

      buttons.forEach((item) => item.setAttribute('aria-expanded', String(item === button)));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.supportPanel !== kind;
      });
      if (emptyState) emptyState.hidden = true;
      renderPanel(kind);
    });
  });
};

const applyConfig = (config) => {
  setText('[data-app-version]', config.displayVersion);
  setText('[data-footer-version]', config.displayVersion);
  setupMailLinks(config);
  setupFiling(config);
  setupDownload(config);
  setupIos(config);
  setupTimeline(config);
  setupAnnouncements(config);
  document.documentElement.dataset.configState = 'ready';
};

const loadConfig = async () => {
  try {
    const response = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Config request failed: ${response.status}`);
    applyConfig(await response.json());
  } catch (error) {
    console.error('Unable to load site configuration.', error);
    document.documentElement.dataset.configState = 'error';
  }
};

setupNavigation();
setupCurrentPage();
setupFeatureAnchor();
setupSupport();
loadConfig();
