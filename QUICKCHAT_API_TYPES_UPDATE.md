# QuickChat API 类型定义更新

## 概述

根据 2.md 文件中提供的 `window.quickChatApi` 对象结构，我们已经完善了 TypeScript 类型定义，包含了所有可用的方法和属性。

## 完整的 API 结构

### 配置属性
```typescript
eventPrefix: string;           // 事件前缀，默认 "quickChat-"
readyEventWasFired: boolean;   // 就绪事件是否已触发
widgetAuto: boolean;           // 自动小部件状态
openConditionFn: () => boolean; // 开放条件函数
```

### 基础聊天功能
```typescript
open: () => void;              // 打开聊天窗口
close: () => void;             // 关闭聊天窗口
chat: () => Promise<void>;     // 聊天功能
```

### 沙盒功能
```typescript
openSandBox: (params?: any) => void;     // 打开沙盒
sendBotSandBox: (message: any) => void;  // 发送机器人沙盒消息
sendMesSandBox: (message: any) => void;  // 发送沙盒消息
```

### 消息相关
```typescript
sendMessage: () => Promise<void>;                    // 发送消息（异步）
setInInputValue: (value: string) => void;           // 设置输入框内容
messageFromOperator: (message: any) => void;        // 来自座席的消息
messageFromVisitor: (message: any) => void;         // 来自访客的消息
clearCurrentMessageListFn: () => void;              // 清除当前消息列表
```

### 用户和访客管理
```typescript
getUserUUID: () => string;                          // 获取用户UUID
identify: (userData: any) => void;                  // 识别用户
setVisitorData: () => void;                         // 设置访客数据
setContactProperties: (properties: any) => void;    // 设置联系人属性
setCustomParameters: (params: any) => void;         // 设置自定义参数
addVisitorTags: (tags: any) => void;               // 添加访客标签
```

### 座席管理
```typescript
emitGetAllOperatorStatus: (operators: string[]) => void; // 获取所有座席状态
switchChat: (userId: string) => void;                    // 切换座席
```

### 界面控制
```typescript
changeZoom: (zoomLevel: any) => void;                    // 改变缩放级别
switchLanguage: (language: any) => void;                 // 切换语言
cancelTemporarilyHide: (params?: any) => Promise<void>;  // 取消临时隐藏
```

### 事件系统
```typescript
on: (event: string, callback: (data: any) => void) => void; // 事件监听
track: (eventData: any) => void;                            // 跟踪事件
triggerFlowbot: (params: any) => Promise<void>;             // 触发流程机器人
```

### 自定义组件挂载点
```typescript
bottomCustomDrawer: {
  mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
  setIsShow: (isShow: boolean) => void;
  [key: string]: any;
};

leftCustomDrawer: {
  mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
  setIsShow: (isShow: boolean) => void;
  [key: string]: any;
};

customHeader: {
  mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
  [key: string]: any;
};

customFooter: {
  mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
  [key: string]: any;
};

customLeftBar: {
  mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
  setIsShow: (isShow: boolean) => void;
  [key: string]: any;
};
```

## 新增的调试功能

### 1. 详细的 API 结构检查
```javascript
window.debugQuickChat.inspectQuickChatApi()
```
按功能分类显示所有可用的 API 方法：
- 📋 配置属性
- 💬 基础聊天功能
- 📨 消息相关方法
- 👤 用户管理方法
- 🎧 座席管理方法
- 🎨 界面控制方法
- ⚡ 事件系统方法
- 🔧 自定义组件对象

### 2. API 方法测试
```javascript
window.debugQuickChat.testApiMethods()
```
测试基础 API 方法的可用性：
- getUserUUID()
- openConditionFn()
- 配置属性检查

### 3. 沙盒功能测试
```javascript
window.debugQuickChat.testSandboxMethods()
```
测试沙盒相关功能：
- openSandBox 方法
- sendMesSandBox 方法
- sendBotSandBox 方法

## 重要变更

### 消息发送方式更新
之前的 `sendMessage(message)` 方法已更新为：
1. 使用 `setInInputValue(message)` 设置输入框内容
2. 调用 `sendMessage()` 发送消息（无参数，异步）

```typescript
// 旧方式（已废弃）
window.quickChatApi.sendMessage(message)

// 新方式
window.quickChatApi.setInInputValue(message)
await window.quickChatApi.sendMessage()
```

## 测试页面更新

访问 `/test-mobile-auto-open` 页面现在包含以下新功能：
- 查看 QuickChat API 结构
- 测试 API 方法
- 测试沙盒功能
- 移动端自动打开测试

## 使用建议

1. **类型安全**：所有 API 调用现在都有完整的 TypeScript 类型支持
2. **错误处理**：在调用 API 方法前检查方法是否存在
3. **异步处理**：注意某些方法（如 `sendMessage`, `chat`, `triggerFlowbot`）是异步的
4. **调试工具**：使用 `window.debugQuickChat` 对象进行开发和调试

## 兼容性

- 保持向后兼容性
- 新的类型定义不会影响现有功能
- 所有现有的自定义组件挂载方式继续有效