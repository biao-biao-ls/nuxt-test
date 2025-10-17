# 图片地址处理实现总结

## 概述

根据 `ChatOrderItem.vue` 中 `orderItem.imgUrl` 的处理逻辑，在 `quickCep/useSimpleOrderSelector.ts` 中实现了正确的图片地址处理。

## 实现方案

### 1. 数据结构扩展

在 `SimpleOrderItem` 接口中添加了图片相关字段：

```typescript
interface SimpleOrderItem {
  title: string
  orderCode: string
  orderAmount: string
  businessType: string
  fileAccessId?: string  // 新增：文件访问ID
  imgUrl?: string        // 新增：构建好的图片URL
}
```

### 2. 图片URL构建方法

添加了 `buildImageUrl` 方法，用于根据 `fileAccessId` 构建完整的图片地址：

```typescript
private buildImageUrl(fileAccessId: string): string {
  return `https://test.jlcpcb.com/api/overseas-pcb-order/v1/fileCommon/downloadCommonFile?fileAccessId=${fileAccessId}`
}
```

### 3. 订单数据转换

在 `transformOrdersData` 方法中，为每个订单项添加图片相关字段：

```typescript
orderSimpleVOS: batch.orderSimpleVOS.map((order: any) => ({
  title: order.title,
  orderCode: order.orderCode,
  orderAmount: `${order.orderAmount}`,
  businessType: order.businessType,
  fileAccessId: order.fileAccessId,                                    // 从原始数据提取
  imgUrl: order.fileAccessId ? this.buildImageUrl(order.fileAccessId) : undefined  // 构建图片URL
}))
```

### 4. 购物车数据转换

在 `transformCartData` 方法中，根据不同商品类型提取 `previewImgAccessId`：

```typescript
// 根据不同的商品类型提取数据
let fileAccessId = ''

if (item.pcbGoods) {
  // ... 其他字段
  fileAccessId = item.pcbGoods.previewImgAccessId || ''
} else if (item.steelmeshGoods) {
  // ... 其他字段  
  fileAccessId = item.steelmeshGoods.previewImgAccessId || ''
} 
// ... 其他商品类型

return {
  title,
  orderCode,
  orderAmount: `${price.toFixed(2)}`,
  businessType,
  fileAccessId,
  imgUrl: fileAccessId ? this.buildImageUrl(fileAccessId) : undefined
}
```

### 5. 图片URL获取逻辑

优化了 `getOrderImageUrl` 方法，按优先级获取图片地址：

```typescript
private getOrderImageUrl(item: SimpleOrderItem): string {
  // 1. 优先使用已构建的图片URL
  if (item.imgUrl) {
    return item.imgUrl
  }

  // 2. 如果有 fileAccessId，动态构建图片URL
  if (item.fileAccessId) {
    return this.buildImageUrl(item.fileAccessId)
  }

  // 3. 最后使用默认图片
  return this.getDefaultImageByType(item.businessType)
}
```

## 数据源映射

### 订单数据 (simpleOrder.json)
- 字段：`order.fileAccessId`
- 示例：`"8667342773609181184"`

### 购物车数据 (selectMyShoppingCart.json)
- PCB商品：`item.pcbGoods.previewImgAccessId`
- 钢网商品：`item.steelmeshGoods.previewImgAccessId`
- 柔性加热器：`item.flexHeaterGoods.previewImgAccessId`
- 其他商品类型：各自对应的 `previewImgAccessId` 字段

## 图片地址格式

最终生成的图片地址格式：
```
https://test.jlcpcb.com/api/overseas-pcb-order/v1/fileCommon/downloadCommonFile?fileAccessId={fileAccessId}
```

示例：
```
https://test.jlcpcb.com/api/overseas-pcb-order/v1/fileCommon/downloadCommonFile?fileAccessId=8667440297175171072
```

## 降级处理

当没有有效的 `fileAccessId` 时，系统会：
1. 根据 `businessType` 返回对应的默认图片
2. 使用 JLCPCB 水印样式的占位符图片
3. 图片加载失败时显示错误占位符

## 测试验证

在 `pages/test-mock.vue` 中添加了图片地址的测试显示，可以验证：
- 购物车商品的图片ID和构建的图片地址
- 订单商品的图片ID和构建的图片地址
- 数据转换是否正确工作

这样实现确保了与 `ChatOrderItem.vue` 中 `orderItem.imgUrl` 的处理逻辑保持一致，同时提供了完整的降级处理机制。