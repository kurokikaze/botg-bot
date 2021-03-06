/* global describe, it, expect, jest */
import bot from './bot';

describe('helper tests', () => {
    it('should know my units from enemy', () => {
        const myTeam = 0;
        const notMyTeam = myTeam + 1;

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

    it('should evaluate loot', () => {
        // damage: 3, maxHealth: 2, manaRegen: 4
        const itemToEval = {
            damage: 10,
            maxMana: 50,
            maxHealth: 20,
            manaRegeneration: 5,
        };

        expect(bot.evaluateLoot(itemToEval)).toEqual((10 * 3) + (20 * 2) + (5 * 4));
    });

    // Теперь считается через позиции авангардов
    it.skip('should calculate skirmish line', () => {
        const myTeam = 0;
        const notMyTeam = myTeam + 1;

        const myUnit = { team: myTeam, x: 100, unitType: 'UNIT' };
        const myUnit2 = { team: myTeam, x: 90, unitType: 'UNIT' };
        const enemyUnit = { team: notMyTeam, x: 200, unitType: 'UNIT' };
        const myTower = { team: myTeam, x: 100, unitType: 'TOWER' };
        const enemyTower = { team: notMyTeam, x: 200, unitType: 'TOWER' };

        const skirmishLinePos = bot.calculateSkirmishLine([myUnit], [enemyUnit], myTower, enemyTower);
        expect(skirmishLinePos).toEqual(150);
        const skirmishLinePos2 = bot.calculateSkirmishLine([myUnit, myUnit2], [enemyUnit], myTower, enemyTower);
        expect(skirmishLinePos2).toEqual(150);
    });

    it('should correctly work with vectors', () => {
        const myPoint = {
            x: 100,
            y: 100,
        };

        const directionPoint = {
            x: 200,
            y: 200,
        };

        const calculatedPoint = bot.inDirection(myPoint, directionPoint, 283);
        const correctPoint = {
            x: 300,
            y: 300,
        };

        expect(calculatedPoint).toEqual(correctPoint, 'Correct distance by angle');
    });

    it('should do after-actions when generating command', () => {
        let testCounter = 0;

        const testCommand = new bot.Command('TEST', 'A', 'B')
        testCommand.addAction(() => {
            testCounter += 1;
        });

        expect(testCounter).toEqual(0, 'action is added but not performed');
        testCommand.generate();
        expect(testCounter).toEqual(1, 'action is performed on generation');        
    });
});

describe('Command class tests', () => {
    it('should generate command without parameters', () => {
        const testCommand = new bot.Command('STARTUP');
        const output = testCommand.generate();
        expect(output).toEqual('STARTUP', 'no-parameter command is generated correctly');
    });

    it('should generate command with one parameter', () => {
        const testCommand = new bot.Command('FETCH', 'UNITS');
        const output = testCommand.generate();
        expect(output).toEqual('FETCH UNITS', 'one-parameter command is generated correctly');
    });

    it('should generate command with two parameters', () => {
        const testCommand = new bot.Command('AIRSTRIKE', 10, 22);
        const output = testCommand.generate();
        expect(output).toEqual('AIRSTRIKE 10 22', 'two-parameter command is generated correctly');
    });

    it('should correcty add comments to commands', () => {
        const testCommandNone = new bot.Command('STARTUP', null, null, 'STARTING');
        const outputNone = testCommandNone.generate();
        expect(outputNone).toEqual('STARTUP; STARTING', 'no-parameter command is generated correctly');

        const testCommandOne = new bot.Command('FETCH', 'UNITS', null, 'REQUESTING');
        const outputOne = testCommandOne.generate();
        expect(outputOne).toEqual('FETCH UNITS; REQUESTING', 'one-parameter command is generated correctly');

        const testCommandTwo = new bot.Command('AIRSTRIKE', 10, 22, 'GOODBYE');
        const outputTwo = testCommandTwo.generate();
        expect(outputTwo).toEqual('AIRSTRIKE 10 22; GOODBYE', 'two-parameter command is generated correctly');
    });

    it('should do after-actions when generating command', () => {
        let testCounter = 0;

        const testCommand = new bot.Command('TEST', 'A', 'B');
        testCommand.addAction(() => {
            testCounter += 1;
        });

        expect(testCounter).toEqual(0, 'action is added but not performed');
        testCommand.generate();
        expect(testCounter).toEqual(1, 'action is performed on generation');
    });
});

describe('state reducer tests', () => {
    it('should not apply actions of unknown type', () => {
        const testTeam = 6;
        const testItems = ['1', '2'];
        const testMapFeatures = ['a', 'b'];

        const incorrectAction = {
            type: 'wrongActionType',
            myTeam: testTeam,
            items: testItems,
            mapFeatures: testMapFeatures,
        };

        const initialState = {
            game: {
                turn: 14,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            units: [],
        };

        const resultState = bot.update(initialState, incorrectAction);

        expect(resultState).toEqual(initialState);
    });

    it('should apply initial data action', () => {
        const testTeam = 6;
        const testItems = ['1', '2'];
        const testMapFeatures = ['a', 'b'];

        const initialDataAction = {
            type: bot.actionType.initialData,
            myTeam: testTeam,
            items: testItems,
            mapFeatures: testMapFeatures,
        };

        const resultState = bot.update({}, initialDataAction);
        const targetState = {
            config: {
                myTeam: testTeam,
            },
            items: testItems,
            mapFeatures: testMapFeatures,
        };

        expect(resultState).toEqual(targetState);
    });

    it('should apply turn data action', () => {
        const testGold = 11;
        const testEnemyGold = 15;
        const startingTurn = 3;
        const testRoundType = 4;
        const testUnits = ['u1', 'u2'];

        const tickUpdateAction = {
            type: bot.actionType.tickUpdate,
            gold: testGold,
            enemyGold: testEnemyGold,
            roundType: testRoundType,
            units: testUnits,
        };

        const initialState = {
            game: {
                turn: startingTurn,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            units: [],
        };

        const resultState = bot.update(initialState, tickUpdateAction);
        const targetState = {
            game: {
                turn: startingTurn + 1,
                gold: testGold,
                enemyGold: testEnemyGold,
                roundType: testRoundType,
            },
            units: testUnits,
        };

        expect(resultState).toEqual(targetState);
    });

    it('should apply custom data action', () => {

    });
});

describe('reader tests', () => {
    /*
        int myteam
        int features
        # type x y radius
        int items
        # name cost damage health maxHealth mana maxMana moveSpeed manaRegen isPotion
    */

    it('should parse empty setup data', () => {
        const mockReadline = jest.fn(() => '')
            .mockImplementationOnce(() => '4')
            .mockImplementationOnce(() => '0')
            .mockImplementationOnce(() => '0');

        const defaultAction = bot.readSetup({ readline: mockReadline });
        const expectedAction = {
            type: bot.actionType.initialData,
            myTeam: 4,
            mapFeatures: [],
            items: [],
        };

        expect(defaultAction).toEqual(expectedAction, 'Simple empty state ok');
    });

    it('should parse map features', () => {
        const mockFeaturesReadline = jest.fn(() => '')
            .mockImplementationOnce(() => '0')
            .mockImplementationOnce(() => '2')
            .mockImplementationOnce(() => 'BUSH 100 110 20')
            .mockImplementationOnce(() => 'SPAWN 400 600 10')
            .mockImplementationOnce(() => '0');

        const defaultFeaturesAction = bot.readSetup({ readline: mockFeaturesReadline });
        const expectedFeaturesAction = {
            type: bot.actionType.initialData,
            myTeam: 0,
            mapFeatures: [
                {
                    entityType: 'BUSH',
                    x: 100,
                    y: 110,
                    radius: 20,
                },
                {
                    entityType: 'SPAWN',
                    x: 400,
                    y: 600,
                    radius: 10,
                },
            ],
            items: [],
        };
        expect(defaultFeaturesAction).toEqual(expectedFeaturesAction, 'Simple empty state ok');
    });
    /*
        {
            itemName: inputs[0],
            itemCost: parseInt(inputs[1], 10),
            damage: parseInt(inputs[2], 10),
            health: parseInt(inputs[3], 10),
            maxHealth: parseInt(inputs[4], 10),
            mana: parseInt(inputs[5], 10),
            maxMana: parseInt(inputs[6], 10),
            moveSpeed: parseInt(inputs[7], 10),
            manaRegeneration: parseInt(inputs[8], 10),
            isPotion: parseInt(inputs[9], 10),
        }
        */
    it('should parse items', () => {
        const mockReadline = jest.fn(() => '')
            .mockImplementationOnce(() => '0')
            .mockImplementationOnce(() => '0')
            .mockImplementationOnce(() => '2')
            .mockImplementationOnce(() => 'testItem1 120 1 0 4 0 6 7 8 0')
            .mockImplementationOnce(() => 'testPotion1 40 0 12 0 13 0 0 0 1');

        const defaultItemsAction = bot.readSetup({ readline: mockReadline });
        const expectedItemsAction = {
            type: bot.actionType.initialData,
            myTeam: 0,
            mapFeatures: [],
            items: [{
                itemName: 'testItem1',
                itemCost: 120,
                damage: 1,
                health: 0,
                maxHealth: 4,
                mana: 0,
                maxMana: 6,
                moveSpeed: 7,
                manaRegeneration: 8,
                isPotion: 0,
            },
            {
                itemName: 'testPotion1',
                itemCost: 40,
                damage: 0,
                health: 12,
                maxHealth: 0,
                mana: 13,
                maxMana: 0,
                moveSpeed: 0,
                manaRegeneration: 0,
                isPotion: 1,
            }],
        };

        expect(defaultItemsAction).toEqual(expectedItemsAction, 'Simple items state ok');
    });
    it('should parse items', () => {
        const mockReadline = jest.fn(() => '')
            .mockImplementationOnce(() => '0')
            .mockImplementationOnce(() => '0')
            .mockImplementationOnce(() => '2')
            .mockImplementationOnce(() => 'testItem1 120 1 0 4 0 6 7 8 0')
            .mockImplementationOnce(() => 'testPotion1 40 0 12 0 13 0 0 0 1');

        const defaultItemsAction = bot.readSetup({ readline: mockReadline });
        const expectedItemsAction = {
            type: bot.actionType.initialData,
            myTeam: 0,
            mapFeatures: [],
            items: [{
                itemName: 'testItem1',
                itemCost: 120,
                damage: 1,
                health: 0,
                maxHealth: 4,
                mana: 0,
                maxMana: 6,
                moveSpeed: 7,
                manaRegeneration: 8,
                isPotion: 0,
            },
            {
                itemName: 'testPotion1',
                itemCost: 40,
                damage: 0,
                health: 12,
                maxHealth: 0,
                mana: 13,
                maxMana: 0,
                moveSpeed: 0,
                manaRegeneration: 0,
                isPotion: 1,
            }],
        };

        expect(defaultItemsAction).toEqual(expectedItemsAction, 'Simple items state ok');
    });
});

describe('prism tests', () => {
    const myTeam = 0;

    const defaultState = {
        config: {
            myTeam,
        },
        game: {
            turn: 0,
            gold: 0,
            enemyGold: 0,
            roundType: 0,
        },
        items: [],
        mapFeatures: [],
        units: [],
    };

    it.skip('should find and report wandering groots', () => {
        //
    });
});

describe('logic tests', () => {
    /*
        int myteam
        int features
        # type x y radius
        int items
        # name cost damage health maxHealth mana maxMana moveSpeed manaRegen isPotion
    */
    const myTeam = 0;
    const enemyTeam = 1;

    const myTower = {
        unitType: 'TOWER',
        x: 0,
        y: 430,
        countDown3: 0,
        attackRange: 10,
        team: myTeam,
    };
    const enemyTower = {
        unitType: 'TOWER',
        x: 1000,
        y: 430,
        attackRange: 10,
        team: enemyTeam,
    };

    const defaultCommand = 'ATTACK_NEAREST HERO';

    it('should try to use PULL', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'DOCTOR_STRANGE',
                x: 100,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'HERO',
                heroType: 'HULK',
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: enemyTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual('PULL 2; COME GET SOME TOWER', 'Received PULL command');
    });

    it('should try to blink in tower direction if low on health (Ironman)', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'IRONMAN',
                x: 300,
                y: 430,
                mana: 100,
                health: 1,
                maxHealth: 100,
                countDown1: 0,
                countDown2: 0,
                countDown3: 0,
                attackRange: 201,
                team: myTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual('BLINK 101 430; BLINK TO TOWER', 'Blinking to tower when low on health');
    });

    it('should try to blink to tower without overshooting if low on health (Ironman)', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'IRONMAN',
                x: 100,
                y: 430,
                mana: 100,
                health: 1,
                maxHealth: 100,
                countDown1: 0,
                countDown2: 0,
                countDown3: 0,
                attackRange: 201,
                team: myTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual('BLINK 0 430; BLINK TO TOWER', 'Blinking to tower when low on health');
    });

    it('shouldnt try to use PULL when low on mana', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'DOCTOR_STRANGE',
                x: 100,
                y: 100,
                mana: 20,
                countDown3: 0,
                attackRange: 201,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'HERO',
                heroType: 'HULK',
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: enemyTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommand] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommand).toEqual(defaultCommand, 'Received default command');
    });

    it('shouldnt try to use PULL when cooldown still up', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'DOCTOR_STRANGE',
                x: 100,
                y: 100,
                mana: 100,
                countDown3: 2,
                attackRange: 201,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'HERO',
                heroType: 'HULK',
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: enemyTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommand] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommand).toEqual(defaultCommand, 'Received default command');
    });

    it('should try to pull enemy heroes into tower fire', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'DOCTOR_STRANGE',
                x: 100,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'HERO',
                heroType: 'HULK',
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: enemyTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommand] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommand).toEqual('PULL 2; COME GET SOME TOWER', 'Received PULL command');
    });

    it('should try to use PULL', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'DOCTOR_STRANGE',
                x: 100,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'HERO',
                heroType: 'HULK',
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 201,
                team: enemyTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual('PULL 2; COME GET SOME TOWER', 'Received PULL command');
    });

    it('should try to backstep when attacking', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'IRONMAN',
                x: 100,
                y: 100,
                mana: 1,
                countDown3: 0,
                movementSpeed: 50,
                attackRange: 250,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'UNIT',
                heroType: 0,
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 210,
                team: enemyTeam,
            }, {
                unitId: 3,
                unitType: 'UNIT',
                heroType: 0,
                x: 260,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 210,
                team: myTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual('MOVE_ATTACK 85 100 2; SHOOTING FROM DISTANCE', 'Backstepping');
    });

    it('should try to backstep when attacking (not enough distance)', () => {
        const units = [
            myTower,
            enemyTower,
            {
                unitId: 1,
                unitType: 'HERO',
                heroType: 'IRONMAN',
                x: 100,
                y: 100,
                mana: 1,
                countDown3: 0,
                movementSpeed: 50,
                attackRange: 250,
                team: myTeam,
            }, {
                unitId: 2,
                unitType: 'UNIT',
                heroType: 0,
                x: 300,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 310,
                team: enemyTeam,
            }, {
                unitId: 3,
                unitType: 'UNIT',
                heroType: 0,
                x: 260,
                y: 100,
                mana: 100,
                countDown3: 0,
                attackRange: 210,
                team: myTeam,
            }];

        const state = {
            config: {
                myTeam,
            },
            game: {
                turn: 0,
                gold: 0,
                enemyGold: 0,
                roundType: 0,
            },
            items: [],
            mapFeatures: [],
            units,
        };

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual('MOVE_ATTACK 60 100 2; ~SHOOTING FROM DISTANCE', 'Backstepping');
    });
});
