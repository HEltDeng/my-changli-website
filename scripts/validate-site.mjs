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

for (const field of ['version', 'releaseDate', 'androidDownloadUrl', 'apkSize', 'apkSha256', 'iosStatus', 'iosDownloadUrl']) {
  check(Object.hasOwn(config, field), `Config field missing: ${field}`);
}

check(config.version === '1.0.0', 'Configured version must remain 1.0.0');
check(config.androidDownloadUrl === '', 'Android URL must stay empty until a real APK URL is supplied');
check(config.iosDownloadUrl === '', 'iOS URL must stay empty until a real release URL is supplied');
check(config.filing.icpNumber === '', 'ICP number must stay empty until issued');
check(config.filing.publicSecurityNumber === '', 'Public security number must stay empty until issued');
check(config.releases.map((item) => item.version).join(',') === 'V1.0.0,V2.0.0,V3.0.0', 'Release order must stay newest first');
check(config.releases[0].summary === '正式发布首个版本。', 'V1.0.0 release summary is incorrect');
check(config.releases[1].items.length === 0 && config.releases[2].items.length === 0, 'Planned releases must not promise features');
for (const field of ['alipayQrImage', 'wechatQrImage']) {
  const imagePath = supportConfig[field];
  check(typeof imagePath === 'string', `Support config field must be a string: ${field}`);
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
  check(html.includes('data-filing hidden'), `${file}: filing block must be hidden by default`);
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

for (const anchor of ['study', 'life', 'assist']) {
  check(featureHtml.includes(`id="${anchor}"`), `features.html: missing centered anchor ${anchor}`);
}

const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf8');
check(indexHtml.includes('这是什么：'), 'index.html: product-definition prompt is missing');
check(indexHtml.includes('我的长理是一款面向校园学习与生活场景的 Android 应用'), 'index.html: product definition is missing');
check(indexHtml.includes('href="features.html#study"'), 'index.html: study anchor link is missing');
check(indexHtml.includes('href="features.html#life"'), 'index.html: life anchor link is missing');
check(indexHtml.includes('未来展望'), 'index.html: future outlook section is missing');
check(!indexHtml.includes('个人开发者项目发布页面'), 'index.html: informal footer/hero wording remains');

const thanksHtml = readFileSync(resolve(root, 'thanks.html'), 'utf8');
check(thanksHtml.includes('https://github.com/CreaMakers/changli-planet-app'), 'thanks.html: missing upstream project link');
check(thanksHtml.includes('MIT License'), 'thanks.html: missing MIT attribution');

const supportHtml = readFileSync(resolve(root, 'support.html'), 'utf8');
check(supportHtml.includes('data-support-button="alipay"'), 'support.html: missing Alipay button');
check(supportHtml.includes('data-support-button="wechat"'), 'support.html: missing WeChat button');
check(!/data-support-image="(?:alipay|wechat)"[^>]+src=/i.test(supportHtml), 'support.html: QR images must not be hardcoded');

const updatesHtml = readFileSync(resolve(root, 'updates.html'), 'utf8');
check(!updatesHtml.includes('未来规划只记录状态，不提前承诺具体功能'), 'updates.html: old release wording remains');

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
