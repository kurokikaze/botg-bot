var printErr = console.log;
import FakeReader from './FakeReader';
import './helpers.js';

var myTeam = 0;

var notMyTeam = myTeam + 1;

describe("helper tests", function() {

    beforeEach(function() {
	});

    it('should know my units from enemy', function(){
        let myUnit = { team: myTeam };
        let enemyUnit = { team: notMyTeam };

		expect(mine(myUnit)).toEqual(true); // числа
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