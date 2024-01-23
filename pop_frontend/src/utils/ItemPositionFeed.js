import logger from "loglevel";

export class ItemPositionFeed {
    static depthBeforeAnimating = 10; // Buffers half a second of state time?
    static #instance;

    // Hash map of items and shome history
    items;

    constructor() {
        this.items = {};

        document.addEventListener("visibilitychange", () => {
            this.clearPositions();
        });
    }

    static getItemPositionFeed() {
        if (ItemPositionFeed.instance) return ItemPositionFeed.instance;

        logger.info(`Creating item position feed`);
        ItemPositionFeed.instance = new ItemPositionFeed();

        return ItemPositionFeed.instance;
    }

    // Check buffer depth
    getBufferDepth(label) {
        if (!this.items[label]) return 0;

        return this.items[label].length;
    }

    // Pushes a state update from colyseus into a buffer of updates
    addPositionDelta(label, x, y) {
        // Lazily initialize the array for the label
        if (!this.items[label]) this.items[label] = [];

        this.items[label].push({ x, y });

        return this.items[label].length;
    }

    // "Uses" an update that has been received
    consumePositionDelta(label) {
        return this.items[label].shift();
    }

    // Return the last two position to interpolate between
    getLastPositionPair(label) {
        return [this.items[label][0], this.items[label][1]];
    }

    clearPositions() {
        this.items = {};
    }
}
