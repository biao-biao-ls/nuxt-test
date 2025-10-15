/**
 * 订单选择器组件
 * 用于在聊天窗口中选择和发送订单信息
 */

interface OrderItem {
  title: string
  _orderCode: string
  orderCode: string
  customerCode: string
  orderCount: number
  batchNum?: string
  imgUrl: string
  orderAmount: string
  businessType: string
  source: 'order' | 'cart'
}

interface OrderBatch {
  batchNum: string
  createTime?: string
  orderSimpleVOS: OrderItem[]
}

interface OrderSelectorState {
  isVisible: boolean
  isClosing: boolean
  activeName: 'Orders' | 'Cart'
  keyword: string
  cartList: OrderItem[]
  orderList: OrderBatch[]
  cartPageNum: number
  orderPageNum: number
  cartListTotal: number
  orderListTotal: number
  orderListLoading: boolean
  pageSize: number
}

export class OrderSelector {
  private state: OrderSelectorState
  private container: HTMLElement | null = null
  private onSendOrderCallback?: (orderItem: OrderItem) => void

  constructor() {
    this.state = {
      isVisible: false,
      isClosing: false,
      activeName: 'Orders',
      keyword: '',
      cartList: [],
      orderList: [],
      cartPageNum: 1,
      orderPageNum: 1,
      cartListTotal: 0,
      orderListTotal: 0,
      orderListLoading: false,
      pageSize: 12
    }
  }

  /**
   * 设置发送订单回调
   */
  setOnSendOrderCallback(callback: (orderItem: OrderItem) => void): void {
    this.onSendOrderCallback = callback
  }

  /**
   * 显示订单选择器
   */
  show(): void {
    if (this.state.isVisible) return
    
    this.state.isVisible = true
    this.state.isClosing = false
    
    // 显示容器
    if (this.container) {
      this.container.style.display = 'block'
    }
    
    this.render()
    this.initList()
  }

  /**
   * 隐藏订单选择器
   */
  hide(): void {
    if (!this.state.isVisible) return
    
    this.state.isClosing = true
    this.render()
    
    setTimeout(() => {
      this.state.isVisible = false
      this.state.isClosing = false
      
      // 隐藏容器
      if (this.container) {
        this.container.style.display = 'none'
        this.container.innerHTML = ''
      }
    }, 300)
  }

  /**
   * 挂载到指定容器
   */
  mount(container: HTMLElement): void {
    this.container = container
  }

  /**
   * 渲染组件
   */
  private render(): void {
    if (!this.container) return

    if (!this.state.isVisible) {
      this.container.innerHTML = ''
      return
    }

    this.container.innerHTML = `
      ${this.generateStyles()}
      <div class="chat-popup" onclick="this.handleBackdropClick(event)">
        <div class="chat-popup-container ${this.state.isClosing ? 'slide-down' : ''}">
          <div class="chat-popup-cate">
            <div class="chat-popup-header">
              <strong class="chat-popup-title">Please Select an Order</strong>
              <img class="chat-popup-close" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDRMNCA4TDEyIDEyIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=" onclick="window.orderSelector && window.orderSelector.hide()" />
            </div>
            <div class="chat-search-wrapper">
              <div class="chat-search-input">
                <input type="text" 
                       placeholder="Search order # or filename" 
                       value="${this.state.keyword}"
                       onkeydown="if(event.key==='Enter') window.orderSelector && window.orderSelector.handleSearch()"
                       oninput="window.orderSelector && window.orderSelector.updateKeyword(this.value)">
                <div class="chat-search-btn" onclick="window.orderSelector && window.orderSelector.handleSearch()">Search</div>
              </div>
              <svg class="chat-search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="chat-tabs">
              <div class="tab-item ${this.state.activeName === 'Orders' ? 'active' : ''}" 
                   onclick="window.orderSelector && window.orderSelector.switchTab('Orders')">Orders</div>
              <div class="tab-item ${this.state.activeName === 'Cart' ? 'active' : ''}" 
                   onclick="window.orderSelector && window.orderSelector.switchTab('Cart')">Cart</div>
            </div>
          </div>
          <div class="chat-order-list">
            ${this.renderOrderList()}
          </div>
          ${this.state.orderListLoading ? '<div class="chat-loading">Loading...</div>' : ''}
        </div>
      </div>
    `

    // 绑定事件处理器
    this.bindEvents()
  }

