<template>
  <div>
    <div class="intelligenticon-title">Smart Suggestions</div>
    <div class="intelligenticon-desc">Predictive content suggestions appear as you enter text.</div>
    <div class="intelligenticon-form">
      Smart Suggestions
      <el-switch v-model="isStart" @change="$emit('change', isStart)"></el-switch>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    }
  })
  const isStart = ref(props.isOpen)
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
