/**
 * 简化版订单选择器
 * 直接在底部区域显示，不依赖 bottomCustomDrawer API
 */

interface SimpleOrderItem {
  title: string
  orderCode: string
  orderAmount: string
  businessType: string
}

interface SimpleOrderSelectorState {
  isVisible: boolean
  activeName: 'Orders' | 'Cart'
  keyword: string
  cartList: SimpleOrderItem[]
  orderList: SimpleOrderBatch[]
  loading: boolean
}

interface SimpleOrderBatch {
  batchNum: string
  createTime?: string
  orderSimpleVOS: SimpleOrderItem[]
}

export class SimpleOrderSelector {
  private state: SimpleOrderSelectorState
  private container: HTMLElement | null = null
  private onSendOrderCallback?: (orderItem: SimpleOrderItem) => void

  constructor() {
    this.state = {
      isVisible: false,
      activeName: 'Orders',
      keyword: '',
      cartList: [],
      orderList: [],
      loading: false
    }

    // 绑定全局方法
    if (typeof window !== 'undefined') {
      window.simpleOrderSelector = this
    }
  }

  /**
   * 设置发送订单回调
   */
  setOnSendOrderCallback(callback: (orderItem: SimpleOrderItem) => void): void {
    this.onSendOrderCallback = callback
  }

  /**
   * 挂载到指定容器
   */
  mount(container: HTMLElement): void {
    this.container = container
  }

