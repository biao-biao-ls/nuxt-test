// Customer service data management tools
interface CustomerServiceAgent {
  employeeEnName: string
  quickCepId: string
  imageFileIndexId: string
  roleNameEn: string
  isOnline: boolean
  status: number
  businessLine: string
}

// Data structure grouped by business line
type GroupedCustomerServiceData = Record<string, CustomerServiceAgent[]>

/**
 * Customer service data management utility class
 * Provides conversion between raw array format and business line grouped format
 */
export class CustomerServiceDataManager {
  private groupedData: GroupedCustomerServiceData = {}

  /**
   * Convert raw array format to business line grouped object format
   * @param rawData Raw array format customer service data
   * @returns Business line grouped object format
   */
  static convertToGroupedFormat(rawData: CustomerServiceAgent[]): GroupedCustomerServiceData {
    return rawData.reduce((grouped, agent) => {
      if (!grouped[agent.businessLine]) {
        grouped[agent.businessLine] = []
      }
      grouped[agent.businessLine].push(agent)
      return grouped
    }, {} as GroupedCustomerServiceData)
  }

  /**
   * Convert business line grouped object format to array format
   * @param groupedData Business line grouped object format
   * @returns Array format customer service data
   */
  static convertToArrayFormat(groupedData: GroupedCustomerServiceData): CustomerServiceAgent[] {
    const result: CustomerServiceAgent[] = []

    for (const [businessLine, agents] of Object.entries(groupedData)) {
      for (const agent of agents) {
        result.push({
          employeeEnName: (agent as any).employeeNameEn || agent.employeeEnName,
          quickCepId: agent.quickCepId,
          imageFileIndexId: agent.imageFileIndexId,
          roleNameEn: agent.roleNameEn,
          isOnline: agent.isOnline ?? false,
          status: agent.status ?? 1,
          businessLine: agent.businessLine || businessLine
        })
      }
    }

    return result
  }

  /**
   * Set customer service data (from raw array format)
   * @param rawData Raw array format customer service data
   */
  setDataFromArray(rawData: CustomerServiceAgent[]): void {
    this.groupedData = CustomerServiceDataManager.convertToGroupedFormat(rawData)
  }

  /**
   * Set customer service data (from grouped format)
   * @param groupedData Business line grouped object format
   */
  setDataFromGrouped(groupedData: GroupedCustomerServiceData): void {
    this.groupedData = { ...groupedData }
    const totalAgents = this.getArrayData().length
  }

  /**
   * Get grouped format data
   * @returns Business line grouped object format
   */
  getGroupedData(): GroupedCustomerServiceData {
    return { ...this.groupedData }
  }

  /**
   * Get array format data
   * @returns Array format customer service data
   */
  getArrayData(): CustomerServiceAgent[] {
    return CustomerServiceDataManager.convertToArrayFormat(this.groupedData)
  }

  /**
   * Get customer service data for specified business line
   * @param businessLine Business line name
   * @returns Agent array for that business line
   */
  getAgentsByBusinessLine(businessLine: string): CustomerServiceAgent[] {
    return this.groupedData[businessLine] || []
  }

  /**
   * Get all business line names
   * @returns Business line name array
   */
  getBusinessLines(): string[] {
    return Object.keys(this.groupedData)
  }

  /**
   * Update specified agent's status
   * @param quickCepId Agent ID
   * @param status New status
   * @param isOnline Whether online
   */
  updateAgentStatus(quickCepId: string, status: number, isOnline: boolean): boolean {
    for (const businessLine in this.groupedData) {
      const agent = this.groupedData[businessLine].find((a) => a.quickCepId === quickCepId)
      if (agent) {
        agent.status = status
        agent.isOnline = isOnline
        return true
      }
    }
    console.warn(`Agent ID not found: ${quickCepId}`)
    return false
  }

  /**
   * Batch update agent status
   * @param statusUpdates Status update object, key is quickCepId, value is status
   */
  batchUpdateAgentStatus(statusUpdates: Record<string, number>): void {
    let updatedCount = 0

    for (const [quickCepId, status] of Object.entries(statusUpdates)) {
      // Determine online status based on status code (2: Online Available, 3: Online Busy)
      const isOnline = status === 2 || status === 3

      if (this.updateAgentStatus(quickCepId, status, isOnline)) {
        updatedCount++
      }
    }
  }

  /**
   * Find specified agent
   * @param quickCepId Agent ID
   * @returns Agent info or null
   */
  findAgent(quickCepId: string): CustomerServiceAgent | null {
    for (const businessLine in this.groupedData) {
      const agent = this.groupedData[businessLine].find((a) => a.quickCepId === quickCepId)
      if (agent) {
        return agent
      }
    }
    return null
  }

  /**
   * Get online agent count
   * @returns Online agent count
   */
  getOnlineAgentsCount(): number {
    return this.getArrayData().filter((agent) => agent.isOnline).length
  }

  /**
   * Get online agent list
   * @returns Online agent array
   */
  getOnlineAgents(): CustomerServiceAgent[] {
    return this.getArrayData().filter((agent) => agent.isOnline)
  }

  /**
   * Get online agent count for specified business line
   * @param businessLine Business line name
   * @returns Online agent count for that business line
   */
  getOnlineAgentsCountByBusinessLine(businessLine: string): number {
    return this.getAgentsByBusinessLine(businessLine).filter((agent) => agent.isOnline).length
  }
}

// Export type definitions
export type { CustomerServiceAgent, GroupedCustomerServiceData }
