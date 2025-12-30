import { Drag, type DragEvent } from '@system-ui-js/multi-drag';
import { BroadcastChannelClient } from './utils/broadcast';
import type {
    MagicDragOptions,
    DragDataPayload,
} from './types';

/**
 * 默认频道名称
 */
export const DEFAULT_CHANNEL_NAME = 'magic-drag';

/**
 * MagicDrag 常量
 */
export const enum MagicDragConstants {
    /** 默认频道名称 */
    ChannelName = 'magic-drag',
    /** Tab ID 存储键名 */
    TabIdKey = 'magic-drag-tab-id',
}

/**
 * 拖拽状态枚举
 */
export const enum DragState {
    /** 空闲状态 */
    Idle = 'idle',
    /** 拖拽中（在当前 Tab） */
    Dragging = 'dragging',
}

/**
 * MagicDrag 抽象类
 *
 * 实现跨浏览器 Tab 拖拽数据传输功能。
 *
 * @typeParam T - 序列化前的原始数据结构
 * @typeParam U - 序列化后的数据类型（如 JSON 字符串）
 *
 * @example
 * ```typescript
 * interface UserData {
 *   id: number;
 *   name: string;
 * }
 *
 * class UserCardDrag extends MagicDrag<UserData, string> {
 *   static serialize<T, U>(data: T): U {
 *     return JSON.stringify(data) as U;
 *   }
 *
 *   static parse<U, T>(serialized: U): T {
 *     return JSON.parse(serialized as string) as T;
 *   }
 *
 *   static render<U>(serialized: U): HTMLElement {
 *     const data = this.parse<U, UserData>(serialized);
 *     const div = document.createElement('div');
 *     div.textContent = data.name;
 *     return div;
 *   }
 * }
 *
 * // 使用
 * const element = document.getElementById('card') as HTMLElement;
 * const drag = new UserCardDrag(element, () => ({ id: 1, name: 'Alice' }));
 * UserCardDrag.bind();
 * ```
 */
export abstract class MagicDrag<T, U> {
    /**
     * 拖拽的元素
     */
    protected readonly element: HTMLElement;

    /**
     * 获取数据的函数
     */
    protected readonly getData: () => T;

    /**
     * multi-drag 的 Drag 实例
     */
    protected readonly drag: Drag;

    /**
     * BroadcastChannel 客户端
     */
    protected readonly channel: BroadcastChannelClient<U>;

    /**
     * 当前 Tab 的唯一标识
     */
    protected readonly tabId: string;

    /**
     * 配置选项
     */
    protected readonly options: Required<MagicDragOptions>;

    /**
     * 当前拖拽状态
     */
    protected state: DragState = DragState.Idle;

    /**
     * 是否为外部拖入的实例（用于区分源和目标）
     */
    private isExternalDrop: boolean = false;

    /**
     * 已绑定的频道名称集合
     */
    private static boundChannels: Set<string> = new Set();

    /**
     * 活跃的 BroadcastChannel 客户端实例
     */
    private static activeChannels: Map<string, BroadcastChannelClient<unknown>> = new Map();

    /**
     * 创建 MagicDrag 实例
     * @param element - 需要拖拽的 HTMLElement
     * @param getData - 获取数据的函数，在拖动开始时调用
     * @param options - 配置选项
     * @throws Error 如果 element 或 getData 无效
     */
    constructor(element: HTMLElement, getData: () => T, options: MagicDragOptions = {}) {
        // 参数验证
        if (!element) {
            throw new Error('Element is required');
        }
        if (typeof getData !== 'function') {
            throw new Error('getData must be a function');
        }

        this.element = element;
        this.getData = getData;
        this.options = {
            channelName: options.channelName ?? MagicDragConstants.ChannelName,
        };
        this.tabId = MagicDrag.generateTabId();

        // 初始化 BroadcastChannel
        this.channel = new BroadcastChannelClient<U>(this.options.channelName);

        // 初始化 multi-drag，使用回调方式绑定事件
        this.drag = new Drag(element, {
            onDragStart: (el: HTMLElement, events: DragEvent[]) => {
                this.handleDragStart(el, events);
            },
            onDragMove: (el: HTMLElement, events: DragEvent[]) => {
                this.handleDragMove(el, events);
            },
            onDragEnd: (el: HTMLElement, events: DragEvent[]) => {
                this.handleDragEnd(el, events);
            },
        });
    }

    // ==================== 抽象静态方法 ====================

    /**
     * 序列化函数
     * 将原始数据 T 转换为可传输的格式 U
     */
    public static serialize<T, U>(_data: T): U {
        throw new Error('serialize must be implemented by subclass');
    }

    /**
     * 反序列化函数
     * 将序列化后的数据 U 还原为原始数据 T
     * @throws Error 如果解析失败
     */
    public static parse<U, T>(serialized: U): T {
        try {
            return JSON.parse(serialized as string) as T;
        } catch (error) {
            throw new Error(`Failed to parse serialized data: ${error}`);
        }
    }

    /**
     * 渲染函数
     * 根据序列化后的数据创建并返回 HTMLElement
     * @param serialized - 序列化后的数据
     * @returns 渲染的 DOM 元素
     */
    public static render<U>(_serialized: U): HTMLElement {
        throw new Error('render must be implemented by subclass');
    }

