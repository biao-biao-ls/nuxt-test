<template>
  <div class="chat-loading">
    <Spin />
  </div>
</template>

<script setup lang="ts">
  import Spin from './Spin.vue'
</script>

<style scoped lang="scss">
  .chat-loading {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    left: 0;
    top: 0;
  }
</style>
