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

  // // Set QuickChat ready callback

  // initFn()

  if (window.$nuxt.$store.state.isQuickCepReady) {
    initFn()
  } else {
    window.quickChatReadyHook = () => {
      initFn()
    }
  }
}
