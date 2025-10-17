/**
 * 订单批次数据 API
 * 返回 simpleOrder.json 中的数据
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  try {
    // 读取订单批次数据文件
    const filePath = join(process.cwd(), 'simpleOrder.json')
    const fileContent = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // 获取查询参数
    const query = getQuery(event)
    const keyword = query.keyword as string || ''
    const pageNum = parseInt(query.pageNum as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 12
    
    let filteredList = data.data.list
    
    // 如果有搜索关键词，进行过滤
    if (keyword && filteredList) {
      const searchText = keyword.toLowerCase()
      filteredList = filteredList.map((batch: any) => {
        const filteredOrders = batch.orderSimpleVOS.filter((order: any) => {
          return order.title.toLowerCase().includes(searchText) || 
                 order.orderCode.toLowerCase().includes(searchText)
        })
        
        return {
          ...batch,
          orderSimpleVOS: filteredOrders
        }
      }).filter((batch: any) => batch.orderSimpleVOS.length > 0)
    }
    
    // 分页处理
    const startIndex = (pageNum - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedList = filteredList.slice(startIndex, endIndex)
    
    return {
      ...data,
      data: {
        ...data.data,
        list: paginatedList,
        total: filteredList.length,
        pageNum,
        pageSize,
        pages: Math.ceil(filteredList.length / pageSize),
        hasNextPage: endIndex < filteredList.length,
        hasPreviousPage: pageNum > 1
      }
    }
  } catch (error) {
    console.error('Error reading simple orders data:', error)
    return {
      success: false,
      code: 500,
      message: 'Failed to load orders data',
      data: null
    }
  }
})