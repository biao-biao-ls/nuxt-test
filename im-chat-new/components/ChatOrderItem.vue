<template>
  <div class="chat-order-item">
    <div style="background-color: #eef2f6">
      <jlc-wm-image :src="orderItem.imgUrl" style="width: 56px; height: 56px" />
    </div>
    <div class="chat-order-info">
      <div class="chat-order-title text-ellipsis overflow-hidden whitespace-nowrap">
        <strong class="chat-order-title-label">
          {{ orderItem.title }}
        </strong>
      </div>
      <div class="chat-order-code text-ellipsis overflow-hidden whitespace-nowrap">
        Order #:
        {{ orderItem._orderCode }}
      </div>
      <div class="chat-price-status">
        <span class="chat-price">{{ orderItem.orderAmount }}</span>
        <span class="chat-status" v-if="orderItem.status">
          <span class="chat-status-dot"></span>
          {{ orderItem.status }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    orderItem: {
      type: Object,
      default: () => ({})
    }
  })
</script>

<style lang="scss" scoped>
  .chat-order-item {
    display: flex;
    align-items: center;
    margin-right: 12px;
  }

  .chat-order-title {
    line-height: 20px;
  }

  .chat-order-info {
    width: 0;
    flex: 1;
    padding-right: 10px;
    padding-left: 12px;
  }

  .chat-status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #999;
    margin-right: 3px;
    vertical-align: 1px;
  }

  .chat-price-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    line-height: 20px;
  }

  .chat-price {
    color: #666;
  }

  .chat-status {
    color: #999;
    font-size: 12px;
  }

  .chat-order-code {
    color: #666;
    line-height: 20px;
  }
</style>
