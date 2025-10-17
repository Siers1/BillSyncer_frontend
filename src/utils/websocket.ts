import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { getUnReadInvitation } from '@/api/invitation';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private readonly maxReconnectAttempts = 5;
  private reconnectAttempts = 0;
  private readonly reconnectInterval = 3000;
  private isManuallyDisconnected = false; // 标记是否手动断开连接

  // 心跳相关
  private heartbeatTimer: number | null = null;
  private heartbeatResponseTimer: number | null = null;
  private readonly heartbeatInterval = 30000; // 30秒发送一次心跳
  private readonly heartbeatTimeout = 5000; // 5秒心跳响应超时
  private missedHeartbeats = 0;
  private readonly maxMissedHeartbeats = 3; // 最多允许连续3次心跳失败

  // 响应式的未读消息数量
  public unreadCount = ref<number>(0);
  
  // 消息回调
  private onMessageCallbacks: ((message: string) => void)[] = [];

  constructor() {
    // 不在构造函数中自动连接，等待手动调用
  }

  private connect() {
    const authStore = useAuthStore();
    
    if (!authStore.accessToken) {
      console.warn('WebSocket: 未找到accessToken，无法连接');
      return false;
    }

    // 如果已经连接且token相同，不需要重连
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket: 已经连接，无需重复连接');
      return true;
    }

    // 先断开现有连接
    if (this.socket) {
      this.socket.close();
    }

    try {
      let wsUrl: string;
      
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = `ws://localhost:8080/websocket/${authStore.accessToken}`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;
        wsUrl = `${protocol}//${hostname}:8080/websocket/${authStore.accessToken}`;
      }
      
      console.log('WebSocket: 尝试连接到', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.onOpen.bind(this);
      this.socket.onmessage = this.onMessage.bind(this);
      this.socket.onclose = this.onClose.bind(this);
      this.socket.onerror = this.onError.bind(this);
      
      return true;
    } catch (error) {
      console.error('WebSocket: 连接失败', error);
      return false;
    }
  }

  private async onOpen(event: Event) {
    console.log('WebSocket连接成功');
    this.reconnectAttempts = 0;
    this.missedHeartbeats = 0;
    
    try {
      // 连接成功后获取未读消息数量
      await this.updateUnreadCount();
      console.log('WebSocket: 连接成功，未读数量已初始化为', this.unreadCount.value);
    } catch (error) {
      console.error('WebSocket: 初始化未读数量失败', error);
    }
    
    // 启动心跳机制
    this.startHeartbeat();
  }

  private async onMessage(event: MessageEvent) {
    // 处理心跳响应
    if (event.data === 'pong') {
      this.handleHeartbeatResponse();
      return;
    }
    
    // 处理单点登录消息
    if (event.data === '您的账号在其他设备登录，即将自动退出') {
      console.warn('WebSocket: 检测到单点登录，准备退出当前账号');
      this.handleSingleSignOn();
      return;
    }
    
    try {
      // 收到消息后立即更新未读数量
      console.log('WebSocket: 收到新消息，正在更新未读数量...');
      await this.updateUnreadCount();
      console.log('WebSocket: 未读数量已更新为', this.unreadCount.value);
      
      // 通知所有监听器（在更新完未读数量后）
      this.onMessageCallbacks.forEach(callback => {
        try {
          callback(event.data);
        } catch (callbackError) {
          console.error('WebSocket: 消息监听器回调失败', callbackError);
        }
      });
    } catch (error) {
      console.error('WebSocket: 处理消息失败', error);
      // 即使更新未读数量失败，也要通知监听器
      this.onMessageCallbacks.forEach(callback => {
        try {
          callback(event.data);
        } catch (callbackError) {
          console.error('WebSocket: 消息监听器回调失败', callbackError);
        }
      });
    }
  }

  private onClose(event: CloseEvent) {
    console.log('WebSocket连接关闭:', event.code, event.reason);
    this.socket = null;
    
    // 清理心跳定时器
    this.clearHeartbeat();
    
    // 如果不是正常关闭且不是手动断开，尝试重连
    if (event.code !== 1000 && !this.isManuallyDisconnected) {
      this.scheduleReconnect();
    }
  }

  private onError(event: Event) {
    console.error('WebSocket错误:', event);
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    console.log(`准备重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  private async updateUnreadCount() {
    const count = await getUnReadInvitation();
    this.unreadCount.value = count;
  }

  public addMessageListener(callback: (message: string) => void) {
    this.onMessageCallbacks.push(callback);
  }

  public send(message: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    } else {
      console.warn('WebSocket未连接，无法发送消息');
    }
  }

  public disconnect() {
    this.isManuallyDisconnected = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // 清理心跳定时器
    this.clearHeartbeat();
    
    if (this.socket) {
      this.socket.close(1000, '主动断开连接');
      this.socket = null;
    }
    
    // 重置重连次数
    this.reconnectAttempts = 0;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // 手动刷新未读数量  
  public async refreshUnreadCount() {
    await this.updateUnreadCount();
  }

  // 初始化WebSocket连接
  public init() {
    this.isManuallyDisconnected = false;
    return this.connect();
  }

  // 重新连接WebSocket（用于token更新后）
  public reconnect() {
    console.log('WebSocket: 准备重新连接');
    this.disconnect();
    setTimeout(() => {
      this.init();
    }, 100); // 短暂延迟确保断开完成
  }

  // 启动心跳机制
  private startHeartbeat() {
    this.clearHeartbeat();
    
    this.heartbeatTimer = setTimeout(() => {
      this.sendHeartbeat();
    }, this.heartbeatInterval);
  }

  // 清理心跳定时器
  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.heartbeatResponseTimer) {
      clearTimeout(this.heartbeatResponseTimer);
      this.heartbeatResponseTimer = null;
    }
  }

  // 发送心跳
  private sendHeartbeat() {
    if (!this.isConnected()) {
      console.warn('WebSocket未连接，无法发送心跳');
      return;
    }

    this.socket!.send('ping');

    // 设置心跳响应超时定时器
    this.heartbeatResponseTimer = setTimeout(() => {
      this.handleHeartbeatTimeout();
    }, this.heartbeatTimeout);
  }

  // 处理心跳响应
  private handleHeartbeatResponse() {
    this.missedHeartbeats = 0;

    // 清除响应超时定时器
    if (this.heartbeatResponseTimer) {
      clearTimeout(this.heartbeatResponseTimer);
      this.heartbeatResponseTimer = null;
    }

    // 安排下一次心跳
    this.startHeartbeat();
  }

  // 处理心跳超时
  private handleHeartbeatTimeout() {
    this.missedHeartbeats++;
    console.warn(`心跳超时 (${this.missedHeartbeats}/${this.maxMissedHeartbeats})`);

    if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
      console.error('连续心跳失败，主动断开连接并重连');
      this.socket?.close();
    } else {
      // 继续尝试发送心跳
      this.startHeartbeat();
    }
  }

  // 处理单点登录
  private handleSingleSignOn() {
    try {
      console.log('WebSocket: 检测到单点登录，准备通知UI层');
      
      // 先通知UI层显示确认框，不要立即断开连接
      this.notifyUIForSingleSignOn();
      
      // 动态导入认证store以避免循环依赖
      import('@/stores/authStore').then(({ useAuthStore }) => {
        const authStore = useAuthStore();
        console.log('WebSocket: 执行单点登录退出');
        authStore.logout();
      }).catch(error => {
        console.error('WebSocket: 单点登录处理失败', error);
      });
    } catch (error) {
      console.error('WebSocket: 单点登录处理异常', error);
    }
  }

  // 通知UI层显示单点登录消息
  private notifyUIForSingleSignOn() {
    // 通过消息回调通知UI层
    this.onMessageCallbacks.forEach(callback => {
      try {
        callback('SINGLE_SIGN_ON_LOGOUT');
      } catch (callbackError) {
        console.error('WebSocket: 单点登录UI通知失败', callbackError);
      }
    });
  }

  // 移除消息监听器的方法
  public removeMessageListener(callback: (message: string) => void) {
    const index = this.onMessageCallbacks.indexOf(callback);
    if (index > -1) {
      this.onMessageCallbacks.splice(index, 1);
    }
  }
}

// 单例WebSocket服务
export const webSocketService = new WebSocketService();
