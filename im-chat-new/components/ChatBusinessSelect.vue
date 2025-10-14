<template>
  <!-- 点击开始会话的提示对话及业务选择 -->
  <div class="chat-business-select">
    <ChatTime :date-time="Date.now()" />
    <!-- 提示对话 -->
    <ChatItem :item="msg" />
    <!-- 业务选择 -->
    <div class="chat-business">
      <el-button
        v-for="item of business"
        :key="item.label"
        round
        class="chat-business-btn mb-10"
        :style="{ marginLeft: item.ml }"
        :type="item.value === value?.value ? 'primary' : ''"
        @click="handleClick(item)"
      >
        <div class="chat-business-item">
          <img :src="item.icon" width="24px" height="26px" />
          {{ item.label }}
        </div>
      </el-button>
    </div>
    <!-- 暂时屏蔽 -->
    <div v-if="false" class="check-history">
      <div class="check-history-box" @click="viewHistory">
        View Chat History
        <img src="../imgs/arrow-r.png" alt="" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { PropType } from 'vue'
  import type { V2NIMMessage } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'
  import { business } from '../utils/business'
  import { BusinessBtnItem } from '../types'
  import type { BusinessItemType } from '../utils/business'
  import ChatItem from './ChatItem.vue'
  import ChatTime from './ChatTime.vue'

  const emit = defineEmits(['select', 'handleViewHistory'])

  const handleClick = (item: BusinessBtnItem) => {
    emit('select', item)
  }

  const viewHistory = () => {
    emit('handleViewHistory')
  }

  defineProps({
    value: {
      type: Object as PropType<BusinessItemType | null>,
      default: () => ({})
    },
    msg: {
      type: Object as PropType<V2NIMMessage>,
      required: true
    }
  })
</script>

<style lang="scss" scoped>
  .chat-business-select {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .chat-business {
    padding: 0 12px;
  }
  .chat-business-btn {
    padding: 5px 14px 5px 12px !important;
    color: #2b8ced;
    border-color: #2b8ced;
    outline: 0;
  }

  .el-button--primary.chat-business-btn {
    color: #fff;
  }

  .chat-business-item {
    display: flex;
    align-items: center;

    img {
      margin-right: 5px;
    }

    &.biz-tdp {
      img {
        margin-right: 2px;
      }
      margin-left: -4px;
    }
  }
  .check-history {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 30px;
    .check-history-box {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 26px;
      line-height: 26px;
      border: 1px solid #cccccc;
      border-radius: 24px;
      font-size: 12px;
      color: #666666;
      padding: 4px 12px;
      position: relative;
      cursor: pointer;
      & > img {
        width: 12px;
        height: 13px;
        margin-left: 5px;
      }
      &::before {
        content: '';
        position: absolute;
        left: -117px;
        top: 50%;
        width: calc((100vw - 156px) / 2);
        height: 0px;
        border: 1px solid;
        border-image: linear-gradient(90deg, rgba(219, 219, 219, 0), #dbdbdb 100%) 1 1;
      }
      &::after {
        content: '';
        position: absolute;
        right: -117px;
        top: 50%;
        width: calc((100vw - 156px) / 2);
        height: 0px;
        border: 1px solid;
        border-image: linear-gradient(90deg, #dbdbdb, rgba(219, 219, 219, 0) 100%) 1 1;
      }
    }
  }
</style>
