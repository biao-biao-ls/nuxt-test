<template>
  <ImDialog @close="$emit('close')">
    <CloseTheChatContent @click="$emit('click')" />
  </ImDialog>
</template>

<script setup lang="ts">
  import ImDialog from './ImDialog.vue'
  import CloseTheChatContent from './CloseTheChatContent.vue'
</script>
