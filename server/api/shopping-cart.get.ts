/**
 * 购物车数据 API
 * 返回 selectMyShoppingCart.json 中的数据
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  try {
    // 读取购物车数据文件
    const filePath = join(process.cwd(), 'selectMyShoppingCart.json')
    const fileContent = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // 获取查询参数
    const query = getQuery(event)
    const keyword = query.keyword as string || ''
    
    // 如果有搜索关键词，进行过滤
    if (keyword && data.data && data.data.list) {
      const filteredList = data.data.list.filter((item: any) => {
        // 根据不同的商品类型获取标题和编码
        let title = ''
        let code = ''
        
        if (item.pcbGoods) {
          title = item.pcbGoods.gerberFile || ''
          code = item.pcbGoods.goodsCode || ''
        } else if (item.steelmeshGoods) {
          title = item.steelmeshGoods.gerberFile || ''
          code = item.steelmeshGoods.goodsCode || ''
        } else if (item.flexHeaterGoods) {
          title = item.flexHeaterGoods.gerberFile || ''
          code = item.flexHeaterGoods.goodsCode || ''
        }
        
        const searchText = keyword.toLowerCase()
        return title.toLowerCase().includes(searchText) || 
               code.toLowerCase().includes(searchText)
      })
      
      return {
        ...data,
        data: {
          ...data.data,
          list: filteredList,
          total: filteredList.length
        }
      }
    }
    
    return data
  } catch (error) {
    console.error('Error reading shopping cart data:', error)
    return {
      code: 500,
      message: 'Failed to load shopping cart data',
      data: null
    }
  }
})