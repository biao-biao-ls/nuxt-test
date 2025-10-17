// Customer service data API interface
interface CustomerServiceAgent {
  employeeEnName: string
  quickCepId: string
  imageFileIndexId: string
  roleNameEn: string
  isOnline: boolean
  status: number
  businessLine: string
}

/**
 * Customer Service Data API Manager
 * Used to fetch customer service data from external data sources
 */
export class CustomerServiceAPI {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  /**
   * Fetch customer service data from API
   */
  async fetchCustomerServiceData(): Promise<CustomerServiceAgent[]> {
    try {
      // This can be replaced with actual API calls
      const response = await fetch(`${this.baseURL}/customer-service/agents`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return data
    } catch (error) {
      console.error('Failed to fetch customer service data:', error)

      // Return default data as fallback
      return this.getDefaultCustomerServiceData()
    }
  }

  /**
   * Fetch customer service data from local JSON file
   */
  async fetchFromLocalFile(filePath: string = '/customer-service-data.json'): Promise<CustomerServiceAgent[]> {
    try {
      const response = await fetch(filePath)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return data
    } catch (error) {
      console.error('Failed to fetch customer service data from local file:', error)

      // Return default data as fallback
      return this.getDefaultCustomerServiceData()
    }
  }

  /**
   * Get default customer service data
   */
  private getDefaultCustomerServiceData(): CustomerServiceAgent[] {
    return [
      {
        employeeEnName: 'test_01',
        quickCepId: '1938524999731687426',
        imageFileIndexId: '8454635530497527808',
        roleNameEn: 'Business Development Representative',
        isOnline: false,
        status: 1,
        businessLine: '3D Printing'
      },
      {
        employeeEnName: 'caocao',
        quickCepId: '1942407035945005058',
        imageFileIndexId: '8454682774852571136',
        roleNameEn: 'Quality Assurance Agent',
        isOnline: false,
        status: 1,
        businessLine: '3D Printing'
      },
      {
        employeeEnName: '2121',
        quickCepId: '1938532940512280577',
        imageFileIndexId: '8455707418908921856',
        roleNameEn: 'Customer Service Representative',
        isOnline: false,
        status: 1,
        businessLine: 'PCB Assembly'
      },
      {
        employeeEnName: 'xiaozhou',
        quickCepId: '1938144757068906498',
        imageFileIndexId: '8593772030083227648',
        roleNameEn: 'Technical Support Specialist',
        isOnline: false,
        status: 1,
        businessLine: 'PCB Assembly'
      },
      {
        employeeEnName: 'Alex',
        quickCepId: '1946056607741292545',
        imageFileIndexId: '8593772229182779392',
        roleNameEn: 'Client Relations Manager',
        isOnline: false,
        status: 1,
        businessLine: 'SMT Services'
      },
      {
        employeeEnName: 'yxy',
        quickCepId: '1938475369237098497',
        imageFileIndexId: '8630496439324213248',
        roleNameEn: 'Account Manager',
        isOnline: false,
        status: 1,
        businessLine: 'SMT Services'
      },
      {
        employeeEnName: 'Ryan',
        quickCepId: '1942107108466016257',
        imageFileIndexId: '8630498147114913792',
        roleNameEn: 'Sales Consultant',
        isOnline: false,
        status: 1,
        businessLine: 'Components'
      },
      {
        employeeEnName: 'Xie Yulang',
        quickCepId: '1948591855846862849',
        imageFileIndexId: '8636932414868172800',
        roleNameEn: 'Account Manager',
        isOnline: false,
        status: 1,
        businessLine: 'Components'
      }
    ]
  }

  /**
   * Validate customer service data format
   */
  validateCustomerServiceData(data: any[]): CustomerServiceAgent[] {
    return data.filter((agent) => {
      return (
        typeof agent.employeeEnName === 'string' &&
        typeof agent.quickCepId === 'string' &&
        typeof agent.imageFileIndexId === 'string' &&
        typeof agent.roleNameEn === 'string' &&
        typeof agent.isOnline === 'boolean' &&
        typeof agent.status === 'number' &&
        typeof agent.businessLine === 'string'
      )
    })
  }
}

export default CustomerServiceAPI
