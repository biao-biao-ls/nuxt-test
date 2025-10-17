<template>
  <div class="relative cursor-pointer" @click="handleInAppClick">
    <p class="ellipsis-two-line font-semibold leading-[20px] mb-4">{{ item.msgTitle }}</p>
    <p class="text-xs ellipsis-two-line opacity-80 leading-[18px]" v-html="$xss(item.msgContent)"></p>
    <i class="el-icon-arrow-right chat-detail-button"></i>
  </div>
</template>

<script setup lang="ts">
  import { inject, Ref, defineEmits } from 'vue'
  import { getEnvConfig, getIsH5, sendMessageToUniApp } from '#shared/utils'
  import { getMessages } from '#shared/utils/imMessage'

  const props = defineProps({
    item: {
      type: Object,
      default: () => ({})
    }
  })
  const envConfig = getEnvConfig()
  const emit = defineEmits(['min'])

  const parentUrl = inject('parentUrl') as Ref<string>
  const handleInAppClick = () => {
    const isH5 = getIsH5()
    if (isH5) {
      sendMessageToUniApp({ type: 'backToMsgDetail', msgNoticeRecordAccessId: props.item.msgNoticeRecordAccessId })
      return
    }

    if (parentUrl.value.includes(props.item.msgNoticeRecordAccessId)) {
      emit('min')
    } else {
      // 打开新窗口
      const url = `${envConfig.PCB_BASE_URL}/user-center/messages/detail?msgNoticeRecordAccessId=${props.item.msgNoticeRecordAccessId}`
      window.parent.postMessage(getMessages('openParentWindow', url), '*')
    }
  }
</script>

<style lang="scss" scoped>
  .ellipsis-two-line {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .chat-detail-button {
    position: absolute;
    right: 10px;
    bottom: 10px;
    font-size: 11px;
    font-weight: 600;
    width: 14px;
    line-height: 14px;
    text-align: center;
    border-radius: 99px;
    background: #fff;
    color: #2b8ced;
  }
</style>
