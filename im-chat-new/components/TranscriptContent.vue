<template>
  <div class="transcriptBox">
    <!-- <svg-icon name="close_pop_custom" width="16px" height="16px" class="closeBtn" @click.native="close"></svg-icon> -->
    <div class="sendStatusBox">
      <div v-if="sendTranscriptStatus === 'pending'" class="statusIcon mb-8">
        <svg-icon name="messages_icon" width="16px" height="16px" class="message_icon"></svg-icon>
      </div>
      <svg-icon
        v-if="sendTranscriptStatus === 'success'"
        name="finish"
        width="41px"
        height="41px"
        class="finishIcon mb-8"
      ></svg-icon>
      <div v-if="sendTranscriptStatus === 'pending'" class="statusDesc">Send the chat transcript to your e-mail.</div>
      <!-- 发送成功 -->
      <div v-if="sendTranscriptStatus === 'success'" class="statusDesc mb-20">
        Chat transcript will be sent to your email once the chat is finished.
      </div>
    </div>
    <el-form ref="emailFormRef" :model="emailForm" :rules="rules" label-width="0px">
      <el-form-item v-if="sendTranscriptStatus === 'pending'" prop="email">
        <el-input v-model="emailForm.email"></el-input>
      </el-form-item>
      <el-button v-if="sendTranscriptStatus === 'pending'" type="primary" round class="submitBtn" @click="send">
        Send
      </el-button>
      <el-button v-if="sendTranscriptStatus === 'success'" type="primary" round class="submitBtn" @click="close">
        OK
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, inject } from 'vue'
  import { saveUserNotifyEmailVal } from '#shared/apis'

  const accountId = inject('accountId')

  const props = defineProps({
    bindEmail: {
      type: String,
      default: ''
    }
  })

  const emits = defineEmits(['submit', 'close'])
  const emailFormRef = ref<any>({})
  const sendTranscriptStatus = ref('pending')
  const emailForm = ref({
    email: ''
  })
  const validateEmail = (rule, value: string, callback) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value) {
      callback(new Error('Please enter your email address'))
    } else if (!emailRegex.test(value)) {
      callback(new Error('Please enter a valid email address'))
    } else {
      callback()
    }
  }
  const rules = ref({
    email: [{ validator: validateEmail, trigger: ['blur', 'change'] }]
  })
  const send = () => {
    emailFormRef.value.validate(async (valid) => {
      if (valid) {
        await saveUserNotifyEmailVal({ thirdUserId: accountId.value, email: `{secret}${emailForm.value.email}` })
        sendTranscriptStatus.value = 'success'
        emits('submit', emailForm.value.email)
      }
    })
  }
  const close = () => {
    emits('close')
  }
  watch(
    () => props.bindEmail,
    (e) => {
      if (e) {
        emailForm.value.email = e
      }
    },
    {
      immediate: true
    }
  )
</script>

<style scoped lang="scss">
  .transcriptBox {
    position: relative;
    padding: 24px 12px;
    .closeBtn {
      position: absolute;
      right: 12px;
      top: 12px;
      cursor: pointer;
    }
    .sendStatusBox {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      .statusIcon {
        width: 52px;
        height: 52px;
        background: #f2f4f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .statusDesc {
        font-size: 16px;
        font-weight: 600;
        color: #222222;
        line-height: 19px;
        text-align: center;
        margin-bottom: 8px;
      }
    }
  }
  .submitBtn {
    width: 100%;
    height: 40px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
  }

  .mb-8 {
    margin-bottom: 8px;
  }
  .mb-20 {
    margin-bottom: 20px;
  }
</style>
