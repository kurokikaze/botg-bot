const sqDist = (ax, ay, bx, by) => ((ax - bx) ** 2) + ((ay - by) ** 2);
const swap = (arr, i, j) => {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
};

class kdbush {
    constructor(points, nodeSize) {
        const getX = u => u.x;
        const getY = u => u.y;

        this.nodeSize = nodeSize || 64;
        this.points = points;

        this.ids = new Array(points.length);
        this.coords = new Array(points.length * 2);

        for (let i = 0; i < points.length; i += 1) {
            this.ids[i] = i;
            this.coords[2 * i] = getX(points[i]);
            this.coords[(2 * i) + 1] = getY(points[i]);
        }

        this.sort(0, this.ids.length - 1, 0);
    }

    range(minX, minY, maxX, maxY) {
        const stack = [0, this.ids.length - 1, 0];
        const result = [];
        let x;
        let y;

        while (stack.length) {
            const axis = stack.pop();
            const right = stack.pop();
            const left = stack.pop();

            if (right - left <= this.nodeSize) {
                for (let i = left; i <= right; i += 1) {
                    x = this.coords[2 * i];
                    y = this.coords[(2 * i) + 1];
                    if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(this.points[this.ids[i]]);
                }

                // eslint-disable-next-line no-continue
                continue;
            }

            const m = Math.floor((left + right) / 2);

            x = this.coords[2 * m];
            y = this.coords[(2 * m) + 1];

            if (x >= minX && x <= maxX && y >= minY && y <= maxY) result.push(this.points[this.ids[m]]);

            const nextAxis = (axis + 1) % 2;

            if (axis === 0 ? minX <= x : minY <= y) {
                stack.push(left, m - 1, nextAxis);
            }

            if (axis === 0 ? maxX >= x : maxY >= y) {
                stack.push(m + 1, right, nextAxis);
            }
        }

        return result;
    }

    within(qx, qy, r) {
        const stack = [0, this.ids.length - 1, 0];
        const result = [];
        const r2 = r ** 2;

        let left;
        let right;

        while (stack.length) {
            const axis = stack.pop();
            right = stack.pop();
            left = stack.pop();

            if (right - left <= this.nodeSize) {
                for (let i = left; i <= right; i += 1) {
                    if (sqDist(this.coords[2 * i], this.coords[(2 * i) + 1], qx, qy) <= r2) result.push(this.points[this.ids[i]]);
                }
                // eslint-disable-next-line no-continue
                continue;
            }

            const m = Math.floor((left + right) / 2);

            const x = this.coords[2 * m];
            const y = this.coords[(2 * m) + 1];

            if (sqDist(x, y, qx, qy) <= r2) result.push(this.points[this.ids[m]]);

            const nextAxis = (axis + 1) % 2;

            if (axis === 0 ? qx - r <= x : qy - r <= y) {
                stack.push(left, m - 1, nextAxis);
            }
            if (axis === 0 ? qx + r >= x : qy + r >= y) {
                stack.push(m + 1, right, nextAxis);
            }
        }

        return result;
    }

    sort(left, right, depth) {
        if (right - left <= this.nodeSize) return;

        const m = Math.floor((left + right) / 2);

        this.select(m, left, right, depth % 2);

        this.sort(left, m - 1, depth + 1);
        this.sort(m + 1, right, depth + 1);
    }

    select(k, initialLeft, initialRight, inc) {
        let left = initialLeft;
        let right = initialRight;

        while (right > left) {
            if (right - left > 600) {
                const n = right - (left + 1);
                const m = k - (left + 1);
                const z = Math.log(n);
                const s = 0.5 * Math.exp((2 * z) / 3);
                const sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
                const newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
                const newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
                this.select(k, newLeft, newRight, inc);
            }

            const t = this.coords[(2 * k) + inc];
            let i = left;
            let j = right;

            this.swapItem(left, k);

            if (this.coords[(2 * right) + inc] > t)  {
                this.swapItem(left, right);
            }

            while (i < j) {
                this.swapItem(i, j);
                i += 1;
                j -= 1;
                while (this.coords[(2 * i) + inc] < t) i += 1;
                while (this.coords[(2 * j) + inc] > t) j -= 1;
            }

            if (this.coords[(2 * left) + inc] === t) this.swapItem(left, j);
            else {
                j += 1;
                this.swapItem(j, right);
            }

            if (j <= k) left = j + 1;
            if (k <= j) right = j - 1;
        }
    }

    swapItem(i, j) {
        swap(this.ids, i, j);
        swap(this.coords, 2 * i, 2 * j);
        swap(this.coords, (2 * i) + 1, (2 * j) + 1);
    }
}

export default kdbush;
