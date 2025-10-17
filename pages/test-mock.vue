<template>
  <div class="test-mock-page">
    <h1>Mock 服务测试页面</h1>
    
    <div class="test-section">
      <h2>购物车数据测试</h2>
      <div class="controls">
        <input 
          v-model="cartKeyword" 
          placeholder="搜索购物车商品..."
          @keyup.enter="testCartApi"
        />
        <button @click="testCartApi" :disabled="cartLoading">
          {{ cartLoading ? '加载中...' : '测试购物车 API' }}
        </button>
      </div>
      
      <div v-if="cartError" class="error">
        错误: {{ cartError }}
      </div>
      
      <div v-if="cartData" class="result">
        <h3>购物车数据 (共 {{ cartData.data?.total || 0 }} 项)</h3>
        <div class="items">
          <div 
            v-for="(item, index) in cartData.data?.list?.slice(0, 5)" 
            :key="index"
            class="item"
          >
            <div class="item-info">
              <div class="title">{{ getCartItemTitle(item) }}</div>
              <div class="code">{{ getCartItemCode(item) }}</div>
              <div class="price">${{ getCartItemPrice(item) }}</div>
              <div class="type">{{ getCartItemType(item) }}</div>
              <div class="image-info">
                <div class="image-id">图片ID: {{ getCartItemImageId(item) || '无' }}</div>
                <div class="image-url">图片地址: {{ getCartItemImageUrl(item) || '无' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>订单批次数据测试</h2>
      <div class="controls">
        <input 
          v-model="orderKeyword" 
          placeholder="搜索订单..."
          @keyup.enter="testOrderApi"
        />
        <button @click="testOrderApi" :disabled="orderLoading">
          {{ orderLoading ? '加载中...' : '测试订单 API' }}
        </button>
      </div>
      
      <div v-if="orderError" class="error">
        错误: {{ orderError }}
      </div>
      
      <div v-if="orderData" class="result">
        <h3>订单数据 (共 {{ orderData.data?.total || 0 }} 批次)</h3>
        <div class="batches">
          <div 
            v-for="batch in orderData.data?.list?.slice(0, 3)" 
            :key="batch.batchNum"
            class="batch"
          >
            <div class="batch-header">
              <span class="batch-num">{{ batch.batchNum }}</span>
              <span class="batch-date">{{ getDateByBatchNum(batch.batchNum) }}</span>
            </div>
            <div class="batch-orders">
              <div 
                v-for="order in batch.orderSimpleVOS" 
                :key="order.orderCode"
                class="order"
              >
                <div class="order-title">{{ order.title }}</div>
                <div class="order-code">{{ order.orderCode }}</div>
                <div class="order-amount">${{ order.orderAmount }}</div>
                <div class="order-type">{{ order.businessType }}</div>
                <div class="image-info">
                  <div class="image-id">图片ID: {{ order.fileAccessId || '无' }}</div>
                  <div class="image-url">图片地址: {{ order.fileAccessId ? buildImageUrl(order.fileAccessId) : '无' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>SimpleOrderSelector 测试</h2>
      <div class="controls">
        <button @click="testSimpleOrderSelector">测试 SimpleOrderSelector</button>
        <div id="simple-order-container" class="selector-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 购物车测试
const cartKeyword = ref('')
const cartLoading = ref(false)
const cartError = ref('')
const cartData = ref<any>(null)

// 订单测试
const orderKeyword = ref('')
const orderLoading = ref(false)
const orderError = ref('')
const orderData = ref<any>(null)

// 测试购物车 API
const testCartApi = async () => {
  cartLoading.value = true
  cartError.value = ''
  cartData.value = null
  
  try {
    const params = new URLSearchParams()
    if (cartKeyword.value) {
      params.append('keyword', cartKeyword.value)
    }
    
    const response = await fetch(`/api/shopping-cart?${params.toString()}`)
    const result = await response.json()
    
    if (response.ok) {
      cartData.value = result
    } else {
      cartError.value = result.message || '请求失败'
    }
  } catch (error) {
    cartError.value = error instanceof Error ? error.message : '网络错误'
  } finally {
    cartLoading.value = false
  }
}

// 测试订单 API
const testOrderApi = async () => {
  orderLoading.value = true
  orderError.value = ''
  orderData.value = null
  
  try {
    const params = new URLSearchParams()
    if (orderKeyword.value) {
      params.append('keyword', orderKeyword.value)
    }
    params.append('pageNum', '1')
    params.append('pageSize', '10')
    
    const response = await fetch(`/api/simple-orders?${params.toString()}`)
    const result = await response.json()
    
    if (response.ok) {
      orderData.value = result
    } else {
      orderError.value = result.message || '请求失败'
    }
  } catch (error) {
    orderError.value = error instanceof Error ? error.message : '网络错误'
  } finally {
    orderLoading.value = false
  }
}

// 辅助函数
const getCartItemTitle = (item: any) => {
  if (item.pcbGoods) return item.pcbGoods.gerberFile || item.pcbGoods.goodsCode || 'PCB Product'
  if (item.steelmeshGoods) return item.steelmeshGoods.gerberFile || item.steelmeshGoods.goodsCode || 'Steel Mesh'
  if (item.flexHeaterGoods) return item.flexHeaterGoods.gerberFile || item.flexHeaterGoods.goodsCode || 'Flex Heater'
  return 'Unknown Product'
}

const getCartItemCode = (item: any) => {
  if (item.pcbGoods) return item.pcbGoods.goodsCode
  if (item.steelmeshGoods) return item.steelmeshGoods.goodsCode
  if (item.flexHeaterGoods) return item.flexHeaterGoods.goodsCode
  return 'N/A'
}

const getCartItemPrice = (item: any) => {
  if (item.pcbGoods) return item.pcbGoods.price?.toFixed(2) || '0.00'
  if (item.steelmeshGoods) return item.steelmeshGoods.price?.toFixed(2) || '0.00'
  if (item.flexHeaterGoods) return item.flexHeaterGoods.price?.toFixed(2) || '0.00'
  return '0.00'
}

const getCartItemType = (item: any) => {
  if (item.pcbGoods) return 'PCB'
  if (item.steelmeshGoods) return 'Steel Mesh'
  if (item.flexHeaterGoods) return 'Flex Heater'
  return 'Unknown'
}

const getCartItemImageId = (item: any) => {
  if (item.pcbGoods) return item.pcbGoods.previewImgAccessId
  if (item.steelmeshGoods) return item.steelmeshGoods.previewImgAccessId
  if (item.flexHeaterGoods) return item.flexHeaterGoods.previewImgAccessId
  return null
}

const getCartItemImageUrl = (item: any) => {
  const imageId = getCartItemImageId(item)
  return imageId ? buildImageUrl(imageId) : null
}

const buildImageUrl = (fileAccessId: string) => {
  return `https://test.jlcpcb.com/api/overseas-pcb-order/v1/fileCommon/downloadCommonFile?fileAccessId=${fileAccessId}`
}

const getDateByBatchNum = (batchNum: string) => {
  const year = batchNum.slice(1, 5)
  const month = batchNum.slice(5, 7)
  const day = batchNum.slice(7, 9)
  return `${year}-${month}-${day}`
}

// 测试 SimpleOrderSelector
const testSimpleOrderSelector = async () => {
  // 动态导入 SimpleOrderSelector
  const { SimpleOrderSelector } = await import('~/quickCep/useSimpleOrderSelector')
  
  const container = document.getElementById('simple-order-container')
  if (container) {
    const selector = new SimpleOrderSelector()
    selector.mount(container)
    
    // 设置回调
    selector.setOnSendOrderCallback((orderItem) => {
      alert(`选择了订单: ${orderItem.title} (${orderItem.orderCode})`)
    })
    
    selector.show()
  }
}

// 页面加载时自动测试
onMounted(() => {
  testCartApi()
  testOrderApi()
})
</script>

<style scoped>
.test-mock-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.controls input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.controls button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.result {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.items, .batches {
  display: grid;
  gap: 10px;
}

.item, .order {
  background: white;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.batch {
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.batch-header {
  background: #f8f9fa;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
}

.batch-orders {
  padding: 10px;
  display: grid;
  gap: 8px;
}

.title, .order-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.code, .order-code {
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
}

.price, .order-amount {
  color: #007bff;
  font-weight: 600;
  margin-bottom: 4px;
}

.type, .order-type {
  color: #28a745;
  font-size: 12px;
  background: #d4edda;
  padding: 2px 6px;
  border-radius: 12px;
  display: inline-block;
}

.image-info {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.image-id, .image-url {
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
  word-break: break-all;
}

.image-url {
  color: #007bff;
}

.selector-container {
  width: 100%;
  height: 400px;
  border: 1px solid #ddd;
  border-radius: 8px;
  position: relative;
  margin-top: 10px;
}
</style>