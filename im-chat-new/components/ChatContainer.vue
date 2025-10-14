<template>
  <div ref="chatContainerRef">
    <infinite-loading direction="top" @infinite="infiniteHandler">
      <div slot="spinner" class="chat-spinner">
        <Spin :width="20" :height="20" />
      </div>
      <div v-show="isMore" slot="no-more" class="chat-no-more">No more message</div>
      <div slot="no-results"></div>
    </infinite-loading>
    <div
      v-for="(item, index) of chatList"
      :key="item.messageClientId || item.messageServerId || `msg-${index}-${item.createTime}`"
      class="chat-item-wrapper"
    >
      <ChatTime v-if="(index % 4 === 0 && index < chatList.length - 1) || index === 0" :date-time="item.createTime" />
      <ChatItem
        :item="item"
        @submitEvaluation="$emit('submitEvaluation', $event)"
        @revoke="$emit('revoke', item)"
        @resend="$emit('resend', $event)"
        @onQuoteMsg="$emit('onQuoteMsg', item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, PropType, ref } from 'vue'
  import throttle from 'lodash/throttle'
  import type { V2NIMMessage } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'
  import InfiniteLoading from 'vue-infinite-loading'
  import { buildUuid } from '@jlc/utils'
  import uniqBy from 'lodash/uniqBy'
  import { getBizType } from '../utils'
  import Spin from './Spin.vue'
  import ChatTime from './ChatTime.vue'
  import ChatItem from './ChatItem.vue'

  const emit = defineEmits(['loadPreMsgs', 'submitEvaluation'])
  const chatContainerRef = ref<any>(null) // 容器

  const props = defineProps({
    msgs: {
      type: Array as PropType<V2NIMMessage[]>,
      required: true
    },
    isMore: {
      type: Boolean,
      default: false
    }
  })

  const chatList = computed(() => {
    const list: V2NIMMessage[] = []
    const msgsList = uniqBy(props.msgs, 'messageClientId')

    // 调试：检查重复 key
    const keySet = new Set()
    const duplicateKeys = new Set()

    for (let i = 0; i < msgsList.length; i++) {
      const msg = msgsList[i]
      if (getBizType(msg) === 'allocation') {
        msg.isSelf = true
        list.push(msg)
        if (msg.attachment.raw.content.firstServedPhrase && msg.attachment.raw.content.firstAssign) {
          const uniqueId = buildUuid()
          list.push({
            createTime: msg.createTime + 1,
            text: msg.attachment.raw.content.firstServedPhrase,
            messageClientId: uniqueId,
            messageServerId: uniqueId, // 使用唯一的 ID 避免重复 key
            serverExtension: {
              eim: msg.serverExtension.eim,
              ena: msg.attachment.raw.content.employeeEnName
            },
            isSelf: false,
            historicalFlag: msg.historicalFlag,
            disabledMark: true
          })
        }
      } else if (getBizType(msg) === 'frontendCloseConversation') {
        msg.isSelf = false
        list.push(msg)
      } else {
        list.push(msg)
      }
    }

    // 调试：检查最终列表中的重复 key
    list.forEach((item) => {
      const key = item.messageClientId || item.messageServerId
      if (keySet.has(key)) {
        duplicateKeys.add(key)
      } else {
        keySet.add(key)
      }
    })

    if (duplicateKeys.size > 0) {
      console.warn('🔑 检测到重复的消息 key:', Array.from(duplicateKeys))
      console.log(
        '📝 消息列表详情:',
        list.map((item) => ({
          key: item.messageClientId || item.messageServerId,
          text: item.text?.substring(0, 30) || 'no text',
          bizType: getBizType(item)
        }))
      )
    }

    return list
  })

  const infiniteHandler = throttle(function infiniteHandler($state: any) {
    emit('loadPreMsgs', $state)
  }, 10)
</script>

<style lang="scss" scoped>
  .chat-item-wrapper {
  }

  .chat-spinner {
    display: flex;
    justify-content: center;
    padding: 8px 0;
  }

  .chat-no-more {
    color: #999;
    padding: 8px 0;
  }
</style>
