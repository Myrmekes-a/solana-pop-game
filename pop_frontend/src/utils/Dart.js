export default class Dart {
    steps = 16;
    px = 0;
    py = 0;
    x = 0;
    y = 0;
    dx = 0;
    dy = 0;
    angle = 0;
    ctx;
    image;
    mask;
    coordinates;
    requestId = 0;

    constructor(ctx, image, mask, data, coordinates) {
        this.ctx = ctx;
        this.image = image;
        this.mask = mask;
        this.x = data.x;
        this.y = data.y;
        this.angle = data.angle;
        this.coordinates = coordinates;
    }

    isVisible(x, y) {
        const insideLeftAndRight = x + this.coordinates.left + 50 < this.coordinates.right && x + this.coordinates.left - 50 > this.coordinates.left;
        const insideTopAndBottom = y + this.coordinates.top + 50 < this.coordinates.bottom && y + this.coordinates.top - 50 > this.coordinates.top;

        return insideLeftAndRight && insideTopAndBottom;
    }

    clear() {
        this.ctx.save();
        this.ctx.translate(Math.round(this.px), Math.round(this.py));
        this.ctx.rotate((this.angle * Math.PI) / 180);
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.drawImage(this.mask, -7, -1);
        this.ctx.restore();
    }

    move(steps) {
        if (steps <= 0) {
            cancelAnimationFrame(this.requestId);
            this.requestId = 0;

            if (!this.isVisible(this.px, this.py)) {
                this.clear();
            }
            return;
        }

        this.clear();

        this.px += this.dx;
        this.py += this.dy;

        this.ctx.save();
        this.ctx.translate(Math.round(this.px), Math.round(this.py));
        this.ctx.rotate((this.angle * Math.PI) / 180);
        this.ctx.drawImage(this.image, -6, 0, 13, 50);
        this.ctx.restore();

        this.requestId = requestAnimationFrame(() => {
            this.move(steps - 1);
        });
    }

    update({ x, y }) {
        if (this.x === x && this.y === y) return;

        if (this.requestId !== 0) {
            cancelAnimationFrame(this.requestId);
            this.requestId = 0;
            this.clear();
        }

        this.dx = (x - this.x) / this.steps;
        this.dy = (y - this.y) / this.steps;
        this.px = this.x;
        this.py = this.y;
        this.x = x;
        this.y = y;

        this.move(this.steps);
    }

    stop() {
        if (this.requestId !== 0) {
            cancelAnimationFrame(this.requestId);
            this.requestId = 0;
        }
        this.clear();
    }
}
