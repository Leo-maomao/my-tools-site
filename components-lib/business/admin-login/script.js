/**
 * Admin Login 管理员登录组件
 * 功能：
 * - 键盘快捷键触发 (Ctrl+Shift+L)
 * - Supabase Auth 集成
 * - 持久化登录状态
 */

class AdminLogin {
  constructor(options = {}) {
    this.options = {
      // Supabase 配置
      supabaseUrl: '',
      supabaseKey: '',
      
      // 快捷键配置
      shortcut: {
        ctrl: true,
        shift: true,
        key: 'l'
      },
      
      // 回调
      onLogin: null,
      onLogout: null,
      
      // 覆盖默认选项
      ...options
    };
    
    this.supabase = null;
    this.user = null;
    this.overlay = null;
    
    this.init();
  }
  
  async init() {
    // 初始化 Supabase（如果配置了）
    if (this.options.supabaseUrl && this.options.supabaseKey) {
      await this.initSupabase();
    }
    
    this.createDOM();
    this.bindEvents();
    
    // 检查登录状态
    await this.checkSession();
  }
  
  async initSupabase() {
    // 动态加载 Supabase
    if (!window.supabase && typeof createClient === 'undefined') {
      await this.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }
    
    if (window.supabase?.createClient) {
      this.supabase = window.supabase.createClient(
        this.options.supabaseUrl,
        this.options.supabaseKey
      );
    }
  }
  
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  createDOM() {
    // 查找现有的 overlay 或创建新的
    this.overlay = document.getElementById('admin-login');
    
    if (!this.overlay) {
      const html = `
        <div class="admin-login-overlay" id="admin-login">
          <div class="admin-login-modal">
            <button class="admin-login-close" type="button" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            <div class="admin-login-content">
              <header class="admin-login-header">
                <div class="admin-login-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
                <h2 class="admin-login-title">管理员登录</h2>
                <p class="admin-login-desc">请输入您的管理员凭据</p>
              </header>
              
              <form class="admin-login-form" id="admin-login-form">
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input type="email" class="input" name="email" placeholder="邮箱地址" required autocomplete="email">
                </div>
                
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type="password" class="input" name="password" placeholder="密码" required autocomplete="current-password">
                </div>
                
                <label class="admin-login-remember">
                  <input type="checkbox" name="remember" checked>
                  <span>保持登录状态</span>
                </label>
                
                <div class="admin-login-error" style="display: none;" id="admin-login-error"></div>
                
                <button type="submit" class="btn btn-primary admin-login-submit">登录</button>
              </form>
              
              <div class="admin-login-shortcut">
                按 <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> 快速打开
              </div>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', html);
      this.overlay = document.getElementById('admin-login');
    }
    
    this.modal = this.overlay.querySelector('.admin-login-modal');
    this.form = this.overlay.querySelector('#admin-login-form');
    this.closeBtn = this.overlay.querySelector('.admin-login-close');
    this.errorEl = this.overlay.querySelector('#admin-login-error');
    this.submitBtn = this.form.querySelector('.admin-login-submit');
  }
  
  bindEvents() {
    // 快捷键
    document.addEventListener('keydown', (e) => {
      const { ctrl, shift, key } = this.options.shortcut;
      if (
        e.ctrlKey === ctrl &&
        e.shiftKey === shift &&
        e.key.toLowerCase() === key
      ) {
        e.preventDefault();
        this.open();
      }
    });
    
    // 关闭按钮
    this.closeBtn.addEventListener('click', () => this.close());
    
    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
    
    // ESC 关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
    
    // 表单提交
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });
    
    // 密码显示切换
    const toggleBtn = this.form.querySelector('.input-password-toggle');
    const passwordInput = this.form.querySelector('input[name="password"]');
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
      });
    }
    
    // 触发按钮（如果存在）
    const trigger = document.querySelector('.admin-login-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => this.open());
    }
  }
  
  open() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarWidth + 'px';
    document.body.style.overflow = 'hidden';
    
    this.overlay.classList.add('admin-login-open');
    this.form.querySelector('input[name="email"]').focus();
  }
  
  close() {
    this.overlay.classList.remove('admin-login-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    
    this.hideError();
    this.form.reset();
  }
  
  isOpen() {
    return this.overlay.classList.contains('admin-login-open');
  }
  
  async login() {
    const email = this.form.email.value;
    const password = this.form.password.value;
    const remember = this.form.remember?.checked;
    
    this.setLoading(true);
    this.hideError();
    
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        
        this.user = data.user;
      } else {
        // 模拟登录（无 Supabase 时）
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.user = { email };
      }
      
      // 持久化
      if (remember) {
        localStorage.setItem('adminUser', JSON.stringify(this.user));
      }
      
      if (this.options.onLogin) {
        this.options.onLogin(this.user);
      }
      
      this.close();
      
    } catch (error) {
      this.showError(error.message || '登录失败，请检查邮箱和密码');
    } finally {
      this.setLoading(false);
    }
  }
  
  async logout() {
    if (this.supabase) {
      await this.supabase.auth.signOut();
    }
    
    this.user = null;
    localStorage.removeItem('adminUser');
    
    if (this.options.onLogout) {
      this.options.onLogout();
    }
  }
  
  async checkSession() {
    // 检查 localStorage
    const stored = localStorage.getItem('adminUser');
    if (stored) {
      this.user = JSON.parse(stored);
    }
    
    // 检查 Supabase session
    if (this.supabase) {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        this.user = session.user;
      }
    }
    
    if (this.user && this.options.onLogin) {
      this.options.onLogin(this.user);
    }
  }
  
  setLoading(loading) {
    if (loading) {
      this.submitBtn.disabled = true;
      this.submitBtn.innerHTML = '<span class="admin-login-loading"><span class="loading-spinner"></span>登录中...</span>';
    } else {
      this.submitBtn.disabled = false;
      this.submitBtn.textContent = '登录';
    }
  }
  
  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.style.display = 'block';
  }
  
  hideError() {
    this.errorEl.style.display = 'none';
  }
  
  isLoggedIn() {
    return !!this.user;
  }
  
  getUser() {
    return this.user;
  }
}

// 导出
window.AdminLogin = AdminLogin;

