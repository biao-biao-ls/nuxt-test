<template>
  <div></div>
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
      // 定义客服数据（可以从API获取或其他数据源）
      const customerServiceData = [
        {
          employeeEnName: "test_01",
          quickCepId: "1938524999731687426",
          imageFileIndexId: "8454635530497527808",
          roleNameEn: "Business Development Representative",
          isOnline: false,
          status: 1,
          businessLine: "3D Printing",
        },
        {
          employeeEnName: "caocao",
          quickCepId: "1942407035945005058",
          imageFileIndexId: "8454682774852571136",
          roleNameEn: "Quality Assurance Agent",
          isOnline: false,
          status: 1,
          businessLine: "3D Printing",
        },
        {
          employeeEnName: "2121",
          quickCepId: "1938532940512280577",
          imageFileIndexId: "8455707418908921856",
          roleNameEn: "Customer Service Representative",
          isOnline: false,
          status: 1,
          businessLine: "PCB Assembly",
        },
        {
          employeeEnName: "xiaozhou",
          quickCepId: "1938144757068906498",
          imageFileIndexId: "8593772030083227648",
          roleNameEn: "Technical Support Specialist",
          isOnline: false,
          status: 1,
          businessLine: "PCB Assembly",
        },
        {
          employeeEnName: "Alex",
          quickCepId: "1946056607741292545",
          imageFileIndexId: "8593772229182779392",
          roleNameEn: "Client Relations Manager",
          isOnline: false,
          status: 1,
          businessLine: "SMT Services",
        },
        {
          employeeEnName: "yxy",
          quickCepId: "1938475369237098497",
          imageFileIndexId: "8630496439324213248",
          roleNameEn: "Account Manager",
          isOnline: false,
          status: 1,
          businessLine: "SMT Services",
        },
        {
          employeeEnName: "Ryan",
          quickCepId: "1942107108466016257",
          imageFileIndexId: "8630498147114913792",
          roleNameEn: "Sales Consultant",
          isOnline: false,
          status: 1,
          businessLine: "Components",
        },
        {
          employeeEnName: "Xie Yulang",
          quickCepId: "1948591855846862849",
          imageFileIndexId: "8636932414868172800",
          roleNameEn: "Account Manager",
          isOnline: false,
          status: 1,
          businessLine: "Components",
        },
      ];

      // 创建并初始化聊天管理器，传入客服数据
      const chatManager = new ChatManager();
      await chatManager.init(customerServiceData);

      // 设置全局引用
      window.chatManager = chatManager;

      console.log("聊天系统初始化成功");
    } catch (error) {
      console.error("聊天系统初始化失败:", error);
    }
  };
});
</script>
