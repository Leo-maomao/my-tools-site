// 快捷键登录组件 - Tools 项目
(function() {
  // ToolSite 数据库配置
  const SUPABASE_URL = "https://aexcnubowsarpxkohqvv.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFleGNudWJvd3NhcnB4a29ocXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjYyOTksImV4cCI6MjA3OTgwMjI5OX0.TCGkoBou99fui-cgcpod-b3BaSdq1mg7SFUtR2mIxms";
  
  let supabase = null;
  
  // 延迟初始化 Supabase（等待 SDK 加载）
  function initSupabase() {
    if (!window.supabase) {
      console.warn('Supabase SDK 未加载');
      return false;
    }
    
    if (!supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      window.toolsSupabase = supabase;
      console.log('Supabase 初始化成功');
    }
    return true;
  }
  
  // DOM 元素
  let loginModal, loginEmail, loginPassword, loginSubmitBtn, loginCancelBtn, loginModalClose, sidebarFooter, logoutBtn;
  
  function initDOMElements() {
    loginModal = document.getElementById('loginModal');
    loginEmail = document.getElementById('loginEmail');
    loginPassword = document.getElementById('loginPassword');
    loginSubmitBtn = document.getElementById('loginSubmitBtn');
    loginCancelBtn = document.getElementById('loginCancelBtn');
    loginModalClose = document.getElementById('loginModalClose');
    sidebarFooter = document.getElementById('sidebarFooter');
    logoutBtn = document.getElementById('logoutBtn');
  }
  
  // 打开登录框
  function openLoginModal() {
    if (!loginModal) {
      console.error('登录模态框未找到');
      return;
    }
    loginModal.classList.add('is-visible');
    setTimeout(() => {
      if (loginEmail) loginEmail.focus();
    }, 100);
  }
  
  // 关闭登录框
  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.classList.remove('is-visible');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
  }
  
  // 登录处理
  async function handleLogin() {
    if (!initSupabase()) {
      alert('系统初始化失败，请刷新页面重试');
      return;
    }
    
    const email = loginEmail ? loginEmail.value.trim() : '';
    const password = loginPassword ? loginPassword.value : '';
    
    if (!email || !password) {
      alert('请输入邮箱和密码');
      return;
    }
    
    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.textContent = '登录中...';
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      closeLoginModal();
      onLoginSuccess();
    } catch (error) {
      alert('登录失败：' + error.message);
    } finally {
      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = '登录';
      }
    }
  }
  
  // 退出登录
  async function handleLogout() {
    if (!initSupabase()) {
      alert('系统初始化失败，请刷新页面重试');
      return;
    }
    
    if (!confirm('确定要退出管理员模式吗？')) return;
    
    try {
      await supabase.auth.signOut();
      onLogoutSuccess();
    } catch (error) {
      alert('退出失败：' + error.message);
    }
  }
  
  // 登录成功后的操作
  function onLoginSuccess() {
    if (sidebarFooter) {
      sidebarFooter.style.display = 'flex';
    }
    window.dispatchEvent(new CustomEvent('toolsUserLoggedIn'));
  }
  
  // 退出成功后的操作
  function onLogoutSuccess() {
    if (sidebarFooter) {
      sidebarFooter.style.display = 'none';
    }
    window.dispatchEvent(new CustomEvent('toolsUserLoggedOut'));
  }
  
  // 快捷键监听：Ctrl/Cmd + Shift + K
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      console.log('快捷键被触发');
      
      // 尝试初始化 Supabase
      if (!initSupabase()) {
        alert('系统正在加载中，请稍后再试');
        return;
      }
      
      // 检查是否已登录
      supabase.auth.getSession().then(result => {
        if (result.data.session) {
          // 已登录，不做任何操作
        } else {
          openLoginModal();
        }
      }).catch(error => {
        console.error('检查登录状态失败:', error);
        openLoginModal();
      });
    }
  });
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    console.log('Auth 模块初始化开始');
    
    // 初始化 DOM 元素
    initDOMElements();
    
    // 尝试初始化 Supabase
    if (!initSupabase()) {
      console.warn('Supabase 初始化失败，将在首次使用时重试');
      return;
    }
    
    // 事件绑定
    if (loginSubmitBtn) {
      loginSubmitBtn.addEventListener('click', handleLogin);
    }
    
    if (loginCancelBtn) {
      loginCancelBtn.addEventListener('click', closeLoginModal);
    }
    
    if (loginModalClose) {
      loginModalClose.addEventListener('click', closeLoginModal);
    }
    
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    
    // 回车登录
    if (loginPassword) {
      loginPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
      });
    }
    
    // 页面加载时检查登录状态
    if (supabase) {
      supabase.auth.getSession().then(result => {
        if (result.data.session) {
          onLoginSuccess();
        }
      });
      
      // 监听登录状态变化
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          onLogoutSuccess();
        } else if (event === 'SIGNED_IN') {
          onLoginSuccess();
        }
      });
    }
    
    console.log('Auth 模块初始化完成');
  }
  
  // 暴露给全局
  window.ToolsAuth = {
    login: openLoginModal,
    logout: handleLogout,
    isLoggedIn: async () => {
      if (!initSupabase()) return false;
      const result = await supabase.auth.getSession();
      return !!result.data.session;
    },
    getSession: async () => {
      if (!initSupabase()) return null;
      const result = await supabase.auth.getSession();
      return result.data.session;
    }
  };
})();
