// 客服数据管理工具
interface CustomerServiceAgent {
  employeeEnName: string;
  quickCepId: string;
  imageFileIndexId: string;
  roleNameEn: string;
  isOnline: boolean;
  status: number;
  businessLine: string;
}

// 按业务线分组的数据结构
type GroupedCustomerServiceData = Record<string, CustomerServiceAgent[]>;

/**
 * 客服数据管理工具类
 * 提供原始数组格式与按业务线分组格式之间的转换
 */
export class CustomerServiceDataManager {
  private groupedData: GroupedCustomerServiceData = {};

  /**
   * 将原始数组格式转换为按业务线分组的对象格式
   * @param rawData 原始数组格式的客服数据
   * @returns 按业务线分组的对象格式
   */
  static convertToGroupedFormat(rawData: CustomerServiceAgent[]): GroupedCustomerServiceData {
    return rawData.reduce((grouped, agent) => {
      if (!grouped[agent.businessLine]) {
        grouped[agent.businessLine] = [];
      }
      grouped[agent.businessLine].push(agent);
      return grouped;
    }, {} as GroupedCustomerServiceData);
  }

  /**
   * 将按业务线分组的对象格式转换为数组格式
   * @param groupedData 按业务线分组的对象格式
   * @returns 数组格式的客服数据
   */
  static convertToArrayFormat(groupedData: GroupedCustomerServiceData): CustomerServiceAgent[] {
    return Object.values(groupedData).flat();
  }

  /**
   * 设置客服数据（从原始数组格式）
   * @param rawData 原始数组格式的客服数据
   */
  setDataFromArray(rawData: CustomerServiceAgent[]): void {
    this.groupedData = CustomerServiceDataManager.convertToGroupedFormat(rawData);
    console.log(`已设置客服数据，共 ${rawData.length} 个客服，分为 ${Object.keys(this.groupedData).length} 个业务线`);
  }

  /**
   * 设置客服数据（从分组格式）
   * @param groupedData 按业务线分组的对象格式
   */
  setDataFromGrouped(groupedData: GroupedCustomerServiceData): void {
    this.groupedData = { ...groupedData };
    const totalAgents = this.getArrayData().length;
    console.log(`已设置客服数据，共 ${totalAgents} 个客服，分为 ${Object.keys(this.groupedData).length} 个业务线`);
  }

  /**
   * 获取分组格式的数据
   * @returns 按业务线分组的对象格式
   */
  getGroupedData(): GroupedCustomerServiceData {
    return { ...this.groupedData };
  }

  /**
   * 获取数组格式的数据
   * @returns 数组格式的客服数据
   */
  getArrayData(): CustomerServiceAgent[] {
    return CustomerServiceDataManager.convertToArrayFormat(this.groupedData);
  }

  /**
   * 获取指定业务线的客服数据
   * @param businessLine 业务线名称
   * @returns 该业务线的客服数组
   */
  getAgentsByBusinessLine(businessLine: string): CustomerServiceAgent[] {
    return this.groupedData[businessLine] || [];
  }

  /**
   * 获取所有业务线名称
   * @returns 业务线名称数组
   */
  getBusinessLines(): string[] {
    return Object.keys(this.groupedData);
  }

  /**
   * 更新指定客服的状态
   * @param quickCepId 客服ID
   * @param status 新状态
   * @param isOnline 是否在线
   */
  updateAgentStatus(quickCepId: string, status: number, isOnline: boolean): boolean {
    for (const businessLine in this.groupedData) {
      const agent = this.groupedData[businessLine].find(a => a.quickCepId === quickCepId);
      if (agent) {
        agent.status = status;
        agent.isOnline = isOnline;
        console.log(`已更新客服 ${agent.employeeEnName} 状态: ${status}, 在线: ${isOnline}`);
        return true;
      }
    }
    console.warn(`未找到客服 ID: ${quickCepId}`);
    return false;
  }

  /**
   * 批量更新客服状态
   * @param statusUpdates 状态更新对象，key为quickCepId，value为status
   */
  batchUpdateAgentStatus(statusUpdates: Record<string, number>): void {
    let updatedCount = 0;
    
    for (const [quickCepId, status] of Object.entries(statusUpdates)) {
      // 根据状态码判断是否在线 (2: 在线空闲, 3: 在线忙碌)
      const isOnline = status === 2 || status === 3;
      
      if (this.updateAgentStatus(quickCepId, status, isOnline)) {
        updatedCount++;
      }
    }
    
    console.log(`批量更新完成，共更新 ${updatedCount} 个客服状态`);
  }

  /**
   * 查找指定客服
   * @param quickCepId 客服ID
   * @returns 客服信息或null
   */
  findAgent(quickCepId: string): CustomerServiceAgent | null {
    for (const businessLine in this.groupedData) {
      const agent = this.groupedData[businessLine].find(a => a.quickCepId === quickCepId);
      if (agent) {
        return agent;
      }
    }
    return null;
  }

  /**
   * 获取在线客服数量
   * @returns 在线客服数量
   */
  getOnlineAgentsCount(): number {
    return this.getArrayData().filter(agent => agent.isOnline).length;
  }

  /**
   * 获取在线客服列表
   * @returns 在线客服数组
   */
  getOnlineAgents(): CustomerServiceAgent[] {
    return this.getArrayData().filter(agent => agent.isOnline);
  }

  /**
   * 获取指定业务线的在线客服数量
   * @param businessLine 业务线名称
   * @returns 该业务线的在线客服数量
   */
  getOnlineAgentsCountByBusinessLine(businessLine: string): number {
    return this.getAgentsByBusinessLine(businessLine).filter(agent => agent.isOnline).length;
  }
}

// 导出类型定义
export type { CustomerServiceAgent, GroupedCustomerServiceData };