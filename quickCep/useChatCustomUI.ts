// import { imFileDownloadFile } from '../../apis'
import { ChatStyles } from './useChatStyles'
import {
  CustomerServiceDataManager,
  type CustomerServiceAgent,
  type GroupedCustomerServiceData
} from './useCustomerServiceData'

const imFileDownloadFile = (fileSystemAccessId: string) =>
  `https://test-im.jlcpcb.com/api/overseas-im-platform/file/downloadFile?fileSystemAccessId=${fileSystemAccessId}`

interface UIState {
  isLeftBarExpanded: boolean
  isLeftBarManuallyHidden: boolean // 用户是否手动隐藏了左侧栏
  isLeftBarForceShown: boolean // 用户是否强制显示了左侧栏
  currentChatAgent: CustomerServiceAgent | null
  customerServiceData: CustomerServiceAgent[]
  containers: {
    header: HTMLElement | null
    leftBar: HTMLElement | null
    footer: HTMLElement | null
  }
}

interface UIConfig {
  leftBarWidth: number
  originalIframeWidth: number
  refreshInterval: number
  maxRetryAttempts: number
}

/**
 * 聊天自定义UI组件管理器
 * 提供模块化的客服聊天界面自定义功能
 */
export class ChatCustomUI {
  public state: UIState
  public config: UIConfig
  private eventHandlers: Map<string, Function>
  private onAgentStatusChangeCallback?: () => void
  private dataManager: CustomerServiceDataManager

  constructor(customerServiceData?: CustomerServiceAgent[]) {
    this.state = {
      isLeftBarExpanded: false,
      isLeftBarManuallyHidden: false,
      isLeftBarForceShown: false,
      currentChatAgent: null,
      customerServiceData: customerServiceData || [],
      containers: {
        header: null,
        leftBar: null,
        footer: null
      }
    }

    this.config = {
      leftBarWidth: 180,
      originalIframeWidth: 450,
      refreshInterval: 30000,
      maxRetryAttempts: 20
    }

    this.eventHandlers = new Map()
    this.dataManager = new CustomerServiceDataManager()

    // 如果传入了客服数据，设置到数据管理器中
    if (customerServiceData && customerServiceData.length > 0) {
      this.dataManager.setDataFromArray(customerServiceData)
      this.state.customerServiceData = customerServiceData
    } else {
      this.initDefaultCustomerServiceData()
    }
  }

  /**
   * 初始化默认客服数据（当没有传入客服数据时使用）
   */
  private initDefaultCustomerServiceData(): void {
    this.state.customerServiceData = []
  }

  /**
   * 设置客服数据
   */
  setCustomerServiceData(customerServiceData: CustomerServiceAgent[]): void {
    this.state.customerServiceData = customerServiceData
    this.dataManager.setDataFromArray(customerServiceData)
  }

  /**
   * 获取数据管理器实例
   */
  getDataManager(): CustomerServiceDataManager {
    return this.dataManager
  }

  /**
   * 获取按业务线分组的数据
   */
  getGroupedData(): GroupedCustomerServiceData {
    return this.dataManager.getGroupedData()
  }

  /**
   * 工具函数：根据状态码判断是否在线
   */
  isAgentOnline(status: number): boolean {
    return status === 2 // 只有空闲状态才算在线，忙碌状态算离线
  }

  /**
   * 检查是否有客服在线
   */
  hasOnlineAgents(): boolean {
    return this.state.customerServiceData.some((agent) => agent.isOnline)
  }

  /**
   * 设置客服状态变化回调
   */
  setOnAgentStatusChangeCallback(callback: () => void): void {
    this.onAgentStatusChangeCallback = callback
  }

  /**
   * 判断是否应该显示左侧栏
   * 根据复杂的业务规则来决定
   */
  shouldShowLeftBar(): boolean {
    const onlineAgents = this.state.customerServiceData.filter((agent) => agent.isOnline)
    const onlineCount = onlineAgents.length

    // 如果用户手动隐藏了左侧栏，则不显示
    if (this.state.isLeftBarManuallyHidden) {
      return false
    }

    // 如果没有在线客服，不显示左侧栏
    if (onlineCount === 0) {
      return false
    }

    // 如果用户强制显示了左侧栏，则显示
    if (this.state.isLeftBarForceShown) {
      return true
    }

    // 只要有在线客服，不管是否选中过，都显示左侧自定义区域
    return onlineCount > 0
  }

  /**
   * 判断是否应该在头部显示在线客服
   */
  shouldShowHeaderAgents(): boolean {
    // 如果左侧栏正在显示，不显示头部客服
    if (this.shouldShowLeftBar()) {
      return false
    }

    const onlineAgents = this.state.customerServiceData.filter((agent) => agent.isOnline)
    const onlineCount = onlineAgents.length
    const hasCurrentAgent = !!this.state.currentChatAgent

    // 如果没有在线客服，不显示头部客服
    if (onlineCount === 0) {
      return false
    }

    // 如果有在线客服且左侧栏不显示，则显示头部客服
    return true
  }

  /**
   * 获取可选择的客服数量（排除当前选中的客服）
   */
  getAvailableAgentsCount(): number {
    const onlineAgents = this.state.customerServiceData.filter((agent) => agent.isOnline)
    if (!this.state.currentChatAgent) {
      return onlineAgents.length
    }
    // 排除当前选中的客服
    return onlineAgents.filter((agent) => agent.quickCepId !== this.state.currentChatAgent!.quickCepId).length
  }

  /**
   * 判断是否应该显示打开左侧区域的图标
   * 只要有客服在线且左侧不显示的情况就需要显示这个图标
   */
  shouldShowOpenLeftBarIcon(): boolean {
    const hasOnline = this.hasOnlineAgents()
    const shouldShowLeft = this.shouldShowLeftBar()

    // 如果没有在线客服，不显示图标
    if (!hasOnline) {
      return false
    }

    // 如果左侧栏已经显示，不需要显示打开图标
    if (shouldShowLeft) {
      return false
    }

    // 只要有客服在线且左侧栏不显示，就显示打开图标
    // 包括只有一个客服在线且该客服已被选中的情况
    return true
  }

