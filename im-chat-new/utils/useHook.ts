import { computed, nextTick, onMounted, provide, Ref, ref, watch, onBeforeUnmount, onErrorCaptured } from 'vue'
import type {
  V2NIMMessage,
  V2NIMP2PMessageReadReceipt
} from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'
import { escapeHtml } from 'xss'
import uniqBy from 'lodash/uniqBy'
import last from 'lodash/last'
import { buildUuid, debounce } from '@jlc/utils'
import { V2NIMBroadcastNotification, V2NIMConnectStatus, V2NIMLoginStatus, V2NIMMessageType } from '../neteast-im/types'
import type { BusinessItemType } from '../utils/business'
import { ChatStep, ImAccountResponse, ImChatFileItem } from '../types'
import getNetNim from '../neteast-im'
import mockActtion from '../neteast-im/mock/mockAction'
import { business, emojiArr } from '../utils/business'
import { dealMsgList, getBizType, getMediaType, helloText, imSilentLogin, unOnlineText, waitText } from './index'
import xss from '#shared/plugins/xss'

import {
  hasOnlineEmployee,
  initImAccount,
  saveTraceMessageEvent,
  queryCustomerImIsSmartSuggestions,
  saveImSmartSuggestions,
  imGetAll,
  checkLogin,
  imLogin,
  getValidConversation,
  findRelationConversationWorkOrder,
  randomFindEmployeeInfo,
  preAllocatedEmployee,
  findUserEmailVal,
  sendEvaluationInfoAtBg,
  queryRevokeDrawLimit,
  markPlatformMessageEmoji
} from '#shared/apis'
import { getEnvConfig, getJumpLink, isApp } from '#shared/utils'
import { useIsLogin } from '#shared/hooks'
import { getMessages } from '#shared/utils/imMessage'

