<template>
  <ImDialog @close="$emit('close')">
    <TranscriptContent :bindEmail="bindEmail" @close="$emit('close')" @submit="$emit('submit', $event)" />
  </ImDialog>
</template>

<script setup lang="ts">
  import TranscriptContent from './TranscriptContent.vue'
  import ImDialog from './ImDialog.vue'
  defineProps({
    bindEmail: {
      type: String,
      default: ''
    }
  })
</script>
