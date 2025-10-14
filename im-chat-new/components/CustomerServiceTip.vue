<template>
  <div class="customer-service-tip">
    <div v-if="isFirst">Welcome to {{ getRobotName() }}! This is {{ item.employeeEnName }} at your service.</div>
    <div v-else>The chat has been transferred to: {{ item.employeeEnName }}</div>
  </div>
</template>

<script setup lang="ts">
  import { getRobotName } from '#shared/utils'

  defineProps({
    item: {
      type: Object,
      default: () => ({})
    },
    isFirst: {
      type: Boolean,
      default: false
    }
  })
</script>

<style scoped lang="scss">
  .customer-service-tip {
    text-align: center;
    color: #666;
    font-size: 12px;
    width: 351px;
    margin-bottom: 20px;
  }
</style>
