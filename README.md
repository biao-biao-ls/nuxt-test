# 聊天系统集成文档

## 概述

这是一个模块化的客服聊天系统，支持多种集成方式，包括 React 组件和原生 JavaScript。

## 快速开始

### 方式一：使用我们的预构建组件（推荐）

如果你需要在 iframe 环境中快速集成聊天功能，可以直接使用我们提供的预构建组件：

```typescript
// 在 Vue/Nuxt 项目中使用模块化导入
import { ChatManager } from '~/composables/useChatManager'
import { ChatCustomUI } from '~/composables/useChatCustomUI'
import { ChatStyles } from '~/composables/useChatStyles'

// 在组件中初始化
onMounted(async () => {
  // 设置 QuickChat 准备就绪回调
  window.quickChatReadyHook = async () => {
    try {
      const chatManager = new ChatManager()
      await chatManager.init()
      window.chatManager = chatManager
      console.log("聊天系统初始化成功")
    } catch (error) {
      console.error("聊天系统初始化失败:", error)
    }
  }
})
```

**特点：**
- 🚀 开箱即用，无需复杂配置
- 🎨 预设了美观的UI样式
- 📱 响应式设计，支持移动端
- 🔧 提供完整的调试工具
- 🌐 支持 iframe 和主窗口环境

**测试页面：** 打开 `public/chat-test.html` 查看完整示例

### 方式二：自定义 React 集成

如果你需要更多自定义控制，可以使用 React 方式集成：

```ts
window.quickChatReadyHook = function () {
    if (window.quickEmitter) {
        window.quickEmitter.on('chat.operator.status', (data: { operatorUserIdStatus: Record<string, number> }) => {
            console.log('operatorData', data);
        });
        
        if (window.quickChatApi) {
            window.quickChatApi.emitGetAllOperatorStatus([]);
            
            window.quickChatApi.customHeader.mount((container: HTMLElement) => {
                const root = ReactDOM.createRoot(container);
                root.render(<MyHeader />);
            });
            
            window.quickChatApi.customFooter.mount((container: HTMLElement) => {
                const root = ReactDOM.createRoot(container);
                root.render(<MyBtn />);
            });
            
            window.quickChatApi.customLeftBar.mount(
                (container: HTMLElement, shadowRoot) => {
                    // 注入自定义样式
                    const customStyle = document.createElement('style');
                    customStyle.textContent = `
                        .leftBarWrapper {
                            color: blue
                        }
                    `;
                    shadowRoot.appendChild(customStyle);

                    // 注入客户的代码
                    const root = ReactDOM.createRoot(container);
                    root.render(<LeftBar />);
                }
            );
        } else {
            console.warn('quickChatApi is not ready yet');
        }
    } else {
        console.warn('quickEmitter is not ready yet');
    }
};
```

## 文件结构

```
composables/
├── useChatStyles.ts     # 聊天UI样式管理器（TypeScript模块）
├── useChatCustomUI.ts   # 聊天自定义UI组件管理器（TypeScript模块）
├── useChatManager.ts    # 聊天管理器（TypeScript模块）
app.vue                  # 主应用文件，包含模块化导入和初始化逻辑
├── deploy.js            # 部署助手工具
└── README-iframe.md     # iframe集成详细指南
```

## 主要功能

- ✅ 客服状态实时更新
- ✅ 客服切换功能
- ✅ 按业务线分组显示
- ✅ 响应式左侧栏
- ✅ 头像和状态指示器
- ✅ 工具提示和交互反馈
- ✅ 调试工具和日志
- ✅ 跨框架兼容性

## 调试工具

系统提供了完整的调试工具，在浏览器控制台中使用：

```javascript
// 查看客服状态
debugQuickChat.showAgentStatus()

// 手动刷新UI
debugQuickChat.refreshUI()

// 测试切换客服
debugQuickChat.testSwitchAgent('客服ID')

// 获取系统状态
debugQuickChat.getSystemStatus()
```

## 更多信息

- 📖 [iframe 集成详细指南](public/README-iframe.md)
- 🧪 [在线测试页面](public/chat-test.html)
- 🚀 [部署助手工具](public/deploy.js)
- 🔧 所有源码都在 `public/` 目录中，可直接使用