// 新手引导组件（完全重新设计）
(function() {
    'use strict';
    
    let currentStep = 0;
    let totalSteps = 0;
    let guideSteps = [];
    let currentToolId = '';
    let modalElement = null;
    
    const GUIDE_STATUS_KEY = 'tools_guide_status';
    
    // 引导状态管理
    const GuideManager = {
        // 获取所有引导状态
        getAll: function() {
            try {
                const stored = localStorage.getItem(GUIDE_STATUS_KEY);
                return stored ? JSON.parse(stored) : {};
            } catch (e) {
                console.error('读取引导状态失败:', e);
                return {};
            }
        },
        
        // 保存引导状态
        saveStatus: function(toolId, hasShown, dontShowAgain) {
            try {
                const all = this.getAll();
                all[toolId] = {
                    hasShown: hasShown,
                    dontShowAgain: dontShowAgain || false,
                    lastShown: new Date().toISOString()
                };
                localStorage.setItem(GUIDE_STATUS_KEY, JSON.stringify(all));
            } catch (e) {
                console.error('保存引导状态失败:', e);
            }
        },
        
        // 检查是否应该显示引导
        shouldShow: function(toolId) {
            const all = this.getAll();
            const status = all[toolId];
            
            // 如果没有记录，应该显示
            if (!status) return true;
            
            // 如果用户选择了"不再提醒"，不显示
            if (status.dontShowAgain) return false;
            
            // 默认显示
            return true;
        },
        
        // 重置某个工具的引导状态
        reset: function(toolId) {
            try {
                const all = this.getAll();
                delete all[toolId];
                localStorage.setItem(GUIDE_STATUS_KEY, JSON.stringify(all));
            } catch (e) {
                console.error('重置引导状态失败:', e);
            }
        }
    };
    
    // 创建引导弹窗
    function createGuideModal(config) {
        const modal = document.createElement('div');
        modal.className = 'guide-overlay';
        
        // 判断是单步还是多步
        const isMultiStep = Array.isArray(config.steps) && config.steps.length > 1;
        guideSteps = isMultiStep ? config.steps : [config];
        totalSteps = guideSteps.length;
        currentStep = 0;
        
        modal.innerHTML = `
            <div class="guide-card">
                <button class="guide-close" aria-label="关闭">
                    <i class="ri-close-line"></i>
                </button>
                
                <div class="guide-content" id="guideContent"></div>
                
                <div class="guide-footer" id="guideFooter"></div>
                
                ${isMultiStep ? `
                <div class="guide-navigation">
                    <div class="guide-dots" id="guideDots"></div>
                </div>
                ` : ''}
            </div>
        `;
        
        return modal;
    }
    
    // 渲染当前步骤
    function renderStep(modal, step, isLast) {
        const contentEl = modal.querySelector('#guideContent');
        const footerEl = modal.querySelector('#guideFooter');
        const dotsEl = modal.querySelector('#guideDots');
        
        // 渲染内容
        let contentHTML = `
            <div class="guide-content-inner">
                ${step.title ? `<h3 class="guide-title">${step.title}</h3>` : ''}
                ${step.image ? `
                    <div class="guide-image">
                        <img src="${step.image}" alt="引导图片" loading="lazy" />
                    </div>
                ` : ''}
                <div class="guide-text">${step.content}</div>
            </div>
        `;
        
        contentEl.innerHTML = contentHTML;
        
        // 移除旧的切换按钮
        const oldPrevBtn = modal.querySelector('#guideContentPrev');
        const oldNextBtn = modal.querySelector('#guideContentNext');
        if (oldPrevBtn) oldPrevBtn.remove();
        if (oldNextBtn) oldNextBtn.remove();
        
        // 如果是多步引导，添加左右切换按钮到 .guide-card
        if (totalSteps > 1) {
            const cardEl = modal.querySelector('.guide-card');
            
            if (currentStep > 0) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'guide-content-nav prev';
                prevBtn.id = 'guideContentPrev';
                prevBtn.innerHTML = '<i class="ri-arrow-left-s-line"></i>';
                cardEl.appendChild(prevBtn);
            }
            
            if (currentStep < totalSteps - 1) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'guide-content-nav next';
                nextBtn.id = 'guideContentNext';
                nextBtn.innerHTML = '<i class="ri-arrow-right-s-line"></i>';
                cardEl.appendChild(nextBtn);
            }
        }
        
        // 绑定切换按钮
        const contentPrevBtn = modal.querySelector('#guideContentPrev');
        const contentNextBtn = modal.querySelector('#guideContentNext');
        
        if (contentPrevBtn) {
            contentPrevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (currentStep > 0) {
                    currentStep--;
                    renderStep(modal, guideSteps[currentStep], currentStep === totalSteps - 1);
                }
            });
        }
        
        if (contentNextBtn) {
            contentNextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (currentStep < totalSteps - 1) {
                    currentStep++;
                    renderStep(modal, guideSteps[currentStep], currentStep === totalSteps - 1);
                }
            });
        }
        
        // 渲染页码指示器（可点击）
        if (dotsEl) {
            let dotsHTML = '';
            for (let i = 0; i < totalSteps; i++) {
                dotsHTML += `<button class="guide-dot ${i === currentStep ? 'active' : ''}" data-step="${i}" aria-label="第 ${i + 1} 步"></button>`;
            }
            dotsEl.innerHTML = dotsHTML;
            
            // 绑定点击事件
            dotsEl.querySelectorAll('.guide-dot').forEach((dot, index) => {
                dot.addEventListener('click', function() {
                    currentStep = index;
                    renderStep(modal, guideSteps[currentStep], currentStep === totalSteps - 1);
                });
            });
        }
        
        // 渲染底部操作按钮
        let footerHTML = '';
        
        // 如果需要配置，显示"去配置"按钮
        if (step.needsConfig && isLast) {
            footerHTML += `
                <button class="guide-btn guide-btn-primary" id="guideGoConfig">
                    <i class="ri-settings-3-line"></i>
                    <span>去配置</span>
                </button>
            `;
        } else if (isLast) {
            // 最后一页且不需要配置，显示"知道了"
            footerHTML += `
                <button class="guide-btn guide-btn-primary" id="guideFinish">
                    <i class="ri-check-line"></i>
                    <span>知道了</span>
                </button>
            `;
        }
        
        footerEl.innerHTML = footerHTML;
        
        // 绑定事件
        bindStepEvents(modal, step, isLast);
    }
    
    // 绑定步骤事件
    function bindStepEvents(modal, step, isLast) {
        const prevBtn = modal.querySelector('#guidePrev');
        const nextBtn = modal.querySelector('#guideNext');
        const finishBtn = modal.querySelector('#guideFinish');
        const goConfigBtn = modal.querySelector('#guideGoConfig');
        
        function closeGuide() {
            GuideManager.saveStatus(currentToolId, true, false);
            
            modal.classList.remove('is-visible');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
        
        // 移除旧的事件监听器（如果存在）
        if (prevBtn) {
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            newPrevBtn.addEventListener('click', function() {
                if (currentStep > 0) {
                    currentStep--;
                    renderStep(modal, guideSteps[currentStep], currentStep === totalSteps - 1);
                }
            });
        }
        
        if (nextBtn) {
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            newNextBtn.addEventListener('click', function() {
                if (currentStep < totalSteps - 1) {
                    currentStep++;
                    renderStep(modal, guideSteps[currentStep], currentStep === totalSteps - 1);
                }
            });
        }
        
        if (finishBtn) {
            finishBtn.addEventListener('click', closeGuide);
        }
        
        if (goConfigBtn) {
            goConfigBtn.addEventListener('click', function() {
                closeGuide();
                // 延迟打开配置，确保引导已关闭
                setTimeout(() => {
                    if (window.openAPIConfig) {
                        window.openAPIConfig();
                    }
                }, 350);
            });
        }
    }
    
    // 显示引导（立即显示，无延迟）
    function showGuide(toolId, config) {
        currentToolId = toolId;
        
        // 单步引导才检查是否需要显示
        if (!Array.isArray(config.steps) && !GuideManager.shouldShow(toolId)) {
            return;
        }
        
        const modal = createGuideModal(config);
        document.body.appendChild(modal);
        modalElement = modal;
        
        // 使用事件委托绑定关闭按钮
        modal.addEventListener('click', function(e) {
            // 点击关闭按钮或其子元素
            if (e.target.closest('.guide-close')) {
                GuideManager.saveStatus(currentToolId, true, false);
                
                modal.classList.remove('is-visible');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        });
        
        // 渲染第一步
        const firstStep = Array.isArray(config.steps) ? config.steps[0] : config;
        const isLast = totalSteps === 1;
        renderStep(modal, firstStep, isLast);
        
        // 立即显示（无延迟）
        requestAnimationFrame(() => {
            modal.classList.add('is-visible');
        });
    }
    
    // 重置引导（用于"重新查看"功能）
    function resetGuide(toolId) {
        GuideManager.reset(toolId);
    }
    
    // 暴露到全局
    window.ToolsGuide = {
        show: showGuide,
        reset: resetGuide
    };
    
})();
