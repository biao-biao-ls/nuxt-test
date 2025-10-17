/**
 * 聊天UI样式管理器
 * 提供所有自定义组件的CSS样式
 */
export class ChatStyles {
  /**
   * 生成头部样式
   */
  static generateHeaderStyles(): string {
    return `
      <style>
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chat-header-agents {
          display: flex;
          align-items: center;
        }

        .chat-header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .online-agent {
          position: relative;
          cursor: pointer;
          transition: transform 0.2s ease;
          z-index: 1;
        }

        .current-agent {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-right: 12px;
        }

        .agent-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .default-avatar {
          display: block;
          border-radius: 50%;
          overflow: hidden;
        }

        .agent-name-display {
          font-size: 14px;
          font-weight: 500;
          color: #444;
          white-space: nowrap;
        }

        .online-agent:not(:first-child) {
          margin-left: -3px;
        }

        .online-agent:hover {
          transform: scale(1.05);
        }

        .agent-avatar {
          border-radius: 50%;
          border: 1px solid #dee2e6;
          object-fit: fill;
        }

        .agent-avatar.current {
          width: 36px;
          height: 36px;
          border-width: 2px;
        }

        .agent-avatar.online {
          width: 25px;
          height: 25px;
        }

        .status-indicator {
          position: absolute;
          right: 0px;
          top: 2px;
          width: 4px;
          height: 4px;
          border: 1px solid white;
          border-radius: 50%;
        }

        .current-agent .status-indicator {
          width: 6px;
          height: 6px;
        }

        .more-agents {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #d8d8d8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .more-agents:hover {
          background: #5a6268;
        }

        .open-leftbar-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: absolute;
          top: 10px;
          right: 65px;
          overflow: visible;
        }

        .open-leftbar-icon svg {
          fill: #444 !important;
          width: 24px;
          height: 24px;
          display: block;
        }

        .open-leftbar-icon svg path {
          fill: #444 !important;
        }

        .expand-icon-reverse {
        }

        .no-agents {
          color: #d8d8d8;
          font-size: 12px;
          font-style: italic;
        }

        .online-count {
          font-size: 11px;
          color: #d8d8d8;
        }

        .toggle-btn {
          background: none;
          border: 1px solid #dee2e6;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #d8d8d8;
          transition: all 0.2s ease;
        }

        .toggle-btn:hover {
          background: #f8f9fa;
          border-color: #adb5bd;
        }

        .agent-tooltip {
          position: absolute !important;
          background: rgba(45, 45, 45, 0.95) !important;
          color: white !important;
          padding: 16px 20px !important;
          border-radius: 16px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          line-height: 1.3 !important;
          z-index: 10000 !important;
          display: none !important;
          pointer-events: none !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.25) !important;
          max-width: 320px !important;
          min-width: 200px !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
        }

        .agent-tooltip::before {
          content: '' !important;
          position: absolute !important;
          top: 100% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 0 !important;
          height: 0 !important;
          border-left: 15px solid transparent !important;
          border-right: 15px solid transparent !important;
          border-top: 15px solid rgba(45, 45, 45, 0.95) !important;
          z-index: 10001 !important;
          display: block !important;
        }

        .agent-tooltip::after {
          content: '' !important;
          position: absolute !important;
          top: calc(100% - 1px) !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 0 !important;
          height: 0 !important;
          border-left: 16px solid transparent !important;
          border-right: 16px solid transparent !important;
          border-top: 16px solid rgba(255, 255, 255, 0.1) !important;
          z-index: 10000 !important;
          display: block !important;
        }

      </style>
    `
  }

  /**
   * 生成左侧栏样式
   */
  static generateLeftBarStyles(): string {
    return `
      <style>
        .left-bar {
          width: 140px;
          height: 100%;
          box-sizing: border-box;
          z-index: 999;
          display: flex;
          flex-direction: column;
          padding: 24px 0;
          background: #f1f3f6;
        }

        .left-bar-content {
          flex: 1;
          overflow-y: auto;
          /* 隐藏滚动条 */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 和 Edge */
        }

        .left-bar-content::-webkit-scrollbar {
          display: none; /* Chrome, Safari 和 Opera */
        }

        .left-bar-footer {
          padding-top: 8px;
          padding-left: 8px;
        }

        .left-bar-footer .expand-icon{
          transform: rotate(180deg);
          cursor: pointer;
        }

        .left-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .left-bar-header h4 {
          margin: 0;
          color: #495057;
          font-size: 13px;
          font-weight: 600;
        }

        .close-btn {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          color: #d8d8d8;
          cursor: pointer;
          font-size: 16px;
          padding: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-weight: bold;
        }

        .close-btn:hover {
          background: #e9ecef;
          border-color: #adb5bd;
          color: #495057;
        }

        .business-line-group {
          margin-bottom: 16px;
        }

        .business-line-title {
          font-size: 16px;
          color: #000;
          margin-bottom: 4px;
          font-weight: 600;
          padding-left: 8px;
          padding-right: 8px;
          padding-bottom: 4px;
        }

        .agents-list {
          display: flex;
          flex-direction: column;
          gap: 0px;
        }

        .agent-item {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid transparent;
          transition: all 0.2s ease;
          padding: 8px;
        }

        .agent-item.online {
          cursor: pointer;
          opacity: 1;
        }

        .agent-item.offline {
          cursor: not-allowed;
        }

        .agent-item.current {
          background: #d7ebff;
        }

        .agent-item.online:hover:not(.current) {
        }

        .agent-avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .agent-avatar-container .agent-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #dee2e6;
          object-fit: fill;
        }

        .agent-avatar-container .status-indicator {
          position: absolute;
          right: 0px;
          top: 2px;
          width: 6px;
          height: 6px;
          border: 1px solid white;
          border-radius: 50%;
        }

        .agent-info {
          flex: 1;
          min-width: 0;
        }

        .agent-name {
          font-size: 14px;
          line-height: 1.2;
          color: #222;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .agent-role {
          font-size: 12px;
          line-height: 1.2;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .agent-item.online .agent-role {
          color: #999;
        }

        .agent-item.offline .agent-role {
          color: #999;
        }

        .agent-item.current .agent-name {
          color: #0072fc;
        }

        .current-indicator {
          color: #999;
          font-size: 12px;
        }
      </style>
    `
  }

  /**
   * 生成底部样式
   */
  static generateFooterStyles(): string {
    return `
      <style>
        .chat-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-btn {
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .footer-btn.voice {
          background: #48DE8C;
          color: white;
        }

        .footer-btn.voice:hover {
          background: #218838;
        }

        .footer-btn.file {
          background: #17a2b8;
          color: white;
        }

        .footer-btn.file:hover {
          background: #138496;
        }

        .footer-btn.rating {
          background: #ffc107;
          color: #212529;
        }

        .footer-btn.rating:hover {
          background: #e0a800;
        }

        .footer-btn.add-btn {
          background: transparent;
          border: none;
          padding: 0px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-btn.add-btn svg {
          width: 18px;
          height: 18px;
          color: rgba(0, 0, 0, 0.45);
        }

        .footer-btn.order-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .footer-btn.order-btn:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .footer-btn.order-btn svg {
          width: 16px;
          height: 16px;
        }

        .footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      </style>
    `
  }
}

export default ChatStyles
