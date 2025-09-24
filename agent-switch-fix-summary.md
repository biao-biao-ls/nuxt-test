# 客服切换功能修复总结

## 问题描述
点击切换客服时，头部自定义区域的当前客服信息没有更新为选中的客服信息。

## 问题分析
1. `selectAgent` 方法只调用了 `quickChatApi.switchChat`，但没有立即更新本地状态
2. 依赖事件监听器 `chat.switch.operator.success` 来更新状态，但可能存在以下问题：
   - 事件没有正确触发
   - 事件数据格式不匹配
   - 事件处理逻辑有问题

## 修复方案

### 1. 改进 `selectAgent` 方法
```typescript
selectAgent(quickCepId: string): void {
  // ... 验证逻辑 ...

  // 先立即更新本地状态，确保UI能够响应
  const previousAgent = this.state.currentChatAgent;
  this.state.currentChatAgent = agent;
  this.refreshUI();
  console.log(`本地状态已更新为客服: ${agent.employeeEnName}`);

  // 然后调用API
  if (quickChatApi && quickChatApi.switchChat) {
    try {
      quickChatApi.switchChat(quickCepId);
      console.log(`已调用 quickChatApi.switchChat(${quickCepId})`);
    } catch (error) {
      console.error("切换客服失败:", error);
      // 如果API调用失败，恢复之前的状态
      this.state.currentChatAgent = previousAgent;
      this.refreshUI();
    }
  }
}
```

### 2. 增强事件监听器
```typescript
window.quickEmitter.on("chat.switch.operator.success", (data: any) => {
  console.log("收到切换客服成功事件:", data)
  console.log("事件数据类型:", typeof data, "内容:", JSON.stringify(data))
  
  if (data && this.chatUI) {
    // 尝试多种可能的属性名
    const operatorId = data.operatorId || data.userId || data.quickCepId || data.id
    console.log("提取的客服ID:", operatorId)
    
    if (operatorId) {
      const switchedAgent = this.chatUI.state.customerServiceData.find(
        (agent) => agent.quickCepId === operatorId
      )
      
      if (switchedAgent) {
        this.chatUI.state.currentChatAgent = switchedAgent
        console.log(`事件处理：已成功切换到客服: ${switchedAgent.employeeEnName}`)
        this.chatUI.refreshUI()
      } else {
        console.warn(`未找到客服ID为 ${operatorId} 的客服数据`)
      }
    }
  }
})
```

### 3. 添加额外的事件监听
监听可能的其他切换事件：
- `chat.operator.switch`
- `chat.switch.success`
- `operator.switch.success`
- `chat.agent.changed`

### 4. 增强调试工具
添加了以下调试方法：
- `debugQuickChat.setCurrentAgent(quickCepId)` - 手动设置当前客服
- `debugQuickChat.clearCurrentAgent()` - 清除当前客服
- `debugQuickChat.testSwitchEvent(quickCepId)` - 测试切换事件

## 测试方法

### 1. 使用调试工具测试
```javascript
// 查看当前客服
debugQuickChat.getCurrentAgent()

// 手动设置客服（绕过API调用）
debugQuickChat.setCurrentAgent('1938524999731687426')

// 测试完整的切换流程
debugQuickChat.testSwitchAgent('1938524999731687426')

// 模拟事件触发
debugQuickChat.testSwitchEvent('1938524999731687426')

// 清除当前客服
debugQuickChat.clearCurrentAgent()
```

### 2. 使用测试页面
打开 `test-agent-switch.html` 进行可视化测试。

## 修复效果

1. **立即响应**: 点击切换客服时，UI会立即更新，不再依赖异步事件
2. **错误恢复**: 如果API调用失败，会自动恢复到之前的状态
3. **详细日志**: 添加了详细的调试日志，便于排查问题
4. **多重保障**: 既有立即更新，也保留了事件监听作为备用机制
5. **调试友好**: 提供了丰富的调试工具，便于测试和排查问题

## 使用建议

1. 首先测试修复后的功能是否正常工作
2. 如果仍有问题，使用调试工具进行排查：
   - 检查事件是否正确触发
   - 验证数据格式是否匹配
   - 确认API调用是否成功
3. 根据调试信息进一步优化代码

这个修复方案采用了"立即更新 + 事件确认"的双重机制，确保用户界面能够及时响应，同时保持与后端API的同步。

## 新增功能：客服离线自动恢复

### 功能描述
当选中的客服离线时，系统会自动将当前客服信息恢复为默认的JLCONE状态，提供更好的用户体验。

### 实现机制

#### 1. 状态检查方法
```typescript
checkCurrentAgentStatus(): boolean {
  if (!this.state.currentChatAgent) {
    return false; // 没有当前客服，无需检查
  }

  // 从最新的客服数据中找到当前客服
  const currentAgent = this.state.customerServiceData.find(
    (agent) => agent.quickCepId === this.state.currentChatAgent!.quickCepId
  );

  if (!currentAgent || !currentAgent.isOnline) {
    console.log(`当前客服 ${this.state.currentChatAgent.employeeEnName} 已离线，自动恢复为默认客服`);
    this.state.currentChatAgent = null;
    this.refreshUI();
    return true; // 返回true表示当前客服已离线并被清除
  }

  return false; // 返回false表示当前客服仍在线
}
```

#### 2. 自动检查触发点
- **状态更新时**: 在 `updateAgentStatus` 方法中检查当前客服是否离线
- **UI刷新时**: 在 `refreshUI` 方法中自动检查当前客服状态
- **手动检查**: 提供 `checkCurrentAgentStatus` 方法供调试使用

#### 3. 增强的调试工具
新增以下调试方法：
- `debugQuickChat.testAgentOffline('客服ID')` - 测试指定客服离线
- `debugQuickChat.testAgentOnline('客服ID')` - 测试指定客服上线  
- `debugQuickChat.testCurrentAgentOffline()` - 测试当前客服离线场景
- `debugQuickChat.checkCurrentAgentStatus()` - 检查当前客服状态

### 测试场景

#### 场景1：客服状态更新时自动检查
1. 选择一个在线客服
2. 模拟该客服离线（通过状态更新）
3. 系统自动检测并恢复为默认状态

#### 场景2：UI刷新时自动检查  
1. 选择一个客服
2. 手动将该客服设为离线
3. 调用 `refreshUI()` 
4. 系统自动检测并恢复为默认状态

#### 场景3：手动状态检查
1. 选择一个客服
2. 将该客服设为离线
3. 调用 `checkCurrentAgentStatus()`
4. 返回true并自动恢复为默认状态

### 测试方法

#### 使用调试工具测试
```javascript
// 选择一个客服
debugQuickChat.setCurrentAgent('1938524999731687426')

// 模拟该客服离线
debugQuickChat.testAgentOffline('1938524999731687426')

// 检查状态（应该自动恢复为默认）
debugQuickChat.getCurrentAgent() // 应该返回null

// 或者直接测试当前客服离线场景
debugQuickChat.testCurrentAgentOffline()
```

#### 使用测试页面
打开 `test-agent-offline.html` 进行可视化测试，包含完整的测试场景。

### 用户体验改进

1. **无缝体验**: 当客服离线时，用户界面自动恢复为默认状态，避免显示离线客服信息
2. **实时响应**: 客服状态变化时立即检查并更新UI
3. **智能检测**: 在多个关键节点自动检查，确保状态一致性
4. **事件通知**: 发射 `currentAgentWentOffline` 事件，便于其他组件响应

这个功能确保了当选中的客服不在线时，用户界面能够优雅地回退到默认状态，提供一致和可靠的用户体验。