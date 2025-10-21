<template>
  <div class="test-mobile-container">
    <h1>移动端自动打开聊天窗口测试</h1>
    
    <div class="device-info">
      <h2>设备信息</h2>
      <p><strong>用户代理:</strong> {{ userAgent }}</p>
      <p><strong>屏幕宽度:</strong> {{ screenWidth }}px</p>
      <p><strong>触摸支持:</strong> {{ hasTouchSupport ? '是' : '否' }}</p>
      <p><strong>检测结果:</strong> {{ isMobileDevice ? '移动端' : '桌面端' }}</p>
    </div>

    <div class="test-controls">
      <h2>测试控制</h2>
      <button @click="testMobileDetection" class="test-btn">
        测试移动端检测
      </button>
      <button @click="testAutoOpenChat" class="test-btn">
        测试自动打开聊天窗口
      </button>
      <button @click="forceOpenChat" class="test-btn">
        强制打开聊天窗口
      </button>
      <button @click="inspectQuickChatApi" class="test-btn">
        查看 QuickChat API 结构
      </button>
      <button @click="testApiMethods" class="test-btn">
        测试 API 方法
      </button>
      <button @click="testSandboxMethods" class="test-btn">
        测试沙盒功能
      </button>
      <button @click="checkMobileStyles" class="test-btn">
        检查移动端样式
      </button>
      <button @click="forceMobileStyles" class="test-btn">
        强制应用移动端样式
      </button>
      <button @click="checkStyleInjection" class="test-btn">
        检查样式注入状态
      </button>
      <button @click="manualReinjectStyles" class="test-btn">
        手动重新注入样式
      </button>
    </div>

    <div class="instructions">
      <h2>测试说明</h2>
      <ul>
        <li>在移动端设备或模拟移动端环境下访问此页面</li>
        <li>QuickCep 初始化完成后，聊天窗口应该自动打开</li>
        <li>在移动端环境下，<code>.footer-btn.add-btn svg</code> 元素会应用 24px × 24px 的尺寸</li>
        <li>可以使用浏览器开发者工具的设备模拟功能测试</li>
      </ul>
      
      <h3>调试步骤</h3>
      <ol>
        <li>首先点击"检查样式注入状态"确认样式是否成功注入</li>
        <li>如果样式未注入，点击"手动重新注入样式"</li>
        <li>使用"检查移动端样式"按钮验证样式是否正确应用</li>
        <li>如果样式仍未生效，点击"强制应用移动端样式"</li>
        <li>可以通过控制台查看 <code>window.debugQuickChat</code> 对象进行更多测试</li>
      </ol>
    </div>

    <div class="console-output">
      <h2>控制台输出</h2>
      <div class="console-log" ref="consoleLog">
        <div v-for="(log, index) in consoleLogs" :key="index" :class="log.type">
          [{{ log.timestamp }}] {{ log.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const userAgent = ref('')
const screenWidth = ref(0)
const hasTouchSupport = ref(false)
const isMobileDevice = ref(false)
const consoleLogs = ref<Array<{type: string, message: string, timestamp: string}>>([])

// 拦截 console.log 输出
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

const addLog = (type: string, message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  consoleLogs.value.push({ type, message, timestamp })
  
  // 限制日志数量
  if (consoleLogs.value.length > 50) {
    consoleLogs.value.shift()
  }
}

onMounted(() => {
  // 获取设备信息
  userAgent.value = navigator.userAgent
  screenWidth.value = window.innerWidth
  hasTouchSupport.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  // 检测是否为移动端
  updateMobileDetection()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateMobileDetection)
  
  // 拦截控制台输出
  console.log = (...args) => {
    originalConsoleLog(...args)
    addLog('log', args.join(' '))
  }
  
  console.error = (...args) => {
    originalConsoleError(...args)
    addLog('error', args.join(' '))
  }
  
  console.warn = (...args) => {
    originalConsoleWarn(...args)
    addLog('warn', args.join(' '))
  }
  
  addLog('log', '页面已加载，等待 QuickCep 初始化...')
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileDetection)
  
  // 恢复原始的控制台方法
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

const updateMobileDetection = () => {
  screenWidth.value = window.innerWidth
  
  const userAgentLower = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 
    'blackberry', 'windows phone', 'mobile', 'opera mini'
  ]
  
  const isMobileUA = mobileKeywords.some(keyword => userAgentLower.includes(keyword))
  const isMobileScreen = window.innerWidth <= 768
  const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  
  isMobileDevice.value = isMobileUA || (isMobileScreen && touchSupport)
}

const testMobileDetection = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.testMobileDetection()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const testAutoOpenChat = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.testAutoOpenChat()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const forceOpenChat = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.forceOpenChat()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const inspectQuickChatApi = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.inspectQuickChatApi()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const testApiMethods = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.testApiMethods()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const testSandboxMethods = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.testSandboxMethods()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const checkMobileStyles = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.checkMobileStyles()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const forceMobileStyles = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.forceMobileStyles()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const checkStyleInjection = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.checkStyleInjection()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}

const manualReinjectStyles = () => {
  if (typeof window !== 'undefined' && (window as any).debugQuickChat) {
    (window as any).debugQuickChat.manualReinjectStyles()
  } else {
    addLog('warn', 'debugQuickChat 不可用，请等待 QuickCep 初始化完成')
  }
}
</script>

<style scoped>
.test-mobile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-top: 30px;
}

.device-info p {
  margin: 10px 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.test-controls {
  margin: 20px 0;
}

.test-btn {
  display: inline-block;
  margin: 5px 10px 5px 0;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.test-btn:hover {
  background: #0056b3;
}

.instructions ul {
  line-height: 1.6;
}

.instructions code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.console-output {
  margin-top: 30px;
}

.console-log {
  background: #1e1e1e;
  color: #fff;
  padding: 15px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
}

.console-log .log {
  color: #fff;
}

.console-log .error {
  color: #ff6b6b;
}

.console-log .warn {
  color: #ffd93d;
}

@media (max-width: 768px) {
  .test-mobile-container {
    padding: 10px;
  }
  
  .test-btn {
    display: block;
    width: 100%;
    margin: 10px 0;
  }
}
</style>