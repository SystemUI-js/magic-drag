/**
 * BroadcastChannelClient 单元测试
 */

import { BroadcastChannelClient } from '../../src/utils/broadcast';
import type { DragDataPayload } from '../../src/types';

describe('BroadcastChannelClient', () => {
    const channelName = 'test-channel';

    afterEach(() => {
        // 清理可能创建的任何 BroadcastChannel
        const channel = new BroadcastChannel(channelName);
        channel.close();
    });

    describe('构造函数', () => {
        it('应该创建 BroadcastChannel 实例', () => {
            const client = new BroadcastChannelClient<string>(channelName);

            expect(client).toBeDefined();
            expect(client.getChannelName()).toBe(channelName);
        });
    });

    describe('getChannelName', () => {
        it('应该返回频道名称', () => {
            const client = new BroadcastChannelClient<string>(channelName);

            expect(client.getChannelName()).toBe(channelName);
        });
    });

    describe('send', () => {
        it('应该能发送载荷数据', () => {
            const client = new BroadcastChannelClient<string>(channelName);

            const payload: DragDataPayload<string> = {
                serialized: 'test-data',
                sourceTabId: 'tab-123',
                timestamp: Date.now(),
            };

            // 应该不抛出错误
            expect(() => client.send(payload)).not.toThrow();
        });
    });

    describe('onMessage', () => {
        it('应该能设置消息监听器', () => {
            const client = new BroadcastChannelClient<string>(channelName);
            const callback = jest.fn();

            // 应该不抛出错误
            expect(() => client.onMessage(callback)).not.toThrow();
        });
    });

    describe('offMessage', () => {
        it('应该能移除消息监听器', () => {
            const client = new BroadcastChannelClient<string>(channelName);

            // 应该不抛出错误
            expect(() => client.offMessage()).not.toThrow();
        });
    });

    describe('close', () => {
        it('应该能关闭频道连接', () => {
            const client = new BroadcastChannelClient<string>(channelName);

            // 应该不抛出错误
            expect(() => client.close()).not.toThrow();
        });
    });
});
