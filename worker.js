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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

    return env.ASSETS.fetch(request);
  },

  // 定时触发器 - 每天自动执行健康检查
  async scheduled(event, env, ctx) {
    ctx.waitUntil(healthCheck());
  }
};
