/* global describe, it, expect */
import bot from './bot';

const myTeam = 0;

const notMyTeam = myTeam + 1;

describe('helper tests', () => {
    it('should know my units from enemy', () => {
        const testState = {
            config: {
                myTeam,
            },
        };
        const mine = bot.createMine(testState);
        const enemy = bot.not(mine);
        const myUnit = { team: myTeam };
        const enemyUnit = { team: notMyTeam };

        expect(mine(myUnit)).toEqual(true);
        expect(enemy(myUnit)).toEqual(false);

        expect(mine(enemyUnit)).toEqual(false);
        expect(enemy(enemyUnit)).toEqual(true);
    });

    it('should calculate skirmish line', () => {
        const testState = {
            config: {
                myTeam,
            },
        };
        const mine = bot.createMine(testState);
        const enemy = bot.not(mine);
        const myUnit = { team: myTeam, x: 100, unitType: 'UNIT' };
        const myUnit2 = { team: myTeam, x: 100, unitType: 'UNIT' };
        const enemyUnit = { team: notMyTeam, x: 200, unitType: 'UNIT' };
        const myTower = { team: myTeam, x: 100, unitType: 'TOWER' };
        const enemyTower = { team: notMyTeam, x: 200, unitType: 'TOWER' };

        const skirmishLinePos = bot.skirmishLine([myUnit, enemyUnit, myTower, enemyTower], mine, enemy);
        expect(skirmishLinePos).toEqual(150);
        const skirmishLinePos2 = bot.skirmishLine([myUnit, myUnit2, enemyUnit, myTower, enemyTower], mine, enemy);
        expect(skirmishLinePos2).toEqual(150);
    });

    /*
	it ('should apply directions to coordinates', function(){
		var reader = new FakeReader({});

		var botInstance = new Bot(reader);

		const unit = {
			x: 5,
			y: 5
		};

		expect(botInstance.getMovedPoint(unit, 'N')).toEqual({ x: 5, y: 4 });
		expect(botInstance.getMovedPoint(unit, 'NE')).toEqual({ x: 6, y: 4 });
		expect(botInstance.getMovedPoint(unit, 'E')).toEqual({x: 6, y: 5});
		expect(botInstance.getMovedPoint(unit, 'SE')).toEqual({x: 6, y: 6});
		expect(botInstance.getMovedPoint(unit, 'S')).toEqual({x: 5, y: 6});
		expect(botInstance.getMovedPoint(unit, 'SW')).toEqual({x: 4, y: 6});
		expect(botInstance.getMovedPoint(unit, 'W')).toEqual({x: 4, y: 5});
		expect(botInstance.getMovedPoint(unit, 'NW')).toEqual({x: 4, y: 4});
    })
    */
});
/*
describe("bot tests", function() {

    beforeEach(function() {
	});

    it('should work with bits', function(){
		expect(Math.pow(2, 2)).toEqual(4); // числа
	});

	it ('should apply directions to coordinates', function(){
		var reader = new FakeReader({});

		var botInstance = new Bot(reader);

		const unit = {
			x: 5,
			y: 5
		};

		expect(botInstance.getMovedPoint(unit, 'N')).toEqual({ x: 5, y: 4 });
		expect(botInstance.getMovedPoint(unit, 'NE')).toEqual({ x: 6, y: 4 });
		expect(botInstance.getMovedPoint(unit, 'E')).toEqual({x: 6, y: 5});
		expect(botInstance.getMovedPoint(unit, 'SE')).toEqual({x: 6, y: 6});
		expect(botInstance.getMovedPoint(unit, 'S')).toEqual({x: 5, y: 6});
		expect(botInstance.getMovedPoint(unit, 'SW')).toEqual({x: 4, y: 6});
		expect(botInstance.getMovedPoint(unit, 'W')).toEqual({x: 4, y: 5});
		expect(botInstance.getMovedPoint(unit, 'NW')).toEqual({x: 4, y: 4});
	})
});
*/