  /**
   * 切换显示状态
   */
  toggle(): void {
    if (this.state.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 显示订单选择器
   */
  async show(): Promise<void> {
    if (this.state.isVisible || !this.container) return

    this.state.isVisible = true

    // 显示容器并允许事件
    if (this.container) {
      this.container.style.display = 'block'
      this.container.style.pointerEvents = 'auto'
    }

    // 先渲染界面，再加载数据
    this.render()
    await this.initData()
  }

  /**
   * 隐藏订单选择器
   */
  hide(): void {
    if (!this.state.isVisible || !this.container) return

    this.state.isVisible = false

    // 隐藏容器并禁用事件
    if (this.container) {
      this.container.style.display = 'none'
      this.container.style.pointerEvents = 'none'
      this.container.innerHTML = ''
    }
  }

  /**
   * 渲染组件（初始渲染）
   */
  private render(): void {
    if (!this.container || !this.state.isVisible) return

    // 只在初始渲染时创建完整结构
    if (!this.container.querySelector('.simple-order-backdrop')) {
      this.container.innerHTML = `
        ${this.generateStyles()}
        <div class="simple-order-backdrop" onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector) && (window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).hide()">
          <div class="simple-order-popup" onclick="event.stopPropagation()">
            <div class="simple-order-header">
              <span class="simple-order-title">Please Select an Order</span>
              <span class="simple-order-close" onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector) && (window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).hide()">×</span>
            </div>
            
            <div class="simple-order-search">
              <div class="search-wrapper">
                <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <input type="text" 
                       class="search-input" 
                       placeholder="Search order # or filename" 
                       value="${this.state.keyword}"
                       onkeydown="if(event.key==='Enter') (window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).handleSearch()"
                       oninput="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).updateKeyword(this.value)">
                <button class="search-clear-btn ${this.state.keyword ? 'visible' : ''}" 
                        onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).clearSearch()"
                        title="Clear search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="search-btn" onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).handleSearch()">Search</button>
              </div>
            </div>
            
            <div class="simple-order-tabs">
              <div class="tab-item" data-tab="Orders" 
                   onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).switchTab('Orders')">Orders</div>
              <div class="tab-item" data-tab="Cart" 
                   onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).switchTab('Cart')">Cart</div>
            </div>
            
            <div class="simple-order-list">
              <div class="loading">Loading...</div>
            </div>
          </div>
        </div>
      `
    }

    // 更新各个部分
    this.updateSearchInput()
    this.updateTabs()
    this.updateOrderList()
  }

  /**
   * 更新搜索输入框
   */
  private updateSearchInput(): void {
    const searchInput = this.container?.querySelector('.search-input') as HTMLInputElement
    if (searchInput && searchInput.value !== this.state.keyword) {
      searchInput.value = this.state.keyword
    }
  }

  /**
   * 更新清空按钮显示状态
   */
  private updateClearButton(): void {
    const clearBtn = this.container?.querySelector('.search-clear-btn') as HTMLElement
    if (clearBtn) {
      if (this.state.keyword) {
        clearBtn.classList.add('visible')
      } else {
        clearBtn.classList.remove('visible')
      }
    }
  }

  /**
   * 更新标签页状态
   */
  private updateTabs(): void {
    const tabs = this.container?.querySelectorAll('.tab-item')
    tabs?.forEach(tab => {
      const tabElement = tab as HTMLElement
      const tabName = tabElement.getAttribute('data-tab')

      // 添加切换动画
      tabElement.classList.add('switching')

      setTimeout(() => {
        if (tabName === this.state.activeName) {
          tabElement.classList.add('active')
        } else {
          tabElement.classList.remove('active')
        }
        tabElement.classList.remove('switching')
      }, 50)
    })
  }

  /**
   * 更新订单列表
   */
  private updateOrderList(): void {
    const orderListContainer = this.container?.querySelector('.simple-order-list') as HTMLElement
    if (orderListContainer) {
      if (this.state.loading) {
        // 添加更新中的样式
        orderListContainer.classList.add('updating')
        orderListContainer.innerHTML = '<div class="loading">Loading...</div>'
      } else {
        // 平滑更新内容
        orderListContainer.classList.add('updating')

        setTimeout(() => {
          orderListContainer.innerHTML = this.renderOrderList()
          orderListContainer.classList.remove('updating')
        }, 100) // 短暂延迟让过渡效果更明显
      }
    }
  }

  /**
   * 更新搜索关键词
   */
  updateKeyword(keyword: string): void {
    this.state.keyword = keyword
    this.updateClearButton()
    // 不需要重新渲染，输入框已经自动更新
  }

  /**
   * 清空搜索
   */
  clearSearch(): void {
    this.state.keyword = ''
    this.updateSearchInput()
    this.updateClearButton()
    this.handleSearch() // 自动执行搜索以显示所有结果
  }

  /**
   * 处理搜索
   */
  async handleSearch(): Promise<void> {
    this.state.loading = true
    this.updateOrderList() // 只更新订单列表部分

    // 添加短暂延迟以改善用户体验
    await new Promise(resolve => setTimeout(resolve, 300))
    await this.loadData()
  }

  /**
   * 切换标签页
   */
  async switchTab(tabName: 'Orders' | 'Cart'): Promise<void> {
    if (this.state.activeName === tabName) return // 避免重复切换

    this.state.activeName = tabName
    this.updateTabs() // 只更新标签页状态
    await this.loadData() // 加载对应的数据
  }

  /**
   * 初始化数据
   */
  private async initData(): Promise<void> {
    await this.loadData()
  }

  /**
   * 加载数据
   */
  private async loadData(): Promise<void> {
    this.state.loading = true
    this.updateOrderList() // 只更新订单列表显示加载状态

    try {
      if (this.state.activeName === 'Orders') {
        await this.loadOrdersData()
      } else {
        await this.loadCartData()
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      // 降级到模拟数据
      if (this.state.activeName === 'Orders') {
        this.state.orderList = this.getMockOrderBatches()
      } else {
        this.state.cartList = this.getMockCartItems()
      }
    } finally {
      this.state.loading = false
      this.updateOrderList() // 只更新订单列表显示数据
    }
  }

  /**
   * 加载订单数据
   */
  private async loadOrdersData(): Promise<void> {
    const params = new URLSearchParams()
    if (this.state.keyword) {
      params.append('keyword', this.state.keyword)
    }
    params.append('pageNum', '1')
    params.append('pageSize', '20')

    const response = await fetch(`/api/simple-orders?${params.toString()}`)
    const result = await response.json()

    if (result.success && result.data && result.data.list) {
      this.state.orderList = this.transformOrdersData(result.data.list)
    } else {
      throw new Error('Invalid orders data format')
    }
  }

  /**
   * 加载购物车数据
   */
  private async loadCartData(): Promise<void> {
    const params = new URLSearchParams()
    if (this.state.keyword) {
      params.append('keyword', this.state.keyword)
    }

    const response = await fetch(`/api/shopping-cart?${params.toString()}`)
    const result = await response.json()

    if (result.code === 200 && result.data && result.data.list) {
      this.state.cartList = this.transformCartData(result.data.list)
    } else {
      throw new Error('Invalid cart data format')
    }
  }

  /**
   * 转换订单数据格式
   */
  private transformOrdersData(orderBatches: any[]): SimpleOrderBatch[] {
    return orderBatches.map(batch => ({
      batchNum: batch.batchNum,
      createTime: batch.createTime,
      orderSimpleVOS: batch.orderSimpleVOS.map((order: any) => ({
        title: order.title,
        orderCode: order.orderCode,
        orderAmount: `$${order.orderAmount}`,
        businessType: order.businessType
      }))
    }))
  }

  /**
   * 转换购物车数据格式
   */
  private transformCartData(cartItems: any[]): SimpleOrderItem[] {
    return cartItems.map(item => {
      let title = ''
      let orderCode = ''
      let price = 0
      let businessType = ''

      // 根据不同的商品类型提取数据
      if (item.pcbGoods) {
        title = item.pcbGoods.gerberFile || item.pcbGoods.goodsCode || 'PCB Product'
        orderCode = item.pcbGoods.goodsCode
        price = item.pcbGoods.price || 0
        businessType = 'order_pcb'
      } else if (item.steelmeshGoods) {
        title = item.steelmeshGoods.gerberFile || item.steelmeshGoods.goodsCode || 'Steel Mesh Product'
        orderCode = item.steelmeshGoods.goodsCode
        price = item.steelmeshGoods.price || 0
        businessType = 'order_steel'
      } else if (item.flexHeaterGoods) {
        title = item.flexHeaterGoods.gerberFile || item.flexHeaterGoods.goodsCode || 'Flex Heater Product'
        orderCode = item.flexHeaterGoods.goodsCode
        price = item.flexHeaterGoods.price || 0
        businessType = 'order_flexheater'
      } else if (item.smtGoods) {
        title = item.smtGoods.gerberFile || item.smtGoods.goodsCode || 'SMT Product'
        orderCode = item.smtGoods.goodsCode
        price = item.smtGoods.price || 0
        businessType = 'order_smt'
      } else if (item.tdpGoods) {
        title = item.tdpGoods.gerberFile || item.tdpGoods.goodsCode || '3D Printing Product'
        orderCode = item.tdpGoods.goodsCode
        price = item.tdpGoods.price || 0
        businessType = 'order_tdp'
      } else if (item.cncGoods) {
        title = item.cncGoods.gerberFile || item.cncGoods.goodsCode || 'CNC Product'
        orderCode = item.cncGoods.goodsCode
        price = item.cncGoods.price || 0
        businessType = 'order_cnc'
      } else if (item.plateMetalGoods) {
        title = item.plateMetalGoods.gerberFile || item.plateMetalGoods.goodsCode || 'Plate Metal Product'
        orderCode = item.plateMetalGoods.goodsCode
        price = item.plateMetalGoods.price || 0
        businessType = 'order_plate_metal'
      }

      return {
        title,
        orderCode,
        orderAmount: `$${price.toFixed(2)}`,
        businessType
      }
    }).filter(item => item.orderCode) // 过滤掉没有订单编码的项目
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
      return '<div class="no-data">No items in cart</div>'
    }

    return this.state.cartList.map(item => `
      <div class="simple-order-item" onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).selectOrder('${item.orderCode}')">
        <div class="order-image">
          <img src="${this.getOrderImageUrl(item)}" alt="${item.title}" onerror="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).handleImageError(this)" loading="lazy">
        </div>
        <div class="simple-order-info">
          <div class="simple-order-name">${item.title}</div>
          <div class="simple-order-code">Order #: ${item.orderCode}</div>
          <div class="simple-order-amount">${item.orderAmount}</div>
        </div>
        <button class="send-btn" onclick="event.stopPropagation(); (window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).selectOrder('${item.orderCode}')">Send</button>
      </div>
    `).join('')
  }

  /**
   * 渲染订单列表
   */
  private renderOrdersList(): string {
    if (this.state.orderList.length === 0) {
      return '<div class="no-data">No orders found</div>'
    }

    return this.state.orderList.map(batch => `
      <div class="order-batch">
        <div class="batch-header">
          <span class="batch-num">${batch.batchNum}</span>
          <span class="batch-date">${this.getDateByBatchNum(batch.batchNum)}</span>
        </div>
        <div class="batch-orders">
          ${batch.orderSimpleVOS.map(item => `
            <div class="simple-order-item" onclick="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).selectOrder('${item.orderCode}')">
              <div class="order-image">
                <img src="${this.getOrderImageUrl(item)}" alt="${item.title}" onerror="(window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).handleImageError(this)" loading="lazy">
              </div>
              <div class="simple-order-info">
                <div class="simple-order-name">${item.title}</div>
                <div class="simple-order-code">Order #: ${item.orderCode}</div>
                <div class="simple-order-amount">${item.orderAmount}</div>
              </div>
              <button class="send-btn" onclick="event.stopPropagation(); (window.parent && window.parent.simpleOrderSelector ? window.parent.simpleOrderSelector : window.simpleOrderSelector).selectOrder('${item.orderCode}')">Send</button>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')
  }

  /**
   * 获取模拟订单批次数据
   */
  private getMockOrderBatches(): SimpleOrderBatch[] {
    const keyword = this.state.keyword.toLowerCase()
    const allBatches = [
      {
        batchNum: "W2025101311330202",
        createTime: "2025-10-13",
        orderSimpleVOS: [
          {
            title: "pcbwenjian2(Reorder)_Y11898",
            orderCode: "Y11898-5011496A",
            orderAmount: "$15.63",
            businessType: "order_pcb"
          },
          {
            title: "pcbwenjian2(Reorder)_Y11899",
            orderCode: "SMT025101360000",
            orderAmount: "$10071.05",
            businessType: "order_smt"
          }
        ]
      },
      {
        batchNum: "W2025101311230182",
        createTime: "2025-10-13",
        orderSimpleVOS: [
          {
            title: "1.STEP",
            orderCode: "SMS2510133000010",
            orderAmount: "$8.22",
            businessType: "order_plate_metal"
          },
          {
            title: "3.STEP",
            orderCode: "SMS2510133000011",
            orderAmount: "$82.43",
            businessType: "order_plate_metal"
          }
        ]
      },
      {
        batchNum: "W2025101117310524",
        createTime: "2025-10-11",
        orderSimpleVOS: [
          {
            title: "dan1.STEP",
            orderCode: "SMS2510113000010",
            orderAmount: "$27.84",
            businessType: "order_plate_metal"
          }
        ]
      }
    ]

    // 如果有搜索关键词，进行过滤
    if (keyword) {
      return allBatches.map(batch => ({
        ...batch,
        orderSimpleVOS: batch.orderSimpleVOS.filter(order =>
          order.title.toLowerCase().includes(keyword) ||
          order.orderCode.toLowerCase().includes(keyword)
        )
      })).filter(batch => batch.orderSimpleVOS.length > 0)
    }

    return allBatches
  }

  /**
   * 获取模拟购物车数据
   */
  private getMockCartItems(): SimpleOrderItem[] {
    const keyword = this.state.keyword.toLowerCase()
    const allItems = [
      {
        title: "pcbwenjian2(Reorder)_Y11899",
        orderCode: "Y11899-5011496A",
        orderAmount: "$10.53",
        businessType: "order_pcb"
      },
      {
        title: "DEFdemo1-SO12510116003",
        orderCode: "SO12510116003",
        orderAmount: "$12.44",
        businessType: "order_steel"
      },
      {
        title: "pcbwenjian2(Reorder)_Y11900",
        orderCode: "SMT025101360001",
        orderAmount: "$10071.05",
        businessType: "order_smt"
      },
      {
        title: "PNG.png",
        orderCode: "FH2025101049500006",
        orderAmount: "$5.55",
        businessType: "order_flexheater"
      },
      {
        title: "dan1.STEP",
        orderCode: "SMS2510113000012",
        orderAmount: "$27.84",
        businessType: "order_plate_metal"
      }
    ]

    // 如果有搜索关键词，进行过滤
    if (keyword) {
      return allItems.filter(item =>
        item.title.toLowerCase().includes(keyword) ||
        item.orderCode.toLowerCase().includes(keyword)
      )
    }

    return allItems
  }

  /**
   * 获取订单图片URL
   */
  private getOrderImageUrl(item: SimpleOrderItem): string {
    console.log(item)
    return 'https://test.jlcpcb.com/api/overseas-pcb-order/v1/fileCommon/downloadCommonFile?fileAccessId=8667440297175171072'
    // 尝试获取真实的图片URL，如果没有则返回默认图片
    const realImageUrl = this.getRealImageUrl(item)
    if (realImageUrl) {
      return realImageUrl
    }

    // 根据业务类型返回不同的默认图片
    return this.getDefaultImageByType(item.businessType)
  }

  /**
   * 获取真实图片URL（这里可以根据实际业务逻辑获取）
   */
  private getRealImageUrl(item: SimpleOrderItem): string | null {
    // 这里可以根据订单编码或其他信息构建真实的图片URL
    // 例如：return `/api/order-images/${item.orderCode}.jpg`
    // 暂时返回null，使用默认图片
    return null
  }

  /**
   * 根据业务类型获取默认图片 - 统一使用 JLCPCB 水印样式 09fca30
   */
  private getDefaultImageByType(businessType: string): string {
    // 所有类型都使用相同的 JLCPCB 水印样式
    return this.getJLCPCBPlaceholder()
  }

  /**
   * 获取 JLCPCB 水印占位符图片
   */
  private getJLCPCBPlaceholder(): string {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="56" height="56" fill="#eef2f6"/>
        <defs>
          <pattern id="jlcpcb-pattern" x="0" y="0" width="56" height="56" patternUnits="userSpaceOnUse">
            <text x="28" y="32" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" font-style="italic" fill="#c0c0c0" opacity="0.6">JLCPCB</text>
          </pattern>
        </defs>
        <rect width="56" height="56" fill="url(#jlcpcb-pattern)"/>
      </svg>
    `)
  }

  /**
   * 获取加载失败时的占位符图片 - 使用相同的 JLCPCB 水印样式
   */
  private getErrorPlaceholder(): string {
    // 加载失败时也使用相同的 JLCPCB 水印样式
    return this.getJLCPCBPlaceholder()
  }

  /**
   * 处理图片加载错误
   */
  handleImageError(imgElement: HTMLImageElement): void {
    if (imgElement && !imgElement.dataset.errorHandled) {
      imgElement.dataset.errorHandled = 'true'
      imgElement.src = this.getErrorPlaceholder()
    }
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

  /**
   * 选择订单
   */
  selectOrder(orderCode: string): void {
    let selectedOrder: SimpleOrderItem | undefined

    if (this.state.activeName === 'Cart') {
      selectedOrder = this.state.cartList.find(order => order.orderCode === orderCode)
    } else {
      // 在订单批次中查找
      for (const batch of this.state.orderList) {
        selectedOrder = batch.orderSimpleVOS.find(order => order.orderCode === orderCode)
        if (selectedOrder) break
      }
    }

    if (selectedOrder && this.onSendOrderCallback) {
      this.onSendOrderCallback(selectedOrder)
      this.hide()
    }
  }

  /**
   * 生成样式
   */
  private generateStyles(): string {
    return `
      <style>
        .simple-order-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.5) 50%,
            rgba(0, 0, 0, 0.7) 100%
          );
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          z-index: 1000;
          animation: fadeInBackdrop 0.3s ease-out;
          display: flex;
          align-items: flex-end;
          border-radius: 16px;
          border-top-left-radius: initial;
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

        .simple-order-popup {
          width: 100%;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 16px 16px 0 0;
          box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
          height: 85%;
          overflow: hidden;
          z-index: 1001;
          animation: slideUpSimple 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          pointer-events: auto;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .simple-order-popup::before {
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

        @keyframes slideUpSimple {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .simple-order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 16px 12px 16px;
          background: #fff;
          position: relative;
        }

        .simple-order-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .simple-order-close {
          cursor: pointer;
          font-size: 21px;
          color: #333;
          font-weight: bold;
        }

        .simple-order-close:hover {
        }

        .simple-order-search {
          padding: 0 12px;
        }

        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .search-wrapper:focus-within {
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 8px;
          z-index: 1;
          pointer-events: none;
        }

        .search-input {
          flex: 1;
          padding: 8px 40px 8px 32px;
          border: none;
          outline: none;
          font-size: 14px;
          color: #333;
        }

        .search-input::placeholder {
          color: #999;
        }

        .search-clear-btn {
          position: absolute;
          right: 80px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 2;
        }

        .search-clear-btn:hover {
          background: #f0f0f0;
        }

        .search-clear-btn:active {
          background: #e0e0e0;
        }

        .search-clear-btn.visible {
          opacity: 1;
          visibility: visible;
        }

        .search-clear-btn svg {
          pointer-events: none;
        }

        .search-btn {
          padding: 8px 12px;
          background: #444;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }

        .search-btn:hover {
          background: #333;
        }

        .search-btn:active {
          background: #222;
        }

        .simple-order-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          margin: 0 12px;
          margin-bottom: 15px;
        }

        .tab-item {
          flex: 1;
          padding: 12px 16px;
          text-align: center;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          color: #666;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab-item.active {
          color: #007bff;
          border-bottom-color: #007bff;
        }

        .tab-item:hover:not(.active) {
          color: #333;
          background: #f8f9fa;
        }

        .tab-item.switching {
          opacity: 0.6;
        }

        .simple-order-list {
          overflow-y: auto;
          transition: opacity 0.2s ease;
          flex: 1;
          padding: 0 12px;
        }

        .simple-order-list.updating {
          opacity: 0.6;
        }

        .simple-order-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 15px;
        }

        .simple-order-item:hover {
          background-color: #f8f9fa;
        }

        .simple-order-item:last-child {
          border-bottom: none;
        }

        .simple-order-info {
          flex: 1;
          min-width: 0;
        }

        .simple-order-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .simple-order-code {
          font-size: 14px;
          color: #666;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .simple-order-amount {
          font-size: 14px;
          color: #666;
        }

        .order-batch {
        }

        .batch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e0e0e0;
          font-size: 14px;
          margin-bottom: 8px;
          padding-bottom: 5px;
        }

        .batch-num {
          color: #333;
        }

        .batch-date {
          color: #666;
          font-weight: normal;
          font-size: 12px;
        }

        .batch-orders {
          background: white;
        }

        .order-image {
          flex-shrink: 0;
          margin-right: 12px;
          position: relative;
          overflow: hidden;
          border-radius: 0px;
          background: #eef2f6;
          border: 1px solid #e9ecef;
        }

        .order-image img {
          width: 56px;
          height: 56px;
          object-fit: cover;
          display: block;
          transition: transform 0.2s ease, opacity 0.2s ease;
          border-radius: 0px;
        }

        .order-image img:hover {
          transform: scale(1.05);
        }

        .order-image img[data-error-handled="true"] {
          object-fit: contain;
          background: #f5f5f5;
        }

        /* 图片加载状态 */
        .order-image::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          z-index: 1;
          opacity: 0;
          pointer-events: none;
        }

        .order-image img:not([src*="data:image"]):not([complete]) + ::before {
          opacity: 1;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .send-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 16px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: background-color 0.2s;
          margin-left: 12px;
        }

        .send-btn:hover {
          background: #0056b3;
        }

        .loading {
          text-align: center;
          padding: 40px 20px;
          color: #666;
          font-size: 14px;
        }

        .no-data {
          text-align: center;
          padding: 40px 20px;
          color: #999;
          font-size: 14px;
        }

        /* 滚动条样式 */
        .simple-order-list::-webkit-scrollbar {
          width: 4px;
        }

        .simple-order-list::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .simple-order-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .simple-order-list::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      </style>
    `
  }
}

// 全局声明
declare global {
  interface Window {
    simpleOrderSelector?: SimpleOrderSelector
  }
}