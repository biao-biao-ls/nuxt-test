import { ChatCustomUI } from './quickCep/useChatCustomUI'
import { SimpleOrderSelector } from './quickCep/useSimpleOrderSelector'

declare global {
  interface Window {
    quickChatReadyHook?: () => void;
    quickEmitter?: {
      on: (event: string, callback: (config: any) => void) => void;
      emit: (event: string, data?: any) => void;
      off: (event: string, callback?: (config: any) => void) => void;
    };
    quickChatApi?: {
      // 配置属性
      eventPrefix: string;
      readyEventWasFired: boolean;
      widgetAuto: boolean;
      openConditionFn: () => boolean;
      
      // 基础聊天功能
      open: () => void;
      close: () => void;
      chat: () => Promise<void>;
      
      // 沙盒功能
      openSandBox: (params?: any) => void;
      sendBotSandBox: (message: any) => void;
      sendMesSandBox: (message: any) => void;
      
      // 消息相关
      sendMessage: () => Promise<void>;
      setInInputValue: (value: string) => void;
      messageFromOperator: (message: any) => void;
      messageFromVisitor: (message: any) => void;
      clearCurrentMessageListFn: () => void;
      
      // 用户和访客管理
      getUserUUID: () => string;
      identify: (userData: any) => void;
      setVisitorData: () => void;
      setContactProperties: (properties: any) => void;
      setCustomParameters: (params: any) => void;
      addVisitorTags: (tags: any) => void;
      
      // 座席管理
      emitGetAllOperatorStatus: (operators: string[]) => void;
      switchChat: (userId: string) => void;
      
      // 界面控制
      changeZoom: (zoomLevel: any) => void;
      switchLanguage: (language: any) => void;
      cancelTemporarilyHide: (params?: any) => Promise<void>;
      
      // 事件系统
      on: (event: string, callback: (data: any) => void) => void;
      track: (eventData: any) => void;
      triggerFlowbot: (params: any) => Promise<void>;
      
      // 挂载到底部弹窗
      bottomCustomDrawer: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        setIsShow: (isShow: boolean) => void;
        [key: string]: any;
      };
      
      // 挂载到左侧弹窗 (移动端使用)
      leftCustomDrawer: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        setIsShow: (isShow: boolean) => void;
        [key: string]: any;
      };
      
      // 挂载到头部
      customHeader: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        [key: string]: any;
      };
      
      // 挂载到底部按钮区域
      customFooter: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        [key: string]: any;
      };
      
      // 挂载到侧边栏
      customLeftBar: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        setIsShow: (isShow: boolean) => void;
        [key: string]: any;
      };
      
      // 允许其他可能的方法和属性
      [key: string]: any;
    };
    chatUI?: ChatCustomUI;
    simpleOrderSelector?: SimpleOrderSelector;
    debugQuickChat?: any;
  }
}