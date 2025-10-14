<template>
  <div
    ref="itemElement"
    class="chat-label-item"
    :data-server="item.serverExtension && item.serverExtension.ck && !item.isSelf"
    :data-id="item.messageClientId"
  >
    <div
      class="chat-real-item"
      :class="{ reverse: item.isSelf, 'justify-center': ['allocationFailure'].includes(getBizType(item)) }"
    >
      <!-- 显示时间 -->
      <div
        v-if="
          ![
            'allocation',
            'allocationFailure',
            'revoke',
            'waitMsg',
            'unOnline',
            'noticeImQueueNum',
            'conversationWillClose',
            'conversationTimeoutClose',
            'transferEmailCloseConversation'
          ].includes(getBizType(item))
        "
        class="chat-list-item-time"
        :class="{ center: ['preEvaluation', 'evaluation'].includes(getBizType(item)) }"
      >
        {{ formatDate(item.createTime) }}
      </div>
      <!-- 头像 -->
      <img
        v-if="
          !item.isSelf &&
          ![
            'allocation',
            'allocationFailure',
            'revoke',
            'frontendCloseConversation',
            'noticeImQueueNum',
            'conversationWillClose',
            'conversationTimeoutClose',
            'transferEmailCloseConversation'
          ].includes(getBizType(item))
        "
        class="chat-user-avatar"
        width="30px"
        height="30px"
        :src="getAvatarUrl(item.serverExtension)"
      />

      <el-popover
        v-model="msgMenuFlag"
        placement="top"
        popper-class="msgMenu"
        :disabled="historyFlag || (!canRevokeFlag && !canReplyFlag) || markFlag"
        trigger="hover"
        @show="handlePopoverShow(item)"
      >
        <!-- 撤回 -->
        <div v-if="canRevokeFlag" class="hand" :class="{ canRevokeFlag: !canRevokeFlag }" @click="handleUnsend(item)">
          Unsend
        </div>
        <!-- 引用 -->
        <div class="hand" :class="{ canRevokeFlag: canReplyFlag }" @click="handleQuoteMsg(item)">Reply</div>
        <div slot="reference">
          <!-- 引用信息 -->
          <div v-if="quoteMsg" class="flex" :class="[item.isSelf ? 'mr-[12px] justify-end' : 'ml-[6px]']">
            <div class="quote-box line-clamp-2" :class="[item.isSelf ? '' : 'quote-box-unself']">
              <span class="font-semibold">{{ quoteMsg.nickName }}</span>
              {{ quoteMsg.text }}
            </div>
          </div>
          <div
            class="flex"
            :class="[item.isSelf ? 'reverse items-center' : 'items-end']"
            @mouseenter="showEmojiIcon = true"
            @mouseleave="showEmojiIcon = false"
          >
            <div class="relative" @mouseenter="msgMenuFlag = true">
              <Transition name="bounce">
                <div
                  v-if="!item.isSelf && markFlag"
                  v-click-outside="closeEmojiBox"
                  class="flex mark-emoji-box"
                  @mouseenter.stop="handleHeaderMouseEnter"
                  @click.stop
                >
                  <div
                    v-for="(item, key) in markEmojiArr"
                    :key="key"
                    class="cursor-pointer mark-emoji-item"
                    @click.stop="handleChooseEmoji(key)"
                  >
                    <img :src="item" class="align-middle emoji-img" width="24px" height="24px" :title="key" />
                  </div>
                </div>
              </Transition>
              <!-- 分配客服提示 -->
              <CustomerServiceTip
                v-if="getBizType(item) === 'allocation'"
                :item="item.attachment.raw.content"
                :is-first="!!item.attachment.raw.content.firstAssign"
              />
              <!-- 等待分配客服提示 -->
              <!-- <ChatWaitMsg v-else-if="['unOnline', 'waitMsg'].includes(getBizType(item))" :text="item.text"></ChatWaitMsg> -->
              <!-- 消息撤回提示 -->
              <ChatRevokeItem
                v-else-if="getBizType(item) === 'revoke' && item.messageClientId"
                :item="item.attachment.raw"
                :msg-id="item.messageClientId"
                @resend="$emit('resend', $event)"
              />
              <!-- 订单 -->
              <ChatOrderItem
                v-else-if="getBizType(item) === 'orderInfo'"
                class="chat-order-im-item"
                :order-item="item.attachment.raw.content"
              />
              <!-- 评价弹框 -->
              <ChatRateService
                v-else-if="getBizType(item) === 'preEvaluation'"
                :rate-service="item.attachment.raw.content"
                @submit="$emit('submitEvaluation', $event)"
              />
              <!-- 评价结果 -->
              <ChatEvaluationItem
                v-else-if="getBizType(item) === 'evaluation'"
                :rate-service="item.attachment.raw.content"
              />
              <!-- 图片 -->
              <ChatImageItem
                v-else-if="getCustomerMediaType(item) === 'imageMessage' || getMediaType(item) === 'PICTURE'"
                :item="item.attachment.raw.content"
              />
              <!-- 视频 -->
              <ChatVideoItem
                v-else-if="getCustomerMediaType(item) === 'videoMessage' || getMediaType(item) === 'VIDEO'"
                :item="item.attachment.raw.content"
              />
              <!-- 站内信 -->
              <ChatInAppItem
                v-else-if="getBizType(item) === 'imSourceEntranceInApp'"
                :item="item.attachment.raw.content"
                class="chat-list-item"
                :class="{ reverse: item.isSelf }"
                @min="$emit('min')"
              />
              <!-- 未分配到处理人 留言 -->
              <div v-else-if="getBizType(item) === 'allocationFailure'" class="message-guide">
                <div v-if="!item.attachment.raw.content.closed" class="message-guide-box">
                  <div class="message-guide-box-label">
                    Our current live chat capacity is full, so wait times may be longer. Please feel free to leave us a
                    message, we will get back to you ASAP. Thank you for your patience!
                  </div>
                  <el-button
                    :loading="loading"
                    class="message-guide-btn"
                    type="primary"
                    round
                    @click="handleContactUs(item)"
                  >
                    <div class="flex items-center justify-center">
                      <svg-icon name="mail" class="mr-5 text-[#ffffff]" width="16px" height="16px"></svg-icon>
                      Leave a message
                    </div>
                  </el-button>
                </div>
              </div>
              <!-- 普通文件以及压缩包 -->
              <div
                v-else-if="getCustomerMediaType(item) === 'fileMessage' || getMediaType(item) === 'FILE'"
                class="chat-list-item flex items-center"
                :class="{ reverse: item.isSelf, 'cursor-pointer': !item.isSelf }"
                :title="!item.isSelf ? 'Click to download' : ''"
                @click="downloadFile(item.attachment.raw.content.url, item.attachment.raw.content.name, item.isSelf)"
              >
                <div class="mr12 break-all">{{ item.attachment.raw.content.name }}</div>
                <svg-icon
                  :name="isZipFile(item.attachment.raw.content) ? `folder_zip` : `file_icon`"
                  class="ml-3 align-sub"
                  :class="[item.isSelf ? 'text-[#ffffff]' : 'text-[#2B8CED]']"
                  width="32px"
                  height="32px"
                ></svg-icon>
              </div>
              <!-- html -->
              <div
                v-else-if="
                  item.messageType === V2NIMMessageType.V2NIM_MESSAGE_TYPE_INVALID ||
                  (item.serverExtension && item.serverExtension.html)
                "
                class="chat-list-item markdown-body"
                :class="{ reverse: item.isSelf }"
                v-html="$xss(item.text)"
              ></div>
              <!-- 排队时显示 -->
              <div v-else-if="getBizType(item) === 'noticeImQueueNum' && isQueuing" class="queue-item">
                You are number
                <span class="text-[#2b8ced]">{{ queueNum }}</span>
                in the queue. We appreciate your patience during peak hours.
              </div>
              <!-- 结束会话问候语 -->
              <div v-else-if="getBizType(item) === 'backgroundCloseConversation'" class="chat-list-item">
                {{ item.attachment.raw.content.closingPhrase }}
              </div>
              <!-- 会话超时提醒 -->
              <div v-else-if="getBizType(item) === 'conversationWillClose'" class="chat-list-item-due">
                Your chat will close in {{ getWillCloseLimit }} minutes due to inactivity. Send a message now to keep
                the chat active, or restart it later if needed.
              </div>
              <!-- 会话超时关闭提示语 -->
              <div v-else-if="getBizType(item) === 'conversationTimeoutClose'" class="chat-list-item-due">
                Your chat has been closed due to {{ item.attachment.raw.content.time }} minutes of inactivity. If you
                still need help, please start the chat again.
              </div>
              <!-- 文本 -->
              <div
                v-else-if="
                  !['unOnline', 'waitMsg', 'frontendCloseConversation', 'transferEmailCloseConversation'].includes(
                    getBizType(item)
                  )
                "
                class="chat-list-item"
                :class="{ reverse: item.isSelf }"
                style="white-space: pre-wrap; word-break: break-word"
                v-html="matchEmoji($xss(item.text), emojiArr)"
              ></div>
              <!-- 标记表情 -->
              <img
                v-if="item.isSelf && currentMarkEmoji"
                :src="`${markEmojiArr[currentMarkEmoji]}`"
                class="ml-[10px] addEmojiIcon selfEmojiIcon"
                alt=""
                @mouseenter.stop="handleHeaderMouseEnter"
              />
            </div>
            <svg-icon
              v-if="
                item.isSelf &&
                ![
                  'preEvaluation',
                  'revoke',
                  'allocation',
                  'noticeImQueueNum',
                  'backgroundCloseConversation',
                  'conversationTimeoutClose',
                  'allocationFailure',
                  'unOnline',
                  'waitMsg',
                  'frontendCloseConversation',
                  'transferEmailCloseConversation'
                ].includes(getBizType(item))
              "
              :class="{ 'mr-[10px]': getBizType(item) !== 'evaluation' }"
              :name="item.serverExtension && item.serverExtension.readFlag ? 'readed' : 'unread'"
              width="24"
              height="24"
            />
            <!-- 表情标记icon -->
            <Transition name="bounce">
              <template v-if="canMarkType">
                <img
                  v-if="!currentMarkEmoji && canIMark && !markFlag && showEmojiIcon"
                  :src="require(`../imgs/add_emoji.png`)"
                  class="ml-[10px] addEmojiIcon"
                  alt=""
                  @click="openEmojiMark"
                  @mouseenter.stop="handleHeaderMouseEnter"
                />
                <div
                  v-else-if="currentMarkEmoji && !item.isSelf"
                  class="flex items-center justify-center rounded-[8px] bg-[#fff] ml-[10px] w-[26px] h-[26px]"
                  @mouseenter.stop="handleHeaderMouseEnter"
                >
                  <img
                    :src="`${markEmojiArr[currentMarkEmoji]}`"
                    width="18px"
                    height="18px"
                    alt=""
                    @click="openEmojiMark"
                  />
                </div>
              </template>
            </Transition>
          </div>
        </div>
      </el-popover>
    </div>
    <div v-if="item.lastHistoricalFlag" class="historical-tag"><span>Chat History</span></div>
  </div>
