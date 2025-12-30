/**
 * MagicDrag 单元测试
 */

import { MagicDrag, DragState } from '../../src/MagicDrag';

// 测试数据类型
interface TestData {
    id: number;
    name: string;
}

// 创建测试用的 MagicDrag 子类
class TestMagicDrag extends MagicDrag<TestData, string> {
    public static serialize<T, U>(data: T): U {
        return JSON.stringify(data) as U;
    }

    public static parse<U, T>(serialized: U): T {
        return JSON.parse(serialized as string) as T;
    }

    public static render<U>(serialized: U): HTMLElement {
        const data = this.parse<U, TestData>(serialized);
        const element = document.createElement('div');
        element.textContent = data.name;
        element.dataset.id = String(data.id);
        return element;
    }
}

describe('MagicDrag', () => {
    let element: HTMLElement;
    let getData: () => TestData;

    beforeEach(() => {
        // 创建测试元素
        element = document.createElement('div');
        element.id = 'test-draggable';
        document.body.appendChild(element);

        // 创建 getData 函数
        getData = () => ({ id: 1, name: 'Test' });
    });

    afterEach(() => {
        // 清理 DOM
        document.body.removeChild(element);
    });

    describe('构造函数', () => {
        it('应该正确初始化元素和 getData 函数', () => {
            const drag = new TestMagicDrag(element, getData);

            expect(drag).toBeDefined();
            expect(drag.getElement()).toBe(element);
        });

        it('应该使用默认配置选项', () => {
            const drag = new TestMagicDrag(element, getData);

            expect(drag.getState()).toBe(DragState.Idle);
        });
    });

    describe('静态方法', () => {
        describe('serialize', () => {
            it('应该正确序列化数据', () => {
                const data: TestData = { id: 42, name: 'Alice' };
                const serialized = TestMagicDrag.serialize(data);

                expect(serialized).toBe('{"id":42,"name":"Alice"}');
            });
        });

        describe('parse', () => {
            it('应该正确反序列化数据', () => {
                const serialized = '{"id":42,"name":"Alice"}';
                const data = TestMagicDrag.parse(serialized);

                expect(data).toEqual({ id: 42, name: 'Alice' });
            });
        });

        describe('render', () => {
            it('应该根据序列化数据渲染 HTMLElement', () => {
                const serialized = '{"id":42,"name":"Alice"}';
                const renderedElement = TestMagicDrag.render(serialized);

                expect(renderedElement).toBeInstanceOf(HTMLElement);
                expect(renderedElement.textContent).toBe('Alice');
                expect(renderedElement.dataset.id).toBe('42');
            });
        });
    });

    describe('DragState 枚举', () => {
        it('应该包含正确的状态值', () => {
            expect(DragState.Idle).toBe('idle');
            expect(DragState.Dragging).toBe('dragging');
        });
    });
});
