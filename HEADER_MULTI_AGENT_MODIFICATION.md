# 顶部自定义区域多客服渲染逻辑修改

## 修改概述

根据需求，修改了顶部自定义区域的多客服渲染逻辑，使其基于 `handleOperatorListChange` 方法中获取到的 `newData` 来渲染，而不是之前基于左侧自定义区域显示状态的逻辑。

## 主要修改内容

### 1. ChatManager 类修改 (`quickCep/useChatManager.ts`)

- **handleOperatorListChange 方法**：
  - 添加了 `this.chatUI.setOperatorListData(newData)` 调用
  - 在座席列表为空时，调用 `this.chatUI.setOperatorListData([])` 清空数据

### 2. ChatCustomUI 类修改 (`quickCep/useChatCustomUI.ts`)

#### 新增状态和方法：
- **UIState 接口**：添加了 `operatorListData: CustomerServiceAgent[]` 字段
- **setOperatorListData 方法**：用于设置操作员列表数据
- **shouldShowOperatorAgents 方法**：判断是否应该显示操作员客服（只与 operatorListData 长度有关）
- **getOperatorAgentsToShow 方法**：获取要显示的操作员客服（除第一个元素外的其余部分）
- **renderOperatorAgents 方法**：渲染操作员客服（不可点击切换）

#### 修改的方法：
- **generateHeaderHTML 方法**：
  - 移除了基于 `shouldShowHeaderAgents` 的旧逻辑
  - 添加了基于 `shouldShowOperatorAgents` 的新逻辑
  - 使用 `renderOperatorAgents` 渲染操作员客服

### 3. ChatStyles 类修改 (`quickCep/useChatStyles.ts`)

#### 新增样式：
- **.operator-agent**：
  - `cursor: default`：不可点击
  - `opacity: 0.8`：稍微降低透明度以区分
  - 支持 hover 效果但不可点击
- **.agent-avatar.operator**：
  - 与 `.agent-avatar.online` 相同尺寸
  - 使用灰色边框 `#d8d8d8` 以区分

## 新的渲染逻辑

### 渲染条件
- **旧逻辑**：基于左侧自定义区域是否显示来决定头部是否显示客服
- **新逻辑**：只与 `operatorListData` 的长度有关系，当 `operatorListData.length > 1` 时显示

### 渲染内容
- **旧逻辑**：显示在线客服（排除当前选中的客服），可点击切换
- **新逻辑**：显示 `operatorListData` 除第一个元素外的其余部分，不可点击切换
- **数量限制**：最多显示3个操作员客服头像，超过3个时显示省略号指示器

### 样式区别
- **在线客服**（`.online-agent`）：可点击，正常透明度
- **操作员客服**（`.operator-agent`）：不可点击，降低透明度，灰色边框

## 数据流程

1. `handleOperatorListChange` 接收座席列表变化数据
2. 构建 `newData` 数组，包含匹配的客服信息
3. 调用 `setOperatorListData(newData)` 将数据传递给 UI 组件
4. UI 组件根据 `operatorListData` 的长度决定是否渲染
5. 如果需要渲染，显示除第一个元素外的其余客服

## 兼容性

- 保留了原有的在线客服渲染逻辑（`renderOnlineAgents`）
- 新增的操作员客服渲染逻辑（`renderOperatorAgents`）与原逻辑并行
- 样式互不冲突，可以同时存在

## 测试建议

1. 测试当 `operatorListData` 长度为 0 或 1 时，头部不显示操作员客服
2. 测试当 `operatorListData` 长度大于 1 时，头部显示除第一个外的其余客服
3. 测试操作员客服不可点击切换
4. 测试操作员客服的 hover 效果和 tooltip 显示
5. 测试样式区别（透明度、边框颜色等）