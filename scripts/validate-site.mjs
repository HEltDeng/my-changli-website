import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = [
  'index.html',
  'features.html',
  'download.html',
  'updates.html',
  'contact.html',
  'thanks.html',
  'support.html',
  'privacy.html',
  'terms.html',
  'manual.html',
];

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

const configPath = resolve(root, 'config/site-config.json');
check(existsSync(configPath), 'Missing config/site-config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const supportConfigPath = resolve(root, 'config/support-config.json');
check(existsSync(supportConfigPath), 'Missing config/support-config.json');
const supportConfig = JSON.parse(readFileSync(supportConfigPath, 'utf8'));

for (const field of ['version', 'releaseDate', 'androidDownloadUrl', 'apkSize', 'apkSha256', 'iosStatus', 'iosDownloadUrl', 'publicApiBaseUrl', 'publicWebsiteAnnouncementsPath']) {
  check(Object.hasOwn(config, field), `Config field missing: ${field}`);
}

check(config.version === '1.0.0', 'Configured version must remain 1.0.0');
check(config.androidDownloadUrl === '/downloads/我的长理-V1.0.0.apk', 'Android download URL must match the V1.0.0 production APK');
check(config.releaseDate === '2026-08-24', 'V1.0.0 release date is incorrect');
check(config.apkSize === '5.76 MiB', 'V1.0.0 APK size is incorrect');
check(config.apkSha256 === '66764E96822D302885340EF2222A660988B0A44921462698A4DA4590FF7DF96C', 'V1.0.0 APK SHA-256 is incorrect');
check(config.iosDownloadUrl === '', 'iOS URL must stay empty until a real release URL is supplied');
check(config.filing.icpNumber === '湘ICP备2026035265号-1', 'ICP number does not match the provided filing record');
check(config.filing.publicSecurityNumber === '', 'Public security number must stay empty until issued');
check(config.releases.map((item) => item.version).join(',') === 'V1.0.0,V2.0.0,V3.0.0', 'Release order must stay newest first');
check(config.releases[0].summary === '正式发布首个版本。', 'V1.0.0 release summary is incorrect');
check(config.releases[0].items.join(',') === '校园学习服务,教务查询,校园生活查询,上课提醒,桌面小组件', 'V1.0.0 release items are incorrect');
check(config.releases.slice(1).every((item) => item.status === '规划中' && item.summary === '' && item.items.length === 0), 'Planned releases must only show status and must not promise features');

const getSupportUrlError = (supportUrl) => {
  if (typeof supportUrl !== 'string') return 'support URL must be a string';
  if (supportUrl !== supportUrl.trim()) return 'support URL must not contain surrounding whitespace';
  if (!supportUrl) return '';
  try {
    const parsedUrl = new URL(supportUrl);
    return parsedUrl.protocol === 'https:' && Boolean(parsedUrl.hostname)
      ? ''
      : 'support URL must be an absolute HTTPS URL';
  } catch {
    return 'support URL is invalid';
  }
};

const supportUrlValidationCases = [
  ['', true],
  ['https://example.com/support', true],
  [' http://example.com/support', false],
  ['http://example.com/support', false],
  ['/relative-support', false],
  ['https://', false],
];
for (const [value, expectedValid] of supportUrlValidationCases) {
  check((getSupportUrlError(value) === '') === expectedValid, `Support URL validator self-test failed: ${JSON.stringify(value)}`);
}

for (const field of ['alipaySupportUrl', 'wechatSupportUrl']) {
  const validationError = getSupportUrlError(supportConfig[field]);
  check(!validationError, `${field}: ${validationError}`);
}
for (const field of ['alipayQrImage', 'wechatQrImage']) {
  const imagePath = supportConfig[field];
  check(typeof imagePath === 'string', `Support config field must be a string: ${field}`);
  if (typeof imagePath !== 'string') continue;
  check(imagePath === imagePath.trim(), `${field}: support image path must not contain surrounding whitespace`);
  if (!imagePath) continue;
  check(/^\/assets\/images\/support\/[a-z0-9][a-z0-9._-]*$/i.test(imagePath), `${field}: support image must use a local /assets/images/support/ path`);
  check(existsSync(resolve(root, imagePath.slice(1))), `${field}: configured support image is missing`);
}

const forbiddenVisibleTerms = [
  '官方APP',
  '官方 APP',
  '学校合作',
  '校方认证',
  '官方授权',
  '充值',
  '退款',
  '地图导航',
  '体育预约',
  '后台管理',
  '测试功能',
];

const localLinkPattern = /(?:href|src)="([^"]+)"/g;
for (const file of htmlFiles) {
  const path = resolve(root, file);
  check(existsSync(path), `Missing page: ${file}`);
  if (!existsSync(path)) continue;
  const html = readFileSync(path, 'utf8');

  check(html.includes('<html lang="zh-CN">'), `${file}: missing zh-CN language`);
  check(html.includes('name="viewport"'), `${file}: missing viewport metadata`);
  check(html.includes('data-menu-button'), `${file}: missing accessible mobile menu`);
  check(html.includes('data-nav-page="thanks"'), `${file}: missing thanks navigation entry`);
  check(html.includes('data-filing'), `${file}: filing block is missing`);
  check(html.includes('湘ICP备2026035265号-1'), `${file}: provided ICP number is missing from the static footer`);
  check(html.includes('href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer"'), `${file}: ICP link attributes are incomplete`);
  check(!/<form\b/i.test(html), `${file}: online forms are not allowed`);
  check(!/(analytics|gtag|google-tag|matomo|baidu|umami)/i.test(html), `${file}: tracking code is not allowed`);
  check(!/src="https?:\/\//i.test(html), `${file}: runtime third-party resources are not allowed`);
  check(!/<link[^>]+href="https?:\/\//i.test(html), `${file}: external runtime stylesheets are not allowed`);
  for (const term of forbiddenVisibleTerms) {
    check(!html.includes(term), `${file}: prohibited visible term found: ${term}`);
  }

  for (const match of html.matchAll(localLinkPattern)) {
    const reference = match[1];
    if (reference.startsWith('#') || reference.startsWith('mailto:') || reference.startsWith('http')) continue;
    const cleanReference = reference.split('#')[0].split('?')[0];
    if (!cleanReference) continue;
    const localPath = cleanReference.startsWith('/')
      ? resolve(root, cleanReference.slice(1))
      : resolve(root, cleanReference);
    check(existsSync(localPath), `${file}: broken local reference ${reference}`);
  }
}

const requiredFeatures = ['课程表', '成绩查询', '考试安排', '空闲教室', '作业查询', '资料库', '校历', '电费查询', '失物招领', '四六级', '普通话', '上课提醒', '桌面小组件'];
const featureHtml = readFileSync(resolve(root, 'features.html'), 'utf8');
for (const feature of requiredFeatures) {
  check(featureHtml.includes(feature), `features.html: required feature missing: ${feature}`);
}

const siteCss = readFileSync(resolve(root, 'assets/styles/site.css'), 'utf8');
const siteScript = readFileSync(resolve(root, 'assets/scripts/site.js'), 'utf8');
check(/\.menu-button\s*\{[^}]*min-inline-size:\s*48px;[^}]*min-block-size:\s*48px;/s.test(siteCss), 'site.css: mobile menu button touch target must be at least 48px');
check(/\.site-nav\[data-open="true"\]\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/s.test(siteCss), 'site.css: expanded mobile navigation must use a vertical flex layout');
check(/\.site-nav a\s*\{[^}]*min-height:\s*48px;/s.test(siteCss), 'site.css: mobile navigation rows must retain a 48px touch target');
check(siteCss.includes('-webkit-overflow-scrolling: touch'), 'site.css: mobile navigation must support smooth WebView scrolling');
check(siteCss.includes('.site-nav a:active'), 'site.css: mobile navigation rows must provide touch feedback');
check(/\.announcement-dialog\s*\{[^}]*width:\s*calc\(100vw - 32px\);[^}]*max-height:\s*80vh;/s.test(siteCss), 'site.css: announcement dialog must retain plain viewport fallbacks');
check(/\.announcement-dialog-shell\s*\{[^}]*width:\s*100%;[^}]*max-height:\s*80vh;/s.test(siteCss), 'site.css: announcement shell must retain a plain viewport fallback');
check(/@supports\s*\(width:\s*min\(1px,\s*2px\)\)\s*\{[^}]*\.announcement-dialog\s*\{[^}]*width:\s*min\(640px,/s.test(siteCss), 'site.css: modern announcement sizing must be isolated behind @supports');
check(/\.support-choice\s*\{[^}]*min-height:\s*108px;/s.test(siteCss), 'site.css: support buttons must retain a clear touch target');
check(siteCss.includes('.support-choice { min-height: 82px; }'), 'site.css: mobile support buttons must retain an 82px touch target');
check(siteScript.includes("return typeof value === 'string' ? value.trim() : '';"), 'site.js: support configuration values must be normalized');
check(siteScript.includes("return url.protocol === 'https:' && url.hostname ? url.href : '';"), 'site.js: support navigation must enforce absolute HTTPS URLs at runtime');
check(siteScript.includes('window.location.assign(supportUrl);'), 'site.js: configured support URL must navigate directly');
check(siteScript.indexOf('window.location.assign(supportUrl);') < siteScript.lastIndexOf('renderPanel(kind);'), 'site.js: support URL must take priority over QR fallback');
check(siteScript.includes("fetch(publicWebsiteAnnouncementsUrl(config), {"), 'site.js: website announcement endpoint is not configured');
check(siteScript.includes('/public/website-announcements'), 'site.js: website announcement path is missing');
check(siteScript.includes('data.websiteAnnouncements'), 'site.js: website announcement payload field is missing');
check(siteScript.includes("cache: 'no-cache'"), 'site.js: announcement requests must bypass stale browser cache');
check(siteScript.includes('new AbortController()'), 'site.js: announcement requests must have a timeout controller');
check(siteScript.includes('dialog.showModal()'), 'site.js: announcement dialog must use native modal semantics');
check(siteScript.includes('window.localStorage.getItem(announcementReadKey(announcement))'), 'site.js: announcement read state must use localStorage');
check(siteScript.includes('window.localStorage.setItem(announcementReadKey(announcement), \'1\')'), 'site.js: confirm-read must persist announcement state');
check(siteScript.includes('dialogContent.textContent = announcement.content'), 'site.js: announcement body must render as text');
check(!siteScript.includes('dialogContent.innerHTML = announcement.content'), 'site.js: announcement body must not render raw HTML');

for (const anchor of ['study', 'life', 'assist']) {
  check(featureHtml.includes(`id="${anchor}"`), `features.html: missing centered anchor ${anchor}`);
}

const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
check(indexHtml.includes('data-announcement-region'), 'index.html: announcement region is missing');
check(indexHtml.includes('data-announcement-trigger'), 'index.html: announcement trigger is missing');
check(indexHtml.includes('data-announcement-dialog'), 'index.html: announcement dialog is missing');
check(indexHtml.includes('aria-labelledby="announcement-dialog-title"'), 'index.html: announcement dialog label is missing');
check(indexHtml.includes('aria-describedby="announcement-dialog-content"'), 'index.html: announcement dialog description is missing');
check(indexHtml.includes('这是什么：'), 'index.html: product-definition prompt is missing');
check(indexHtml.includes('我的长理是一款面向校园学习与生活场景的应用'), 'index.html: product definition is missing');
check(!/<div class="hero-copy">\s*<p class="eyebrow">/s.test(indexHtml), 'index.html: duplicate hero eyebrow remains');
check(indexHtml.includes('安全 · 稳定 · 可靠'), 'index.html: hero trust labels are incorrect');
check(indexHtml.includes('href="features.html#study"'), 'index.html: study anchor link is missing');
check(indexHtml.includes('href="features.html#life"'), 'index.html: life anchor link is missing');
check(indexHtml.includes('未来展望'), 'index.html: future outlook section is missing');
check(indexHtml.includes('让校园生活服务更加简单、便捷。'), 'index.html: future outlook copy is incorrect');
check(!indexHtml.includes('个人开发者项目发布页面'), 'index.html: informal footer/hero wording remains');

const thanksHtml = readFileSync(resolve(root, 'thanks.html'), 'utf8');
check(thanksHtml.includes('https://github.com/CreaMakers/changli-planet-app'), 'thanks.html: missing upstream project link');
check(thanksHtml.includes('MIT License'), 'thanks.html: missing MIT attribution');

const supportHtml = readFileSync(resolve(root, 'support.html'), 'utf8');
check(supportHtml.includes('data-support-button="alipay"'), 'support.html: missing Alipay button');
check(supportHtml.includes('data-support-button="wechat"'), 'support.html: missing WeChat button');
check(supportHtml.includes('<span>支持支付宝</span>'), 'support.html: Alipay button copy is incorrect');
check(supportHtml.includes('<span>支持微信</span>'), 'support.html: WeChat button copy is incorrect');
check(!supportHtml.includes('付款') && !supportHtml.includes('购买'), 'support.html: support flow must not use purchase/payment wording');
check(!/data-support-image="(?:alipay|wechat)"[^>]+src=/i.test(supportHtml), 'support.html: QR images must not be hardcoded');

const updatesHtml = readFileSync(resolve(root, 'updates.html'), 'utf8');
check(!updatesHtml.includes('未来规划只记录状态，不提前承诺具体功能'), 'updates.html: old release wording remains');

const imageLimits = [
  ['assets/images/app-icon.png', 50 * 1024],
  ['assets/images/app-home.jpg', 320 * 1024],
];
for (const [file, maxBytes] of imageLimits) {
  const path = resolve(root, file);
  check(existsSync(path), `Missing image: ${file}`);
  if (existsSync(path)) check(statSync(path).size <= maxBytes, `${file}: exceeds size budget`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(`PASS: ${htmlFiles.length} pages, ${requiredFeatures.length} functions, configuration and content boundaries validated.`);
