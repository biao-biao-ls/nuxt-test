# 移动端自动打开聊天窗口功能

## 功能概述

当在移动端设备上加载 QuickCep 第三方聊天工具时，系统会自动检测设备类型，如果检测到是移动端设备，会在 QuickCep 初始化完成后自动调用 `quickChatApi.open()` 接口打开聊天窗口。

## 实现原理

### 移动端检测逻辑

系统通过以下三个维度来判断是否为移动端设备：

1. **用户代理字符串检测**：检查 `navigator.userAgent` 是否包含移动设备关键词
   - `android`, `webos`, `iphone`, `ipad`, `ipod`
   - `blackberry`, `windows phone`, `mobile`, `opera mini`

2. **屏幕尺寸检测**：检查窗口宽度是否小于等于 768px

3. **触摸支持检测**：检查设备是否支持触摸操作
   - `'ontouchstart' in window`
   - `navigator.maxTouchPoints > 0`

**判断规则**：用户代理包含移动设备关键词，或者（屏幕宽度 ≤ 768px 且 支持触摸）

### 自动打开时机

- QuickCep 完全初始化完成后
- 延迟 1 秒确保所有组件都已准备就绪
- 仅在移动端设备上执行

## 代码实现

### 核心方法

```typescript
/**
 * 检测是否为移动端设备
 */
private isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // 检测用户代理字符串
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile', 'opera mini'
  ]
  
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
  
  // 检测屏幕尺寸（宽度小于768px认为是移动端）
  const isMobileScreen = window.innerWidth <= 768
  
  // 检测触摸支持
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // 综合判断
  return isMobileUA || (isMobileScreen && hasTouchSupport)
}

/**
 * 在移动端自动打开聊天窗口
 */
private autoOpenChatOnMobile(): void {
  if (!this.isMobileDevice()) {
    console.log('非移动端设备，跳过自动打开聊天窗口')
    return
  }

  console.log('检测到移动端设备，准备自动打开聊天窗口')

  // 延迟一段时间确保所有组件都已初始化完成
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.quickChatApi?.open) {
      try {
        window.quickChatApi.open()
        console.log('✅ 移动端聊天窗口已自动打开')
      } catch (error) {
        console.error('❌ 自动打开聊天窗口失败:', error)
      }
    } else {
      console.warn('⚠️ quickChatApi.open 方法不可用，无法自动打开聊天窗口')
    }
  }, 1000) // 延迟1秒确保初始化完成
}
```

### 类型定义更新

在 `type.d.ts` 中添加了 `open` 方法的类型定义：

```typescript
quickChatApi?: {
  // ... 其他方法
  // 打开聊天窗口
  open: () => void;
};
```

## 测试功能

### 测试页面

访问 `/test-mobile-auto-open` 页面可以测试移动端自动打开功能：

- 显示当前设备信息和检测结果
- 提供手动测试按钮
- 实时显示控制台输出

### 调试工具

通过 `window.debugQuickChat` 对象可以进行更详细的测试：

```javascript
// 测试移动端检测
window.debugQuickChat.testMobileDetection()

// 手动触发自动打开功能
window.debugQuickChat.testAutoOpenChat()

// 强制打开聊天窗口（无论是否为移动端）
window.debugQuickChat.forceOpenChat()
```

## 使用方法

功能已自动集成到现有的 QuickCep 初始化流程中，无需额外配置。当在移动端设备上访问集成了 QuickCep 的页面时，聊天窗口会自动打开。

## 注意事项

1. **延迟执行**：为确保 QuickCep 完全初始化，自动打开功能会延迟 1 秒执行
2. **错误处理**：如果 `quickChatApi.open()` 方法不可用或执行失败，会在控制台输出相应的错误信息
3. **兼容性**：功能仅在支持相关 API 的现代浏览器中生效
4. **测试环境**：可以使用浏览器开发者工具的设备模拟功能来测试移动端行为

## 控制台输出示例

成功情况：
```
检测到移动端设备，准备自动打开聊天窗口
✅ 移动端聊天窗口已自动打开
```

非移动端设备：
```
非移动端设备，跳过自动打开聊天窗口
```

错误情况：
```
检测到移动端设备，准备自动打开聊天窗口
⚠️ quickChatApi.open 方法不可用，无法自动打开聊天窗口
```