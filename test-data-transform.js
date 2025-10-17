/**
 * 测试数据转换脚本
 * 用于验证购物车和订单数据的转换逻辑
 */

import fs from 'fs'

// 读取测试数据
const cartData = JSON.parse(fs.readFileSync('selectMyShoppingCart.json', 'utf-8'))
const orderData = JSON.parse(fs.readFileSync('simpleOrder.json', 'utf-8'))

console.log('=== 购物车数据分析 ===')
console.log(`总数量: ${cartData.data.total}`)
console.log(`列表长度: ${cartData.data.list.length}`)

// 分析购物车数据结构
const cartTypes = {}
cartData.data.list.slice(0, 10).forEach((item, index) => {
  console.log(`\n--- 购物车项目 ${index + 1} ---`)
  
  if (item.pcbGoods) {
    cartTypes.pcb = (cartTypes.pcb || 0) + 1
    console.log('类型: PCB')
    console.log('标题:', item.pcbGoods.gerberFile)
    console.log('编码:', item.pcbGoods.goodsCode)
    console.log('价格:', item.pcbGoods.price)
  } else if (item.steelmeshGoods) {
    cartTypes.steelmesh = (cartTypes.steelmesh || 0) + 1
    console.log('类型: Steel Mesh')
    console.log('标题:', item.steelmeshGoods.gerberFile)
    console.log('编码:', item.steelmeshGoods.goodsCode)
    console.log('价格:', item.steelmeshGoods.price)
  } else if (item.flexHeaterGoods) {
    cartTypes.flexHeater = (cartTypes.flexHeater || 0) + 1
    console.log('类型: Flex Heater')
    console.log('标题:', item.flexHeaterGoods.gerberFile)
    console.log('编码:', item.flexHeaterGoods.goodsCode)
    console.log('价格:', item.flexHeaterGoods.price)
  } else {
    cartTypes.other = (cartTypes.other || 0) + 1
    console.log('类型: 其他')
    console.log('访问ID:', item.shoppingCartAccessId)
  }
})

console.log('\n购物车类型统计:', cartTypes)

console.log('\n=== 订单数据分析 ===')
console.log(`总数量: ${orderData.data.total}`)
console.log(`批次数量: ${orderData.data.list.length}`)

// 分析订单数据结构
orderData.data.list.slice(0, 3).forEach((batch, batchIndex) => {
  console.log(`\n--- 批次 ${batchIndex + 1}: ${batch.batchNum} ---`)
  
  batch.orderSimpleVOS.forEach((order, orderIndex) => {
    console.log(`  订单 ${orderIndex + 1}:`)
    console.log(`    标题: ${order.title}`)
    console.log(`    编码: ${order.orderCode}`)
    console.log(`    金额: ${order.orderAmount}`)
    console.log(`    类型: ${order.businessType}`)
  })
})

// 测试数据转换函数
function transformCartData(cartItems) {
  return cartItems.map(item => {
    let title = ''
    let orderCode = ''
    let price = 0
    let businessType = ''

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
    }

    return {
      title,
      orderCode,
      orderAmount: `$${price.toFixed(2)}`,
      businessType
    }
  }).filter(item => item.orderCode)
}

function transformOrdersData(orderBatches) {
  return orderBatches.map(batch => ({
    batchNum: batch.batchNum,
    createTime: batch.createTime,
    orderSimpleVOS: batch.orderSimpleVOS.map(order => ({
      title: order.title,
      orderCode: order.orderCode,
      orderAmount: `$${order.orderAmount}`,
      businessType: order.businessType
    }))
  }))
}

console.log('\n=== 转换后的购物车数据 (前5项) ===')
const transformedCart = transformCartData(cartData.data.list.slice(0, 5))
console.log(JSON.stringify(transformedCart, null, 2))

console.log('\n=== 转换后的订单数据 (前2批次) ===')
const transformedOrders = transformOrdersData(orderData.data.list.slice(0, 2))
console.log(JSON.stringify(transformedOrders, null, 2))