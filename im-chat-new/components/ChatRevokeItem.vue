<template>
  <div class="customer-service-tip">
    <!-- <span v-if="item.type === 'orderInfo'">
      You unsent a message. 
      <el-link class="revoke-btn" @click="$emit('resend', { ...item, messageClientId: msgId })">Re-edit</el-link>
    </span>
    <span v-else-if="item.type === 'PICTURE'">
      You unsent a message. 
      <el-link class="revoke-btn" @click="$emit('resend', { ...item, messageClientId: msgId })">重新发送</el-link>
    </span>
    <span v-else-if="item.type === 'VIDEO'">
      You unsent a message. 
      <el-link class="revoke-btn" @click="$emit('resend', { ...item, messageClientId: msgId })">重新发送</el-link>
    </span>
    <span v-else-if="item.type === 'EXPIRED'">
      You unsent a message. 
      <el-link class="revoke-btn" @click="$emit('resend', { ...item, messageClientId: msgId })">重新发送</el-link>
    </span> -->
    <span v-if="item.type === 'TEXT'">
      {{ item.isSelf ? 'You' : item.employeeEnName }} unsent a message.
      <el-link v-if="item.isSelf" class="revoke-btn" @click="$emit('resend', { ...item, messageClientId: msgId })">
        Re-edit
      </el-link>
    </span>
    <span v-else>
      {{ item.isSelf ? 'You' : item.employeeEnName }} unsent a message.
      <!-- <el-link class="revoke-btn" @click="$emit('resend', { ...item, messageClientId: msgId })">重新发送</el-link> -->
    </span>
  </div>
</template>

<script setup lang="ts">
  defineProps({
    item: {
      type: Object,
      default: () => ({})
    },
    msgId: {
      type: String,
      required: true
    }
  })
</script>

<style scoped lang="scss">
  .customer-service-tip {
    text-align: center;
    color: #666;
    width: 351px;
    font-size: 12px;

    .revoke-btn {
      font-size: 12px;
      color: #2b8ced;
    }
  }
</style>
