# 复杂显示逻辑实现总结

## 需求分析

根据在线客服人数和当前选择状态来动态控制左侧栏和头部区域的显示，具体规则如下：

### 显示规则

1. **当在线客服人数大于3人时，且当前未选择客服**
   - 显示自定义左侧区域
   - 不显示自定义头部的 `.online-agent`、`.more-agents`

2. **当在线客服人数小于等于3人时，且当前未选择客服**
   - 不显示自定义左侧区域
   - 显示自定义头部的 `.online-agent`

3. **当在线客服人数大于4人时，且当前已选择客服**
   - 显示自定义左侧区域
   - 不显示自定义头部的 `.online-agent`、`.more-agents`

4. **当在线客服人数小于等于4人时，且当前已选择客服**
   - 不显示自定义左侧区域
   - 显示自定义头部的 `.online-agent`

5. **当点击左侧 `.expand-icon` 时**
   - 隐藏左侧自定义区域
   - 显示头部自定义区域的 `.online-agent`
   - 当可选择客服人数大于3时，还需要显示 `.more-agents`

## 实现方案

### 1. 数据结构扩展

#### 在 `UIState` 接口中添加新字段
```typescript
interface UIState {
  isLeftBarExpanded: boolean;
  isLeftBarManuallyHidden: boolean; // 用户是否手动隐藏了左侧栏
  currentChatAgent: CustomerServiceAgent | null;
  customerServiceData: CustomerServiceAgent[];
  containers: {
    header: HTMLElement | null;
    leftBar: HTMLElement | null;
    footer: HTMLElement | null;
  };
}
```

### 2. 核心逻辑方法

#### `shouldShowLeftBar()` - 判断是否显示左侧栏
- 检查用户是否手动隐藏
- 根据在线客服数量和当前选择状态决定
- 未选择客服：在线数 > 3 显示
- 已选择客服：在线数 > 4 显示

#### `shouldShowHeaderAgents()` - 判断是否显示头部客服
- 用户手动隐藏时总是显示头部
- 根据在线客服数量和当前选择状态决定
- 未选择客服：在线数 ≤ 3 显示
- 已选择客服：在线数 ≤ 4 显示

#### `getAvailableAgentsCount()` - 获取可选择客服数量
- 排除当前选中的客服
- 用于计算 `.more-agents` 的显示数字

### 3. UI 生成逻辑更新

#### `generateHeaderHTML()` 方法
- 使用 `shouldShowHeaderAgents()` 决定是否显示在线客服
- 使用 `getAvailableAgentsCount()` 计算可选择数量
- 根据可选择数量决定是否显示 `.more-agents`

#### `toggleLeftBar()` 方法
- 处理用户手动隐藏/显示逻辑
- 设置 `isLeftBarManuallyHidden` 状态
- 触发UI更新和左侧栏可见性回调

### 4. 状态管理

#### 自动重置机制
- 当客服状态发生变化时，重置 `isLeftBarManuallyHidden` 为 `false`
- 让系统重新根据规则自动控制显示

#### 回调机制
- 通过 `onAgentStatusChangeCallback` 通知 `ChatManager` 更新左侧栏可见性
- 确保UI状态与实际显示同步

### 5. ChatManager 更新

#### `updateLeftBarVisibility()` 方法
- 调用 `chatUI.shouldShowLeftBar()` 获取显示状态
- 根据结果控制 `quickChatApi.customLeftBar.setIsShow()`

## 关键特性

### 1. 智能显示控制
- 根据客服数量和选择状态自动切换显示模式
- 避免在客服较少时显示空的左侧栏
- 在客服较多时提供更好的选择界面

### 2. 用户控制权
- 用户可以通过点击 `.expand-icon` 手动控制显示
- 手动隐藏后会显示头部客服选择
- 状态变化时自动重置为系统控制

### 3. 动态响应
- 客服上线/下线时自动调整显示
- 选择/取消选择客服时自动调整显示
- 实时更新可选择客服数量

### 4. 性能优化
- 只在必要时更新UI
- 避免不必要的DOM操作
- 智能的状态管理

## 测试验证

创建了 `test-complex-visibility-logic.html` 测试页面，包含：

### 测试场景
1. 不同在线客服数量的测试（1-6个）
2. 选择/取消选择客服的测试
3. 手动隐藏/显示的测试
4. 各种组合场景的验证

### 可视化显示
- 实时显示左侧栏和头部的状态
- 清晰的规则说明
- 交互式的测试控制

## 代码修改文件

1. **composables/useChatManager.ts**
   - 更新 `updateLeftBarVisibility()` 方法

2. **composables/useChatCustomUI.ts**
   - 扩展 `UIState` 接口
   - 新增 `shouldShowLeftBar()` 方法
   - 新增 `shouldShowHeaderAgents()` 方法
   - 新增 `getAvailableAgentsCount()` 方法
   - 更新 `generateHeaderHTML()` 方法
   - 更新 `toggleLeftBar()` 方法
   - 更新 `updateAgentStatus()` 方法
   - 更新 `renderMoreAgentsIndicator()` 方法

## 日志输出

实现中添加了详细的控制台日志：
- "根据规则显示/隐藏左侧栏"
- "用户手动隐藏左侧栏"
- "用户取消手动隐藏，恢复自动控制"

这些日志帮助开发者理解复杂的显示逻辑是否按预期工作。

## 向后兼容性

- 保持了原有的API接口
- 不影响现有的其他功能
- 新增的状态字段有合理的默认值
- 渐进式的功能增强