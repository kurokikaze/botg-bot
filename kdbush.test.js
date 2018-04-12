/* global describe, it, expect */
import KDBush from './kdbush';

// Simple point
const p = (x, y) => ({ x, y });

describe('helper tests', () => {
    it('should know my units from enemy', () => {
        const points = [
            p(0, 0), p(0, 1), p(0, 2), p(0, 3),
            p(1, 0), p(1, 1), p(1, 2), p(1, 3),
            p(2, 0), p(2, 1), p(2, 2), p(2, 3),
            p(3, 0), p(3, 1), p(3, 2), p(3, 3),
        ];
        const tree = new KDBush(points);
        const firstFourPoints = tree.within(1, 1, 1);
        expect(firstFourPoints.length).toEqual(5, 'selecting 5 points');
    });
});