    // ==================== 静态方法 ====================

    /**
     * 初始化跨 Tab 监听
     * 应在应用初始化时调用一次
     * @param channelName - 可选的频道名称
     */
    public static bind<U, T>(channelName?: string): void {
        const name = channelName ?? MagicDragConstants.ChannelName;

        // 防止重复绑定
        if (MagicDrag.boundChannels.has(name)) {
            return;
        }

        MagicDrag.boundChannels.add(name);

        const channel = new BroadcastChannelClient<U>(name);
        MagicDrag.activeChannels.set(name, channel);

        channel.onMessage((payload: DragDataPayload<U>) => {
            const currentTabId = MagicDrag.getCurrentTabId();

            // 忽略自己发送的消息
            if (payload.sourceTabId === currentTabId) {
                return;
            }

            // 反序列化并渲染
            const data = this.parse<U, T>(payload.serialized);
            const element = this.render<U>(payload.serialized);

            // 创建新的 MagicDrag 实例
            // 传入渲染的元素和从数据中获取的 getData
            const instance = new (this as unknown as new (
                element: HTMLElement,
                getData: () => T,
                options?: MagicDragOptions
            ) => MagicDrag<T, U>)(element, () => data, {
                channelName: name,
            });

            // 标记为外部拖入的实例
            (instance as unknown as { isExternalDrop: boolean }).isExternalDrop = true;
        });
    }

    /**
     * 取消绑定并清理资源
     * @param channelName - 可选的频道名称
     */
    public static unbind(channelName?: string): void {
        const name = channelName ?? MagicDragConstants.ChannelName;

        MagicDrag.boundChannels.delete(name);

        const channel = MagicDrag.activeChannels.get(name);
        if (channel) {
            channel.close();
            MagicDrag.activeChannels.delete(name);
        }
    }

    /**
     * 取消所有绑定并清理所有资源
     */
    public static unbindAll(): void {
        // 清理所有活跃的 channel
        for (const channel of MagicDrag.activeChannels.values()) {
            channel.close();
        }
        MagicDrag.activeChannels.clear();
        MagicDrag.boundChannels.clear();
    }

    /**
     * 生成唯一的 Tab ID
     */
    private static generateTabId(): string {
        const now = Date.now();
        const random = Math.random().toString(36).substring(2, 11);
        return `${now}-${random}`;
    }

    /**
     * 获取当前 Tab 的 ID
     */
    private static getCurrentTabId(): string {
        try {
            if (typeof sessionStorage === 'undefined') {
                return MagicDrag.generateTabId();
            }

            let tabId = sessionStorage.getItem(MagicDragConstants.TabIdKey);
            if (!tabId) {
                tabId = MagicDrag.generateTabId();
                sessionStorage.setItem(MagicDragConstants.TabIdKey, tabId);
            }

            return tabId;
        } catch {
            // 如果 sessionStorage 不可用，生成临时 ID
            return MagicDrag.generateTabId();
        }
    }

    // ==================== 保护方法 ====================

    /**
     * 创建拖拽数据载荷
     */
    protected createPayload(): DragDataPayload<U> {
        const data = this.getData();
        const serialized = (this.constructor as typeof MagicDrag<T, U>).serialize<T, U>(data);

        return {
            serialized,
            sourceTabId: this.tabId,
            timestamp: Date.now(),
        };
    }

    /**
     * 处理拖拽开始
     * @param _el - 拖拽的元素
     * @param _events - 拖拽事件数组
     */
    protected handleDragStart(_el: HTMLElement, _events: DragEvent[]): void {
        if (this.state === DragState.Dragging) {
            return;
        }

        this.state = DragState.Dragging;

        // 通过 BroadcastChannel 发送到其他 Tab
        const payload = this.createPayload();
        this.channel.send(payload);
    }

    /**
     * 处理拖拽移动
     * @param _el - 拖拽的元素
     * @param _events - 拖拽事件数组
     */
    protected handleDragMove(_el: HTMLElement, _events: DragEvent[]): void {
        // 可以在此添加额外的处理逻辑
    }

    /**
     * 处理拖拽结束
     * @param _el - 拖拽的元素
     * @param _events - 拖拽事件数组
     */
    protected handleDragEnd(_el: HTMLElement, _events: DragEvent[]): void {
        this.state = DragState.Idle;
    }

    // ==================== 公开方法 ====================

    /**
     * 获取当前拖拽状态
     */
    public getState(): DragState {
        return this.state;
    }

    /**
     * 获取当前 Tab 的 ID
     */
    public getTabId(): string {
        return this.tabId;
    }

    /**
     * 检查是否为外部拖入的实例
     */
    public isFromExternalDrop(): boolean {
        return this.isExternalDrop;
    }

    /**
     * 获取拖拽的元素
     */
    public getElement(): HTMLElement {
        return this.element;
    }

    /**
     * 销毁实例，释放资源
     */
    public destroy(): void {
        this.handleDragEnd(this.element, []);
        this.channel.close();
        this.drag.destroy();
        this.state = DragState.Idle;
    }
}
