export enum V2NIMConnectStatus {
  /**
   * 未连接
   */
  V2NIM_CONNECT_STATUS_DISCONNECTED = 0,
  /**
   * 已连接
   */
  V2NIM_CONNECT_STATUS_CONNECTED = 1,
  /**
   * 连接中
   */
  V2NIM_CONNECT_STATUS_CONNECTING = 2,
  /**
   * 等待重连中
   */
  V2NIM_CONNECT_STATUS_WAITING = 3
}

export enum V2NIMLoginStatus {
  /**
   * 未登录
   *
   * 注: 初始状态也是未登录.
   */
  V2NIM_LOGIN_STATUS_LOGOUT = 0,
  /**
   * 已登录
   */
  V2NIM_LOGIN_STATUS_LOGINED = 1,
  /**
   * 登录中
   */
  V2NIM_LOGIN_STATUS_LOGINING = 2,
  /**
   * 处在退避间隔中
   *
   * 注: 这是一个中间状态, SDK 将会在这个状态下等待一段时间后再次尝试登录
   */
  V2NIM_LOGIN_STATUS_UNLOGIN = 3
}

export enum V2NIMMessageType {
  /** 未知，不合法 */
  V2NIM_MESSAGE_TYPE_INVALID = -1,
  /** 0 文本 */
  V2NIM_MESSAGE_TYPE_TEXT = 0,
  /** 1 图片 */
  V2NIM_MESSAGE_TYPE_IMAGE = 1,
  /** 2 语音 */
  V2NIM_MESSAGE_TYPE_AUDIO = 2,
  /** 3 视频 */
  V2NIM_MESSAGE_TYPE_VIDEO = 3,
  /** 4 位置 */
  V2NIM_MESSAGE_TYPE_LOCATION = 4,
  /** 5 通知 */
  V2NIM_MESSAGE_TYPE_NOTIFICATION = 5,
  /** 6 文件 */
  V2NIM_MESSAGE_TYPE_FILE = 6,
  /** 7 音视频通话 */
  V2NIM_MESSAGE_TYPE_AVCHAT = 7,
  /** 10 提示 */
  V2NIM_MESSAGE_TYPE_TIPS = 10,
  /** 11 机器人 */
  V2NIM_MESSAGE_TYPE_ROBOT = 11,
  /** 12 话单 */
  V2NIM_MESSAGE_TYPE_CALL = 12,
  /** 100 自定义 */
  V2NIM_MESSAGE_TYPE_CUSTOM = 100
}

export enum V2NIMLoginAuthType {
  V2NIM_LOGIN_AUTH_TYPE_DEFAULT = 0, // 静态 Token 登录。
  V2NIM_LOGIN_AUTH_TYPE_DYNAMIC_TOKEN = 1, // 动态 Token 登录。
  V2NIM_LOGIN_AUTH_TYPE_THIRD_PARTY = 2 // 通过第三方回调登录。
}

// 添加好友模式
export enum V2NIMFriendAddMode {
  V2NIM_FRIEND_MODE_TYPE_ADD = 1, //	直接添加对方为好友，无需对方验证。
  V2NIM_FRIEND_MODE_TYPE_APPLY = 2 //	请求添加对方为好友，需要对方验证通过。
}
