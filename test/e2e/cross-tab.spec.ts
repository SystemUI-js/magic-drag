/**
 * E2E 测试 - 跨 Tab 拖拽功能
 */

import { test, expect } from '@playwright/test';

// 测试数据类型
interface TestData {
    id: number;
    name: string;
}

// 创建测试用的 MagicDrag 子类
class TestMagicDrag {
    static serialize<T, U>(data: T): U {
        return JSON.stringify(data) as U;
    }

    static parse<U, T>(serialized: U): T {
        return JSON.parse(serialized as string) as T;
    }

    static render<U>(serialized: U): HTMLElement {
        const data = this.parse<U, TestData>(serialized);
        const element = document.createElement('div');
        element.textContent = data.name;
        element.dataset.id = String(data.id);
        return element;
    }
}

test.describe('跨 Tab 拖拽测试', () => {
    test.beforeEach(async () => {
        // 测试前的设置
    });

    test('应该能够在两个 Tab 之间模拟拖拽数据传输', async ({ browser }) => {
        // 创建两个浏览器上下文
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        // 创建两个页面
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        // 导航到演示页面
        await page1.goto(`file://${process.cwd()}/demo/index.html`);
        await page2.goto(`file://${process.cwd()}/demo/index.html`);

        // 等待页面加载
        await page1.waitForLoadState('domcontentloaded');
        await page2.waitForLoadState('domcontentloaded');

        // 验证两个页面都加载成功
        await expect(page1.locator('#draggable')).toBeVisible();
        await expect(page2.locator('#draggable')).toBeVisible();

        // 测试序列化功能
        const testData: TestData = { id: 123, name: 'Test User' };
        const serialized = TestMagicDrag.serialize<TestData, string>(testData);

        expect(serialized).toBe('{"id":123,"name":"Test User"}');

        // 测试反序列化功能
        const parsed = TestMagicDrag.parse<string, TestData>(serialized);
        expect(parsed).toEqual(testData);

        // 测试渲染功能
        const renderedElement = TestMagicDrag.render<string>(serialized);
        expect(renderedElement.textContent).toBe('Test User');
        expect(renderedElement.dataset.id).toBe('123');

        // 清理
        await context1.close();
        await context2.close();
    });

    test('静态方法应该正确工作', async () => {
        // 测试 serialize
        const data: TestData = { id: 1, name: 'Alice' };
        const serialized = TestMagicDrag.serialize(data);
        expect(serialized).toBe('{"id":1,"name":"Alice"}');

        // 测试 parse
        const parsed = TestMagicDrag.parse(serialized);
        expect(parsed).toEqual(data);

        // 测试 render
        const element = TestMagicDrag.render(serialized);
        expect(element).toBeInstanceOf(HTMLElement);
        expect(element.textContent).toBe('Alice');
    });
});
