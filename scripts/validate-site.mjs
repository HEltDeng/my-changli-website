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

for (const field of ['version', 'releaseDate', 'androidDownloadUrl', 'apkSize', 'apkSha256', 'iosStatus', 'iosDownloadUrl']) {
  check(Object.hasOwn(config, field), `Config field missing: ${field}`);
}

check(config.version === '1.0.0', 'Configured version must remain 1.0.0');
check(config.androidDownloadUrl === '', 'Android URL must stay empty until a real APK URL is supplied');
check(config.iosDownloadUrl === '', 'iOS URL must stay empty until a real release URL is supplied');
check(config.filing.icpNumber === '', 'ICP number must stay empty until issued');
check(config.filing.publicSecurityNumber === '', 'Public security number must stay empty until issued');
check(config.releases.map((item) => item.version).join(',') === 'V1.0.0,V2.0.0,V3.0.0', 'Release order must stay newest first');

const forbiddenVisibleTerms = [
  '官方APP',
  '官方 APP',
  '学校合作',
  '校方认证',
  '官方授权',
  '支付',
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
  check(html.includes('data-filing hidden'), `${file}: filing block must be hidden by default`);
  check(!/<form\b/i.test(html), `${file}: online forms are not allowed`);
  check(!/(analytics|gtag|google-tag|matomo|baidu|umami)/i.test(html), `${file}: tracking code is not allowed`);
  check(!/(?:href|src)="https?:\/\//i.test(html), `${file}: runtime third-party resources are not allowed`);
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

const imageLimits = [
  ['assets/images/app-icon.png', 50 * 1024],
  ['assets/images/app-home.png', 250 * 1024],
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
