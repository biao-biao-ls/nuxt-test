<template>
  <div>
    <div class="chat-close-icon-inner">
      <img src="../imgs/tuichu.svg" />
    </div>
    <div class="chat-close-icon-inner">Do you really want to close the chat?</div>
    <el-button type="primary" class="chat-close-btn-inner" round @click="$emit('click')">Close the chat</el-button>
  </div>
</template>

<script setup lang="ts">
  import { PropType } from 'vue'
  import { IPlatformType } from '#shared/utils/imMessage'
  defineProps({
    platform: {
      type: String as PropType<IPlatformType>,
      default: 'PC'
    }
  })
</script>

<style scoped>
  .chat-close-icon-inner {
    text-align: center;
    margin-bottom: 15px;
  }
  .chat-close-btn-inner {
    width: 100%;
  }
</style>
