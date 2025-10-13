import { ChatManager } from "./useChatManager";
import { ChatCustomUI } from "./useChatCustomUI";
import { ChatStyles } from "./useChatStyles";

export const initQuickCep = (rawCustomerServiceData = {}) => {
  // 将类挂载到全局对象，以便在HTML事件处理中使用
  if (typeof window !== "undefined") {
    window.ChatStyles = ChatStyles;
    window.ChatCustomUI = ChatCustomUI;
    window.ChatManager = ChatManager;
  }
  const initFn = async () => {
    try {
      // 原始按业务线分组的客服数据（可以从API获取或其他数据源）
      // const rawCustomerServiceData = {}
      // 创建并初始化聊天管理器，直接传入分组格式的客服数据
      // 数据格式转换将在 chatManager.init 中处理
      const chatManager = new ChatManager();
      await chatManager.init(rawCustomerServiceData);

      // 设置全局引用
      window.chatManager = chatManager;
    } catch (error) {
      console.error("聊天系统初始化失败:", error);
    }
  };

  // // 设置 QuickChat 准备就绪回调

  // initFn()

  // if (window.$nuxt.$store.state.isQuickCepReady) {
  //   initFn();
  // } else {
  //   window.quickChatReadyHook = () => {
  //     initFn();
  //   };
  // }
  window.quickChatReadyHook = () => {
    initFn();
  };
};
