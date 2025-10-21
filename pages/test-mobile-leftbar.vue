<template>
  <div class="test-mobile-leftbar">
    <h1>移动端左侧栏测试页面</h1>
    
    <div class="test-info">
      <h2>测试说明</h2>
      <p>此页面用于测试移动端时左侧自定义区域的显示行为：</p>
      <ul>
        <li>移动端：即使有客服在线，也不默认展开左侧自定义区域</li>
        <li>桌面端：有客服在线时，默认展开左侧自定义区域</li>
        <li>用户可以通过点击头部的展开图标手动触发显示</li>
      </ul>
    </div>

    <div class="device-info">
      <h2>当前设备信息</h2>
      <div class="info-item">
        <strong>设备类型:</strong> {{ deviceType }}
      </div>
      <div class="info-item">
        <strong>屏幕宽度:</strong> {{ screenWidth }}px
      </div>
      <div class="info-item">
        <strong>用户代理:</strong> {{ userAgent }}
      </div>
      <div class="info-item">
        <strong>触摸支持:</strong> {{ hasTouchSupport ? '是' : '否' }}
      </div>
    </div>

    <div class="test-controls">
      <h2>测试控制</h2>
      <button @click="simulateMobile" class="test-btn">模拟移动端</button>
      <button @click="simulateDesktop" class="test-btn">模拟桌面端</button>
      <button @click="refreshDeviceInfo" class="test-btn">刷新设备信息</button>
    </div>

    <div class="expected-behavior">
      <h2>预期行为</h2>
      <div v-if="isMobile" class="mobile-behavior">
        <h3>移动端模式</h3>
        <p>✅ 左侧自定义区域应该不会默认展开</p>
        <p>✅ 需要点击头部的展开图标才能显示左侧区域</p>
        <p>✅ 左侧区域从右向左展开，完全显示在屏幕内</p>
        <p>✅ 左侧区域的左边定位在屏幕的左边（或接近左边）</p>
      </div>
      <div v-else class="desktop-behavior">
        <h3>桌面端模式</h3>
        <p>✅ 有客服在线时，左侧自定义区域应该默认展开</p>
        <p>✅ 可以通过点击收起图标隐藏左侧区域</p>
        <p>✅ 保持原有的定位和展开方式</p>
      </div>
    </div>

    <div class="positioning-info">
      <h2>移动端定位说明</h2>
      <div class="positioning-details">
        <h3>定位策略</h3>
        <ul>
          <li><strong>初始状态：</strong> 左侧区域隐藏在右侧不可视区域（right: 180px）</li>
          <li><strong>展开状态：</strong> 左侧区域滑入到右边缘（right: 0px）</li>
          <li><strong>宽度限制：</strong> 移动端最大占屏幕宽度的80%</li>
          <li><strong>动画效果：</strong> 0.3秒的平滑过渡动画</li>
        </ul>
        
        <h3>解决的问题</h3>
        <ul>
          <li>修复了移动端左侧区域超出可视范围的问题</li>
          <li>确保左侧区域在移动端完全可见</li>
          <li>保持了从右向左的展开效果</li>
          <li>适配不同屏幕尺寸的移动设备</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const deviceType = ref('')
const screenWidth = ref(0)
const userAgent = ref('')
const hasTouchSupport = ref(false)
const isMobile = ref(false)

// 移动端检测函数（与 ChatCustomUI 中的逻辑保持一致）
const detectMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // 检测用户代理字符串
  const ua = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod',
    'blackberry', 'windows phone', 'mobile', 'opera mini'
  ]

  const isMobileUA = mobileKeywords.some(keyword => ua.includes(keyword))

  // 检测屏幕尺寸（宽度小于768px认为是移动端）
  const isMobileScreen = window.innerWidth <= 768

  // 检测触摸支持
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // 综合判断：用户代理包含移动设备关键词，或者屏幕宽度小于768px且支持触摸
  return isMobileUA || (isMobileScreen && touchSupport)
}

const updateDeviceInfo = () => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    screenWidth.value = window.innerWidth
    userAgent.value = navigator.userAgent
    hasTouchSupport.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    isMobile.value = detectMobileDevice()
    deviceType.value = isMobile.value ? '移动端' : '桌面端'
  }
}

const refreshDeviceInfo = () => {
  updateDeviceInfo()
}

const simulateMobile = () => {
  // 模拟移动端环境（仅用于演示）
  alert('请调整浏览器窗口宽度至768px以下，或使用开发者工具的设备模拟功能来测试移动端行为')
}

const simulateDesktop = () => {
  // 模拟桌面端环境（仅用于演示）
  alert('请调整浏览器窗口宽度至768px以上来测试桌面端行为')
}

let resizeHandler

onMounted(() => {
  updateDeviceInfo()
  
  // 监听窗口大小变化
  resizeHandler = () => {
    updateDeviceInfo()
  }
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
  }
})
</script>

<style scoped>
.test-mobile-leftbar {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  border-bottom: 2px solid #007bff;
  padding-bottom: 5px;
  margin-top: 30px;
  margin-bottom: 15px;
}

h3 {
  color: #666;
  margin-bottom: 10px;
}

.test-info, .device-info, .test-controls, .expected-behavior {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.test-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.test-info li {
  margin-bottom: 5px;
  line-height: 1.5;
}

.info-item {
  margin-bottom: 10px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.info-item strong {
  color: #333;
  margin-right: 10px;
}

.test-controls {
  text-align: center;
}

.test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  margin: 0 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.test-btn:hover {
  background: #0056b3;
}

.mobile-behavior {
  background: #e8f5e8;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #28a745;
}

.desktop-behavior {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 5px;
  border-left: 4px solid #2196f3;
}

.mobile-behavior p,
.desktop-behavior p {
  margin: 8px 0;
  line-height: 1.5;
}

.positioning-info {
  background: #fff3cd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #ffc107;
}

.positioning-details h3 {
  color: #856404;
  margin-top: 20px;
  margin-bottom: 10px;
}

.positioning-details ul {
  margin: 10px 0;
  padding-left: 20px;
}

.positioning-details li {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #856404;
}

.positioning-details strong {
  color: #495057;
}

@media (max-width: 768px) {
  .test-mobile-leftbar {
    padding: 15px;
  }
  
  .test-btn {
    display: block;
    width: 100%;
    margin: 10px 0;
  }
}
</style>