# 自定义区域显示时机控制实现

## 概述

本实现调整了 QuickChat 自定义区域的显示逻辑，确保特定的自定义元素只有在聊天窗口准备就绪时才进行初始化。

## 核心改进

### 1. 分阶段初始化策略

#### 第一阶段：基础挂载
- **时机**：QuickChat SDK 初始化完成时
- **操作**：
  - 挂载自定义容器到 QuickChat 指定区域
  - 头部区域只渲染 `.current-agent` 元素
  - 左侧栏和底部区域暂不渲染内容
  - 左侧栏初始设置为隐藏状态

#### 第二阶段：完整初始化
- **时机**：检测到 iframe 中存在 `#chat-body-content .visitor-message` 元素时
- **操作**：
  - 渲染头部的 `.online-agent` 和 `.open-leftbar-icon` 元素
  - 渲染左侧栏的 `.left-bar` 内容
  - 渲染底部的 `.chat-footer` 内容
  - 根据客服状态更新左侧栏可见性

### 2. 聊天窗口监听机制

#### 监听目标
```javascript
// 目标元素路径
iframe#quick-chat-iframe -> #chat-body-content -> .visitor-message
```

#### 监听策略
- **定期检查**：每 500ms 检查一次目标元素是否存在
- **事件监听**：监听 iframe 的 load 事件
- **超时保护**：30秒后强制初始化，防止无限等待
- **跨域处理**：忽略跨域访问错误，继续监听

### 3. 元素显示规则

#### 始终显示的元素
- `.current-agent`：当前客服显示区域，始终可见

#### 条件显示的元素
- `.online-agent`：在线客服头像，需要等待聊天窗口准备就绪
- `.open-leftbar-icon`：打开左侧栏图标，需要等待聊天窗口准备就绪
- `.left-bar`：左侧客服列表，需要等待聊天窗口准备就绪
- `.chat-footer`：底部功能区域，需要等待聊天窗口准备就绪

## 代码实现

### 1. ChatManager 修改

#### 新增方法

```typescript
/**
 * 开始监听聊天窗口状态
 */
private startChatWindowMonitoring(): void {
  // 监听 iframe 中的目标元素
  // 定期检查 + 事件监听 + 超时保护
}

/**
 * 初始化自定义元素
 */
private initializeCustomElements(): void {
  // 当检测到聊天窗口准备就绪时调用
  // 初始化所有待初始化的自定义区域
}
```

#### 修改的方法

```typescript
/**
 * 挂载自定义组件
 */
private mountCustomComponents(): void {
  // 头部：只渲染初始状态（.current-agent）
  // 左侧栏：挂载容器但不渲染内容
  // 底部：挂载容器但不渲染内容
  // 开始监听聊天窗口状态
}
```

### 2. ChatCustomUI 修改

#### 新增方法

```typescript
/**
 * 生成初始头部HTML（只包含 .current-agent）
 */
generateInitialHeaderHTML(): string {
  // 只渲染当前客服显示区域
  // 不包含在线客服和打开左侧栏图标
}
```

### 3. 调试工具扩展

新增调试方法：
- `debugQuickChat.initializeCustomElements()` - 手动初始化自定义元素
- `debugQuickChat.checkChatWindow()` - 检查聊天窗口状态
- `debugQuickChat.restartMonitoring()` - 重新开始监听

## 使用场景

### 1. 正常流程
1. 用户访问页面，QuickChat 开始加载
2. QuickChat SDK 初始化完成，挂载自定义容器
3. 头部显示默认的 JLCONE 客服信息
4. 系统开始监听聊天窗口状态
5. 用户开始聊天，出现访客消息
6. 系统检测到 `.visitor-message` 元素
7. 初始化所有自定义区域元素
8. 根据客服状态显示相应的UI

### 2. 异常处理
- **iframe 加载失败**：30秒后强制初始化
- **跨域访问限制**：忽略错误，继续监听
- **目标元素不存在**：持续监听直到超时

### 3. 手动控制
开发者可以通过调试工具手动控制初始化过程：
```javascript
// 检查当前状态
debugQuickChat.checkChatWindow();

// 手动初始化
debugQuickChat.initializeCustomElements();

// 重新开始监听
debugQuickChat.restartMonitoring();
```

## 优势

### 1. 性能优化
- 避免在聊天窗口未准备就绪时渲染复杂UI
- 减少不必要的DOM操作和事件绑定

### 2. 用户体验
- 确保UI元素在合适的时机出现
- 避免功能按钮在无法使用时显示

### 3. 稳定性
- 提供超时保护机制
- 支持手动控制和调试

### 4. 兼容性
- 保持与现有事件处理逻辑的兼容
- 不影响客服状态更新和切换功能

## 测试验证

使用 `test-custom-elements-timing.html` 可以验证：
1. 初始状态只显示 `.current-agent`
2. 模拟访客消息出现后完整初始化
3. 监听机制的正确性
4. 调试工具的可用性

## 注意事项

1. **iframe 访问限制**：在跨域环境中可能无法访问 iframe 内容
2. **时机控制**：确保在客服数据获取后再进行UI更新
3. **事件绑定**：新初始化的元素需要重新绑定事件处理器
4. **样式应用**：确保动态添加的元素正确应用样式