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

    it('should calculate skirmish line', () => {
        const myTeam = 0;
        const notMyTeam = myTeam + 1;
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

    const defaultCommand = 'ATTACK_NEAREST HERO; CHAAAARGE';

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

        expect(receivedCommands).toEqual('PULL 2; GET OVER HERE', 'Received PULL command');
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

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual(defaultCommand, 'Received default command');
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

        const [receivedCommands] = bot.generateCommands(bot.transformPrism(state));

        expect(receivedCommands).toEqual(defaultCommand, 'Received default command');
    });
});
