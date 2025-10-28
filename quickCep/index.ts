import { getEnvConfig } from '../common'
import { ChatManager } from './useChatManager'
import { ChatCustomUI } from './useChatCustomUI'
import { ChatStyles } from './useChatStyles'
import { SimpleOrderSelector } from './useSimpleOrderSelector'

export const initQuickCep = (rawCustomerServiceData = {}) => {
  // Mount classes to global object for use in HTML event handling
  if (typeof window !== 'undefined') {
    window.ChatStyles = ChatStyles
    window.ChatCustomUI = ChatCustomUI
    window.ChatManager = ChatManager
    window.SimpleOrderSelector = SimpleOrderSelector
  }
  const initFn = async () => {
    try {
      if (
        window.$nuxt.$store.state.user &&
        window.$nuxt.$store.state.user.info &&
        window.$nuxt.$store.state.user.info.customerCode
      ) {
        const customerCode = window.$nuxt.$store.state.user.info.customerCode
        window.quickChatApi.identify(customerCode)
        window.quickChatApi.setContactProperties({ $customer_id: customerCode })
        console.log(
          `Chat system initialization...\ntypeof window.quickChatApi === ${typeof window.quickChatApi}\ncustomerCode: ${customerCode}`
        )
      }
      // Raw customer service data grouped by business line (can be obtained from API or other data sources)
      // const rawCustomerServiceData = {}
      // Create and initialize chat manager, directly pass in grouped format customer service data
      // Data format conversion will be handled in chatManager.init
      const chatManager = new ChatManager()
      await chatManager.init(rawCustomerServiceData)

      // Set global reference
      window.chatManager = chatManager
    } catch (error) {
      console.error('Chat system initialization failed:', error)
    }
  }

  window.quickChatReadyHook = () => {
    initFn()
  }
}

// 动态加载快牛脚本
export function loadQuickCepScript() {
  const envConfig = getEnvConfig()
  const store = window.$nuxt.$store
  const userStore = store.state.user
  const userInfo = userStore.info

  let quickCepUrl = envConfig.QUICK_CEP_URL

  // 拼接 visitorId 参数
  const separator = quickCepUrl.includes('?') ? '&' : '?'

  if (userInfo && userInfo.customerCode) {
    quickCepUrl = `${quickCepUrl}${separator}visitorId=${userInfo.customerCode}`
  }
  console.log('开始加载快牛脚本:', quickCepUrl)

  const script = document.createElement('script')
  script.src = quickCepUrl
  script.setAttribute('data-quick-cep', 'true')

  // 添加加载成功和失败的回调
  script.onload = () => {
    console.log('快牛脚本加载成功')
    // 脚本加载成功后，执行快牛相关初始化
    // 初始化快牛员工信息
    initQuickCep(userStore.quickChatEmployeeInfo || {})
  }
  script.onerror = () => {
    console.error('快牛脚本加载失败')
  }

  document.head.appendChild(script)
}
