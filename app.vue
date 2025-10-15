<template>
  <div></div>
</template>

<script setup lang="ts">
import { initQuickCep } from "./quickCep";

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
  initQuickCep({
    "3D Printing": [
      {
        employeeNameEn: "test_01",
        quickCepId: "1938524999731687426",
        imageFileIndexId: "8454635530497527808",
        roleNameEn: "Business Development Representative",
      },
      {
        employeeNameEn: "caocao",
        quickCepId: "1942407035945005058",
        imageFileIndexId: "8454682774852571136",
        roleNameEn: "Quality Assurance Agent",
      },
    ],
    SMT: [
      {
        employeeNameEn: "Ryan",
        imageFileIndexId: "bb0c22000a7f4ae1926bc4745af9e019",
        roleNameEn: "qinan",
        quickCepId: "1942107108466016257",
      },
      {
        employeeNameEn: "xiaozhou",
        imageFileIndexId: "5f4bb12688e0427298f223fe59da459c",
        roleNameEn: "234",
        quickCepId: "1938144757068906498",
      },
      {
        employeeNameEn: "Alex",
        quickCepId: "1946056607741292545",
        imageFileIndexId: "8593772229182779392",
        roleNameEn: "Client Relations Manager",
      },
      {
        employeeNameEn: "yxy",
        quickCepId: "1938475369237098497",
        imageFileIndexId: "8630496439324213248",
        roleNameEn: "Account Manager",
      },
    ],
    PCB: [
      {
        employeeNameEn: "Ryan",
        imageFileIndexId: "bb0c22000a7f4ae1926bc4745af9e019",
        roleNameEn: "qinan",
        quickCepId: "1942107108466016257",
      },
      {
        employeeNameEn: "xiaozhou",
        imageFileIndexId: "5f4bb12688e0427298f223fe59da459c",
        roleNameEn: "234",
        quickCepId: "1938144757068906498",
      },
      {
        employeeNameEn: "2121",
        quickCepId: "1938532940512280577",
        imageFileIndexId: "8455707418908921856",
        roleNameEn: "Customer Service Representative",
      },
      {
        employeeNameEn: "xiaozhou",
        quickCepId: "1938144757068906498",
        imageFileIndexId: "8593772030083227648",
        roleNameEn: "Technical Support Specialist",
      },
    ],
    Components: [
      {
        employeeNameEn: "Ryan",
        quickCepId: "1942107108466016257",
        imageFileIndexId: "bb0c22000a7f4ae1926bc4745af9e019",
        roleNameEn: "Sales Consultant",
      },
      {
        employeeNameEn: "Xie Yulang",
        quickCepId: "1948591855846862849",
        imageFileIndexId: "8636932414868172800",
        roleNameEn: "Account Manager",
      },
    ],
  });
});
</script>