  /**
   * 保存选择的客服到本地存储
   */
  private saveSelectedAgent(agent: CustomerServiceAgent | null): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const storageKey = 'quickchat_selected_agent'
        if (agent) {
          const agentData = {
            quickCepId: agent.quickCepId,
            employeeEnName: agent.employeeEnName,
            timestamp: Date.now()
          }
          localStorage.setItem(storageKey, JSON.stringify(agentData))
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch (error) {
      console.warn('保存客服选择到本地存储失败:', error)
    }
  }

  /**
   * 从本地存储获取之前选择的客服
   */
  private getStoredSelectedAgent(): {
    quickCepId: string
    employeeEnName: string
    timestamp: number
  } | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const storageKey = 'quickchat_selected_agent'
        const storedData = localStorage.getItem(storageKey)
        if (storedData) {
          const agentData = JSON.parse(storedData)
          // 检查数据是否在24小时内（可选的过期机制）
          const maxAge = 24 * 60 * 60 * 1000 // 24小时
          if (Date.now() - agentData.timestamp < maxAge) {
            return agentData
          } else {
            // 数据过期，清除
            localStorage.removeItem(storageKey)
          }
        }
      }
    } catch (error) {
      console.warn('从本地存储获取客服选择失败:', error)
    }
    return null
  }

  /**
   * 尝试恢复之前选择的客服
   * 如果该客服仍在线，则自动切换到该客服
   */
  restorePreviousSelectedAgent(): void {
    const storedAgent = this.getStoredSelectedAgent()
    if (!storedAgent) {
      return
    }

    // 查找该客服是否存在且在线
    const agent = this.state.customerServiceData.find((a) => a.quickCepId === storedAgent.quickCepId)

    if (!agent) {
      this.saveSelectedAgent(null) // 清除无效的存储
      return
    }

    if (!agent.isOnline) {
      return
    }

    // 如果客服在线，自动切换到该客服
    this.selectAgent(storedAgent.quickCepId, false) // false 表示不是用户主动选择，避免重复保存
  }

  /**
   * 工具函数：获取状态颜色
   */
  getStatusColor(status: number): string {
    const colors: Record<number, string> = {
      2: '#48DE8C', // 在线空闲 - 绿色
      3: '#ffc107' // 在线忙碌 - 黄色
    }
    return colors[status] || '#d8d8d8' // 离线 - 灰色
  }

  /**
   * 工具函数：获取状态文本
   */
  getStatusText(status: number): string {
    const texts: Record<number, string> = {
      2: '在线空闲',
      3: '在线忙碌'
    }
    return texts[status] || '离线'
  }

  /**
   * 工具函数：获取头像URL
   */
  getAvatarUrl(imageFileIndexId: string): string {
    const imgUrl = imFileDownloadFile(imageFileIndexId)
    return imgUrl
  }

  /**
   * 工具函数：截断文本
   */
  truncateText(text: string, maxLength: number): string {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  /**
   * 工具函数：按业务线分组客服
   */
  groupByBusinessLine(agents: CustomerServiceAgent[]): Record<string, CustomerServiceAgent[]> {
    return agents.reduce((grouped, agent) => {
      if (!grouped[agent.businessLine]) {
        grouped[agent.businessLine] = []
      }
      grouped[agent.businessLine].push(agent)
      return grouped
    }, {} as Record<string, CustomerServiceAgent[]>)
  }

  /**
   * 更新客服状态
   */
  updateAgentStatus(operatorUserIdStatus: Record<string, number>): void {
    let hasStatusChanged = false
    let currentAgentWentOffline = false

    this.state.customerServiceData.forEach((agent, index) => {
      if (operatorUserIdStatus.hasOwnProperty(agent.quickCepId)) {
        const newStatus = operatorUserIdStatus[agent.quickCepId]
        const oldStatus = agent.status
        const oldOnlineStatus = agent.isOnline
        const newOnlineStatus = this.isAgentOnline(newStatus)

        // 只有当状态真正发生变化时才更新
        if (oldStatus !== newStatus || oldOnlineStatus !== newOnlineStatus) {
          agent.status = newStatus
          agent.isOnline = newOnlineStatus
          hasStatusChanged = true

          // 检查当前选中的客服是否离线了
          if (
            this.state.currentChatAgent &&
            this.state.currentChatAgent.quickCepId === agent.quickCepId &&
            !newOnlineStatus
          ) {
            currentAgentWentOffline = true
          }
        }
      }
    })

    // 如果当前客服离线了，清除当前客服状态
    if (currentAgentWentOffline) {
      this.state.currentChatAgent = null
    }

    // 如果客服状态发生变化，只在特定情况下重置手动控制状态
    if (hasStatusChanged) {
      // 只有当所有客服都离线时，才重置手动控制状态
      const hasAnyOnlineAgents = this.state.customerServiceData.some((agent) => agent.isOnline)
      if (!hasAnyOnlineAgents) {
        this.state.isLeftBarManuallyHidden = false
        this.state.isLeftBarForceShown = false
      }
    }

    // 只有当状态真正发生变化时才更新UI
    if (hasStatusChanged) {
      this.refreshUI()
      this.emitCustomEvent('agentStatusUpdated', {
        updatedAgents: this.state.customerServiceData,
        changedStatuses: operatorUserIdStatus,
        currentAgentWentOffline
      })
    }
  }

  /**
   * 检查当前客服状态，如果离线则自动恢复为默认状态
   */
  checkCurrentAgentStatus(): boolean {
    if (!this.state.currentChatAgent) {
      return false // 没有当前客服，无需检查
    }

    // 从最新的客服数据中找到当前客服
    const currentAgent = this.state.customerServiceData.find(
      (agent) => agent.quickCepId === this.state.currentChatAgent!.quickCepId
    )

    if (!currentAgent || !currentAgent.isOnline) {
      this.state.currentChatAgent = null

      // 清除本地存储的客服选择
      this.saveSelectedAgent(null)

      this.refreshUI()

      // 发射客服离线事件
      this.emitCustomEvent('currentAgentWentOffline', {
        previousAgent: currentAgent || this.state.currentChatAgent,
        timestamp: new Date().toISOString()
      })

      return true // 返回true表示当前客服已离线并被清除
    }

    return false // 返回false表示当前客服仍在线
  }

  /**
   * 发射自定义事件
   */
  private emitCustomEvent(eventName: string, detail: any): void {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(eventName, { detail }))
    }
  }

  /**
   * 选择客服
   * @param quickCepId 客服ID
   * @param saveToStorage 是否保存到本地存储，默认为true
   */
  selectAgent(quickCepId: string, saveToStorage = true): void {
    const agent = this.state.customerServiceData.find((a) => a.quickCepId === quickCepId)

    if (!agent) {
      console.error(`未找到客服 ID: ${quickCepId}`)
      return
    }

    if (!agent.isOnline) {
      return
    }

    if (this.state.currentChatAgent && this.state.currentChatAgent.quickCepId === quickCepId) {
      return
    }

    // 先立即更新本地状态，确保UI能够响应
    const previousAgent = this.state.currentChatAgent
    this.state.currentChatAgent = agent

    // 保存到本地存储（如果需要）
    if (saveToStorage) {
      this.saveSelectedAgent(agent)
    }

    this.refreshUI()

    if (typeof window !== 'undefined' && (window as any).quickChatApi && (window as any).quickChatApi.switchChat) {
      try {
        console.log('切换座席', quickCepId)
          ; (window as any).quickChatApi.switchChat(quickCepId)
      } catch (error) {
        console.error('切换客服失败:', error)
        // 如果API调用失败，恢复之前的状态
        this.state.currentChatAgent = previousAgent
        if (saveToStorage) {
          this.saveSelectedAgent(previousAgent)
        }
        this.refreshUI()
      }
    } else {
      console.error('quickChatApi.switchChat 方法不可用')
      // 如果API不可用，也恢复之前的状态
      this.state.currentChatAgent = previousAgent
      if (saveToStorage) {
        this.saveSelectedAgent(previousAgent)
      }
      this.refreshUI()
    }
  }

  /**
   * 切换左侧栏显示/隐藏
   * 当点击左侧 .expand-icon 或头部 .open-leftbar-icon 时调用
   */
  toggleLeftBar(): void {
    const currentlyShowingLeftBar = this.shouldShowLeftBar()

    if (currentlyShowingLeftBar) {
      // 当前左侧栏显示，点击后隐藏
      this.state.isLeftBarManuallyHidden = true
      this.state.isLeftBarForceShown = false
    } else {
      // 当前左侧栏不显示，点击后强制显示
      // 由于 .open-leftbar-icon 显示的前提是有在线客服，所以直接显示即可
      this.state.isLeftBarManuallyHidden = false
      this.state.isLeftBarForceShown = true
    }

    // 通知管理器更新左侧栏可见性
    if (this.onAgentStatusChangeCallback) {
      this.onAgentStatusChangeCallback()
    }

    this.refreshUI()
  }

  /**
   * 强制刷新UI（用于调试）
   */
  forceRefreshUI(): void {
    this.refreshUI()
  }

  /**
   * 刷新UI
   */
  refreshUI(): void {
    // 在刷新UI之前，检查当前客服是否仍在线
    this.checkCurrentAgentStatus()

    // 更新头部
    if (this.state.containers.header) {
      this.state.containers.header.innerHTML = this.generateHeaderHTML()
    }

    // 更新左侧栏
    if (this.state.containers.leftBar) {
      this.state.containers.leftBar.innerHTML = this.generateLeftBarHTML()
    }

    // 确保左侧父元素的z-index设置正确
    this.setLeftBarParentZIndex()

    // 通知管理器更新左侧栏可见性
    if (this.onAgentStatusChangeCallback) {
      this.onAgentStatusChangeCallback()
    }
  }

  /**
   * 生成初始头部HTML（只包含 .current-agent）
   */
  generateInitialHeaderHTML(): string {
    return `
      ${ChatStyles.generateHeaderStyles()}
      <div class="chat-header">
        <div class="chat-header-agents">
          ${this.renderCurrentAgent()}
        </div>
      </div>
      <div id="agent-tooltip" class="agent-tooltip"></div>
    `
  }

  /**
   * 生成完整头部HTML
   */
  generateHeaderHTML(): string {
    const onlineAgents = this.state.customerServiceData.filter((agent) => agent.isOnline)
    // 如果有当前客服，从在线客服列表中排除它
    const availableAgents = onlineAgents.filter(
      (agent) => !this.state.currentChatAgent || agent.quickCepId !== this.state.currentChatAgent.quickCepId
    )

    const shouldShowHeaderAgents = this.shouldShowHeaderAgents()
    const shouldShowOpenIcon = this.shouldShowOpenLeftBarIcon()
    const availableCount = this.getAvailableAgentsCount()

    // 根据显示规则决定显示的客服数量
    const displayAgents = shouldShowHeaderAgents ? availableAgents.slice(0, 3) : []

    // 决定是否显示更多客服指示器
    const shouldShowMoreIndicator = shouldShowHeaderAgents && availableCount > 3

    return `
      ${ChatStyles.generateHeaderStyles()}
      <div class="chat-header">
        <div class="chat-header-agents">
          ${this.renderCurrentAgent()}
          ${shouldShowHeaderAgents ? this.renderOnlineAgents(displayAgents) : ''}
          ${shouldShowMoreIndicator ? this.renderMoreAgentsIndicator(availableCount) : ''}
          ${shouldShowOpenIcon ? this.renderOpenLeftBarIcon() : ''}
          ${onlineAgents.length === 0 && !this.state.currentChatAgent
        ? `<div class="no-agents"></div>` // 暂无客服在线
        : ''
      }
        </div>
      </div>
      <div id="agent-tooltip" class="agent-tooltip"></div>
    `
  }

  /**
   * 渲染当前聊天客服
   */
  private renderCurrentAgent(): string {
    // 当未选择客服时，显示默认头像和JLCONE名称
    if (!this.state.currentChatAgent) {
      return `
        <div class="current-agent default" title="当前客服: JLCONE">
          <div class="agent-avatar-wrapper">
            <svg t="1758729790429" class="default-avatar" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
              <path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="#2B8CED"></path>
              <path d="M699.120941 570.819765l167.032471 0.180706c-4.216471 11.836235-22.768941 37.225412-29.876706 46.019764-4.517647 5.632-21.564235 26.202353-26.624 30.780236-4.035765 3.674353-5.872941 5.632-9.276235 9.005176-16.805647 16.594824-21.684706 20.660706-40.146824 35.538824-70.776471 57.133176-166.580706 94.147765-265.667765 109.989647-49.392941 7.890824-88.485647 9.336471-138.450823 1.415529-42.285176-6.686118-81.016471-18.401882-114.56753-35.84-35.177412-18.251294-60.988235-40.96-81.438117-69.059765-18.642824-25.630118-37.797647-71.168-38.701177-112.399058a9.035294 9.035294 0 0 1 0.451765 0.602352l0.210824 0.301177 0.240941 0.301176 0.391529 0.602353 7.951059 17.408c5.029647 9.607529 10.450824 18.612706 16.655059 27.105883l4.818823 6.26447 12.559059 14.366118c61.319529 67.463529 157.696 79.841882 250.669177 69.722353 64.843294-7.047529 112.64-22.226824 168.779294-49.483294 37.647059-18.311529 78.275765-52.856471 103.303529-87.130353 2.258824-3.072 9.035294-14.064941 11.715765-15.691294z m-69.059765-228.141177a5872.64 5872.64 0 0 1-13.372235 65.295059c-6.987294 33.611294-14.817882 71.408941-18.763294 91.648l-0.662588 3.373177-0.542118 2.831058 20.389647 0.090353c22.528 0.120471 47.224471 0.240941 67.764706 0.301177h8.553412l-10.24 50.597647-4.156235 0.030117-121.193412 0.180706h-22.799059l36.743529-181.278117 0.843295-4.276706 5.842823-28.822588h4.517647c12.077176 0.030118 37.496471 0.090353 47.073882 0z m-329.095529-0.963764l-30.027294 145.227294c-9.035294 43.791059-41.984 69.963294-88.094118 69.963294-23.009882 0-40.809412-6.927059-51.501176-20.088471-9.637647-11.866353-12.890353-27.768471-9.637647-47.254588l0.783059-4.216471 2.499764-12.077176h50.898824l-2.56 12.348235c-1.746824 8.854588-0.873412 15.721412 2.499765 19.787294 2.800941 3.433412 7.529412 5.180235 13.974588 5.180236 15.149176 0 26.142118-9.246118 30.509176-25.47953l0.752941-3.132235 29.033412-140.257882h50.868706zM922.804706 398.757647c0.481882 2.469647 0.602353 8.402824 0.602353 11.745882v2.379295l-49.513412-0.301177-1.054118-2.800941c-6.866824-17.468235-18.913882-24.967529-39.062588-24.184471a56.32 56.32 0 0 0-39.54447 17.618824c-10.962824 11.504941-18.462118 28.310588-21.684706 48.489412-3.102118 19.636706-0.843294 35.84 6.535529 46.953411 7.107765 10.691765 18.672941 16.143059 33.641412 15.661177 19.124706-0.542118 36.472471-11.083294 47.284706-26.714353l2.108235-3.192471 0.752941-1.264941 48.730353 0.120471c-2.800941 8.071529-6.354824 15.962353-11.143529 23.04-21.022118 30.960941-53.850353 48.579765-93.967059 50.055529a185.163294 185.163294 0 0 1-5.12 0.090353c-69.270588 0-85.744941-52.675765-77.793882-102.942118 4.668235-29.394824 16.685176-55.055059 34.816-74.24 20.901647-22.136471 49.302588-34.484706 82.070588-35.659294 44.483765-1.505882 75.625412 18.974118 82.341647 55.115294z m-380.355765 6.234353c4.216471 48.128-31.081412 90.955294-75.354353 96.376471-35.689412 4.336941-36.864-15.721412-39.002353-18.371765-8.583529 5.933176-11.715765 9.517176-23.732706 13.643294-10.119529 3.433412-22.196706 4.156235-32.105411-0.060235-40.267294-17.136941 0.843294-94.991059 54.934588-97.641412 18.070588-0.873412 22.648471 4.638118 24.816941 9.035294l0.391529 0.783059 4.216471-7.800471h25.660235s-28.431059 59.151059-28.551529 69.692236c-0.210824 16.775529 25.690353 8.673882 33.430588 3.794823 32.647529-20.48 41.562353-76.016941 10.11953-99.026823-50.356706-36.743529-169.020235 3.644235-176.670118 94.629647-4.216471 50.416941 42.736941 68.065882 84.570353 64.391529 18.823529-1.656471 24.154353-5.150118 36.502588-8.914823l3.252706-0.963765 4.517647 18.492235c-9.035294 5.903059-34.032941 11.113412-46.863059 12.137412-106.465882 8.613647-139.956706-71.589647-81.829647-150.768941 58.127059-79.209412 213.835294-89.118118 221.696 0.542117zM421.376 421.647059c-21.684706 5.421176-38.339765 33.882353-33.792 48.459294 4.336941 13.854118 25.328941 8.041412 36.623059-3.252706 3.463529-3.493647 16.655059-36.743529 16.444235-38.068706-1.024-6.384941-11.113412-9.185882-19.275294-7.137882z m353.581176-189.83153c25.690353 13.462588 53.790118 33.340235 73.788236 54.061177 9.035294 9.276235 26.624 29.214118 32.316235 40.508235l1.084235 2.409412-169.381647-0.090353c-1.746824-4.758588-10.932706-16.685176-14.155294-20.510118a167.122824 167.122824 0 0 0-58.910117-45.447529c-88.485647-40.568471-204.197647-19.576471-293.978353 9.758118-15.811765 5.180235-39.664941 14.848-50.898824 18.281411 10.420706-5.180235 21.985882-11.956706 33.370353-17.468235 35.297882-17.167059 70.083765-32.406588 107.821176-45.236706 52.495059-17.859765 110.320941-31.472941 170.947765-32.768 61.861647-1.325176 121.072941 11.866353 167.996235 36.502588z" fill="#FFFFFF"></path>
            </svg>
          </div>
          <div class="agent-name-display">JLCONE</div>
        </div>
      `
    }

    // 当选择了客服时，显示选中客服的头像和名称
    const agent =
      this.state.customerServiceData.find((a) => a.quickCepId === this.state.currentChatAgent!.quickCepId) ||
      this.state.currentChatAgent

    return `
      <div class="current-agent selected" title="当前沟通: ${agent.employeeEnName}">
        <div class="agent-avatar-wrapper">
          <img src="${this.getAvatarUrl(agent.imageFileIndexId)}"
               class="agent-avatar current"
               style="border-color: ${agent.isOnline ? '#007bff' : '#d8d8d8'};"
               onerror="this.src='${this.getDefaultAvatar(36)}'">
          <div class="status-indicator" style="background: ${this.getStatusColor(agent.status)};"></div>
        </div>
        <div class="agent-name-display">${agent.employeeEnName}</div>
      </div>
    `
  }

  /**
   * 渲染在线客服
   */
  private renderOnlineAgents(displayAgents: CustomerServiceAgent[]): string {
    return displayAgents
      .filter((agent) => !this.state.currentChatAgent || agent.quickCepId !== this.state.currentChatAgent.quickCepId)
      .map(
        (agent) => `
        <div class="online-agent"
             onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).selectAgent('${agent.quickCepId
          }')"
             onmouseover="try { (window.chatUI || window.parent.chatUI).showTooltip(event, '${agent.employeeEnName
          }', '${agent.roleNameEn}', '${this.getAvatarUrl(
            agent.imageFileIndexId
          )}'); } catch(e) { console.error('Tooltip error:', e); }"
             onmouseout="try { (window.chatUI || window.parent.chatUI).hideTooltip(); } catch(e) { console.error('Hide tooltip error:', e); }"
             title="${agent.employeeEnName} - ${agent.roleNameEn}">
          <img src="${this.getAvatarUrl(agent.imageFileIndexId)}"
               class="agent-avatar online"
               onerror="this.src='${this.getDefaultAvatar(28)}'">
          <div class="status-indicator" style="background: ${this.getStatusColor(agent.status)};"></div>
        </div>
      `
      )
      .join('')
  }

  /**
   * 渲染更多客服指示器
   */
  private renderMoreAgentsIndicator(availableCount: number): string {
    const displayCount = availableCount - 3
    return `
      <div class="more-agents"
           onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).toggleLeftBar()"
           title="查看更多客服 (${availableCount}个可选择)">
        +${displayCount}
      </div>
    `
  }

  /**
   * 渲染打开左侧区域的图标
   */
  private renderOpenLeftBarIcon(): string {
    return `
      <div class="open-leftbar-icon"
           onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).toggleLeftBar()"
           title="打开客服列表">
        <svg t="1758522231178" class="expand-icon-reverse" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15573" width="20" height="20">
              <path d="M636.501333 383.658667a37.973333 37.973333 0 0 1 41.898667 62.762666l-3.157333 2.304-99.925334 66.645334 103.210667 86.016a37.930667 37.930667 0 1 1-48.554667 58.24l-142.250666-118.485334a37.973333 37.973333 0 0 1 3.242666-60.714666L633.173333 385.706667l3.328-2.005334zM308.181333 891.306667V156.416a37.930667 37.930667 0 1 1 75.818667 0v734.805333a37.930667 37.930667 0 0 1-75.818667 0z" fill="#999" p-id="15574"></path>
              <path d="M749.056 862.848V938.666667H274.986667v-75.818667h474.026666z m113.792-113.792V274.944a113.792 113.792 0 0 0-113.792-113.792H274.986667a113.792 113.792 0 0 0-113.792 113.792v474.112a113.792 113.792 0 0 0 113.792 113.792V938.666667l-9.770667-0.256a189.653333 189.653333 0 0 1-179.626667-179.626667L85.333333 749.056V274.944a189.653333 189.653333 0 0 1 179.882667-189.354667L274.986667 85.333333h474.026666l9.813334 0.256A189.610667 189.610667 0 0 1 938.666667 274.944v474.112l-0.256 9.728a189.653333 189.653333 0 0 1-179.626667 179.626667l-9.728 0.256v-75.818667a113.834667 113.834667 0 0 0 113.792-113.792z" fill="#999" p-id="15575"></path>
        </svg>
      </div>
    `
  }

  /**
   * 生成左侧栏HTML
   */
  generateLeftBarHTML(): string {
    const groupedAgents = this.groupByBusinessLine(this.state.customerServiceData)

    return `
      ${ChatStyles.generateLeftBarStyles()}
      <div class="left-bar">
        <div class="left-bar-content">
          ${Object.entries(groupedAgents)
        .map(([businessLine, agents]) => this.renderBusinessLineGroup(businessLine, agents))
        .join('')}
        </div>
        <div class="left-bar-footer">
            <svg onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).toggleLeftBar()" t="1758522231178" class="expand-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15573" width="20" height="20">
              <path d="M636.501333 383.658667a37.973333 37.973333 0 0 1 41.898667 62.762666l-3.157333 2.304-99.925334 66.645334 103.210667 86.016a37.930667 37.930667 0 1 1-48.554667 58.24l-142.250666-118.485334a37.973333 37.973333 0 0 1 3.242666-60.714666L633.173333 385.706667l3.328-2.005334zM308.181333 891.306667V156.416a37.930667 37.930667 0 1 1 75.818667 0v734.805333a37.930667 37.930667 0 0 1-75.818667 0z" fill="#999" p-id="15574"></path>
              <path d="M749.056 862.848V938.666667H274.986667v-75.818667h474.026666z m113.792-113.792V274.944a113.792 113.792 0 0 0-113.792-113.792H274.986667a113.792 113.792 0 0 0-113.792 113.792v474.112a113.792 113.792 0 0 0 113.792 113.792V938.666667l-9.770667-0.256a189.653333 189.653333 0 0 1-179.626667-179.626667L85.333333 749.056V274.944a189.653333 189.653333 0 0 1 179.882667-189.354667L274.986667 85.333333h474.026666l9.813334 0.256A189.610667 189.610667 0 0 1 938.666667 274.944v474.112l-0.256 9.728a189.653333 189.653333 0 0 1-179.626667 179.626667l-9.728 0.256v-75.818667a113.834667 113.834667 0 0 0 113.792-113.792z" fill="#999" p-id="15575"></path>
            </svg>
        </div>
      </div>
      <div id="full-agent-tooltip" class="full-agent-tooltip"></div>
    `
  }

  /**
   * 渲染业务线分组
   */
  private renderBusinessLineGroup(businessLine: string, agents: CustomerServiceAgent[]): string {
    return `
      <div class="business-line-group">
        <div class="business-line-title">${businessLine}</div>
        <div class="agents-list">
          ${agents.map((agent) => this.renderAgentItem(agent)).join('')}
        </div>
      </div>
    `
  }

  /**
   * 渲染客服项目
   */
  private renderAgentItem(agent: CustomerServiceAgent): string {
    const isOnline = agent.isOnline
    const isCurrentChat = this.state.currentChatAgent && this.state.currentChatAgent.quickCepId === agent.quickCepId
    const canClick = isOnline

    return `
      <div class="agent-item ${isCurrentChat ? 'current' : ''} ${isOnline ? 'online' : 'offline'}"
           ${canClick
        ? `onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).selectAgent('${agent.quickCepId}')"`
        : ''
      }
           onmouseover="try { (window.chatUI || window.parent.chatUI).showFullTooltip(event, '${agent.employeeEnName
      }', '${agent.roleNameEn}', '${this.getAvatarUrl(
        agent.imageFileIndexId
      )}'); } catch(e) { console.error('Full tooltip error:', e); }"
           onmouseout="try { (window.chatUI || window.parent.chatUI).hideFullTooltip(); } catch(e) { console.error('Hide full tooltip error:', e); }">

        <div class="agent-avatar-container">
          <img src="${this.getAvatarUrl(agent.imageFileIndexId)}"
               class="agent-avatar"
               onerror="this.src='${this.getDefaultAvatar(32)}'">
          <div class="status-indicator" style="background: ${this.getStatusColor(agent.status)};"></div>
        </div>

        <div class="agent-info">
          <div class="agent-name">${this.truncateText(agent.employeeEnName, 8)}</div>
          <div class="agent-role">${this.truncateText(agent.roleNameEn, 12)}</div>
        </div>

        ${isCurrentChat ? '<div class="current-indicator">●</div>' : ''}
      </div>
    `
  }

  /**
   * 生成底部HTML
   */
  generateFooterHTML(): string {
    return `
      ${ChatStyles.generateFooterStyles()}
      <div class="chat-footer">
        <div class="footer-actions">
          <button class="footer-btn add-btn" title="添加">
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="currentColor">
              <path d="M10.3877 18.6939C5.69893 18.6939 1.89792 14.8929 1.89792 10.2041C1.89792 5.51534 5.69893 1.71433 10.3877 1.71433C15.0765 1.71433 18.8775 5.51534 18.8775 10.2041C18.8775 14.8929 15.0765 18.6939 10.3877 18.6939ZM10.3877 20C15.7978 20 20.1836 15.6143 20.1836 10.2041C20.1836 4.79398 15.7978 0.408203 10.3877 0.408203C4.97758 0.408203 0.591797 4.79398 0.591797 10.2041C0.591797 15.6143 4.97758 20 10.3877 20Z" fill="currentColor"/>
              <path d="M10.3877 5.30616C9.93687 5.30616 9.57139 5.67164 9.57139 6.12249V9.38779H6.30608C5.85524 9.38779 5.48976 9.75328 5.48976 10.2041C5.48976 10.655 5.85524 11.0204 6.30608 11.0204H9.57139V14.2858C9.57139 14.7366 9.93687 15.1021 10.3877 15.1021C10.8386 15.1021 11.204 14.7366 11.204 14.2858V11.0204H14.4693C14.9202 11.0204 15.2857 10.655 15.2857 10.2041C15.2857 9.75328 14.9202 9.38779 14.4693 9.38779H11.204V6.12249C11.204 5.67164 10.8386 5.30616 10.3877 5.30616Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    `
  }

  /**
   * 获取默认头像
   */
  private getDefaultAvatar(size: number): string {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#e9ecef"/>
        <path d="M${size / 2} ${size * 0.625}C${size * 0.375} ${size * 0.625} ${size * 0.3125} ${size * 0.46875} ${size * 0.3125
      } ${size * 0.4375}S${size * 0.375} ${size * 0.25} ${size / 2} ${size * 0.25}S${size * 0.6875} ${size * 0.3125} ${size * 0.6875
      } ${size * 0.4375}S${size * 0.625} ${size * 0.625} ${size / 2} ${size * 0.625}ZM${size / 2} ${size * 0.75}C${size * 0.65625
      } ${size * 0.75} ${size * 0.75} ${size * 0.65625} ${size * 0.75} ${size * 0.5}S${size * 0.65625} ${size * 0.25} ${size / 2
      } ${size * 0.25}S${size * 0.25} ${size * 0.34375} ${size * 0.25} ${size * 0.5}S${size * 0.34375} ${size * 0.75} ${size / 2
      } ${size * 0.75}Z" fill="#d8d8d8"/>
      </svg>
    `)}`
  }

  // 事件处理方法
  showTooltip(event: MouseEvent, name: string, role: string, avatarUrl?: string): void {
    const currentDoc = this.getCurrentDocument()
    let tooltip = currentDoc.getElementById('agent-tooltip')

    if (!tooltip) {
      tooltip = this.createTooltipElement(currentDoc, 'agent-tooltip', 'agent-tooltip')
    }

    if (tooltip) {
      // 创建带头像的 tooltip 内容
      const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; margin-right: 8px; border: 1px solid rgba(255,255,255,0.2);" onerror="this.src='${this.getDefaultAvatar(
          24
        )}'">`
        : ''

      tooltip.innerHTML = `
        <div style="display: flex; align-items: center;">
          ${avatarHtml}
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
            <div style="opacity: 0.9; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${role}</div>
          </div>
        </div>
      `

      // 简化定位逻辑，确保 tooltip 可见
      tooltip.style.position = 'absolute'
      tooltip.style.display = 'block'
      tooltip.style.zIndex = '99999'
      tooltip.style.left = event.clientX + 12 + 'px'
      tooltip.style.top = event.clientY - 50 + 'px'
    } else {
      console.error('无法创建或找到 tooltip 元素')
    }
  }

  hideTooltip(): void {
    const currentDoc = this.getCurrentDocument()
    const tooltip = currentDoc.getElementById('agent-tooltip')
    if (tooltip) tooltip.style.display = 'none'
  }

  showFullTooltip(event: MouseEvent, name: string, role: string, avatarUrl?: string): void {
    const currentDoc = this.getCurrentDocument()
    let tooltip = currentDoc.getElementById('full-agent-tooltip')

    if (!tooltip) {
      tooltip = this.createTooltipElement(currentDoc, 'full-agent-tooltip', 'full-agent-tooltip')
    }

    if (tooltip) {
      // 创建带头像的 tooltip 内容
      const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; margin-right: 10px; border: 1px solid rgba(255,255,255,0.2);" onerror="this.src='${this.getDefaultAvatar(
          32
        )}'">`
        : ''

      tooltip.innerHTML = `
        <div style="display: flex; align-items: center;">
          ${avatarHtml}
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; margin-bottom: 6px; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${name}</div>
            <div style="opacity: 0.9; font-size: 12px; color: rgba(255, 255, 255, 0.8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${role}</div>
          </div>
        </div>
      `

      // 简化定位逻辑，确保 tooltip 可见
      tooltip.style.position = 'absolute'
      tooltip.style.display = 'block'
      tooltip.style.zIndex = '99999'
      tooltip.style.left = event.clientX + 15 + 'px'
      tooltip.style.top = event.clientY - 60 + 'px'
    }
  }

  hideFullTooltip(): void {
    const currentDoc = this.getCurrentDocument()
    const tooltip = currentDoc.getElementById('full-agent-tooltip')
    if (tooltip) tooltip.style.display = 'none'
  }

  /**
   * 获取当前文档上下文，支持iframe环境
   */
  private getCurrentDocument(): Document {
    if (typeof document === 'undefined') {
      throw new TypeError('Document is not available')
    }

    // 如果容器存在，使用容器所在的文档
    if (this.state.containers.header && this.state.containers.header.ownerDocument) {
      return this.state.containers.header.ownerDocument
    }
    if (this.state.containers.leftBar && this.state.containers.leftBar.ownerDocument) {
      return this.state.containers.leftBar.ownerDocument
    }

    // 尝试获取iframe内的文档
    try {
      const iframe = document.getElementById('quick-chat-iframe') as HTMLIFrameElement
      if (iframe && iframe.contentDocument) {
        return iframe.contentDocument
      }
      // 如果在iframe内部运行，直接使用当前文档
      if (
        typeof window !== 'undefined' &&
        window.frameElement &&
        (window.frameElement as HTMLElement).id === 'quick-chat-iframe'
      ) {
        return document
      }
    } catch (error) {
      console.warn('无法访问iframe文档:', error)
    }

    // 否则使用当前文档
    return document
  }

  /**
   * 设置容器引用，支持iframe环境
   */
  setContainers(
    headerSelector?: string | HTMLElement,
    leftBarSelector?: string | HTMLElement,
    footerSelector?: string | HTMLElement
  ): void {
    const currentDoc = this.getCurrentDocument()

    if (headerSelector) {
      this.state.containers.header =
        typeof headerSelector === 'string' ? currentDoc.querySelector(headerSelector) : headerSelector
    }

    if (leftBarSelector) {
      this.state.containers.leftBar =
        typeof leftBarSelector === 'string' ? currentDoc.querySelector(leftBarSelector) : leftBarSelector
    }

    if (footerSelector) {
      this.state.containers.footer =
        typeof footerSelector === 'string' ? currentDoc.querySelector(footerSelector) : footerSelector
    }

    // 设置左侧父元素的z-index
    this.setLeftBarParentZIndex()
  }

  /**
   * 设置左侧父元素的z-index、box-shadow和背景样式
   */
  setLeftBarParentZIndex(): void {
    try {
      const currentDoc = this.getCurrentDocument()
      const leftBarParent = currentDoc.getElementById('DIY-LEFT-BAR')

      if (leftBarParent) {
        // 设置z-index
        leftBarParent.style.zIndex = '999'

        // 设置box-shadow，向左扩散
        leftBarParent.style.boxShadow = '-8px 0 22px rgba(0, 18, 46, 0.16)'

        // 设置白色背景
        leftBarParent.style.background = 'white'
      }
    } catch (error) {
      console.error('设置左侧父元素样式时出错:', error)
    }
  }

  /**
   * 针对 iframe 环境的 tooltip 定位方法
   */
  private positionTooltipInIframe(
    tooltip: HTMLElement,
    event: MouseEvent,
    doc: Document,
    offsetX = 12,
    offsetY = -50
  ): void {
    // 获取 iframe 的边界信息
    const isInIframe = window.frameElement !== null

    if (isInIframe) {
      // 在 iframe 内部，使用相对于 iframe 的坐标
      const iframeRect = (event.target as HTMLElement).getBoundingClientRect()
      const viewportWidth = doc.documentElement.clientWidth
      const viewportHeight = doc.documentElement.clientHeight

      // 先设置内容以获取尺寸
      tooltip.style.position = 'absolute'
      tooltip.style.visibility = 'hidden'
      tooltip.style.display = 'block'

      const tooltipRect = tooltip.getBoundingClientRect()

      let left = event.clientX + offsetX
      let top = event.clientY + offsetY

      // 边界检测和调整
      if (left + tooltipRect.width > viewportWidth) {
        left = event.clientX - tooltipRect.width - Math.abs(offsetX)
      }

      if (left < 0) {
        left = 10
      }

      if (top < 0) {
        top = event.clientY + 20
      }

      if (top + tooltipRect.height > viewportHeight) {
        top = event.clientY - tooltipRect.height - 15
      }

      tooltip.style.left = left + 'px'
      tooltip.style.top = top + 'px'
      tooltip.style.visibility = 'visible'
    } else {
      // 不在 iframe 中，使用原有逻辑
      const viewportWidth = doc.documentElement.clientWidth
      const viewportHeight = doc.documentElement.clientHeight

      let left = event.clientX + offsetX
      let top = event.clientY + offsetY

      // 边界检测
      const tooltipRect = tooltip.getBoundingClientRect()
      if (left + tooltipRect.width > viewportWidth) {
        left = event.clientX - tooltipRect.width - Math.abs(offsetX)
      }

      if (top < 0) {
        top = event.clientY + 20
      }

      if (top + tooltipRect.height > viewportHeight) {
        top = event.clientY - tooltipRect.height - 15
      }

      tooltip.style.left = left + 'px'
      tooltip.style.top = top + 'px'
    }
  }

  /**
   * 创建tooltip元素
   */
  private createTooltipElement(doc: Document, id: string, className: string): HTMLElement | null {
    const tooltip = doc.createElement('div')
    tooltip.id = id
    tooltip.className = className

    // 直接设置基本样式，确保可见
    tooltip.style.position = 'absolute'
    tooltip.style.display = 'none'
    tooltip.style.zIndex = '99999'
    tooltip.style.pointerEvents = 'none'
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)'
    tooltip.style.color = 'white'
    tooltip.style.padding = '8px 12px'
    tooltip.style.borderRadius = '6px'
    tooltip.style.fontSize = '13px'
    tooltip.style.fontWeight = '500'
    tooltip.style.lineHeight = '1.4'
    tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)'
    tooltip.style.maxWidth = '250px'
    tooltip.style.whiteSpace = 'nowrap'

    // 简化容器选择逻辑，直接添加到 body
    const targetContainer = doc.body || doc.documentElement

    if (targetContainer) {
      targetContainer.appendChild(tooltip)
      return tooltip
    }

    console.warn(`无法创建tooltip元素: ${id}，找不到合适的容器`)
    return null
  }

  /**
   * 公共方法：手动设置左侧父元素样式
   * 可以在需要时随时调用
   */
  public updateLeftBarZIndex(zIndex = '999', includeBoxShadow = true, backgroundColor = 'white'): void {
    try {
      const currentDoc = this.getCurrentDocument()
      const leftBarParent = currentDoc.getElementById('DIY-LEFT-BAR')

      if (leftBarParent) {
        // 设置z-index
        leftBarParent.style.zIndex = zIndex

        // 可选设置box-shadow
        if (includeBoxShadow) {
          leftBarParent.style.boxShadow = '-8px 0 16px rgba(0, 18, 46, 0.16)'
        }

        // 设置背景色
        leftBarParent.style.background = backgroundColor
      } else {
        console.warn('未找到 id 为 DIY-LEFT-BAR 的左侧父元素')
      }
    } catch (error) {
      console.error('手动设置左侧父元素样式时出错:', error)
    }
  }

  /**
   * 公共方法：单独设置左侧父元素的box-shadow
   */
  public updateLeftBarBoxShadow(boxShadow = '-8px 0 16px rgba(0, 18, 46, 0.16)'): void {
    try {
      const currentDoc = this.getCurrentDocument()
      const leftBarParent = currentDoc.getElementById('DIY-LEFT-BAR')

      if (leftBarParent) {
        leftBarParent.style.boxShadow = boxShadow
      }
    } catch (error) {
      console.error('设置左侧父元素 box-shadow 时出错:', error)
    }
  }

  /**
   * 公共方法：单独设置左侧父元素的背景色
   */
  public updateLeftBarBackground(backgroundColor = 'white'): void {
    try {
      const currentDoc = this.getCurrentDocument()
      const leftBarParent = currentDoc.getElementById('DIY-LEFT-BAR')

      if (leftBarParent) {
        leftBarParent.style.background = backgroundColor
      }
    } catch (error) {
      console.error('设置左侧父元素背景色时出错:', error)
    }
  }

  // 底部按钮事件处理
  handleVoiceCall(): void {
    // 实现语音通话逻辑
  }

  handleFileUpload(): void {
    // 实现文件上传逻辑
  }

  handleRating(): void {
    // 实现服务评价逻辑
  }
}

export default ChatCustomUI
