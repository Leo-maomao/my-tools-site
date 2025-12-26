// Cloudflare Worker - 数据库健康检查
// ToolSite数据库（Tools专用）
const TOOLSITE_URL = "https://aexcnubowsarpxkohqvv.supabase.co";
const TOOLSITE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms";

// 健康检查函数
async function healthCheck() {
  try {
    const response = await fetch(`${TOOLSITE_URL}/rest/v1/rpc/health_check`, {
      method: 'POST',
      headers: {
        'apikey': TOOLSITE_KEY,
        'Authorization': `Bearer ${TOOLSITE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 如果health_check函数不存在，尝试简单查询
    if (response.status === 404) {
      const fallbackResponse = await fetch(`${TOOLSITE_URL}/rest/v1/?select=*&limit=1`, {
        headers: {
          'apikey': TOOLSITE_KEY,
          'Authorization': `Bearer ${TOOLSITE_KEY}`
        }
      });
      return {
        success: fallbackResponse.ok,
        status: fallbackResponse.status,
        method: 'fallback',
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: response.ok,
      status: response.status,
      method: 'rpc',
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      timestamp: new Date().toISOString()
    };
  }
}

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-DashScope-Async',
};

// 处理预检请求
function handleOptions() {
  return new Response(null, { headers: corsHeaders });
}

// API 代理 - 转发请求到目标 API
async function proxyRequest(request, targetUrl) {
  const headers = new Headers(request.headers);
  // 移除可能导致问题的头
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.method !== 'GET' ? await request.text() : undefined,
  });

  const response = await fetch(proxyRequest);
  
  // 添加 CORS 头到响应
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // API 代理 - 阿里云 DashScope (原生接口)
    if (url.pathname.startsWith('/api/dashscope/')) {
      const targetPath = url.pathname.replace('/api/dashscope/', '');
      const targetUrl = `https://dashscope.aliyuncs.com/api/v1/${targetPath}${url.search}`;
      return proxyRequest(request, targetUrl);
    }

    // API 代理 - 阿里云百炼 OpenAI 兼容模式
    if (url.pathname.startsWith('/api/bailian/')) {
      const targetPath = url.pathname.replace('/api/bailian/', '');
      const targetUrl = `https://dashscope.aliyuncs.com/compatible-mode/v1/${targetPath}${url.search}`;
      return proxyRequest(request, targetUrl);
    }

    // API 代理 - OpenAI
    if (url.pathname.startsWith('/api/openai/')) {
      const targetPath = url.pathname.replace('/api/openai/', '');
      const targetUrl = `https://api.openai.com/v1/${targetPath}${url.search}`;
      return proxyRequest(request, targetUrl);
    }

    // API 代理 - 智谱 AI
    if (url.pathname.startsWith('/api/zhipu/')) {
      const targetPath = url.pathname.replace('/api/zhipu/', '');
      const targetUrl = `https://open.bigmodel.cn/api/paas/v4/${targetPath}${url.search}`;
      return proxyRequest(request, targetUrl);
    }

    // 通用 API 代理 - 自定义端点
    if (url.pathname.startsWith('/api/proxy/')) {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return new Response(JSON.stringify({ error: '缺少 url 参数' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      return proxyRequest(request, targetUrl);
    }

    // 手动健康检查接口
    if (url.pathname === '/api/health-check') {
      const result = await healthCheck();
      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 静态资源处理
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    
    // 本地开发时 env.ASSETS 可能不存在，返回 404
    return new Response('Not Found', { status: 404 });
  },

  // 定时触发器 - 每天自动执行健康检查
  async scheduled(event, env, ctx) {
    ctx.waitUntil(healthCheck());
  }
};
