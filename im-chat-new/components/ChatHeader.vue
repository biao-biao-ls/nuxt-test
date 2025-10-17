<template>
  <div v-if="platform === 'PC'" class="chat-header">
    <div class="user-info">
      <img width="30px" height="30px" class="chat-avatar" :src="isHasService ? avatarUrl : logoUrl" />
      <div class="user-name">{{ isHasService ? customerServiceInfo.employeeEnName : username }}</div>
    </div>
    <div class="chat-header-btns">
      <i v-if="historyFlag" class="el-icon-back text-[24px] mr-[10px]" @click="backSelBusiness"></i>
      <el-popover
        v-if="showMoreBtn && !historyFlag"
        v-model="moreFlag"
        placement="bottom"
        width="144"
        trigger="hover"
        :popper-class="'more-popper'"
      >
        <div>
          <div class="flex items-center more-item" @click="openSendTranscript">
            <svg-icon name="messages_icon" width="16px" height="16px"></svg-icon>
            <span class="ml-8">Send transcript</span>
          </div>
        </div>
        <svg-icon slot="reference" name="more_icon_chat" width="24px" height="24px" class="more"></svg-icon>
      </el-popover>

      <img src="../imgs/win-min.svg" @click="$emit('min')" />
      <img v-if="customerServiceInfo.ck" src="../imgs/win-close.svg" @click="$emit('close')" />
    </div>
  </div>

  <div v-else-if="platform === 'H5'">
    <!-- 状态栏占位 -->
    <div class="status-bar-height" :style="{ height: `${barHeight}px` }"></div>
    <div class="chat-header-h5">
      <div class="chat-return" @click="handleReturn">
        <img width="16" height="16" :src="returnUrl" />
      </div>
      Chat with {{ customerServiceInfo.employeeEnName || username }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, PropType, computed } from 'vue'
  import { useCustomerInfo } from '../utils/useCustomerInfo'
  import returnUrl from '../imgs/return.svg'
  import logoUrl from '#shared/assets/images/component-im-logo.png'
  import { IPlatformType, getMessages } from '#shared/utils/imMessage'
  import { useStore } from '#shared/types'
  import { isApp } from '#shared/utils'
  const { username, customerServiceInfo, avatarUrl, isHasService } = useCustomerInfo()
  const store = useStore()
  const barHeight = computed(() => {
    return store.state.barHeight
  })
  defineProps({
    showMoreBtn: {
      type: Boolean,
      default: false
    },
    platform: {
      type: String as PropType<IPlatformType>,
      default: 'PC'
    },
    historyFlag: {
      type: Boolean,
      default: false
    }
  })
  const emits = defineEmits(['openSendTranscript', 'backSelBusiness'])
  const moreFlag = ref(false)
  // const handleReturn = () => {
  //   window.parent.postMessage(getMessages('chatReturn'), '*')
  // }
  const openSendTranscript = () => {
    moreFlag.value = false
    emits('openSendTranscript')
  }

  const handleReturn = () => {
    if (isApp()) {
      uni.reLaunch({
        url: '/pages/message/index'
      })
    } else {
      window.history.back()
    }
  }
  const backSelBusiness = () => {
    emits('backSelBusiness')
  }
</script>

<style scoped lang="scss">
  .chat-header-h5 {
    padding: 12px 12px 0 12px;
    font-weight: bold;
    font-size: 16px;
    text-align: center;
    position: relative;

    .chat-return {
      padding: 15px 12px 0 12px;
      position: absolute;
      left: 0;
      top: 0;
    }
  }
  .chat-header {
    padding: 12px 12px 0 12px;
    display: flex;
    justify-content: space-between;

    .chat-avatar {
      border-radius: 50%;
    }
    .chat-header-btns {
      display: flex;
      align-items: center;
      column-gap: 12px;
    }

    .chat-header-btns img {
      cursor: pointer;
    }

    .user-info {
      display: flex;
      align-items: center;

      .user-name {
        font-weight: bold;
        margin-left: 8px;
      }
    }
    .more {
      cursor: pointer;
      &:hover {
        color: #1871ff;
      }
    }
  }
  ::v-deep .more-item {
    font-size: 14px;
    color: #222222;
    line-height: 18px;
    border-radius: 4px;
    padding: 5px 4px;
    cursor: pointer;
    &:hover {
      background: #f1f3f5;
    }
  }
</style>
<style lang="scss">
  .more-popper {
    padding: 10px 6px 8px !important;
    min-width: 144px !important;
  }
</style>
