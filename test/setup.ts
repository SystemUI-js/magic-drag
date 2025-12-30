/**
 * Jest 测试设置文件
 */

// BroadcastChannel 在 jsdom 中可能不存在，需要 polyfill
interface MockBroadcastChannel {
    new (name: string): {
        postMessage(data: unknown): void;
        onmessage: ((event: MessageEvent) => void) | null;
        addEventListener(type: string, listener: (event: MessageEvent) => void): void;
        removeEventListener(type: string, listener: (event: MessageEvent) => void): void;
        close(): void;
    };
    prototype: {
        postMessage(data: unknown): void;
        onmessage: ((event: MessageEvent) => void) | null;
        addEventListener(type: string, listener: (event: MessageEvent) => void): void;
        removeEventListener(type: string, listener: (event: MessageEvent) => void): void;
        close(): void;
    };
}

if (typeof (global as unknown as { BroadcastChannel?: MockBroadcastChannel }).BroadcastChannel === 'undefined') {
    // 使用原生 BroadcastChannel 的类型
    const MockBC = class BroadcastChannel {
        private channelName: string;
        private listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();

        constructor(channelName: string) {
            this.channelName = channelName;
        }

        postMessage(_data: unknown): void {
            // 在测试环境中不真正发送消息
        }

        onmessage: ((event: MessageEvent) => void) | null = null;

        addEventListener(_type: string, listener: (event: MessageEvent) => void): void {
            if (!this.listeners.has(this.channelName)) {
                this.listeners.set(this.channelName, new Set());
            }
            this.listeners.get(this.channelName)!.add(listener);
        }

        removeEventListener(_type: string, listener: (event: MessageEvent) => void): void {
            const listeners = this.listeners.get(this.channelName);
            if (listeners) {
                listeners.delete(listener);
            }
        }

        close(): void {
            this.listeners.clear();
        }
    };

    (global as unknown as { BroadcastChannel: MockBroadcastChannel }).BroadcastChannel = MockBC as unknown as MockBroadcastChannel;
}
