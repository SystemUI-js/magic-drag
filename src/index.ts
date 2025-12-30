/**
 * MagicDrag 库
 *
 * 跨浏览器 Tab 拖拽数据传输的抽象类
 */

// 导出核心类、枚举和常量
export { MagicDrag, DragState, DEFAULT_CHANNEL_NAME, MagicDragConstants } from './MagicDrag';

// 导出类型定义
export type {
    MagicDragOptions,
    DragDataPayload,
    DragStartEventDetail,
    DragEndEventDetail,
} from './types';

// 导出 BroadcastChannel 工具类（供高级用户使用）
export { BroadcastChannelClient } from './utils/broadcast';