export default function useHook(props: any, uploadConfig?: any) {
  const waittingAllocationTime = 15 * 60 * 1000 // 等待15分钟
  let waittingTimer: any = null
  let messageTimer: any = null
  let transferEmailModalTimer: any = null
  const isLogin = useIsLogin()
  const isCloseTheChat = ref(false) // 是否关闭工单
  const isHasService = ref(false) // 是否有客服接入，如果有客服接入，需要记住
  const isHasOnlineEmployee = ref(true) // 是否有客服在线
  const ChatFooterRef = ref<any>(null)
  const chatContainerRef = ref<any>(null) as Ref<HTMLDivElement>
  const chatStep = ref<ChatStep>('') // 聊天窗口当前操作步骤
  const isShowLoading = ref(false) // 加载效果
  const isShowWindow = ref(false) // 是否显示聊天窗口
  const currentBusiness = ref<BusinessItemType | null>(null) // 当前选择的业务类型
  const isCanScrollToTop = ref(false) // 是否能向上滚动
  const limit = ref(13) // 聊天窗口默认显示的消息数
  const isSendingMsg = ref(false) // 是否正在发送消息
  const isChatReady = ref(false) // 是否已准备好IM
  const isShowOrderPopup = ref(false) // 是否显示订单
  const orderListRef = ref<any>(null)
  const isShowIntelligenticon = ref(false) // 是否显示智能联想弹框
  const isStartIntelligenticon = ref(false) // 是否开启智能联想
  const isCloseConversation = ref(true) // 会话是否已经关闭
  const evaluationInfo = ref({
    rateLevel: 0, // 1-点赞、3-点踩
    content: '', // 内容
    isSolved: true // 是否解决
  })
  const isMin = ref(false) // 是否是最小化
  const envConfig = getEnvConfig()
  const fileList = ref<any[]>([])
  const isDragging = ref(false)
  // 打开弹框时的提示信息
  const tipMsg = ref({
    createTime: Date.now(),
    text: helloText,
    messageType: V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT,
    isSelf: false,
    serverExtension: {
      eim: ''
    }
  })
  // 消息列表
  const messageList = ref<V2NIMMessage[]>([])
  // 排序后的消息列表
  const msgs = computed(() => {
    const list: V2NIMMessage[] = messageList.value

    // 调试：检查消息是否有有效的 messageClientId
    const messagesWithoutClientId = list.filter((msg) => !msg.messageClientId)
    if (messagesWithoutClientId.length > 0) {
      console.warn('⚠️ 发现没有 messageClientId 的消息:', messagesWithoutClientId.length, '条')
      messagesWithoutClientId.forEach((msg) => {
        console.log('缺失 messageClientId 的消息:', {
          messageServerId: msg.messageServerId,
          text: msg.text?.substring(0, 30) || 'no text',
          createTime: new Date(msg.createTime).toLocaleString()
        })
      })
    }

    // 为没有 messageClientId 的消息生成唯一 ID
    const processedList = list.map((msg) => {
      if (!msg.messageClientId) {
        console.warn('⚠️ 为消息生成缺失的 messageClientId:', msg.text?.substring(0, 30) || 'no text')
        return {
          ...msg,
          messageClientId: msg.messageServerId || buildUuid()
        }
      }
      return msg
    })

    const newArr = uniqBy(
      processedList.sort((a, b) => a.createTime - b.createTime),
      'messageClientId'
    )
    const condition = (item: V2NIMMessage) =>
      item.attachment &&
      ['frontendCloseConversation', 'transferEmailCloseConversation', 'backgroundCloseConversation'].includes(
        getBizType(item)
      )
    const lastIndex = newArr.reduce((acc, item, index) => {
      return condition(item) ? index : acc
    }, -1)

    // 如果找到了满足条件的项，标记它之前的所有项（历史数据）
    if (lastIndex !== -1) {
      newArr.forEach((item, index) => {
        if (index < lastIndex) {
          item.historicalFlag = true
        } else {
          item.historicalFlag = false
        }
        if (index === lastIndex) {
          item.lastHistoricalFlag = true
        } else {
          item.lastHistoricalFlag = false
        }
      })
    }

    return newArr
  })

  // 是否断开 im 链接
  const isDisconnected = ref(false)

  const initCustomerInfo = {
    employeeEnName: '',
    eim: '',
    ck: '',
    workOrderAccessId: ''
  }
  // 客服账号信息
  const customerServiceInfo = ref(JSON.parse(JSON.stringify(initCustomerInfo)))

  const sceneCode = ref(101)

  const accountId = ref('')
  const showRedDot = ref(false)

  const queueNum = ref(0)
  const isShowMessageModal = ref(false)
  const isShowWaitingMessage = ref(false)
  const isShowEvaluationModal = ref(false) // 评价显示，接收到后台关闭通知
  const isQueuing = ref(false) // 由于退出会话还会接收到排队信息,定义退出会话同时会退出排队
  const revokeDrawLimit = ref(10 * 60 * 1000) // 撤回时间限制

  let willCloseTimer: any = null
  const willCloseLimit = ref<number>(180)
  const isBackgroundClose = ref(false) // 是否触发了会话关闭
  const isTransferEmailCloseFlag = ref(false) // 是否触发了在线转邮件工单关闭
  const transferEmailCloseCountDown = ref(4) // 弹窗自动关闭倒计时
  const historyFlag = ref(false) // 是否处于查看历史记录模式

  provide('accountId', accountId)
  provide('currentBusiness', currentBusiness)
  provide('queueNum', queueNum)
  provide('isQueuing', isQueuing)
  provide('revokeDrawLimit', revokeDrawLimit)
  provide('willCloseLimit', willCloseLimit)
  provide('isCloseConversation', isCloseConversation)
  provide('isBackgroundClose', isBackgroundClose)
  provide('chatStep', chatStep)
  provide('historyFlag', historyFlag)

  // 打开留言弹窗
  const handleOpenLeaveMessageModal = () => {
    isShowMessageModal.value = true
  }
  provide('handleOpenLeaveMessageModal', handleOpenLeaveMessageModal)

  // 智能联想开关
  function handleIntelligenticonChange(bool: boolean) {
    isStartIntelligenticon.value = bool
    saveImSmartSuggestions({ isSmartSuggestions: bool })
  }

  function onDisconnected(code: number, message: string) {
    if (props.platform !== 'H5') {
      handleCloseChat()
      isDisconnected.value = true
      saveTraceMessageEvent({
        traceId: accountId.value,
        traceEventType: 6,
        createTime: Date.now(),
        data: {
          desc: '登录连接断开回调，返回错误码和错误信息',
          code,
          message
        }
      })
    }
  }
  function onLoginStatus(status: V2NIMLoginStatus) {
    if (status === 1) {
      saveTraceMessageEvent({
        traceId: accountId.value,
        traceEventType: 5,
        createTime: Date.now(),
        data: {
          desc: '已登录',
          status
        }
      })
    }
  }
  function onLoginFailed(code: number, message: string) {
    saveTraceMessageEvent({
      traceId: accountId.value,
      traceEventType: 6,
      createTime: Date.now(),
      data: {
        desc: '登录失败回调，返回错误码和错误信息',
        code,
        message
      }
    })
  }
  function onConnectStatus(status: V2NIMConnectStatus) {
    if (status === 1) {
      saveTraceMessageEvent({
        traceId: accountId.value,
        traceEventType: 5,
        createTime: Date.now(),
        data: {
          desc: '已连接',
          status
        }
      })
    }
  }
  function onConnectFailed(code: number, message: string) {
    saveTraceMessageEvent({
      traceId: accountId.value,
      traceEventType: 6,
      createTime: Date.now(),
      data: {
        desc: '登录连接失败回调，返回错误码和错误信息',
        code,
        message
      }
    })
  }

  // 选择业务线
  const handleSelectBusiness = (item: BusinessItemType) => {
    currentBusiness.value = item
  }

  // 智能联想
  const handleIntelligenticon = () => {
    isShowIntelligenticon.value = true
  }

  // 发送 FAQ
  const handleSendFaqMessage = (item: any) => {
    handleSendMessage('faq', item)
  }

  // 发送评价
  const handleSubmitEvaluation = debounce(async function (evaluationInfo: any) {
    isShowH5RateService.value = false

    // pc侧有两种情况，一种是用户主动关闭会话时的弹出，提交评价后将关闭会话，一种是用户主动点击底部的评价按钮，或者会话自动关闭了弹出
    if (isCloseTheChat.value) {
      // 触发主动关闭并提交评价
      handleCloseChat(true, evaluationInfo.rateLevel ? { evaluation: evaluationInfo } : {})
    } else if (isShowEvaluationModal.value) {
      // 会话自动关闭，用户提交了评价
      const res = await sendEvaluationInfoAtBg({
        accessId: customerServiceInfo.value.workOrderAccessId,
        ...evaluationInfo
      })
      if (res) {
        isShowEvaluationModal.value = false
      }
      handleSendMessage('evaluation', { ...evaluationInfo, routeEnabled: false })
    } else {
      handleSendMessage('evaluation', evaluationInfo)
    }
  }, 500)

  // 显示订单列表
  const handleSendOrder = (orderItem: any) => {
    isShowOrderPopup.value = false
    if (orderItem.source === 'cart') {
      const orderInfo = JSON.parse(JSON.stringify(orderItem))
      orderInfo.orderAmount = orderInfo.orderAmount.replace(/^\$/, '')
      handleSendMessage('order', orderInfo)
    } else {
      handleSendMessage('order', orderItem)
    }
    console.log(orderItem)
  }

  // 上传文件
  const handleUploadFile = (fileItem: ImChatFileItem) => {
    const fileExtension = fileItem.name.substring(fileItem.name.lastIndexOf('.')).toLowerCase()
    console.log(fileItem)

    if (fileItem.type.startsWith('image')) {
      // 图片
      handleSendMessage(fileItem.type, fileItem.fileUrl)
    } else if (fileItem.type.startsWith('video')) {
      // 视频
      handleSendMessage(fileItem.type, fileItem.fileUrl)
    } else {
      // 其他文件
      handleSendMessage(fileExtension, fileItem.fileUrl, fileItem.name)
    }
  }

  // 发送文本消息
  const handleTextMessage = (msg: string) => {
    handleSendMessage('text', xss(escapeHtml(msg)))
  }

  const isShowH5RateService = ref(false)

  // 显示评价弹框
  const handleRateService = () => {
    if (props.platform === 'PC') {
      handleSendMessage('preEvaluation', evaluationInfo.value)
      isShowEvaluationModal.value = false
    } else if (props.platform === 'H5') {
      moveEvaluation()
      isShowH5RateService.value = true
    }
  }

  // 获取当前业务线
  function getBusiness() {
    if (currentBusiness.value) {
      return currentBusiness.value.value
    } else if (!isCloseConversation.value && !currentBusiness.value && msgs.value && msgs.value.length) {
      // 会话没有关闭，并且当前没有选择的业务线信息，从历史消息中获取业务线
      for (let i = msgs.value.length - 1; i >= 0; i--) {
        const item = msgs.value[i]
        if (item?.serverExtension?.businessType) {
          return item.serverExtension.businessType
        }
      }
      return null
    }
    return null
  }

  // 发送消息
  const handleSendMessage = async (type: string, msg: any, name?: string) => {
    const supportedFlag = uploadConfig.accept.includes(type)
    if (!msg) return
    isSendingMsg.value = true
    if (isCloseConversation.value) {
      // waitService()
    }
    isCloseConversation.value = false
    isBackgroundClose.value = false
    const opts: any = { businessType: getBusiness() }
    if (supportedFlag) {
      opts.accept = uploadConfig.accept
      opts.name = name
    }
    // 额外处理引用消息
    if (Object.keys(quoteMsg.value).length) {
      const reference = {
        platfrom: 'web',
        text: getQuoteMsgText(quoteMsg.value as any),
        isSelf: quoteMsg.value.isSelf,
        msgKey: quoteMsg.value.messageClientId,
        sender: quoteMsg.value.isSelf ? 'Customer' : quoteMsg.value.serverExtension.ena,
        customerFlag: quoteMsg.value.isSelf
      }
      opts.reference = reference
    }

    sendMessage(type, msg, opts).then((res) => {
      clearQuoteMsg()
      // 消息发送成功后需要将对应的消息更新下
      if (res?.message) {
        messageList.value = messageList.value.map((item) => {
          return item.messageClientId === res.message.messageClientId
            ? { ...item, ...dealMsgList([res.message])[0] }
            : item
        })
      }
    })

    try {
      // 判断是否有客服在线
      const res = await hasOnlineEmployee()
      if (!res) {
        handleSendMessage('unOnline', unOnlineText)
        setTimeout(() => {
          isHasOnlineEmployee.value = res
          sceneCode.value = 101
        }, 3000)
      }
    } catch (err) {
      console.log(err)
    }
  }

  // 加载历史消息
  const handleLoadPreMsgs = async ($state: any) => {
    await waitReady()
    if (isCanScrollToTop.value) {
      let list = await getMessageList(msgs.value[0].createTime)
      console.log('消息列表历史消息', list)
      if (list && list.length) {
        list = list.filter(
          (item) =>
            !['openConversation', 'frontendCloseConversation', 'conversationWillClose'].includes(getBizType(item))
        )
        // 加载历史数据
        console.log('消息数据为--2')
        messageList.value.push(...list)
        $state.loaded()
      } else {
        // 已加载完历史数据
        $state.complete()
      }
    } else {
      $state.complete()
    }
  }

  // 等待IM准备就绪
  function waitReady() {
    return new Promise((resolve) => {
      if (isChatReady.value) return resolve(true)
      let readyTimer: any = null
      function tempFn() {
        clearTimeout(readyTimer)
        readyTimer = setTimeout(() => {
          if (isChatReady.value) {
            resolve(true)
          } else {
            tempFn()
          }
        }, 200)
      }
      tempFn()
    })
  }

  function getCustomerMediaType(item: V2NIMMessage) {
    if (item.messageType === V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM && item.attachment && item.attachment.raw) {
      return item.text
    } else {
      return null
    }
  }

  function onReceiveBroadcastNotifications(broadcastNotification: V2NIMBroadcastNotification[]) {
    console.log('广播消息为：', broadcastNotification)
    // 接收到广播消息，更新 客服信息，修改页面展示即可
  }
  // 收到系统通知
  function onReceiveCustomNotifications(data: any) {
    console.log('叮咚鸡叮咚鸡==》', data)
    const item = data[0]
    if (item) {
      item.messageType = 100
      item.createTime = Date.now()
      item.messageClientId = buildUuid()
      item.attachment = {
        raw: { ...JSON.parse(item.content) }
      }
      if (getBizType(item) === 'noticeImQueueNum') {
        // 有在会话中才设置
        if (!isCloseConversation.value) {
          isQueuing.value = true
          queueNum.value = item.attachment.raw.content.queueNum
          const idx = messageList.value.findIndex((item) => {
            return item.attachment && item.attachment.raw.bizType === 'noticeImQueueNum'
          })
          // 如果是第一次推送或者列表中没有显示排队信息
          if (item.attachment.raw.content.isFirstPush || idx === -1) {
            clearTimeout(messageTimer)
            messageTimer = setTimeout(() => {
              if (!isMin.value && !isCloseConversation.value) {
                isShowWaitingMessage.value = item.attachment.raw.content.isFirstPush
              }
            }, 15000)
            moveQueue()
            messageList.value.push(...dealMsgList(data))
            nextTick(scrollToChatBottom)
          }
        }
      }
    }
  }
  function onMessageRevokeNotifications(data: any[]) {
    console.log('oi,有消息被撤回了==》', data)
    // 这里会将历史撤回过的都返回回来
    const nim = getNim()

    const markMatchedItems = (arrayA: any[], arrayB: any[], key = 'messageClientId', revokeMsg: any) => {
      // 创建 Map 存储 arrayA 的数据，用于快速查找
      const mapA = new Map(arrayA.map((item) => [item.messageRefer[key], item]))
      // 遍历 arrayB，标记匹配项
      return arrayB.map((item) => {
        return mapA.has(item[key]) ? revokeMsg : item
      })
    }
    data.forEach((msg) => {
      const curItem = messageList.value.find((item) => {
        return item.messageClientId === msg.messageRefer.messageClientId
      })
      if (curItem) {
        let type = 'TEXT'
        if (
          getBizType(curItem) === 'orderInfo' ||
          ['imageMessage', 'videoMessage', 'fileMessage'].includes(getCustomerMediaType(curItem)) ||
          ['PICTURE', 'VIDEO', 'FILE'].includes(getMediaType(curItem))
        ) {
          type = 'OHTER'
        }

        const revokeMsg = nim.V2NIMMessageCreator.createCustomMessage(
          '',
          JSON.stringify({ bizType: 'revoke', type: type || 'TEXT' })
        )

        revokeMsg.createTime = curItem.createTime - 1
        revokeMsg.attachment.raw = JSON.parse(revokeMsg.attachment.raw)
        revokeMsg.attachment.raw.employeeEnName = customerServiceInfo.value.employeeEnName
        revokeMsg.attachment.raw.isSelf = curItem.isSelf

        revokeMsg.messageClientId = curItem.messageClientId
        if (curItem.text) {
          revokeMsg.text = curItem.text
        }
        messageList.value = markMatchedItems(data, messageList.value, 'messageClientId', revokeMsg)
        console.log('revoke===messageList', messageList.value, revokeMsg)

        revokeList.push(revokeMsg)
      }
    })
  }

  function onReceiveMessagesModified(data: V2NIMMessage[]) {
    console.log('监听消息变更===》', data)
    const msg = data[0]
    const serverExtension = msg.serverExtension && JSON.parse(msg.serverExtension)
    const idx = messageList.value.findIndex((item) => item.messageClientId === msg.messageClientId)
    if (idx !== -1) {
      const curServerExtension = { ...messageList.value[idx].serverExtension }
      curServerExtension.readFlag = serverExtension.readFlag
      curServerExtension.emojiList = serverExtension.emojiList
      messageList.value[idx].serverExtension = curServerExtension
    }
  }

  // 去除评价弹框
  function movePreEvaluation() {
    messageList.value = messageList.value.filter((item) => !(item.text === 'preEvaluation' && item.attachment))
  }

  // 去除评价结果
  function moveEvaluation() {
    messageList.value = messageList.value.filter((item) => !(item.text === 'evaluation' && item.attachment))
  }

  // 去除排队提示
  function moveQueue() {
    // 将消息列表中排队提示信息移除
    messageList.value = messageList.value.filter(
      (item) => !(item.attachment && item.attachment.raw.bizType === 'noticeImQueueNum')
    )
  }

  // 去除会话即将关闭提示
  function moveWillCloseItem() {
    messageList.value = messageList.value.filter(
      (item) => !(item.attachment && item.attachment.raw.bizType === 'conversationWillClose')
    )
  }

  // 发送消息
  function onSendMessage(msg: V2NIMMessage) {
    movePreEvaluation()
    moveWillCloseItem()
    if (msg.text === 'preEvaluation' && msg.attachment) {
      moveEvaluation()
    }

    msg.sendingState = 3 // 发送消息时应该是处于发送中
    console.log('发送的消息为', msg)
    messageList.value.push(...dealMsgList([msg]))
    isSendingMsg.value = false
    ChatFooterRef.value.message = ''
    nextTick(scrollToChatBottom)
  }

  // 收到消息
  function onReceiveMessages(data: V2NIMMessage[]) {
    console.log('收到的消息为：', data)
    let listData = [...data]
    if (listData.length > 1) {
      listData = listData.filter((el) => !['conversationWillClose'].includes(getBizType(el)))
    }
    const item = data[0]
    if (item && data.length === 1) {
      if (getBizType(item) === 'backgroundCloseConversation') {
        isShowEvaluationModal.value = true
        handleSendMessage('preEvaluation', evaluationInfo.value)
        clearTimeout(willCloseTimer)
        moveWillCloseItem()
        if (item.serverExtension && item.serverExtension.workOrderAccessId) {
          customerServiceInfo.value.workOrderAccessId = item.serverExtension.workOrderAccessId
        }
        isCloseConversation.value = true
        // 业务关闭工单后，屏蔽关闭按钮
        clearTimeout(waittingTimer)
        clearTimeout(messageTimer)
        customerServiceInfo.value.ck = null
        isBackgroundClose.value = true
      }

      // 会话无客服接待，在线转邮件工单关闭(transferEmailCloseConversation ) data.length === 1主要是防止多次触发
      if (getBizType(item) === 'transferEmailCloseConversation' && data.length === 1) {
        if (item.serverExtension && item.serverExtension.workOrderAccessId) {
          customerServiceInfo.value.workOrderAccessId = item.serverExtension.workOrderAccessId
        }
        isCloseConversation.value = true
        // 业务关闭工单后，屏蔽关闭按钮
        clearTimeout(waittingTimer)
        clearTimeout(messageTimer)
        handleOnlyCloseChat()
        isTransferEmailCloseFlag.value = true
        transferEmailModalTimer = setInterval(() => {
          if (transferEmailCloseCountDown.value > 0) {
            transferEmailCloseCountDown.value--
          } else {
            clearInterval(transferEmailModalTimer)
            isTransferEmailCloseFlag.value = false
            transferEmailCloseCountDown.value = 4
          }
        }, 1000)
      }

      // 会话即将超时关闭 willCloseTimer
      if (getBizType(item) === 'conversationWillClose') {
        moveWillCloseItem() // 只保留显示一个即将关闭提示
        willCloseLimit.value = Number(item.attachment.raw.content.time) * 60
        function tempFn() {
          clearTimeout(willCloseTimer)
          willCloseTimer = setTimeout(() => {
            if (willCloseLimit.value <= 0) {
              clearTimeout(willCloseTimer)
            } else {
              willCloseLimit.value--
              !isCloseConversation.value && tempFn()
            }
          }, 1000)
        }
        tempFn()
      }

      if (getBizType(item) === 'allocation') {
        clearTimeout(waittingTimer)
        clearTimeout(messageTimer)
        // 收到客服消息后，移除排队信息
        isShowWaitingMessage.value = false
        queueNum.value = 0
        isQueuing.value = false
        moveQueue()
        moveWillCloseItem()
        // 当前会话是否未分配过客服
        if (typeof item.attachment.raw.content.firstAssign === 'undefined') {
          if (isHasService.value) {
            item.attachment.raw.content.firstAssign = false
          } else {
            item.attachment.raw.content.firstAssign = true
          }
        }
        isHasService.value = true
        customerServiceInfo.value.employeeEnName = item.attachment.raw.content.employeeEnName

        if (item.serverExtension && item.serverExtension.eim) {
          customerServiceInfo.value.eim = item.serverExtension.eim
        }
      }
      if (process.env.mode === 'local' && item.serverExtension) {
        item.serverExtension.ck = getBizType(item) !== 'backgroundCloseConversation' ? 'ck' : null
      }

      if (getBizType(item) !== 'backgroundCloseConversation' && item.serverExtension && item.serverExtension.ck) {
        customerServiceInfo.value.ck = item.serverExtension.ck
      }
      // if (getBizType(item) === 'openConversation') {
      // }
      try {
        saveTraceMessageEvent({
          traceId: item.serverExtension.cid,
          traceEventType: 2,
          createTime: Date.now(),
          data: {}
        })
      } catch (err) {}
    }
    if (Array.isArray(data) && data.length > 1) {
      data = data.filter((sitem) => !['openConversation', 'frontendCloseConversation'].includes(getBizType(sitem)))
    }
    if (getBizType(item) !== 'openConversation') {
      const lastMsg = last(msgs.value || [])
      if (lastMsg && item.createTime < lastMsg.createTime) {
        item.createTime = Date.now()
      }
      messageList.value.push(...listData)
      nextTick(scrollToChatBottom)
      setShowRedDot(true)
    }
  }

  const setShowRedDot = (bool: boolean) => {
    showRedDot.value = chatStep.value === 'chat' && isMin.value && bool
  }
  // 前端写死的问候语
  function sayHello() {
    const helloMessage = {
      messageClientId: buildUuid(), // 添加唯一的 messageClientId
      messageServerId: buildUuid(), // 添加唯一的 messageServerId
      createTime: Date.now(),
      text: helloText,
      messageType: V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT,
      isSelf: false,
      serverExtension: {
        eim: customerServiceInfo.value.eim
      },
      disabledMark: true
    }
    console.log('👋 添加问候语消息:', helloMessage.messageClientId)
    messageList.value.push(helloMessage)
  }

  // 获取好友后的回调
  async function onDataSync() {
    console.log('onDataSync 被调用！！！')
    isShowLoading.value = false
    chatStep.value = 'chat'

    let list = await getMessageList()
    console.log('消息列表', list)
    if (Array.isArray(list) && list.length) {
      list = list.filter(
        (item) => !['openConversation', 'frontendCloseConversation', 'conversationWillClose'].includes(getBizType(item))
      )
      messageList.value.push(...list)
      if (isCloseConversation.value) {
        sayHello()
      }
      nextTick(() => {
        // 判断一个div上有没有出现垂直方向滚动条，只需判断 scrollHeight 是否大于 clientHeight 即可
        isCanScrollToTop.value = chatContainerRef.value.scrollHeight > chatContainerRef.value.clientHeight
        scrollToChatBottom()
        isChatReady.value = true
      })
    } else {
      sayHello()
      isCloseConversation.value = true
      isChatReady.value = true
    }

    if (process.env.mode === 'local') {
      mockActtion({
        onReceiveMessages
      })
    }
  }

  // const handleContainerScroll = debounce(function handleContainerScroll() {
  //   const elements = chatContainerRef.value.querySelectorAll('.chat-label-item')
  //   if (elements) {
  //     elements.forEach((dom) => {
  //       console.log(dom)
  //     })
  //     // console.log(elements)
  //   }
  // }, 500)

  onBeforeUnmount(() => {
    // chatContainerRef.value.removeEventListener('scroll', handleContainerScroll)
  })

  // 打开聊天框
  function handleOpenChat() {
    isShowWindow.value = true
    setShowRedDot(false)
  }

  // 滚动到聊天列表底部
  function scrollToChatBottom() {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  }

  const revokeList: V2NIMMessage[] = []

  // 消息撤回
  async function handleRevoke(msg: V2NIMMessage) {
    console.log('操作消息撤回的内容=>', msg)
    const isExpired = Date.now() - msg.createTime >= revokeDrawLimit.value // 消息是否过期
    // 只能撤回10分钟内的消息
    if (isExpired) return
    const nim = getNim()
    try {
      await nim.V2NIMMessageService.revokeMessage(msg)
    } catch (err) {
      console.log(err)
      // todo error
    }
  }

  // 重新发送撤回的消息
  function handleResend(opt: { type: string; messageClientId: string }) {
    const { type, messageClientId } = opt
    const message = revokeList.find((item) => item.messageClientId === messageClientId)

    if (type === 'TEXT') {
      ChatFooterRef.value.message = message?.text
    } else if (type === 'orderInfo') {
      const content = message?.attachment.raw.content
      handleSendOrder(content)
    } else if (type === 'PICTURE' || type === 'VIDEO') {
      const content = message?.attachment.raw.content
      handleUploadFile({ fileUrl: content.url, type: content.contentType })
    }
  }

  // 引用消息
  const quoteMsg = ref({})
  function handleQuoteMsg(opt: V2NIMMessage) {
    quoteMsg.value = opt
  }

  const clearQuoteMsg = () => {
    quoteMsg.value = {}
  }
  provide('clearQuoteMsg', clearQuoteMsg)

  // 最小化
  const handleWinMin = () => {
    isMin.value = true
    // 如果在排队中，只是执行最小化
    if (queueNum.value > 0 && isQueuing.value) {
      isShowWindow.value = false
    } else {
      handleCloseChat()
    }
  }

  // 关闭
  const handleWinClose = () => {
    // 没有分配到客服时直接关闭弹窗
    if (!isHasService.value || isQueuing.value) {
      handleCloseChat()
    } else {
      isCloseTheChat.value = true
    }
  }

  const transcriptChatRecordModal = ref(false)
  // 打开发送聊天记录弹窗
  const handleSendTranscript = () => {
    transcriptChatRecordModal.value = true
  }
  const bindEmail = ref('')
  const setBindEmail = (e: string) => {
    bindEmail.value = e
  }

  // 标记表情修改信息
  const handleMarkEmoji = async (message: V2NIMMessage) => {
    await markPlatformMessageEmoji({
      userId: accountId.value,
      msgServerId: message.messageServerId,
      emojiList: message.serverExtension?.emojiList ?? []
    })
  }
  provide('handleMarkEmoji', handleMarkEmoji)

  watch(isShowWindow, async (newVal) => {
    if (!newVal) {
      window.parent.postMessage(getMessages('closeChat'), '*')
    }
    // 打开弹框，需要判断是否有客服在线
    // 不在排队中再触发
    if (newVal) {
      // 打开聊天
      window.parent.postMessage(getMessages('openChat'), '*')
      if (!isQueuing.value) {
        await initImStatus()
      } else {
        isMin.value = false
      }
    }
  })

  // 如果登录了，重新初始化数据
  watch(isLogin, (val) => {
    if (val && isShowWindow.value) {
      if (props.platform !== 'H5') {
        handleCloseChat()
        isShowWindow.value = true
      }
    }
  })

  // 监听会话是否关闭
  watch(isCloseConversation, (n) => {
    if (n && isQueuing.value) {
      isQueuing.value = false
      queueNum.value = 0
    }
  })

  const {
    init: netChatInit,
    sendMessage,
    getMessageList,
    getNim,
    logout,
    sendP2PMessageReceipt
  } = getNetNim({
    onDataSync,
    onReceiveMessages,
    onSendMessage,
    onReceiveMessagesModified,
    onReceiveBroadcastNotifications,
    onReceiveCustomNotifications,
    onMessageRevokeNotifications,
    onDisconnected,
    onLoginStatus,
    onLoginFailed,
    onConnectStatus,
    onConnectFailed,
    limit: limit.value
  })

  // 客服信息
  provide('customerServiceInfo', customerServiceInfo)
  provide('isHasService', isHasService)
  provide('isCloseConversation', isCloseConversation)
  provide('movePreEvaluation', movePreEvaluation)

  const initOptions = {
    appkey: '8770a4f2352e4adc3736225fa0bfa915', // 请填写你的appkey
    account: 'test001', // 请填写你的account
    token: 'test001', // 请填写你的token
    serverAccount: 'test002'
  }

  async function getIsStartSmartSuggestions() {
    try {
      // 获取是否开启了智能联想
      isStartIntelligenticon.value = await queryCustomerImIsSmartSuggestions()
    } catch (err) {
      console.log(err)
    }
  }

  // 点击开始会话
  const handleStartChat = async () => {
    // step1 预分配处理人
    if (currentBusiness.value?.value) {
      const res = await preAllocatedEmployee({ orderType: String(currentBusiness.value?.value) })
      if (!res) {
        isHasOnlineEmployee.value = res // 预分配不到处理人，直接去留言界面
        sceneCode.value = 102
      }
    }

    isShowLoading.value = true
    chatStep.value = 'loadChat'

    getIsStartSmartSuggestions()

    if (orderListRef.value && isLogin.value) {
      // 获取初始的订单数据
      orderListRef.value.initList()
    }
    // 1.等待 getAll, 判断用户是否登录
    // 2.如果未登录从redis缓存获取是否游客信息
    // 3.如果用户已登录，判断是否已有 云信 账号，如果用户没有云信账号，调接口生成并获取云信账号
    // 4.如果 redis 中没有游客信息，调接口生成并获取云信账号
    // 5.本地缓存云信账号信息
    // 假设已获取到 云信账号

    netChatInit(initOptions)
  }

  // 点击查看历史记录
  const handleViewHistory = () => {
    chatStep.value = 'loadChat'
    historyFlag.value = true
    netChatInit(initOptions)
  }

  const handleBackSelBusiness = () => {
    chatStep.value = 'business'
    historyFlag.value = false
  }

  // 退出会话
  const handleCloseChat = (isNeedEvaluation = false, evaluationInfo = {}) => {
    // 如果会话没有结束，关闭会话的时候，发送结束会话事件
    if ((!isMin.value && !isCloseConversation.value) || isNeedEvaluation) {
      const closeReqData = isNeedEvaluation
        ? { ...customerServiceInfo.value, ...evaluationInfo }
        : customerServiceInfo.value
      handleSendMessage('frontendCloseConversation', closeReqData)
      chatStep.value = ''
    }
    currentBusiness.value = null
    isHasService.value = false
    isShowLoading.value = false
    customerServiceInfo.value = JSON.parse(JSON.stringify(initCustomerInfo))
    isChatReady.value = false
    isCloseConversation.value = true
    messageList.value = [] // 清空消息列表
    isCloseTheChat.value = false
    isShowWindow.value = false
    fileList.value = []
    isDragging.value = false
    isShowEvaluationModal.value = false
    isShowWaitingMessage.value = false
    isShowMessageModal.value = false
    isBackgroundClose.value = false
    if (props.platform === 'H5') {
      if (isApp()) {
        uni.reLaunch({
          url: '/pages/message/index'
        })
      } else {
        window.history.back()
      }
    }
  }

  // 仅退出会话，不关闭弹窗
  const handleOnlyCloseChat = (closeConversationFlag = false) => {
    // 如果会话没有结束，关闭会话的时候，发送结束会话事件
    if (!isMin.value && !isCloseConversation.value) {
      handleSendMessage('frontendCloseConversation', customerServiceInfo.value)
    }
    chatStep.value = 'business'
    currentBusiness.value = null
    isHasService.value = false
    isShowLoading.value = false
    customerServiceInfo.value = JSON.parse(JSON.stringify(initCustomerInfo))
    isChatReady.value = false
    if (closeConversationFlag) {
      isCloseConversation.value = closeConversationFlag
    }
    messageList.value = [] // 清空消息列表
    isCloseTheChat.value = false
    fileList.value = []
    isDragging.value = false
    isShowEvaluationModal.value = false
    isShowWaitingMessage.value = false
    isShowMessageModal.value = false
    isBackgroundClose.value = false
  }
  provide('handleOnlyCloseChat', handleOnlyCloseChat)

  // 点击再次聊天 start the chat again
  const handleChatAgain = () => {
    movePreEvaluation()
    isCloseConversation.value = false
    isBackgroundClose.value = false
  }
  provide('handleChatAgain', handleChatAgain)

  // 发送等待消息
  function handleSendWaitMessage() {
    handleSendMessage('waitMsg', waitText)
  }

  // 等待分配客服
  function waitService() {
    clearTimeout(waittingTimer)
    waittingTimer = setTimeout(() => {
      // handleSendWaitMessage()
      if (!isShowWaitingMessage.value) {
        isShowWaitingMessage.value = true
      }
    }, waittingAllocationTime)
  }

  // 收到客服消息，设置已读
  const handleSendP2PMessageReceipt = (messageClientId: string | number) => {
    const message = messageList.value.find((item) => item.messageClientId === messageClientId)
    if (message && isShowWindow.value && chatStep.value === 'chat') {
      sendP2PMessageReceipt(message)
    }
  }

  provide('handleSendP2PMessageReceipt', handleSendP2PMessageReceipt)

  // 根据本地缓存初始化状态
  async function initImStatus() {
    isMin.value = false
    isShowWindow.value = true
    isShowLoading.value = true
    try {
      if (props.platform !== 'H5') {
        await imSilentLogin()
      }
      const nim = getNim()
      if (nim) {
        await logout()
      }
      // 判断是否有客服在线
      isHasOnlineEmployee.value = await hasOnlineEmployee()
      if (isHasOnlineEmployee.value) {
        isDisconnected.value = false
        try {
          const imAccountInfo: ImAccountResponse = await initImAccount()

          initOptions.appkey = imAccountInfo.appId
          initOptions.account = imAccountInfo.accountId
          initOptions.token = imAccountInfo.token
          initOptions.serverAccount = imAccountInfo.serverAccountId
          accountId.value = imAccountInfo.accountId
          // 获取用户im绑定的邮箱
          const userEmailInfo = await findUserEmailVal(imAccountInfo.accountId)
          bindEmail.value = userEmailInfo.email
        } catch (err) {
          console.log(err)
        }
        // 获取远程缓存数据
        const ck = await getValidConversation()
        if (ck) {
          customerServiceInfo.value.ck = ck
          // 工单是否已经关闭
          isCloseConversation.value = false
          // 是否已经分配客服
          const data = await findRelationConversationWorkOrder(ck)
          isHasService.value = !!(data && data.handlerUserInfo)
          // 如果没分配到客服
          if (!isHasService.value) {
            // waitService()
          } else {
            customerServiceInfo.value.employeeEnName = data.handlerUserInfo.userName
            customerServiceInfo.value.eim = data.handlerUserInfo.imageIndex
          }
          isShowWindow.value = true
          handleStartChat()
        } else {
          chatStep.value = 'business'
          clearTimeout(waittingTimer)
          clearTimeout(messageTimer)
          isCloseConversation.value = true
        }
      }
    } catch (err) {
      chatStep.value = 'business'
      console.log(err)
    } finally {
      isShowLoading.value = false
    }
  }

  // fa 询价场景：打开im并留言
  const openImChatByFa = async (partNumber = '') => {
    console.log('openImChatByFa', partNumber)
    handleOpenChat()
    isShowLoading.value = true
    // 是否有客服在线
    const msg = `URL:${window.location.href}\nPart Number:${partNumber}`
    const isOnline = await hasOnlineEmployee()
    if (isOnline) {
      // 选择业务线
      const faItem = business.find((item) => item.value === 9)
      faItem && handleSelectBusiness(faItem)
      // 开始会话
      await handleStartChat()
      if (isHasOnlineEmployee.value) {
        nextTick(() => {
          ChatFooterRef.value.message = msg
        })
      } else {
        // 预分配不到处理人，直接去留言界面
        const url = `/help/contact?faImMsg=${msg}`
        window.open(getJumpLink(url, props.lang), '_blank')
      }
    } else {
      // 跳转留言
      const url = `/help/contact?faImMsg=${msg}`
      window.open(getJumpLink(url, props.lang), '_blank')
    }
    isShowLoading.value = false
  }

  // 用户中心站内信回复场景
  const openImChatReply = async (replyData = {}) => {
    handleOpenChat()
    isShowLoading.value = true
    const isOnline = await hasOnlineEmployee()
    if (isOnline) {
      // 选择业务
      // 站内信详情接口返回的 orderType 与 business 做映射
      const codeMap = {
        0: 2, //  PCB 小批量
        1: 2, //  PCB 样板
        3: 3, //  钢网
        4: 4, //  SMT
        7: 7, // 3D
        8: 8, // CNC
        9: 9, // FA
        10: 11 // Layout
      }
      const selectItem = business.find((item) => item.value === codeMap[replyData.orderType])
      selectItem && handleSelectBusiness(selectItem)
      // 开始会话
      await handleStartChat()
      if (isHasOnlineEmployee.value) {
        // 发送一条站内信回复消息
        await waitReady()
        handleSendMessage('imSourceEntranceInApp', { ...replyData, businessType: codeMap[replyData.orderType] })
      } else {
        handleOpenLeaveMessageModal()
      }
    } else {
      handleOpenLeaveMessageModal()
    }
  }

  // 关闭在线工单转邮件弹窗提示
  const closeTransferEmailTipModal = () => {
    clearInterval(transferEmailModalTimer)
    isTransferEmailCloseFlag.value = false
    transferEmailCloseCountDown.value = 4
  }

  // 处理引用消息格式
  const getQuoteMsgText = (item: V2NIMMessage) => {
    let quoteText = ''
    if (getBizType(item) === 'orderInfo') {
      quoteText = '[order]'
    } else if (getBizType(item) === 'evaluation') {
      quoteText = '[evaluation]'
    } else if (getCustomerMediaType(item) === 'imageMessage' || getMediaType(item) === 'PICTURE') {
      quoteText = '[picture]'
    } else if (getCustomerMediaType(item) === 'videoMessage' || getMediaType(item) === 'VIDEO') {
      quoteText = '[video]'
    } else if (getBizType(item) === 'imSourceEntranceInApp') {
      quoteText = '[im source entrance in App]'
    } else if (getCustomerMediaType(item) === 'fileMessage' || getMediaType(item) === 'FILE') {
      quoteText = '[document]'
    } else if (
      item.messageType === V2NIMMessageType.V2NIM_MESSAGE_TYPE_INVALID ||
      (item.serverExtension && item.serverExtension.html)
    ) {
      quoteText = cleanRichTxt(item.text, { img: '[picture]', video: '[video]' })
    } else if (
      !['unOnline', 'waitMsg', 'frontendCloseConversation', 'transferEmailCloseConversation'].includes(getBizType(item))
    ) {
      quoteText = cleanRichTxt(matchEmoji(xss(escapeHtml(item.text || '')), emojiArr), { img: '[emoji]' })
    }
    return quoteText
  }
  const matchEmoji = (msg = '', emojiArr: any) => {
    // 匹配表情包
    Object.keys(emojiArr).forEach((item) => {
      msg = msg.replaceAll(item, `<img src="${emojiArr[item]}" alt="${item}" class="emoji-tag"/>`)
    })

    return msg
  }
  // 格式化富文本为指定纯文本
  const cleanRichTxt = (richTxt: string | null | undefined, conversionParams: object) => {
    if (!richTxt) return ''
    let result = richTxt
    // 遍历转换参数对象
    for (const [tag, replacement] of Object.entries(conversionParams)) {
      // 创建正则表达式，匹配开始和结束标签
      const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>|<${tag}[^>]*>`, 'gi')
      result = result.replace(regex, replacement)
    }
    // 去除所有其他的 HTML 标签
    return result.replace(/<\/?[^>]+(>|$)/g, '')
  }
  provide('getQuoteMsgText', getQuoteMsgText)

  onMounted(async () => {
    try {
      const data = await randomFindEmployeeInfo()
      if (data) {
        initCustomerInfo.employeeEnName = customerServiceInfo.value.employeeEnName = data.employeeEnName
        initCustomerInfo.eim = customerServiceInfo.value.eim = data.imageFileIndexId
        tipMsg.value.serverExtension.eim = data.imageFileIndexId
      }
      const revokeDrawLimitData = await queryRevokeDrawLimit()
      if (revokeDrawLimitData) {
        revokeDrawLimit.value = Number(revokeDrawLimitData) * 60 * 1000
      }
    } catch (err) {
      console.log(err)
    }

    // handleOpenChat()
    // setTimeout(() => {
    //   handleOpenChat()
    // }, 5000)
  })

  onErrorCaptured((err, vm) => {
    console.log('=======fff=======', err)
    try {
      const data = {
        message: err.message,
        stack: err.stack?.slice(0, 100),
        component: vm._name
      }

      // saveTraceMessageEvent({
      //   traceId: accountId.value,
      //   traceEventType: 8,
      //   createTime: Date.now(),
      //   data
      // })
    } catch (err) {
      console.log(err)
    }
    return false
  })

  return {
    isLogin,
    isCloseTheChat, // 是否关闭工单
    isHasService, // 是否有客服接入，如果有客服接入，需要记住
    isHasOnlineEmployee, // 是否有客服在线
    chatStep, // 聊天窗口当前操作步骤
    isShowLoading, // 加载效果
    isShowWindow, // 是否显示聊天窗口
    currentBusiness, // 当前选择的业务类型
    isCanScrollToTop, // 是否能向上滚动
    limit, // 聊天窗口默认显示的消息数
    isSendingMsg, // 是否正在发送消息
    isChatReady, // 是否已准备好IM
    isShowOrderPopup, // 是否显示订单
    ChatFooterRef,
    chatContainerRef,
    orderListRef,
    isShowIntelligenticon, // 是否显示智能联想弹框
    isStartIntelligenticon, // 是否开启智能联想
    isCloseConversation, // 会话是否已经关闭
    evaluationInfo,
    isMin, // 是否是最小化
    envConfig,
    tipMsg, // 打开弹框时的提示信息
    messageList, // 消息列表
    msgs, // 排序后的消息列表
    isDisconnected, // 是否断开 im 链接
    initCustomerInfo,
    customerServiceInfo, // 客服账号信息
    sceneCode,
    fileList,
    isDragging,
    transcriptChatRecordModal,
    bindEmail,
    showRedDot,
    isShowH5RateService, // H5 评价
    isShowWaitingMessage,
    isShowMessageModal,
    isShowEvaluationModal,
    queueNum,
    isQueuing,
    quoteMsg,
    isTransferEmailCloseFlag,
    transferEmailCloseCountDown,
    historyFlag,
    closeTransferEmailTipModal,
    handleIntelligenticonChange, // 智能联想开关
    handleSelectBusiness, // 选择业务线
    handleIntelligenticon, // 智能联想
    handleSendFaqMessage, // 发送 FAQ
    handleSubmitEvaluation, // 发送评价
    handleTextMessage, // 发送文本消息
    handleRateService, // 显示评价弹框
    handleLoadPreMsgs, // 加载历史消息
    handleOpenChat, // 打开聊天框
    handleRevoke, // 消息撤回
    handleResend, // 重新发送撤回的消息
    handleWinMin, // 最小化
    handleWinClose, // 关闭
    handleSendOrder, // 显示订单列表
    handleStartChat, // 点击开始会话
    handleUploadFile, // 上传文件
    handleCloseChat,
    handleOnlyCloseChat,
    initImStatus,
    handleSendTranscript,
    openImChatByFa,
    openImChatReply,
    setBindEmail,
    handleChatAgain,
    handleQuoteMsg,
    getQuoteMsgText,
    clearQuoteMsg,
    handleViewHistory,
    handleBackSelBusiness
  }
}
