import { ChatCustomUI } from './useChatCustomUI'
import { SimpleOrderSelector } from './useSimpleOrderSelector'
import {
  CustomerServiceDataManager,
  type CustomerServiceAgent,
  type GroupedCustomerServiceData
} from './useCustomerServiceData'

// Global type declarations are in type.d.ts

/**
 * 聊天管理器
 * 负责初始化和管理整个聊天系统
 */
export class ChatManager {
  private chatUI: ChatCustomUI | null = null
  private simpleOrderSelector: SimpleOrderSelector | null = null
  private isInitialized = false
  private retryCount = 0
  private readonly maxRetries: number = 20
  private customerServiceData?: CustomerServiceAgent[]
  private iframeResizeObserver: ResizeObserver | null = null
  private operatorStatusReceived = false
  private pendingOperatorListChange: any = null

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
      // Wait for API to be ready
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

      // Create simplified order selector instance
      this.simpleOrderSelector = new SimpleOrderSelector()

      // Set order send callback
      this.simpleOrderSelector.setOnSendOrderCallback((orderItem) => {
        this.sendSimpleOrderMessage(orderItem)
      })

      // 设置客服状态变化回调
      this.chatUI.setOnAgentStatusChangeCallback(() => {
        this.updateLeftBarVisibility()
      })

      // 设置全局引用
      if (typeof window !== 'undefined') {
        ; (window as any).chatUI = this.chatUI
          ; (window as any).simpleOrderSelector = this.simpleOrderSelector
      }

      // Mount custom components
      this.mountCustomComponents()

      // Setup event listeners
      this.setupEventListeners()

      // Adjust iframe width
      this.adjustIframeWidth()

      // Initialize agent status
      this.initializeAgentStatus()

      // Setup periodic status updates
      this.setupPeriodicStatusUpdate()

      // Setup debug tools
      this.setupDebugTools()

