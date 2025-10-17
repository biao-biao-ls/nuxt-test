<template>
  <div class="chat-wait-msg">
    {{ text }}
    <ChatLoading2 class="loadding" />
  </div>
</template>

<script setup lang="ts">
  import ChatLoading2 from './ChatLoading2.vue'
  defineProps({
    text: {
      type: String,
      required: true
    }
  })
</script>

<style scoped lang="scss">
  .chat-wait-msg {
    margin: 0 20px 0 20px;
    color: #999999;
    line-height: 18px;
  }

  .loadding {
    vertical-align: -3px;
  }
</style>
