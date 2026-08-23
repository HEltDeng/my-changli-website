const CONFIG_URL = '/config/site-config.json';
const SUPPORT_CONFIG_URL = '/config/support-config.json';

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
    const links = [];
    if (config.filing.icpNumber) {
      links.push(`<a href="${config.filing.icpUrl}" rel="noopener noreferrer">${config.filing.icpNumber}</a>`);
    }
    if (config.filing.publicSecurityNumber && config.filing.publicSecurityUrl) {
      const icon = config.filing.publicSecurityIcon
        ? `<img src="${config.filing.publicSecurityIcon}" alt="" width="18" height="18">`
        : '';
      links.push(`<a href="${config.filing.publicSecurityUrl}" rel="noopener noreferrer">${icon}${config.filing.publicSecurityNumber}</a>`);
    }
    if (links.length) {
      container.innerHTML = links.join('');
      container.hidden = false;
    }
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
  let supportConfig = { alipayQrImage: '', wechatQrImage: '' };

  const renderPanel = (kind) => {
    const image = document.querySelector(`[data-support-image="${kind}"]`);
    const placeholder = document.querySelector(`[data-support-placeholder="${kind}"]`);
    if (!image || !placeholder) return;

    const source = kind === 'alipay' ? supportConfig.alipayQrImage : supportConfig.wechatQrImage;
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

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const kind = button.dataset.supportButton;
      buttons.forEach((item) => item.setAttribute('aria-expanded', String(item === button)));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.supportPanel !== kind;
      });
      if (emptyState) emptyState.hidden = true;
      renderPanel(kind);
    });
  });

  try {
    const response = await fetch(SUPPORT_CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Support config request failed: ${response.status}`);
    supportConfig = await response.json();
    const activeButton = buttons.find((button) => button.getAttribute('aria-expanded') === 'true');
    if (activeButton) renderPanel(activeButton.dataset.supportButton);
    document.documentElement.dataset.supportConfigState = 'ready';
  } catch (error) {
    console.error('Unable to load support configuration.', error);
    document.documentElement.dataset.supportConfigState = 'error';
  }
};

const applyConfig = (config) => {
  setText('[data-app-version]', config.displayVersion);
  setText('[data-footer-version]', config.displayVersion);
  setupMailLinks(config);
  setupFiling(config);
  setupDownload(config);
  setupIos(config);
  setupTimeline(config);
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
