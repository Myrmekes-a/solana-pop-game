export default class Balloon {
    steps = 5;
    px = 0;
    py = 0;
    x = 0;
    y = 0;
    dx = 0;
    dy = 0;
    dw = 50;
    dh = 43;
    s = 102;
    state = "unpopped";
    ctx;
    images = [];
    mask;
    requestId = 0;

    constructor(ctx, images, mask, x, y) {
        this.ctx = ctx;
        this.images = images;
        this.mask = mask;
        this.x = x;
        this.y = y;
    }

    move(steps) {
        if (steps <= 0) {
            cancelAnimationFrame(this.requestId);
            this.requestId = 0;
            return;
        }

        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.drawImage(this.mask, Math.round(this.px - this.dw), Math.round(this.py - this.dh));
        this.px += this.dx;
        this.py += this.dy;
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.drawImage(this.images[0], Math.round(this.px - this.dw), Math.round(this.py - this.dh));

        this.requestId = requestAnimationFrame(() => {
            this.move(steps - 1);
        });
    }

    pop(steps) {
        if (steps >= this.images.length) {
            cancelAnimationFrame(this.requestId);
            this.requestId = 0;
            return;
        }

        this.ctx.clearRect(Math.round(this.x - this.dw), Math.round(this.y - this.dh), this.s, this.s);
        this.ctx.drawImage(this.images[steps], Math.round(this.x - this.dw), Math.round(this.y - this.dh));

        this.requestId = requestAnimationFrame(() => {
            this.pop(steps + 1);
        });
    }

    update({ state, x, y }) {
        if (this.state !== "unpopped") return;
        if (this.x === x && this.y === y) return;

        if (this.requestId !== 0) {
            cancelAnimationFrame(this.requestId);
            this.requestId = 0;
            this.ctx.globalCompositeOperation = "destination-out";
            this.ctx.drawImage(this.mask, Math.round(this.px - this.dw), Math.round(this.py - this.dh));
        }

        this.dx = (x - this.x) / this.steps;
        this.dy = (y - this.y) / this.steps;
        this.px = this.x;
        this.py = this.y;
        this.x = x;
        this.y = y;
        this.state = state;

        if (state === "unpopped") {
            this.move(this.steps);
        } else {
            this.pop(0);
        }
    }

    stop() {
        if (this.requestId !== 0) {
            cancelAnimationFrame(this.requestId);
        }
        this.ctx.clearRect(Math.round(this.x - this.dw), Math.round(this.y - this.dh), this.s, this.s);
    }
}
