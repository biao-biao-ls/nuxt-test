<template>
  <div class="chat-tips">
    <svg-icon name="icon_err-tip" class="err-tip" width="17px" height="17px" />
    {{ message }}
  </div>
</template>

<script setup lang="ts">
  defineProps({
    message: {
      type: String,
      default: ''
    }
  })
</script>

<style scoped lang="scss">
  .chat-tips {
    position: absolute;
    bottom: 135px;
    display: flex;
    justify-content: center;
    background: #ffffff;
    border: 1px solid #e5e8f1;
    border-radius: 4px;
    box-shadow: 0px 4px 8px 0px rgba(78, 122, 194, 0.24);
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 20px;
    color: #fb86a3;
    white-space: nowrap;
    .err-tip {
      margin-right: 6px;
    }
  }
</style>
