<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>

<script setup lang="ts">
import { ChatManager } from "~/composables/useChatManager";
import { ChatCustomUI } from "~/composables/useChatCustomUI";
import { ChatStyles } from "~/composables/useChatStyles";

// 声明全局类型
declare global {
  interface Window {
    quickChatReadyHook?: () => Promise<void>;
    chatManager?: ChatManager;
    ChatStyles?: typeof ChatStyles;
    ChatCustomUI?: typeof ChatCustomUI;
    ChatManager?: typeof ChatManager;
  }
}

// 引入外部QuickChat脚本
useHead({
  script: [
    {
      src: "https://test-chat-quickcep.jlcerp.com/initQuickChat.js?platform=others&accessId=a2252def-c98d-433c-a811-86fef1fc62fd",
      async: true,
    },
  ],
});

onMounted(() => {
  console.log("页面已挂载，开始初始化聊天系统");

  // 将类挂载到全局对象，以便在HTML事件处理中使用
  if (typeof window !== "undefined") {
    window.ChatStyles = ChatStyles;
    window.ChatCustomUI = ChatCustomUI;
    window.ChatManager = ChatManager;
  }

  // 设置 QuickChat 准备就绪回调
  window.quickChatReadyHook = async () => {
    console.log("QuickChat 访客端初始化完成");

    try {
      // 创建并初始化聊天管理器
      const chatManager = new ChatManager();
      await chatManager.init();

      // 设置全局引用
      window.chatManager = chatManager;

      console.log("聊天系统初始化成功");
    } catch (error) {
      console.error("聊天系统初始化失败:", error);
    }
  };
});
</script>
