/**
 * Manual mock for @system-ui-js/multi-drag
 */

export class DragEvent {
    identifier: string | number;
    clientX: number;
    clientY: number;
    target: EventTarget | null;
    originalEvent: MouseEvent | TouchEvent;
    type: 'mouse' | 'touch';

    constructor(data: Partial<DragEvent>) {
        this.identifier = data.identifier ?? 0;
        this.clientX = data.clientX ?? 0;
        this.clientY = data.clientY ?? 0;
        this.target = data.target ?? null;
        this.originalEvent = data.originalEvent ?? {} as MouseEvent | TouchEvent;
        this.type = data.type ?? 'mouse';
    }
}

export class Drag {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_element: HTMLElement, _options?: {
        onDragStart?: (el: HTMLElement, events: DragEvent[]) => void;
        onDragMove?: (el: HTMLElement, events: DragEvent[]) => void;
        onDragEnd?: (el: HTMLElement, events: DragEvent[]) => void;
    }) {
        // Mock constructor
    }

    destroy(): void {
        // Mock destroy
    }
}
