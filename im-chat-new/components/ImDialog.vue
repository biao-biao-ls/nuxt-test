<template>
  <div class="im-dialog" @click.self="$emit('close')">
    <div class="im-body">
      <img v-if="showCloseIcon" src="../imgs/win-close.svg" class="im-close-btn" @click="$emit('close')" />
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    showCloseIcon: {
      type: Boolean,
      default: true
    }
  })
</script>

<style lang="scss" scoped>
  .im-dialog {
    position: fixed;
    width: 100%;
    height: 100%;
    z-index: 999;
    background-color: rgba(17, 17, 17, 0.75);
    left: 0;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .im-body {
    min-width: 320px;
    margin: 0 20px;
    padding: 24px 15px;
    background-color: #fff;
    border-radius: 8px;
    position: relative;
  }

  .im-close-btn {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
  }
</style>
