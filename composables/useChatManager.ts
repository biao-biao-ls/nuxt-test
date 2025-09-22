import { ChatCustomUI } from './useChatCustomUI'

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
  private isInitialized: boolean = false
  private retryCount: number = 0
  private readonly maxRetries: number = 20

  constructor() {
    // 构造函数保持简洁
  }

  /**
   * 初始化聊天系统
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      console.log("聊天系统已经初始化")
      return
    }

    console.log("开始初始化聊天系统...")

    try {
      // 等待API准备就绪
      await this.waitForAPI()

      // 创建UI管理器实例
      this.chatUI = new ChatCustomUI()

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
      console.log("聊天系统初始化完成")
    } catch (error) {
      console.error("聊天系统初始化失败:", error)
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
          console.log("QuickChat API 已准备就绪")
          resolve()
        } else {
          this.retryCount++
          if (this.retryCount < this.maxRetries) {
            console.log(`等待 QuickChat API... (${this.retryCount}/${this.maxRetries})`)
            setTimeout(checkAPI, 500)
          } else {
            reject(new Error("QuickChat API 初始化超时"))
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
          container.innerHTML = this.chatUI.generateHeaderHTML()
          console.log("头部组件已挂载")
        }
      })
    }

    // 挂载左侧栏组件
    if (window.quickChatApi?.customLeftBar) {
      window.quickChatApi.customLeftBar.mount((container: HTMLElement) => {
        if (this.chatUI) {
          this.chatUI.state.containers.leftBar = container
          container.innerHTML = this.chatUI.generateLeftBarHTML()
          console.log("左侧栏组件已挂载")
        }
      })

      // 显示左侧栏
      window.quickChatApi.customLeftBar.setIsShow(true)
    }

    // 挂载底部组件
    if (window.quickChatApi?.customFooter) {
      window.quickChatApi.customFooter.mount((container: HTMLElement) => {
        if (this.chatUI) {
          this.chatUI.state.containers.footer = container
          container.innerHTML = this.chatUI.generateFooterHTML()
          console.log("底部组件已挂载")
        }
      })
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.quickEmitter || !this.chatUI) return

    // 监听客服状态更新
    window.quickEmitter.on("chat.operator.status", (data: any) => {
      console.log("收到客服状态更新事件:", data)
      if (data && data.operatorUserIdStatus && this.chatUI) {
        this.chatUI.updateAgentStatus(data.operatorUserIdStatus)
      }
    })

    // 监听切换客服成功事件
    window.quickEmitter.on("chat.switch.operator.success", (data: any) => {
      console.log("切换客服成功:", data)
      if (data && data.operatorId && this.chatUI) {
        const switchedAgent = this.chatUI.state.customerServiceData.find(
          (agent) => agent.quickCepId === data.operatorId
        )
        if (switchedAgent) {
          this.chatUI.state.currentChatAgent = switchedAgent
          console.log(`已成功切换到客服: ${switchedAgent.employeeEnName}`)
          this.chatUI.refreshUI()
        }
      }
    })

    // 监听页面焦点事件
    window.addEventListener("focus", () => {
      console.log("页面获得焦点，刷新客服状态")
      setTimeout(() => this.fetchAgentStatus(), 500)
    })

    console.log("事件监听器已设置")
  }

  /**
   * 调整iframe宽度
   */
  private adjustIframeWidth(): void {
    if (!this.chatUI) return

    const newWidth = this.chatUI.config.originalIframeWidth + this.chatUI.config.leftBarWidth
    
    const tryAdjust = (): boolean => {
      if (typeof document === 'undefined') return false
      
      const iframe = document.getElementById("quick-chat-iframe") as HTMLIFrameElement
      if (iframe) {
        iframe.style.width = `${newWidth}px`
        iframe.style.minWidth = `${newWidth}px`
        console.log(`iframe 宽度已调整为: ${newWidth}px`)
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
      } else if (success) {
        console.log(`iframe 宽度调整成功，尝试次数: ${attempts}`)
      } else {
        console.log(`iframe 宽度调整失败，已尝试 ${attempts} 次`)
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
    }, 2000)
  }

  /**
   * 获取客服状态
   */
  private fetchAgentStatus(): void {
    if (typeof window !== 'undefined' && window.quickChatApi?.emitGetAllOperatorStatus && this.chatUI) {
      const allQuickCepIds = this.chatUI.state.customerServiceData.map(
        (agent) => agent.quickCepId
      )
      window.quickChatApi.emitGetAllOperatorStatus(allQuickCepIds)
      console.log("已请求获取所有客服状态:", allQuickCepIds)
    }
  }

  /**
   * 设置定期状态更新
   */
  private setupPeriodicStatusUpdate(): void {
    if (!this.chatUI) return

    setInterval(() => {
      this.fetchAgentStatus()
    }, this.chatUI.config.refreshInterval)
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
        console.log("=== 当前客服状态 ===")
        this.chatUI.state.customerServiceData.forEach((agent) => {
          console.log(
            `${agent.employeeEnName}: ${this.chatUI!.getStatusText(agent.status)} (${
              agent.isOnline ? "在线" : "离线"
            })`
          )
        })
        const onlineCount = this.chatUI.state.customerServiceData.filter(
          (agent) => agent.isOnline
        ).length
        console.log(
          `总计在线客服: ${onlineCount}/${this.chatUI.state.customerServiceData.length}`
        )
        console.log("==================")
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
      }
    }

    console.log("调试工具已设置到 window.debugQuickChat")
    console.log("可用命令:")
    console.log("- debugQuickChat.showAgentStatus() // 查看客服状态")
    console.log("- debugQuickChat.refreshUI() // 手动刷新UI")
    console.log("- debugQuickChat.simulateStatusUpdate('客服ID', 状态码) // 模拟状态更新")
    console.log("- debugQuickChat.testSwitchAgent('客服ID') // 测试切换客服")
    console.log("- debugQuickChat.getCurrentAgent() // 获取当前聊天客服")
    console.log("- debugQuickChat.reinitialize() // 重新初始化系统")
    console.log("- debugQuickChat.getSystemStatus() // 获取系统状态")
  }

  /**
   * 销毁聊天系统
   */
  destroy(): void {
    if (this.chatUI) {
      // 清理事件监听器
      if (typeof window !== 'undefined' && window.quickEmitter) {
        window.quickEmitter.off("chat.operator.status")
        window.quickEmitter.off("chat.switch.operator.success")
      }

      // 清理全局引用
      if (typeof window !== 'undefined') {
        delete window.chatUI
        delete window.debugQuickChat
      }

      this.chatUI = null
      this.isInitialized = false
      
      console.log("聊天系统已销毁")
    }
  }
}

export default ChatManager