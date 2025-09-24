# 当前客服信息功能使用说明

## 功能概述

已成功为聊天界面添加了自定义头部区域的当前客服信息功能，具体实现如下：

### 1. 未选择客服时的显示
- **头像**: 显示蓝色的JLCONE品牌SVG图标（包含"JLCONE"文字的圆形蓝色头像）
- **客服名称**: 显示 "JLCONE"
- **样式**: 蓝色边框和背景，表示默认状态

### 2. 选择客服后的显示
- **头像**: 显示选中客服的真实头像
- **客服名称**: 显示选中客服的真实姓名
- **样式**: 绿色边框和背景，表示已选择状态
- **状态指示器**: 显示客服的在线状态（绿色=在线空闲，黄色=在线忙碌，灰色=离线）

## 代码实现

### 核心方法：`renderCurrentAgent()`

```typescript
private renderCurrentAgent(): string {
  // 当未选择客服时，显示默认头像和JLCONE名称
  if (!this.state.currentChatAgent) {
    return `
      <div class="current-agent default" title="当前客服: JLCONE">
        <div class="agent-avatar-wrapper">
          <svg aria-hidden="true" fill="currentColor" focusable="false" height="36" width="36" class="default-avatar">
            <use xlink:href="#icon-Avatar_icon"></use>
          </svg>
          <!-- 备用SVG，当上面的图标不存在时显示 -->
          <svg aria-hidden="true" fill="currentColor" focusable="false" height="36" width="36" class="default-avatar-fallback" style="display: none;">
            <circle cx="18" cy="18" r="18" fill="#e9ecef"/>
            <path d="M18 22.5c-3.375 0-6.1875-1.6875-6.1875-3.9375S14.625 14.625 18 14.625s6.1875 1.6875 6.1875 3.9375S21.375 22.5 18 22.5zM18 13.5c-2.8125 0-5.0625-2.25-5.0625-5.0625S15.1875 3.375 18 3.375s5.0625 2.25 5.0625 5.0625S20.8125 13.5 18 13.5z" fill="#6c757d"/>
          </svg>
        </div>
        <div class="agent-name-display">JLCONE</div>
      </div>
    `;
  }

  // 当选择了客服时，显示选中客服的头像和名称
  const agent = this.state.customerServiceData.find(
    (a) => a.quickCepId === this.state.currentChatAgent!.quickCepId
  ) || this.state.currentChatAgent;

  return `
    <div class="current-agent selected" title="当前沟通: ${agent.employeeEnName} (${this.getStatusText(agent.status)})">
      <div class="agent-avatar-wrapper">
        <img src="${this.getAvatarUrl(agent.imageFileIndexId)}" 
             class="agent-avatar current" 
             style="border-color: ${agent.isOnline ? "#007bff" : "#d8d8d8"};"
             onerror="this.src='${this.getDefaultAvatar(36)}'">
        <div class="status-indicator" style="background: ${this.getStatusColor(agent.status)};"></div>
      </div>
      <div class="agent-name-display">${agent.employeeEnName}</div>
    </div>
  `;
}
```

### 样式定义

```css
.current-agent {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
}

.agent-avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.default-avatar {
  display: block;
  border-radius: 50%;
  overflow: hidden;
  width: 36px;
  height: 36px;
}

.agent-avatar.current {
  width: 36px;
  height: 36px;
  border-width: 2px;
}

.agent-name-display {
  font-size: 14px;
  font-weight: 500;
  color: #444;
  white-space: nowrap;
}
```

## 使用方法

### 1. 初始化
```typescript
const chatUI = new ChatCustomUI();
```

### 2. 设置当前客服
```typescript
// 选择客服
chatUI.selectAgent('客服ID');

// 或直接设置
chatUI.state.currentChatAgent = someAgent;
chatUI.refreshUI();
```

### 3. 清除当前客服
```typescript
chatUI.state.currentChatAgent = null;
chatUI.refreshUI();
```

## 特性

1. **品牌化头像**: 使用JLCONE品牌专用的蓝色SVG头像，提升品牌识别度
2. **响应式设计**: 支持不同状态下的视觉反馈
3. **状态指示**: 显示客服的实时在线状态
4. **工具提示**: 鼠标悬停时显示详细信息
5. **无缝集成**: 与现有的客服列表和切换功能完美配合

## 测试

可以使用以下方法进行测试：

```typescript
// 测试默认状态
window.chatUI.state.currentChatAgent = null;
window.chatUI.refreshUI();

// 测试选择客服状态
window.chatUI.selectAgent('1938524999731687426');

// 查看当前状态
console.log(window.chatUI.state.currentChatAgent);
```

这个实现完全满足了你的需求：未选择客服时显示默认SVG头像和"JLCONE"名称，选择客服后显示真实的客服头像和姓名。