# Cascader 级联选择组件

多级联动选择，适用于省市区、分类选择等场景。**Hover 逐级展开**。

## 使用方法

### HTML 结构

```html
<div class="cascader cascader-open">
  <button class="cascader-trigger">
    <span class="cascader-value cascader-placeholder">请选择地区</span>
    <svg class="cascader-arrow">...</svg>
  </button>
  
  <!-- 下拉菜单 -->
  <div class="cascader-dropdown">
    <!-- 省份（一级） -->
    <div class="cascader-item cascader-item-has-children">
      浙江省
      <!-- 城市（二级） -->
      <div class="cascader-submenu">
        <div class="cascader-item cascader-item-has-children">
          杭州市
          <!-- 区县（三级） -->
          <div class="cascader-submenu">
            <div class="cascader-item">西湖区</div>
            <div class="cascader-item">滨江区</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 自定义宽度

通过 CSS 变量调整菜单宽度：

```html
<!-- 窄菜单 -->
<div class="cascader" style="--cascader-menu-width: 120px;">...</div>

<!-- 宽菜单 -->
<div class="cascader" style="--cascader-menu-width: 200px;">...</div>
```

## 超长文字处理

- 菜单项自动截断超长文字
- 显示省略号 `...`
- hover 时可通过 `title` 属性显示完整内容

```html
<div class="cascader-item" title="这是一个很长很长的选项文字">
  这是一个很长很长的选项文字
</div>
```

## CSS 变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--cascader-menu-width` | `160px` | 菜单宽度（一级和子菜单） |
| `--cascader-padding` | `0.625rem 0.875rem` | 触发器内边距 |
| `--cascader-font-size` | `0.875rem` | 字体大小 |

## 类名说明

| 类名 | 说明 |
|------|------|
| `.cascader-item` | 菜单项（自动截断超长文字） |
| `.cascader-item-has-children` | 有子菜单的项（显示箭头） |
| `.cascader-item-selected` | 选中状态 |
| `.cascader-item-disabled` | 禁用状态 |
| `.cascader-submenu` | 子菜单容器 |

## 使用场景

- 省市区选择
- 商品分类选择
- 组织架构选择
- 多级导航菜单
