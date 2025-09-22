declare global {
  interface Window {
    quickChatReadyHook?: () => void;
    quickEmitter?: {
      on: (event: string, callback: (config: any) => void) => void;
    };
    quickChatApi?: {
       // 设置值到输入框
      setInInputValue: (value: string) => void;
      // 直接发送消息
      sendMessage: (value: string) => void;
      // 触发获取所有座席状态
      emitGetAllOperatorStatus: (operators: string[]) => void;
      // 挂载到底部弹窗
      bottomCustomDrawer: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        setIsShow: (isShow: boolean) => void;
      };
      // 挂载到左侧弹窗 (移动端使用)
      leftCustomDrawer: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        setIsShow: (isShow: boolean) => void;
      };
      // 挂载到头部
      customHeader: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
      };
      // 挂载到底部按钮区域
      customFooter: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
      };
      // 挂载到侧边栏
      customLeftBar: {
        mount: (renderFn: (container: HTMLElement, shadowRoot: ShadowRoot) => void) => void;
        setIsShow: (isShow: boolean) => void;
      };
      // 切换座席
      switchChat: (userId: string) => void
    };
  }
}