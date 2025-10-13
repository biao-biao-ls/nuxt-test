import { ChatCustomUI } from './useChatCustomUI'
import {
  CustomerServiceDataManager,
  type CustomerServiceAgent,
  type GroupedCustomerServiceData
} from './useCustomerServiceData'

// 声明全局类型
declare global {
  interface Window {
    quickChatApi?: any
    quickEmitter?: any
    chatUI?: ChatCustomUI
    debugQuickChat?: any
  }
}

/**
 * 聊天管理器
 * 负责初始化和管理整个聊天系统
 */
export class ChatManager {
  private chatUI: ChatCustomUI | null = null
  private isInitialized = false
  private retryCount = 0
  private readonly maxRetries: number = 20
  private customerServiceData?: CustomerServiceAgent[]
  private iframeResizeObserver: ResizeObserver | null = null

  constructor(customerServiceData?: CustomerServiceAgent[]) {
    this.customerServiceData = customerServiceData
  }

  /**
   * 初始化聊天系统
   * @param customerServiceData 客服数据，可以是数组格式或分组格式
   */
  async init(customerServiceData?: CustomerServiceAgent[] | GroupedCustomerServiceData): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // 等待API准备就绪
      await this.waitForAPI()

      // 处理客服数据格式转换
      let finalCustomerServiceData: CustomerServiceAgent[] | undefined

      if (customerServiceData) {
        if (Array.isArray(customerServiceData)) {
          // 如果传入的是数组格式，直接使用
          finalCustomerServiceData = customerServiceData
        } else {
          // 如果传入的是分组格式，转换为数组格式
          finalCustomerServiceData = CustomerServiceDataManager.convertToArrayFormat(customerServiceData)
        }
      } else if (this.customerServiceData) {
        // 使用构造函数中的数据
        finalCustomerServiceData = this.customerServiceData
      }

      // 创建UI管理器实例
      this.chatUI = new ChatCustomUI(finalCustomerServiceData)

      // 设置客服状态变化回调
      this.chatUI.setOnAgentStatusChangeCallback(() => {
        this.updateLeftBarVisibility()
      })

      // 设置全局引用
      if (typeof window !== 'undefined') {
        window.chatUI = this.chatUI
      }

      // 挂载自定义组件
      this.mountCustomComponents()

      // 设置事件监听
      this.setupEventListeners()

      // 调整iframe宽度
      this.adjustIframeWidth()

      // 初始化客服状态
      this.initializeAgentStatus()

      // 设置定期状态更新
      this.setupPeriodicStatusUpdate()

      // 设置调试工具
      this.setupDebugTools()

