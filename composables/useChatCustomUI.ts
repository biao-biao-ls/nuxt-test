import { ChatStyles } from "./useChatStyles";

// 定义类型接口
interface CustomerServiceAgent {
  employeeEnName: string;
  quickCepId: string;
  imageFileIndexId: string;
  roleNameEn: string;
  isOnline: boolean;
  status: number;
  businessLine: string;
}

interface UIState {
  isLeftBarExpanded: boolean;
  currentChatAgent: CustomerServiceAgent | null;
  customerServiceData: CustomerServiceAgent[];
  containers: {
    header: HTMLElement | null;
    leftBar: HTMLElement | null;
    footer: HTMLElement | null;
  };
}

interface UIConfig {
  leftBarWidth: number;
  originalIframeWidth: number;
  refreshInterval: number;
  maxRetryAttempts: number;
}

/**
 * 聊天自定义UI组件管理器
 * 提供模块化的客服聊天界面自定义功能
 */
export class ChatCustomUI {
  public state: UIState;
  public config: UIConfig;
  private eventHandlers: Map<string, Function>;

  constructor() {
    this.state = {
      isLeftBarExpanded: false,
      currentChatAgent: null,
      customerServiceData: [],
      containers: {
        header: null,
        leftBar: null,
        footer: null,
      },
    };

    this.config = {
      leftBarWidth: 180,
      originalIframeWidth: 450,
      refreshInterval: 30000,
      maxRetryAttempts: 20,
    };

    this.eventHandlers = new Map();
    this.init();
  }

  /**
   * 初始化客服数据
   */
  private init(): void {
    this.state.customerServiceData = [
      {
        employeeEnName: "test_01",
        quickCepId: "1938524999731687426",
        imageFileIndexId: "8454635530497527808",
        roleNameEn: "Business Development Representative",
        isOnline: false,
        status: 1,
        businessLine: "3D Printing",
      },
      {
        employeeEnName: "caocao",
        quickCepId: "1942407035945005058",
        imageFileIndexId: "8454682774852571136",
        roleNameEn: "Quality Assurance Agent",
        isOnline: false,
        status: 1,
        businessLine: "3D Printing",
      },
      {
        employeeEnName: "2121",
        quickCepId: "1938532940512280577",
        imageFileIndexId: "8455707418908921856",
        roleNameEn: "Customer Service Representative",
        isOnline: false,
        status: 1,
        businessLine: "PCB Assembly",
      },
      {
        employeeEnName: "xiaozhou",
        quickCepId: "1938144757068906498",
        imageFileIndexId: "8593772030083227648",
        roleNameEn: "Technical Support Specialist",
        isOnline: false,
        status: 1,
        businessLine: "PCB Assembly",
      },
      {
        employeeEnName: "Alex",
        quickCepId: "1946056607741292545",
        imageFileIndexId: "8593772229182779392",
        roleNameEn: "Client Relations Manager",
        isOnline: false,
        status: 1,
        businessLine: "SMT Services",
      },
      {
        employeeEnName: "yxy",
        quickCepId: "1938475369237098497",
        imageFileIndexId: "8630496439324213248",
        roleNameEn: "Account Manager",
        isOnline: false,
        status: 1,
        businessLine: "SMT Services",
      },
      {
        employeeEnName: "Ryan",
        quickCepId: "1942107108466016257",
        imageFileIndexId: "8630498147114913792",
        roleNameEn: "Sales Consultant",
        isOnline: false,
        status: 1,
        businessLine: "Components",
      },
      {
        employeeEnName: "Xie Yulang",
        quickCepId: "1948591855846862849",
        imageFileIndexId: "8636932414868172800",
        roleNameEn: "Account Manager",
        isOnline: false,
        status: 1,
        businessLine: "Components",
      },
    ];
  }

  /**
   * 工具函数：根据状态码判断是否在线
   */
  isAgentOnline(status: number): boolean {
    return status === 2 || status === 3;
  }

  /**
   * 工具函数：获取状态颜色
   */
  getStatusColor(status: number): string {
    const colors: Record<number, string> = {
      2: "#28a745", // 在线空闲 - 绿色
      3: "#ffc107", // 在线忙碌 - 黄色
    };
    return colors[status] || "#d8d8d8"; // 离线 - 灰色
  }

  /**
   * 工具函数：获取状态文本
   */
  getStatusText(status: number): string {
    const texts: Record<number, string> = {
      2: "在线空闲",
      3: "在线忙碌",
    };
    return texts[status] || "离线";
  }

