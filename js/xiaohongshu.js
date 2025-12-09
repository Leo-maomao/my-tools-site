/**
 * 小红书内容生成器
 */
(function() {
    'use strict';

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
        coverTitle: document.getElementById('coverTitle'),

        // 背景图
        bgUploadArea: document.getElementById('bgUploadArea'),
        bgTemplateInput: document.getElementById('bgTemplateInput'),
        bgPlaceholder: document.getElementById('bgPlaceholder'),
        bgPreviewImg: document.getElementById('bgPreviewImg'),
        contentText: document.getElementById('contentText'),
        contentCharCount: document.getElementById('contentCharCount'),

        // 发布信息
        xhsTitle: document.getElementById('xhsTitle'),
        xhsDesc: document.getElementById('xhsDesc'),
        topicTags: document.getElementById('topicTags'),
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
        coverTemplate: null,  // 封面模板图片
        bgTemplate: null,     // 背景模板图片
        generatedImages: [],  // 生成的图片
        selectedTopics: []    // 选中的话题
    };

    // 初始化
    function init() {
        bindEvents();
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

        // 背景模板上传
        elements.bgUploadArea.addEventListener('click', function() {
            elements.bgTemplateInput.click();
        });
        elements.bgTemplateInput.addEventListener('change', function(e) {
            handleImageUpload(e, 'bg');
        });

        // 正文字数统计
        elements.contentText.addEventListener('input', function() {
            var count = this.value.length;
            elements.contentCharCount.textContent = count + ' 字';
        });

        // 话题选择
        elements.topicTags.addEventListener('click', function(e) {
            var tag = e.target.closest('.topic-tag');
            if (tag) {
                tag.classList.toggle('is-selected');
                updateSelectedTopics();
            }
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
    }

    // 处理图片上传
    function handleImageUpload(e, type) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function(event) {
            var img = new Image();
            img.onload = function() {
                if (type === 'cover') {
                    state.coverTemplate = img;
                    elements.coverPreviewImg.src = event.target.result;
                    elements.coverPreviewImg.style.display = 'block';
                    elements.coverPlaceholder.style.display = 'none';
                    elements.coverUploadArea.classList.add('has-image');
                } else {
                    state.bgTemplate = img;
                    elements.bgPreviewImg.src = event.target.result;
                    elements.bgPreviewImg.style.display = 'block';
                    elements.bgPlaceholder.style.display = 'none';
                    elements.bgUploadArea.classList.add('has-image');
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 更新选中的话题
    function updateSelectedTopics() {
        state.selectedTopics = [];
        document.querySelectorAll('.topic-tag.is-selected').forEach(function(tag) {
            state.selectedTopics.push(tag.getAttribute('data-topic'));
        });
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

        // 设置文字样式
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        var fontSize = cfg.titleFontSize * (canvas.width / CONFIG.imageWidth);
        ctx.font = cfg.titleFont.replace('{size}', fontSize);

        // 文字换行处理
        var lines = wrapText(ctx, title, cfg.titleMaxWidth * (canvas.width / CONFIG.imageWidth));
        var lineHeight = fontSize * cfg.titleLineHeight;
        var startY = cfg.titleY * (canvas.height / CONFIG.imageHeight);

        // 绘制文字（描边 + 填充）
        lines.forEach(function(line, index) {
            var y = startY + index * lineHeight;

            // 描边
            ctx.strokeStyle = cfg.titleStroke;
            ctx.lineWidth = cfg.titleStrokeWidth;
            ctx.lineJoin = 'round';
            ctx.strokeText(line, canvas.width / 2, y);

            // 填充
            ctx.fillStyle = cfg.titleColor;
            ctx.fillText(line, canvas.width / 2, y);
        });

        return canvas.toDataURL('image/png');
    }

    // 生成正文图（自动分页）
    function generateContentImages(text) {
        var canvas = elements.canvas;
        var ctx = canvas.getContext('2d');
        var cfg = CONFIG.content;

        // 设置画布尺寸
        canvas.width = state.bgTemplate.width || CONFIG.imageWidth;
        canvas.height = state.bgTemplate.height || CONFIG.imageHeight;

        // 计算缩放比例
        var scale = canvas.width / CONFIG.imageWidth;
        var textX = cfg.textX * scale;
        var textY = cfg.textY * scale;
        var textWidth = cfg.textWidth * scale;
        var textHeight = cfg.textHeight * scale;
        var fontSize = cfg.fontSize * scale;
        var lineHeight = fontSize * cfg.lineHeight;
        var paragraphSpacing = cfg.paragraphSpacing * scale;

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

    // 渲染预览
    function renderPreview() {
        if (state.generatedImages.length === 0) {
            elements.previewContainer.innerHTML = '<div class="preview-empty"><i class="ri-image-2-line"></i><p>上传模板并输入内容后<br>点击"生成图片"查看预览</p></div>';
            return;
        }

        var html = '';
        state.generatedImages.forEach(function(img, index) {
            html += '<div class="preview-item">';
            html += '  <img src="' + img.data + '" alt="' + img.name + '">';
            html += '  <span class="preview-item-label">' + img.name + '</span>';
            html += '  <button class="preview-item-download" data-index="' + index + '" title="下载此图">';
            html += '    <i class="ri-download-2-line"></i>';
            html += '  </button>';
            html += '</div>';
        });

        elements.previewContainer.innerHTML = html;

        // 绑定单张下载事件
        elements.previewContainer.querySelectorAll('.preview-item-download').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var index = parseInt(this.getAttribute('data-index'));
                downloadImage(state.generatedImages[index]);
            });
        });
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
        var topics = state.selectedTopics.slice();
        var customTopic = elements.customTopic.value.trim();
        if (customTopic) {
            if (!customTopic.startsWith('#')) {
                customTopic = '#' + customTopic;
            }
            topics.push(customTopic);
        }
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