      this.isInitialized = true
    } catch (error) {
      console.error('聊天系统初始化失败:', error)
      throw error
    }
  }

  /**
   * 等待API准备就绪
   */
  private async waitForAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkAPI = () => {
        if (typeof window !== 'undefined' && window.quickChatApi && window.quickEmitter) {
          resolve()
        } else {
          this.retryCount++
          if (this.retryCount < this.maxRetries) {
            setTimeout(checkAPI, 500)
          } else {
            reject(new Error('QuickChat API 初始化超时'))
          }
        }
      }
      checkAPI()
    })
  }

  /**
   * 挂载自定义组件
   */
  private mountCustomComponents(): void {
    if (!this.chatUI || typeof window === 'undefined') return

    // 挂载头部组件
    if (window.quickChatApi?.customHeader) {
      window.quickChatApi.customHeader.mount((container: HTMLElement) => {
        if (this.chatUI) {
          this.chatUI.state.containers.header = container
          // 初始化时只渲染 .current-agent，其他元素等待特定时机
          container.innerHTML = this.chatUI.generateInitialHeaderHTML()
        }
      })
    }

    // 挂载左侧栏组件
    if (window.quickChatApi?.customLeftBar) {
      window.quickChatApi.customLeftBar.mount((container: HTMLElement) => {
        if (this.chatUI) {
          this.chatUI.state.containers.leftBar = container
          // 初始化时不渲染内容，等待特定时机
          container.innerHTML = ''
        }
      })

      // 初始时隐藏左侧栏
      window.quickChatApi.customLeftBar.setIsShow(false)
    }

    // 挂载底部组件
    if (window.quickChatApi?.customFooter) {
      window.quickChatApi.customFooter.mount((container: HTMLElement) => {
        if (this.chatUI) {
          this.chatUI.state.containers.footer = container
          // 立即渲染底部内容，不等待特定时机
          container.innerHTML = this.chatUI.generateFooterHTML()
        }
      })
    }

    // 开始监听聊天窗口状态
    this.startChatWindowMonitoring()
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.quickEmitter || !this.chatUI) return

    // 监听客服状态更新
    window.quickEmitter.on('chat.operator.status', (data: any) => {
      console.log('chat.operator.status', data)
      if (data && data.operatorUserIdStatus && this.chatUI) {
        // 状态对比和UI更新逻辑已在updateAgentStatus方法中处理
        this.chatUI.updateAgentStatus(data.operatorUserIdStatus)
        // 更新左侧栏可见性
        this.updateLeftBarVisibility()

        // 如果当前没有选择客服，尝试恢复之前的选择
        if (!this.chatUI.state.currentChatAgent) {
          setTimeout(() => {
            if (this.chatUI) {
              this.chatUI.restorePreviousSelectedAgent()
            }
          }, 500)
        }
      }
    })

    // 监听切换客服成功事件
    window.quickEmitter.on('chat.switch.operator.success', (data: any) => {
      console.log('监听切换座席成功: chat.switch.operator.success', data)
      if (data && this.chatUI) {
        // 尝试多种可能的属性名
        const operatorId = data.operatorId || data.userId || data.quickCepId || data.id

        if (operatorId) {
          const switchedAgent = this.chatUI.state.customerServiceData.find((agent) => agent.quickCepId === operatorId)

          if (switchedAgent) {
            this.chatUI.state.currentChatAgent = switchedAgent
            this.chatUI.refreshUI()
          }
        }
      }
    })

    // 监听点击聊天icon:
    window.quickEmitter.on('chat.model.toggleChat', (data: { isOpen: boolean }) => {
      console.log('点击聊天探头')
      this.fetchAgentStatus()
    })

    // 监听成功获取消息列表 (用于自定义渲染组件时机):
    window.quickEmitter.on('chat.getMessageList.success', (data) => {
      console.log('拉取消息列表成功')
    })

    // 监听会话关闭:
    window.quickEmitter.on('chat.end', (data) => {
      console.log('chat.end', data)
    })

    // 监听当前会话座席变化:
    window.quickEmitter.on('chat.operatorList.change', (data) => {
      console.log('chat.operatorList.change', data)
    })

    // 监听其他可能的切换客服事件
    const possibleEvents = [
      'chat.operator.switch',
      'chat.switch.success',
      'operator.switch.success',
      'chat.agent.changed'
    ]

    possibleEvents.forEach((eventName) => {
      window.quickEmitter.on(eventName, (data: any) => {
        // 这里可以添加相同的处理逻辑
        console.log(eventName, data)
      })
    })

    // 监听页面焦点事件
    window.addEventListener('focus', () => {
      setTimeout(() => this.fetchAgentStatus(), 500)
    })
  }

  /**
   * 调整iframe宽度
   * 监听 iframe 高度变化，当高度大于 350px 时才设置宽度
   */
  private adjustIframeWidth(): void {
    if (!this.chatUI) return

    const newWidth = this.chatUI.config.originalIframeWidth + this.chatUI.config.leftBarWidth

    const tryAdjust = (): boolean => {
      if (typeof document === 'undefined') return false

      const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
      if (iframe) {
        const currentHeight = iframe.offsetHeight

        // 只有当高度大于 350px 时才设置宽度
        if (currentHeight > 350) {
          iframe.style.width = `${newWidth}px`
          iframe.style.minWidth = `${newWidth}px`
        }

        // 设置 ResizeObserver 监听高度变化
        if (!this.iframeResizeObserver && typeof ResizeObserver !== 'undefined') {
          this.iframeResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const height = entry.contentRect.height
              if (height > 350) {
                iframe.style.width = `${newWidth}px`
                iframe.style.minWidth = `${newWidth}px`
              }
            }
          })

          this.iframeResizeObserver.observe(iframe)
        }

        return true
      }
      return false
    }

    // 持续尝试调整宽度
    let attempts = 0
    const maxAttempts = this.chatUI.config.maxRetryAttempts

    const retryAdjust = () => {
      attempts++
      const success = tryAdjust()

      if (!success && attempts < maxAttempts) {
        setTimeout(retryAdjust, 500)
      }
    }

    retryAdjust()
  }

  /**
   * 初始化客服状态
   */
  private initializeAgentStatus(): void {
    setTimeout(() => {
      this.fetchAgentStatus()
      // 初始化时更新左侧栏可见性
      this.updateLeftBarVisibility()

      // 提前初始化底部区域（如果还没有初始化的话）
      this.initializeFooterIfNeeded()

      // 延迟一段时间后尝试恢复之前选择的客服
      // 确保客服状态已经更新
      setTimeout(() => {
        if (this.chatUI) {
          this.chatUI.restorePreviousSelectedAgent()
        }
      }, 1000)
    }, 2000)
  }

  /**
   * 如果底部区域还没有内容，则初始化它
   */
  private initializeFooterIfNeeded(): void {
    if (this.chatUI && this.chatUI.state.containers.footer) {
      const footer = this.chatUI.state.containers.footer
      if (!footer.innerHTML.trim()) {
        footer.innerHTML = this.chatUI.generateFooterHTML()
      }
    }
  }

  /**
   * 获取客服状态
   */
  private fetchAgentStatus(): void {
    if (typeof window !== 'undefined' && window.quickChatApi?.emitGetAllOperatorStatus && this.chatUI) {
      const allQuickCepIds = this.chatUI.state.customerServiceData.map((agent) => agent.quickCepId)
      window.quickChatApi.emitGetAllOperatorStatus(allQuickCepIds)
      console.log('触发获取座席状态数据:', allQuickCepIds)
    }
  }

  /**
   * 更新左侧栏可见性
   * 根据在线客服人数和当前选择状态来决定是否显示左侧栏
   */
  private updateLeftBarVisibility(): void {
    if (!this.chatUI || typeof window === 'undefined' || !window.quickChatApi?.customLeftBar) {
      return
    }

    const shouldShowLeftBar = this.chatUI.shouldShowLeftBar()

    if (shouldShowLeftBar) {
      window.quickChatApi.customLeftBar.setIsShow(true)
    } else {
      window.quickChatApi.customLeftBar.setIsShow(false)
    }
  }

  /**
   * 设置定期状态更新
   */
  private setupPeriodicStatusUpdate(): void {
    // 移除定时更新，只通过事件监听来更新客服状态
    // 当监听到 "chat.operator.status" 事件时会自动更新UI
  }

  /**
   * 开始监听聊天窗口状态
   * 使用 MutationObserver 监听 iframe 中的 DOM 变化
   */
  private startChatWindowMonitoring(): void {
    let isCustomElementsInitialized = false
    let iframeObserver: MutationObserver | null = null
    let chatBodyObserver: MutationObserver | null = null
    let timeoutId: NodeJS.Timeout | null = null

    const checkChatWindow = (): boolean => {
      try {
        const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
        if (!iframe || !iframe.contentDocument) {
          return false
        }

        const chatBodyContent = iframe.contentDocument.querySelector('#chat-body-content')
        const visitorMessage = chatBodyContent?.querySelector('.visitor-message')

        if (visitorMessage && !isCustomElementsInitialized) {
          isCustomElementsInitialized = true

          // 清理观察器和定时器
          cleanup()

          this.initializeCustomElements()
          return true
        }

        return false
      } catch (error) {
        // 忽略跨域错误，继续监听
        return false
      }
    }

    const cleanup = () => {
      if (iframeObserver) {
        iframeObserver.disconnect()
        iframeObserver = null
      }
      if (chatBodyObserver) {
        chatBodyObserver.disconnect()
        chatBodyObserver = null
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    const setupChatBodyObserver = (iframe: HTMLIFrameElement) => {
      try {
        if (!iframe.contentDocument) return

        const chatBodyContent = iframe.contentDocument.querySelector('#chat-body-content')
        if (chatBodyContent) {
          chatBodyObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.type === 'childList') {
                // 检查新增的节点中是否有 .visitor-message
                for (const node of mutation.addedNodes) {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element
                    if (element.classList?.contains('visitor-message') || element.querySelector?.('.visitor-message')) {
                      if (checkChatWindow()) {
                        return
                      }
                    }
                  }
                }
              }
            }
          })

          chatBodyObserver.observe(chatBodyContent, {
            childList: true,
            subtree: true
          })
        }
      } catch (error) {
        console.warn('设置 chat-body 观察器时出错:', error)
      }
    }

    const setupIframeObserver = () => {
      // 监听页面中 iframe 的变化
      iframeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                if (element.id === 'quick-chat-iframe' || element.querySelector?.('#quick-chat-iframe')) {
                  setTimeout(() => {
                    const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
                    if (iframe) {
                      setupIframeLoadListener(iframe)
                    }
                  }, 100)
                }
              }
            }
          }
        }
      })

      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true
      })
    }

    const setupIframeLoadListener = (iframe: HTMLIFrameElement) => {
      const onIframeLoad = () => {
        // 立即检查一次
        if (checkChatWindow()) {
          return
        }

        // 设置 iframe 内容观察器
        setupChatBodyObserver(iframe)

        // 如果 iframe 内容还没有 #chat-body-content，监听其变化
        try {
          if (iframe.contentDocument) {
            const iframeContentObserver = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                  for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      const element = node as Element
                      if (element.id === 'chat-body-content' || element.querySelector?.('#chat-body-content')) {
                        setupChatBodyObserver(iframe)
                        iframeContentObserver.disconnect()
                        break
                      }
                    }
                  }
                }
              }
            })

            iframeContentObserver.observe(iframe.contentDocument.body || iframe.contentDocument.documentElement, {
              childList: true,
              subtree: true
            })
          }
        } catch (error) {
          console.warn('设置 iframe 内容观察器时出错:', error)
        }
      }

      iframe.addEventListener('load', onIframeLoad)

      // 如果 iframe 已经加载完成
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        onIframeLoad()
      }
    }

    // 立即检查一次
    if (checkChatWindow()) {
      return
    }

    // 检查 iframe 是否已经存在
    const existingIframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
    if (existingIframe) {
      setupIframeLoadListener(existingIframe)
    } else {
      setupIframeObserver()
    }

    // 设置超时保护（30秒后强制初始化）
    timeoutId = setTimeout(() => {
      if (!isCustomElementsInitialized) {
        cleanup()
        this.initializeCustomElements()
      }
    }, 30000)
  }

  /**
   * 初始化自定义元素
   * 当检测到聊天窗口准备就绪时调用
   */
  private initializeCustomElements(): void {
    if (!this.chatUI) {
      console.error('ChatUI 未初始化')
      return
    }

    // 初始化头部的在线客服和打开左侧栏图标
    if (this.chatUI.state.containers.header) {
      this.chatUI.state.containers.header.innerHTML = this.chatUI.generateHeaderHTML()
    }

    // 初始化左侧栏
    if (this.chatUI.state.containers.leftBar) {
      this.chatUI.state.containers.leftBar.innerHTML = this.chatUI.generateLeftBarHTML()
    }

    // 初始化底部
    if (this.chatUI.state.containers.footer) {
      this.chatUI.state.containers.footer.innerHTML = this.chatUI.generateFooterHTML()
    }

    // 更新左侧栏可见性
    this.updateLeftBarVisibility()

    // 获取客服状态
    this.fetchAgentStatus()
  }

  /**
   * 设置调试工具
   */
  private setupDebugTools(): void {
    if (typeof window === 'undefined' || !this.chatUI) return

    window.debugQuickChat = {
      // 查看当前客服状态
      showAgentStatus: () => {
        if (!this.chatUI) return
        console.log('=== 当前客服状态 ===')
        this.chatUI.state.customerServiceData.forEach((agent) => {
          console.log(
            `${agent.employeeEnName}: ${this.chatUI!.getStatusText(agent.status)} (${agent.isOnline ? '在线' : '离线'})`
          )
        })
        const onlineCount = this.chatUI.state.customerServiceData.filter((agent) => agent.isOnline).length
        console.log(`总计在线客服: ${onlineCount}/${this.chatUI.state.customerServiceData.length}`)
        console.log('==================')
      },

      // 手动刷新UI
      refreshUI: () => {
        if (this.chatUI) {
          this.chatUI.refreshUI()
        }
      },

      // 模拟状态更新
      simulateStatusUpdate: (quickCepId: string, newStatus: number) => {
        if (this.chatUI) {
          const mockData: Record<string, number> = {}
          mockData[quickCepId] = newStatus
          this.chatUI.updateAgentStatus(mockData)
        }
      },

      // 获取客服数据
      getAgentData: () => {
        return this.chatUI?.state.customerServiceData
      },

      // 测试切换客服
      testSwitchAgent: (quickCepId: string) => {
        console.log(`测试切换到客服 ID: ${quickCepId}`)
        if (this.chatUI) {
          this.chatUI.selectAgent(quickCepId)
        }
      },

      // 获取当前聊天客服
      getCurrentAgent: () => {
        return this.chatUI?.state.currentChatAgent
      },

      // 重新初始化系统
      reinitialize: () => {
        this.isInitialized = false
        this.retryCount = 0
        this.init()
      },

      // 获取系统状态
      getSystemStatus: () => {
        return {
          isInitialized: this.isInitialized,
          retryCount: this.retryCount,
          hasAPI: !!(typeof window !== 'undefined' && window.quickChatApi && window.quickEmitter),
          containers: this.chatUI ? this.chatUI.state.containers : null
        }
      },

      // 手动设置当前客服（用于测试）
      setCurrentAgent: (quickCepId: string) => {
        if (!this.chatUI) return
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === quickCepId)
        if (agent) {
          this.chatUI.state.currentChatAgent = agent
          this.chatUI.refreshUI()
          console.log(`手动设置当前客服为: ${agent.employeeEnName}`)
        } else {
          console.error(`未找到客服ID: ${quickCepId}`)
        }
      },

      // 清除当前客服
      clearCurrentAgent: () => {
        if (this.chatUI) {
          this.chatUI.state.currentChatAgent = null
          this.chatUI.refreshUI()
          console.log('已清除当前客服')
        }
      },

      // 测试事件触发
      testSwitchEvent: (quickCepId: string) => {
        console.log(`模拟触发切换客服成功事件: chat.switch.operator.success，客服ID: ${quickCepId}`)
        if (typeof window !== 'undefined' && window.quickEmitter) {
          window.quickEmitter.emit('chat.switch.operator.success', {
            operatorId: quickCepId,
            success: true
          })
        }
      },

      // 测试客服离线功能
      testAgentOffline: (quickCepId: string) => {
        if (!this.chatUI) return
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === quickCepId)
        if (agent) {
          console.log(`模拟客服 ${agent.employeeEnName} 离线`)
          agent.isOnline = false
          agent.status = 1 // 离线状态
          this.chatUI.refreshUI()
        } else {
          console.error(`未找到客服ID: ${quickCepId}`)
        }
      },

      // 测试客服上线功能
      testAgentOnline: (quickCepId: string) => {
        if (!this.chatUI) return
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === quickCepId)
        if (agent) {
          console.log(`模拟客服 ${agent.employeeEnName} 上线`)
          agent.isOnline = true
          agent.status = 2 // 在线空闲状态
          this.chatUI.refreshUI()
        } else {
          console.error(`未找到客服ID: ${quickCepId}`)
        }
      },

      // 测试当前客服离线场景
      testCurrentAgentOffline: () => {
        if (!this.chatUI || !this.chatUI.state.currentChatAgent) {
          console.log('当前没有选中的客服')
          return
        }
        const currentAgent = this.chatUI.state.currentChatAgent
        console.log(`测试当前客服 ${currentAgent.employeeEnName} 离线场景`)

        // 模拟当前客服离线
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === currentAgent.quickCepId)
        if (agent) {
          agent.isOnline = false
          agent.status = 1
          console.log(`已将客服 ${agent.employeeEnName} 设置为离线，刷新UI...`)
          this.chatUI.refreshUI()
        }
      },

      // 检查当前客服状态
      checkCurrentAgentStatus: () => {
        if (!this.chatUI) return
        const result = this.chatUI.checkCurrentAgentStatus()
        if (result) {
          console.log('当前客服已离线，已自动恢复为默认状态')
        } else {
          console.log('当前客服状态正常或无当前客服')
        }
        return result
      },

      // 测试恢复之前选择的客服
      testRestorePreviousAgent: () => {
        if (this.chatUI) {
          this.chatUI.restorePreviousSelectedAgent()
        }
      },

      // 手动初始化自定义元素
      initializeCustomElements: () => {
        this.initializeCustomElements()
      },

      // 检查聊天窗口状态
      checkChatWindow: () => {
        try {
          const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
          if (!iframe || !iframe.contentDocument) {
            console.log('iframe 不存在或无法访问')
            return false
          }

          const chatBodyContent = iframe.contentDocument.querySelector('#chat-body-content')
          const visitorMessage = chatBodyContent?.querySelector('.visitor-message')

          console.log('聊天窗口检查结果:', {
            iframe: !!iframe,
            contentDocument: !!iframe.contentDocument,
            chatBodyContent: !!chatBodyContent,
            visitorMessage: !!visitorMessage
          })

          return !!visitorMessage
        } catch (error) {
          console.error('检查聊天窗口时出错:', error)
          return false
        }
      },

      // 重新开始监听
      restartMonitoring: () => {
        this.startChatWindowMonitoring()
      },

      // 测试 MutationObserver 功能
      testMutationObserver: () => {
        console.log('测试 MutationObserver 功能...')

        // 检查浏览器是否支持 MutationObserver
        if (typeof MutationObserver === 'undefined') {
          console.error('浏览器不支持 MutationObserver')
          return false
        }

        console.log('✅ MutationObserver 支持正常')

        // 测试基本的 MutationObserver 功能
        const testDiv = document.createElement('div')
        testDiv.id = 'mutation-test'
        document.body.appendChild(testDiv)

        const observer = new MutationObserver((mutations) => {
          console.log('✅ MutationObserver 触发成功，检测到变化:', mutations.length)
          observer.disconnect()
          document.body.removeChild(testDiv)
        })

        observer.observe(testDiv, { childList: true })

        // 触发变化
        const childDiv = document.createElement('div')
        childDiv.textContent = 'Test child'
        testDiv.appendChild(childDiv)

        return true
      },

      // 检查 iframe 访问权限
      checkIframeAccess: () => {
        try {
          const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
          if (!iframe) {
            console.log('❌ iframe 不存在')
            return { accessible: false, reason: 'iframe 不存在' }
          }

          if (!iframe.contentDocument) {
            console.log('❌ 无法访问 iframe.contentDocument（可能是跨域限制）')
            return { accessible: false, reason: '跨域限制' }
          }

          const chatBodyContent = iframe.contentDocument.querySelector('#chat-body-content')
          console.log('✅ iframe 访问正常', {
            contentDocument: !!iframe.contentDocument,
            chatBodyContent: !!chatBodyContent,
            readyState: iframe.contentDocument.readyState
          })

          return {
            accessible: true,
            contentDocument: !!iframe.contentDocument,
            chatBodyContent: !!chatBodyContent,
            readyState: iframe.contentDocument.readyState
          }
        } catch (error) {
          console.error('❌ 检查 iframe 访问权限时出错:', error)
          return { accessible: false, reason: error.message }
        }
      },

      // 查看本地存储的客服选择
      getStoredAgent: () => {
        try {
          if (typeof localStorage !== 'undefined') {
            const storedData = localStorage.getItem('quickchat_selected_agent')
            if (storedData) {
              const agentData = JSON.parse(storedData)
              console.log('本地存储的客服选择:', agentData)
              return agentData
            } else {
              console.log('没有本地存储的客服选择')
              return null
            }
          }
        } catch (error) {
          console.error('获取本地存储失败:', error)
        }
      },

      // 清除本地存储的客服选择
      clearStoredAgent: () => {
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('quickchat_selected_agent')
            console.log('已清除本地存储的客服选择')
          }
        } catch (error) {
          console.error('清除本地存储失败:', error)
        }
      }
    }
  }

  /**
   * 销毁聊天系统
   */
  destroy(): void {
    if (this.chatUI) {
      // 清理事件监听器
      if (typeof window !== 'undefined' && window.quickEmitter) {
        window.quickEmitter.off('chat.operator.status')
        window.quickEmitter.off('chat.switch.operator.success')
      }

      // 清理 ResizeObserver
      if (this.iframeResizeObserver) {
        this.iframeResizeObserver.disconnect()
        this.iframeResizeObserver = null
      }

      // 清理全局引用
      if (typeof window !== 'undefined') {
        delete window.chatUI
        delete window.debugQuickChat
      }

      this.chatUI = null
      this.isInitialized = false
    }
  }
}

export default ChatManager
