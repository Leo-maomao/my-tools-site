/**
 * 基金助手 - JavaScript
 */

(function() {
  'use strict';

  // API 基础地址
  var API_BASE = 'https://fund-api.leo-maomao.workers.dev';

  // DOM 元素
  var els = {
    marketIndices: document.getElementById('marketIndices'),
    updateTime: document.getElementById('updateTime'),
    refreshBtn: document.getElementById('refreshBtn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    tabs: document.querySelectorAll('.fund-tab'),
    watchlistPanel: document.getElementById('watchlistPanel'),
    rankingPanel: document.getElementById('rankingPanel'),
    watchlistTable: document.getElementById('watchlistTable'),
    watchlistBody: document.getElementById('watchlistBody'),
    watchlistEmpty: document.getElementById('watchlistEmpty'),
    rankingTable: document.getElementById('rankingTable'),
    rankingBody: document.getElementById('rankingBody'),
    rankingWrapper: document.getElementById('rankingWrapper'),
    rankingLoading: document.getElementById('rankingLoading'),
    loadMoreIndicator: document.getElementById('loadMoreIndicator'),
    fundType: document.getElementById('fundType'),
    sortBy: document.getElementById('sortBy'),
    sortOrder: document.getElementById('sortOrder'),
    fundCount: document.getElementById('fundCount')
  };

  // 状态
  var state = {
    watchlist: [],
    rankingData: [],
    rankingPage: 1,
    rankingTotal: 0,
    isLoadingMore: false,
    searchTimer: null,
    searchResults: [],
    isSearchMode: false,
    autoRefreshTimer: null
  };

  // 自动刷新间隔（毫秒）- 开盘时间30秒刷新
  var REFRESH_INTERVAL = 30000;

  // 初始化
  function init() {
    // 初始化全局下拉组件
    if (window.UI && window.UI.Select) {
      window.UI.Select.init(document.querySelector('.fund-main'));
    }
    
    loadWatchlist();
    bindEvents();
    fetchMarketIndices();
    renderWatchlist();
    startAutoRefresh();
  }

  // 判断是否为开盘时间
  function isMarketOpen() {
    var now = new Date();
    var day = now.getDay();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var time = hour * 100 + minute;

    // 周一到周五
    if (day === 0 || day === 6) return false;
    // 上午 9:30-11:30, 下午 13:00-15:00
    return (time >= 930 && time <= 1130) || (time >= 1300 && time <= 1500);
  }

  // 开始自动刷新
  function startAutoRefresh() {
    if (state.autoRefreshTimer) clearInterval(state.autoRefreshTimer);

    state.autoRefreshTimer = setInterval(function() {
      if (isMarketOpen()) {
        fetchMarketIndices();
        // 如果在自选页面，也刷新自选数据
        if (els.watchlistPanel.classList.contains('is-active') && !state.isSearchMode) {
          renderWatchlist();
        }
      }
    }, REFRESH_INTERVAL);
  }

  // 绑定事件
  function bindEvents() {
    // Tab 切换
    els.tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        switchTab(tab.dataset.tab);
      });
    });

    // 搜索
    els.searchInput.addEventListener('input', debounceSearch);
    els.searchBtn.addEventListener('click', doSearch);
    els.searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') doSearch();
      if (e.key === 'Escape') clearSearch();
    });

    // 筛选
    els.fundType.addEventListener('change', fetchRanking);
    els.sortBy.addEventListener('change', fetchRanking);
    els.sortOrder.addEventListener('change', fetchRanking);

    // 滚动加载更多
    els.rankingWrapper.addEventListener('scroll', handleScroll);

    // 手动刷新
    els.refreshBtn.addEventListener('click', function() {
      els.refreshBtn.classList.add('is-loading');
      fetchMarketIndices().then(function() {
        els.refreshBtn.classList.remove('is-loading');
      });
      if (els.watchlistPanel.classList.contains('is-active') && !state.isSearchMode) {
        renderWatchlist();
      }
    });
  }

  // Tab 切换
  function switchTab(tabName) {
    els.tabs.forEach(function(tab) {
      tab.classList.toggle('is-active', tab.dataset.tab === tabName);
    });
    els.watchlistPanel.classList.toggle('is-active', tabName === 'watchlist');
    els.rankingPanel.classList.toggle('is-active', tabName === 'ranking');

    // 清除搜索状态
    clearSearch();

    if (tabName === 'ranking' && state.rankingData.length === 0) {
      fetchRanking();
    }
  }

  // 获取大盘指数（包含美股和黄金）
  async function fetchMarketIndices() {
    try {
      var res = await fetch(API_BASE + '/index');
      var data = await res.json();

      // 获取美股数据
      try {
        var usRes = await fetch('https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=100.NDX,100.DJIA,100.SPX&_=' + Date.now());
        var usData = await usRes.json();
        if (usData.data && usData.data.diff) {
          var usItems = usData.data.diff.map(function(item) {
            return {
              code: item.f12,
              name: item.f14,
              price: item.f2,
              change: item.f3
            };
          });
          data = data.concat(usItems);
        }
      } catch (e) {}

      // 获取黄金数据（通过Worker代理）
      try {
        var goldRes = await fetch(API_BASE + '/gold');
        var goldData = await goldRes.json();
        if (goldData && goldData.length > 0) {
          data = data.concat(goldData);
        }
      } catch (e) {}

      renderMarketIndices(data);
      updateTimeDisplay();
    } catch (e) {
      // 静默失败
    }
  }

  // 更新时间显示
  function updateTimeDisplay() {
    var now = new Date();
    var h = now.getHours().toString().padStart(2, '0');
    var m = now.getMinutes().toString().padStart(2, '0');
    var s = now.getSeconds().toString().padStart(2, '0');
    els.updateTime.textContent = '更新于 ' + h + ':' + m + ':' + s;
  }

  // 渲染大盘指数
  function renderMarketIndices(data) {
    if (!data || !Array.isArray(data)) return;

    var indexMap = {
      '000001': '上证指数',
      '399001': '深证成指',
      '399006': '创业板指',
      'NDX': '纳斯达克',
      'DJIA': '道琼斯',
      'SPX': '标普500',
      'XAU': '伦敦金',
      'AU9999': '沪金9999'
    };

    els.marketIndices.innerHTML = data.map(function(item) {
      var change = parseFloat(item.change) || 0;
      var changeClass = change >= 0 ? 'up' : 'down';
      var changeText = change >= 0 ? '+' + change.toFixed(2) + '%' : change.toFixed(2) + '%';
      var name = indexMap[item.code] || item.name || item.code;

      return '<div class="index-item">' +
        '<span class="index-name">' + name + '</span>' +
        '<span class="index-value">' + (item.price || '--') + '</span>' +
        '<span class="index-change ' + changeClass + '">' + changeText + '</span>' +
      '</div>';
    }).join('');
  }

  // 防抖搜索
  function debounceSearch() {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(doSearch, 300);
  }

  // 执行搜索
  async function doSearch() {
    var keyword = els.searchInput.value.trim();
    if (!keyword) {
      clearSearch();
      return;
    }

    state.isSearchMode = true;

    // 切换到自选面板显示搜索结果
    switchToWatchlistPanel();

    // 显示加载状态
    els.watchlistBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)"><i class="ri-loader-4-line ri-spin" style="font-size:24px"></i></td></tr>';
    els.watchlistTable.style.display = 'table';
    els.watchlistEmpty.classList.remove('is-visible');

    try {
      var res = await fetch(API_BASE + '/search?q=' + encodeURIComponent(keyword));
      var data = await res.json();
      state.searchResults = data || [];
      renderSearchResults();
    } catch (e) {
      els.watchlistBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">搜索失败，请重试</td></tr>';
    }
  }

  // 切换到自选面板
  function switchToWatchlistPanel() {
    els.tabs.forEach(function(tab) {
      tab.classList.toggle('is-active', tab.dataset.tab === 'watchlist');
    });
    els.watchlistPanel.classList.add('is-active');
    els.rankingPanel.classList.remove('is-active');
  }

  // 清除搜索
  function clearSearch() {
    state.isSearchMode = false;
    state.searchResults = [];
    els.searchInput.value = '';
    renderWatchlist();
  }

  // 渲染搜索结果
  async function renderSearchResults() {
    if (state.searchResults.length === 0) {
      els.watchlistBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">未找到相关基金</td></tr>';
      return;
    }

    // 获取详情数据
    var funds = await Promise.all(
      state.searchResults.slice(0, 20).map(async function(item) {
        try {
          var res = await fetch(API_BASE + '/detail/' + item.code);
          return await res.json();
        } catch (e) {
          return { code: item.code, name: item.name, error: true };
        }
      })
    );

    renderWatchlistTable(funds, true);
  }

  // 加载自选列表
  function loadWatchlist() {
    try {
      var saved = localStorage.getItem('fund_watchlist');
      state.watchlist = saved ? JSON.parse(saved) : [];
    } catch (e) {
      state.watchlist = [];
    }
  }

  // 保存自选列表
  function saveWatchlist() {
    localStorage.setItem('fund_watchlist', JSON.stringify(state.watchlist));
  }

  // 添加到自选
  async function addToWatchlist(code, name) {
    if (state.watchlist.some(function(w) { return w.code === code; })) {
      return;
    }

    state.watchlist.push({ code: code, name: name || code });
    saveWatchlist();
    
    // 埋点：添加自选
    if (typeof trackEvent === 'function') {
      trackEvent('fund_add', { watchlist_count: state.watchlist.length });
    }

    // 如果不在搜索模式，刷新自选列表
    if (!state.isSearchMode) {
      renderWatchlist();
    }
  }

  // 从自选移除
  function removeFromWatchlist(code) {
    state.watchlist = state.watchlist.filter(function(w) { return w.code !== code; });
    saveWatchlist();

    if (!state.isSearchMode) {
      renderWatchlist();
    }
  }

  // 渲染自选列表
  async function renderWatchlist() {
    if (state.isSearchMode) return;

    if (state.watchlist.length === 0) {
      els.watchlistTable.style.display = 'none';
      els.watchlistEmpty.classList.add('is-visible');
      return;
    }

    els.watchlistTable.style.display = 'table';
    els.watchlistEmpty.classList.remove('is-visible');

    // 显示加载状态
    els.watchlistBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)"><i class="ri-loader-4-line ri-spin" style="font-size:24px"></i></td></tr>';

    // 批量获取详情数据
    var funds = await Promise.all(
      state.watchlist.map(async function(item) {
        try {
          var res = await fetch(API_BASE + '/detail/' + item.code);
          return await res.json();
        } catch (e) {
          return { code: item.code, name: item.name, error: true };
        }
      })
    );

    renderWatchlistTable(funds, false);
  }

  // 渲染自选表格
  function renderWatchlistTable(funds, isSearch) {
    els.watchlistBody.innerHTML = funds.map(function(fund) {
      var isInWatchlist = state.watchlist.some(function(w) { return w.code === fund.code; });
      return renderTableRow(fund, isInWatchlist, isSearch, 'watchlist');
    }).join('');

    bindTableEvents('watchlist');
  }

  // 获取排行数据
  async function fetchRanking() {
    state.rankingPage = 1;
    state.rankingData = [];

    els.rankingLoading.classList.add('is-visible');
    els.rankingBody.innerHTML = '';

    try {
      var type = els.fundType.value;
      var sort = els.sortBy.value;
      var order = els.sortOrder.value;
      var res = await fetch(API_BASE + '/rank?type=' + type + '&sort=' + sort + '&order=' + order + '&page=1');
      var data = await res.json();

      state.rankingData = data.list || [];
      state.rankingTotal = data.total || 0;
      els.fundCount.textContent = '共 ' + state.rankingTotal + ' 只';

      els.rankingLoading.classList.remove('is-visible');
      renderRankingTable();
    } catch (e) {
      els.rankingLoading.classList.remove('is-visible');
      els.rankingBody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted)">加载失败，请重试</td></tr>';
    }
  }

  // 滚动加载更多
  function handleScroll() {
    var wrapper = els.rankingWrapper;
    var scrollTop = wrapper.scrollTop;
    var scrollHeight = wrapper.scrollHeight;
    var clientHeight = wrapper.clientHeight;

    // 距离底部 100px 时加载更多
    if (scrollHeight - scrollTop - clientHeight < 100 && !state.isLoadingMore) {
      loadMoreRanking();
    }
  }

  // 加载更多排行
  async function loadMoreRanking() {
    if (state.isLoadingMore) return;
    if (state.rankingData.length >= state.rankingTotal) return;

    state.isLoadingMore = true;
    state.rankingPage++;

    // 显示加载指示器
    els.loadMoreIndicator.classList.add('is-visible');

    try {
      var type = els.fundType.value;
      var sort = els.sortBy.value;
      var order = els.sortOrder.value;
      var res = await fetch(API_BASE + '/rank?type=' + type + '&sort=' + sort + '&order=' + order + '&page=' + state.rankingPage);
      var data = await res.json();

      if (data.list && data.list.length > 0) {
        state.rankingData = state.rankingData.concat(data.list);
        renderRankingTable();
      }
    } catch (e) {
      state.rankingPage--;
    }

    // 隐藏加载指示器
    els.loadMoreIndicator.classList.remove('is-visible');
    state.isLoadingMore = false;
  }

  // 渲染排行表格
  function renderRankingTable() {
    if (state.rankingData.length === 0) {
      els.rankingBody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-muted)">暂无数据</td></tr>';
      return;
    }

    els.rankingBody.innerHTML = state.rankingData.map(function(fund) {
      var isInWatchlist = state.watchlist.some(function(w) { return w.code === fund.code; });
      return renderTableRow(fund, isInWatchlist, false, 'ranking');
    }).join('');

    bindTableEvents('ranking');
  }

  // 渲染表格行
  function renderTableRow(fund, isInWatchlist, isSearch, tableType) {
    var change = parseFloat(fund.change) || parseFloat(fund.gszzl) || 0;
    var nav = fund.nav || fund.gsz || fund.dwjz || '--';

    var m1 = formatChange(fund.m1);
    var m3 = formatChange(fund.m3);
    var m6 = formatChange(fund.m6);
    var y1 = formatChange(fund.y1);

    var rowClass = isSearch ? 'is-search-result' : '';

    if (tableType === 'watchlist') {
      return '<tr class="' + rowClass + '" data-code="' + fund.code + '">' +
        '<td class="col-name"><span class="fund-name-text">' + escapeHtml(fund.name || fund.code) + '</span></td>' +
        '<td class="col-code">' + fund.code + '</td>' +
        '<td class="col-nav" style="text-align:right">' + nav + '</td>' +
        '<td class="col-change" style="text-align:right">' + formatChangeCell(change) + '</td>' +
        '<td class="col-m1" style="text-align:right">' + m1 + '</td>' +
        '<td class="col-m3" style="text-align:right">' + m3 + '</td>' +
        '<td class="col-y1" style="text-align:right">' + y1 + '</td>' +
        '<td class="col-action" style="text-align:center">' +
          '<button class="action-btn ' + (isInWatchlist ? 'is-active' : '') + '" data-action="' + (isInWatchlist ? 'remove' : 'add') + '" title="' + (isInWatchlist ? '移除自选' : '添加自选') + '">' +
            '<i class="ri-star-' + (isInWatchlist ? 'fill' : 'line') + '"></i>' +
          '</button>' +
        '</td>' +
      '</tr>';
    } else {
      return '<tr data-code="' + fund.code + '">' +
        '<td class="col-name"><span class="fund-name-text">' + escapeHtml(fund.name || fund.code) + '</span></td>' +
        '<td class="col-code">' + fund.code + '</td>' +
        '<td class="col-type"><span class="fund-type-tag">' + (fund.type || '--') + '</span></td>' +
        '<td class="col-nav" style="text-align:right">' + nav + '</td>' +
        '<td class="col-change" style="text-align:right">' + formatChangeCell(change) + '</td>' +
        '<td class="col-m1" style="text-align:right">' + m1 + '</td>' +
        '<td class="col-m3" style="text-align:right">' + m3 + '</td>' +
        '<td class="col-m6" style="text-align:right">' + m6 + '</td>' +
        '<td class="col-y1" style="text-align:right">' + y1 + '</td>' +
        '<td class="col-action" style="text-align:center">' +
          '<button class="action-btn ' + (isInWatchlist ? 'is-active' : '') + '" data-action="' + (isInWatchlist ? 'remove' : 'add') + '" title="' + (isInWatchlist ? '移除自选' : '添加自选') + '">' +
            '<i class="ri-star-' + (isInWatchlist ? 'fill' : 'line') + '"></i>' +
          '</button>' +
        '</td>' +
      '</tr>';
    }
  }

  // 格式化涨跌幅单元格
  function formatChangeCell(value) {
    var num = parseFloat(value) || 0;
    var cls = num >= 0 ? 'value-up' : 'value-down';
    var text = num >= 0 ? '+' + num.toFixed(2) + '%' : num.toFixed(2) + '%';
    return '<span class="' + cls + '">' + text + '</span>';
  }

  // 格式化涨跌幅
  function formatChange(value) {
    if (value === null || value === undefined || value === '--') return '--';
    var num = parseFloat(value) || 0;
    var cls = num >= 0 ? 'value-up' : 'value-down';
    var text = num >= 0 ? '+' + num.toFixed(2) + '%' : num.toFixed(2) + '%';
    return '<span class="' + cls + '">' + text + '</span>';
  }

  // 绑定表格事件
  function bindTableEvents(tableType) {
    var tbody = tableType === 'watchlist' ? els.watchlistBody : els.rankingBody;

    tbody.querySelectorAll('tr').forEach(function(row) {
      var btn = row.querySelector('.action-btn');
      if (btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var code = row.dataset.code;
          var name = row.querySelector('.fund-name-text').textContent;
          var action = btn.dataset.action;

          if (action === 'add') {
            addToWatchlist(code, name);
            btn.classList.add('is-active');
            btn.dataset.action = 'remove';
            btn.title = '移除自选';
            btn.innerHTML = '<i class="ri-star-fill"></i>';
          } else {
            removeFromWatchlist(code);
            btn.classList.remove('is-active');
            btn.dataset.action = 'add';
            btn.title = '添加自选';
            btn.innerHTML = '<i class="ri-star-line"></i>';
          }
        });
      }
    });
  }

  // HTML 转义
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // 启动
  init();
})();

// 新手引导
(function() {
  'use strict';
  
  // 页面加载完成后显示引导（从Supabase加载配置）
  if (typeof window.ToolsGuide !== 'undefined') {
    setTimeout(function() {
      window.ToolsGuide.show('fund-assistant');
    }, 300);
  }
})();
