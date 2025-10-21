# 移动端 ClassName 动态检测实现

## 概述

本实现将原有的 CSS 媒体查询 `@media (max-width: 559px)` 替换为基于 JavaScript 动态检测的 className 方式，提供更准确的移动端判断。

## 实现原理

### 1. 移动端检测逻辑

使用现有的 `isMobileDevice()` 方法，该方法综合考虑：
- 用户代理字符串（User Agent）
- 屏幕尺寸（宽度 ≤ 768px）
- 触摸支持检测

### 2. 动态 ClassName 添加

- **主页面**: 为 `document.body` 添加 `mobile-device` 类名
- **iframe 内部**: 为 iframe 的 `body` 元素添加 `mobile-device` 类名

### 3. 样式定义更改

将所有 `@media (max-width: 559px)` 媒体查询改为 `.mobile-device` 类名选择器：

```css
/* 原来的媒体查询 */
@media (max-width: 559px) {
  .left-bar {
    width: 220px;
  }
}

/* 改为基于类名的样式 */
.mobile-device .left-bar {
  width: 220px;
}
```

## 修改的文件和位置

### useChatManager.ts
1. **新增方法**:
   - `addMobileClassToIframe()`: 为 iframe body 添加移动端类名
   - `addMobileClassToMainPage()`: 为主页面 body 添加移动端类名

2. **调用时机**:
   - 初始化时调用
   - 样式注入时调用
   - 窗口大小变化时调用

3. **样式更新**: 将 `#DIY-LEFT-BAR` 的媒体查询改为类名选择器

### useChatStyles.ts
1. **样式更新**:
   - `.left-bar` 宽度设置
   - `.left-bar-footer` 隐藏设置
   - `.footer-btn.add-btn svg` 尺寸设置

## 使用方法

### 自动检测
系统会在以下时机自动检测并添加类名：
- 聊天系统初始化时
- 样式注入时
- 窗口大小变化时

### 手动测试
可以通过调试工具手动测试：

```javascript
// 在浏览器控制台中执行
window.debugQuickChat.testMobileClassName()
```

### 检查当前状态
```javascript
// 检查移动端检测结果
window.debugQuickChat.testMobileDetection()

// 检查主页面是否有移动端类名
document.body.classList.contains('mobile-device')

// 检查 iframe 是否有移动端类名（需要在 iframe 可访问时）
const iframe = document.getElementById('quick-chat-iframe')
iframe.contentDocument.body.classList.contains('mobile-device')
```

## 优势

1. **更准确的检测**: 不依赖屏幕宽度，而是综合多个因素判断
2. **动态响应**: 窗口大小变化时自动更新
3. **更好的控制**: 可以通过 JavaScript 精确控制何时应用移动端样式
4. **调试友好**: 提供了丰富的调试工具和日志输出

## 注意事项

1. **iframe 访问限制**: 如果 iframe 存在跨域限制，类名添加可能失败，但不会影响主要功能
2. **样式优先级**: 确保 `.mobile-device` 选择器的优先级足够高
3. **兼容性**: 在不支持 `classList` 的老旧浏览器中可能需要额外处理

## 调试和监控

系统会在控制台输出相关日志：
- `✅ 已为主页面 body 添加 mobile-device 类名`
- `✅ 已为 iframe body 添加 mobile-device 类名`
- `✅ 已从主页面 body 移除 mobile-device 类名`
- `✅ 已从 iframe body 移除 mobile-device 类名`

通过这些日志可以监控类名的添加和移除情况。