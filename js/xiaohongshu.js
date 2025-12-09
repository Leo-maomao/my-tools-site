/**
 * 小红书内容生成器
 */
(function() {
    'use strict';

    // IndexedDB 存储模块
    var Storage = {
        dbName: 'weMediaDB',
        storeName: 'templates',
        db: null,

        init: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                var request = indexedDB.open(self.dbName, 1);

                request.onerror = function() {
                    console.error('IndexedDB 打开失败');
                    reject(request.error);
                };

                request.onsuccess = function() {
                    self.db = request.result;
                    resolve();
                };

                request.onupgradeneeded = function(e) {
                    var db = e.target.result;
                    if (!db.objectStoreNames.contains(self.storeName)) {
                        db.createObjectStore(self.storeName, { keyPath: 'id' });
                    }
                };
            });
        },

        save: function(id, imageData) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                var tx = self.db.transaction(self.storeName, 'readwrite');
                var store = tx.objectStore(self.storeName);
                var request = store.put({ id: id, data: imageData, timestamp: Date.now() });

                request.onsuccess = function() { resolve(); };
                request.onerror = function() { reject(request.error); };
            });
        },

        get: function(id) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                var tx = self.db.transaction(self.storeName, 'readonly');
                var store = tx.objectStore(self.storeName);
                var request = store.get(id);

                request.onsuccess = function() {
                    resolve(request.result ? request.result.data : null);
                };
                request.onerror = function() { reject(request.error); };
            });
        },

        remove: function(id) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.db) {
                    reject(new Error('数据库未初始化'));
                    return;
                }
                var tx = self.db.transaction(self.storeName, 'readwrite');
                var store = tx.objectStore(self.storeName);
                var request = store.delete(id);

                request.onsuccess = function() { resolve(); };
                request.onerror = function() { reject(request.error); };
            });
        }
    };

    // 配置参数（根据模板图片分析）
    var CONFIG = {
        // 图片尺寸
        imageWidth: 1080,
        imageHeight: 1440,

        // 封面图标题配置
        cover: {
            titleX: 540,           // 标题X坐标（居中）
            titleY: 420,           // 标题Y起始坐标
            titleMaxWidth: 900,    // 标题最大宽度
            titleFontSize: 64,     // 标题字号
            titleLineHeight: 1.4,  // 标题行高
            titleColor: '#8B4513', // 标题颜色（棕色）
            titleStroke: '#FFFFFF', // 标题描边颜色
            titleStrokeWidth: 4,   // 描边宽度
            titleFont: 'bold {size}px "PingFang SC", "Microsoft YaHei", sans-serif'
        },

        // 背景图正文配置
        content: {
            textX: 70,             // 文字区域左边距
            textY: 130,            // 文字区域顶部距离
            textWidth: 940,        // 文字区域宽度 (1080 - 70*2)
            textHeight: 980,       // 文字区域高度
            fontSize: 36,          // 正文字号
            lineHeight: 1.7,       // 行高
            paragraphSpacing: 24,  // 段落间距
            textColor: '#333333',  // 文字颜色
            textFont: '{size}px "PingFang SC", "Microsoft YaHei", sans-serif'
        }
    };

    // DOM 元素
    var elements = {
        // 封面图
        coverUploadArea: document.getElementById('coverUploadArea'),
        coverTemplateInput: document.getElementById('coverTemplateInput'),
        coverPlaceholder: document.getElementById('coverPlaceholder'),
        coverPreviewImg: document.getElementById('coverPreviewImg'),
        coverRefUploadArea: document.getElementById('coverRefUploadArea'),
        coverRefInput: document.getElementById('coverRefInput'),
        coverRefPlaceholder: document.getElementById('coverRefPlaceholder'),
        coverRefPreviewImg: document.getElementById('coverRefPreviewImg'),
        coverTitle: document.getElementById('coverTitle'),
        markCoverArea: document.getElementById('markCoverArea'),
        coverAreaInfo: document.getElementById('coverAreaInfo'),

        // 背景图
        bgUploadArea: document.getElementById('bgUploadArea'),
        bgTemplateInput: document.getElementById('bgTemplateInput'),
        bgPlaceholder: document.getElementById('bgPlaceholder'),
        bgPreviewImg: document.getElementById('bgPreviewImg'),
        bgRefUploadArea: document.getElementById('bgRefUploadArea'),
        bgRefInput: document.getElementById('bgRefInput'),
        bgRefPlaceholder: document.getElementById('bgRefPlaceholder'),
        bgRefPreviewImg: document.getElementById('bgRefPreviewImg'),
        contentText: document.getElementById('contentText'),
        contentCharCount: document.getElementById('contentCharCount'),
        markBgArea: document.getElementById('markBgArea'),
        bgAreaInfo: document.getElementById('bgAreaInfo'),

        // 发布信息
        xhsTitle: document.getElementById('xhsTitle'),
        xhsDesc: document.getElementById('xhsDesc'),
        customTopic: document.getElementById('customTopic'),

        // 按钮
        generateBtn: document.getElementById('generateBtn'),
        downloadAllBtn: document.getElementById('downloadAllBtn'),

        // 预览
        previewContainer: document.getElementById('previewContainer'),
        copySection: document.getElementById('copySection'),
        copyTitle: document.getElementById('copyTitle'),
        copyDesc: document.getElementById('copyDesc'),
        copyTopics: document.getElementById('copyTopics'),

        // Canvas
        canvas: document.getElementById('renderCanvas')
    };

    // 状态
    var state = {
        coverTemplate: null,  // 封面模板图片（用于生成）
        coverTemplateData: null, // 封面模板 base64
        coverRef: null,       // 封面参考图（用于标记区域）
        coverRefData: null,   // 封面参考图 base64
        bgTemplate: null,     // 背景模板图片（用于生成）
        bgTemplateData: null, // 背景模板 base64
        bgRef: null,          // 背景参考图（用于标记区域）
        bgRefData: null,      // 背景参考图 base64
        generatedImages: [],  // 生成的图片
        // 用户标记的区域（相对于原图的比例）
        coverArea: null,      // { x, y, width, height } 比例值 0-1
        bgArea: null          // { x, y, width, height } 比例值 0-1
    };

    // 初始化
    function init() {
        bindEvents();
        initFullscreen();
        initAreaMarker();

        // 初始化 IndexedDB 并恢复已保存的模板
        Storage.init().then(function() {
            loadSavedTemplates();
            loadSavedAreas();
        }).catch(function(err) {
            console.error('存储初始化失败:', err);
        });
    }

    // 加载已保存的区域
    function loadSavedAreas() {
        Storage.get('xhs_cover_area').then(function(data) {
            if (data) {
                state.coverArea = data;
                elements.coverAreaInfo.style.display = 'flex';
            }
        });
        Storage.get('xhs_bg_area').then(function(data) {
            if (data) {
                state.bgArea = data;
                elements.bgAreaInfo.style.display = 'flex';
            }
        });
    }

    // 加载已保存的模板
    function loadSavedTemplates() {
        // 加载封面模板
        Storage.get('xhs_cover_template').then(function(data) {
            if (data) {
                loadImageFromData(data, 'cover');
            }
        });

        // 加载背景模板
        Storage.get('xhs_bg_template').then(function(data) {
            if (data) {
                loadImageFromData(data, 'bg');
            }
        });
    }

    // 绑定事件
    function bindEvents() {
        // 封面模板上传
        elements.coverUploadArea.addEventListener('click', function() {
            elements.coverTemplateInput.click();
        });
        elements.coverTemplateInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'cover');
        });

        // 封面参考图上传
        if (elements.coverRefUploadArea) {
            elements.coverRefUploadArea.addEventListener('click', function() {
                elements.coverRefInput.click();
            });
            elements.coverRefInput.addEventListener('change', function(e) {
                handleImageUpload(e, 'coverRef');
            });
        }

        // 背景模板上传
        elements.bgUploadArea.addEventListener('click', function() {
            elements.bgTemplateInput.click();
        });
        elements.bgTemplateInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'bg');
        });

        // 背景参考图上传
        if (elements.bgRefUploadArea) {
            elements.bgRefUploadArea.addEventListener('click', function() {
                elements.bgRefInput.click();
            });
            elements.bgRefInput.addEventListener('change', function(e) {
                handleImageUpload(e, 'bgRef');
            });
        }

        // 正文字数统计
        elements.contentText.addEventListener('input', function() {
            var count = this.value.length;
            elements.contentCharCount.textContent = count + ' 字';
        });

        // 生成按钮
        elements.generateBtn.addEventListener('click', generateImages);

        // 下载全部
        elements.downloadAllBtn.addEventListener('click', downloadAllImages);

        // 复制按钮
        document.querySelectorAll('.btn-copy').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = this.getAttribute('data-target');
                copyToClipboard(targetId, this);
            });
        });

        // 标记区域按钮
        elements.markCoverArea.addEventListener('click', function(e) {
            e.stopPropagation();
            openAreaMarker('cover');
        });
        elements.markBgArea.addEventListener('click', function(e) {
            e.stopPropagation();
            openAreaMarker('bg');
        });
    }

    // 处理图片上传
    function handleImageUpload(e, type) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(event) {
            var imageData = event.target.result;
            loadImageFromData(imageData, type);

            // 保存到 IndexedDB
            var storageKey = 'xhs_' + type + '_template';
            Storage.save(storageKey, imageData).then(function() {
                console.log('模板已保存到本地');
            }).catch(function(err) {
                console.error('保存失败:', err);
            });
        };
        reader.readAsDataURL(file);
    }

    // 从 base64 数据加载图片
    function loadImageFromData(imageData, type) {
        var img = new Image();
        img.onload = function() {
            if (type === 'cover') {
                state.coverTemplate = img;
                state.coverTemplateData = imageData;
                elements.coverPreviewImg.src = imageData;
                elements.coverPreviewImg.style.display = 'block';
                elements.coverPlaceholder.style.display = 'none';
                elements.coverUploadArea.classList.add('has-image');
            } else if (type === 'coverRef') {
                state.coverRef = img;
                state.coverRefData = imageData;
                if (elements.coverRefPreviewImg) {
                    elements.coverRefPreviewImg.src = imageData;
                    elements.coverRefPreviewImg.style.display = 'block';
                    elements.coverRefPlaceholder.style.display = 'none';
                    elements.coverRefUploadArea.classList.add('has-image');
                    elements.markCoverArea.style.display = 'flex';
                }
            } else if (type === 'bg') {
                state.bgTemplate = img;
                state.bgTemplateData = imageData;
                elements.bgPreviewImg.src = imageData;
                elements.bgPreviewImg.style.display = 'block';
                elements.bgPlaceholder.style.display = 'none';
                elements.bgUploadArea.classList.add('has-image');
            } else if (type === 'bgRef') {
                state.bgRef = img;
                state.bgRefData = imageData;
                if (elements.bgRefPreviewImg) {
                    elements.bgRefPreviewImg.src = imageData;
                    elements.bgRefPreviewImg.style.display = 'block';
                    elements.bgRefPlaceholder.style.display = 'none';
                    elements.bgRefUploadArea.classList.add('has-image');
                    elements.markBgArea.style.display = 'flex';
                }
            }
        };
        img.src = imageData;
    }

    // 获取用户输入的话题
    function getUserTopics() {
        var topics = elements.customTopic.value.trim();
        return topics ? topics.split(/\s+/).filter(function(t) { return t.startsWith('#'); }) : [];
    }

    // 生成图片
    function generateImages() {
        var coverTitle = elements.coverTitle.value.trim();
        var contentText = elements.contentText.value.trim();

        if (!state.coverTemplate && !state.bgTemplate) {
            alert('请至少上传一个模板图片');
            return;
        }

        state.generatedImages = [];
        elements.previewContainer.innerHTML = '';

        // 生成封面图
        if (state.coverTemplate && coverTitle) {
            var coverImage = generateCoverImage(coverTitle);
            state.generatedImages.push({ type: 'cover', data: coverImage, name: '封面图' });
        }

        // 生成正文图
        if (state.bgTemplate && contentText) {
            var contentImages = generateContentImages(contentText);
            contentImages.forEach(function(img, index) {
                state.generatedImages.push({
                    type: 'content',
                    data: img,
                    name: '正文图 ' + (index + 1)
                });
            });
        }

        // 显示预览
        renderPreview();

        // 更新复制区域
        updateCopySection();

        // 启用下载按钮
        elements.downloadAllBtn.disabled = state.generatedImages.length === 0;
    }

    // 生成封面图
    function generateCoverImage(title) {
        var canvas = elements.canvas;
        var ctx = canvas.getContext('2d');
        var cfg = CONFIG.cover;

        // 设置画布尺寸
        canvas.width = state.coverTemplate.width || CONFIG.imageWidth;
        canvas.height = state.coverTemplate.height || CONFIG.imageHeight;

        // 绘制背景图
        ctx.drawImage(state.coverTemplate, 0, 0, canvas.width, canvas.height);

        // 获取标题区域（用户标记的或默认的）
        var area;
        if (state.coverArea) {
            area = {
                x: state.coverArea.x * canvas.width,
                y: state.coverArea.y * canvas.height,
                width: state.coverArea.width * canvas.width,
                height: state.coverArea.height * canvas.height
            };
        } else {
            // 默认区域
            area = {
                x: canvas.width * 0.1,
                y: canvas.height * 0.25,
                width: canvas.width * 0.8,
                height: canvas.height * 0.4
            };
        }

        // 动态计算字号以填满区域
        var fontSize = calculateOptimalFontSize(ctx, title, area.width, area.height, cfg);
        ctx.font = cfg.titleFont.replace('{size}', fontSize);

        // 设置文字样式
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // 文字换行处理
        var lines = wrapText(ctx, title, area.width);
        var lineHeight = fontSize * cfg.titleLineHeight;
        var totalTextHeight = lines.length * lineHeight;

        // 垂直居中
        var startY = area.y + (area.height - totalTextHeight) / 2;
        var centerX = area.x + area.width / 2;

        // 绘制文字（描边 + 填充）
        lines.forEach(function(line, index) {
            var y = startY + index * lineHeight;

            // 描边
            ctx.strokeStyle = cfg.titleStroke;
            ctx.lineWidth = Math.max(2, fontSize / 16);
            ctx.lineJoin = 'round';
            ctx.strokeText(line, centerX, y);

            // 填充
            ctx.fillStyle = cfg.titleColor;
            ctx.fillText(line, centerX, y);
        });

        return canvas.toDataURL('image/png');
    }

    // 计算最优字号以填满区域
    function calculateOptimalFontSize(ctx, text, maxWidth, maxHeight, cfg) {
        var minSize = 24;
        var maxSize = 200;
        var optimalSize = minSize;

        for (var size = maxSize; size >= minSize; size -= 4) {
            ctx.font = cfg.titleFont.replace('{size}', size);
            var lines = wrapText(ctx, text, maxWidth);
            var lineHeight = size * cfg.titleLineHeight;
            var totalHeight = lines.length * lineHeight;

            if (totalHeight <= maxHeight) {
                optimalSize = size;
                break;
            }
        }

        return optimalSize;
    }

    // 生成正文图（自动分页）
    function generateContentImages(text) {
        var canvas = elements.canvas;
        var ctx = canvas.getContext('2d');
        var cfg = CONFIG.content;

        // 设置画布尺寸
        canvas.width = state.bgTemplate.width || CONFIG.imageWidth;
        canvas.height = state.bgTemplate.height || CONFIG.imageHeight;

        // 获取正文区域（用户标记的或默认的）
        var textX, textY, textWidth, textHeight;
        if (state.bgArea) {
            textX = state.bgArea.x * canvas.width;
            textY = state.bgArea.y * canvas.height;
            textWidth = state.bgArea.width * canvas.width;
            textHeight = state.bgArea.height * canvas.height;
        } else {
            // 默认区域
            var scale = canvas.width / CONFIG.imageWidth;
            textX = cfg.textX * scale;
            textY = cfg.textY * scale;
            textWidth = cfg.textWidth * scale;
            textHeight = cfg.textHeight * scale;
        }

        // 字体大小根据区域自适应
        var fontSize = Math.min(textWidth / 20, textHeight / 25, 40);
        var lineHeight = fontSize * cfg.lineHeight;
        var paragraphSpacing = fontSize * 0.6;

        // 设置文字样式
        ctx.font = cfg.textFont.replace('{size}', fontSize);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = cfg.textColor;

        // 分割段落
        var paragraphs = text.split(/\n+/);
        var allLines = [];

        paragraphs.forEach(function(para, pIndex) {
            var lines = wrapText(ctx, para, textWidth);
            lines.forEach(function(line, lIndex) {
                allLines.push({
                    text: line,
                    isLastOfParagraph: lIndex === lines.length - 1 && pIndex < paragraphs.length - 1
                });
            });
        });

        // 计算每页能放多少行
        var linesPerPage = Math.floor(textHeight / lineHeight);
        var images = [];
        var currentLine = 0;

        while (currentLine < allLines.length) {
            // 绘制背景
            ctx.drawImage(state.bgTemplate, 0, 0, canvas.width, canvas.height);

            // 绘制本页文字
            var y = textY;
            var linesOnThisPage = 0;

            while (currentLine < allLines.length && linesOnThisPage < linesPerPage) {
                var lineObj = allLines[currentLine];
                ctx.fillText(lineObj.text, textX, y);

                y += lineHeight;
                if (lineObj.isLastOfParagraph) {
                    y += paragraphSpacing;
                    // 检查是否还有空间放下一段
                    if (y + lineHeight > textY + textHeight) {
                        currentLine++;
                        break;
                    }
                }

                currentLine++;
                linesOnThisPage++;
            }

            images.push(canvas.toDataURL('image/png'));
        }

        return images;
    }

    // 文字换行处理
    function wrapText(ctx, text, maxWidth) {
        var lines = [];
        var currentLine = '';

        for (var i = 0; i < text.length; i++) {
            var char = text[i];
            var testLine = currentLine + char;
            var metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // 渲染预览（小图模式）
    function renderPreview() {
        if (state.generatedImages.length === 0) {
            elements.previewContainer.innerHTML = '<div class="preview-empty"><i class="ri-image-2-line"></i><p>上传模板并输入内容后<br>点击"生成图片"查看预览</p></div>';
            return;
        }

        var html = '<div class="preview-grid">';
        state.generatedImages.forEach(function(img, index) {
            html += '<div class="preview-thumb" data-index="' + index + '">';
            html += '  <img src="' + img.data + '" alt="' + img.name + '">';
            html += '  <span class="preview-thumb-label">' + img.name + '</span>';
            html += '  <button class="preview-thumb-zoom" title="查看大图">';
            html += '    <i class="ri-fullscreen-line"></i>';
            html += '  </button>';
            html += '</div>';
        });
        html += '</div>';

        elements.previewContainer.innerHTML = html;

        // 绑定点击预览事件
        elements.previewContainer.querySelectorAll('.preview-thumb').forEach(function(thumb) {
            thumb.addEventListener('click', function() {
                var index = parseInt(this.getAttribute('data-index'));
                openFullscreen(index);
            });
        });
    }

    // 区域标记相关
    var areaMarkerState = {
        modal: null,
        canvas: null,
        ctx: null,
        selection: null,
        confirmBtn: null,
        type: null, // 'cover' or 'bg'
        isDrawing: false,
        startX: 0,
        startY: 0,
        rect: null,
        canvasRect: null,
        scale: 1
    };

    function initAreaMarker() {
        areaMarkerState.modal = document.getElementById('areaMarkerModal');
        areaMarkerState.canvas = document.getElementById('areaMarkerCanvas');
        areaMarkerState.ctx = areaMarkerState.canvas.getContext('2d');
        areaMarkerState.selection = document.getElementById('areaSelection');
        areaMarkerState.confirmBtn = document.getElementById('areaMarkerConfirm');

        var canvasWrap = document.querySelector('.area-marker-canvas-wrap');

        // 鼠标按下开始绘制
        canvasWrap.addEventListener('mousedown', function(e) {
            if (e.target !== areaMarkerState.canvas) return;
            areaMarkerState.isDrawing = true;
            areaMarkerState.canvasRect = areaMarkerState.canvas.getBoundingClientRect();
            areaMarkerState.startX = e.clientX - areaMarkerState.canvasRect.left;
            areaMarkerState.startY = e.clientY - areaMarkerState.canvasRect.top;
            areaMarkerState.selection.classList.add('is-active');
        });

        // 鼠标移动更新选区
        canvasWrap.addEventListener('mousemove', function(e) {
            if (!areaMarkerState.isDrawing) return;
            var currentX = e.clientX - areaMarkerState.canvasRect.left;
            var currentY = e.clientY - areaMarkerState.canvasRect.top;

            var x = Math.min(areaMarkerState.startX, currentX);
            var y = Math.min(areaMarkerState.startY, currentY);
            var width = Math.abs(currentX - areaMarkerState.startX);
            var height = Math.abs(currentY - areaMarkerState.startY);

            // 限制在画布内
            x = Math.max(0, x);
            y = Math.max(0, y);
            width = Math.min(width, areaMarkerState.canvasRect.width - x);
            height = Math.min(height, areaMarkerState.canvasRect.height - y);

            areaMarkerState.rect = { x: x, y: y, width: width, height: height };
            updateSelectionDisplay();
        });

        // 鼠标松开结束绘制
        canvasWrap.addEventListener('mouseup', function() {
            if (!areaMarkerState.isDrawing) return;
            areaMarkerState.isDrawing = false;
            if (areaMarkerState.rect && areaMarkerState.rect.width > 10 && areaMarkerState.rect.height > 10) {
                areaMarkerState.confirmBtn.disabled = false;
            }
        });

        // 取消按钮
        document.getElementById('areaMarkerCancel').addEventListener('click', closeAreaMarker);

        // 确认按钮
        areaMarkerState.confirmBtn.addEventListener('click', confirmAreaMarker);

        // 背景点击关闭
        document.querySelector('.area-marker-backdrop').addEventListener('click', closeAreaMarker);
    }

    function updateSelectionDisplay() {
        if (!areaMarkerState.rect) return;
        var r = areaMarkerState.rect;
        var canvasRect = areaMarkerState.canvasRect;
        var wrapRect = document.querySelector('.area-marker-canvas-wrap').getBoundingClientRect();

        // 计算 selection 相对于 wrap 的位置
        var offsetX = canvasRect.left - wrapRect.left;
        var offsetY = canvasRect.top - wrapRect.top;

        areaMarkerState.selection.style.left = (offsetX + r.x) + 'px';
        areaMarkerState.selection.style.top = (offsetY + r.y) + 'px';
        areaMarkerState.selection.style.width = r.width + 'px';
        areaMarkerState.selection.style.height = r.height + 'px';
    }

    function openAreaMarker(type) {
        areaMarkerState.type = type;
        areaMarkerState.rect = null;
        areaMarkerState.selection.classList.remove('is-active');
        areaMarkerState.confirmBtn.disabled = true;

        // 设置标题
        var title = type === 'cover' ? '标记标题区域' : '标记正文区域';
        document.getElementById('areaMarkerTitle').textContent = title;

        // 绘制图片到 canvas（优先使用参考图，否则使用模板图）
        var img = type === 'cover'
            ? (state.coverRef || state.coverTemplate)
            : (state.bgRef || state.bgTemplate);
        if (!img) return;

        // 计算缩放后的尺寸，使图片适应屏幕
        var maxWidth = window.innerWidth * 0.8;
        var maxHeight = window.innerHeight * 0.6;
        var scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        areaMarkerState.scale = scale;

        areaMarkerState.canvas.width = img.width * scale;
        areaMarkerState.canvas.height = img.height * scale;
        areaMarkerState.ctx.drawImage(img, 0, 0, areaMarkerState.canvas.width, areaMarkerState.canvas.height);

        areaMarkerState.modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeAreaMarker() {
        areaMarkerState.modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function confirmAreaMarker() {
        if (!areaMarkerState.rect) return;

        var r = areaMarkerState.rect;
        var scale = areaMarkerState.scale;
        var img = areaMarkerState.type === 'cover' ? state.coverTemplate : state.bgTemplate;

        // 转换为相对于原图的比例值
        var area = {
            x: r.x / scale / img.width,
            y: r.y / scale / img.height,
            width: r.width / scale / img.width,
            height: r.height / scale / img.height
        };

        if (areaMarkerState.type === 'cover') {
            state.coverArea = area;
            elements.coverAreaInfo.style.display = 'flex';
            Storage.save('xhs_cover_area', area);
        } else {
            state.bgArea = area;
            elements.bgAreaInfo.style.display = 'flex';
            Storage.save('xhs_bg_area', area);
        }

        closeAreaMarker();
    }

    // 全屏预览相关
    var fullscreenState = {
        currentIndex: 0,
        modal: null,
        img: null,
        info: null
    };

    function initFullscreen() {
        fullscreenState.modal = document.getElementById('fullscreenModal');
        fullscreenState.img = document.getElementById('fullscreenImg');
        fullscreenState.info = document.getElementById('fullscreenInfo');

        // 关闭按钮
        document.getElementById('fullscreenClose').addEventListener('click', closeFullscreen);

        // 背景点击关闭
        document.querySelector('.fullscreen-backdrop').addEventListener('click', closeFullscreen);

        // 上一张/下一张
        document.getElementById('fullscreenPrev').addEventListener('click', function(e) {
            e.stopPropagation();
            showPrevImage();
        });
        document.getElementById('fullscreenNext').addEventListener('click', function(e) {
            e.stopPropagation();
            showNextImage();
        });

        // 键盘导航
        document.addEventListener('keydown', function(e) {
            if (!fullscreenState.modal.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeFullscreen();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        });
    }

    function openFullscreen(index) {
        fullscreenState.currentIndex = index;
        updateFullscreenImage();
        fullscreenState.modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeFullscreen() {
        fullscreenState.modal.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    function updateFullscreenImage() {
        var img = state.generatedImages[fullscreenState.currentIndex];
        fullscreenState.img.src = img.data;
        fullscreenState.info.textContent = (fullscreenState.currentIndex + 1) + ' / ' + state.generatedImages.length;
    }

    function showPrevImage() {
        if (state.generatedImages.length <= 1) return;
        fullscreenState.currentIndex = (fullscreenState.currentIndex - 1 + state.generatedImages.length) % state.generatedImages.length;
        updateFullscreenImage();
    }

    function showNextImage() {
        if (state.generatedImages.length <= 1) return;
        fullscreenState.currentIndex = (fullscreenState.currentIndex + 1) % state.generatedImages.length;
        updateFullscreenImage();
    }

    // 更新复制区域
    function updateCopySection() {
        elements.copySection.style.display = 'block';

        // 标题
        var title = elements.xhsTitle.value.trim() || elements.coverTitle.value.trim() || '-';
        elements.copyTitle.textContent = title;

        // 正文描述
        var desc = elements.xhsDesc.value.trim() || '-';
        elements.copyDesc.textContent = desc;

        // 话题
        var topics = getUserTopics();
        elements.copyTopics.textContent = topics.length > 0 ? topics.join(' ') : '-';
    }

    // 下载单张图片
    function downloadImage(img) {
        var link = document.createElement('a');
        link.download = img.name + '.png';
        link.href = img.data;
        link.click();
    }

    // 下载全部图片
    function downloadAllImages() {
        state.generatedImages.forEach(function(img, index) {
            setTimeout(function() {
                downloadImage(img);
            }, index * 300); // 间隔下载，避免浏览器阻止
        });
    }

    // 复制到剪贴板
    function copyToClipboard(targetId, btn) {
        var content = document.getElementById(targetId).textContent;
        if (content === '-') return;

        navigator.clipboard.writeText(content).then(function() {
            btn.classList.add('copied');
            var icon = btn.querySelector('i');
            icon.className = 'ri-check-line';

            setTimeout(function() {
                btn.classList.remove('copied');
                icon.className = 'ri-file-copy-line';
            }, 2000);
        });
    }

    // 启动
    init();
})();
