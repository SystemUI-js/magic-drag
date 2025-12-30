import type { DragDataPayload } from '../types';

/**
 * BroadcastChannel 客户端封装类
 * 用于跨浏览器 Tab 通信
 */
export class BroadcastChannelClient<U> {
    private readonly channel: BroadcastChannel;
    private readonly channelName: string;

    /**
     * 创建 BroadcastChannel 客户端
     * @param channelName - 频道名称
     */
    constructor(channelName: string) {
        this.channelName = channelName;
        this.channel = new BroadcastChannel(channelName);
    }

    /**
     * 发送拖拽数据到其他 Tab
     * @param payload - 拖拽数据载荷
     */
    public send(payload: DragDataPayload<U>): void {
        this.channel.postMessage(payload);
    }

    /**
     * 设置消息监听器
     * @param callback - 收到消息时的回调函数
     */
    public onMessage(callback: (payload: DragDataPayload<U>) => void): void {
        this.channel.onmessage = (event: MessageEvent<DragDataPayload<U>>) => {
            callback(event.data);
        };
    }

    /**
     * 移除消息监听器
     */
    public offMessage(): void {
        this.channel.onmessage = null;
    }

    /**
     * 关闭频道连接
     */
    public close(): void {
        this.offMessage();
        this.channel.close();
    }

    /**
     * 获取频道名称
     */
    public getChannelName(): string {
        return this.channelName;
    }
}
