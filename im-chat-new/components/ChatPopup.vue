<template>
  <div class="chat-popup" @click.self="closePopup">
    <div class="chat-popup-container" :class="{ 'slide-down': isClosing }">
      <div class="chat-popup-cate">
        <div class="chat-popup-header">
          <strong class="chat-popup-title">Please Select an Order</strong>
          <img class="chat-popup-close" src="../imgs/win-close.svg" @click="closePopup" />
        </div>
        <div class="chat-search-wrapper">
          <el-input
            v-model="keyword"
            placeholder="Search order # or filename"
            class="chat-search-input"
            @keydown.native.enter="handleSearch"
          >
            <div slot="append" class="chat-search-btn" @click="handleSearch">Search</div>
          </el-input>
          <i class="el-icon-search chat-search-icon"></i>
        </div>
        <el-tabs v-model="activeName" @tab-click="handleTabClick">
          <el-tab-pane label="Orders" name="Orders"></el-tab-pane>
          <el-tab-pane label="Cart" name="Cart"></el-tab-pane>
        </el-tabs>
      </div>
      <div v-show="activeName === 'Cart'" class="chat-order-list">
        <template v-if="cartList && cartList.length">
          <div v-for="item of cartList" :key="item._orderCode" class="chat-order-list-item">
            <div class="chat-order-list-info">
              <ChatOrderItem :order-item="item" />
            </div>
            <div class="chat-order-send">
              <el-button type="primary" size="medium" round @click="$emit('sendOrder', item)">Send</el-button>
            </div>
          </div>
        </template>
        <ChatNoOrder v-else></ChatNoOrder>
      </div>
      <div v-show="activeName === 'Orders'" class="chat-order-list">
        <template v-if="orderList && orderList.length">
          <div v-for="item of orderList" :key="item.batchNum">
            <div class="chat-order-batch">
              <span>
                {{ item.batchNum }}
              </span>
              <span class="chat-order-batch-date">
                {{ getDateByBatchNum(item.batchNum) }}
              </span>
            </div>
            <div>
              <div v-for="itemChild of item.orderSimpleVOS" :key="itemChild._orderCode" class="chat-order-list-item">
                <div class="chat-order-list-info">
                  <ChatOrderItem :order-item="itemChild" />
                </div>
                <div class="chat-order-send">
                  <el-button type="primary" size="medium" round @click="$emit('sendOrder', itemChild)">Send</el-button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <ChatNoOrder v-else></ChatNoOrder>
      </div>
      <ChatLoading v-if="orderListLoading" />
    </div>
  </div>
</template>

