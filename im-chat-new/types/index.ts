export type ChatStep = 'business' | 'loadChat' | 'chat' | ''

export interface BusinessBtnItem {
  label: string
  icon: any
  ml: string
}

export type SearchOrderType = 'Orders' | 'Cart'

export interface ImAccountResponse {
  accountId: string
  serverAccountId: string
  token: string
  visitor: true
  customerCode: string
  appId: string
}

export interface ImChatFileItem {
  fileUrl: string
  type: string
  name: string
}