  /**
   * 工具函数：获取头像URL
   */
  getAvatarUrl(imageFileIndexId: string): string {
    return `https://test.jlcerp.com/api/overseas-manage/employee/image/preview/${imageFileIndexId}`;
  }

  /**
   * 工具函数：截断文本
   */
  truncateText(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  /**
   * 工具函数：按业务线分组客服
   */
  groupByBusinessLine(
    agents: CustomerServiceAgent[]
  ): Record<string, CustomerServiceAgent[]> {
    return agents.reduce((grouped, agent) => {
      if (!grouped[agent.businessLine]) {
        grouped[agent.businessLine] = [];
      }
      grouped[agent.businessLine].push(agent);
      return grouped;
    }, {} as Record<string, CustomerServiceAgent[]>);
  }

  /**
   * 更新客服状态
   */
  updateAgentStatus(operatorUserIdStatus: Record<string, number>): void {
    console.log("更新客服状态:", operatorUserIdStatus);

    let hasStatusChanged = false;

    this.state.customerServiceData.forEach((agent) => {
      if (operatorUserIdStatus.hasOwnProperty(agent.quickCepId)) {
        const newStatus = operatorUserIdStatus[agent.quickCepId];
        const oldStatus = agent.status;
        const oldOnlineStatus = agent.isOnline;

        agent.status = newStatus
        agent.isOnline = this.isAgentOnline(newStatus)

        if (oldStatus !== newStatus || oldOnlineStatus !== agent.isOnline) {
          hasStatusChanged = true;
          console.log(
            `客服 ${agent.employeeEnName} 状态更新: ${this.getStatusText(
              oldStatus
            )} -> ${this.getStatusText(newStatus)}`
          );
        }
      }
    });

    if (hasStatusChanged) {
      console.log("检测到客服状态变化，正在同步更新UI...");
      this.refreshUI();
      this.emitCustomEvent("agentStatusUpdated", {
        updatedAgents: this.state.customerServiceData,
        changedStatuses: operatorUserIdStatus,
      });
    }
  }

  /**
   * 发射自定义事件
   */
  private emitCustomEvent(eventName: string, detail: any): void {
    if (typeof window !== "undefined" && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  /**
   * 选择客服
   */
  selectAgent(quickCepId: string): void {
    const agent = this.state.customerServiceData.find(
      (a) => a.quickCepId === quickCepId
    );

    if (!agent) {
      console.error(`未找到客服 ID: ${quickCepId}`);
      return;
    }

    if (!agent.isOnline) {
      console.log(`客服 ${agent.employeeEnName} 当前离线，无法切换`);
      return;
    }

    if (
      this.state.currentChatAgent &&
      this.state.currentChatAgent.quickCepId === quickCepId
    ) {
      console.log(`已经在与客服 ${agent.employeeEnName} 沟通中`);
      return;
    }

    console.log(
      `正在切换到客服: ${agent.employeeEnName} (状态: ${this.getStatusText(
        agent.status
      )})`
    );

    if (
      typeof window !== "undefined" &&
      (window as any).quickChatApi &&
      (window as any).quickChatApi.switchChat
    ) {
      try {
        (window as any).quickChatApi.switchChat(quickCepId);
      } catch (error) {
        console.error("切换客服失败:", error);
      }
    } else {
      console.error("quickChatApi.switchChat 方法不可用");
    }
  }

  /**
   * 切换左侧栏显示/隐藏
   */
  toggleLeftBar(): void {
    this.state.isLeftBarExpanded = !this.state.isLeftBarExpanded;
    if (
      typeof window !== "undefined" &&
      (window as any).quickChatApi &&
      (window as any).quickChatApi.customLeftBar
    ) {
      (window as any).quickChatApi.customLeftBar.setIsShow(
        this.state.isLeftBarExpanded
      );
    }
    this.refreshUI();
  }

  /**
   * 刷新UI
   */
  refreshUI(): void {
    console.log("正在刷新自定义UI组件...");

    // 更新头部
    if (this.state.containers.header) {
      this.state.containers.header.innerHTML = this.generateHeaderHTML();
    }

    // 更新左侧栏
    if (this.state.containers.leftBar) {
      this.state.containers.leftBar.innerHTML = this.generateLeftBarHTML();
    }

    // 确保左侧父元素的z-index设置正确
    this.setLeftBarParentZIndex();

    console.log("UI刷新完成");
  }

  /**
   * 生成头部HTML
   */
  generateHeaderHTML(): string {
    const onlineAgents = this.state.customerServiceData.filter(
      (agent) => agent.isOnline
    );
    const displayAgents = onlineAgents.slice(0, 3);
    const hasMoreAgents = onlineAgents.length > 3;

    return `
      ${ChatStyles.generateHeaderStyles()}
      <div class="chat-header">
        <div class="chat-header-agents">
          ${this.renderCurrentAgent()}
          ${this.renderOnlineAgents(displayAgents)}
          ${
            hasMoreAgents
              ? this.renderMoreAgentsIndicator(onlineAgents.length)
              : ""
          }
          ${
            onlineAgents.length === 0
              ? '<div class="no-agents">暂无客服在线</div>'
              : ""
          }
        </div>
        <div class="chat-header-controls">
          <span class="online-count">在线: ${onlineAgents.length}</span>
          <button class="toggle-btn" onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).toggleLeftBar()">
            ${this.state.isLeftBarExpanded ? "收起" : "客服"}
          </button>
        </div>
      </div>
      <div id="agent-tooltip" class="agent-tooltip"></div>
    `;
  }

  /**
   * 渲染当前聊天客服
   */
  private renderCurrentAgent(): string {
    if (!this.state.currentChatAgent) return "";

    const agent =
      this.state.customerServiceData.find(
        (a) => a.quickCepId === this.state.currentChatAgent!.quickCepId
      ) || this.state.currentChatAgent;

    return `
      <div class="current-agent" title="当前沟通: ${
        agent.employeeEnName
      } (${this.getStatusText(agent.status)})">
        <img src="${this.getAvatarUrl(agent.imageFileIndexId)}" 
             class="agent-avatar current" 
             style="border-color: ${agent.isOnline ? "#007bff" : "#d8d8d8"};"
             onerror="this.src='${this.getDefaultAvatar(32)}'">
        <div class="status-indicator" style="background: ${this.getStatusColor(
          agent.status
        )};"></div>
      </div>
    `;
  }

  /**
   * 渲染在线客服
   */
  private renderOnlineAgents(displayAgents: CustomerServiceAgent[]): string {
    return displayAgents
      .filter(
        (agent) =>
          !this.state.currentChatAgent ||
          agent.quickCepId !== this.state.currentChatAgent.quickCepId
      )
      .map(
        (agent) => `
        <div class="online-agent" 
             onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).selectAgent('${
               agent.quickCepId
             }')"
             onmouseover="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).showTooltip(event, '${
               agent.employeeEnName
             }', '${agent.roleNameEn} - ${this.getStatusText(agent.status)}')"
             onmouseout="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).hideTooltip()"
             title="${agent.employeeEnName} - ${
          agent.roleNameEn
        } (${this.getStatusText(agent.status)})">
          <img src="${this.getAvatarUrl(agent.imageFileIndexId)}" 
               class="agent-avatar online"
               onerror="this.src='${this.getDefaultAvatar(28)}'">
          <div class="status-indicator" style="background: ${this.getStatusColor(
            agent.status
          )};"></div>
        </div>
      `
      )
      .join("");
  }

  /**
   * 渲染更多客服指示器
   */
  private renderMoreAgentsIndicator(totalOnline: number): string {
    return `
      <div class="more-agents" onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).toggleLeftBar()" title="查看更多客服 (${totalOnline}个在线)">
        +${totalOnline - 3}
      </div>
    `;
  }

  /**
   * 生成左侧栏HTML
   */
  generateLeftBarHTML(): string {
    const groupedAgents = this.groupByBusinessLine(
      this.state.customerServiceData
    );

    return `
      ${ChatStyles.generateLeftBarStyles()}
      <div class="left-bar">
        <div class="left-bar-content">
          ${Object.entries(groupedAgents)
            .map(([businessLine, agents]) =>
              this.renderBusinessLineGroup(businessLine, agents)
            )
            .join("")}
        </div>
        <div class="left-bar-footer">
            <svg onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).toggleLeftBar()" t="1758522231178" class="expand-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="15573" width="20" height="20">
              <path d="M636.501333 383.658667a37.973333 37.973333 0 0 1 41.898667 62.762666l-3.157333 2.304-99.925334 66.645334 103.210667 86.016a37.930667 37.930667 0 1 1-48.554667 58.24l-142.250666-118.485334a37.973333 37.973333 0 0 1 3.242666-60.714666L633.173333 385.706667l3.328-2.005334zM308.181333 891.306667V156.416a37.930667 37.930667 0 1 1 75.818667 0v734.805333a37.930667 37.930667 0 0 1-75.818667 0z" fill="#999" p-id="15574"></path>
              <path d="M749.056 862.848V938.666667H274.986667v-75.818667h474.026666z m113.792-113.792V274.944a113.792 113.792 0 0 0-113.792-113.792H274.986667a113.792 113.792 0 0 0-113.792 113.792v474.112a113.792 113.792 0 0 0 113.792 113.792V938.666667l-9.770667-0.256a189.653333 189.653333 0 0 1-179.626667-179.626667L85.333333 749.056V274.944a189.653333 189.653333 0 0 1 179.882667-189.354667L274.986667 85.333333h474.026666l9.813334 0.256A189.610667 189.610667 0 0 1 938.666667 274.944v474.112l-0.256 9.728a189.653333 189.653333 0 0 1-179.626667 179.626667l-9.728 0.256v-75.818667a113.834667 113.834667 0 0 0 113.792-113.792z" fill="#999" p-id="15575"></path>
            </svg>
        </div>
      </div>
      <div id="full-agent-tooltip" class="full-agent-tooltip"></div>
    `;
  }

  /**
   * 渲染业务线分组
   */
  private renderBusinessLineGroup(
    businessLine: string,
    agents: CustomerServiceAgent[]
  ): string {
    return `
      <div class="business-line-group">
        <div class="business-line-title">${businessLine}</div>
        <div class="agents-list">
          ${agents.map((agent) => this.renderAgentItem(agent)).join("")}
        </div>
      </div>
    `;
  }

  /**
   * 渲染客服项目
   */
  private renderAgentItem(agent: CustomerServiceAgent): string {
    const isOnline = agent.isOnline;
    const isCurrentChat =
      this.state.currentChatAgent &&
      this.state.currentChatAgent.quickCepId === agent.quickCepId;
    const canClick = isOnline;

    return `
      <div class="agent-item ${isCurrentChat ? "current" : ""} ${
      isOnline ? "online" : "offline"
    }"
           ${
             canClick
               ? `onclick="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).selectAgent('${agent.quickCepId}')"`
               : ""
           }
           onmouseover="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).showFullTooltip(event, '${
             agent.employeeEnName
           }', '${agent.roleNameEn}')"
           onmouseout="(window.chatUI || window.parent.chatUI) && (window.chatUI || window.parent.chatUI).hideFullTooltip()">
        
        <div class="agent-avatar-container">
          <img src="${this.getAvatarUrl(agent.imageFileIndexId)}" 
               class="agent-avatar"
               onerror="this.src='${this.getDefaultAvatar(32)}'">
          <div class="status-indicator" style="background: ${this.getStatusColor(
            agent.status
          )};"></div>
        </div>
        
        <div class="agent-info">
          <div class="agent-name">${this.truncateText(
            agent.employeeEnName,
            8
          )}</div>
          <div class="agent-role">${this.truncateText(
            agent.roleNameEn,
            12
          )}</div>
        </div>
        
        ${isCurrentChat ? '<div class="current-indicator">●</div>' : ""}
      </div>
    `;
  }

  /**
   * 生成底部HTML
   */
  generateFooterHTML(): string {
    return `
      ${ChatStyles.generateFooterStyles()}
      <div class="chat-footer">

      </div>
    `;
  }

  /**
   * 获取默认头像
   */
  private getDefaultAvatar(size: number): string {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${
      size / 2
    }" fill="#e9ecef"/>
        <path d="M${size / 2} ${size * 0.625}C${size * 0.375} ${size * 0.625} ${
      size * 0.3125
    } ${size * 0.46875} ${size * 0.3125} ${size * 0.4375}S${size * 0.375} ${
      size * 0.25
    } ${size / 2} ${size * 0.25}S${size * 0.6875} ${size * 0.3125} ${
      size * 0.6875
    } ${size * 0.4375}S${size * 0.625} ${size * 0.625} ${size / 2} ${
      size * 0.625
    }ZM${size / 2} ${size * 0.75}C${size * 0.65625} ${size * 0.75} ${
      size * 0.75
    } ${size * 0.65625} ${size * 0.75} ${size * 0.5}S${size * 0.65625} ${
      size * 0.25
    } ${size / 2} ${size * 0.25}S${size * 0.25} ${size * 0.34375} ${
      size * 0.25
    } ${size * 0.5}S${size * 0.34375} ${size * 0.75} ${size / 2} ${
      size * 0.75
    }Z" fill="#d8d8d8"/>
      </svg>
    `)}`;
  }

  // 事件处理方法
  showTooltip(event: MouseEvent, name: string, role: string): void {
    const currentDoc = this.getCurrentDocument();
    let tooltip = currentDoc.getElementById("agent-tooltip");

    if (!tooltip) {
      tooltip = this.createTooltipElement(
        currentDoc,
        "agent-tooltip",
        "agent-tooltip"
      );
    }

    if (tooltip) {
      tooltip.innerHTML = `<strong>${name}</strong><br>${role}`;
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY - 40 + "px";
    }
  }

  hideTooltip(): void {
    const currentDoc = this.getCurrentDocument();
    const tooltip = currentDoc.getElementById("agent-tooltip");
    if (tooltip) tooltip.style.display = "none";
  }

  showFullTooltip(event: MouseEvent, name: string, role: string): void {
    const currentDoc = this.getCurrentDocument();
    let tooltip = currentDoc.getElementById("full-agent-tooltip");

    if (!tooltip) {
      tooltip = this.createTooltipElement(
        currentDoc,
        "full-agent-tooltip",
        "full-agent-tooltip"
      );
    }

    if (tooltip) {
      tooltip.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${name}</div>
        <div style="opacity: 0.9;">${role}</div>
      `;
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 15 + "px";
      tooltip.style.top = event.pageY - 50 + "px";
    }
  }

  hideFullTooltip(): void {
    const currentDoc = this.getCurrentDocument();
    const tooltip = currentDoc.getElementById("full-agent-tooltip");
    if (tooltip) tooltip.style.display = "none";
  }

  /**
   * 获取当前文档上下文，支持iframe环境
   */
  private getCurrentDocument(): Document {
    if (typeof document === "undefined") {
      throw new Error("Document is not available");
    }

    // 如果容器存在，使用容器所在的文档
    if (
      this.state.containers.header &&
      this.state.containers.header.ownerDocument
    ) {
      return this.state.containers.header.ownerDocument;
    }
    if (
      this.state.containers.leftBar &&
      this.state.containers.leftBar.ownerDocument
    ) {
      return this.state.containers.leftBar.ownerDocument;
    }

    // 尝试获取iframe内的文档
    try {
      const iframe = document.getElementById(
        "quick-chat-iframe"
      ) as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        return iframe.contentDocument;
      }
      // 如果在iframe内部运行，直接使用当前文档
      if (
        typeof window !== "undefined" &&
        window.frameElement &&
        (window.frameElement as HTMLElement).id === "quick-chat-iframe"
      ) {
        return document;
      }
    } catch (error) {
      console.warn("无法访问iframe文档:", error);
    }

    // 否则使用当前文档
    return document;
  }

  /**
   * 设置容器引用，支持iframe环境
   */
  setContainers(
    headerSelector?: string | HTMLElement,
    leftBarSelector?: string | HTMLElement,
    footerSelector?: string | HTMLElement
  ): void {
    const currentDoc = this.getCurrentDocument();

    if (headerSelector) {
      this.state.containers.header =
        typeof headerSelector === "string"
          ? currentDoc.querySelector(headerSelector)
          : headerSelector;
    }

    if (leftBarSelector) {
      this.state.containers.leftBar =
        typeof leftBarSelector === "string"
          ? currentDoc.querySelector(leftBarSelector)
          : leftBarSelector;
    }

    if (footerSelector) {
      this.state.containers.footer =
        typeof footerSelector === "string"
          ? currentDoc.querySelector(footerSelector)
          : footerSelector;
    }

    console.log("容器设置完成:", {
      header: !!this.state.containers.header,
      leftBar: !!this.state.containers.leftBar,
      footer: !!this.state.containers.footer,
    });

    // 设置左侧父元素的z-index
    this.setLeftBarParentZIndex();
  }

  /**
   * 设置左侧父元素的z-index、box-shadow和背景样式
   */
  setLeftBarParentZIndex(): void {
    try {
      const currentDoc = this.getCurrentDocument();
      const leftBarParent = currentDoc.getElementById("DIY-LEFT-BAR");

      if (leftBarParent) {
        // 设置z-index
        leftBarParent.style.zIndex = "999";

        // 设置box-shadow，向左扩散
        leftBarParent.style.boxShadow = "-8px 0 22px rgba(0, 18, 46, 0.16)";

        // 设置白色背景
        leftBarParent.style.background = "white";

        console.log(
          "已设置左侧父元素 DIY-LEFT-BAR 的 z-index、box-shadow 和背景样式"
        );
      } else {
        console.warn("未找到 id 为 DIY-LEFT-BAR 的左侧父元素");
      }
    } catch (error) {
      console.error("设置左侧父元素样式时出错:", error);
    }
  }

  /**
   * 创建tooltip元素
   */
  private createTooltipElement(
    doc: Document,
    id: string,
    className: string
  ): HTMLElement | null {
    const tooltip = doc.createElement("div");
    tooltip.id = id;
    tooltip.className = className;
    tooltip.style.display = "none";

    // 将tooltip添加到body或合适的容器中
    const targetContainer = doc.body || doc.documentElement;
    if (targetContainer) {
      targetContainer.appendChild(tooltip);
      console.log(`已创建tooltip元素: ${id}`);
      return tooltip;
    }

    console.warn(`无法创建tooltip元素: ${id}，找不到合适的容器`);
    return null;
  }

  /**
   * 公共方法：手动设置左侧父元素样式
   * 可以在需要时随时调用
   */
  public updateLeftBarZIndex(
    zIndex: string = "999",
    includeBoxShadow: boolean = true,
    backgroundColor: string = "white"
  ): void {
    try {
      const currentDoc = this.getCurrentDocument();
      const leftBarParent = currentDoc.getElementById("DIY-LEFT-BAR");

      if (leftBarParent) {
        // 设置z-index
        leftBarParent.style.zIndex = zIndex;

        // 可选设置box-shadow
        if (includeBoxShadow) {
          leftBarParent.style.boxShadow = "-8px 0 16px rgba(0, 18, 46, 0.16)";
        }

        // 设置背景色
        leftBarParent.style.background = backgroundColor;

        console.log(
          `已手动设置左侧父元素 DIY-LEFT-BAR 的 z-index 为 ${zIndex}${
            includeBoxShadow ? "、box-shadow" : ""
          } 和背景色为 ${backgroundColor}`
        );
      } else {
        console.warn("未找到 id 为 DIY-LEFT-BAR 的左侧父元素");
      }
    } catch (error) {
      console.error("手动设置左侧父元素样式时出错:", error);
    }
  }

  /**
   * 公共方法：单独设置左侧父元素的box-shadow
   */
  public updateLeftBarBoxShadow(
    boxShadow: string = "-8px 0 16px rgba(0, 18, 46, 0.16)"
  ): void {
    try {
      const currentDoc = this.getCurrentDocument();
      const leftBarParent = currentDoc.getElementById("DIY-LEFT-BAR");

      if (leftBarParent) {
        leftBarParent.style.boxShadow = boxShadow;
        console.log(
          `已设置左侧父元素 DIY-LEFT-BAR 的 box-shadow 为: ${boxShadow}`
        );
      } else {
        console.warn("未找到 id 为 DIY-LEFT-BAR 的左侧父元素");
      }
    } catch (error) {
      console.error("设置左侧父元素 box-shadow 时出错:", error);
    }
  }

  /**
   * 公共方法：单独设置左侧父元素的背景色
   */
  public updateLeftBarBackground(backgroundColor: string = "white"): void {
    try {
      const currentDoc = this.getCurrentDocument();
      const leftBarParent = currentDoc.getElementById("DIY-LEFT-BAR");

      if (leftBarParent) {
        leftBarParent.style.background = backgroundColor;
        console.log(
          `已设置左侧父元素 DIY-LEFT-BAR 的背景色为: ${backgroundColor}`
        );
      } else {
        console.warn("未找到 id 为 DIY-LEFT-BAR 的左侧父元素");
      }
    } catch (error) {
      console.error("设置左侧父元素背景色时出错:", error);
    }
  }

  // 底部按钮事件处理
  handleVoiceCall(): void {
    console.log("发起语音通话");
    // 实现语音通话逻辑
  }

  handleFileUpload(): void {
    console.log("发送文件");
    // 实现文件上传逻辑
  }

  handleRating(): void {
    console.log("评价服务");
    // 实现服务评价逻辑
  }
}

export default ChatCustomUI;
