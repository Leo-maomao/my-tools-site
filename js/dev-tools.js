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

  // 初始化
  function init() {
    cacheElements();
    if (!els.nav || !els.body) {
      return;
    }
    bindEvents();
    loadTool(currentTool);
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
        <div class="tool-row">
          <!-- 输入区 -->
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-edit-line"></i>输入 JSON</div>
                <div class="tool-card-extra">
                  <button class="tool-btn tool-btn-text tool-btn-sm" id="jsonClearBtn"><i class="ri-delete-bin-line"></i>清空</button>
                </div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="jsonInput" placeholder='输入或粘贴 JSON 内容，例如：
{
  "name": "test",
  "value": 123,
  "items": ["a", "b", "c"]
}'></textarea>
              </div>
            </div>
          </div>
          
          <!-- 输出区 -->
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-file-text-line"></i>输出结果</div>
                <div class="tool-card-extra">
                  <button class="tool-btn tool-btn-text tool-btn-sm" id="jsonCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
                </div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="jsonOutput" readonly placeholder="处理结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 操作区 -->
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-options" style="margin-bottom: 16px;">
              <div class="tool-option">
                <span class="tool-label-inline">缩进格式</span>
                <select id="jsonIndent" class="tool-select">
                  <option value="2">2 空格</option>
                  <option value="4">4 空格</option>
                  <option value="tab">Tab</option>
                </select>
              </div>
            </div>
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="jsonFormatBtn"><i class="ri-code-line"></i>格式化</button>
              <button class="tool-btn tool-btn-default" id="jsonCompressBtn"><i class="ri-compress-line"></i>压缩</button>
              <button class="tool-btn tool-btn-default" id="jsonValidateBtn"><i class="ri-checkbox-circle-line"></i>校验</button>
            </div>
          </div>
        </div>
      `;
    },

    // Base64 编解码
    base64: function() {
      return `
        <div class="tool-row">
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-edit-line"></i>原始文本</div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="base64Input" placeholder="输入要编码或解码的文本"></textarea>
              </div>
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
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="base64Output" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-btn-group tool-btn-group-center">
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
        <div class="tool-row">
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-edit-line"></i>输入内容</div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="urlInput" placeholder="输入 URL 或需要编码/解码的文本"></textarea>
              </div>
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
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="urlOutput" readonly placeholder="结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="urlEncodeBtn"><i class="ri-arrow-right-line"></i>URL 编码</button>
              <button class="tool-btn tool-btn-primary" id="urlDecodeBtn"><i class="ri-arrow-left-line"></i>URL 解码</button>
              <button class="tool-btn tool-btn-default" id="urlParseBtn"><i class="ri-links-line"></i>解析 URL</button>
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
        <!-- 当前时间戳卡片 -->
        <div class="tool-card" style="margin-bottom:16px">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-time-line"></i>当前时间戳</div>
            <div class="tool-card-extra">
              <button class="tool-btn tool-btn-text tool-btn-sm" id="refreshTsBtn"><i class="ri-refresh-line"></i>刷新</button>
            </div>
          </div>
          <div class="tool-card-body">
            <div class="tool-row">
              <div class="tool-col">
                <div class="tool-statistic">
                  <div class="tool-statistic-title">秒级 (Unix)</div>
                  <div class="tool-statistic-value" id="currentTs">${nowSec}</div>
                </div>
              </div>
              <div class="tool-col">
                <div class="tool-statistic">
                  <div class="tool-statistic-title">毫秒级 (JavaScript)</div>
                  <div class="tool-statistic-value" id="currentTsMs">${now}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="tool-row">
          <!-- 时间戳转时间 -->
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-arrow-right-line"></i>时间戳 → 时间</div>
              </div>
              <div class="tool-card-body">
                <div class="tool-form-item">
                  <label class="tool-label">输入时间戳</label>
                  <div style="display:flex;gap:8px;">
                    <input type="text" class="tool-input" id="tsInput" placeholder="支持秒级或毫秒级时间戳" style="flex:1">
                    <button class="tool-btn tool-btn-primary" id="ts2dateBtn">转换</button>
                  </div>
                </div>
                <div class="tool-divider"></div>
                <div class="tool-form-item">
                  <label class="tool-label">转换结果</label>
                  <div class="tool-result" id="ts2dateResult">输入时间戳后点击转换</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 时间转时间戳 -->
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-arrow-left-line"></i>时间 → 时间戳</div>
              </div>
              <div class="tool-card-body">
                <div class="tool-form-item">
                  <label class="tool-label">选择日期时间</label>
                  <div style="display:flex;gap:8px;">
                    <input type="datetime-local" class="tool-input" id="dateInput" style="flex:1">
                    <button class="tool-btn tool-btn-primary" id="date2tsBtn">转换</button>
                  </div>
                </div>
                <div class="tool-divider"></div>
                <div class="tool-form-item">
                  <label class="tool-label">转换结果</label>
                  <div class="tool-result" id="date2tsResult">选择时间后点击转换</div>
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
        <!-- 正则表达式输入卡片 -->
        <div class="tool-card" style="margin-bottom:16px">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-code-s-slash-line"></i>正则表达式</div>
            <div class="tool-card-extra">
              <select class="tool-select" id="regexPreset" style="min-width:120px">
                <option value="">常用正则预设</option>
                <option value="^1[3-9]\\d{9}$">手机号</option>
                <option value="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$">邮箱</option>
                <option value="^\\d{15}|\\d{18}$">身份证</option>
                <option value="^https?://[^\\s]+$">URL</option>
                <option value="^\\d{4}-\\d{2}-\\d{2}$">日期(YYYY-MM-DD)</option>
                <option value="^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$">HEX颜色</option>
              </select>
            </div>
          </div>
          <div class="tool-card-body">
            <div style="display:flex;gap:8px;align-items:center;background:#fafafa;padding:12px;border-radius:6px;border:1px solid #f0f0f0;">
              <span style="color:rgba(0,0,0,0.45);font-family:monospace;font-size:16px">/</span>
              <input type="text" class="tool-input" id="regexPattern" placeholder="输入正则表达式，如: \\d+" style="flex:1;border:none;background:transparent;box-shadow:none;">
              <span style="color:rgba(0,0,0,0.45);font-family:monospace;font-size:16px">/</span>
              <input type="text" class="tool-input" id="regexFlags" value="g" style="width:60px;border:none;background:transparent;box-shadow:none;text-align:center;" placeholder="flags">
            </div>
          </div>
        </div>
        
        <div class="tool-row">
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-edit-line"></i>测试文本</div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="regexInput" placeholder="输入要测试的文本，匹配结果将实时高亮显示"></textarea>
              </div>
            </div>
          </div>
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-checkbox-circle-line"></i>匹配结果</div>
              </div>
              <div class="tool-card-body">
                <div class="tool-result" id="regexOutput" style="min-height:160px;white-space:pre-wrap">输入正则和文本后点击测试</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="regexTestBtn"><i class="ri-search-line"></i>测试匹配
          </button>
          <button class="tool-btn tool-btn-secondary" id="regexReplaceBtn">
            <i class="ri-exchange-line"></i>替换
          </button>
        </div>
      `;
    },

    // UUID 生成
    uuid: function() {
      return `
        <div class="tool-card" style="margin-bottom:16px">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-settings-3-line"></i>生成配置</div>
          </div>
          <div class="tool-card-body">
            <div class="tool-options">
              <div class="tool-option">
                <span class="tool-label-inline">生成数量</span>
                <select class="tool-select" id="uuidCount">
                  <option value="1">1 个</option>
                  <option value="5">5 个</option>
                  <option value="10" selected>10 个</option>
                  <option value="20">20 个</option>
                  <option value="50">50 个</option>
                </select>
              </div>
              <div class="tool-option">
                <span class="tool-label-inline">输出格式</span>
                <select class="tool-select" id="uuidFormat">
                  <option value="default">标准格式 (小写带横线)</option>
                  <option value="upper">大写格式</option>
                  <option value="nodash">无横线格式</option>
                </select>
              </div>
            </div>
            <div class="tool-divider"></div>
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="uuidGenerateBtn"><i class="ri-refresh-line"></i>生成 UUID</button>
              <button class="tool-btn tool-btn-default" id="uuidCopyBtn"><i class="ri-file-copy-line"></i>复制全部</button>
            </div>
          </div>
        </div>
        
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-list-check-2"></i>生成结果</div>
          </div>
          <div class="tool-card-body">
            <div class="tool-result" id="uuidOutput" style="min-height:200px;font-family:monospace">点击上方"生成 UUID"按钮开始生成</div>
          </div>
        </div>
      `;
    },

    // Cron 表达式
    cron: function() {
      return `
        <div class="tool-card" style="margin-bottom:16px">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-calendar-schedule-line"></i>Cron 表达式</div>
            <div class="tool-card-extra">
              <select class="tool-select" id="cronPreset" style="min-width:130px">
                <option value="">常用表达式预设</option>
                <option value="* * * * *">每分钟</option>
                <option value="0 * * * *">每小时整点</option>
                <option value="0 0 * * *">每天 0 点</option>
                <option value="0 0 * * 1">每周一 0 点</option>
                <option value="0 0 1 * *">每月 1 号 0 点</option>
                <option value="0 9 * * 1-5">工作日 9 点</option>
                <option value="*/5 * * * *">每 5 分钟</option>
                <option value="0 */2 * * *">每 2 小时</option>
              </select>
            </div>
          </div>
          <div class="tool-card-body">
            <input type="text" class="tool-input tool-input-lg" id="cronInput" value="0 0 * * *" style="width:100%;font-family:monospace;font-size:18px;text-align:center;letter-spacing:4px">
          </div>
        </div>
        
        <div class="tool-alert tool-alert-info" style="margin-bottom:16px">
          <i class="ri-information-line"></i>
          <div class="tool-alert-content">
            <div class="tool-alert-title">Cron 格式说明</div>
            <div class="tool-alert-desc" style="font-family:monospace;line-height:1.8">
              ┌──────── 分钟 (0-59)<br>
              │ ┌────── 小时 (0-23)<br>
              │ │ ┌──── 日期 (1-31)<br>
              │ │ │ ┌── 月份 (1-12)<br>
              │ │ │ │ ┌ 星期 (0-6, 0=周日)<br>
              * * * * *
            </div>
          </div>
        </div>
        
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-btn-group tool-btn-group-center" style="margin-bottom:16px">
              <button class="tool-btn tool-btn-primary" id="cronParseBtn"><i class="ri-search-line"></i>解析表达式</button>
            </div>
            <div class="tool-result" id="cronOutput" style="min-height:120px">输入或选择 Cron 表达式后点击解析</div>
          </div>
        </div>
      `;
    },

    // 哈希计算
    hash: function() {
      return `
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-edit-line"></i>输入文本</div>
            <div class="tool-card-extra">
              <button class="tool-btn tool-btn-primary tool-btn-sm" id="hashCalcBtn"><i class="ri-hashtag"></i>计算哈希值</button>
            </div>
          </div>
          <div class="tool-card-body">
            <textarea class="tool-textarea" id="hashInput" placeholder="输入要计算哈希值的文本内容" style="min-height:100px"></textarea>
          </div>
        </div>
        
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-key-2-line"></i>计算结果</div>
          </div>
          <div class="tool-card-body" style="display:grid;gap:12px">
            <div class="tool-form-item">
              <label class="tool-label">MD5 (32位)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="text" class="tool-input" id="hashMd5" readonly style="flex:1;font-family:monospace;font-size:13px" placeholder="等待计算...">
                <button class="tool-btn tool-btn-default tool-btn-icon hash-copy-btn" data-target="hashMd5" title="复制"><i class="ri-file-copy-line"></i></button>
              </div>
            </div>
            <div class="tool-form-item">
              <label class="tool-label">SHA-1 (40位)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="text" class="tool-input" id="hashSha1" readonly style="flex:1;font-family:monospace;font-size:13px" placeholder="等待计算...">
                <button class="tool-btn tool-btn-default tool-btn-icon hash-copy-btn" data-target="hashSha1" title="复制"><i class="ri-file-copy-line"></i></button>
              </div>
            </div>
            <div class="tool-form-item">
              <label class="tool-label">SHA-256 (64位)</label>
              <div style="display:flex;gap:8px;align-items:center">
                <textarea class="tool-input" id="hashSha256" readonly style="flex:1;font-family:monospace;font-size:12px;height:36px;resize:none;line-height:24px;padding-top:5px" placeholder="等待计算..."></textarea>
                <button class="tool-btn tool-btn-default tool-btn-icon hash-copy-btn" data-target="hashSha256" title="复制"><i class="ri-file-copy-line"></i></button>
              </div>
            </div>
            <div class="tool-form-item">
              <label class="tool-label">SHA-512 (128位)</label>
              <div style="display:flex;gap:8px;align-items:flex-start">
                <textarea class="tool-input" id="hashSha512" readonly style="flex:1;font-family:monospace;font-size:11px;height:52px;resize:none;line-height:18px;padding-top:5px;word-break:break-all" placeholder="等待计算..."></textarea>
                <button class="tool-btn tool-btn-default tool-btn-icon hash-copy-btn" data-target="hashSha512" title="复制" style="margin-top:2px"><i class="ri-file-copy-line"></i></button>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    // 进制转换
    radix: function() {
      return `
        <div class="tool-alert tool-alert-info" style="margin-bottom:16px">
          <i class="ri-information-line"></i>
          <div class="tool-alert-content">
            <div class="tool-alert-desc">在任意输入框输入数值，其他进制会自动实时转换</div>
          </div>
        </div>
        
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-exchange-line"></i>进制互转</div>
          </div>
          <div class="tool-card-body" style="display:grid;gap:16px">
            <div class="tool-form-item">
              <label class="tool-label">十进制 (Decimal)</label>
              <input type="text" class="tool-input" id="radix10" data-radix="10" style="font-family:monospace;font-size:16px" placeholder="输入十进制数字">
            </div>
            <div class="tool-form-item">
              <label class="tool-label">二进制 (Binary)</label>
              <input type="text" class="tool-input" id="radix2" data-radix="2" style="font-family:monospace;font-size:16px" placeholder="输入二进制数字">
            </div>
            <div class="tool-form-item">
              <label class="tool-label">八进制 (Octal)</label>
              <input type="text" class="tool-input" id="radix8" data-radix="8" style="font-family:monospace;font-size:16px" placeholder="输入八进制数字">
            </div>
            <div class="tool-form-item">
              <label class="tool-label">十六进制 (Hexadecimal)</label>
              <input type="text" class="tool-input" id="radix16" data-radix="16" style="font-family:monospace;font-size:16px" placeholder="输入十六进制数字">
            </div>
          </div>
        </div>
      `;
    },

    // 颜色转换
    color: function() {
      return `
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-palette-line"></i>颜色选择</div>
          </div>
          <div class="tool-card-body">
            <div style="display:flex;gap:24px;align-items:center;margin-bottom:24px">
              <div class="tool-color-preview" style="width:100px;height:100px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                <input type="color" id="colorPicker" value="#1677ff" style="width:100%;height:100%;border:none;cursor:pointer;border-radius:12px">
              </div>
              <div style="flex:1">
                <div style="font-size:32px;font-weight:600;color:rgba(0,0,0,0.88);font-family:monospace" id="colorPreview">#1677FF</div>
                <div style="font-size:14px;color:rgba(0,0,0,0.45);margin-top:4px">点击左侧色块或输入颜色值</div>
              </div>
            </div>
            
            <div class="tool-divider"></div>
            
            <div style="display:grid;gap:16px;margin-top:16px">
              <div class="tool-form-item">
                <label class="tool-label">HEX</label>
                <div style="display:flex;gap:8px">
                  <input type="text" class="tool-input" id="colorHex" data-type="hex" value="#1677FF" style="flex:1;font-family:monospace;font-size:16px">
                  <button class="tool-btn tool-btn-default tool-btn-icon color-copy-btn" data-target="colorHex"><i class="ri-file-copy-line"></i></button>
                </div>
              </div>
              <div class="tool-form-item">
                <label class="tool-label">RGB</label>
                <div style="display:flex;gap:8px">
                  <input type="text" class="tool-input" id="colorRgb" data-type="rgb" value="rgb(22, 119, 255)" style="flex:1;font-family:monospace;font-size:16px">
                  <button class="tool-btn tool-btn-default tool-btn-icon color-copy-btn" data-target="colorRgb"><i class="ri-file-copy-line"></i></button>
                </div>
              </div>
              <div class="tool-form-item">
                <label class="tool-label">HSL</label>
                <div style="display:flex;gap:8px">
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
        <div class="tool-row">
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-edit-line"></i>输入文本</div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="textInput" placeholder="输入要处理的文本，每行一个或用分隔符分隔"></textarea>
              </div>
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
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="textOutput" readonly placeholder="处理结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-options" style="margin-bottom:16px">
              <div class="tool-option">
                <span class="tool-label-inline">分隔符</span>
                <select class="tool-select" id="textSeparator">
                  <option value="\\n">换行符</option>
                  <option value=",">逗号</option>
                  <option value=";">分号</option>
                  <option value="\\t">Tab</option>
                </select>
              </div>
            </div>
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="textDedupeBtn"><i class="ri-filter-line"></i>去重</button>
              <button class="tool-btn tool-btn-default" id="textSortBtn"><i class="ri-sort-asc"></i>排序</button>
              <button class="tool-btn tool-btn-default" id="textStatsBtn"><i class="ri-bar-chart-line"></i>统计</button>
            </div>
          </div>
        </div>
      `;
    },

    // 随机生成
    random: function() {
      return `
        <!-- 随机字符串 -->
        <div class="tool-card" style="margin-bottom:16px">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-text"></i>随机字符串</div>
          </div>
          <div class="tool-card-body">
            <div class="tool-options" style="margin-bottom:16px">
              <div class="tool-option">
                <span class="tool-label-inline">长度</span>
                <input type="number" class="tool-input" id="randomLength" value="16" min="1" max="100" style="width:80px">
              </div>
              <div class="tool-option">
                <input type="checkbox" id="randomUppercase" checked>
                <label for="randomUppercase">大写字母</label>
              </div>
              <div class="tool-option">
                <input type="checkbox" id="randomLowercase" checked>
                <label for="randomLowercase">小写字母</label>
              </div>
              <div class="tool-option">
                <input type="checkbox" id="randomNumbers" checked>
                <label for="randomNumbers">数字</label>
              </div>
              <div class="tool-option">
                <input type="checkbox" id="randomSymbols">
                <label for="randomSymbols">特殊字符</label>
              </div>
            </div>
            <div class="tool-divider"></div>
            <div style="display:flex;gap:8px;margin-top:16px">
              <input type="text" class="tool-input tool-input-lg" id="randomOutput" readonly style="flex:1;font-family:monospace" placeholder="点击生成按钮">
              <button class="tool-btn tool-btn-primary tool-btn-lg" id="randomGenerateBtn">生成</button>
              <button class="tool-btn tool-btn-default tool-btn-icon tool-btn-lg" id="randomCopyBtn"><i class="ri-file-copy-line"></i></button>
            </div>
          </div>
        </div>
        
        <!-- 随机数字 -->
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-hashtag"></i>随机数字</div>
          </div>
          <div class="tool-card-body">
            <div class="tool-options" style="margin-bottom:16px">
              <div class="tool-option">
                <span class="tool-label-inline">最小值</span>
                <input type="number" class="tool-input" id="randomMin" value="1" style="width:100px">
              </div>
              <div class="tool-option">
                <span class="tool-label-inline">最大值</span>
                <input type="number" class="tool-input" id="randomMax" value="100" style="width:100px">
              </div>
            </div>
            <div class="tool-divider"></div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:16px">
              <div class="tool-statistic" style="flex:1;padding:0">
                <div class="tool-statistic-value" id="randomNumOutput" style="font-size:36px">-</div>
              </div>
              <button class="tool-btn tool-btn-primary tool-btn-lg" id="randomNumGenerateBtn">生成随机数</button>
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
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-information-line"></i>HTTP 状态码速查</div>
          </div>
          <div class="tool-card-body" style="display:grid;gap:8px">
            ${codes.map(c => `
              <div style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:#fafafa;border-radius:8px;border-left:4px solid ${typeColors[c.type]}">
                <span style="font-family:monospace;font-size:18px;font-weight:600;color:${typeColors[c.type]};width:50px">${c.code}</span>
                <span style="color:rgba(0,0,0,0.88);flex:1">${c.desc}</span>
              </div>
            `).join('')}
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
        <div class="tool-card">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-plug-line"></i>常用端口速查</div>
            <div class="tool-card-extra">
              <input type="text" class="tool-input" id="portSearch" placeholder="搜索端口或服务..." style="width:200px">
            </div>
          </div>
          <div class="tool-card-body" id="portList" style="display:grid;gap:8px">
            ${ports.map(p => `
              <div class="port-item" data-search="${p.port} ${p.service} ${p.desc}".toLowerCase() style="display:flex;align-items:center;gap:16px;padding:12px 16px;background:#fafafa;border-radius:8px;transition:background 0.2s">
                <span style="font-family:monospace;font-size:16px;font-weight:600;color:#1677ff;width:90px">${p.port}</span>
                <span style="font-weight:500;color:rgba(0,0,0,0.88);width:130px">${p.service}</span>
                <span style="color:rgba(0,0,0,0.65);flex:1">${p.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    // XML 工具
    xml: function() {
      return `
        <div class="tool-row">
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-code-line"></i>输入 XML</div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="xmlInput" placeholder='<root>
  <item>Hello</item>
</root>'></textarea>
              </div>
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
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="xmlOutput" readonly placeholder="处理结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="xmlFormatBtn"><i class="ri-code-line"></i>格式化</button>
              <button class="tool-btn tool-btn-default" id="xmlCompressBtn"><i class="ri-compress-line"></i>压缩</button>
              <button class="tool-btn tool-btn-default" id="xmlToJsonBtn"><i class="ri-exchange-line"></i>转 JSON</button>
          <button class="tool-btn tool-btn-secondary" id="xmlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
      `;
    },

    // YAML 工具
    yaml: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入 YAML</div>
            <textarea class="tool-textarea" id="yamlInput" placeholder="name: test\nvalue: 123"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">输出结果</div>
            <textarea class="tool-textarea" id="yamlOutput" readonly placeholder="结果将显示在这里"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="yamlToJsonBtn"><i class="ri-exchange-line"></i>转 JSON</button>
          <button class="tool-btn tool-btn-secondary" id="jsonToYamlBtn"><i class="ri-exchange-line"></i>JSON 转 YAML</button>
          <button class="tool-btn tool-btn-secondary" id="yamlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
      `;
    },

    // SQL 格式化
    sql: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入 SQL</div>
            <textarea class="tool-textarea" id="sqlInput" placeholder="SELECT * FROM users WHERE id = 1 AND status = 'active'"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">格式化结果</div>
            <textarea class="tool-textarea" id="sqlOutput" readonly placeholder="结果将显示在这里"></textarea>
          </div>
        </div>
        <div class="tool-options">
          <div class="tool-option">
            <label>关键字大小写：</label>
            <select class="tool-select" id="sqlKeywordCase">
              <option value="upper">大写</option>
              <option value="lower">小写</option>
            </select>
          </div>
          <div class="tool-option">
            <label>缩进：</label>
            <select class="tool-select" id="sqlIndent">
              <option value="2">2 空格</option>
              <option value="4">4 空格</option>
            </select>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="sqlFormatBtn"><i class="ri-code-line"></i>格式化</button>
          <button class="tool-btn tool-btn-secondary" id="sqlCompressBtn"><i class="ri-compress-line"></i>压缩</button>
          <button class="tool-btn tool-btn-secondary" id="sqlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
      `;
    },

    // CSV 工具
    csv: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入 CSV</div>
            <textarea class="tool-textarea" id="csvInput" placeholder="name,age,city\nAlice,25,Beijing\nBob,30,Shanghai"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">输出结果</div>
            <textarea class="tool-textarea" id="csvOutput" readonly placeholder="结果将显示在这里"></textarea>
          </div>
        </div>
        <div class="tool-options">
          <div class="tool-option">
            <label>分隔符：</label>
            <select class="tool-select" id="csvDelimiter">
              <option value=",">逗号 (,)</option>
              <option value=";">分号 (;)</option>
              <option value="\t">Tab</option>
            </select>
          </div>
          <div class="tool-option">
            <input type="checkbox" id="csvHasHeader" checked>
            <label for="csvHasHeader">首行为表头</label>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="csvToJsonBtn"><i class="ri-exchange-line"></i>转 JSON</button>
          <button class="tool-btn tool-btn-secondary" id="csvPreviewBtn"><i class="ri-table-line"></i>预览表格</button>
          <button class="tool-btn tool-btn-secondary" id="csvCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
        <div id="csvPreview" style="margin-top:16px;overflow-x:auto;display:none"></div>
      `;
    },

    // Unicode 编解码
    unicode: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入文本</div>
            <textarea class="tool-textarea" id="unicodeInput" placeholder="输入文本或 Unicode 编码"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">输出结果</div>
            <textarea class="tool-textarea" id="unicodeOutput" readonly placeholder="结果将显示在这里"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="toUnicodeBtn"><i class="ri-lock-line"></i>转 Unicode</button>
          <button class="tool-btn tool-btn-primary" id="fromUnicodeBtn"><i class="ri-lock-unlock-line"></i>Unicode 解码</button>
          <button class="tool-btn tool-btn-secondary" id="toAsciiBtn">转 ASCII</button>
          <button class="tool-btn tool-btn-secondary" id="toHexBtn">转 Hex</button>
          <button class="tool-btn tool-btn-secondary" id="unicodeCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
      `;
    },

    // AES 加解密
    aes: function() {
      return `
        <div class="tool-card" style="margin-bottom:16px">
          <div class="tool-card-header">
            <div class="tool-card-title"><i class="ri-key-line"></i>密钥设置</div>
          </div>
          <div class="tool-card-body">
            <div class="tool-form-item">
              <label class="tool-label">加密密钥</label>
              <input type="password" class="tool-input tool-input-lg" id="aesKey" placeholder="输入任意长度的密钥，用于加密和解密" style="font-family:monospace">
            </div>
            <div class="tool-alert tool-alert-info" style="margin-top:12px;margin-bottom:0">
              <i class="ri-shield-check-line"></i>
              <div class="tool-alert-content">
                <div class="tool-alert-desc">使用 AES-256-GCM 加密算法，密钥通过 PBKDF2 派生，安全可靠</div>
              </div>
            </div>
          </div>
        </div>
        <div class="tool-row">
          <div class="tool-col">
            <div class="tool-card">
              <div class="tool-card-header">
                <div class="tool-card-title"><i class="ri-edit-line"></i>输入内容</div>
              </div>
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="aesInput" placeholder="加密时输入明文，解密时输入 Base64 密文"></textarea>
              </div>
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
              <div class="tool-card-body">
                <textarea class="tool-textarea" id="aesOutput" readonly placeholder="加密/解密结果将显示在这里"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-card-body">
            <div class="tool-btn-group tool-btn-group-center">
              <button class="tool-btn tool-btn-primary" id="aesEncryptBtn"><i class="ri-lock-line"></i>AES 加密</button>
              <button class="tool-btn tool-btn-primary" id="aesDecryptBtn"><i class="ri-lock-unlock-line"></i>AES 解密</button>
            </div>
          </div>
        </div>
      `;
    },

    // JWT 解析
    jwt: function() {
      return `
        <div class="tool-column" style="margin-bottom:16px">
          <div class="tool-column-label">输入 JWT Token</div>
          <textarea class="tool-textarea" id="jwtInput" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c" style="min-height:100px"></textarea>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="jwtDecodeBtn"><i class="ri-search-line"></i>解析 Token</button>
        </div>
        <div style="display:grid;gap:16px;margin-top:16px">
          <div class="tool-panel">
            <div class="tool-panel-header"><span class="tool-panel-title" style="color:#ef4444">Header</span></div>
            <div class="tool-panel-body"><pre id="jwtHeader" style="margin:0;font-size:13px;white-space:pre-wrap">-</pre></div>
          </div>
          <div class="tool-panel">
            <div class="tool-panel-header"><span class="tool-panel-title" style="color:#8b5cf6">Payload</span></div>
            <div class="tool-panel-body"><pre id="jwtPayload" style="margin:0;font-size:13px;white-space:pre-wrap">-</pre></div>
          </div>
          <div class="tool-panel">
            <div class="tool-panel-header"><span class="tool-panel-title" style="color:#06b6d4">Signature</span></div>
            <div class="tool-panel-body"><pre id="jwtSignature" style="margin:0;font-size:13px;word-break:break-all">-</pre></div>
          </div>
        </div>
      `;
    },

    // HTML 工具
    html: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入 HTML</div>
            <textarea class="tool-textarea" id="htmlInput" placeholder="<div><p>Hello World</p></div>"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">输出结果</div>
            <textarea class="tool-textarea" id="htmlOutput" readonly placeholder="结果将显示在这里"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="htmlFormatBtn"><i class="ri-code-line"></i>格式化</button>
          <button class="tool-btn tool-btn-secondary" id="htmlCompressBtn"><i class="ri-compress-line"></i>压缩</button>
          <button class="tool-btn tool-btn-secondary" id="htmlEscapeBtn"><i class="ri-shield-line"></i>转义</button>
          <button class="tool-btn tool-btn-secondary" id="htmlUnescapeBtn"><i class="ri-shield-line"></i>反转义</button>
          <button class="tool-btn tool-btn-secondary" id="htmlCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
      `;
    },

    // CSS 工具
    css: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入 CSS</div>
            <textarea class="tool-textarea" id="cssInput" placeholder=".container { display: flex; justify-content: center; }"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">输出结果</div>
            <textarea class="tool-textarea" id="cssOutput" readonly placeholder="结果将显示在这里"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="cssFormatBtn"><i class="ri-code-line"></i>格式化</button>
          <button class="tool-btn tool-btn-secondary" id="cssCompressBtn"><i class="ri-compress-line"></i>压缩</button>
          <button class="tool-btn tool-btn-secondary" id="cssCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
        </div>
      `;
    },

    // 渐变生成器
    gradient: function() {
      return `
        <div class="tool-panel" style="margin-bottom:16px">
          <div class="tool-panel-body">
            <div id="gradientPreview" style="height:120px;border-radius:8px;background:linear-gradient(90deg, #667eea 0%, #764ba2 100%);margin-bottom:16px"></div>
            <div style="display:grid;gap:12px">
              <div style="display:flex;align-items:center;gap:12px">
                <label style="width:80px;color:var(--text-secondary)">方向</label>
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
                <label style="width:80px;color:var(--text-secondary)">起始色</label>
                <input type="color" id="gradientColor1" value="#667eea" style="width:50px;height:36px;border:none;cursor:pointer">
                <input type="text" class="tool-input" id="gradientColor1Text" value="#667eea" style="flex:1">
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <label style="width:80px;color:var(--text-secondary)">结束色</label>
                <input type="color" id="gradientColor2" value="#764ba2" style="width:50px;height:36px;border:none;cursor:pointer">
                <input type="text" class="tool-input" id="gradientColor2Text" value="#764ba2" style="flex:1">
              </div>
            </div>
          </div>
        </div>
        <div class="tool-panel">
          <div class="tool-panel-header"><span class="tool-panel-title">CSS 代码</span></div>
          <div class="tool-panel-body">
            <textarea class="tool-textarea" id="gradientOutput" readonly style="min-height:80px;font-family:monospace">background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);</textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="gradientCopyBtn"><i class="ri-file-copy-line"></i>复制 CSS</button>
        </div>
      `;
    },

    // IP 工具
    ip: function() {
      return `
        <div class="tool-panel" style="margin-bottom:16px">
          <div class="tool-panel-header"><span class="tool-panel-title">IP 地址转换</span></div>
          <div class="tool-panel-body">
            <div style="display:flex;gap:12px;margin-bottom:12px">
              <input type="text" class="tool-input" id="ipInput" placeholder="输入 IP 地址，如 192.168.1.1" style="flex:1">
              <button class="tool-btn tool-btn-primary" id="ipConvertBtn">转换</button>
            </div>
            <div style="display:grid;gap:8px">
              <div style="display:flex;align-items:center;gap:8px">
                <span style="width:100px;color:var(--text-secondary)">十进制</span>
                <input type="text" class="tool-input" id="ipDecimal" readonly style="flex:1">
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="width:100px;color:var(--text-secondary)">二进制</span>
                <input type="text" class="tool-input" id="ipBinary" readonly style="flex:1;font-family:monospace;font-size:12px">
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="width:100px;color:var(--text-secondary)">十六进制</span>
                <input type="text" class="tool-input" id="ipHex" readonly style="flex:1;font-family:monospace">
              </div>
            </div>
          </div>
        </div>
        <div class="tool-panel">
          <div class="tool-panel-header"><span class="tool-panel-title">子网计算</span></div>
          <div class="tool-panel-body">
            <div style="display:flex;gap:12px;margin-bottom:12px">
              <input type="text" class="tool-input" id="subnetIp" placeholder="IP 地址" style="flex:1">
              <span style="color:var(--text-muted);line-height:36px">/</span>
              <input type="number" class="tool-input" id="subnetMask" value="24" min="0" max="32" style="width:80px">
              <button class="tool-btn tool-btn-primary" id="subnetCalcBtn">计算</button>
            </div>
            <div id="subnetResult" class="tool-result">输入 IP 和子网掩码后点击计算</div>
          </div>
        </div>
      `;
    },

    // 文本对比
    diff: function() {
      return `
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">原始文本</div>
            <textarea class="tool-textarea" id="diffInput1" placeholder="输入原始文本"></textarea>
          </div>
          <div class="tool-column">
            <div class="tool-column-label">对比文本</div>
            <textarea class="tool-textarea" id="diffInput2" placeholder="输入要对比的文本"></textarea>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="diffCompareBtn"><i class="ri-git-merge-line"></i>对比差异</button>
          <button class="tool-btn tool-btn-secondary" id="diffSwapBtn"><i class="ri-swap-line"></i>交换</button>
          <button class="tool-btn tool-btn-secondary" id="diffClearBtn"><i class="ri-delete-bin-line"></i>清空</button>
        </div>
        <div id="diffResult" style="margin-top:16px"></div>
      `;
    },

    // 二维码
    qrcode: function() {
      return `
        <div class="tool-tabs">
          <button class="tool-tab is-active" data-tab="generate">生成二维码</button>
          <button class="tool-tab" data-tab="scan">解析二维码</button>
        </div>
        <div class="tool-columns">
          <div class="tool-column">
            <div class="tool-column-label">输入内容</div>
            <textarea class="tool-textarea" id="qrcodeInput" placeholder="输入要生成二维码的文本或链接"></textarea>
            <div class="tool-options">
              <div class="tool-option">
                <label>尺寸：</label>
                <select class="tool-select" id="qrcodeSize">
                  <option value="128">128 x 128</option>
                  <option value="200" selected>200 x 200</option>
                  <option value="256">256 x 256</option>
                  <option value="300">300 x 300</option>
                </select>
              </div>
            </div>
          </div>
          <div class="tool-column" style="display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div id="qrcodeOutput" style="background:white;padding:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;min-height:200px">
              <span style="color:var(--text-muted)">二维码将显示在这里</span>
            </div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="qrcodeGenerateBtn"><i class="ri-qr-code-line"></i>生成二维码</button>
          <button class="tool-btn tool-btn-secondary" id="qrcodeDownloadBtn"><i class="ri-download-line"></i>下载</button>
        </div>
      `;
    },

    // Markdown
    markdown: function() {
      return `
        <div class="tool-columns" style="height:calc(100vh - 300px);min-height:400px">
          <div class="tool-column" style="height:100%">
            <div class="tool-column-label">Markdown 源码</div>
            <textarea class="tool-textarea" id="markdownInput" style="height:calc(100% - 30px);resize:none" placeholder="# 标题\n\n**粗体** *斜体* ~~删除线~~\n\n- 列表项1\n- 列表项2\n\n\`\`\`js\nconsole.log('Hello');\n\`\`\`"></textarea>
          </div>
          <div class="tool-column" style="height:100%">
            <div class="tool-column-label">预览</div>
            <div id="markdownOutput" style="height:calc(100% - 30px);overflow-y:auto;padding:16px;background:var(--bg-secondary);border-radius:8px;border:1px solid var(--border-light)"></div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-secondary" id="markdownCopyHtmlBtn"><i class="ri-html5-line"></i>复制 HTML</button>
        </div>
      `;
    },

    // 占位图
    placeholder: function() {
      return `
        <div class="tool-panel" style="margin-bottom:16px">
          <div class="tool-panel-body">
            <div style="display:grid;gap:12px">
              <div style="display:flex;gap:12px">
                <div class="tool-option">
                  <label>宽度：</label>
                  <input type="number" class="tool-input" id="placeholderWidth" value="400" min="1" max="2000" style="width:100px">
                </div>
                <div class="tool-option">
                  <label>高度：</label>
                  <input type="number" class="tool-input" id="placeholderHeight" value="300" min="1" max="2000" style="width:100px">
                </div>
              </div>
              <div style="display:flex;gap:12px">
                <div class="tool-option">
                  <label>背景色：</label>
                  <input type="color" id="placeholderBgColor" value="#cccccc" style="width:50px;height:30px;border:none">
                </div>
                <div class="tool-option">
                  <label>文字色：</label>
                  <input type="color" id="placeholderTextColor" value="#666666" style="width:50px;height:30px;border:none">
                </div>
              </div>
              <div class="tool-option">
                <label>文字：</label>
                <input type="text" class="tool-input" id="placeholderText" placeholder="留空则显示尺寸" style="flex:1">
              </div>
            </div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="placeholderGenerateBtn"><i class="ri-image-line"></i>生成占位图</button>
          <button class="tool-btn tool-btn-secondary" id="placeholderDownloadBtn"><i class="ri-download-line"></i>下载</button>
        </div>
        <div style="margin-top:16px;text-align:center">
          <canvas id="placeholderCanvas" style="max-width:100%;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)"></canvas>
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
        <div class="tool-options" style="flex-wrap:wrap;gap:8px;margin-bottom:16px">
          ${Object.keys(templates).map(t => `
            <button class="tool-btn tool-btn-secondary gitignore-preset" data-template="${t}" style="padding:6px 12px;font-size:12px">${t}</button>
          `).join('')}
        </div>
        <div class="tool-column">
          <div class="tool-column-label">生成的 .gitignore</div>
          <textarea class="tool-textarea" id="gitignoreOutput" style="min-height:300px;font-family:monospace" placeholder="点击上方按钮选择模板，或直接编辑"></textarea>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="gitignoreCopyBtn"><i class="ri-file-copy-line"></i>复制</button>
          <button class="tool-btn tool-btn-secondary" id="gitignoreClearBtn"><i class="ri-delete-bin-line"></i>清空</button>
        </div>
      `;
    },

    // Nginx 配置生成器
    nginx: function() {
      return `
        <div class="tool-panel" style="margin-bottom:16px">
          <div class="tool-panel-header"><span class="tool-panel-title">配置选项</span></div>
          <div class="tool-panel-body">
            <div style="display:grid;gap:12px">
              <div style="display:flex;align-items:center;gap:8px">
                <label style="width:100px;color:var(--text-secondary)">域名</label>
                <input type="text" class="tool-input" id="nginxDomain" placeholder="example.com" style="flex:1">
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <label style="width:100px;color:var(--text-secondary)">端口</label>
                <input type="number" class="tool-input" id="nginxPort" value="80" style="width:100px">
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <label style="width:100px;color:var(--text-secondary)">根目录</label>
                <input type="text" class="tool-input" id="nginxRoot" placeholder="/var/www/html" style="flex:1">
              </div>
              <div style="display:flex;gap:16px;flex-wrap:wrap">
                <div class="tool-option">
                  <input type="checkbox" id="nginxHttps">
                  <label for="nginxHttps">启用 HTTPS</label>
                </div>
                <div class="tool-option">
                  <input type="checkbox" id="nginxProxy">
                  <label for="nginxProxy">反向代理</label>
                </div>
                <div class="tool-option">
                  <input type="checkbox" id="nginxGzip">
                  <label for="nginxGzip">启用 Gzip</label>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px" id="nginxProxyRow" style="display:none">
                <label style="width:100px;color:var(--text-secondary)">代理地址</label>
                <input type="text" class="tool-input" id="nginxProxyPass" placeholder="http://127.0.0.1:3000" style="flex:1">
              </div>
            </div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="nginxGenerateBtn"><i class="ri-magic-line"></i>生成配置</button>
        </div>
        <div class="tool-column" style="margin-top:16px">
          <div class="tool-column-label">Nginx 配置</div>
          <textarea class="tool-textarea" id="nginxOutput" readonly style="min-height:300px;font-family:monospace"></textarea>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-secondary" id="nginxCopyBtn"><i class="ri-file-copy-line"></i>复制配置</button>
        </div>
      `;
    },

    // Curl 命令
    curl: function() {
      return `
        <div class="tool-tabs">
          <button class="tool-tab is-active" data-tab="generate">生成 Curl</button>
          <button class="tool-tab" data-tab="parse">解析 Curl</button>
        </div>
        <div class="tool-panel" style="margin-bottom:16px">
          <div class="tool-panel-body">
            <div style="display:grid;gap:12px">
              <div style="display:flex;align-items:center;gap:8px">
                <label style="width:80px;color:var(--text-secondary)">URL</label>
                <input type="text" class="tool-input" id="curlUrl" placeholder="https://api.example.com/data" style="flex:1">
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <label style="width:80px;color:var(--text-secondary)">Method</label>
                <select class="tool-select" id="curlMethod">
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div style="display:flex;align-items:flex-start;gap:8px">
                <label style="width:80px;color:var(--text-secondary);padding-top:8px">Headers</label>
                <textarea class="tool-textarea" id="curlHeaders" placeholder="Content-Type: application/json\nAuthorization: Bearer token" style="flex:1;min-height:80px"></textarea>
              </div>
              <div style="display:flex;align-items:flex-start;gap:8px">
                <label style="width:80px;color:var(--text-secondary);padding-top:8px">Body</label>
                <textarea class="tool-textarea" id="curlBody" placeholder='{"key": "value"}' style="flex:1;min-height:80px"></textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-primary" id="curlGenerateBtn"><i class="ri-terminal-line"></i>生成命令</button>
        </div>
        <div class="tool-column" style="margin-top:16px">
          <div class="tool-column-label">Curl 命令</div>
          <textarea class="tool-textarea" id="curlOutput" readonly style="min-height:100px;font-family:monospace"></textarea>
        </div>
        <div class="tool-actions">
          <button class="tool-btn tool-btn-secondary" id="curlCopyBtn"><i class="ri-file-copy-line"></i>复制命令</button>
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
      try {
        const obj = JSON.parse(input.value);
        const space = indent.value === 'tab' ? '\t' : parseInt(indent.value);
        output.value = JSON.stringify(obj, null, space);
      } catch (e) {
        output.value = '❌ JSON 格式错误: ' + e.message;
      }
    };

    document.getElementById('jsonCompressBtn').onclick = () => {
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
      try {
        output.value = btoa(unescape(encodeURIComponent(input.value)));
      } catch (e) {
        output.value = '❌ 编码失败: ' + e.message;
      }
    };

    document.getElementById('base64DecodeBtn').onclick = () => {
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
      output.value = encodeURIComponent(input.value);
    };

    document.getElementById('urlDecodeBtn').onclick = () => {
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
    const input = document.getElementById('cronInput');
    const output = document.getElementById('cronOutput');

    preset.onchange = () => {
      if (preset.value) {
        input.value = preset.value;
      }
    };

    document.getElementById('cronParseBtn').onclick = () => {
      const parts = input.value.trim().split(/\s+/);
      if (parts.length !== 5) {
        output.innerHTML = '<span style="color:#ef4444">❌ Cron 表达式格式错误，应为 5 段</span>';
        return;
      }

      const [minute, hour, day, month, weekday] = parts;
      const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

      let desc = '执行时间：';
      
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

      // 计算下次执行时间
      const now = new Date();
      const nextRuns = [];
      for (let i = 0; i < 5; i++) {
        const next = new Date(now.getTime() + i * 60000);
        nextRuns.push(next.toLocaleString('zh-CN'));
      }

      output.innerHTML = `<div style="margin-bottom:12px"><strong>${desc}</strong></div>
<div style="color:var(--text-muted);font-size:12px">
分钟: ${minute} | 小时: ${hour} | 日: ${day} | 月: ${month} | 周: ${weekday}
</div>`;
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
    document.querySelectorAll('.radix-input').forEach(input => {
      input.oninput = () => {
        const radix = parseInt(input.dataset.radix);
        const value = parseInt(input.value, radix);
        if (isNaN(value)) return;

        document.getElementById('radix10').value = value.toString(10);
        document.getElementById('radix2').value = value.toString(2);
        document.getElementById('radix8').value = value.toString(8);
        document.getElementById('radix16').value = value.toString(16).toUpperCase();
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
      document.getElementById('randomOutput').value = result;
    };

    document.getElementById('randomCopyBtn').onclick = () => {
      copyToClipboard(document.getElementById('randomOutput').value);
    };

    document.getElementById('randomNumGenerateBtn').onclick = () => {
      const min = parseInt(document.getElementById('randomMin').value);
      const max = parseInt(document.getElementById('randomMax').value);
      const result = Math.floor(Math.random() * (max - min + 1)) + min;
      document.getElementById('randomNumOutput').value = result;
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
      const keywordCase = document.getElementById('sqlKeywordCase').value;
      const indentSize = parseInt(document.getElementById('sqlIndent').value);
      output.value = formatSql(input.value, keywordCase, indentSize);
    };

    document.getElementById('sqlCompressBtn').onclick = () => {
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
    const output = document.getElementById('csvOutput');

    document.getElementById('csvToJsonBtn').onclick = () => {
      const delimiter = document.getElementById('csvDelimiter').value === '\\t' ? '\t' : document.getElementById('csvDelimiter').value;
      const hasHeader = document.getElementById('csvHasHeader').checked;
      const json = csvToJson(input.value, delimiter, hasHeader);
      output.value = JSON.stringify(json, null, 2);
    };

    document.getElementById('csvPreviewBtn').onclick = () => {
      const delimiter = document.getElementById('csvDelimiter').value === '\\t' ? '\t' : document.getElementById('csvDelimiter').value;
      const preview = document.getElementById('csvPreview');
      preview.style.display = 'block';
      preview.innerHTML = csvToTable(input.value, delimiter);
    };

    document.getElementById('csvCopyBtn').onclick = () => copyToClipboard(output.value);
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
    document.getElementById('diffCompareBtn').onclick = () => {
      const text1 = document.getElementById('diffInput1').value;
      const text2 = document.getElementById('diffInput2').value;
      const result = document.getElementById('diffResult');
      
      const lines1 = text1.split('\n');
      const lines2 = text2.split('\n');
      const maxLines = Math.max(lines1.length, lines2.length);
      
      let html = '<div style="font-family:monospace;font-size:13px">';
      for (let i = 0; i < maxLines; i++) {
        const l1 = lines1[i] || '';
        const l2 = lines2[i] || '';
        
        if (l1 === l2) {
          html += `<div style="padding:4px 8px;background:var(--bg-secondary)">${escapeHtml(l1) || '&nbsp;'}</div>`;
        } else {
          if (l1) html += `<div style="padding:4px 8px;background:rgba(239,68,68,0.1);color:#ef4444">- ${escapeHtml(l1)}</div>`;
          if (l2) html += `<div style="padding:4px 8px;background:rgba(34,197,94,0.1);color:#22c55e">+ ${escapeHtml(l2)}</div>`;
        }
      }
      html += '</div>';
      result.innerHTML = html;
    };

    document.getElementById('diffSwapBtn').onclick = () => {
      const input1 = document.getElementById('diffInput1');
      const input2 = document.getElementById('diffInput2');
      const temp = input1.value;
      input1.value = input2.value;
      input2.value = temp;
    };

    document.getElementById('diffClearBtn').onclick = () => {
      document.getElementById('diffInput1').value = '';
      document.getElementById('diffInput2').value = '';
      document.getElementById('diffResult').innerHTML = '';
    };
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 二维码事件
  function initQrcodeEvents() {
    document.getElementById('qrcodeGenerateBtn').onclick = () => {
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
      ctx.font = `${Math.min(width, height) / 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 2);
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

