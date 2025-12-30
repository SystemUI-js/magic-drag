/**
 * MagicDrag 库的类型定义
 */

/**
 * MagicDrag 的配置选项
 */
export interface MagicDragOptions {
    /**
     * BroadcastChannel 的名称，默认为 'magic-drag'
     */
    channelName?: string;
}

/**
 * 拖拽数据的载荷，通过 BroadcastChannel 发送
 */
export interface DragDataPayload<U> {
    /**
     * 序列化后的数据
     */
    serialized: U;
    /**
     * 源 Tab 的 ID
     */
    sourceTabId: string;
    /**
     * 时间戳
     */
    timestamp: number;
}

/**
 * 拖拽开始事件详情
 */
export interface DragStartEventDetail<T> {
    /**
     * 原始数据
     */
    data: T;
    /**
     * 原始事件（PointerEvent 或 TouchEvent）
     */
    originalEvent: PointerEvent | TouchEvent;
}

/**
 * 拖拽结束事件详情
 */
export interface DragEndEventDetail<T> {
    /**
     * 原始数据
     */
    data: T;
    /**
     * 是否成功投放到其他 Tab
     */
    droppedInTab: boolean;
}
