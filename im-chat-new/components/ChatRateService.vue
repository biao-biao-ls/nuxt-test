<template>
  <div class="chat-rate-service">
    <div
      class="chat-rate-body"
      :class="`chat-rate-body-${platform} ${isCloseConversation ? 'closeConversationModal' : ''}`"
    >
      <div class="chat-rate-title">Your review helps us grow!</div>
      <div class="chat-rate-desc">How would you rate this chat?*</div>
      <div class="chat-good-action">
        <div class="chat-good-btn" :class="{ active: form.rateLevel === 1 }" @click="form.rateLevel = 1">
          <svg-icon name="good_icon" class="chat-good-icon" />
        </div>
        <div class="chat-bad-btn" :class="{ active: form.rateLevel === 3 }" @click="form.rateLevel = 3">
          <svg-icon name="good_icon" class="chat-bad-icon" />
        </div>
        <span v-if="isShowError" class="error-tip">* Required</span>
      </div>
      <div class="chat-rate-desc">Did it solve your issues？</div>

      <div class="chat-action-btns">
        <el-button class="chat-action-btn" :type="form.isSolved ? 'primary' : ''" round @click="form.isSolved = true">
          Yes
        </el-button>
        <el-button class="chat-action-btn" :type="form.isSolved ? '' : 'primary'" round @click="form.isSolved = false">
          No
        </el-button>
      </div>

      <el-input
        v-model="form.content"
        class="chat-rate-content"
        type="textarea"
        :rows="3"
        placeholder="Leave a comment"
        resize="none"
        :maxlength="500"
        show-word-limit
      ></el-input>
      <el-button
        :disabled="!isCloseConversation && !form.rateLevel"
        round
        class="chat-rate-submit"
        :class="`chat-rate-submit-${platform}`"
        type="primary"
        @click="handleSubmit"
      >
        {{ isCloseConversation ? 'Close the chat' : 'Submit' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, PropType } from 'vue'
  import { IPlatformType } from '#shared/utils/imMessage'
  import SvgIcon from '#shared/components/svg-icon/SvgIcon.vue'
  const emit = defineEmits(['submit'])
  const props = defineProps({
    rateService: {
      type: Object,
      default: () => ({
        rateLevel: 0, // 1-点赞、3-点踩
        content: '', // 内容
        isSolved: true // 是否解决
      })
    },
    platform: {
      type: String as PropType<IPlatformType>,
      default: 'PC'
    },
    // 主动关闭会话触发
    isCloseConversation: {
      type: Boolean,
      default: false
    }
  })

  const isShowError = ref(false)

  const form = ref(props.rateService)

  const handleSubmit = () => {
    // 在主动关闭会话中可以不校验
    if (!form.value.rateLevel && !props.isCloseConversation) {
      isShowError.value = true
      return
    }
    isShowError.value = false
    emit('submit', form.value)
  }
</script>

<style scoped lang="scss">
  .chat-rate-submit {
    width: 100%;
  }

  .chat-rate-content {
    margin-bottom: 20px;
  }

  .chat-action-btns {
    margin-bottom: 16px;
  }

  .chat-action-btn {
    padding: 11px 24px;
  }

  .chat-good-action {
    position: relative;
    display: flex;
    margin-bottom: 18px;
    .error-tip {
      position: absolute;
      right: 20px;
      top: 10px;
      color: #f56c6c;
    }
  }

  .chat-good-icon,
  .chat-bad-icon {
    color: #555;
  }

  .chat-good-btn,
  .chat-bad-btn {
    display: flex;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid #dbdbdb;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &.active {
      background-color: #2b8ced;
      border: none;

      .chat-good-icon,
      .chat-bad-icon {
        color: #fff;
      }
    }
  }

  .chat-bad-btn {
    transform: rotateX(180deg);
    margin-left: 24px;
  }

  .chat-rate-service {
    flex: 1;
    width: 335px;
  }

  .chat-rate-body {
    width: 304px;
    background: #ffffff;
    border-radius: 12px;
    margin: 0 auto;
    padding: 10px 12px;
  }

  .chat-rate-body-H5 {
    padding: 0;
  }

  .closeConversationModal {
    padding: 0;
    margin: 0;
  }

  .chat-rate-title {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .chat-rate-desc {
    margin-bottom: 12px;
  }

  .chat-rate-submit-H5 {
    width: 100%;
  }
</style>
