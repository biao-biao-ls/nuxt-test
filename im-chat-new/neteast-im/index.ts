import { computed, ref } from 'vue'
import { V2NIMMessage, V2NIMP2PMessageReadReceipt } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'
import { V2NIMFriend } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMFriendService'
import { buildUuid } from '@jlc/utils'
import V2NIM from 'nim-web-sdk-ng'
import { dealMsgList, getBizType } from '../utils'
import messageList from './mock/messageList.json'
import {
  V2NIMConnectStatus,
  V2NIMLoginStatus,
  NetNimInitOptions,
  NetNimInitParams,
  V2NIMLoginAuthType,
  V2NIMBroadcastNotification
} from './types'
import { saveTraceMessageEvent } from '#shared/apis'

function getNetNim(params: NetNimInitParams) {
  // 是否连接成功
  const connectStatus = ref(V2NIMConnectStatus.V2NIM_CONNECT_STATUS_DISCONNECTED)
  // 是否登录成功
  const loginStatus = ref(V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGOUT)
  // 好友
  const friend = ref<V2NIMFriend | null>(null)
  // 每页展示的数量
  const limit = params.limit || 20

  // 与好友的会话ID
  const conversationId = computed(() => {
    if (friend.value) {
      return nim?.V2NIMConversationIdUtil.p2pConversationId(friend.value.accountId)
    } else {
      return ''
    }
  })

  let nim: V2NIM = null as any
  async function init(options: NetNimInitOptions) {
    if (!nim) {
      const { default: V2NIM } = await import('nim-web-sdk-ng')

      // 初始化 IM SDK 实例
      nim = V2NIM.getInstance({
        appkey: options.appkey,
        account: options.account,
        token: options.token,
        apiVersion: 'v2'
      })
      if (options.serverAccount) friend.value = { accountId: options.serverAccount } as V2NIMFriend
    }
    const loginStatus = nim.V2NIMLoginService.getLoginStatus()
    if (
      loginStatus === V2NIMLoginStatus.V2NIM_LOGIN_STATUS_UNLOGIN ||
      loginStatus === V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGOUT
    ) {
      await login(options.account, options.token)
    } else {
      typeof params.onDataSync === 'function' && params.onDataSync()
    }
  }

  // 按消息查询配置项分页获取所有历史消息
  async function getMessageList(endTime = Date.now()) {
    try {
      if (process.env.mode === 'local') {
        return dealMsgList(messageList).filter(
          (item) => !['conversationWillClose', 'openConversation'].includes(getBizType(item))
        )
      }
      let list = await nim.V2NIMMessageService.getMessageList({
        conversationId: conversationId.value,
        limit,
        endTime
      })
      list = dealMsgList(list).filter(
        (item) => !['conversationWillClose', 'openConversation'].includes(getBizType(item))
      )
      return list
    } catch (err) {
      console.log(err)
    }
  }

  // 退出登录
  async function logout() {
    // 登录状态变化回调，返回变更后的登录状态。
    nim.V2NIMLoginService.off('onLoginStatus', _onLoginStatus)
    // 登录失败回调，返回错误码和错误信息。
    nim.V2NIMLoginService.off('onLoginFailed', _onLoginFailed)
    // 登录连接状态变化回调，返回连接状态。
    nim.V2NIMLoginService.off('onConnectStatus', _onConnectStatus)
    // 登录连接断开回调，返回错误码和错误信息
    nim.V2NIMLoginService.off('onDisconnected', _onDisconnected)
    // 登录连接失败回调，返回错误码和错误信息
    nim.V2NIMLoginService.off('onConnectFailed', _onConnectFailed)
    // 数据同步
    nim.V2NIMLoginService.off('onDataSync', params.onDataSync)
    // 收到消息
    nim.V2NIMMessageService.off('onReceiveMessages', _onReceiveMessages)
    // 清空会话历史消息通知

    // 收到点对点消息的已读回执
    nim.V2NIMMessageService.off('onReceiveP2PMessageReadReceipts', _onReceiveP2PMessageReadReceipts)

    // 服务端下发的广播通知接收回调，返回广播通知列表
    nim.V2NIMNotificationService.off('onReceiveBroadcastNotifications', _onReceiveBroadcastNotifications)

    // 自定义通知接收回调，返回自定义通知列表，包括本端接收的自定义通知及其他端同步的自定义通知。
    nim.V2NIMNotificationService.off('onReceiveCustomNotifications', _onReceiveCustomNotifications)

    // 消息撤回
    nim.V2NIMMessageService.off('onMessageRevokeNotifications', _onMessageRevokeNotifications)

    // 更新消息
    nim.V2NIMMessageService.off('onReceiveMessagesModified', _onReceiveMessagesModified)

    await nim.V2NIMLoginService.logout()
  }

  function _onLoginStatus(status: V2NIMLoginStatus) {
    console.log('onLoginStatus-登录状态变化回调，返回变更后的登录状态', status)
    typeof params.onLoginStatus === 'function' && params.onLoginStatus(status)
    loginStatus.value = status
  }

  function _onLoginFailed(code, message) {
    console.log('onLoginFailed-登录失败回调，返回错误码和错误信息', code, message)
    typeof params.onLoginFailed === 'function' && params.onLoginFailed(code, message)
  }

  function _onConnectStatus(status: V2NIMConnectStatus) {
    console.log('onConnectStatus-登录连接状态变化回调，返回连接状态', status)
    typeof params.onConnectStatus === 'function' && params.onConnectStatus(status)
    connectStatus.value = status
  }

  function _onDisconnected(code, message) {
    console.log('onDisconnected-登录连接断开回调，返回错误码和错误信息', code, message)
    typeof params.onDisconnected === 'function' && params.onDisconnected(code, message)
  }

  function _onConnectFailed(code, message) {
    console.log('onConnectFailed-登录连接失败回调，返回错误码和错误信息', code, message)
    typeof params.onConnectFailed === 'function' && params.onConnectFailed(code, message)
  }

  function _onReceiveBroadcastNotifications(broadcastNotification: V2NIMBroadcastNotification[]) {
    console.log('服务端下发的广播通知接收回调，返回广播通知列表', broadcastNotification)
    params.onReceiveBroadcastNotifications && params.onReceiveBroadcastNotifications(broadcastNotification)
  }
  function _onReceiveCustomNotifications(customNotification: any[]) {
    console.log(
      '自定义通知接收回调，返回自定义通知列表，包括本端接收的自定义通知及其他端同步的自定义通知',
      customNotification
    )
    params.onReceiveCustomNotifications && params.onReceiveCustomNotifications(customNotification)
  }

  function _onMessageRevokeNotifications(revokeNotifications: any[]) {
    console.log('监听消息撤回结果', revokeNotifications)
    params.onMessageRevokeNotifications && params.onMessageRevokeNotifications(revokeNotifications)
  }
  function _onReceiveMessagesModified(data: V2NIMMessage[]) {
    console.log('监听消息更新', data)
    params.onReceiveMessagesModified && params.onReceiveMessagesModified(data)
  }
  // 登录 IM
  async function login(account: string, token: string) {
    // 登录状态变化回调，返回变更后的登录状态。
    nim.V2NIMLoginService.on('onLoginStatus', _onLoginStatus)
    // 登录失败回调，返回错误码和错误信息。
    nim.V2NIMLoginService.on('onLoginFailed', _onLoginFailed)
    // 登录连接状态变化回调，返回连接状态。
    nim.V2NIMLoginService.on('onConnectStatus', _onConnectStatus)
    // 登录连接断开回调，返回错误码和错误信息
    nim.V2NIMLoginService.on('onDisconnected', _onDisconnected)
    // 登录连接失败回调，返回错误码和错误信息
    nim.V2NIMLoginService.on('onConnectFailed', _onConnectFailed)

    // 数据同步
    if (typeof params.onDataSync === 'function') {
      nim.V2NIMLoginService.on('onDataSync', params.onDataSync)
      if (process.env.mode === 'local') {
        params.onDataSync()
      }
    }

    // 收到消息
    nim.V2NIMMessageService.on('onReceiveMessages', _onReceiveMessages)
    // 清空会话历史消息通知

    // 收到点对点消息的已读回执
    nim.V2NIMMessageService.on('onReceiveP2PMessageReadReceipts', _onReceiveP2PMessageReadReceipts)

    // 服务端下发的广播通知接收回调，返回广播通知列表
    nim.V2NIMNotificationService.on('onReceiveBroadcastNotifications', _onReceiveBroadcastNotifications)

    // 自定义通知接收回调，返回自定义通知列表，包括本端接收的自定义通知及其他端同步的自定义通知。
    nim.V2NIMNotificationService.on('onReceiveCustomNotifications', _onReceiveCustomNotifications)

    // 监听消息撤回
    nim.V2NIMMessageService.on('onMessageRevokeNotifications', _onMessageRevokeNotifications)

    // 监听消息更新
    nim.V2NIMMessageService.on('onReceiveMessagesModified', _onReceiveMessagesModified)

    try {
      let retryCount = 5
      if (process.env.mode === 'local') {
        retryCount = 1
      }
      await nim.V2NIMLoginService.login(account, token, {
        retryCount,
        authType: V2NIMLoginAuthType.V2NIM_LOGIN_AUTH_TYPE_DYNAMIC_TOKEN,
        tokenProvider: () => token
      })
    } catch (err) {
      console.log('login: ', err)
    }
  }

  //  收到消息
  function _onReceiveMessages(data: V2NIMMessage[]) {
    console.log('收到消息', data)
    params.onReceiveMessages && params.onReceiveMessages(dealMsgList(data))
  }

  // 收到点对点消息的已读回执
  function _onReceiveP2PMessageReadReceipts(data: V2NIMP2PMessageReadReceipt[]) {
    const messageReadReceipt = data[0]
    console.log('收到点对点消息的已读回执', messageReadReceipt)
  }

  // 发送消息
  async function sendMessage(type: string, msg: any, opts: any) {
    try {
      const cid = buildUuid()
      opts.cid = cid
      opts.customerFlag = true
      saveTraceMessageEvent({ traceId: cid, traceEventType: 1, createTime: Date.now(), data: {} })
      const message = createMessage(type, msg, opts)
      console.log('message==', message)

      // 自动关闭唤起的评价不需要抄送
      if (type === 'evaluation' && msg.routeEnabled !== undefined) {
        message.routeConfig = {
          routeEnabled: msg.routeEnabled
        }
      }
      if (process.env.mode === 'local') {
        params.onSendMessage && params.onSendMessage(message)
        return Promise.resolve({
          message: { ...message, conversationId: '5361866759761869927|1|4510458535701535669', sendingState: 1 }
        })
      }
      params.onSendMessage && params.onSendMessage(JSON.parse(JSON.stringify(message)))
      if (!['preEvaluation', 'waitMsg', 'unOnline'].includes(type)) {
        const res = await nim.V2NIMMessageService.sendMessage(message, conversationId.value)
        console.log('发送消息后的结果：', res)
        return Promise.resolve(res)
      }
    } catch (err) {
      console.log(err)
    }
  }

  const baseExt = {
    conversationType: 2,
    messageType: 0,
    systemCode: 1
  }

  // 创建拓展信息
  function serverExtension(baseOpt: any, otherOpts: any) {
    const obj = Object.assign({ url: window.location.origin }, baseOpt, {
      ...otherOpts,
      businessType: otherOpts.businessType,
      cid: otherOpts.cid
    })
    return JSON.stringify(obj)
  }

  // 创建消息
  function createMessage(type: string, msg: any, opts: any) {
    let message = null
    const baseFrontContent = {
      closingPhrase: ''
    }
    switch (true) {
      case type === 'text':
        // 创建一条文本消息
        message = nim.V2NIMMessageCreator.createTextMessage(msg)
        message.serverExtension = serverExtension(baseExt, opts)
        break
      case type === 'faq':
        // 创建一条文本消息
        message = nim.V2NIMMessageCreator.createTextMessage(msg.value)
        message.serverExtension = serverExtension(Object.assign({}, baseExt, { faqAccessId: msg.accessId }), opts)
        break
      case type === 'server':
        // 创建一条文本消息
        message = nim.V2NIMMessageCreator.createTextMessage(msg.value)
        message.serverExtension = serverExtension(msg.ext, opts)
        message.isSelf = false
        break
      case type.startsWith('image'):
        // 创建一条图片消息
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'imageMessage',
          JSON.stringify({ bizType: '-1', content: { mediaType: 'PICTURE', contentType: type, url: msg } })
        )
        message.serverExtension = serverExtension(baseExt, opts)
        break
      case type.startsWith('video'):
        // 创建一条视频消息
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'videoMessage',
          JSON.stringify({ bizType: '-1', content: { mediaType: 'VIDEO', contentType: type, url: msg } })
        )
        message.serverExtension = serverExtension(baseExt, opts)
        break
      case type.startsWith('audio'):
        // 创建一条视频消息
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'audioMessage',
          JSON.stringify({ bizType: '-1', content: { mediaType: 'AUDIO', contentType: type, url: msg } })
        )
        message.serverExtension = serverExtension(baseExt, opts)
        break
      case type === 'imSourceEntranceInApp':
        // 创建站内信回复消息
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'imSourceEntranceInApp',
          JSON.stringify({
            bizType: 'imSourceEntranceInApp',
            content: msg
          })
        )
        message.serverExtension = serverExtension(baseExt, { ...opts, businessType: msg.businessType })
        break
      case type === 'order':
        // 自定义订单消息
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'orderInfo',
          JSON.stringify({
            bizType: 'orderInfo',
            content: msg
          })
        )
        message.serverExtension = serverExtension(Object.assign({}, baseExt, { messageType: 0 }), opts)
        break
      case type === 'preEvaluation':
        // 评价弹框
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'preEvaluation',
          JSON.stringify({
            bizType: 'preEvaluation',
            content: msg
          })
        )
        break
      case ['unOnline', 'waitMsg'].includes(type):
        // 评价弹框
        message = nim.V2NIMMessageCreator.createCustomMessage(
          msg,
          JSON.stringify({
            bizType: type,
            content: msg
          })
        )
        break
      // evaluation
      case type === 'evaluation':
        // 评价结果
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'evaluation',
          JSON.stringify({
            bizType: 'evaluation',
            content: msg
          })
        )

        message.serverExtension = serverExtension(Object.assign({}, baseExt, { messageType: 2 }), opts)
        break
      case type === 'frontendCloseConversation':
        // 客户5分钟没有发送消息 前端结束会话
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'frontendCloseConversation',
          JSON.stringify({
            bizType: 'frontendCloseConversation',
            content: msg.evaluation ? { ...baseFrontContent, evaluation: msg.evaluation } : baseFrontContent
          })
        )
        message.serverExtension = serverExtension(
          Object.assign({}, baseExt, { eim: msg.eim, ena: msg.employeeEnName, messageType: 2 }),
          opts
        )
        message.isSelf = false
        break
      case opts.accept && opts.accept.includes(type):
        // 创建一条file消息
        message = nim.V2NIMMessageCreator.createCustomMessage(
          'fileMessage',
          JSON.stringify({
            bizType: '-1',
            content: {
              mediaType: 'FILE',
              contentType: type,
              url: msg,
              name: opts.name
            }
          })
        )
        message.serverExtension = serverExtension(baseExt, opts)
        break
      default:
        message = nim.V2NIMMessageCreator.createTextMessage(msg)
        message.serverExtension = serverExtension(baseExt, opts)
    }

    return message
  }

  // 发送单聊消息已读回执
  async function sendP2PMessageReceipt(message: V2NIMMessage) {
    try {
      await nim.V2NIMMessageService.sendP2PMessageReceipt(message)
      // todo Success
    } catch (err) {
      // todo error
    }
  }

  return {
    logout,
    friend,
    sendMessage,
    getMessageList,
    init,
    sendP2PMessageReceipt,
    loginStatus,
    getNim() {
      return nim
    }
  }
}

export default getNetNim
