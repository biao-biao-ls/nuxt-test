import { V2NIMMessage } from 'nim-web-sdk-ng/dist/v2/NIM_BROWSER_SDK/V2NIMMessageService'

export * from './enum'

export interface NetNimInitOptions {
  appkey: string
  account: string
  token: string
  serverAccount: string
}

export interface V2NIMBroadcastNotification {
  id: string
  senderId: string
  time: number
  content: string
}

export interface NetNimInitParams {
  onReceiveBroadcastNotifications(broadcastNotification: V2NIMBroadcastNotification[]): void
  onReceiveCustomNotifications(customNotification: any[]): void
  onMessageRevokeNotifications(revokeNotifications: any[]): void
  limit?: number
  onDataSync(): void
  onReceiveMessages(data: V2NIMMessage[]): void
  onReceiveMessagesModified(data: V2NIMMessage[]): void
  onSendMessage(msg: V2NIMMessage): void
  onDisconnected(code: any, message: any): void
  onLoginStatus(status: any): void
  onLoginFailed(code: any, message: any): void
  onConnectStatus(status: any): void
  onConnectFailed(code: any, message: any): void
  onConnectFailed(code: any, message: any): void
}
