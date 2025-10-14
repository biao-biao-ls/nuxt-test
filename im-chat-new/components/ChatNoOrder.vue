<template>
  <div class="chat-no-order">
    <img class="chat-no-order-img" src="../imgs/no_orders.svg" alt="" />
    <span>No orders found</span>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
  .chat-no-order {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #666;
    height: 300px;
  }
  .chat-no-order-img {
    margin-bottom: 20px;
  }
</style>
