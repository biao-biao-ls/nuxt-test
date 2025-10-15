# 座席列表变化事件处理实现总结

## 功能概述

实现了对 `chat.operatorList.change` 事件的完整处理，当座席列表发生变化时，系统会自动更新当前客服信息并刷新UI显示。

## 事件数据格式

根据提供的数据格式，`chat.operatorList.change` 事件返回的数据结构为：

```json
[{
  "operatorId": "1942107108466016257",
  "profilePhoto": "https://jlc-uat-quickcep-overseas.oss-eu-central-1.aliyuncs.com/9624/settings//avatar/1150398853380308992/a5225fcb-e662-4047-b1a4-d81b0790d8c7.png",
  "profilePhotoColor": "#36CFC9",
  "firstName": "覃安",
  "lastName": "",
  "nickName": null,
  "onlineStatus": 1,
  "name": "覃安"
}]
```

## 核心实现逻辑

### 1. 事件监听处理

在 `useChatManager.ts` 中添加了完整的事件处理逻辑：

```typescript
window.quickEmitter.on('chat.operatorList.change', (data) => {
  console.log('chat.operatorList.change', data)
  
  // 处理座席列表变化
  if (data && Array.isArray(data) && data.length > 0 && this.chatUI) {
    // 获取第一个座席信息（通常当前会话只有一个座席）
    const currentOperator = data[0]
    const operatorId = currentOperator.operatorId
    
    if (operatorId) {
      // 根据 operatorId 查找对应的客服信息
      const matchedAgent = this.chatUI.state.customerServiceData.find(
        (agent) => agent.quickCepId === operatorId
      )
      
      if (matchedAgent) {
        // 更新当前聊天客服
        this.chatUI.state.currentChatAgent = matchedAgent
        
        // 更新客服在线状态
        if (typeof currentOperator.onlineStatus === 'number') {
          matchedAgent.status = currentOperator.onlineStatus
          matchedAgent.isOnline = currentOperator.onlineStatus !== 1
        }
        
        // 刷新UI显示
        this.chatUI.refreshUI()
        
        // 保存当前选择的客服到本地存储
        this.chatUI.saveSelectedAgent(matchedAgent)
      }
    }
  } else if (data && Array.isArray(data) && data.length === 0) {
    // 座席列表为空时重置为默认状态
    this.resetToDefaultAgent()
  }
})
```

### 2. 关键功能点

#### 座席匹配逻辑
- 通过 `operatorId` 与客服数据中的 `quickCepId` 进行匹配
- 找到匹配的客服后更新为当前聊天客服

#### 状态同步
- 根据返回的 `onlineStatus` 更新客服的在线状态
- 状态码映射：1=离线，2=在线空闲，3=在线忙碌

#### UI更新
- 自动刷新UI显示当前客服信息
- 更新左侧栏可见性
- 保存选择到本地存储

#### 边界情况处理
- 座席列表为空时重置为默认状态
- 未找到匹配客服时输出警告日志

### 3. 方法访问权限调整

将 `ChatCustomUI` 类中的 `saveSelectedAgent` 方法从 `private` 改为 `public`，以便 `ChatManager` 可以调用：

```typescript
public saveSelectedAgent(agent: CustomerServiceAgent | null): void {
  // 保存逻辑...
}
```

## 测试验证

创建了 `test-operator-list-change.html` 测试页面，包含以下测试功能：

### 测试场景
1. **正常座席变化** - 模拟单个座席信息变化
2. **空座席列表** - 模拟会话结束或无座席分配
3. **多个座席** - 模拟多座席场景（取第一个）
4. **状态查询** - 获取当前客服信息

### 测试操作
- 模拟不同的座席列表变化事件
- 实时显示当前客服信息
- 查看事件处理日志
- 验证UI更新效果

## 使用方式

### 自动处理
系统会自动监听 `chat.operatorList.change` 事件，无需手动调用。

### 调试工具
可以使用调试工具进行测试：

```javascript
// 获取当前客服
window.debugQuickChat.getCurrentAgent()

// 查看本地存储的客服选择
window.debugQuickChat.getStoredAgent()

// 手动设置当前客服
window.debugQuickChat.setCurrentAgent('1942107108466016257')
```

## 注意事项

1. **数据匹配** - 确保客服数据中的 `quickCepId` 与事件返回的 `operatorId` 一致
2. **状态同步** - 事件中的 `onlineStatus` 会覆盖本地的客服状态
3. **本地存储** - 座席变化会自动保存到本地存储，页面刷新后可恢复
4. **UI响应** - 座席变化会立即反映在UI上，包括头部客服信息和左侧栏

## 相关文件

- `quickCep/useChatManager.ts` - 主要事件处理逻辑
- `quickCep/useChatCustomUI.ts` - UI更新和状态管理
- `test-operator-list-change.html` - 功能测试页面

这个实现确保了当座席列表发生变化时，系统能够准确识别当前客服并更新相应的UI显示，提供了完整的座席管理功能。