<template>
  <div class="chat-rate-service">
    <div class="chat-rate-body">
      <div class="chat-rate-title">Thank you for your rating.</div>
      <div class="chat-rate-desc">
        How would you rate this chat?*
        <svg-icon
          name="good_icon"
          style="cursor: auto"
          :style="{ transform: `rotateX(${form.rateLevel === 1 ? '0deg' : '180deg'})` }"
        />
      </div>
      <div class="chat-rate-desc">
        Did it solve your issues？
        <span>{{ form.isSolved ? 'Yes' : 'No' }}</span>
      </div>
      <el-input
        v-if="form.content.trim()"
        disabled
        class="chat-rate-content"
        type="textarea"
        :rows="3"
        placeholder="Leave a comment"
        v-model="form.content"
        resize="none"
      ></el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import SvgIcon from '#shared/components/svg-icon/SvgIcon.vue'
  const props = defineProps({
    rateService: {
      type: Object,
      default: () => ({})
    }
  })

  const form = ref(props.rateService)
</script>

<style scoped lang="scss">
  .chat-rate-service {
    width: 335px;
    flex: 1;
    margin-bottom: 12px;
  }

  .chat-rate-body {
    width: 304px;
    background: #ffffff;
    border-radius: 12px;
    margin: 0 auto;
    padding: 10px 12px;
  }

  .chat-rate-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .chat-rate-desc {
    margin-bottom: 12px;
    width: 90%;
    justify-content: space-between;
    display: flex;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .chat-rate-content {
    margin-top: 12px;
  }
</style>
