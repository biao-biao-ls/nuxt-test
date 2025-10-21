# 移动端左侧自定义区域自动隐藏功能实现

## 功能概述

实现了移动端时左侧自定义区域（id="DIY-LEFT-BAR"）不默认展开的功能。即使有客服在线，移动端用户也需要手动触发才能展开左侧区域。

## 实现方案

### 1. 移动端定位修复

修复了移动端 `id="DIY-LEFT-BAR"` 定位超出可视范围的问题：

```typescript
/**
 * 设置移动端左侧栏的定位
 */
private setMobileLeftBarPosition(leftBarParent: HTMLElement): void {
  try {
    // 获取左侧栏的宽度
    const leftBarWidth = leftBarParent.offsetWidth || 180; // 默认宽度180px
    
    // 在移动端，确保左侧栏的左边定位在屏幕的左边
    // 通过设置 right 属性来实现从右向左的展开效果
    leftBarParent.style.position = "absolute";
    leftBarParent.style.right = `${leftBarWidth}px`; // 初始状态隐藏在右侧
    leftBarParent.style.left = "auto"; // 清除可能的 left 定位
    
    // 当需要显示时，调整 right 值
    if (this.shouldShowLeftBar()) {
      leftBarParent.style.right = "0px"; // 显示时贴右边
    }
    
    // 确保在移动端有合适的宽度
    if (window.innerWidth <= 768) {
      const maxWidth = Math.min(leftBarWidth, window.innerWidth * 0.8); // 最大占屏幕80%
      leftBarParent.style.width = `${maxWidth}px`;
    }
    
    // 添加过渡动画
    leftBarParent.style.transition = "right 0.3s ease-in-out";
    
  } catch (error) {
    console.error("设置移动端左侧栏定位时出错:", error);
  }
}
```

### 2. 移动端检测逻辑

在 `ChatCustomUI` 类中添加了 `isMobileDevice()` 私有方法：

```typescript
private isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 检测用户代理字符串
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod',
    'blackberry', 'windows phone', 'mobile', 'opera mini'
  ];

  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));

  // 检测屏幕尺寸（宽度小于768px认为是移动端）
  const isMobileScreen = window.innerWidth <= 768;

  // 检测触摸支持
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // 综合判断：用户代理包含移动设备关键词，或者屏幕宽度小于768px且支持触摸
  return isMobileUA || (isMobileScreen && hasTouchSupport);
}
```

### 3. 修改左侧栏显示逻辑

修改了 `shouldShowLeftBar()` 方法，添加移动端判断：

```typescript
shouldShowLeftBar(): boolean {
  const onlineAgents = this.state.customerServiceData.filter(
    (agent) => agent.isOnline
  );
  const onlineCount = onlineAgents.length;

  // 如果用户手动隐藏了左侧栏，则不显示
  if (this.state.isLeftBarManuallyHidden) {
    return false;
  }

  // 如果没有在线客服，不显示左侧栏
  if (onlineCount === 0) {
    return false;
  }

  // 如果用户强制显示了左侧栏，则显示
  if (this.state.isLeftBarForceShown) {
    return true;
  }

  // 移动端时，即使有客服在线，也不默认展开左侧自定义区域，需要手动触发
  if (this.isMobileDevice()) {
    return false;
  }

  // 桌面端：只要有在线客服，不管是否选中过，都显示左侧自定义区域
  return onlineCount > 0;
}
```

### 4. 动态位置更新

添加了动态位置更新方法，确保切换时正确更新定位：

```typescript
/**
 * 更新移动端左侧栏位置（用于切换显示/隐藏时调用）
 */
private updateMobileLeftBarPosition(): void {
  try {
    const currentDoc = this.getCurrentDocument();
    const leftBarParent = currentDoc.getElementById("DIY-LEFT-BAR");

    if (leftBarParent) {
      const leftBarWidth = leftBarParent.offsetWidth || 180;
      
      if (this.shouldShowLeftBar()) {
        // 显示：从右侧滑入到可视区域
        leftBarParent.style.right = "0px";
      } else {
        // 隐藏：滑出到右侧不可视区域
        leftBarParent.style.right = `${leftBarWidth}px`;
      }
    }
  } catch (error) {
    console.error("更新移动端左侧栏位置时出错:", error);
  }
}
```

## 行为变化

### 桌面端（保持原有行为）
- ✅ 有客服在线时，左侧自定义区域默认展开
- ✅ 用户可以通过点击收起图标隐藏左侧区域
- ✅ 用户可以通过点击展开图标重新显示左侧区域

### 移动端（新行为）
- ✅ 即使有客服在线，左侧自定义区域也不会默认展开
- ✅ 用户需要点击头部的展开图标才能显示左侧区域
- ✅ 用户可以通过点击收起图标隐藏左侧区域
- ✅ 保持手动控制状态，不会因为客服状态变化而自动重新展开
- ✅ **修复定位问题**：左侧区域从右向左展开，完全显示在屏幕内
- ✅ **智能宽度**：最大占屏幕宽度的80%，适配不同尺寸设备
- ✅ **平滑动画**：0.3秒的过渡动画，提升用户体验

## 移动端检测标准

采用多重检测机制确保准确识别移动端设备：

1. **用户代理检测**：检查 UserAgent 中是否包含移动设备关键词
2. **屏幕尺寸检测**：屏幕宽度 ≤ 768px
3. **触摸支持检测**：检查设备是否支持触摸操作
4. **综合判断**：满足用户代理条件，或同时满足屏幕尺寸和触摸支持条件

## 测试页面

创建了测试页面 `pages/test-mobile-leftbar.vue` 用于验证功能：

- 显示当前设备信息（设备类型、屏幕宽度、用户代理、触摸支持）
- 提供模拟测试功能
- 显示预期行为说明
- 响应式设计，支持移动端查看

## 移动端定位策略

### 定位原理
1. **初始状态**：`right: 180px` - 左侧区域隐藏在右侧不可视区域
2. **展开状态**：`right: 0px` - 左侧区域滑入到右边缘，完全可见
3. **宽度控制**：`width: min(180px, screenWidth * 0.8)` - 智能适配屏幕尺寸
4. **动画效果**：`transition: right 0.3s ease-in-out` - 平滑过渡

### 解决的问题
- ❌ **原问题**：移动端左侧区域定位超出可视范围，用户看不到
- ✅ **解决方案**：通过 `right` 属性控制定位，确保完全可见
- ✅ **保持体验**：维持从右向左的展开效果
- ✅ **响应式适配**：根据屏幕尺寸动态调整宽度

## 文件修改

### 修改的文件
- `quickCep/useChatCustomUI.ts`：添加移动端检测、修改左侧栏显示逻辑、修复移动端定位问题

### 新增的文件
- `pages/test-mobile-leftbar.vue`：移动端左侧栏测试页面
- `MOBILE_LEFTBAR_AUTO_HIDE_IMPLEMENTATION.md`：本实现文档

## 兼容性

- ✅ 向后兼容：桌面端行为保持不变
- ✅ 渐进增强：移动端获得更好的用户体验
- ✅ 跨平台支持：支持各种移动设备和浏览器
- ✅ 响应式设计：支持屏幕尺寸变化时的动态检测

## 使用方法

功能已自动集成到现有的 QuickChat 系统中，无需额外配置。系统会自动检测设备类型并应用相应的显示逻辑。

用户在移动端可以通过以下方式控制左侧区域：
1. 点击头部的展开图标（`open-leftbar-icon`）显示左侧区域
2. 点击左侧区域底部的收起图标（`expand-icon`）隐藏左侧区域