      this.isInitialized = true
    } catch (error) {
      console.error('Chat system initialization failed:', error)
      throw error
    }
  }

  /**
   * Wait for API to be ready
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
   * Mount custom components
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
          // 绑定全局事件处理器
          this.bindGlobalEventHandlers()
        }
      })
    }

    // Create order selector container in main window
    if (this.simpleOrderSelector) {
      // 尝试在 iframe 外部创建容器
      this.createOrderSelectorContainer()
    }

    // Start monitoring chat window status
    this.startChatWindowMonitoring()
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.quickEmitter || !this.chatUI) return

    // 监听客服状态更新
    window.quickEmitter.on('chat.operator.status', (data: any) => {
      console.log('chat.operator.status', data)
      if (data && data.operatorUserIdStatus && this.chatUI) {
        // 标记已接收到客服状态数据
        this.operatorStatusReceived = true

        // 状态对比和UI更新逻辑已在updateAgentStatus方法中处理
        this.chatUI.updateAgentStatus(data.operatorUserIdStatus)
        // Update left sidebar visibility
        this.updateLeftBarVisibility()

        // 如果当前没有选择客服，尝试恢复之前的选择
        if (!this.chatUI.state.currentChatAgent) {
          setTimeout(() => {
            if (this.chatUI) {
              this.chatUI.restorePreviousSelectedAgent()
            }
          }, 500)
        }

        // 如果有待处理的座席列表变化，现在处理它
        if (this.pendingOperatorListChange) {
          console.log('处理待处理的座席列表变化')
          this.handleOperatorListChange(this.pendingOperatorListChange)
          this.pendingOperatorListChange = null
        }
      }
    })

    // 监听切换客服成功事件
    window.quickEmitter.on('chat.switch.operator.success', (data: any) => {
      console.log('Listening for agent switch success: chat.switch.operator.success', data)
      if (this.chatUI) {
        // 调用 ChatCustomUI 的处理方法
        this.chatUI.handleSwitchOperatorSuccess()
      }
    })

    // 监听点击聊天icon:
    window.quickEmitter.on('chat.model.toggleChat', (data: any) => {
      console.log('点击聊天探头')
      this.fetchAgentStatus()
      this.injectCustomStyles()
    })

    // 监听成功获取消息列表 (用于自定义渲染组件时机):
    window.quickEmitter.on('chat.getMessageList.success', (data: any) => {
      console.log('拉取消息列表成功')
    })

    // 监听会话关闭:
    window.quickEmitter.on('chat.end', (data: any) => {
      console.log('chat.end', data)
      // When session closes, restore agent info to default state
      this.resetToDefaultAgent()
    })

    // 监听当前会话座席变化:
    window.quickEmitter.on('chat.operatorList.change', (data: any) => {
      console.log('chat.operatorList.change', data)

      // 检查是否已接收到客服状态数据
      if (this.operatorStatusReceived) {
        // 如果已接收到状态数据，立即处理
        this.handleOperatorListChange(data)
      } else {
        // 如果还没有接收到状态数据，暂存待处理
        console.log('Waiting for chat.operator.status event to trigger before processing operator list changes')
        this.pendingOperatorListChange = data
      }
    })

    // 监听其他可能的切换客服事件
    const possibleEvents = [
      'chat.operator.switch',
      'chat.switch.success',
      'operator.switch.success',
      'chat.agent.changed'
    ]

    possibleEvents.forEach((eventName) => {
      window.quickEmitter?.on(eventName, (data: any) => {
        // 这里可以添加相同的处理逻辑
        console.log(eventName, data)
      })
    })

    // 监听页面焦点事件
    window.addEventListener('focus', () => {
      setTimeout(() => this.fetchAgentStatus(), 500)
    })

    // 监听来自 iframe 的消息
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data && event.data.type === 'TOGGLE_ORDER_SELECTOR') {
        if (this.simpleOrderSelector) {
          this.simpleOrderSelector.toggle()
        }
      }
    })
  }

  /**
   * Adjust iframe width
   * Monitor iframe width changes using ResizeObserver
   */
  private adjustIframeWidth(): void {
    // 清理之前的观察器
    if (this.iframeResizeObserver) {
      this.iframeResizeObserver.disconnect()
      this.iframeResizeObserver = null
    }

    const setupIframeWidthMonitoring = () => {
      const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
      if (!iframe) {
        // 如果 iframe 还不存在，延迟重试
        setTimeout(setupIframeWidthMonitoring, 1000)
        return
      }

      // 创建 ResizeObserver 来监听 iframe 尺寸变化
      this.iframeResizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          console.log(`iframe 尺寸变化: ${width}px x ${height}px`)

          // 只有当 iframe 高度大于 350px 时才执行宽度修改逻辑
          if (height > 350) {
            // 获取 iframe 内部的 chat-wrap 元素
            try {
              if (iframe.contentDocument) {
                const chatWrap = iframe.contentDocument.getElementById('chat-wrap')
                const diyLeftBar = iframe.contentDocument.getElementById('DIY-LEFT-BAR')

                if (chatWrap) {
                  const chatWrapWidth = chatWrap.offsetWidth
                  const diyLeftBarWidth = diyLeftBar ? diyLeftBar.offsetWidth : 0
                  const newIframeWidth = chatWrapWidth + diyLeftBarWidth + 60

                  console.log(`iframe 高度 ${height}px > 350px，chat-wrap 宽度: ${chatWrapWidth}px，DIY-LEFT-BAR 宽度: ${diyLeftBarWidth}px，设置 iframe 宽度为: ${newIframeWidth}px`)

                  // 设置 iframe 的宽度
                  iframe.style.width = `${newIframeWidth}px`
                } else {
                  console.log('未找到 chat-wrap 元素')
                }
              }
            } catch (error) {
              console.warn('访问 iframe 内容时出错:', error)
            }
          } else {
            console.log(`iframe 高度 ${height}px <= 350px，跳过宽度调整`)
          }
        }
      })

      // 开始观察 iframe
      this.iframeResizeObserver.observe(iframe)
      console.log('✅ 开始监听 iframe 宽度变化')
    }

    // 立即尝试设置监听
    setupIframeWidthMonitoring()
  }

  /**
   * Initialize agent status
   */
  private initializeAgentStatus(): void {
    setTimeout(() => {
      this.fetchAgentStatus()
      // Update left sidebar visibility during initialization
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
   * Fetch agent status
   */
  private fetchAgentStatus(): void {
    if (typeof window !== 'undefined' && window.quickChatApi?.emitGetAllOperatorStatus && this.chatUI) {
      const allQuickCepIds = this.chatUI.state.customerServiceData.map((agent) => agent.quickCepId)
      window.quickChatApi.emitGetAllOperatorStatus(allQuickCepIds)
      console.log('触发获取座席状态数据:', allQuickCepIds)
    }
  }

  /**
   * Handle operator list changes
   */
  private handleOperatorListChange(data: any): void {
    if (!this.chatUI) return

    // Handle operator list changes
    if (data && Array.isArray(data) && data.length > 0) {
      // Get first operator info (usually current session has only one operator)
      const currentOperator = data[0]
      const operatorId = currentOperator.operatorId

      if (operatorId) {
        // 根据 operatorId 查找对应的客服信息
        const matchedAgent = this.chatUI.state.customerServiceData.find(
          (agent) => agent.quickCepId === operatorId
        )

        if (matchedAgent) {
          console.log('找到匹配的客服:', matchedAgent.employeeEnName)

          // 更新当前聊天客服
          this.chatUI.state.currentChatAgent = matchedAgent

          // 注意：客服的在线状态应该通过 'chat.operator.status' 事件的 data.operatorUserIdStatus 来更新
          // 这里不直接更新状态，而是依赖 chat.operator.status 事件来更新客服状态
          console.log('座席列表变化，当前操作员信息:', currentOperator)

          // Refresh UI display
          this.chatUI.refreshUI()

          // 保存当前选择的客服到本地存储
          this.chatUI.saveSelectedAgent(matchedAgent)

          // 触发获取最新的客服状态，确保状态是最新的
          setTimeout(() => {
            this.fetchAgentStatus()
          }, 100)

          console.log('已更新当前会话客服为:', {
            name: matchedAgent.employeeEnName,
            quickCepId: matchedAgent.quickCepId,
            status: matchedAgent.status,
            isOnline: matchedAgent.isOnline
          })
        } else {
          console.warn('未找到匹配的客服，operatorId:', operatorId)
        }
      }
    } else if (data && Array.isArray(data) && data.length === 0) {
      // 如果座席列表为空，可能是会话结束或没有分配座席
      console.log('当前会话没有分配座席')
      this.resetToDefaultAgent()
    }
  }

  /**
   * Update left sidebar visibility
   * Decide whether to show left sidebar based on online agent count and current selection status
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
   * Setup periodic status updates
   */
  private setupPeriodicStatusUpdate(): void {
    // 移除定时更新，只通过事件监听来更新客服状态
    // 当监听到 "chat.operator.status" 事件时会自动更新UI
  }

  /**
   * Start monitoring chat window status
   * Use MutationObserver to monitor DOM changes in iframe
   */
  private startChatWindowMonitoring(): void {
    let isCustomElementsInitialized = false
    let iframeObserver: MutationObserver | null = null
    let chatBodyObserver: MutationObserver | null = null
    let timeoutId: any = null

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
      // iframeObserver = new MutationObserver((mutations) => {
      //   for (const mutation of mutations) {
      //     if (mutation.type === 'childList') {
      //       for (const node of mutation.addedNodes) {
      //         if (node.nodeType === Node.ELEMENT_NODE) {
      //           const element = node as Element
      //           if (element.id === 'quick-chat-iframe' || element.querySelector?.('#quick-chat-iframe')) {
      //             setTimeout(() => {
      //               const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
      //               if (iframe) {
      //                 setupIframeLoadListener(iframe)
      //               }
      //             }, 100)
      //           }
      //         }
      //       }
      //     }
      //   }
      // })

      // iframeObserver.observe(document.body, {
      //   childList: true,
      //   subtree: true
      // })
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
   * Initialize custom elements
   * Called when chat window is detected to be ready
   */
  private initializeCustomElements(): void {
    if (!this.chatUI) {
      console.error('ChatUI 未初始化')
      return
    }

    // Inject custom styles into iframe
    this.injectCustomStyles()

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

    // 绑定全局事件处理器
    this.bindGlobalEventHandlers()

    // Update left sidebar visibility
    this.updateLeftBarVisibility()

    // Fetch agent status
    this.fetchAgentStatus()
  }

  /**
   * Inject custom styles into iframe
   * Modify native element styles in QuickChat iframe
   */
  private injectCustomStyles(): void {
    try {
      const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
      if (!iframe || !iframe.contentDocument) {
        console.warn('无法访问 iframe，跳过样式注入')
        return
      }

      const styleId = 'quickchat-custom-styles'

      // 检查是否已经注入过样式
      if (iframe.contentDocument.getElementById(styleId)) {
        console.log('自定义样式已存在，跳过重复注入')
        return
      }

      // 创建样式元素
      const customStyle = iframe.contentDocument.createElement('style')
      customStyle.id = styleId
      customStyle.textContent = `
        #chat-header {
          padding-top: 12px !important;
          padding-bottom: 12px !important;
          background: #fff;
          box-shadow: none;
        }
        .ant-dropdown-trigger.close-chat.icon {
          color: #444;
        }
        .chat-header__close.pointer.icon {
          color: #444;
        }
        .full-agent-tooltip {
          position: absolute;
          display: none;
          z-index: 99999;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 10px;
          border-radius: 12px;
          max-width: 320px;
          min-width: 120px;
        }

        .full-agent-tooltip::before {
          content: '';
          position: absolute;
          top: 100%;
          left: 22%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(0, 0, 0, 0.85);
          z-index: 10001;
          display: block;
        }
      `

      // 注入到 iframe 的 head 中
      if (iframe.contentDocument.head) {
        iframe.contentDocument.head.appendChild(customStyle)
        console.log('✅ Successfully injected custom styles into QuickChat iframe')
      } else {
        console.warn('iframe head does not exist, cannot inject styles')
      }
    } catch (error) {
      console.error('Failed to inject custom styles:', error)
    }
  }

  /**
   * Setup debug tools
   */
  private setupDebugTools(): void {
    if (typeof window === 'undefined' || !this.chatUI) return

    window.debugQuickChat = {
      // View current agent status
      showAgentStatus: () => {
        if (!this.chatUI) return
        console.log('=== 当前客服状态 ===')
        this.chatUI.state.customerServiceData.forEach((agent) => {
          console.log(
            `${agent.employeeEnName}: ${this.chatUI!.getStatusText(agent.status)} (${agent.isOnline ? 'Online' : 'Offline'})`
          )
        })
        const onlineCount = this.chatUI.state.customerServiceData.filter((agent) => agent.isOnline).length
        console.log(`Total online agents: ${onlineCount}/${this.chatUI.state.customerServiceData.length}`)
        console.log('==================')
      },

      // Manually refresh UI
      refreshUI: () => {
        if (this.chatUI) {
          this.chatUI.refreshUI()
        }
      },

      // Simulate status update
      simulateStatusUpdate: (quickCepId: string, newStatus: number) => {
        if (this.chatUI) {
          const mockData: Record<string, number> = {}
          mockData[quickCepId] = newStatus
          this.chatUI.updateAgentStatus(mockData)
        }
      },

      // Get agent data
      getAgentData: () => {
        return this.chatUI?.state.customerServiceData
      },

      // Test agent switching
      testSwitchAgent: (quickCepId: string) => {
        console.log(`Testing switch to agent ID: ${quickCepId}`)
        if (this.chatUI) {
          this.chatUI.selectAgent(quickCepId)
        }
      },

      // Get current chat agent
      getCurrentAgent: () => {
        return this.chatUI?.state.currentChatAgent
      },

      // Reinitialize system
      reinitialize: () => {
        this.isInitialized = false
        this.retryCount = 0
        this.init()
      },

      // Get system status
      getSystemStatus: () => {
        return {
          isInitialized: this.isInitialized,
          retryCount: this.retryCount,
          hasAPI: !!(typeof window !== 'undefined' && window.quickChatApi && window.quickEmitter),
          containers: this.chatUI ? this.chatUI.state.containers : null
        }
      },

      // Manually set current agent (for testing)
      setCurrentAgent: (quickCepId: string) => {
        if (!this.chatUI) return
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === quickCepId)
        if (agent) {
          this.chatUI.state.currentChatAgent = agent
          this.chatUI.refreshUI()
          console.log(`Manually set current agent to: ${agent.employeeEnName}`)
        } else {
          console.error(`Agent ID not found: ${quickCepId}`)
        }
      },

      // Clear current agent
      clearCurrentAgent: () => {
        if (this.chatUI) {
          this.chatUI.state.currentChatAgent = null
          this.chatUI.refreshUI()
          console.log('Current agent cleared')
        }
      },

      // Test event triggering
      testSwitchEvent: (quickCepId: string) => {
        console.log(`Simulating agent switch success event: chat.switch.operator.success, Agent ID: ${quickCepId}`)
        if (typeof window !== 'undefined' && window.quickEmitter) {
          window.quickEmitter.emit('chat.switch.operator.success', {
            operatorId: quickCepId,
            success: true
          })
        }
      },

      // Test agent offline functionality
      testAgentOffline: (quickCepId: string) => {
        if (!this.chatUI) return
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === quickCepId)
        if (agent) {
          console.log(`Simulating agent ${agent.employeeEnName} offline`)
          agent.isOnline = false
          agent.status = 1 // Offline status
          this.chatUI.refreshUI()
        } else {
          console.error(`未找到客服ID: ${quickCepId}`)
        }
      },

      // Test agent online functionality
      testAgentOnline: (quickCepId: string) => {
        if (!this.chatUI) return
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === quickCepId)
        if (agent) {
          console.log(`Simulating agent ${agent.employeeEnName} online`)
          agent.isOnline = true
          agent.status = 2 // Online available status
          this.chatUI.refreshUI()
        } else {
          console.error(`未找到客服ID: ${quickCepId}`)
        }
      },

      // Test current agent offline scenario
      testCurrentAgentOffline: () => {
        if (!this.chatUI || !this.chatUI.state.currentChatAgent) {
          console.log('No agent currently selected')
          return
        }
        const currentAgent = this.chatUI.state.currentChatAgent
        console.log(`Testing current agent ${currentAgent.employeeEnName} offline scenario`)

        // Simulate current agent offline
        const agent = this.chatUI.state.customerServiceData.find((a) => a.quickCepId === currentAgent.quickCepId)
        if (agent) {
          agent.isOnline = false
          agent.status = 1
          console.log(`Set agent ${agent.employeeEnName} to offline, refreshing UI...`)
          this.chatUI.refreshUI()
        }
      },

      // Check current agent status
      checkCurrentAgentStatus: () => {
        if (!this.chatUI) return
        const result = this.chatUI.checkCurrentAgentStatus()
        if (result) {
          console.log('Current agent went offline, automatically restored to default state')
        } else {
          console.log('Current agent status is normal or no current agent')
        }
        return result
      },

      // Test restoring previously selected agent
      testRestorePreviousAgent: () => {
        if (this.chatUI) {
          this.chatUI.restorePreviousSelectedAgent()
        }
      },

      // Manually ini
      initializeCustomElements: () => {
        this.initializeCustomElements()
      },

      // Check chat window status
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

      // Restart monitoring
      restartMonitoring: () => {
        this.startChatWindowMonitoring()
      },

      // Test MutationObserver functionality
      testMutationObserver: () => {
        console.log('Testing MutationObserver functionality...')

        // 检查浏览器是否支持 MutationObserver
        if (typeof MutationObserver === 'undefined') {
          console.error('浏览器不支持 MutationObserver')
          return false
        }

        console.log('✅ MutationObserver support is normal')

        // Test basic MutationObserver functionality
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
        } catch (error: any) {
          console.error('❌ 检查 iframe 访问权限时出错:', error)
          return { accessible: false, reason: error.message }
        }
      },

      // View locally stored agent selection
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
      },

      // Test style injection
      testStyleInjection: () => {
        this.injectCustomStyles()
      },

      // 强制重新注入样式（先移除再注入）
      forceReinjectStyles: () => {
        try {
          const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
          if (iframe && iframe.contentDocument) {
            const existingStyle = iframe.contentDocument.getElementById('quickchat-custom-styles')
            if (existingStyle) {
              existingStyle.remove()
              console.log('已移除现有样式')
            }
            this.injectCustomStyles()
          }
        } catch (error) {
          console.error('强制重新注入样式失败:', error)
        }
      },


    }
  }

  /**
   * 绑定全局事件处理器
   */
  private bindGlobalEventHandlers(): void {
    if (typeof window !== 'undefined' && this.chatUI) {
      // 绑定到当前窗口
      ; (window as any).handleOrderButtonClick = () => this.chatUI?.handleOrderButtonClick()

      // 延迟绑定到 iframe 窗口，确保 iframe 内容已加载
      setTimeout(() => {
        this.bindToIframe()
      }, 1000)
    }
  }

  /**
   * 绑定函数到 iframe 窗口
   */
  private bindToIframe(): void {
    try {
      const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
      if (iframe && iframe.contentWindow && iframe.contentDocument) {
        // 绑定函数到 iframe 的全局作用域
        ; (iframe.contentWindow as any).handleOrderButtonClick = () => this.chatUI?.handleOrderButtonClick()

        // 创建一个脚本元素来确保函数在 iframe 内部可用
        const script = iframe.contentDocument.createElement('script')
        script.textContent = `
          window.handleOrderButtonClick = function() {
            try {
              if (window.parent && window.parent.handleOrderButtonClick) {
                window.parent.handleOrderButtonClick();
              } else if (window.parent && window.parent.postMessage) {
                window.parent.postMessage({type: 'TOGGLE_ORDER_SELECTOR'}, '*');
              }
            } catch (error) {
              console.error('Error handling order button click in iframe:', error);
              if (window.parent && window.parent.postMessage) {
                window.parent.postMessage({type: 'TOGGLE_ORDER_SELECTOR'}, '*');
              }
            }
          };
        `
        iframe.contentDocument.head.appendChild(script)

        console.log('✅ 已成功绑定函数到 iframe')
      }
    } catch (error) {
      console.warn('无法绑定到 iframe 窗口:', error)
    }
  }

  /**
   * Create order selector container
   */
  private createOrderSelectorContainer(): void {
    if (!this.simpleOrderSelector) return

    // 尝试在 iframe 内部的 chat-wrap 元素中创建容器
    const tryCreateInIframe = () => {
      try {
        const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
        if (iframe && iframe.contentDocument) {
          const chatWrap = iframe.contentDocument.getElementById('chat-wrap')
          if (chatWrap) {
            let orderContainer = iframe.contentDocument.getElementById('simple-order-container')
            if (!orderContainer) {
              orderContainer = iframe.contentDocument.createElement('div')
              orderContainer.id = 'simple-order-container'
              orderContainer.style.position = 'absolute'
              orderContainer.style.bottom = '0' // 在底部按钮上方
              orderContainer.style.left = '0'
              orderContainer.style.height = '100%'
              orderContainer.style.right = '0'
              orderContainer.style.zIndex = '1000'
              orderContainer.style.pointerEvents = 'none' // 默认不拦截事件
              chatWrap.appendChild(orderContainer)
            }

            // Mount order selector
            this.simpleOrderSelector?.mount(orderContainer)
            return true
          }
        }
      } catch (error) {
        console.warn('无法在 iframe 内创建容器:', error)
      }
      return false
    }

    // 尝试创建，如果失败则重试
    let attempts = 0
    const maxAttempts = 10

    const retryCreate = () => {
      attempts++
      const success = tryCreateInIframe()

      if (!success && attempts < maxAttempts) {
        setTimeout(retryCreate, 1000)
      } else if (!success) {
        // 降级：在主页面创建
        console.warn('无法在 iframe 内创建容器，降级到主页面')
        this.createOrderSelectorInMainWindow()
      }
    }

    retryCreate()
  }

  /**
   * Create order selector container in main window (fallback solution)
   */
  private createOrderSelectorInMainWindow(): void {
    if (!this.simpleOrderSelector) return

    let orderContainer = document.getElementById('simple-order-container')
    if (!orderContainer) {
      orderContainer = document.createElement('div')
      orderContainer.id = 'simple-order-container'
      orderContainer.style.position = 'fixed'
      orderContainer.style.bottom = '80px'
      orderContainer.style.right = '20px'
      orderContainer.style.zIndex = '10000'
      orderContainer.style.width = '350px'
      orderContainer.style.maxHeight = '400px'
      document.body.appendChild(orderContainer)
    }

    this.simpleOrderSelector.mount(orderContainer)
  }

  /**
   * Send simplified order message
   */
  private sendSimpleOrderMessage(orderItem: any): void {
    if (typeof window !== 'undefined' && window.quickChatApi?.sendMessage) {
      const orderMessage = this.formatSimpleOrderMessage(orderItem)
      try {
        window.quickChatApi.sendMessage(orderMessage)
        console.log('Order message sent:', orderMessage)
      } catch (error) {
        console.error('Failed to send order message:', error)
      }
    } else {
      console.error('quickChatApi.sendMessage 方法不可用')
    }
  }

  /**
   * Format simplified order message
   */
  private formatSimpleOrderMessage(orderItem: any): string {
    return `📦 Order Information
Order #: ${orderItem.orderCode}
Product Name: ${orderItem.title}
Amount: ${orderItem.orderAmount}
Type: ${this.getBusinessTypeName(orderItem.businessType)}`
  }

  /**
   * Get business type name
   */
  private getBusinessTypeName(businessType: string): string {
    const typeMap: Record<string, string> = {
      'order_pcb': 'PCB',
      'order_smt': 'SMT',
      'order_steel': 'Steel Mesh',
      'order_cnc': 'CNC',
      'order_tdp': '3D Printing',
      'order_plate_metal': 'Sheet Metal',
      'order_fa': 'Components'
    }
    return typeMap[businessType] || businessType
  }

  /**
   * Restore agent info to default state
   * Called when session closes, clear currently selected agent info
   */
  private resetToDefaultAgent(): void {
    if (!this.chatUI) {
      return
    }

    console.log('Session closed, restoring agent info to default state')

    // Reset status flags
    this.operatorStatusReceived = false
    this.pendingOperatorListChange = null

    // 调用ChatCustomUI的重置方法
    this.chatUI.resetToDefaultAgent()

    // Update left sidebar visibility
    this.updateLeftBarVisibility()

    console.log('已恢复为默认客服状态')
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
        delete (window as any).chatUI
        delete (window as any).simpleOrderSelector
        delete (window as any).debugQuickChat
      }

      this.chatUI = null
      this.simpleOrderSelector = null
      this.isInitialized = false
    }
  }
}

export default ChatManager
