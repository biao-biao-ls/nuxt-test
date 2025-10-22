# 简单订单选择器 - 滚动分页功能

## 功能概述

为 `useSimpleOrderSelector.ts` 添加了滚动分页加载功能，支持在用户滚动到列表底部时自动加载更多数据。

## 新增功能

### 1. 滚动分页加载
- **触发条件**：当用户滚动到列表底部附近（90%）时自动触发
- **加载方式**：增量加载，新数据追加到现有列表末尾
- **防重复加载**：通过 `loadingMore` 状态防止重复请求

### 2. 分页状态管理
```typescript
pagination: {
  Orders: {
    currentPage: number    // 当前页码
    pageSize: number      // 每页大小（默认20）
    hasMore: boolean      // 是否还有更多数据
    total: number         // 总数据量
  }
  Cart: { ... }          // 购物车分页状态
}
```

### 3. 视觉反馈
- **加载指示器**：显示加载动画和"Loading more..."文本
- **数据统计**：显示"当前数量/总数量"
- **完成提示**：显示"All X items loaded"
- **滚动提示**：提示用户"Scroll down to load more"

### 4. 搜索重置
- 搜索时自动重置分页状态
- 重新从第一页开始加载
- 清除之前的缓存数据

## 使用方法

### 基本使用
```typescript
const orderSelector = new SimpleOrderSelector();
orderSelector.mount(containerElement);
orderSelector.show();
```

### API 方法
```typescript
// 显示/隐藏
orderSelector.show();
orderSelector.hide();

// 缓存管理
orderSelector.clearCache();        // 清除所有缓存
orderSelector.refreshCurrentTab(); // 刷新当前标签页

// 搜索
orderSelector.handleSearch();      // 执行搜索（自动重置分页）
```

## 技术实现

### 1. 滚动监听
```typescript
handleScroll(event: Event): void {
  const target = event.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;
  const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
  
  // 滚动到90%时触发加载更多
  if (scrollPercentage > 0.9 && !this.state.loadingMore && this.state.pagination[this.state.activeName].hasMore) {
    this.loadMore();
  }
}
```

### 2. 数据加载
```typescript
// 支持追加模式的数据加载
private async loadOrdersData(append: boolean = false): Promise<void> {
  // ... API 调用
  
  if (append) {
    // 追加模式：合并新数据
    this.state.orderList = [...this.state.orderList, ...newData];
  } else {
    // 替换模式：替换所有数据
    this.state.orderList = newData;
  }
}
```

### 3. 分页信息更新
```typescript
// 更新分页状态
pagination.total = result.data.total || 0;
pagination.hasMore = newData.length === pagination.pageSize && 
                    (pagination.currentPage * pagination.pageSize) < pagination.total;
```

## 样式说明

### 新增CSS类
- `.load-more-indicator` - 加载更多指示器
- `.loading-spinner` - 加载动画
- `.no-more-data` - 无更多数据提示
- `.scroll-hint` - 滚动提示

### 响应式设计
- 支持移动端和桌面端
- 自适应容器大小
- 平滑的加载动画

## 测试

使用 `test-scroll-pagination.html` 进行功能测试：

1. 打开测试页面
2. 点击"显示订单选择器"
3. 在列表中向下滚动测试分页加载
4. 测试搜索功能的分页重置
5. 切换标签页测试不同数据源的分页

## 注意事项

1. **性能优化**：大量数据时建议启用虚拟滚动
2. **错误处理**：网络错误时会回退页码，避免状态不一致
3. **缓存策略**：搜索和刷新会清除相关缓存
4. **兼容性**：支持现有的懒加载和预加载功能

## 配置选项

可以通过修改构造函数中的分页配置来调整行为：

```typescript
pagination: {
  Orders: {
    currentPage: 1,
    pageSize: 20,        // 可调整每页大小
    hasMore: true,
    total: 0
  }
}
```

## 未来扩展

- 支持虚拟滚动优化大数据量性能
- 添加下拉刷新功能
- 支持自定义分页大小
- 添加分页跳转功能