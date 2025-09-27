# QuickChat 第三方聊天工具集成指南

## 概述

本项目集成了第三方在线聊天功能 QuickChat，需要遵循特定的 SDK 集成方案和最佳实践。

## 核心集成方式

### 脚本引入

在 `app.vue` 中通过 `useHead` 引入外部脚本：

```ts
useHead({
  script: [
    {
      src: "https://test-chat-quickcep.jlcerp.com/initQuickChat.js?platform=others&accessId=a2252def-c98d-433c-a811-86fef1fc62fd",
      async: true,
    },
  ],
});
```

### 全局类型定义

必须在项目中定义 QuickChat 的全局类型接口，包括：

- `window.quickChatReadyHook`：初始化回调函数
- `window.quickEmitter`：事件监听器
- `window.quickChatApi`：核心 API 接口

## 关键 API 方法

### 消息操作

- `setInInputValue(value: string)`：设置输入框内容
- `sendMessage(value: string)`：直接发送消息

### 座席管理

- `emitGetAllOperatorStatus(operators: string[])`：获取座席状态
- `switchChat(userId: string)`：切换座席

### 自定义组件挂载

- `customHeader.mount()`：挂载头部组件
- `customFooter.mount()`：挂载底部组件
- `customLeftBar.mount()`：挂载侧边栏组件
- `bottomCustomDrawer.mount()`：挂载底部弹窗
- `leftCustomDrawer.mount()`：挂载左侧弹窗（移动端）

## 事件监听

### 重要事件

- `chat.operator.status`：座席状态更新
- `chat.switch.operator.success`：切换座席成功
- `chat.model.toggleChat`：聊天窗口切换
- `chat.getMessageList.success`：消息列表获取成功

## 样式处理规范

### CSS 样式要求

- **必须使用内联样式或 CSS-in-JS**
- 避免依赖全局选择器
- 如需全局样式，通过 shadowRoot 手动注入

### 样式注入示例

```ts
const customStyle = document.createElement("style");
customStyle.textContent = `
  .leftBarWrapper {
    color: blue
  }
`;
shadowRoot.appendChild(customStyle);
```

## 初始化模式

### 标准初始化流程

```ts
window.quickChatReadyHook = function () {
  if (window.quickEmitter && window.quickChatApi) {
    // 1. 设置事件监听
    window.quickEmitter.on("chat.operator.status", handleOperatorStatus);

    // 2. 获取座席状态
    window.quickChatApi.emitGetAllOperatorStatus([]);

    // 3. 挂载自定义组件
    window.quickChatApi.customHeader.mount(renderHeader);
  }
};
```

## 开发注意事项

### 运行环境

- **重要**：所有自定义区域的代码都运行在集成的在线聊天窗口 iframe 中
- 自定义组件通过 QuickChat SDK 挂载到 iframe 内的指定容器
- 需要考虑 iframe 环境的限制和特殊性

### 错误处理

- 始终检查 `quickEmitter` 和 `quickChatApi` 是否已就绪
- 提供适当的错误提示和降级处理

### 组件渲染

- 使用 React 时通过 `ReactDOM.createRoot()` 渲染
- 确保在 shadowRoot 环境中正确处理样式隔离
- 所有自定义组件都在 iframe 内部渲染

### 座席状态码

- 1：离线
- 2：在线空闲
- 3：在线忙碌

## 实现建议

1. **类型安全**：确保所有 QuickChat API 调用都有正确的 TypeScript 类型定义
2. **错误边界**：为自定义组件添加错误边界处理
3. **性能优化**：合理使用事件监听，避免内存泄漏
4. **响应式设计**：考虑移动端和桌面端的不同挂载点选择

## 调试技巧

- 使用 `console.log` 监听关键事件
- 检查 `window.quickChatApi` 和 `window.quickEmitter` 的可用性
- 验证自定义样式是否正确注入到 shadowRoot