<script setup lang="ts">
  /* eslint-disable no-case-declarations */
  import { ref } from 'vue'
  import debounce from 'lodash/debounce'
  import { SearchOrderType } from '../types'
  import ChatOrderItem from './ChatOrderItem.vue'
  import ChatLoading from './ChatLoading.vue'
  import ChatNoOrder from './ChatNoOrder.vue'
  import { imShoppingCartPage, orderCenterSimpleOrder } from '#shared/apis'
  import { getEnvConfig } from '#shared/utils'
  import { OVERSEAS_PCB_ORDER_SERVER, OVERSEAS_SHOP_CART } from '#shared/apis/prefix'
  import { useInfo, useRateList } from '#shared/hooks'

  const isClosing = ref(false)
  const envConfig = getEnvConfig()
  const userInfo = useInfo()
  const rateList = useRateList()
  const activeName = ref<SearchOrderType>('Orders')

  const keyword = ref('') // 订单号或者文件名查询
  let cartPageNum = 1 // 购物车当前页号
  let orderPageNum = 1 // 订单当前页号
  const cartList = ref<any[]>([]) // 购物车列表
  const orderList = ref<any[]>([]) // 订单列表
  let cartListTotal = 0
  let orderListTotal = 0
  const pageSize = 12
  const orderListLoading = ref(false)
  const emit = defineEmits(['close', 'sendOrder'])
  const closePopup = () => {
    isClosing.value = true
    setTimeout(() => {
      emit('close')
      isClosing.value = false
    }, 300)
  }

  function loadMoreOrder() {
    if (orderList.value.length < orderListTotal) {
      orderPageNum++
      getOrderList()
    }
  }
  function loadMoreCart() {
    if (cartList.value.length < cartListTotal) {
      cartPageNum++
      getCartList()
    }
  }

  // 获取订单数据
  const getOrderList = async () => {
    orderListLoading.value = true
    try {
      const data = await orderCenterSimpleOrder({ pageNum: orderPageNum, pageSize, qryCondition: keyword.value })
      orderListTotal = data.total
      const list = dealOrderList(data.list)
      orderList.value.push(...list)
    } catch (err) {
      console.log(err)
    }
    orderListLoading.value = false
  }

  // 获取购物车数据
  const getCartList = async () => {
    orderListLoading.value = true
    try {
      const data = await imShoppingCartPage({
        expired: false,
        pageNum: cartPageNum,
        pageSize,
        keyWord: keyword.value,
        type: 'ALL'
      })
      cartListTotal = data.total
      const list = dealCartList(data.list)
      cartList.value.push(...list)
    } catch (err) {
      console.log(err)
    }
    orderListLoading.value = false
  }

  // 搜索
  const handleSearch = debounce(function handleSearch() {
    switch (activeName.value) {
      case 'Cart':
        cartListTotal = 0
        cartPageNum = 1
        cartList.value = []
        getCartList()
        break
      case 'Orders':
        orderListTotal = 0
        orderPageNum = 1
        orderList.value = []
        getOrderList()
        break
    }
  }, 100)

  function dealOrderList(list: any[]) {
    const newList = []
    for (const pItem of list) {
      const newItem: any = {
        batchNum: pItem.batchNum,
        createTime: pItem.createTime,
        orderSimpleVOS: []
      }
      for (const item of pItem.orderSimpleVOS) {
        const { fileAccessId, businessType, title, orderCode, goodsAmount, orderAmount, batchNum, settleCurrency } =
          item
        let imgUrl = ''
        switch (businessType) {
          case 'order_steel':
            imgUrl = `${envConfig.PCB_BASE_URL}/images/cart_steel.png`
            break
          default:
            imgUrl = `${envConfig.PCB_BASE_URL}/api${OVERSEAS_PCB_ORDER_SERVER}/v1/fileCommon/downloadCommonFile?fileAccessId=${fileAccessId}`
        }
        const rateRes = rateList.value.find((rateItem) => rateItem.afterCountryCode === settleCurrency)
        const afterCountryName = rateRes ? rateRes.afterCountryName : '$'
        newItem.orderSimpleVOS.push({
          title,
          _orderCode: `${orderCode}-${userInfo.value.customerCode}`,
          orderCode,
          customerCode: userInfo.value.customerCode,
          orderCount: goodsAmount,
          batchNum,
          imgUrl,
          orderAmount: `${afterCountryName}${orderAmount}`,
          businessType,
          source: 'order'
        })
      }
      newList.push(newItem)
    }
    return newList
  }

  function dealCartList(list: any[]) {
    const newList = []
    for (const item of list) {
      switch (true) {
        case !!item.cncGoods:
          const fileModelInfo = item.cncGoods.cncGoodsVO.fileModelInfo
          const cncGoodsVO = item.cncGoods.cncGoodsVO
          newList.push({
            title: fileModelInfo.fileName3D || fileModelInfo.fileName2D,
            _orderCode: `${item.cncGoods.goodsCode}-${item.cncGoods.customerCode}`,
            orderCode: item.cncGoods.goodsCode,
            orderCount: cncGoodsVO.goodsQuantity,
            customerCode: item.cncGoods.customerCode,
            imgUrl: `${envConfig.SHOP_CART_BASE_URL}/api${OVERSEAS_SHOP_CART}/v1/tdpFile/downloadTdpFile?fileAccessId=${fileModelInfo.thumbnailAccessId}`,
            orderAmount: cncGoodsVO.goodsPrice > 0 ? `$${cncGoodsVO.goodsPrice}` : 'Manual Quote',
            businessType: 'order_cnc',
            source: 'cart'
          })
          break
        case !!item.faGoods:
          const faGoodsVO = item.faGoods.faGoodsVO
          newList.push({
            title: faGoodsVO.productNameEn,
            _orderCode: faGoodsVO.productModelNumber,
            orderCode: faGoodsVO.productModelNumber,
            customerCode: userInfo.value.customerCode,
            orderCount: faGoodsVO.goodsQuantity,
            imgUrl: `${envConfig.SHOP_CART_BASE_URL}/api${OVERSEAS_SHOP_CART}/v1/file/downloadImageByFileAccessId?fileAccessId=${faGoodsVO.productImage}`,
            orderAmount: `$${faGoodsVO.goodsPrice}`,
            businessType: 'order_fa',
            source: 'cart'
          })
          break
        case !!item.pcbGoods:
          newList.push({
            title: item.pcbGoods.gerberFile,
            _orderCode: `${item.pcbGoods.goodsCode}-${item.pcbGoods.customerCode}`,
            orderCode: item.pcbGoods.goodsCode,
            customerCode: item.pcbGoods.customerCode,
            orderCount: item.pcbGoods.quantity,
            imgUrl: `${envConfig.SHOP_CART_BASE_URL}/api${OVERSEAS_SHOP_CART}/v1/file/downImg?small=1&uuid=${
              item.pcbGoods.technologyDiscernNum
            }&type=top&color=${item.pcbGoods.fpcAdornColor || item.pcbGoods.adornColor}`,
            orderAmount: `$${item.pcbGoods.price}`,
            businessType: 'order_pcb',
            source: 'cart'
          })
          break
        case !!item.smtGoods:
          newList.push({
            title: item.smtGoods.gerberFile,
            _orderCode: `${item.smtGoods.smtGoodsVo.smtGoodsCode}-${item.smtGoods.customerCode}`,
            orderCode: item.smtGoods.smtGoodsVo.smtGoodsCode,
            customerCode: item.smtGoods.customerCode,
            orderCount: item.smtGoods.quantity,
            imgUrl:
              item.smtGoods.patchLocation === 'TB'
                ? `${envConfig.SHOP_CART_BASE_URL}/api${OVERSEAS_SHOP_CART}/v1/file/downloadPatchImgFile?layer=top&downloadType=good&uuid=${item.smtGoods.shoppingCartAccessId}`
                : `${envConfig.SHOP_CART_BASE_URL}/api${OVERSEAS_SHOP_CART}/v1/file/downloadPatchImgFile?downloadType=good&uuid=${item.smtGoods.shoppingCartAccessId}`,
            orderAmount: `$${item.smtGoods.price}`,
            businessType: 'order_smt',
            source: 'cart'
          })
          break
        case !!item.steelmeshGoods:
          newList.push({
            title: item.steelmeshGoods.gerberFile,
            _orderCode: `${item.steelmeshGoods.goodsCode}-${item.steelmeshGoods.customerCode}`,
            orderCode: item.steelmeshGoods.goodsCode,
            customerCode: item.steelmeshGoods.customerCode,
            orderCount: item.steelmeshGoods.quantity,
            imgUrl: '',
            orderAmount: item.steelmeshGoods.price === 2 ? `$5` : `$${item.steelmeshGoods.price}`,
            businessType: 'order_steel',
            source: 'cart'
          })
          break
        case !!item.tdpGoods:
          newList.push({
            title: item.tdpGoods.tdpGoodsVO.fileName,
            _orderCode: `${item.tdpGoods.goodsCode}-${item.tdpGoods.customerCode}`,
            orderCode: item.tdpGoods.goodsCode,
            customerCode: item.tdpGoods.customerCode,
            orderCount: item.tdpGoods.quantity,
            imgUrl: `${envConfig.SHOP_CART_BASE_URL}/api${OVERSEAS_SHOP_CART}/v1/tdpFile/downloadTdpFile?fileAccessId=${item.tdpGoods.tdpGoodsVO.thumbnailUrl}`,
            orderAmount: `$${item.tdpGoods.price}`,
            businessType: 'order_tdp',
            source: 'cart'
          })
          break
      }
    }
    return newList
  }

  function initList() {
    getOrderList()
    getCartList()
  }

  defineExpose({
    initList
  })

  function getDateByBatchNum(batchNum: string) {
    const year = batchNum.slice(1, 5)
    const month = batchNum.slice(5, 7)
    const day = batchNum.slice(7, 9)
    return `${year}-${month}-${day}`
  }

  const handleTabClick = () => {
    console.log(activeName.value)
  }
