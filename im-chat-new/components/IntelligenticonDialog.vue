<template>
  <ImDialog @close="$emit('close')">
    <IntelligenticonContent :is-open="isOpen" @change="$emit('change', $event)" />
  </ImDialog>
</template>

<script setup lang="ts">
  import ImDialog from './ImDialog.vue'
  import IntelligenticonContent from './IntelligenticonContent.vue'

  defineProps({
    isOpen: {
      type: Boolean,
      default: false
    }
  })
</script>

<style lang="scss" scoped>
  .intelligenticon-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .intelligenticon-desc {
    color: #666;
    line-height: 18px;
    width: 215px;
    margin-bottom: 12px;
  }

  .intelligenticon-form {
    height: 50px;
    background: #f3f5f7;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
  }
</style>
