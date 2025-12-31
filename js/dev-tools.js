/**
 * 研发工具箱
 */
(function() {
  'use strict';

  // 工具配置
  const toolsConfig = {
    // 数据格式处理
    json: { title: 'JSON 工具', desc: 'JSON 格式化、压缩、校验、转换' },
    xml: { title: 'XML 工具', desc: 'XML 格式化、压缩、转 JSON' },
    yaml: { title: 'YAML 工具', desc: 'YAML 格式化、校验、转 JSON' },
    sql: { title: 'SQL 格式化', desc: 'SQL 语句格式化、压缩、高亮' },
    csv: { title: 'CSV 工具', desc: 'CSV 格式化、转 JSON、列提取' },
    
    // 编码解码
    base64: { title: 'Base64', desc: 'Base64 编码解码，支持文本和文件' },
    url: { title: 'URL 编解码', desc: 'URL 编码解码、参数解析' },
    unicode: { title: 'Unicode', desc: 'Unicode/ASCII/Hex 编码转换' },
    hash: { title: '哈希计算', desc: 'MD5/SHA1/SHA256/SHA512 计算' },
    aes: { title: 'AES 加解密', desc: 'AES 对称加密解密' },
    jwt: { title: 'JWT 解析', desc: 'JWT Token 解析、验证' },
    
    // 前端辅助
    color: { title: '颜色转换', desc: 'RGB/HEX/HSL 颜色互转' },
    regex: { title: '正则测试', desc: '正则表达式在线测试' },
    timestamp: { title: '时间戳转换', desc: '时间戳与日期时间互转' },
    html: { title: 'HTML 工具', desc: 'HTML 格式化、压缩、转义' },
    css: { title: 'CSS 工具', desc: 'CSS 格式化、压缩' },
    gradient: { title: '渐变生成器', desc: 'CSS 渐变代码生成' },
    
    // 后端辅助
    uuid: { title: 'UUID 生成', desc: '批量生成 UUID v4' },
    cron: { title: 'Cron 表达式', desc: 'Cron 表达式生成与解析' },
    radix: { title: '进制转换', desc: '二/八/十/十六进制互转' },
    ip: { title: 'IP 工具', desc: 'IP 地址查询、子网计算' },
    port: { title: '端口速查', desc: '常见服务端口速查表' },
    
    // 效率工具
    diff: { title: '文本对比', desc: '文本差异对比' },
    text: { title: '文本处理', desc: '去重、排序、统计' },
    qrcode: { title: '二维码', desc: '二维码生成与解析' },
    markdown: { title: 'Markdown', desc: 'Markdown 编辑预览' },
    random: { title: '随机生成', desc: '随机字符串、数字生成' },
    placeholder: { title: '占位图', desc: '生成指定尺寸占位图' },
    
    // 生成器
    gitignore: { title: '.gitignore', desc: '按语言生成 gitignore' },
    nginx: { title: 'Nginx 配置', desc: 'Nginx 配置生成器' },
    curl: { title: 'Curl 命令', desc: 'Curl 命令生成与解析' },
    http: { title: 'HTTP 状态码', desc: 'HTTP 状态码速查表' }
  };

  let currentTool = 'json';
  let els = {};

  // 从 URL hash 获取工具名
  function getToolFromHash() {
    const hash = window.location.hash.slice(1); // 移除 # 号
    // 支持格式: #dev-tools/json 或 #dev-tools（默认 json）
    if (hash.startsWith('dev-tools/')) {
      const tool = hash.replace('dev-tools/', '');
      return toolsConfig[tool] ? tool : 'json';
    }
    return 'json';
  }

  // 初始化
  function init() {
    cacheElements();
    if (!els.nav || !els.body) {
      return;
    }
    bindEvents();
    
    // 从 URL hash 恢复工具状态
    const tool = getToolFromHash();
    switchTool(tool);
    
    // 监听浏览器前进后退
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('dev-tools/') || hash === 'dev-tools') {
        const hashTool = getToolFromHash();
        if (hashTool !== currentTool) {
          switchTool(hashTool);
        }
      }
    });
    
    // 监听来自主路由的子路由变化事件
    window.addEventListener('devToolsHashChange', (e) => {
      const hashTool = getToolFromHash();
      if (hashTool !== currentTool) {
        switchTool(hashTool);
      }
    });
  }

  // 缓存 DOM 元素
  function cacheElements() {
    els = {
      nav: document.getElementById('devToolsNav'),
      search: document.getElementById('devToolsSearch'),
      title: document.getElementById('toolTitle'),
      desc: document.getElementById('toolDesc'),
      body: document.getElementById('toolBody')
    };
  }

  // 绑定事件
  function bindEvents() {
    // 工具项点击
    els.nav.addEventListener('click', function(e) {
      const item = e.target.closest('.tool-item');
      if (item) {
        e.preventDefault();
        e.stopPropagation();
        const tool = item.dataset.tool;
        if (tool) {
          switchTool(tool);
          // 确保焦点不会跳到搜索框
          if (document.activeElement === els.search) {
            els.search.blur();
          }
        }
        return;
      }

      // 分类折叠
      const header = e.target.closest('.category-header');
      if (header) {
        e.preventDefault();
        const category = header.closest('.dev-tools-category');
        category.classList.toggle('is-collapsed');
      }
    });

    // 搜索
    els.search.addEventListener('input', function(e) {
      filterTools(e.target.value.trim().toLowerCase());
    });
  }

  // 切换工具
  function switchTool(tool) {
    if (!toolsConfig[tool]) return;
    
    currentTool = tool;
    
    // 埋点：记录工具使用
    if (typeof trackEvent === 'function') {
      trackEvent('dev_tool_use', {
        tool_name: tool,
        tool_title: toolsConfig[tool].title
      });
    }
    
    // 更新 URL hash（使用 dev-tools/tool 格式）
    const expectedHash = 'dev-tools/' + tool;
    if (window.location.hash.slice(1) !== expectedHash) {
      history.replaceState(null, '', '#' + expectedHash);
    }
    
    // 更新导航激活状态
    document.querySelectorAll('.tool-item').forEach(item => {
      item.classList.toggle('is-active', item.dataset.tool === tool);
    });
    
    // 更新标题
    els.title.textContent = toolsConfig[tool].title;
    els.desc.textContent = toolsConfig[tool].desc;
    
    // 加载工具
    loadTool(tool);
  }

  // 筛选工具
  function filterTools(keyword) {
    document.querySelectorAll('.dev-tools-category').forEach(category => {
      let hasVisible = false;
      
      category.querySelectorAll('.tool-item').forEach(item => {
        const tool = item.dataset.tool;
        const config = toolsConfig[tool];
        const text = (config.title + config.desc).toLowerCase();
        const match = !keyword || text.includes(keyword);
        
        item.classList.toggle('is-hidden', !match);
        if (match) hasVisible = true;
      });
      
      category.classList.toggle('is-hidden', !hasVisible);
    });
  }

  // 加载工具
  function loadTool(tool) {
    const renderer = toolRenderers[tool];
    if (renderer) {
      els.body.innerHTML = renderer();
      initToolEvents(tool);
    } else {
      els.body.innerHTML = `
        <div class="tool-info">
          <i class="ri-tools-line"></i>
          <div class="tool-info-content">
            <div class="tool-info-title">功能开发中</div>
            <div class="tool-info-text">该工具正在开发中，敬请期待...</div>
          </div>
        </div>
      `;
    }
    
    // 禁用所有输入框的自动填充（使用更强的禁用方式）
    els.body.querySelectorAll('input, textarea').forEach(el => {
      el.setAttribute('autocomplete', 'new-password');
      el.setAttribute('autocorrect', 'off');
      el.setAttribute('autocapitalize', 'off');
      el.setAttribute('spellcheck', 'false');
      el.setAttribute('data-form-type', 'other');
      el.setAttribute('data-lpignore', 'true'); // LastPass
      el.setAttribute('data-1p-ignore', 'true'); // 1Password
    });
    
    // 初始化全局下拉组件（在 DOM 更新后执行）
    requestAnimationFrame(() => {
      if (window.UI && window.UI.Select) {
        window.UI.Select.init(els.body);
      }
    });
  }

  // 埋点：记录工具实际使用
  function trackToolAction(tool, action) {
    if (typeof trackEvent === 'function') {
      trackEvent('dev_tool_action', {
        tool: tool,
        action: action
      });
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制到剪贴板');
    }).catch(() => {
      showToast('复制失败', 'error');
    });
  }

  // 显示提示
  function showToast(message) {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 2000);
  }

  // ========== 工具渲染器 ==========
  const toolRenderers = {
    // JSON 工具
    json: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>输入 JSON</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="jsonClearBtn"><i class="ri-delete-bin-line"></i>清空</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="jsonInput" placeholder='输入或粘贴 JSON 内容，例如：
{
  "name": "test",
  "value": 123,
  "items": ["a", "b", "c"]
}'></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="jsonCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="jsonOutput" readonly placeholder="处理结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div style="display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; padding: 12px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tool-label-inline">缩进格式</span>
                <select id="jsonIndent" class="tool-select" style="width: 100px;">
                  <option value="2">2 空格</option>
                  <option value="4">4 空格</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
              <div class="tool-btn-group">
                <button class="tool-btn tool-btn-primary" id="jsonFormatBtn"><i class="ri-code-line"></i>格式化</button>
                <button class="tool-btn tool-btn-secondary" id="jsonCompressBtn"><i class="ri-compress-line"></i>压缩</button>
                <button class="tool-btn tool-btn-secondary" id="jsonValidateBtn"><i class="ri-checkbox-circle-line"></i>校验</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // Base64 编解码
    base64: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>原始文本</div>
                </div>
                <textarea class="tool-textarea" id="base64Input" placeholder="输入要编码或解码的文本"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>处理结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="base64CopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="base64Output" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding: 12px 0;">
              <button class="tool-btn tool-btn-primary" id="base64EncodeBtn"><i class="ri-arrow-right-line"></i>编码 (Encode)</button>
              <button class="tool-btn tool-btn-primary" id="base64DecodeBtn"><i class="ri-arrow-left-line"></i>解码 (Decode)</button>
            </div>
          </div>
        </div>
      `;
    },

    // URL 编解码
    url: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>输入内容</div>
                </div>
                <textarea class="tool-textarea" id="urlInput" placeholder="输入 URL 或需要编码/解码的文本"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>处理结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="urlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="urlOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding: 12px 0;">
              <button class="tool-btn tool-btn-primary" id="urlEncodeBtn"><i class="ri-arrow-right-line"></i>URL 编码</button>
              <button class="tool-btn tool-btn-primary" id="urlDecodeBtn"><i class="ri-arrow-left-line"></i>URL 解码</button>
              <button class="tool-btn tool-btn-secondary" id="urlParseBtn"><i class="ri-links-line"></i>解析 URL</button>
            </div>
          </div>
        </div>
      `;
    },

    // 时间戳转换
    timestamp: function() {
      const now = Date.now();
      const nowSec = Math.floor(now / 1000);
      return `
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- 当前时间戳 -->
          <div class="tool-card">
            <div style="padding:20px;display:flex;align-items:center;gap:32px">
              <div style="flex:1;text-align:center">
                <div style="font-size:13px;color:rgba(0,0,0,0.45);margin-bottom:6px">秒级 (Unix)</div>
                <div style="font-size:28px;font-weight:600;font-family:monospace;color:#1677ff" id="currentTs">${nowSec}</div>
              </div>
              <div style="width:1px;height:50px;background:#f0f0f0"></div>
              <div style="flex:1;text-align:center">
                <div style="font-size:13px;color:rgba(0,0,0,0.45);margin-bottom:6px">毫秒级 (JavaScript)</div>
                <div style="font-size:28px;font-weight:600;font-family:monospace;color:#52c41a" id="currentTsMs">${now}</div>
              </div>
              <button class="tool-btn tool-btn-default" id="refreshTsBtn"><i class="ri-refresh-line"></i>刷新</button>
            </div>
          </div>
          
          <div style="display:flex;gap:16px">
            <!-- 时间戳转时间 -->
            <div class="tool-card" style="flex:1">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-arrow-right-line"></i>时间戳 → 时间</div>
              </div>
              <div style="padding:20px">
                <div style="display:flex;gap:12px;margin-bottom:16px">
                  <input type="text" class="tool-input" id="tsInput" placeholder="输入时间戳（秒或毫秒）" style="flex:1;font-family:monospace">
                  <button class="tool-btn tool-btn-primary" id="ts2dateBtn">转换</button>
                </div>
                <div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;padding:16px;height:100px;overflow:auto" id="ts2dateResult">
                  <span style="color:rgba(0,0,0,0.45)">输入时间戳后点击转换</span>
                </div>
              </div>
            </div>
            
            <!-- 时间转时间戳 -->
            <div class="tool-card" style="flex:1">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-arrow-left-line"></i>时间 → 时间戳</div>
              </div>
              <div style="padding:20px">
                <div style="display:flex;gap:12px;margin-bottom:16px">
                  <input type="datetime-local" class="tool-input" id="dateInput" style="flex:1">
                  <button class="tool-btn tool-btn-primary" id="date2tsBtn">转换</button>
                </div>
                <div style="background:#e6f4ff;border:1px solid #91caff;border-radius:6px;padding:16px;height:100px;overflow:auto" id="date2tsResult">
                  <span style="color:rgba(0,0,0,0.45)">选择时间后点击转换</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 正则测试
    regex: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px">
                <div class="tool-card-header" style="height:48px;border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>测试文本</div>
                  <div class="tool-card-extra">
                    <select class="tool-select" id="regexPreset" style="min-width:80px;height:26px;padding:0 22px 0 8px;font-size:12px">
                      <option value="">预设</option>
                      <option value="^1[3-9]\\d{9}$">手机号</option>
                      <option value="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$">邮箱</option>
                      <option value="^\\d{15}|\\d{18}$">身份证</option>
                      <option value="^https?://[^\\s]+$">URL</option>
                    </select>
                  </div>
                </div>
                <textarea class="tool-textarea" id="regexInput" placeholder="输入要测试的文本" style="border:none;border-radius:0 0 8px 8px"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px">
                <div class="tool-card-header" style="height:48px;border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-checkbox-circle-line"></i>匹配结果</div>
                </div>
                <div style="flex:1;overflow:auto;padding:16px;font-family:monospace;white-space:pre-wrap;background:#fff;border-radius:0 0 8px 8px" id="regexOutput">输入正则和文本后点击测试</div>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:12px 0">
              <div style="display:flex;align-items:center;gap:4px;background:#fafafa;padding:8px 12px;border-radius:6px;border:1px solid #f0f0f0">
                <span style="color:rgba(0,0,0,0.45);font-family:monospace">/</span>
                <input type="text" class="tool-input" id="regexPattern" placeholder="正则表达式" style="width:200px;border:none;background:transparent;box-shadow:none">
                <span style="color:rgba(0,0,0,0.45);font-family:monospace">/</span>
                <input type="text" class="tool-input" id="regexFlags" value="g" style="width:40px;border:none;background:transparent;box-shadow:none;text-align:center">
              </div>
              <div class="tool-btn-group">
                <button class="tool-btn tool-btn-primary" id="regexTestBtn"><i class="ri-search-line"></i>测试</button>
                <button class="tool-btn tool-btn-secondary" id="regexReplaceBtn"><i class="ri-exchange-line"></i>替换</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // UUID 生成
    uuid: function() {
      return `
        <div class="tool-fullheight">
          <div style="display:flex;gap:20px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="color:rgba(0,0,0,0.65);font-size:14px">数量</span>
              <select class="tool-select" id="uuidCount" style="width:100px">
                <option value="1">1 个</option>
                <option value="5">5 个</option>
                <option value="10" selected>10 个</option>
                <option value="20">20 个</option>
                <option value="50">50 个</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
              <span style="color:rgba(0,0,0,0.65);font-size:14px">格式</span>
              <select class="tool-select" id="uuidFormat" style="width:140px">
                <option value="default">小写带横线</option>
                <option value="upper">大写格式</option>
                <option value="nodash">无横线</option>
              </select>
            </div>
            <button class="tool-btn tool-btn-primary" id="uuidGenerateBtn"><i class="ri-refresh-line"></i>生成 UUID</button>
            <button class="tool-btn tool-btn-default" id="uuidCopyBtn"><i class="ri-file-copy-line"></i>复制全部</button>
          </div>
          <div class="tool-card" style="flex:1;display:flex;flex-direction:column;border:1px solid #d9d9d9;border-radius:8px;min-height:0">
            <div style="flex:1;overflow:auto;padding:20px;font-family:monospace;font-size:15px;line-height:2.2;min-height:0" id="uuidOutput">点击"生成 UUID"按钮开始生成</div>
          </div>
        </div>
      `;
    },

    // Cron 表达式
    cron: function() {
      return `
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- 输入区域 -->
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-calendar-schedule-line"></i>Cron 表达式</div>
              <div class="tool-card-extra">
                <select class="tool-select" id="cronPreset" style="width:100px">
                  <option value="">预设</option>
                  <option value="* * * * *">每分钟</option>
                  <option value="0 * * * *">每小时</option>
                  <option value="0 0 * * *">每天</option>
                  <option value="0 9 * * 1-5">工作日</option>
                </select>
                <button class="tool-btn tool-btn-primary" id="cronParseBtn"><i class="ri-search-line"></i>解析</button>
              </div>
            </div>
            <div style="padding:24px">
              <!-- 5个输入框 -->
              <div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px">
                <div style="text-align:center;flex:1;max-width:120px">
                  <input type="text" class="tool-input" id="cronMin" value="0" style="text-align:center;font-family:monospace;font-size:20px;font-weight:600">
                  <div style="font-size:12px;color:rgba(0,0,0,0.45);margin-top:8px">分钟<br>(0-59)</div>
                </div>
                <div style="text-align:center;flex:1;max-width:120px">
                  <input type="text" class="tool-input" id="cronHour" value="0" style="text-align:center;font-family:monospace;font-size:20px;font-weight:600">
                  <div style="font-size:12px;color:rgba(0,0,0,0.45);margin-top:8px">小时<br>(0-23)</div>
                </div>
                <div style="text-align:center;flex:1;max-width:120px">
                  <input type="text" class="tool-input" id="cronDay" value="*" style="text-align:center;font-family:monospace;font-size:20px;font-weight:600">
                  <div style="font-size:12px;color:rgba(0,0,0,0.45);margin-top:8px">日期<br>(1-31)</div>
                </div>
                <div style="text-align:center;flex:1;max-width:120px">
                  <input type="text" class="tool-input" id="cronMonth" value="*" style="text-align:center;font-family:monospace;font-size:20px;font-weight:600">
                  <div style="font-size:12px;color:rgba(0,0,0,0.45);margin-top:8px">月份<br>(1-12)</div>
                </div>
                <div style="text-align:center;flex:1;max-width:120px">
                  <input type="text" class="tool-input" id="cronWeek" value="*" style="text-align:center;font-family:monospace;font-size:20px;font-weight:600">
                  <div style="font-size:12px;color:rgba(0,0,0,0.45);margin-top:8px">星期<br>(0-6)</div>
                </div>
              </div>
              <!-- 完整表达式显示 -->
              <div style="text-align:center;padding:12px;background:#f5f5f5;border-radius:6px">
                <span style="font-size:12px;color:rgba(0,0,0,0.45)">完整表达式：</span>
                <code id="cronInput" style="font-family:monospace;font-size:16px;color:#1677ff;font-weight:500;margin-left:8px">0 0 * * *</code>
              </div>
            </div>
          </div>
          
          <!-- 解析结果 -->
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-information-line"></i>解析结果</div>
            </div>
            <div style="padding:20px;min-height:80px" id="cronOutput">
              <span style="color:rgba(0,0,0,0.45)">点击解析查看结果</span>
            </div>
          </div>
          
          <!-- 语法说明 -->
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-book-line"></i>语法说明</div>
            </div>
            <div style="padding:16px">
              <table style="width:100%;font-size:13px;border-collapse:collapse">
                <tr style="background:#fafafa">
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0">符号</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0">说明</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #f0f0f0">示例</th>
                </tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace;color:#1677ff">*</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">任意值</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:rgba(0,0,0,0.45)">每分钟/每小时/每天</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace;color:#1677ff">,</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">列表</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:rgba(0,0,0,0.45)">1,3,5 表示 1、3、5</td></tr>
                <tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace;color:#1677ff">-</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">范围</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:rgba(0,0,0,0.45)">1-5 表示 1 到 5</td></tr>
                <tr><td style="padding:8px 12px;font-family:monospace;color:#1677ff">/</td><td style="padding:8px 12px">步长</td><td style="padding:8px 12px;color:rgba(0,0,0,0.45)">*/5 表示每 5 个单位</td></tr>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // 哈希计算
    hash: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>输入文本</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-primary tool-btn-sm" id="hashCalcBtn"><i class="ri-hashtag"></i>计算</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="hashInput" placeholder="输入要计算哈希值的文本内容"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-key-2-line"></i>计算结果</div>
                </div>
                <div style="flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:16px;border:1px solid #d9d9d9;border-top:none;border-radius:0 0 8px 8px">
                  <div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:6px;padding:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                      <span style="font-weight:500;color:#52c41a">MD5 (32位)</span>
                      <button class="tool-btn tool-btn-text tool-btn-sm hash-copy-btn" data-target="hashMd5"><i class="ri-file-copy-line"></i></button>
                    </div>
                    <input type="text" class="tool-input" id="hashMd5" readonly style="font-family:monospace;font-size:14px;background:#fff" placeholder="等待计算...">
                  </div>
                  <div style="background:#e6f4ff;border:1px solid #91caff;border-radius:6px;padding:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                      <span style="font-weight:500;color:#1677ff">SHA-1 (40位)</span>
                      <button class="tool-btn tool-btn-text tool-btn-sm hash-copy-btn" data-target="hashSha1"><i class="ri-file-copy-line"></i></button>
                    </div>
                    <input type="text" class="tool-input" id="hashSha1" readonly style="font-family:monospace;font-size:14px;background:#fff" placeholder="等待计算...">
                  </div>
                  <div style="background:#fff7e6;border:1px solid #ffd591;border-radius:6px;padding:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                      <span style="font-weight:500;color:#fa8c16">SHA-256 (64位)</span>
                      <button class="tool-btn tool-btn-text tool-btn-sm hash-copy-btn" data-target="hashSha256"><i class="ri-file-copy-line"></i></button>
                    </div>
                    <input type="text" class="tool-input" id="hashSha256" readonly style="font-family:monospace;font-size:13px;background:#fff" placeholder="等待计算...">
                  </div>
                  <div style="background:#f9f0ff;border:1px solid #d3adf7;border-radius:6px;padding:12px">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                      <span style="font-weight:500;color:#722ed1">SHA-512 (128位)</span>
                      <button class="tool-btn tool-btn-text tool-btn-sm hash-copy-btn" data-target="hashSha512"><i class="ri-file-copy-line"></i></button>
                    </div>
                    <textarea class="tool-input" id="hashSha512" readonly style="font-family:monospace;font-size:12px;background:#fff;height:50px;resize:none" placeholder="等待计算..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 进制转换
    radix: function() {
      return `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-exchange-line"></i>进制互转</div>
              <div class="tool-card-extra" style="font-size:13px;color:rgba(0,0,0,0.45)">输入任意进制自动转换</div>
            </div>
            <div style="padding:24px;display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
              <div style="display:flex;flex-direction:column;gap:8px">
                <label style="font-weight:500;color:rgba(0,0,0,0.65);display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#1677ff"></span>十进制 (Decimal)</label>
                <input type="text" class="tool-input" id="radix10" data-radix="10" style="font-family:monospace;font-size:18px;padding:12px" placeholder="0">
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <label style="font-weight:500;color:rgba(0,0,0,0.65);display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#52c41a"></span>二进制 (Binary)</label>
                <input type="text" class="tool-input" id="radix2" data-radix="2" style="font-family:monospace;font-size:18px;padding:12px" placeholder="0b0">
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <label style="font-weight:500;color:rgba(0,0,0,0.65);display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#faad14"></span>八进制 (Octal)</label>
                <input type="text" class="tool-input" id="radix8" data-radix="8" style="font-family:monospace;font-size:18px;padding:12px" placeholder="0o0">
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <label style="font-weight:500;color:rgba(0,0,0,0.65);display:flex;align-items:center;gap:8px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#722ed1"></span>十六进制 (Hex)</label>
                <input type="text" class="tool-input" id="radix16" data-radix="16" style="font-family:monospace;font-size:18px;padding:12px" placeholder="0x0">
              </div>
            </div>
          </div>
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-book-line"></i>进制说明</div>
            </div>
            <div style="padding:16px">
              <table style="width:100%;font-size:13px;border-collapse:collapse">
                <tr style="background:#fafafa">
                  <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #f0f0f0">进制</th>
                  <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #f0f0f0">基数</th>
                  <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #f0f0f0">字符集</th>
                  <th style="padding:10px 12px;text-align:left;border-bottom:1px solid #f0f0f0">常见用途</th>
                </tr>
                <tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">二进制</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace">2</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace">0-1</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:rgba(0,0,0,0.45)">计算机底层存储</td></tr>
                <tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">八进制</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace">8</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace">0-7</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:rgba(0,0,0,0.45)">Unix 文件权限</td></tr>
                <tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">十进制</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace">10</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-family:monospace">0-9</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:rgba(0,0,0,0.45)">日常计数</td></tr>
                <tr><td style="padding:10px 12px">十六进制</td><td style="padding:10px 12px;font-family:monospace">16</td><td style="padding:10px 12px;font-family:monospace">0-9, A-F</td><td style="padding:10px 12px;color:rgba(0,0,0,0.45)">内存地址、颜色值</td></tr>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    // 颜色转换
    color: function() {
      return `
        <div style="max-width:600px;margin:0 auto;padding-top:20px">
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-palette-line"></i>颜色转换</div>
            </div>
            <div style="padding:24px">
              <div style="display:flex;gap:24px;align-items:center;margin-bottom:24px">
                <div style="width:100px;height:100px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);overflow:hidden;flex-shrink:0">
                  <input type="color" id="colorPicker" value="#1677ff" style="width:100%;height:100%;border:none;cursor:pointer">
                </div>
                <div style="flex:1">
                  <div style="font-size:36px;font-weight:600;font-family:monospace;color:rgba(0,0,0,0.88)" id="colorPreview">#1677FF</div>
                  <div style="font-size:13px;color:rgba(0,0,0,0.45);margin-top:4px">点击左侧色块选择颜色</div>
                </div>
              </div>
              <div style="display:flex;flex-direction:column;gap:16px">
                <div style="display:flex;align-items:center;gap:12px">
                  <span style="width:50px;font-weight:500;color:rgba(0,0,0,0.65)">HEX</span>
                  <input type="text" class="tool-input" id="colorHex" data-type="hex" value="#1677FF" style="flex:1;font-family:monospace;font-size:16px">
                  <button class="tool-btn tool-btn-default tool-btn-icon color-copy-btn" data-target="colorHex"><i class="ri-file-copy-line"></i></button>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <span style="width:50px;font-weight:500;color:rgba(0,0,0,0.65)">RGB</span>
                  <input type="text" class="tool-input" id="colorRgb" data-type="rgb" value="rgb(22, 119, 255)" style="flex:1;font-family:monospace;font-size:16px">
                  <button class="tool-btn tool-btn-default tool-btn-icon color-copy-btn" data-target="colorRgb"><i class="ri-file-copy-line"></i></button>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <span style="width:50px;font-weight:500;color:rgba(0,0,0,0.65)">HSL</span>
                  <input type="text" class="tool-input" id="colorHsl" data-type="hsl" value="hsl(212, 100%, 54%)" style="flex:1;font-family:monospace;font-size:16px">
                  <button class="tool-btn tool-btn-default tool-btn-icon color-copy-btn" data-target="colorHsl"><i class="ri-file-copy-line"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 文本处理
    text: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>输入文本</div>
                </div>
                <textarea class="tool-textarea" id="textInput" placeholder="输入要处理的文本，每行一个或用分隔符分隔"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>处理结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="textCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="textOutput" readonly placeholder="处理结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:12px 0">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="tool-label-inline">分隔符</span>
                <select class="tool-select" id="textSeparator" style="width:100px">
                  <option value="\\n">换行符</option>
                  <option value=",">逗号</option>
                  <option value=";">分号</option>
                  <option value="\\t">Tab</option>
                </select>
              </div>
              <div class="tool-btn-group">
                <button class="tool-btn tool-btn-primary" id="textDedupeBtn"><i class="ri-filter-line"></i>去重</button>
                <button class="tool-btn tool-btn-secondary" id="textSortBtn"><i class="ri-sort-asc"></i>排序</button>
                <button class="tool-btn tool-btn-secondary" id="textStatsBtn"><i class="ri-bar-chart-line"></i>统计</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 随机生成
    random: function() {
      return `
        <div style="display:flex;flex-direction:column;gap:20px;max-width:700px;margin:0 auto;padding-top:20px">
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-text"></i>随机字符串</div>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:16px">
              <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:rgba(0,0,0,0.65)">长度</span>
                  <input type="number" class="tool-input" id="randomLength" value="16" min="1" max="100" style="width:70px;text-align:center">
                </div>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 12px;background:#fafafa;border-radius:6px"><input type="checkbox" id="randomUppercase" checked>大写字母</label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 12px;background:#fafafa;border-radius:6px"><input type="checkbox" id="randomLowercase" checked>小写字母</label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 12px;background:#fafafa;border-radius:6px"><input type="checkbox" id="randomNumbers" checked>数字</label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px 12px;background:#fafafa;border-radius:6px"><input type="checkbox" id="randomSymbols">特殊符号</label>
              </div>
              <div style="display:flex;gap:12px;align-items:center">
                <div style="flex:1;height:42px;display:flex;align-items:center;padding:0 12px;background:#fafafa;border:1px solid #d9d9d9;border-radius:6px;font-family:monospace;font-size:16px" id="randomOutput">点击生成按钮</div>
                <button class="tool-btn tool-btn-primary" id="randomGenerateBtn" style="height:42px;padding:0 20px"><i class="ri-refresh-line"></i>生成</button>
                <button class="tool-btn tool-btn-default tool-btn-icon" id="randomCopyBtn" style="width:42px;height:42px"><i class="ri-file-copy-line"></i></button>
              </div>
            </div>
          </div>
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-hashtag"></i>随机数字</div>
            </div>
            <div style="padding:20px;display:flex;flex-direction:column;gap:16px">
              <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="color:rgba(0,0,0,0.65)">范围</span>
                  <input type="number" class="tool-input" id="randomMin" value="1" style="width:90px;text-align:center">
                  <span style="color:rgba(0,0,0,0.45);font-size:16px">~</span>
                  <input type="number" class="tool-input" id="randomMax" value="100" style="width:90px;text-align:center">
                </div>
              </div>
              <div style="display:flex;gap:12px;align-items:center">
                <div style="flex:1;height:42px;display:flex;align-items:center;padding:0 12px;background:#fafafa;border:1px solid #d9d9d9;border-radius:6px;font-family:monospace;font-size:16px" id="randomNumOutput">点击生成按钮</div>
                <button class="tool-btn tool-btn-primary" id="randomNumGenerateBtn" style="height:42px;padding:0 20px"><i class="ri-refresh-line"></i>生成</button>
                <button class="tool-btn tool-btn-default tool-btn-icon" id="randomNumCopyBtn" style="width:42px;height:42px"><i class="ri-file-copy-line"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // HTTP 状态码
    http: function() {
      const codes = [
        { code: '200', desc: 'OK - 请求成功', type: 'success' },
        { code: '201', desc: 'Created - 资源已创建', type: 'success' },
        { code: '204', desc: 'No Content - 无内容返回', type: 'success' },
        { code: '301', desc: 'Moved Permanently - 永久重定向', type: 'redirect' },
        { code: '302', desc: 'Found - 临时重定向', type: 'redirect' },
        { code: '304', desc: 'Not Modified - 未修改（缓存）', type: 'redirect' },
        { code: '400', desc: 'Bad Request - 请求参数错误', type: 'client' },
        { code: '401', desc: 'Unauthorized - 未授权', type: 'client' },
        { code: '403', desc: 'Forbidden - 禁止访问', type: 'client' },
        { code: '404', desc: 'Not Found - 资源不存在', type: 'client' },
        { code: '405', desc: 'Method Not Allowed - 方法不允许', type: 'client' },
        { code: '409', desc: 'Conflict - 资源冲突', type: 'client' },
        { code: '422', desc: 'Unprocessable Entity - 参数校验失败', type: 'client' },
        { code: '429', desc: 'Too Many Requests - 请求过于频繁', type: 'client' },
        { code: '500', desc: 'Internal Server Error - 服务器内部错误', type: 'server' },
        { code: '502', desc: 'Bad Gateway - 网关错误', type: 'server' },
        { code: '503', desc: 'Service Unavailable - 服务不可用', type: 'server' },
        { code: '504', desc: 'Gateway Timeout - 网关超时', type: 'server' }
      ];
      
      const typeColors = {
        success: '#52c41a',
        redirect: '#faad14',
        client: '#ff4d4f',
        server: '#722ed1'
      };
      
      const typeLabels = {
        success: '成功响应 (2xx)',
        redirect: '重定向 (3xx)',
        client: '客户端错误 (4xx)',
        server: '服务端错误 (5xx)'
      };
      
      return `
        <div class="tool-fullheight">
          <div class="tool-card" style="flex:1;display:flex;flex-direction:column;min-height:0">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-information-line"></i>HTTP 状态码速查</div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;display:grid;gap:8px;min-height:0">
              ${codes.map(c => `
                <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:#fafafa;border-radius:8px;border-left:4px solid ${typeColors[c.type]}">
                  <span style="font-family:monospace;font-size:18px;font-weight:600;color:${typeColors[c.type]};width:50px">${c.code}</span>
                  <span style="color:rgba(0,0,0,0.88);flex:1">${c.desc}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    // 端口速查
    port: function() {
      const ports = [
        { port: '20/21', service: 'FTP', desc: '文件传输协议' },
        { port: '22', service: 'SSH', desc: '安全远程登录' },
        { port: '23', service: 'Telnet', desc: '远程登录（不安全）' },
        { port: '25', service: 'SMTP', desc: '邮件发送' },
        { port: '53', service: 'DNS', desc: '域名解析' },
        { port: '80', service: 'HTTP', desc: 'Web 服务' },
        { port: '110', service: 'POP3', desc: '邮件接收' },
        { port: '143', service: 'IMAP', desc: '邮件接收' },
        { port: '443', service: 'HTTPS', desc: 'Web 安全服务' },
        { port: '465/587', service: 'SMTPS', desc: '安全邮件发送' },
        { port: '993', service: 'IMAPS', desc: '安全邮件接收' },
        { port: '1433', service: 'MSSQL', desc: 'SQL Server' },
        { port: '3000', service: 'Node.js', desc: '开发服务器常用' },
        { port: '3306', service: 'MySQL', desc: 'MySQL 数据库' },
        { port: '5432', service: 'PostgreSQL', desc: 'PostgreSQL 数据库' },
        { port: '5672', service: 'RabbitMQ', desc: '消息队列' },
        { port: '6379', service: 'Redis', desc: 'Redis 缓存' },
        { port: '8080', service: 'HTTP Alt', desc: 'Web 备用端口' },
        { port: '9200', service: 'Elasticsearch', desc: '搜索引擎' },
        { port: '27017', service: 'MongoDB', desc: 'MongoDB 数据库' }
      ];
      
      return `
        <div class="tool-fullheight">
          <div class="tool-card" style="flex:1;display:flex;flex-direction:column;min-height:0">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-plug-line"></i>常用端口速查</div>
              <div class="tool-card-extra">
                <input type="text" class="tool-input" id="portSearch" placeholder="搜索端口或服务..." style="width:200px">
              </div>
            </div>
            <div id="portList" style="flex:1;overflow-y:auto;padding:16px;display:grid;gap:8px;min-height:0">
              ${ports.map(p => `
                <div class="port-item" data-search="${p.port} ${p.service} ${p.desc}".toLowerCase() style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:#fafafa;border-radius:8px;transition:background 0.2s">
                  <span style="font-family:monospace;font-size:16px;font-weight:600;color:#1677ff;width:90px">${p.port}</span>
                  <span style="font-weight:500;color:rgba(0,0,0,0.88);width:130px">${p.service}</span>
                  <span style="color:rgba(0,0,0,0.65);flex:1">${p.desc}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    // XML 工具
    xml: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-code-line"></i>输入 XML</div>
                </div>
                <textarea class="tool-textarea" id="xmlInput" placeholder='<root>
  <item>Hello</item>
</root>'></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="xmlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="xmlOutput" readonly placeholder="处理结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding: 12px 0;">
              <button class="tool-btn tool-btn-primary" id="xmlFormatBtn"><i class="ri-code-line"></i>格式化</button>
              <button class="tool-btn tool-btn-secondary" id="xmlCompressBtn"><i class="ri-compress-line"></i>压缩</button>
              <button class="tool-btn tool-btn-secondary" id="xmlToJsonBtn"><i class="ri-exchange-line"></i>转 JSON</button>
            </div>
          </div>
        </div>
      `;
    },

    // YAML 工具
    yaml: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-code-line"></i>输入 YAML</div>
                </div>
                <textarea class="tool-textarea" id="yamlInput" placeholder="name: test\nvalue: 123"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="yamlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="yamlOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding: 12px 0;">
              <button class="tool-btn tool-btn-primary" id="yamlToJsonBtn"><i class="ri-exchange-line"></i>转 JSON</button>
              <button class="tool-btn tool-btn-secondary" id="jsonToYamlBtn"><i class="ri-exchange-line"></i>JSON 转 YAML</button>
            </div>
          </div>
        </div>
      `;
    },

    // SQL 格式化
    sql: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-database-2-line"></i>输入 SQL</div>
                </div>
                <textarea class="tool-textarea" id="sqlInput" placeholder="SELECT * FROM users WHERE id = 1 AND status = 'active'"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>格式化结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="sqlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="sqlOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div style="display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; padding: 12px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tool-label-inline">关键字：</span>
                <select class="tool-select" id="sqlKeywordCase" style="width: 80px;">
                  <option value="upper">大写</option>
                  <option value="lower">小写</option>
                </select>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tool-label-inline">缩进：</span>
                <select class="tool-select" id="sqlIndent" style="width: 80px;">
                  <option value="2">2 空格</option>
                  <option value="4">4 空格</option>
                </select>
              </div>
              <div class="tool-btn-group">
                <button class="tool-btn tool-btn-primary" id="sqlFormatBtn"><i class="ri-code-line"></i>格式化</button>
                <button class="tool-btn tool-btn-secondary" id="sqlCompressBtn"><i class="ri-compress-line"></i>压缩</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // CSV 工具
    csv: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-excel-line"></i>输入 CSV</div>
                </div>
                <textarea class="tool-textarea" id="csvInput" placeholder="name,age,city
Alice,25,Beijing
Bob,30,Shanghai"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card" id="csvOutputCard">
                <div class="tool-card-header">
                  <div class="tool-card-title" id="csvOutputTitle"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="csvCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="csvOutput" readonly placeholder="转换 JSON 结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div style="display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; padding: 12px 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="tool-label-inline">分隔符：</span>
                <select class="tool-select" id="csvDelimiter" style="width: 100px;">
                  <option value=",">逗号 (,)</option>
                  <option value=";">分号 (;)</option>
                  <option value="\t">Tab</option>
                </select>
              </div>
              <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                <input type="checkbox" id="csvHasHeader" checked>
                <span>首行为表头</span>
              </label>
              <div class="tool-btn-group">
                <button class="tool-btn tool-btn-primary" id="csvToJsonBtn"><i class="ri-exchange-line"></i>转 JSON</button>
                <button class="tool-btn tool-btn-secondary" id="csvPreviewBtn" style="width:90px;justify-content:center"><i class="ri-table-line"></i>表格</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // Unicode 编解码
    unicode: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-font-size"></i>输入文本</div>
                </div>
                <textarea class="tool-textarea" id="unicodeInput" placeholder="输入文本或 Unicode 编码"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="unicodeCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="unicodeOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding: 12px 0;">
              <button class="tool-btn tool-btn-primary" id="toUnicodeBtn"><i class="ri-lock-line"></i>转 Unicode</button>
              <button class="tool-btn tool-btn-primary" id="fromUnicodeBtn"><i class="ri-lock-unlock-line"></i>Unicode 解码</button>
              <button class="tool-btn tool-btn-secondary" id="toAsciiBtn">转 ASCII</button>
              <button class="tool-btn tool-btn-secondary" id="toHexBtn">转 Hex</button>
            </div>
          </div>
        </div>
      `;
    },

    // AES 加解密
    aes: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>输入内容</div>
                </div>
                <textarea class="tool-textarea" id="aesInput" placeholder="加密时输入明文，解密时输入 Base64 密文"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="aesCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="aesOutput" readonly placeholder="加密/解密结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:12px 0">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="tool-label-inline">密钥：</span>
                <input type="text" style="display:none" tabindex="-1">
                <input type="password" style="display:none" tabindex="-1">
                <input type="text" class="tool-input" id="aesKey" placeholder="输入加密密钥" style="width:200px;font-family:monospace;-webkit-text-security:disc" autocomplete="off" name="aes-key-x9m2">
              </div>
              <div class="tool-btn-group">
                <button class="tool-btn tool-btn-primary" id="aesEncryptBtn"><i class="ri-lock-line"></i>加密</button>
                <button class="tool-btn tool-btn-primary" id="aesDecryptBtn"><i class="ri-lock-unlock-line"></i>解密</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // JWT 解析
    jwt: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-key-line"></i>输入 JWT Token</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-primary tool-btn-sm" id="jwtDecodeBtn"><i class="ri-search-line"></i>解析</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="jwtInput" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>解析结果</div>
                </div>
                <div style="flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:12px;border:1px solid #d9d9d9;border-top:none;border-radius:0 0 8px 8px">
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px">
                    <div style="font-weight:500;color:#ef4444;margin-bottom:8px">Header</div>
                    <pre id="jwtHeader" style="margin:0;font-size:13px;white-space:pre-wrap;color:#991b1b">-</pre>
                  </div>
                  <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:6px;padding:12px">
                    <div style="font-weight:500;color:#8b5cf6;margin-bottom:8px">Payload</div>
                    <pre id="jwtPayload" style="margin:0;font-size:13px;white-space:pre-wrap;color:#5b21b6">-</pre>
                  </div>
                  <div style="background:#ecfeff;border:1px solid #a5f3fc;border-radius:6px;padding:12px">
                    <div style="font-weight:500;color:#06b6d4;margin-bottom:8px">Signature</div>
                    <pre id="jwtSignature" style="margin:0;font-size:13px;word-break:break-all;color:#0e7490">-</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // HTML 工具
    html: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-html5-line"></i>输入 HTML</div>
                </div>
                <textarea class="tool-textarea" id="htmlInput" placeholder="<div><p>Hello World</p></div>"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="htmlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="htmlOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding:12px 0">
              <button class="tool-btn tool-btn-primary" id="htmlFormatBtn"><i class="ri-code-line"></i>格式化</button>
              <button class="tool-btn tool-btn-secondary" id="htmlCompressBtn"><i class="ri-compress-line"></i>压缩</button>
              <button class="tool-btn tool-btn-secondary" id="htmlEscapeBtn"><i class="ri-shield-line"></i>转义</button>
              <button class="tool-btn tool-btn-secondary" id="htmlUnescapeBtn"><i class="ri-shield-line"></i>反转义</button>
            </div>
          </div>
        </div>
      `;
    },

    // CSS 工具
    css: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-css3-line"></i>输入 CSS</div>
                </div>
                <textarea class="tool-textarea" id="cssInput" placeholder=".container { display: flex; justify-content: center; }"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card">
                <div class="tool-card-header">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="cssCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                  </div>
                </div>
                <textarea class="tool-textarea" id="cssOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding:12px 0">
              <button class="tool-btn tool-btn-primary" id="cssFormatBtn"><i class="ri-code-line"></i>格式化</button>
              <button class="tool-btn tool-btn-secondary" id="cssCompressBtn"><i class="ri-compress-line"></i>压缩</button>
            </div>
          </div>
        </div>
      `;
    },

    // 渐变生成器
    gradient: function() {
      return `
        <div style="max-width:700px;margin:0 auto;padding-top:20px">
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-brush-line"></i>渐变生成器</div>
            </div>
            <div style="padding:24px">
              <div id="gradientPreview" style="height:120px;border-radius:8px;background:linear-gradient(90deg, #667eea 0%, #764ba2 100%);margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"></div>
              <div style="display:grid;gap:16px;margin-bottom:24px">
                <div style="display:flex;align-items:center;gap:12px">
                  <label style="width:60px;color:rgba(0,0,0,0.65)">方向</label>
                  <select class="tool-select" id="gradientDirection" style="flex:1">
                    <option value="90deg">→ 从左到右</option>
                    <option value="180deg">↓ 从上到下</option>
                    <option value="270deg">← 从右到左</option>
                    <option value="0deg">↑ 从下到上</option>
                    <option value="45deg">↗ 对角线</option>
                    <option value="135deg">↘ 对角线</option>
                  </select>
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <label style="width:60px;color:rgba(0,0,0,0.65)">起始色</label>
                  <input type="color" id="gradientColor1" value="#667eea" style="width:40px;height:32px;border:none;cursor:pointer;border-radius:4px">
                  <input type="text" class="tool-input" id="gradientColor1Text" value="#667eea" style="flex:1;font-family:monospace">
                </div>
                <div style="display:flex;align-items:center;gap:12px">
                  <label style="width:60px;color:rgba(0,0,0,0.65)">结束色</label>
                  <input type="color" id="gradientColor2" value="#764ba2" style="width:40px;height:32px;border:none;cursor:pointer;border-radius:4px">
                  <input type="text" class="tool-input" id="gradientColor2Text" value="#764ba2" style="flex:1;font-family:monospace">
                </div>
              </div>
              <div style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px;margin-bottom:24px">
                <div style="font-size:13px;font-weight:500;color:rgba(0,0,0,0.65);margin-bottom:12px">CSS 代码</div>
                <textarea class="tool-textarea" id="gradientOutput" readonly style="min-height:80px;font-family:monospace;font-size:13px;background:#fff;border:1px solid #d9d9d9">background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);</textarea>
              </div>
              <button class="tool-btn tool-btn-primary tool-btn-lg" id="gradientCopyBtn" style="width:100%"><i class="ri-file-copy-line"></i>复制 CSS</button>
            </div>
          </div>
        </div>
      `;
    },

    // IP 工具
    ip: function() {
      return `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-global-line"></i>IP 地址转换</div>
              <div class="tool-card-extra">
                <button class="tool-btn tool-btn-primary" id="ipConvertBtn">转换</button>
              </div>
            </div>
            <div style="padding:20px">
              <div style="margin-bottom:16px">
                <input type="text" class="tool-input" id="ipInput" placeholder="输入 IP 地址，如 192.168.1.1" style="font-size:16px;padding:12px">
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
                <div style="background:#f6ffed;border:1px solid #b7eb8f;border-radius:8px;padding:16px">
                  <div style="font-size:12px;color:#52c41a;margin-bottom:8px;font-weight:500">十进制</div>
                  <input type="text" class="tool-input" id="ipDecimal" readonly style="background:#fff;font-family:monospace;font-size:14px">
                </div>
                <div style="background:#e6f4ff;border:1px solid #91caff;border-radius:8px;padding:16px">
                  <div style="font-size:12px;color:#1677ff;margin-bottom:8px;font-weight:500">二进制</div>
                  <input type="text" class="tool-input" id="ipBinary" readonly style="background:#fff;font-family:monospace;font-size:11px">
                </div>
                <div style="background:#f9f0ff;border:1px solid #d3adf7;border-radius:8px;padding:16px">
                  <div style="font-size:12px;color:#722ed1;margin-bottom:8px;font-weight:500">十六进制</div>
                  <input type="text" class="tool-input" id="ipHex" readonly style="background:#fff;font-family:monospace;font-size:14px">
                </div>
              </div>
            </div>
          </div>
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-git-branch-line"></i>子网计算</div>
              <div class="tool-card-extra">
                <button class="tool-btn tool-btn-primary" id="subnetCalcBtn">计算</button>
              </div>
            </div>
            <div style="padding:20px">
              <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
                <input type="text" class="tool-input" id="subnetIp" placeholder="IP 地址，如 192.168.1.0" style="flex:1;font-size:16px;padding:12px;font-family:monospace">
                <span style="color:rgba(0,0,0,0.45);font-size:20px;font-weight:300">/</span>
                <input type="number" class="tool-input" id="subnetMask" value="24" min="0" max="32" style="width:80px;font-size:16px;padding:12px;text-align:center">
              </div>
              <div id="subnetResult" style="background:#fafafa;border:1px solid #f0f0f0;border-radius:8px;padding:16px;min-height:80px;font-size:14px;line-height:1.8">
                <span style="color:rgba(0,0,0,0.45)">输入 IP 和子网掩码后点击计算</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 文本对比
    diff: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-actions-bar" style="margin-bottom:12px">
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="diffCompareBtn"><i class="ri-git-merge-line"></i>对比差异</button>
              <button class="tool-btn tool-btn-secondary" id="diffSwapBtn"><i class="ri-swap-line"></i>交换</button>
              <button class="tool-btn tool-btn-secondary" id="diffClearBtn"><i class="ri-delete-bin-line"></i>清空</button>
            </div>
            <div style="display:flex;gap:16px;margin-left:auto;align-items:center;font-size:13px">
              <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:#fecaca;border-radius:2px"></span>删除</span>
              <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:#bbf7d0;border-radius:2px"></span>新增</span>
              <span style="display:flex;align-items:center;gap:4px"><span style="width:12px;height:12px;background:#fef08a;border-radius:2px"></span>修改</span>
            </div>
          </div>
          <div class="tool-row" style="flex:1;min-height:0">
            <div class="tool-col" style="display:flex;flex-direction:column;min-height:0">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px;flex:1;display:flex;flex-direction:column;min-height:0">
                <div class="tool-card-header" style="border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-file-text-line"></i>原始文本</div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">
                  <textarea class="tool-textarea" id="diffInput1" placeholder="输入原始文本" style="border:none;border-radius:0 0 8px 8px;flex:1;resize:none"></textarea>
                  <div id="diffOutput1" style="display:none;position:absolute;inset:0;overflow:auto;font-family:'SF Mono','Monaco','Menlo','Consolas',monospace;font-size:13px;line-height:1.6;padding:8px 12px;background:#fff;border-radius:0 0 8px 8px;white-space:pre-wrap;word-break:break-all"></div>
                </div>
              </div>
            </div>
            <div class="tool-col" style="display:flex;flex-direction:column;min-height:0">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px;flex:1;display:flex;flex-direction:column;min-height:0">
                <div class="tool-card-header" style="border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-file-copy-line"></i>对比文本</div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;min-height:0;position:relative">
                  <textarea class="tool-textarea" id="diffInput2" placeholder="输入要对比的文本" style="border:none;border-radius:0 0 8px 8px;flex:1;resize:none"></textarea>
                  <div id="diffOutput2" style="display:none;position:absolute;inset:0;overflow:auto;font-family:'SF Mono','Monaco','Menlo','Consolas',monospace;font-size:13px;line-height:1.6;padding:8px 12px;background:#fff;border-radius:0 0 8px 8px;white-space:pre-wrap;word-break:break-all"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 二维码
    qrcode: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px">
                <div class="tool-card-header" style="border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-edit-line"></i>输入内容</div>
                  <div class="tool-card-extra">
                    <span style="font-size:13px;color:rgba(0,0,0,0.45);margin-right:8px">尺寸</span>
                    <select class="tool-select" id="qrcodeSize" style="width:110px">
                      <option value="128">128 x 128</option>
                      <option value="200" selected>200 x 200</option>
                      <option value="256">256 x 256</option>
                      <option value="300">300 x 300</option>
                    </select>
                  </div>
                </div>
                <textarea class="tool-textarea" id="qrcodeInput" placeholder="输入要生成二维码的文本或链接" style="border:none;border-radius:0 0 8px 8px"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px;display:flex;flex-direction:column">
                <div class="tool-card-header" style="border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-qr-code-line"></i>生成结果</div>
                </div>
                <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;background:#fafafa;border-radius:0 0 8px 8px">
                  <div id="qrcodeOutput" style="background:white;padding:20px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;min-width:200px;min-height:200px">
                    <span style="color:rgba(0,0,0,0.25)">二维码将显示在这里</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="tool-actions-bar">
            <div class="tool-btn-group tool-btn-group-center" style="padding:12px 0">
              <button class="tool-btn tool-btn-primary" id="qrcodeGenerateBtn"><i class="ri-qr-code-line"></i>生成二维码</button>
              <button class="tool-btn tool-btn-secondary" id="qrcodeDownloadBtn"><i class="ri-download-line"></i>下载</button>
            </div>
          </div>
        </div>
      `;
    },

    // Markdown
    markdown: function() {
      return `
        <div class="tool-fullheight">
          <div class="tool-row">
            <div class="tool-col">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px">
                <div class="tool-card-header" style="border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-markdown-line"></i>Markdown 源码</div>
                </div>
                <textarea class="tool-textarea" id="markdownInput" style="border:none;border-radius:0 0 8px 8px" placeholder="# 标题

**粗体** *斜体* ~~删除线~~

- 列表项1
- 列表项2

\`\`\`js
console.log('Hello');
\`\`\`"></textarea>
              </div>
            </div>
            <div class="tool-col">
              <div class="tool-card" style="border:1px solid #d9d9d9;border-radius:8px">
                <div class="tool-card-header" style="border-radius:8px 8px 0 0">
                  <div class="tool-card-title"><i class="ri-eye-line"></i>实时预览</div>
                  <div class="tool-card-extra">
                    <button class="tool-btn tool-btn-text tool-btn-sm" id="markdownCopyHtmlBtn"><i class="ri-html5-line"></i>复制 HTML</button>
                  </div>
                </div>
                <div id="markdownOutput" style="flex:1;overflow-y:auto;padding:20px;background:#fff;border-radius:0 0 8px 8px;line-height:1.8"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 占位图
    placeholder: function() {
      return `
        <div style="display:flex;gap:16px;align-items:stretch">
          <div style="width:320px;flex-shrink:0;display:flex">
            <div class="tool-card" style="flex:1;display:flex;flex-direction:column">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-settings-3-line"></i>配置选项</div>
              </div>
              <div style="padding:20px;display:flex;flex-direction:column;gap:16px;flex:1">
                <div style="display:flex;gap:12px">
                  <div style="flex:1">
                    <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">宽度</label>
                    <input type="number" class="tool-input" id="placeholderWidth" value="400" min="1" max="2000" style="width:100%">
                  </div>
                  <div style="flex:1">
                    <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">高度</label>
                    <input type="number" class="tool-input" id="placeholderHeight" value="300" min="1" max="2000" style="width:100%">
                  </div>
                </div>
                <div style="display:flex;gap:12px">
                  <div style="flex:1">
                    <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">背景色</label>
                    <div style="display:flex;gap:8px;align-items:center">
                      <input type="color" id="placeholderBgColor" value="#cccccc" style="width:40px;height:32px;border:none;border-radius:4px;cursor:pointer">
                      <span style="font-family:monospace;font-size:13px;color:rgba(0,0,0,0.45)">#CCCCCC</span>
                    </div>
                  </div>
                  <div style="flex:1">
                    <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">文字色</label>
                    <div style="display:flex;gap:8px;align-items:center">
                      <input type="color" id="placeholderTextColor" value="#666666" style="width:40px;height:32px;border:none;border-radius:4px;cursor:pointer">
                      <span style="font-family:monospace;font-size:13px;color:rgba(0,0,0,0.45)">#666666</span>
                    </div>
                  </div>
                </div>
                <div style="flex:1;display:flex;flex-direction:column;min-height:0">
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">自定义文字</label>
                  <textarea class="tool-textarea" id="placeholderText" placeholder="留空则显示尺寸，支持多行文字" style="flex:1;min-height:60px;resize:none"></textarea>
                </div>
                <div style="display:flex;gap:12px">
                  <button class="tool-btn tool-btn-primary" id="placeholderGenerateBtn" style="flex:1"><i class="ri-image-line"></i>生成</button>
                  <button class="tool-btn tool-btn-secondary" id="placeholderDownloadBtn" style="flex:1"><i class="ri-download-line"></i>下载</button>
                </div>
              </div>
            </div>
          </div>
          <div style="flex:1;display:flex">
            <div class="tool-card" style="flex:1;display:flex;flex-direction:column">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-image-line"></i>预览</div>
              </div>
              <div style="flex:1;padding:24px;display:flex;align-items:center;justify-content:center;min-height:400px;background:#fafafa;border-radius:0 0 8px 8px">
                <canvas id="placeholderCanvas" style="max-width:100%;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)"></canvas>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // .gitignore 生成器
    gitignore: function() {
      const templates = {
        'Node.js': 'node_modules/\nnpm-debug.log\nyarn-error.log\n.env\n.env.local\ndist/\nbuild/',
        'Python': '__pycache__/\n*.py[cod]\n*$py.class\n.env\nvenv/\n*.egg-info/\ndist/\nbuild/',
        'Java': '*.class\n*.jar\n*.war\ntarget/\n.idea/\n*.iml\n.gradle/',
        'Go': '*.exe\n*.test\n*.out\nvendor/\nbin/',
        'Rust': 'target/\nCargo.lock\n**/*.rs.bk',
        'React': 'node_modules/\nbuild/\n.env\n.env.local\nnpm-debug.log\nyarn-error.log\n.DS_Store',
        'Vue': 'node_modules/\ndist/\n.env\n.env.local\nnpm-debug.log\nyarn-error.log\n.DS_Store',
        'macOS': '.DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes',
        'Windows': 'Thumbs.db\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/',
        'IDE': '.idea/\n.vscode/\n*.swp\n*.swo\n*~\n.project\n.settings/'
      };
      
      return `
        <div class="tool-fullheight">
          <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
            <span style="color:rgba(0,0,0,0.65);font-size:14px">模板</span>
            ${Object.keys(templates).map(t => `
              <button class="tool-btn tool-btn-secondary gitignore-preset" data-template="${t}">${t}</button>
            `).join('')}
            <div style="margin-left:auto;display:flex;gap:8px">
              <button class="tool-btn tool-btn-default" id="gitignoreClearBtn"><i class="ri-delete-bin-line"></i>清空</button>
              <button class="tool-btn tool-btn-primary" id="gitignoreCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
            </div>
          </div>
          <div class="tool-card" style="flex:1;display:flex;flex-direction:column;border:1px solid #d9d9d9;border-radius:8px;min-height:0">
            <textarea class="tool-textarea" id="gitignoreOutput" style="flex:1;border:none;border-radius:8px;min-height:0" placeholder="点击上方模板按钮添加内容，可叠加多个模板，也可以直接编辑"></textarea>
          </div>
        </div>
      `;
    },

    // Nginx 配置生成器
    nginx: function() {
      return `
        <div style="display:flex;gap:16px;align-items:stretch">
          <div style="width:350px;flex-shrink:0;display:flex">
            <div class="tool-card" style="flex:1;display:flex;flex-direction:column">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-settings-3-line"></i>配置选项</div>
              </div>
              <div style="padding:20px;display:flex;flex-direction:column;gap:16px;flex:1">
                <div>
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">域名</label>
                  <input type="text" class="tool-input" id="nginxDomain" placeholder="example.com">
                </div>
                <div style="display:flex;gap:12px">
                  <div style="flex:1">
                    <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">端口</label>
                    <input type="number" class="tool-input" id="nginxPort" value="80">
                  </div>
                  <div style="flex:2">
                    <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">根目录</label>
                    <input type="text" class="tool-input" id="nginxRoot" placeholder="/var/www/html">
                  </div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:12px;padding:12px;background:#fafafa;border-radius:6px">
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="nginxHttps">启用 HTTPS</label>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="nginxProxy">反向代理</label>
                  <label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="nginxGzip">启用 Gzip</label>
                </div>
                <div id="nginxProxyRow" style="display:none">
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">代理地址</label>
                  <input type="text" class="tool-input" id="nginxProxyPass" placeholder="http://127.0.0.1:3000">
                </div>
                <div style="flex:1"></div>
                <button class="tool-btn tool-btn-primary" id="nginxGenerateBtn" style="width:100%"><i class="ri-magic-line"></i>生成配置</button>
              </div>
            </div>
          </div>
          <div style="flex:1;min-width:0;display:flex">
            <div class="tool-card" style="flex:1;display:flex;flex-direction:column">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-file-code-line"></i>Nginx 配置</div>
                <div class="tool-card-extra">
                  <button class="tool-btn tool-btn-primary tool-btn-sm" id="nginxCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                </div>
              </div>
              <textarea class="tool-textarea" id="nginxOutput" readonly style="flex:1;border:none;border-radius:0 0 8px 8px;min-height:400px"></textarea>
            </div>
          </div>
        </div>
      `;
    },

    // Curl 命令
    curl: function() {
      return `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-settings-3-line"></i>请求配置</div>
            </div>
            <div style="padding:20px;display:grid;gap:16px">
              <div style="display:flex;gap:12px">
                <div style="width:120px">
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">Method</label>
                  <select class="tool-select" id="curlMethod" style="width:100%">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div style="flex:1">
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">URL</label>
                  <input type="text" class="tool-input" id="curlUrl" placeholder="https://api.example.com/data">
                </div>
              </div>
              <div style="display:flex;gap:12px">
                <div style="flex:1">
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">Headers</label>
                  <textarea class="tool-textarea" id="curlHeaders" placeholder="Content-Type: application/json&#10;Authorization: Bearer token" style="min-height:80px"></textarea>
                </div>
                <div style="flex:1">
                  <label style="display:block;font-size:13px;color:rgba(0,0,0,0.65);margin-bottom:6px">Body</label>
                  <textarea class="tool-textarea" id="curlBody" placeholder='{"key": "value"}' style="min-height:80px"></textarea>
                </div>
              </div>
              <button class="tool-btn tool-btn-primary" id="curlGenerateBtn"><i class="ri-terminal-line"></i>生成 Curl 命令</button>
            </div>
          </div>
          <div class="tool-card">
            <div class="tool-card-header">
              <div class="tool-card-title"><i class="ri-terminal-line"></i>Curl 命令</div>
              <div class="tool-card-extra">
                <button class="tool-btn tool-btn-primary tool-btn-sm" id="curlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
              </div>
            </div>
            <textarea class="tool-textarea" id="curlOutput" readonly style="border:none;border-radius:0 0 8px 8px;min-height:120px" placeholder="点击生成按钮后，Curl 命令将显示在这里"></textarea>
          </div>
        </div>
      `;
    }
  };

  // ========== 工具事件处理 ==========
  function initToolEvents(tool) {
    switch(tool) {
      case 'json':
        initJsonEvents();
        break;
      case 'base64':
        initBase64Events();
        break;
      case 'url':
        initUrlEvents();
        break;
      case 'timestamp':
        initTimestampEvents();
        break;
      case 'regex':
        initRegexEvents();
        break;
      case 'uuid':
        initUuidEvents();
        break;
      case 'cron':
        initCronEvents();
        break;
      case 'hash':
        initHashEvents();
        break;
      case 'radix':
        initRadixEvents();
        break;
      case 'color':
        initColorEvents();
        break;
      case 'text':
        initTextEvents();
        break;
      case 'random':
        initRandomEvents();
        break;
      case 'port':
        initPortEvents();
        break;
      case 'xml':
        initXmlEvents();
        break;
      case 'yaml':
        initYamlEvents();
        break;
      case 'sql':
        initSqlEvents();
        break;
      case 'csv':
        initCsvEvents();
        break;
      case 'unicode':
        initUnicodeEvents();
        break;
      case 'aes':
        initAesEvents();
        break;
      case 'jwt':
        initJwtEvents();
        break;
      case 'html':
        initHtmlEvents();
        break;
      case 'css':
        initCssEvents();
        break;
      case 'gradient':
        initGradientEvents();
        break;
      case 'ip':
        initIpEvents();
        break;
      case 'diff':
        initDiffEvents();
        break;
      case 'qrcode':
        initQrcodeEvents();
        break;
      case 'markdown':
        initMarkdownEvents();
        break;
      case 'placeholder':
        initPlaceholderEvents();
        break;
      case 'gitignore':
        initGitignoreEvents();
        break;
      case 'nginx':
        initNginxEvents();
        break;
      case 'curl':
        initCurlEvents();
        break;
    }
  }

  // JSON 工具事件
  function initJsonEvents() {
    const input = document.getElementById('jsonInput');
    const output = document.getElementById('jsonOutput');
    const indent = document.getElementById('jsonIndent');

    document.getElementById('jsonFormatBtn').onclick = () => {
      trackToolAction('json', 'format');
      try {
        const obj = JSON.parse(input.value);
        const space = indent.value === 'tab' ? '\t' : parseInt(indent.value);
        output.value = JSON.stringify(obj, null, space);
      } catch (e) {
        output.value = '❌ JSON 格式错误: ' + e.message;
      }
    };

    document.getElementById('jsonCompressBtn').onclick = () => {
      trackToolAction('json', 'compress');
      try {
        const obj = JSON.parse(input.value);
        output.value = JSON.stringify(obj);
      } catch (e) {
        output.value = '❌ JSON 格式错误: ' + e.message;
      }
    };

    document.getElementById('jsonCopyBtn').onclick = () => copyToClipboard(output.value);
    document.getElementById('jsonClearBtn').onclick = () => {
      input.value = '';
      output.value = '';
    };
  }

  // Base64 事件
  function initBase64Events() {
    const input = document.getElementById('base64Input');
    const output = document.getElementById('base64Output');

    document.getElementById('base64EncodeBtn').onclick = () => {
      trackToolAction('base64', 'encode');
      try {
        output.value = btoa(unescape(encodeURIComponent(input.value)));
      } catch (e) {
        output.value = '❌ 编码失败: ' + e.message;
      }
    };

    document.getElementById('base64DecodeBtn').onclick = () => {
      trackToolAction('base64', 'decode');
      try {
        output.value = decodeURIComponent(escape(atob(input.value)));
      } catch (e) {
        output.value = '❌ 解码失败: ' + e.message;
      }
    };

    document.getElementById('base64CopyBtn').onclick = () => copyToClipboard(output.value);
  }

  // URL 事件
  function initUrlEvents() {
    const input = document.getElementById('urlInput');
    const output = document.getElementById('urlOutput');

    document.getElementById('urlEncodeBtn').onclick = () => {
      trackToolAction('url', 'encode');
      output.value = encodeURIComponent(input.value);
    };

    document.getElementById('urlDecodeBtn').onclick = () => {
      trackToolAction('url', 'decode');
      try {
        output.value = decodeURIComponent(input.value);
      } catch (e) {
        output.value = '❌ 解码失败: ' + e.message;
      }
    };

    document.getElementById('urlParseBtn').onclick = () => {
      try {
        const url = new URL(input.value);
        const params = {};
        url.searchParams.forEach((v, k) => params[k] = v);
        output.value = JSON.stringify({
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          params: params
        }, null, 2);
      } catch (e) {
        output.value = '❌ URL 解析失败: ' + e.message;
      }
    };

    document.getElementById('urlCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  // 时间戳事件
  function initTimestampEvents() {
    document.getElementById('refreshTsBtn').onclick = () => {
      const now = Date.now();
      document.getElementById('currentTs').textContent = Math.floor(now / 1000);
      document.getElementById('currentTsMs').textContent = now;
    };

    document.getElementById('ts2dateBtn').onclick = () => {
      trackToolAction('timestamp', 'ts2date');
      const ts = document.getElementById('tsInput').value;
      if (!ts) return;
      const num = parseInt(ts);
      const date = ts.length > 10 ? new Date(num) : new Date(num * 1000);
      document.getElementById('ts2dateResult').textContent = date.toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    };

    document.getElementById('date2tsBtn').onclick = () => {
      trackToolAction('timestamp', 'date2ts');
      const dateStr = document.getElementById('dateInput').value;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const ts = date.getTime();
      document.getElementById('date2tsResult').innerHTML = `秒级: <strong>${Math.floor(ts/1000)}</strong><br>毫秒级: <strong>${ts}</strong>`;
    };

    // 设置默认时间为当前
    document.getElementById('dateInput').value = new Date().toISOString().slice(0, 16);
  }

  // 正则事件
  function initRegexEvents() {
    const preset = document.getElementById('regexPreset');
    const pattern = document.getElementById('regexPattern');
    const flags = document.getElementById('regexFlags');
    const input = document.getElementById('regexInput');
    const output = document.getElementById('regexOutput');

    preset.onchange = () => {
      if (preset.value) {
        pattern.value = preset.value;
      }
    };

    document.getElementById('regexTestBtn').onclick = () => {
      trackToolAction('regex', 'test');
      try {
        const regex = new RegExp(pattern.value, flags.value);
        const matches = input.value.match(regex);
        if (matches) {
          output.innerHTML = `<span style="color:#22c55e">✓ 匹配成功 (${matches.length} 个)</span>\n\n` + 
            matches.map((m, i) => `${i + 1}. ${m}`).join('\n');
        } else {
          output.innerHTML = '<span style="color:#ef4444">✗ 无匹配</span>';
        }
      } catch (e) {
        output.innerHTML = '<span style="color:#ef4444">❌ 正则表达式错误: ' + e.message + '</span>';
      }
    };
  }

  // UUID 事件
  function initUuidEvents() {
    const count = document.getElementById('uuidCount');
    const format = document.getElementById('uuidFormat');
    const output = document.getElementById('uuidOutput');

    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    document.getElementById('uuidGenerateBtn').onclick = () => {
      trackToolAction('uuid', 'generate');
      const n = parseInt(count.value);
      const uuids = [];
      for (let i = 0; i < n; i++) {
        let uuid = generateUUID();
        if (format.value === 'upper') uuid = uuid.toUpperCase();
        if (format.value === 'nodash') uuid = uuid.replace(/-/g, '');
        uuids.push(uuid);
      }
      output.textContent = uuids.join('\n');
    };

    document.getElementById('uuidCopyBtn').onclick = () => copyToClipboard(output.textContent);
  }

  // Cron 事件
  function initCronEvents() {
    const preset = document.getElementById('cronPreset');
    const cronMin = document.getElementById('cronMin');
    const cronHour = document.getElementById('cronHour');
    const cronDay = document.getElementById('cronDay');
    const cronMonth = document.getElementById('cronMonth');
    const cronWeek = document.getElementById('cronWeek');
    const cronInput = document.getElementById('cronInput');
    const output = document.getElementById('cronOutput');

    // 更新完整表达式显示
    function updateCronExpression() {
      const expr = `${cronMin.value} ${cronHour.value} ${cronDay.value} ${cronMonth.value} ${cronWeek.value}`;
      cronInput.textContent = expr;
    }

    // 监听所有输入框变化
    [cronMin, cronHour, cronDay, cronMonth, cronWeek].forEach(input => {
      input.oninput = updateCronExpression;
    });

    // 预设选择
    preset.onchange = () => {
      if (preset.value) {
        const parts = preset.value.split(' ');
        cronMin.value = parts[0];
        cronHour.value = parts[1];
        cronDay.value = parts[2];
        cronMonth.value = parts[3];
        cronWeek.value = parts[4];
        updateCronExpression();
      }
    };

    document.getElementById('cronParseBtn').onclick = () => {
      const minute = cronMin.value.trim();
      const hour = cronHour.value.trim();
      const day = cronDay.value.trim();
      const month = cronMonth.value.trim();
      const weekday = cronWeek.value.trim();
      
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      let desc = '<div style="font-size:15px;color:#52c41a;font-weight:500;margin-bottom:12px">✓ 执行时间：';
      
      // 简单解析
      if (minute === '*' && hour === '*') {
        desc += '每分钟';
      } else if (minute === '0' && hour === '*') {
        desc += '每小时整点';
      } else if (minute.startsWith('*/')) {
        desc += `每 ${minute.slice(2)} 分钟`;
      } else if (hour.startsWith('*/')) {
        desc += `每 ${hour.slice(2)} 小时`;
      } else if (minute !== '*' && hour !== '*') {
        desc += `${hour}:${minute.padStart(2, '0')}`;
      } else {
        desc += '自定义时间';
      }

      if (weekday !== '*') {
        if (weekday.includes('-')) {
          const [start, end] = weekday.split('-').map(Number);
          desc += ` (${weekNames[start]} 至 ${weekNames[end]})`;
        } else {
          desc += ` (${weekday.split(',').map(d => weekNames[parseInt(d)]).join('、')})`;
        }
      }

      if (day !== '*') {
        desc += ` 每月 ${day} 号`;
      }

      if (month !== '*') {
        desc += ` ${month} 月`;
      }
      
      desc += '</div>';

      desc += `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;color:rgba(0,0,0,0.65)">
        <span><strong>分钟:</strong> ${minute}</span>
        <span><strong>小时:</strong> ${hour}</span>
        <span><strong>日期:</strong> ${day}</span>
        <span><strong>月份:</strong> ${month}</span>
        <span><strong>星期:</strong> ${weekday}</span>
      </div>`;

      output.innerHTML = desc;
    };
  }

  // MD5 纯 JavaScript 实现
  function md5(string) {
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
      a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
      a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
      a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
      x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
    }
    function cmn(q, a, b, x, s, t) { a = add32(add32(a, q), add32(x, t)); return add32((a << s) | (a >>> (32 - s)), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }
    function md51(s) {
      var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i = 64; i <= s.length; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
      s = s.substring(i - 64);
      var tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }
    function md5blk(s) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      return md5blks;
    }
    function rhex(n) { var s = '', j = 0; for (; j < 4; j++) s += ('0' + ((n >> (j * 8)) & 0xFF).toString(16)).slice(-2); return s; }
    function hex(x) { for (var i = 0; i < x.length; i++) x[i] = rhex(x[i]); return x.join(''); }
    function add32(a, b) { return (a + b) & 0xFFFFFFFF; }
    // 处理 UTF-8
    var utf8 = unescape(encodeURIComponent(string));
    return hex(md51(utf8));
  }

  // 哈希事件
  function initHashEvents() {
    document.getElementById('hashCalcBtn').onclick = async () => {
      trackToolAction('hash', 'calculate');
      const input = document.getElementById('hashInput').value;
      const encoder = new TextEncoder();
      const data = encoder.encode(input);

      // MD5 使用纯 JavaScript 实现
      document.getElementById('hashMd5').value = md5(input);

      const sha1 = await crypto.subtle.digest('SHA-1', data);
      document.getElementById('hashSha1').value = Array.from(new Uint8Array(sha1)).map(b => b.toString(16).padStart(2, '0')).join('');

      const sha256 = await crypto.subtle.digest('SHA-256', data);
      document.getElementById('hashSha256').value = Array.from(new Uint8Array(sha256)).map(b => b.toString(16).padStart(2, '0')).join('');

      const sha512 = await crypto.subtle.digest('SHA-512', data);
      document.getElementById('hashSha512').value = Array.from(new Uint8Array(sha512)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    document.querySelectorAll('.hash-copy-btn').forEach(btn => {
      btn.onclick = () => {
        const target = document.getElementById(btn.dataset.target);
        copyToClipboard(target.value);
      };
    });
  }

  // 进制转换事件
  function initRadixEvents() {
    const inputs = document.querySelectorAll('[data-radix]');
    inputs.forEach(input => {
      input.oninput = () => {
        const radix = parseInt(input.dataset.radix);
        let value;
        try {
          value = parseInt(input.value, radix);
        } catch (e) {
          return;
        }
        if (isNaN(value) || input.value === '') return;

        // 更新其他进制输入框（不更新当前正在输入的）
        inputs.forEach(other => {
          if (other !== input) {
            const otherRadix = parseInt(other.dataset.radix);
            other.value = value.toString(otherRadix).toUpperCase();
          }
        });
      };
    });
  }

  // 颜色转换事件
  function initColorEvents() {
    const picker = document.getElementById('colorPicker');
    const preview = document.getElementById('colorPreview');
    const hexInput = document.getElementById('colorHex');
    const rgbInput = document.getElementById('colorRgb');
    const hslInput = document.getElementById('colorHsl');

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function updateFromHex(hex) {
      const rgb = hexToRgb(hex);
      if (!rgb) return;
      
      picker.value = hex;
      preview.textContent = hex.toUpperCase();
      hexInput.value = hex.toUpperCase();
      rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    }

    picker.oninput = () => updateFromHex(picker.value);
    
    hexInput.onchange = () => {
      let hex = hexInput.value;
      if (!hex.startsWith('#')) hex = '#' + hex;
      updateFromHex(hex);
    };

    document.querySelectorAll('.color-copy-btn').forEach(btn => {
      btn.onclick = () => {
        const target = document.getElementById(btn.dataset.target);
        copyToClipboard(target.value);
      };
    });
  }

  // 文本处理事件
  function initTextEvents() {
    const input = document.getElementById('textInput');
    const output = document.getElementById('textOutput');
    const separator = document.getElementById('textSeparator');

    function getSeparator() {
      const val = separator.value;
      if (val === '\\n') return '\n';
      if (val === '\\t') return '\t';
      return val;
    }

    document.getElementById('textDedupeBtn').onclick = () => {
      const sep = getSeparator();
      const items = input.value.split(sep).filter(Boolean);
      const unique = [...new Set(items)];
      output.value = unique.join(sep);
      showToast(`去重完成：${items.length} → ${unique.length}`);
    };

    document.getElementById('textSortBtn').onclick = () => {
      const sep = getSeparator();
      const items = input.value.split(sep).filter(Boolean);
      items.sort((a, b) => a.localeCompare(b, 'zh-CN'));
      output.value = items.join(sep);
    };

    document.getElementById('textStatsBtn').onclick = () => {
      const text = input.value;
      const sep = getSeparator();
      const lines = text.split(sep).filter(Boolean);
      output.value = `字符数：${text.length}
行数：${lines.length}
字数（中文）：${(text.match(/[\u4e00-\u9fa5]/g) || []).length}
字数（英文单词）：${(text.match(/[a-zA-Z]+/g) || []).length}`;
    };

    document.getElementById('textCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  // 随机生成事件
  function initRandomEvents() {
    document.getElementById('randomGenerateBtn').onclick = () => {
      trackToolAction('random', 'string');
      const length = parseInt(document.getElementById('randomLength').value);
      let chars = '';
      if (document.getElementById('randomUppercase').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (document.getElementById('randomLowercase').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (document.getElementById('randomNumbers').checked) chars += '0123456789';
      if (document.getElementById('randomSymbols').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      if (!chars) {
        showToast('请至少选择一种字符类型');
        return;
      }

      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      document.getElementById('randomOutput').textContent = result;
    };

    document.getElementById('randomCopyBtn').onclick = () => {
      copyToClipboard(document.getElementById('randomOutput').textContent);
    };

    document.getElementById('randomNumGenerateBtn').onclick = () => {
      trackToolAction('random', 'number');
      const min = parseInt(document.getElementById('randomMin').value);
      const max = parseInt(document.getElementById('randomMax').value);
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      document.getElementById('randomNumOutput').textContent = result;
    };

    document.getElementById('randomNumCopyBtn').onclick = () => {
      copyToClipboard(document.getElementById('randomNumOutput').textContent);
    };
  }

  // 端口搜索事件
  function initPortEvents() {
    document.getElementById('portSearch').oninput = (e) => {
      const keyword = e.target.value.toLowerCase();
      document.querySelectorAll('.port-item').forEach(item => {
        const text = item.dataset.search;
        item.style.display = text.includes(keyword) ? 'flex' : 'none';
      });
    };
  }

  // XML 工具事件
  function initXmlEvents() {
    const input = document.getElementById('xmlInput');
    const output = document.getElementById('xmlOutput');

    document.getElementById('xmlFormatBtn').onclick = () => {
      trackToolAction('xml', 'format');
      try {
        const formatted = formatXml(input.value);
        output.value = formatted;
      } catch (e) {
        output.value = '❌ XML 格式错误: ' + e.message;
      }
    };

    document.getElementById('xmlCompressBtn').onclick = () => {
      output.value = input.value.replace(/>\s+</g, '><').trim();
    };

    document.getElementById('xmlToJsonBtn').onclick = () => {
      try {
        const json = xmlToJson(input.value);
        output.value = JSON.stringify(json, null, 2);
      } catch (e) {
        output.value = '❌ 转换失败: ' + e.message;
      }
    };

    document.getElementById('xmlCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  function formatXml(xml) {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(node => {
      if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
      formatted += indent + '<' + node + '>\n';
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('?')) indent += tab;
    });
    return formatted.substring(1, formatted.length - 2);
  }

  function xmlToJson(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    return nodeToJson(doc.documentElement);
  }

  function nodeToJson(node) {
    const obj = {};
    if (node.nodeType === 1) {
      if (node.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes.item(i);
          obj['@attributes'][attr.nodeName] = attr.nodeValue;
        }
      }
    }
    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes.item(i);
        if (child.nodeType === 3) {
          if (child.nodeValue.trim()) obj['#text'] = child.nodeValue.trim();
        } else if (child.nodeType === 1) {
          if (!obj[child.nodeName]) obj[child.nodeName] = [];
          obj[child.nodeName].push(nodeToJson(child));
        }
      }
    }
    return obj;
  }

  // YAML 工具事件
  function initYamlEvents() {
    const input = document.getElementById('yamlInput');
    const output = document.getElementById('yamlOutput');

    document.getElementById('yamlToJsonBtn').onclick = () => {
      try {
        const json = parseYaml(input.value);
        output.value = JSON.stringify(json, null, 2);
      } catch (e) {
        output.value = '❌ YAML 解析错误: ' + e.message;
      }
    };

    document.getElementById('jsonToYamlBtn').onclick = () => {
      try {
        const obj = JSON.parse(input.value);
        output.value = jsonToYaml(obj);
      } catch (e) {
        output.value = '❌ JSON 解析错误: ' + e.message;
      }
    };

    document.getElementById('yamlCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  function parseYaml(yaml) {
    const result = {};
    const lines = yaml.split('\n');
    let currentKey = null;
    let currentIndent = 0;
    const stack = [result];

    lines.forEach(line => {
      if (!line.trim() || line.trim().startsWith('#')) return;
      const match = line.match(/^(\s*)([^:]+):\s*(.*)$/);
      if (match) {
        const indent = match[1].length;
        const key = match[2].trim();
        let value = match[3].trim();

        if (value === '') {
          stack[stack.length - 1][key] = {};
        } else if (value === '|' || value === '>') {
          stack[stack.length - 1][key] = '';
        } else {
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (!isNaN(value)) value = parseFloat(value);
          else if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
          stack[stack.length - 1][key] = value;
        }
      }
    });
    return result;
  }

  function jsonToYaml(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${jsonToYaml(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    return yaml;
  }

  // SQL 格式化事件
  function initSqlEvents() {
    const input = document.getElementById('sqlInput');
    const output = document.getElementById('sqlOutput');

    document.getElementById('sqlFormatBtn').onclick = () => {
      trackToolAction('sql', 'format');
      const keywordCase = document.getElementById('sqlKeywordCase').value;
      const indentSize = parseInt(document.getElementById('sqlIndent').value);
      output.value = formatSql(input.value, keywordCase, indentSize);
    };

    document.getElementById('sqlCompressBtn').onclick = () => {
      trackToolAction('sql', 'compress');
      output.value = input.value.replace(/\s+/g, ' ').trim();
    };

    document.getElementById('sqlCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  function formatSql(sql, keywordCase, indentSize) {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'LIMIT', 'OFFSET', 'UNION', 'AS'];
    const indent = ' '.repeat(indentSize);
    
    let formatted = sql.trim();
    keywords.forEach(kw => {
      const regex = new RegExp('\\b' + kw + '\\b', 'gi');
      const replacement = keywordCase === 'upper' ? kw.toUpperCase() : kw.toLowerCase();
      formatted = formatted.replace(regex, '\n' + replacement);
    });
    
    formatted = formatted.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
    return formatted;
  }

  // CSV 工具事件
  function initCsvEvents() {
    const input = document.getElementById('csvInput');
    let currentJsonOutput = '';

    document.getElementById('csvToJsonBtn').onclick = () => {
      const delimiter = document.getElementById('csvDelimiter').value === '\\t' ? '\t' : document.getElementById('csvDelimiter').value;
      const hasHeader = document.getElementById('csvHasHeader').checked;
      const json = csvToJson(input.value, delimiter, hasHeader);
      currentJsonOutput = JSON.stringify(json, null, 2);
      const outputEl = document.getElementById('csvOutput');
      if (outputEl) outputEl.value = currentJsonOutput;
    };

    const previewBtn = document.getElementById('csvPreviewBtn');
    let isPreviewMode = false;
    
    previewBtn.onclick = () => {
      const delimiter = document.getElementById('csvDelimiter').value === '\\t' ? '\t' : document.getElementById('csvDelimiter').value;
      const card = document.getElementById('csvOutputCard');
      
      if (isPreviewMode) {
        // 切换回 JSON 模式
        card.innerHTML = `
          <div class="tool-card-header">
            <div class="tool-card-title" id="csvOutputTitle"><i class="ri-file-text-line"></i>输出结果</div>
            <div class="tool-card-extra">
              <button class="tool-btn tool-btn-text tool-btn-sm" id="csvCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
            </div>
          </div>
          <textarea class="tool-textarea" id="csvOutput" readonly placeholder="转换 JSON 结果将显示在这里"></textarea>
        `;
        document.getElementById('csvOutput').value = currentJsonOutput;
        previewBtn.innerHTML = '<i class="ri-table-line"></i>表格';
        isPreviewMode = false;
        document.getElementById('csvCopyBtn').onclick = () => copyToClipboard(currentJsonOutput);
      } else {
        // 保存当前输出
        const outputEl = document.getElementById('csvOutput');
        if (outputEl) currentJsonOutput = outputEl.value;
        
        // 切换到预览模式
        const tableHtml = csvToTable(input.value, delimiter);
        card.innerHTML = `
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-table-line"></i>表格预览</div>
          </div>
          <div style="flex:1;overflow:auto;padding:12px;border:1px solid #d9d9d9;border-top:none;border-radius:0 0 8px 8px;background:#fff;">${tableHtml}</div>
        `;
        previewBtn.innerHTML = '<i class="ri-code-line"></i>JSON';
        isPreviewMode = true;
      }
    };

    document.getElementById('csvCopyBtn').onclick = () => copyToClipboard(currentJsonOutput || document.getElementById('csvOutput')?.value || '');
  }

  function csvToJson(csv, delimiter, hasHeader) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = hasHeader ? lines[0].split(delimiter).map(h => h.trim()) : null;
    const startIndex = hasHeader ? 1 : 0;
    const result = [];

    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      if (hasHeader) {
        const obj = {};
        headers.forEach((h, j) => obj[h] = values[j] || '');
        result.push(obj);
      } else {
        result.push(values);
      }
    }
    return result;
  }

  function csvToTable(csv, delimiter) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return '';
    
    let html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
    lines.forEach((line, i) => {
      const cells = line.split(delimiter);
      const tag = i === 0 ? 'th' : 'td';
      html += '<tr>';
      cells.forEach(cell => {
        html += `<${tag} style="border:1px solid var(--border-light);padding:8px;text-align:left">${cell.trim()}</${tag}>`;
      });
      html += '</tr>';
    });
    html += '</table>';
    return html;
  }

  // Unicode 编解码事件
  function initUnicodeEvents() {
    const input = document.getElementById('unicodeInput');
    const output = document.getElementById('unicodeOutput');

    document.getElementById('toUnicodeBtn').onclick = () => {
      output.value = Array.from(input.value).map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
    };

    document.getElementById('fromUnicodeBtn').onclick = () => {
      try {
        output.value = input.value.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      } catch (e) {
        output.value = '❌ 解码失败: ' + e.message;
      }
    };

    document.getElementById('toAsciiBtn').onclick = () => {
      output.value = Array.from(input.value).map(c => c.charCodeAt(0)).join(' ');
    };

    document.getElementById('toHexBtn').onclick = () => {
      output.value = Array.from(input.value).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    };

    document.getElementById('unicodeCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  // AES 加解密事件 (使用 Web Crypto API)
  function initAesEvents() {
    const input = document.getElementById('aesInput');
    const output = document.getElementById('aesOutput');
    const keyInput = document.getElementById('aesKey');
    
    // 从密码派生 AES 密钥
    async function deriveKey(password) {
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
      );
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('aes-salt-2024'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }

    document.getElementById('aesEncryptBtn').onclick = async () => {
      trackToolAction('aes', 'encrypt');
      const text = input.value;
      const password = keyInput.value;
      
      if (!text) { output.value = '请输入要加密的文本'; return; }
      if (!password) { output.value = '请输入密钥'; return; }
      
      try {
        const key = await deriveKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = new TextEncoder();
        const encrypted = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv }, key, enc.encode(text)
        );
        // 将 IV 和密文组合后转为 Base64
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);
        output.value = btoa(String.fromCharCode(...combined));
        showToast('加密成功');
      } catch (e) {
        output.value = '❌ 加密失败: ' + e.message;
      }
    };

    document.getElementById('aesDecryptBtn').onclick = async () => {
      trackToolAction('aes', 'decrypt');
      const text = input.value;
      const password = keyInput.value;
      
      if (!text) { output.value = '请输入要解密的 Base64 密文'; return; }
      if (!password) { output.value = '请输入密钥'; return; }
      
      try {
        const key = await deriveKey(password);
        const combined = Uint8Array.from(atob(text), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv }, key, encrypted
        );
        output.value = new TextDecoder().decode(decrypted);
        showToast('解密成功');
      } catch (e) {
        output.value = '❌ 解密失败，请检查密钥是否正确';
      }
    };

    document.getElementById('aesCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  // JWT 解析事件
  function initJwtEvents() {
    document.getElementById('jwtDecodeBtn').onclick = () => {
      const token = document.getElementById('jwtInput').value.trim();
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        document.getElementById('jwtHeader').textContent = '❌ 无效的 JWT 格式';
        document.getElementById('jwtPayload').textContent = '-';
        document.getElementById('jwtSignature').textContent = '-';
        return;
      }

      try {
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        document.getElementById('jwtHeader').textContent = JSON.stringify(header, null, 2);
        
        // 解析时间戳
        let payloadStr = JSON.stringify(payload, null, 2);
        if (payload.iat) payloadStr += '\n\n// iat: ' + new Date(payload.iat * 1000).toLocaleString();
        if (payload.exp) payloadStr += '\n// exp: ' + new Date(payload.exp * 1000).toLocaleString();
        document.getElementById('jwtPayload').textContent = payloadStr;
        
        document.getElementById('jwtSignature').textContent = parts[2];
      } catch (e) {
        document.getElementById('jwtHeader').textContent = '❌ 解析失败: ' + e.message;
      }
    };
  }

  // HTML 工具事件
  function initHtmlEvents() {
    const input = document.getElementById('htmlInput');
    const output = document.getElementById('htmlOutput');

    document.getElementById('htmlFormatBtn').onclick = () => {
      output.value = formatHtml(input.value);
    };

    document.getElementById('htmlCompressBtn').onclick = () => {
      output.value = input.value.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
    };

    document.getElementById('htmlEscapeBtn').onclick = () => {
      output.value = input.value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    document.getElementById('htmlUnescapeBtn').onclick = () => {
      output.value = input.value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };

    document.getElementById('htmlCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  function formatHtml(html) {
    let formatted = '';
    let indent = 0;
    const tab = '  ';
    
    html.replace(/>\s*</g, '><').split(/(<[^>]+>)/g).forEach(node => {
      if (!node.trim()) return;
      
      if (node.match(/^<\/\w/)) indent--;
      formatted += tab.repeat(Math.max(0, indent)) + node.trim() + '\n';
      if (node.match(/^<\w[^>]*[^\/]>$/)) indent++;
    });
    
    return formatted.trim();
  }

  // CSS 工具事件
  function initCssEvents() {
    const input = document.getElementById('cssInput');
    const output = document.getElementById('cssOutput');

    document.getElementById('cssFormatBtn').onclick = () => {
      output.value = formatCss(input.value);
    };

    document.getElementById('cssCompressBtn').onclick = () => {
      output.value = input.value
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*;\s*/g, ';')
        .replace(/\s*:\s*/g, ':')
        .trim();
    };

    document.getElementById('cssCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  function formatCss(css) {
    return css
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/\s*}\s*/g, '\n}\n')
      .replace(/\s*;\s*/g, ';\n  ')
      .replace(/;\n  \n}/g, ';\n}')
      .trim();
  }

  // 渐变生成器事件
  function initGradientEvents() {
    const preview = document.getElementById('gradientPreview');
    const output = document.getElementById('gradientOutput');
    const direction = document.getElementById('gradientDirection');
    const color1 = document.getElementById('gradientColor1');
    const color1Text = document.getElementById('gradientColor1Text');
    const color2 = document.getElementById('gradientColor2');
    const color2Text = document.getElementById('gradientColor2Text');

    function updateGradient() {
      const gradient = `linear-gradient(${direction.value}, ${color1.value} 0%, ${color2.value} 100%)`;
      preview.style.background = gradient;
      output.value = `background: ${gradient};`;
    }

    direction.onchange = updateGradient;
    color1.oninput = () => { color1Text.value = color1.value; updateGradient(); };
    color2.oninput = () => { color2Text.value = color2.value; updateGradient(); };
    color1Text.onchange = () => { color1.value = color1Text.value; updateGradient(); };
    color2Text.onchange = () => { color2.value = color2Text.value; updateGradient(); };

    document.getElementById('gradientCopyBtn').onclick = () => copyToClipboard(output.value);
  }

  // IP 工具事件
  function initIpEvents() {
    document.getElementById('ipConvertBtn').onclick = () => {
      const ip = document.getElementById('ipInput').value.trim();
      const parts = ip.split('.').map(Number);
      
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        document.getElementById('ipDecimal').value = '无效的 IP 地址';
        return;
      }

      const decimal = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
      document.getElementById('ipDecimal').value = decimal >>> 0;
      document.getElementById('ipBinary').value = parts.map(p => p.toString(2).padStart(8, '0')).join('.');
      document.getElementById('ipHex').value = parts.map(p => p.toString(16).padStart(2, '0')).join('.').toUpperCase();
    };

    document.getElementById('subnetCalcBtn').onclick = () => {
      const ip = document.getElementById('subnetIp').value.trim();
      const mask = parseInt(document.getElementById('subnetMask').value);
      
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        document.getElementById('subnetResult').textContent = '无效的 IP 地址';
        return;
      }

      const ipNum = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
      const maskNum = ~((1 << (32 - mask)) - 1);
      const networkNum = ipNum & maskNum;
      const broadcastNum = networkNum | ~maskNum;
      const hostCount = Math.pow(2, 32 - mask) - 2;

      const numToIp = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');

      document.getElementById('subnetResult').innerHTML = `
网络地址: <strong>${numToIp(networkNum >>> 0)}</strong>
广播地址: <strong>${numToIp(broadcastNum >>> 0)}</strong>
子网掩码: <strong>${numToIp(maskNum >>> 0)}</strong>
可用主机数: <strong>${hostCount > 0 ? hostCount : 0}</strong>
主机范围: <strong>${numToIp((networkNum + 1) >>> 0)}</strong> - <strong>${numToIp((broadcastNum - 1) >>> 0)}</strong>
      `.trim();
    };
  }

  // 文本对比事件
  function initDiffEvents() {
    const input1 = document.getElementById('diffInput1');
    const input2 = document.getElementById('diffInput2');
    const output1 = document.getElementById('diffOutput1');
    const output2 = document.getElementById('diffOutput2');

    document.getElementById('diffCompareBtn').onclick = () => {
      trackToolAction('diff', 'compare');
      const text1 = input1.value;
      const text2 = input2.value;
      
      const lines1 = text1.split('\n');
      const lines2 = text2.split('\n');
      const maxLines = Math.max(lines1.length, lines2.length);
      
      let html1 = '';
      let html2 = '';
      
      for (let i = 0; i < maxLines; i++) {
        const l1 = lines1[i] !== undefined ? lines1[i] : null;
        const l2 = lines2[i] !== undefined ? lines2[i] : null;
        
        if (l1 === l2) {
          // 相同行
          html1 += `<div>${escapeHtml(l1) || '&nbsp;'}</div>`;
          html2 += `<div>${escapeHtml(l2) || '&nbsp;'}</div>`;
        } else if (l1 !== null && l2 !== null) {
          // 修改的行
          html1 += `<div style="background:#fef08a;margin:0 -12px;padding:0 12px">${escapeHtml(l1) || '&nbsp;'}</div>`;
          html2 += `<div style="background:#fef08a;margin:0 -12px;padding:0 12px">${escapeHtml(l2) || '&nbsp;'}</div>`;
        } else if (l1 !== null && l2 === null) {
          // 删除的行
          html1 += `<div style="background:#fecaca;margin:0 -12px;padding:0 12px">${escapeHtml(l1)}</div>`;
        } else if (l1 === null && l2 !== null) {
          // 新增的行
          html2 += `<div style="background:#bbf7d0;margin:0 -12px;padding:0 12px">${escapeHtml(l2)}</div>`;
        }
      }
      
      output1.innerHTML = html1;
      output2.innerHTML = html2;
      
      // 隐藏输入框，显示输出
      input1.style.display = 'none';
      input2.style.display = 'none';
      output1.style.display = 'block';
      output2.style.display = 'block';
    };

    document.getElementById('diffSwapBtn').onclick = () => {
      const temp = input1.value;
      input1.value = input2.value;
      input2.value = temp;
      // 如果已经显示结果，重新对比
      if (output1.style.display === 'block') {
        document.getElementById('diffCompareBtn').click();
      }
    };

    document.getElementById('diffClearBtn').onclick = () => {
      input1.value = '';
      input2.value = '';
      output1.innerHTML = '';
      output2.innerHTML = '';
      // 显示输入框，隐藏输出
      input1.style.display = 'block';
      input2.style.display = 'block';
      output1.style.display = 'none';
      output2.style.display = 'none';
    };

    // 点击输出区域时切换回编辑模式
    output1.onclick = () => {
      input1.style.display = 'block';
      output1.style.display = 'none';
      input1.focus();
    };
    output2.onclick = () => {
      input2.style.display = 'block';
      output2.style.display = 'none';
      input2.focus();
    };
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 二维码事件
  function initQrcodeEvents() {
    document.getElementById('qrcodeGenerateBtn').onclick = () => {
      trackToolAction('qrcode', 'generate');
      const text = document.getElementById('qrcodeInput').value;
      const size = document.getElementById('qrcodeSize').value;
      const output = document.getElementById('qrcodeOutput');
      
      if (!text) {
        output.innerHTML = '<span style="color:var(--text-muted)">请输入内容</span>';
        return;
      }

      // 使用公共 API 生成二维码
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
      output.innerHTML = `<img src="${url}" alt="QR Code" id="qrcodeImage" style="max-width:100%">`;
    };

    document.getElementById('qrcodeDownloadBtn').onclick = () => {
      const img = document.getElementById('qrcodeImage');
      if (!img) return;
      
      const a = document.createElement('a');
      a.href = img.src;
      a.download = 'qrcode.png';
      a.click();
    };
  }

  // Markdown 事件
  function initMarkdownEvents() {
    const input = document.getElementById('markdownInput');
    const output = document.getElementById('markdownOutput');

    function renderMarkdown() {
      output.innerHTML = parseMarkdown(input.value);
    }

    input.oninput = renderMarkdown;
    renderMarkdown();

    document.getElementById('markdownCopyHtmlBtn').onclick = () => copyToClipboard(output.innerHTML);
  }

  function parseMarkdown(md) {
    return md
      // 代码块
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre style="background:var(--bg-tertiary);padding:12px;border-radius:6px;overflow-x:auto"><code>$2</code></pre>')
      // 行内代码
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg-tertiary);padding:2px 6px;border-radius:4px">$1</code>')
      // 标题
      .replace(/^### (.+)$/gm, '<h3 style="margin:16px 0 8px">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="margin:20px 0 12px">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="margin:24px 0 16px">$1</h1>')
      // 粗体斜体
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      // 链接和图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // 列表
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul style="margin:8px 0;padding-left:24px">$&</ul>')
      // 引用
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent);padding-left:12px;margin:8px 0;color:var(--text-secondary)">$1</blockquote>')
      // 分割线
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border-light);margin:16px 0">')
      // 换行
      .replace(/\n\n/g, '</p><p style="margin:8px 0">')
      .replace(/\n/g, '<br>');
  }

  // 占位图事件
  function initPlaceholderEvents() {
    const canvas = document.getElementById('placeholderCanvas');
    const ctx = canvas.getContext('2d');

    function generatePlaceholder() {
      trackToolAction('placeholder', 'generate');
      const width = parseInt(document.getElementById('placeholderWidth').value) || 400;
      const height = parseInt(document.getElementById('placeholderHeight').value) || 300;
      const bgColor = document.getElementById('placeholderBgColor').value;
      const textColor = document.getElementById('placeholderTextColor').value;
      const text = document.getElementById('placeholderText').value || `${width} x ${height}`;

      canvas.width = width;
      canvas.height = height;
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 支持多行文字
      const lines = text.split('\n');
      const fontSize = Math.min(width, height) / Math.max(8, lines.length * 2);
      ctx.font = `${fontSize}px sans-serif`;
      const lineHeight = fontSize * 1.4;
      const totalHeight = lines.length * lineHeight;
      const startY = (height - totalHeight) / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + index * lineHeight);
      });
    }

    document.getElementById('placeholderGenerateBtn').onclick = generatePlaceholder;
    
    document.getElementById('placeholderDownloadBtn').onclick = () => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'placeholder.png';
      a.click();
    };

    generatePlaceholder();
  }

  // .gitignore 事件
  function initGitignoreEvents() {
    const output = document.getElementById('gitignoreOutput');
    const templates = {
      'Node.js': 'node_modules/\nnpm-debug.log\nyarn-error.log\n.env\n.env.local\ndist/\nbuild/',
      'Python': '__pycache__/\n*.py[cod]\n*$py.class\n.env\nvenv/\n*.egg-info/\ndist/\nbuild/',
      'Java': '*.class\n*.jar\n*.war\ntarget/\n.idea/\n*.iml\n.gradle/',
      'Go': '*.exe\n*.test\n*.out\nvendor/\nbin/',
      'Rust': 'target/\nCargo.lock\n**/*.rs.bk',
      'React': 'node_modules/\nbuild/\n.env\n.env.local\nnpm-debug.log\nyarn-error.log\n.DS_Store',
      'Vue': 'node_modules/\ndist/\n.env\n.env.local\nnpm-debug.log\nyarn-error.log\n.DS_Store',
      'macOS': '.DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes',
      'Windows': 'Thumbs.db\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/',
      'IDE': '.idea/\n.vscode/\n*.swp\n*.swo\n*~\n.project\n.settings/'
    };

    document.querySelectorAll('.gitignore-preset').forEach(btn => {
      btn.onclick = () => {
        const template = templates[btn.dataset.template];
        if (template) {
          const current = output.value;
          output.value = current ? current + '\n\n# ' + btn.dataset.template + '\n' + template : '# ' + btn.dataset.template + '\n' + template;
        }
      };
    });

    document.getElementById('gitignoreCopyBtn').onclick = () => copyToClipboard(output.value);
    document.getElementById('gitignoreClearBtn').onclick = () => { output.value = ''; };
  }

  // Nginx 配置事件
  function initNginxEvents() {
    const proxyCheckbox = document.getElementById('nginxProxy');
    const proxyRow = document.getElementById('nginxProxyRow');

    proxyCheckbox.onchange = () => {
      proxyRow.style.display = proxyCheckbox.checked ? 'flex' : 'none';
    };

    document.getElementById('nginxGenerateBtn').onclick = () => {
      trackToolAction('nginx', 'generate');
      const domain = document.getElementById('nginxDomain').value || 'example.com';
      const port = document.getElementById('nginxPort').value || '80';
      const root = document.getElementById('nginxRoot').value || '/var/www/html';
      const https = document.getElementById('nginxHttps').checked;
      const proxy = document.getElementById('nginxProxy').checked;
      const gzip = document.getElementById('nginxGzip').checked;
      const proxyPass = document.getElementById('nginxProxyPass').value || 'http://127.0.0.1:3000';

      let config = `server {
    listen ${port};
    server_name ${domain};
`;

      if (https) {
        config += `
    # SSL 配置
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/${domain}.crt;
    ssl_certificate_key /etc/nginx/ssl/${domain}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
`;
      }

      if (gzip) {
        config += `
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
`;
      }

      if (proxy) {
        config += `
    location / {
        proxy_pass ${proxyPass};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
`;
      } else {
        config += `
    root ${root};
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
`;
      }

      config += '}\n';

      document.getElementById('nginxOutput').value = config;
    };

    document.getElementById('nginxCopyBtn').onclick = () => {
      copyToClipboard(document.getElementById('nginxOutput').value);
    };
  }

  // Curl 命令事件
  function initCurlEvents() {
    document.getElementById('curlGenerateBtn').onclick = () => {
      trackToolAction('curl', 'generate');
      const url = document.getElementById('curlUrl').value;
      const method = document.getElementById('curlMethod').value;
      const headers = document.getElementById('curlHeaders').value;
      const body = document.getElementById('curlBody').value;

      if (!url) {
        document.getElementById('curlOutput').value = '请输入 URL';
        return;
      }

      let curl = `curl -X ${method}`;
      
      if (headers) {
        headers.split('\n').filter(Boolean).forEach(h => {
          curl += ` \\\n  -H '${h.trim()}'`;
        });
      }
      
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        curl += ` \\\n  -d '${body.replace(/'/g, "\\'")}'`;
      }
      
      curl += ` \\\n  '${url}'`;

      document.getElementById('curlOutput').value = curl;
    };

    document.getElementById('curlCopyBtn').onclick = () => {
      copyToClipboard(document.getElementById('curlOutput').value);
    };
  }

  // 监听路由切换
  window.addEventListener('toolContentLoaded', function(e) {
    if (e.detail === 'dev-tools') {
      init();
    }
  });

})();

