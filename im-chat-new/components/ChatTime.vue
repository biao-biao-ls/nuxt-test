<template>
  <div class="today-time mb-12">{{ formatTime(dateTime) }}</div>
</template>

<script lang="ts" setup>
  import { formatTime } from '../utils'
  defineProps({
    dateTime: {
      type: Number,
      required: true
    }
  })
</script>

<style lang="scss" scoped>
  .today-time {
    text-align: center;
    color: #999999;
    line-height: 18px;
    font-size: 12px;
  }
</style>
