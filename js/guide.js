// 新手引导组件
(function() {
    'use strict';
    
    // 创建引导弹窗
    function createGuideModal(config) {
        const modal = document.createElement('div');
        modal.className = 'guide-modal-overlay';
        modal.innerHTML = `
            <div class="guide-modal">
                <div class="guide-header">
                    <h3>${config.title}</h3>
                </div>
                <div class="guide-body">
                    ${config.image ? `<div class="guide-image"><img src="${config.image}" alt="引导图"></div>` : ''}
                    <div class="guide-content">${config.content}</div>
                    ${config.needsConfig ? '<div class="guide-alert">⚠️ 使用前请先配置 API Key</div>' : ''}
                </div>
                <div class="guide-footer">
                    <label class="guide-checkbox">
                        <input type="checkbox" id="guideDontShow">
                        <span>不再提醒</span>
                    </label>
                    <div class="guide-actions">
                        ${config.needsConfig ? '<button class="guide-btn primary" id="guideGoConfig">去配置</button>' : ''}
                        <button class="guide-btn ${config.needsConfig ? '' : 'primary'}" id="guideClose">
                            ${config.needsConfig ? '稍后' : '知道了'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    // 显示引导
    function showGuide(toolId, config) {
        // 检查是否需要显示
        if (!window.ToolsGuideManager.shouldShow(toolId)) {
            return;
        }
        
        const modal = createGuideModal(config);
        document.body.appendChild(modal);
        
        // 延迟显示动画
        setTimeout(() => modal.classList.add('is-visible'), 100);
        
        const closeBtn = modal.querySelector('#guideClose');
        const goConfigBtn = modal.querySelector('#guideGoConfig');
        const dontShowCheckbox = modal.querySelector('#guideDontShow');
        
        function closeGuide() {
            const dontShow = dontShowCheckbox ? dontShowCheckbox.checked : false;
            window.ToolsGuideManager.saveStatus(toolId, true, dontShow);
            
            modal.classList.remove('is-visible');
            setTimeout(() => modal.remove(), 300);
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeGuide);
        }
        
        if (goConfigBtn) {
            goConfigBtn.addEventListener('click', function() {
                closeGuide();
                if (window.openAPIConfig) {
                    window.openAPIConfig();
                }
            });
        }
    }
    
    // 重置引导（用于"重新查看"功能）
    function resetGuide(toolId) {
        window.ToolsGuideManager.reset(toolId);
    }
    
    // 暴露到全局
    window.ToolsGuide = {
        show: showGuide,
        reset: resetGuide
    };
    
})();