  /**
   * 渲染订单列表
   */
  private renderOrderList(): string {
    if (this.state.activeName === 'Cart') {
      return this.renderCartList()
    } else {
      return this.renderOrdersList()
    }
  }

  /**
   * 渲染购物车列表
   */
  private renderCartList(): string {
    if (this.state.cartList.length === 0) {
      return '<div class="chat-no-order">No items in cart</div>'
    }

    return this.state.cartList.map(item => `
      <div class="chat-order-list-item">
        <div class="chat-order-list-info">
          ${this.renderOrderItem(item)}
        </div>
        <div class="chat-order-send">
          <button class="send-btn" onclick="window.orderSelector && window.orderSelector.sendOrder('${item._orderCode}')">Send</button>
        </div>
      </div>
    `).join('')
  }

  /**
   * 渲染订单列表
   */
  private renderOrdersList(): string {
    if (this.state.orderList.length === 0) {
      return '<div class="chat-no-order">No orders found</div>'
    }

    return this.state.orderList.map(batch => `
      <div class="chat-order-batch">
        <span>${batch.batchNum}</span>
        <span class="chat-order-batch-date">${this.getDateByBatchNum(batch.batchNum)}</span>
      </div>
      <div>
        ${batch.orderSimpleVOS.map(item => `
          <div class="chat-order-list-item">
            <div class="chat-order-list-info">
              ${this.renderOrderItem(item)}
            </div>
            <div class="chat-order-send">
              <button class="send-btn" onclick="window.orderSelector && window.orderSelector.sendOrder('${item._orderCode}')">Send</button>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('')
  }

  /**
   * 渲染单个订单项
   */
  private renderOrderItem(item: OrderItem): string {
    return `
      <div class="order-item">
        <div class="order-image">
          <img src="${item.imgUrl}" alt="${item.title}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iMjAiIHk9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5Ij5JTUc8L3RleHQ+PC9zdmc+'">
        </div>
        <div class="order-details">
          <div class="order-title">${item.title}</div>
          <div class="order-code">Order #: ${item._orderCode}</div>
          <div class="order-amount">${item.orderAmount}</div>
        </div>
      </div>
    `
  }

  /**
   * 生成样式
   */
  private generateStyles(): string {
    return `
      <style>
        .chat-popup {
          position: fixed;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          z-index: 9999;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0.6) 50%,
            rgba(0, 0, 0, 0.75) 100%
          );
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          display: flex;
          align-items: flex-end;
          animation: fadeInBackdrop 0.3s ease-out;
        }

        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
          }
        }

        .chat-popup-container {
          height: 100%;
          width: 100%;
          background-color: #fff;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
        }

        .chat-popup-container::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 36px;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          z-index: 1;
        }

        .chat-popup-container.slide-down {
          animation: slideDown 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
        }

        @keyframes slideUp {
          from { 
            transform: translateY(100%);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from { 
            transform: translateY(0);
            opacity: 1;
          }
          to { 
            transform: translateY(100%);
            opacity: 0;
          }
        }

        .chat-popup-cate {
          padding: 20px 16px 0 16px;
          flex-shrink: 0;
        }

        .chat-popup-header {
          line-height: 20px;
          padding: 12px 0;
          position: relative;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 16px;
        }

        .chat-popup-title {
          font-size: 16px;
          font-weight: bold;
        }

        .chat-popup-close {
          position: absolute;
          top: 10px;
          right: 10px;
          cursor: pointer;
          width: 16px;
          height: 16px;
        }

        /* 统一的搜索框样式 - Cart 和 Orders 标签页共用 */
        .chat-search-wrapper {
          position: relative;
          margin-bottom: 12px;
        }

        .chat-search-input {
          display: flex;
          height: 34px;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .chat-search-input:focus-within {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }

        .chat-search-input input {
          flex: 1;
          height: 32px;
          padding: 0 8px 0 36px;
          border: none;
          outline: none;
          font-size: 14px;
          color: #333;
          background: transparent;
        }

        .chat-search-input input::placeholder {
          color: #999;
        }

        .chat-search-btn {
          height: 32px;
          line-height: 32px;
          padding: 0 12px;
          background-color: #444444;
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s ease;
          border: none;
        }

        .chat-search-btn:hover {
          background-color: #333333;
        }

        .chat-search-btn:active {
          background-color: #222222;
        }

        .chat-search-icon {
          position: absolute;
          top: 6px;
          left: 8px;
          color: #999;
          pointer-events: none;
          z-index: 1;
        }

        /* 统一的标签页样式 */
        .chat-tabs {
          display: flex;
          border-bottom: 1px solid #e6eaf1;
          background: #f8f9fa;
        }

        .tab-item {
          flex: 1;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          color: #666;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }

        .tab-item:hover:not(.active) {
          color: #333;
          background: rgba(0, 123, 255, 0.05);
        }

        .tab-item.active {
          color: #007bff;
          border-bottom-color: #007bff;
          background: white;
        }

        .tab-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #007bff;
          border-radius: 1px 1px 0 0;
        }

        /* 统一的列表容器样式 */
        .chat-order-list {
          flex: 1;
          overflow: auto;
          padding: 0 16px 20px 16px;
          font-size: 14px;
          background: #fff;
        }

        /* 订单批次样式 - 仅用于 Orders 标签页 */
        .chat-order-batch {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e6eaf1;
          padding: 8px 0 4px 0;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .chat-order-batch-date {
          color: #999;
          font-weight: normal;
          font-size: 12px;
        }

        /* 统一的订单项样式 - Cart 和 Orders 标签页共用 */
        .chat-order-list-item {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 12px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          background: #fff;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .chat-order-list-item:hover {
          border-color: #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }

        .chat-order-list-item:last-child {
          margin-bottom: 0;
        }

        .chat-order-list-info {
          flex: 1;
          min-width: 0;
        }

        .order-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .order-image {
          flex-shrink: 0;
        }

        .order-image img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #f0f0f0;
        }

        .order-details {
          flex: 1;
          min-width: 0;
        }

        .order-title {
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
          font-size: 14px;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .order-code {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
          line-height: 1.2;
        }

        .order-amount {
          font-size: 14px;
          color: #007bff;
          font-weight: 600;
          line-height: 1.2;
        }

        /* 统一的发送按钮样式 */
        .send-btn {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .send-btn:hover {
          background-color: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
        }

        .send-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(0, 123, 255, 0.3);
        }

        /* 统一的空状态样式 */
        .chat-no-order {
          text-align: center;
          color: #999;
          padding: 40px 20px;
          font-size: 14px;
          line-height: 1.5;
        }

        /* 统一的加载状态样式 */
        .chat-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 255, 255, 0.95);
          padding: 20px 30px;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          font-size: 14px;
          color: #666;
          z-index: 10;
        }

        /* 滚动条样式优化 */
        .chat-order-list::-webkit-scrollbar {
          width: 6px;
        }

        .chat-order-list::-webkit-scrollbar-track {
          background: #f8f9fa;
          border-radius: 3px;
        }

        .chat-order-list::-webkit-scrollbar-thumb {
          background: #dee2e6;
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .chat-order-list::-webkit-scrollbar-thumb:hover {
          background: #adb5bd;
        }

        /* 响应式优化 */
        @media (max-width: 480px) {
          .chat-popup-container {
            height: 100%;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
          }
          
          .chat-popup-cate {
            padding: 16px 12px 0 12px;
          }
          
          .chat-order-list {
            padding: 0 12px 16px 12px;
          }
          
          .order-title {
            font-size: 13px;
          }
          
          .send-btn {
            padding: 6px 12px;
            font-size: 13px;
          }
          
          .chat-search-input input {
            font-size: 16px; /* 防止 iOS 缩放 */
          }
        }

        /* 超小屏幕优化 */
        @media (max-width: 360px) {
          .chat-popup-container {
            height: 100%;
          }
          
          .chat-popup-header {
            padding: 8px 0;
          }
          
          .chat-popup-title {
            font-size: 15px;
          }
        }

        /* 大屏幕优化 */
        @media (min-width: 768px) {
          .chat-popup-container {
            height: 100%;
            border-radius: 16px;
            margin: 0 20px 20px 20px;
            width: calc(100% - 40px);
            bottom: 20px;
          }
        }
      </style>
    `
  }

  /**
   * 绑定事件处理器
   */
  private bindEvents(): void {
    // 阻止弹窗内容区域的点击事件冒泡
    const container = this.container?.querySelector('.chat-popup-container')
    if (container) {
      container.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }

    // 绑定背景点击关闭
    const popup = this.container?.querySelector('.chat-popup')
    if (popup) {
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          this.hide()
        }
      })
    }
  }

  /**
   * 更新搜索关键词
   */
  updateKeyword(keyword: string): void {
    this.state.keyword = keyword
  }

  /**
   * 处理搜索
   */
  handleSearch(): void {
    if (this.state.activeName === 'Cart') {
      this.state.cartListTotal = 0
      this.state.cartPageNum = 1
      this.state.cartList = []
      this.getCartList()
    } else {
      this.state.orderListTotal = 0
      this.state.orderPageNum = 1
      this.state.orderList = []
      this.getOrderList()
    }
  }

  /**
   * 切换标签页
   */
  switchTab(tabName: 'Orders' | 'Cart'): void {
    this.state.activeName = tabName
    this.render()
  }

  /**
   * 发送订单
   */
  sendOrder(orderCode: string): void {
    const allItems = [...this.state.cartList, ...this.state.orderList.flatMap(batch => batch.orderSimpleVOS)]
    const orderItem = allItems.find(item => item._orderCode === orderCode)
    
    if (orderItem && this.onSendOrderCallback) {
      this.onSendOrderCallback(orderItem)
      this.hide()
    }
  }

  /**
   * 初始化列表数据
   */
  private initList(): void {
    this.getOrderList()
    this.getCartList()
  }

  /**
   * 获取订单数据
   */
  private async getOrderList(): Promise<void> {
    this.state.orderListLoading = true
    this.render()

    try {
      // 模拟API调用，使用本地数据
      const response = await this.mockOrderAPI()
      this.state.orderListTotal = response.total
      const list = this.dealOrderList(response.list)
      this.state.orderList.push(...list)
    } catch (error) {
      console.error('获取订单数据失败:', error)
    }

    this.state.orderListLoading = false
    this.render()
  }

  /**
   * 获取购物车数据
   */
  private async getCartList(): Promise<void> {
    this.state.orderListLoading = true
    this.render()

    try {
      // 模拟API调用，使用本地数据
      const response = await this.mockCartAPI()
      this.state.cartListTotal = response.total
      const list = this.dealCartList(response.list)
      this.state.cartList.push(...list)
    } catch (error) {
      console.error('获取购物车数据失败:', error)
    }

    this.state.orderListLoading = false
    this.render()
  }

  /**
   * 模拟订单API
   */
  private async mockOrderAPI(): Promise<any> {
    // 这里应该调用真实的API，现在使用模拟数据
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          total: 14209,
          list: [
            {
              batchNum: "W2025101311330202",
              createTime: null,
              orderSimpleVOS: [
                {
                  batchNum: "W2025101311330202",
                  orderCode: "Y11898-5011496A",
                  businessId: 2753578,
                  businessType: "order_pcb",
                  title: "pcbwenjian2(Reorder)_Y11898",
                  settleCurrency: "USD",
                  orderAmount: 15.63,
                  fileAccessId: "8665175429193543680",
                  orderStatus: "inProduce",
                  goodsAmount: 5
                }
              ]
            },
            {
              batchNum: "W2025101311230182",
              createTime: null,
              orderSimpleVOS: [
                {
                  batchNum: "W2025101311230182",
                  orderCode: "SMS2510133000010",
                  businessId: 499851307639836673,
                  businessType: "order_plate_metal",
                  title: "1.STEP",
                  settleCurrency: "USD",
                  orderAmount: 8.22,
                  fileAccessId: "8665284287446663168",
                  orderStatus: "paid",
                  goodsAmount: 1
                },
                {
                  batchNum: "W2025101311230182",
                  orderCode: "SMS2510133000011",
                  businessId: 499851307639836674,
                  businessType: "order_plate_metal",
                  title: "3.STEP",
                  settleCurrency: "USD",
                  orderAmount: 82.43,
                  fileAccessId: "8665284287446663169",
                  orderStatus: "paid",
                  goodsAmount: 1
                }
              ]
            }
          ]
        })
      }, 500)
    })
  }

  /**
   * 模拟购物车API
   */
  private async mockCartAPI(): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          total: 52,
          list: [
            {
              pcbGoods: {
                goodsCode: "Y11899",
                gerberFile: "12321321_Y11899",
                price: 10.53,
                quantity: 5,
                customerCode: "5011496A",
                technologyDiscernNum: "ac1babcbf7de432bbb94b16410e47f78"
              }
            }
          ]
        })
      }, 500)
    })
  }

  /**
   * 处理订单列表数据
   */
  private dealOrderList(list: any[]): OrderBatch[] {
    return list.map(pItem => ({
      batchNum: pItem.batchNum,
      createTime: pItem.createTime,
      orderSimpleVOS: pItem.orderSimpleVOS.map((item: any) => ({
        title: item.title,
        _orderCode: `${item.orderCode}`,
        orderCode: item.orderCode,
        customerCode: '5011496A', // 模拟客户代码
        orderCount: item.goodsAmount,
        batchNum: item.batchNum,
        imgUrl: this.getOrderImageUrl(item),
        orderAmount: `$${item.orderAmount}`,
        businessType: item.businessType,
        source: 'order' as const
      }))
    }))
  }

  /**
   * 处理购物车列表数据
   */
  private dealCartList(list: any[]): OrderItem[] {
    const newList: OrderItem[] = []
    
    for (const item of list) {
      if (item.pcbGoods) {
        newList.push({
          title: item.pcbGoods.gerberFile,
          _orderCode: `${item.pcbGoods.goodsCode}-${item.pcbGoods.customerCode}`,
          orderCode: item.pcbGoods.goodsCode,
          customerCode: item.pcbGoods.customerCode,
          orderCount: item.pcbGoods.quantity,
          imgUrl: this.getPCBImageUrl(item.pcbGoods),
          orderAmount: `$${item.pcbGoods.price}`,
          businessType: 'order_pcb',
          source: 'cart'
        })
      }
      // 可以添加其他商品类型的处理逻辑
    }
    
    return newList
  }

  /**
   * 获取订单图片URL
   */
  private getOrderImageUrl(item: any): string {
    if (item.businessType === 'order_steel') {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iMjAiIHk9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5Ij5TVEVFTDwvdGV4dD48L3N2Zz4='
    }
    return `https://test-pcb.jlcpcb.com/api/overseas-pcb-order/v1/fileCommon/downloadCommonFile?fileAccessId=${item.fileAccessId}`
  }

  /**
   * 获取PCB图片URL
   */
  private getPCBImageUrl(pcbGoods: any): string {
    return `https://test-shop-cart.jlcpcb.com/api/overseas-shop-cart/v1/file/downImg?small=1&uuid=${pcbGoods.technologyDiscernNum}&type=top&color=Green`
  }

  /**
   * 根据批次号获取日期
   */
  private getDateByBatchNum(batchNum: string): string {
    const year = batchNum.slice(1, 5)
    const month = batchNum.slice(5, 7)
    const day = batchNum.slice(7, 9)
    return `${year}-${month}-${day}`
  }
}

// 全局声明
declare global {
  interface Window {
    orderSelector?: OrderSelector
  }
}