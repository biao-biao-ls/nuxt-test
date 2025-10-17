<template>
  <div class="home-page">
    <div class="container">
      <h1>Mock 服务演示</h1>
      <p>本项目已成功搭建了本地 mock 服务，用于模拟获取购物车数据和订单批次数据。</p>
      
      <div class="features">
        <div class="feature-card">
          <h3>🛒 购物车数据 API</h3>
          <p>模拟获取购物车数据，支持关键词搜索</p>
          <code>/api/shopping-cart</code>
        </div>
        
        <div class="feature-card">
          <h3>📋 订单批次数据 API</h3>
          <p>模拟获取订单批次数据，支持分页和搜索</p>
          <code>/api/simple-orders</code>
        </div>
        
        <div class="feature-card">
          <h3>🔧 SimpleOrderSelector 组件</h3>
          <p>已更新为使用真实 API 数据，包含数据转换逻辑</p>
          <code>quickCep/useSimpleOrderSelector.ts</code>
        </div>
      </div>
      
      <div class="actions">
        <NuxtLink to="/test-mock" class="btn btn-primary">
          🧪 测试 Mock 服务
        </NuxtLink>
        
        <a href="/api/shopping-cart" target="_blank" class="btn btn-secondary">
          📄 查看购物车 API
        </a>
        
        <a href="/api/simple-orders" target="_blank" class="btn btn-secondary">
          📄 查看订单 API
        </a>
      </div>
      
      <div class="implementation-details">
        <h2>实现详情</h2>
        
        <div class="detail-section">
          <h3>✅ 已完成的功能</h3>
          <ul>
            <li>搭建了本地 mock 服务，提供购物车和订单数据接口</li>
            <li>将 <code>useSimpleOrderSelector.ts</code> 中的假数据替换为真实 API 调用</li>
            <li>实现了数据转换逻辑，将 API 数据转换为组件所需格式</li>
            <li>支持搜索功能，可按商品名称或订单编码搜索</li>
            <li>支持分页功能（订单数据）</li>
            <li>添加了错误处理和降级机制</li>
          </ul>
        </div>
        
        <div class="detail-section">
          <h3>🔄 数据转换</h3>
          <p>系统会自动将原始 JSON 数据转换为 SimpleOrderSelector 组件所需的格式：</p>
          <ul>
            <li><strong>购物车数据</strong>：从 <code>selectMyShoppingCart.json</code> 提取商品信息</li>
            <li><strong>订单数据</strong>：从 <code>simpleOrder.json</code> 提取批次和订单信息</li>
            <li><strong>支持多种商品类型</strong>：PCB、钢网、柔性加热器、SMT、3D打印、CNC、钣金等</li>
          </ul>
        </div>
        
        <div class="detail-section">
          <h3>🛠️ 技术栈</h3>
          <ul>
            <li><strong>Nuxt 3</strong>：全栈框架，提供服务端 API 支持</li>
            <li><strong>TypeScript</strong>：类型安全的开发体验</li>
            <li><strong>Node.js API</strong>：使用 Nuxt 的服务端 API 功能</li>
            <li><strong>文件系统</strong>：直接读取 JSON 文件作为数据源</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: 'Mock 服务演示 - 购物车与订单数据',
  meta: [
    { name: 'description', content: '本地 mock 服务演示，模拟购物车和订单批次数据 API' }
  ]
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 16px;
  font-size: 2.5rem;
  font-weight: 700;
}

.container > p {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 40px;
  line-height: 1.6;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.feature-card {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  color: #333;
  margin-bottom: 12px;
  font-size: 1.2rem;
}

.feature-card p {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.feature-card code {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  color: #495057;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 50px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.implementation-details {
  border-top: 2px solid #e9ecef;
  padding-top: 40px;
}

.implementation-details h2 {
  color: #333;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  color: #495057;
  margin-bottom: 16px;
  font-size: 1.3rem;
}

.detail-section p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.detail-section ul {
  color: #666;
  line-height: 1.6;
  padding-left: 20px;
}

.detail-section li {
  margin-bottom: 8px;
}

.detail-section code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  color: #495057;
}

@media (max-width: 768px) {
  .home-page {
    padding: 20px 10px;
  }
  
  .container {
    padding: 20px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
    text-align: center;
  }
}
</style>