</script>

<style scoped lang="scss">
  .chat-order-batch-date {
    color: #999;
  }
  .chat-order-batch {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #e6eaf1;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }
  .chat-order-list-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }

  .chat-order-list-info {
    flex: 1;
  }

  .chat-order-list {
    overflow: auto;
    padding: 0 12px;
    flex: 1;
    font-size: 14px;
  }

  .chat-search-icon {
    position: absolute;
    top: 6px;
    left: 8px;
    font-size: 22px;
    color: #999;
  }

  .chat-search-wrapper {
    position: relative;
  }

  .chat-search-input {
    height: 34px;

    .chat-search-btn {
      height: 33px;
      line-height: 33px;
      padding: 0 8px;
    }

    :deep(.el-input__inner) {
      height: 34px;
      line-height: 34px;
      padding-left: 36px;
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    :deep(.el-input-group__append) {
      cursor: pointer;
      padding: 0px;
      color: #fff;
      background-color: #444444;
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      overflow: hidden;
    }
  }

  .chat-popup-header {
    line-height: 18px;
    padding: 10px;

    .chat-popup-title {
      font-size: 16px;
    }

    .chat-popup-close {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
    }
  }

  .chat-popup {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 99;
    background-color: rgba($color: #000000, $alpha: 0.65);
  }
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  /* 关闭时的动画 */
  @keyframes slideDown {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(100%);
    }
  }

  .chat-popup-container {
    height: 608px;
    width: 100%;
    background-color: #fff;
    position: absolute;
    left: 0;
    bottom: 0;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
    .chat-popup-cate {
      padding: 12px 12px 0 12px;
    }

    /* 应用关闭动画 */
    &.slide-down {
      animation: slideDown 0.3s ease-out;
    }
  }
</style>
