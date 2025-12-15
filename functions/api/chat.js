/**
 * 报告小助手 - AI 代理 API
 *
 * 部署后访问地址：https://my-tools-site.leo-maomao.workers.dev/api/chat
 *
 * 环境变量配置：
 * 1. Cloudflare Dashboard -> Workers & Pages -> my-tools-site
 * 2. Settings -> Environment variables
 * 3. 添加：DASHSCOPE_API_KEY = 你的百炼Key
 */

// 允许的域名（防止被其他网站滥用）
const ALLOWED_ORIGINS = [
  'https://my-tools-site.leo-maomao.workers.dev',
  'https://tools.leo-maomao.workers.dev',
  'http://localhost',
  'http://127.0.0.1',
  'file://'  // 本地文件访问
];

export async function onRequestPost(context) {
  const { request, env } = context;

  // 来源校验
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';

  const isAllowed = ALLOWED_ORIGINS.some(allowed =>
    origin.startsWith(allowed) || referer.startsWith(allowed) || !origin
  );

  // 本地开发或直接访问时放行
  if (!isAllowed && origin) {
    return new Response(JSON.stringify({ error: '来源不被允许' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();

    // 检查 API Key 是否配置
    if (!env.DASHSCOPE_API_KEY) {
      return new Response(JSON.stringify({ error: '服务端未配置 API Key' }), {
        status: 500,
        headers: corsHeaders(origin)
      });
    }

    // 转发到百炼 API
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: corsHeaders(origin)
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders(origin)
    });
  }
}

// CORS 预检
export async function onRequestOptions(context) {
  const origin = context.request.headers.get('Origin') || '*';
  return new Response(null, {
    headers: corsHeaders(origin)
  });
}

function corsHeaders(origin) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