</template>

<script lang="ts" setup>
  import { PropType, ref, inject, defineEmits, onMounted, onUnmounted, computed, watch } from 'vue'
  import type { V2NIMMessage } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'
  import logoUrl from '../imgs/logo.png'
  import { V2NIMMessageType } from '../neteast-im/types'
  import { formatDate, emojiArr, getBizType, getMediaType, markEmojiArr } from '../utils'
  import ChatOrderItem from './ChatOrderItem.vue'
  import ChatRateService from './ChatRateService.vue'
  import ChatImageItem from './ChatImageItem.vue'
  import ChatVideoItem from './ChatVideoItem.vue'
  import ChatInAppItem from './ChatInAppItem.vue'
  import ChatEvaluationItem from './ChatEvaluationItem.vue'
  import CustomerServiceTip from './CustomerServiceTip.vue'
  import ChatRevokeItem from './ChatRevokeItem.vue'
  import { imFileDownloadFile, allocatedEmployee } from '#shared/apis'
  import { getEnvConfig } from '#shared/utils'

  const envConfig = getEnvConfig()
  const queueNum = inject<any>('queueNum')
  const isQueuing = inject<any>('isQueuing')
  const willCloseLimit = inject<any>('willCloseLimit')
  const revokeDrawLimit = inject<any>('revokeDrawLimit')
  const handleOpenLeaveMessageModal = inject<any>('handleOpenLeaveMessageModal')
  const handleSendP2PMessageReceipt = inject<any>('handleSendP2PMessageReceipt')
  const historyFlag = inject<boolean>('historyFlag')
  const markFlag = ref(false)
  const currentMarkEmoji = ref('')
  const isCloseConversation = inject<any>('isCloseConversation')
  const handleMarkEmoji = inject<any>('handleMarkEmoji')
  const props = defineProps({
    item: {
      type: Object as PropType<V2NIMMessage>,
      default: null
    }
  })
  const emit = defineEmits(['revoke', 'onQuoteMsg'])
  const msgMenuFlag = ref(false)
  const showEmojiIcon = ref(false)
  const getAvatarUrl = (serverExtension: any) => {
    if (serverExtension && serverExtension.eim) {
      return imFileDownloadFile(serverExtension.eim)
    } else {
      return logoUrl
    }
  }
  const matchEmoji = (msg = '', emojiArr: any) => {
    // 匹配表情包
    Object.keys(emojiArr).forEach((item) => {
      msg = msg.replaceAll(item, `<img src="${emojiArr[item]}" alt="${item}" class="emoji-tag"/>`)
    })

    return msg
  }
  // 即将超时倒计时
  const getWillCloseLimit = computed(() => {
    return Math.ceil(willCloseLimit.value / 60)
  })
  function getCustomerMediaType(item: V2NIMMessage) {
    if (item.messageType === V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && item.attachment && item.attachment.raw) {
      return item.text
    } else {
      return null
    }
  }
  const downloadFile = (url: string, fileName: string, isSelf: boolean) => {
    // if (isSelf) return
    const a = document.createElement('a')
    // 获取文件名fileName
    a.download = fileName
    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  const isZipFile = (item: any) => {
    if (item.content_type) {
      return item.content_type.includes('zip')
    } else {
      return item.contentType.includes('zip')
    }
  }
  const loading = ref(false)

  // 获取帮助文档页面
  function getHelpPath() {
    const origin = location.origin
    switch (true) {
      case origin === envConfig.SHOP_CART_BASE_URL: // 购物车
        return `${envConfig.PCB_BASE_URL}/help`
      case origin === envConfig.CHECKOUT_BASE_URL: // 结算页域名
        return `${envConfig.PCB_BASE_URL}/help`
      case origin === envConfig.PCB_LAYOUT_BASE_RUL: // layout
        return `${envConfig.PCB_BASE_URL}/help`
      case origin === envConfig.DFM_TOOL_BASE_URL: // DFM独立站
        return `${envConfig.PCB_BASE_URL}/help/catalog/2061-DFM-Tool-Help`
      case origin === envConfig.PCB_BASE_URL: // PCB
        return '/help'
      case origin === envConfig.TD_BASE_URL: // 3D
        return '/help'
      case origin === envConfig.CNC_BASE_URL: // CNC
        return '/help'
      case origin === envConfig.FA_BASE_URL: // FA 域名
        return '/help'
      default:
        return `${envConfig.PCB_BASE_URL}/help`
    }
  }
  // 获取联系我们链接
  function getContactUsLink() {
    const helpLink = getHelpPath()
    return `${helpLink}/contact`
  }

  // 跳转到联系我们
  async function handleContactUs(item: V2NIMMessage) {
    loading.value = true
    try {
      // 判断是否有客服在线
      // step1 分配处理人
      const res = await allocatedEmployee(item.attachment.raw.content.conversationBizKey)
      if (!res) {
        // window.open(getJumpLink(getContactUsLink(), getLang()), '_blank')
        handleOpenLeaveMessageModal()
        return
      } else {
        item.attachment.raw.content.closed = true
      }
    } catch (err) {
      console.log(err)
    } finally {
      loading.value = false
    }
  }

  const canRevokeFlag = ref(true)
  const canReplyFlag = ref(false)
  const handleUnsend = (item: V2NIMMessage) => {
    if (!canRevokeFlag.value) return
    emit('revoke', item)
    msgMenuFlag.value = false
  }
  const handleQuoteMsg = (item: V2NIMMessage) => {
    if (!canReplyFlag.value) return
    emit('onQuoteMsg', item)
    msgMenuFlag.value = false
  }
  const handlePopoverShow = (item: any) => {
    canRevokeFlag.value =
      item.isSelf &&
      item.sendingState === 1 &&
      !['preEvaluation', 'evaluation', 'frontendCloseConversation', 'allocation', 'revoke'].includes(
        getBizType(item)
      ) &&
      Date.now() - item.createTime < revokeDrawLimit.value
    canReplyFlag.value =
      item.sendingState === 1 &&
      ![
        'preEvaluation',
        'frontendCloseConversation',
        'allocation',
        'revoke',
        'waitMsg',
        'unOnline',
        'noticeImQueueNum',
        'backgroundCloseConversation',
        'conversationWillClose',
        'conversationTimeoutClose',
        'transferEmailCloseConversation'
      ].includes(getBizType(item))
  }

  // Reference to the DOM element
  const itemElement = ref(null)

  // Observer instance
  let observer: IntersectionObserver | null = null

  // Setup the intersection observer
  function setupObserver() {
    // Only set up observer if the item hasn't been seen yet
    if (props.item.isSelf) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !props.item.isSelf) {
            handleSendP2PMessageReceipt(props.item.messageClientId)
            // Stop observing this element
            observer.unobserve(entry.target)
            observer.disconnect()
            observer = null
          }
        })
      },
      {
        threshold: 0.5 // Element is considered visible when 50% is in view
      }
    )

    // Start observing the element
    if (itemElement.value && !props.item.isSelf) {
      observer.observe(itemElement.value)
    }
  }

  const chatStep = inject<any>('chatStep')
  // 是否能标记操作
  const canIMark = computed(() => {
    return !props.item.isSelf && !props.item.historicalFlag && chatStep.value === 'chat' && !isCloseConversation.value
  })
  // 可以被标记的类型
  const canMarkType = computed(() => {
    return (
      props.item.messageClientId &&
      ![
        'openConversation',
        'allocation',
        'allocationFailure',
        'revoke',
        'frontendCloseConversation',
        'noticeImQueueNum',
        'conversationWillClose',
        'conversationTimeoutClose',
        'transferEmailCloseConversation',
        'orderInfo',
        'preEvaluation',
        'evaluation',
        'imSourceEntranceInApp',
        'noticeImQueueNum',
        'backgroundCloseConversation',
        'conversationWillClose',
        'conversationTimeoutClose',
        'unOnline',
        'waitMsg'
      ].includes(getBizType(props.item)) &&
      !props.item.disabledMark
    )
  })
  const openEmojiMark = () => {
    if (canMarkType.value && canIMark.value) {
      setTimeout(() => {
        markFlag.value = true
      }, 0)
    }
  }
  const closeEmojiBox = () => {
    markFlag.value = false
  }
  const handleChooseEmoji = (e: string) => {
    if (canMarkType.value && canIMark.value) {
      currentMarkEmoji.value = e
      markFlag.value = false
      const message = JSON.parse(JSON.stringify(props.item))
      message.serverExtension.emojiList = [e]
      handleMarkEmoji(message)
    }
  }

  const handleHeaderMouseEnter = () => {
    msgMenuFlag.value = false
  }

  // 调用注入的方法移除评价提示
  const movePreEvaluation = inject<any>('movePreEvaluation')
  const evaluationTimeout = ref<any>(null)
  // 监听item变化或初始化时启动定时器
  watch(
    () => props.item,
    (item) => {
      if (getBizType(item) === 'preEvaluation') {
        // 清除旧定时器（防重复）
        clearTimeout(evaluationTimeout.value)
        evaluationTimeout.value = setTimeout(() => {
          movePreEvaluation?.()
        }, 30 * 60 * 1000) // 30分钟
      }
      if (item.serverExtension && item.serverExtension.emojiList) {
        currentMarkEmoji.value = item.serverExtension.emojiList[0]
        console.log('currentMarkEmoji===>', currentMarkEmoji)
      }
    },
    { deep: true, immediate: true }
  )

  const quoteMsg = computed(() => {
    if (!props.item.serverExtension || !Object.keys(props.item.serverExtension).length) {
      return false
    }
    const itemIsSelf = props.item.isSelf
    if (!props.item.serverExtension.reference) {
      return false
    }
    const { isSelf, sender, text, customerFlag } = props.item.serverExtension.reference
    if (!text) return false
    let nickName = ''
    if (customerFlag || (itemIsSelf && isSelf)) {
      nickName = 'Me: '
    } else {
      nickName = sender + ': '
    }

    return {
      nickName,
      text: text.length > 100 ? text.substring(0, 100) + '...' : text
    }
  })

  // Lifecycle hooks
  onMounted(() => {
    clearTimeout(evaluationTimeout.value)
    // 允许重复发起已读
    setupObserver()
  })

  onUnmounted(() => {
    // Clean up observer
    if (observer) {
      observer.disconnect()
      observer = null
    }
  })

  defineExpose({ closeEmojiBox })
