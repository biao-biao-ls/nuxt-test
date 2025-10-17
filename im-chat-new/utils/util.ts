import dayjs from 'dayjs'
import { V2NIMMessage } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'
import { V2NIMMessageType } from '../neteast-im/types'
import { imGetAll, checkLogin, imLogin } from '#shared/apis'
import { getEnvConfig } from '#shared/utils'
export function formatDate(datetime: number) {
  return dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')
}

export function formatTime(datetime: number) {
  return dayjs(datetime).format('HH:mm')
}

export const sleep = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export const dealMsgList = (list: V2NIMMessage[]) => {
  list.forEach((item) => {
    try {
      if (typeof item.serverExtension === 'string') {
        item.serverExtension && (item.serverExtension = JSON.parse(item.serverExtension))
      }
      if (item.attachment && item.attachment.raw && typeof item.attachment.raw === 'string') {
        item.attachment.raw = JSON.parse(item.attachment.raw)
      }
    } catch (err) {
      console.log(item.serverExtension)
    }
  })
  return list
}

// 获取自定义消息业务类型
export function getBizType(item: V2NIMMessage) {
  if (
    item.messageType === V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
    item.attachment &&
    item.attachment.raw &&
    item.attachment.raw
  ) {
    return item.attachment.raw.bizType
  } else {
    return null
  }
}

// 获取媒体资源消息类型
export function getMediaType(item: V2NIMMessage) {
  if (
    item.messageType === V2NIMMessageType.V2NIM_MESSAGE_TYPE_CUSTOM &&
    item.attachment &&
    item.attachment.raw &&
    item.attachment.raw.content &&
    (item.attachment.raw.content.mediaType || item.attachment.raw.mediaType)
  ) {
    return item.attachment.raw.content.mediaType || item.attachment.raw.mediaType
  } else {
    return null
  }
}

export async function imSilentLogin() {
  const envConfig = getEnvConfig()
  if (process.client) {
    try {
      const allConfig = await imGetAll()
      if (!allConfig.login) {
        const params = {
          from: 'jlcpcb',
          client_id: envConfig.client_id,
          state: new Date().getTime(), // 应为自定义参数
          redirect_uri: location.href,
          response_type: 'code'
        }
        const data = await checkLogin(params)
        // 1:"已登陆" 2:"参数错误"  0:"未登陆"
        if (data?.status === 1) {
          // cas 有登录态 进行静默登录
          await imLogin({ code: data.code })
          window.$nuxt.$store.dispatch('user/getUserInfo')
        }
        window.$nuxt.$store.commit('user/SET_IS_LOGIN', false)
      } else {
        window.$nuxt.$store.commit('user/SET_IS_LOGIN', true)
        window.$nuxt.$store.dispatch('user/getUserInfo')
      }
    } catch (err) {
      console.log('=======fff=======', err)
    }
  }
}
