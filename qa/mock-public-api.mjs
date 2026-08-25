import http from 'node:http';

const port = Number(process.env.MYCHANG_LI_MOCK_PORT || 8788);
const defaultScenario = process.env.MYCHANG_LI_MOCK_SCENARIO || 'announcement';
const now = Date.now();

const announcement = {
  id: 'local-announcement-1',
  title: '本地公告：V1.0 发布说明与使用提醒',
  content: '这是只供本地验收使用的公告正文。\n\n请通过正式渠道核对重要信息。',
  publishedAt: now,
  updatedAt: now,
};

const longAnnouncement = {
  ...announcement,
  id: 'local-announcement-long',
  title: '这是一个用于验证移动端省略与弹窗滚动的较长公告标题——不会写入任何生产数据',
  content: Array.from({ length: 28 }, (_, index) => `第 ${index + 1} 段：这是本地 mock 公告正文，用于验证纯文本换行、弹窗高度限制和内部滚动。`).join('\n\n'),
  updatedAt: now + 1,
};

const sendJson = (response, status, payload) => {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:5173',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
  if (url.pathname !== '/api/v1/public/website-announcements') {
    sendJson(response, 404, { ok: false, error: { code: 'NOT_FOUND' } });
    return;
  }

  const scenario = url.searchParams.get('scenario') || defaultScenario;
  if (scenario === '500') {
    sendJson(response, 500, { ok: false, error: { code: 'MOCK_500' } });
    return;
  }
  if (scenario === 'malformed') {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end('{"ok":true,"data":');
    return;
  }
  if (scenario === 'timeout') {
    setTimeout(() => sendJson(response, 200, { ok: true, data: { websiteAnnouncements: [announcement] } }), 10000);
    return;
  }

  const announcements = scenario === 'empty'
    ? []
    : [scenario === 'long' ? longAnnouncement : announcement];
  sendJson(response, 200, { ok: true, data: { websiteAnnouncements: announcements } });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Mock public API listening on http://127.0.0.1:${port}/api/v1/public/website-announcements`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