</script>

<style lang="scss">
  .reverse {
    flex-direction: row-reverse;
  }
  .chat-list-item.markdown-body {
    box-sizing: border-box;
    min-width: 275px;
    max-width: 275px;
    padding: 10px 12px;
    ul,
    ol {
      margin: 12px 0;
      list-style: none;
      li {
        margin-bottom: 8px;
        line-height: 22px;
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
    img {
      max-width: 100%;
    }
    a {
      color: #2b8ced;
    }
    p {
      line-height: 22px;
      margin-bottom: 8px;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
</style>

<style scoped lang="scss">
  // @import url('../../../assets/styles/github-markdown.css');
  .chat-order-im-item {
    width: 280px;
    background-color: #2b8ced;
    border-radius: 8px 0px 8px 8px;
    padding-left: 15px;
    padding-top: 10px;
    padding-bottom: 10px;

    :deep(.chat-order-title-label) {
      color: #fff;
    }

    :deep(.chat-order-code) {
      color: #fff;
    }

    :deep(.chat-price) {
      color: #fff;
    }

    :deep(.chat-status) {
      color: #fff;
    }

    :deep(.chat-status-dot) {
      background-color: #fff;
    }
  }

  .chat-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .chat-user {
    display: flex;
    margin-bottom: 20px;
  }

  .chat-list-item-time {
    position: absolute;
    color: #999;
    top: -15px;
    left: 46px;
    font-size: 12px;
    transform: scale(0.9);
    display: none;
    width: 115px;
  }

  .chat-list-item {
    display: inline-block;
    border-radius: 0px 12px 12px 12px;
    background-color: #fff;
    padding: 10px 12px;
    max-width: 275px;
    line-height: 18px;
    margin-left: 8px;
    position: relative;

    &:hover {
      .chat-list-item-time {
        display: block;
      }
    }

    &.reverse {
      border-radius: 12px 0px 12px 12px;
      background-color: #2b8ced;
      color: #fff;
      margin-left: 0;
    }
    :deep(.emoji-tag) {
      width: 30px;
      height: 30px;
    }
  }

  .chat-label-item {
    position: relative;
  }

  .chat-label-item:hover {
    .chat-list-item-time {
      display: block;
    }

    .revoke-icon {
      display: block;
    }
  }

  .chat-user-avatar {
    margin-left: 12px;
  }

  .revoke-icon {
    position: absolute;
    cursor: pointer;
    left: -20px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
  }

  .chat-real-item {
    position: relative;
    display: flex;
    margin-bottom: 20px;

    &.reverse {
      flex-direction: row-reverse;
      .chat-list-item {
        max-width: 305px;
        word-wrap: break-word;
        word-break: break-all;
        white-space: normal;
        margin-right: 12px;
      }
      .chat-list-item-time {
        left: auto;
        right: 0px;
        &.center {
          left: 50%;
          transform: translateX(-50%) scale(0.9);
        }
      }
    }
  }
  .mr12 {
    margin-right: 12px;
  }

  .mes-list-item {
    display: flex;
    margin-bottom: 16px;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;

    &:hover {
      color: #2b8ced;
    }
  }
  .message-guide {
    margin: 0 auto;
    width: 304px;
  }

  .message-guide-box {
    margin: 0px 0 32px;
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    padding: 16px 12px;
  }
  .message-guide-box-label {
    font-size: 14px;
    margin-bottom: 20px;
    line-height: 20px;
    font-weight: 500;
  }

  .message-guide-btn {
    width: 100%;
  }

  .queue-item {
    background: #ffffff;
    border-radius: 4px;
    margin: 0 20px;
    font-size: 14px;
    color: #666666;
    line-height: 18px;
    padding: 8px 12px;
    span {
      color: #2b8ced;
    }
  }
  .canRevokeFlag {
    cursor: no-drop;
  }
  .hand {
    cursor: pointer;
  }
  .chat-list-item-due {
    padding: 4px 8px;
    background: #f8f8f8;
    border-radius: 4px;
    width: 335px;
    font-size: 12px;
    font-family: PingFang SC, PingFang SC-400;
    font-weight: 400;
    color: #999999;
    line-height: 16px;
    margin: 0 12px;
    width: calc(100% - 24px);
    box-sizing: border-box;
  }
  .quote-box {
    background: #499cf0;
    border-left: 2px solid #84c2ff;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 12px;
    color: #b4d9ff;
    line-height: 16px;
    margin-bottom: 5px;
    cursor: pointer;
    opacity: 0.8;
    max-width: 305px;
  }
  .quote-box-unself {
    background: #e5e9ef;
    color: #999;
    border-left: 2px solid #dcdfe4;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .addEmojiIcon {
    width: 24px;
    height: 24px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
  .selfEmojiIcon {
    position: absolute;
    bottom: -15px;
    left: -20px;
    padding: 2px;
    background-color: #fff;
    border-radius: 50%;
  }
  .mark-emoji-box {
    position: absolute;
    top: -58px;
    left: -2px;
    z-index: 999;
    max-width: 292px;
    height: 52px;
    background: #ffffff;
    border: 1px solid #e5e8f1;
    border-radius: 8px;
    box-shadow: 0px 4px 8px 0px rgba(78, 122, 194, 0.2);
    align-items: center;
    column-gap: 24px;
    padding: 0 12px;
    margin-top: 10px;
    .mark-emoji-item {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      &:hover {
        background-color: #f1f3f6;
      }
    }
  }
  .items-end {
    align-items: flex-end;
  }
  .bounce-enter-active {
    animation: bounce-in 0.3s;
  }
  .bounce-leave-active {
    animation: bounce-in 0.3s reverse;
  }
  @keyframes bounce-in {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }
  .historical-tag {
    padding: 0 12px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 14px;
    color: #999999;
    margin-bottom: 20px;
    & > span {
      padding: 0 9px;
      background-color: #f1f4f9;
      z-index: 2;
    }
    &::before {
      content: '';
      width: 132px;
      position: absolute;
      left: 12px;
      top: 50%;
      border: 1px solid;
      border-image: linear-gradient(90deg, rgba(238, 238, 238, 0), #dbdbdb 100%) 1 1;
    }
    &::after {
      content: '';
      width: 132px;
      position: absolute;
      right: 12px;
      top: 50%;
      border: 1px solid;
      border-image: linear-gradient(90deg, #dbdbdb, rgba(238, 238, 238, 0) 100%) 1 1;
    }
  }
</style>
<style lang="scss">
  .msgMenu {
    background: rgba(34, 34, 34, 0.85);
    border: 1px rgba(34, 34, 34, 0.85) solid;
    border-radius: 4px;
    box-shadow: 0px 4px 8px 0px rgba(78, 122, 194, 0.2);
    color: #fff;
    padding: 10px 14px;
    min-width: 80px;
    &[x-placement^='top'] {
      margin-bottom: 6px;
      .popper__arrow {
        border-top-color: rgba(34, 34, 34, 0.3) !important;
        &::after {
          border-top-color: rgba(34, 34, 34, 0.75) !important;
        }
      }
    }
    &[x-placement^='bottom'] {
      margin-top: 6px;
      .popper__arrow {
        border-bottom-color: rgba(34, 34, 34, 0.3) !important;
        &::after {
          border-bottom-color: rgba(34, 34, 34, 0.75) !important;
        }
      }
    }
  }
</style>
