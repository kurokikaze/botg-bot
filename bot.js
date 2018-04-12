/* global print, printErr, readline */
let store = {
    config: {},
    game: {
        turn: 0,
    },
    items: [],
    mapFeatures: [],
    units: [],
};

const actionType = {
    initialData: 'initialData',
    tickUpdate: 'tickUpdate',
    customData: 'customData',
};

const unitType = {
    hero: 'HERO',
    unit: 'UNIT',
    tower: 'TOWER',
};

const entityType = {
    bush: 'BUSH',
    spawn: 'SPAWN',
};

class Command {
    constructor(type, param1 = null, param2 = null, comment = '') {
        this.type = type;
        this.param1 = param1 || '';
        this.param2 = param2 || '';
        this.comment = comment;
    }

    generate() {
        if (this.action) this.action();

        const commandBody = [
            this.type,
            this.param1.toString(),
            this.param2.toString(),
        ].filter(Boolean).join(' ');

        return this.comment ? `${commandBody}; ${this.comment}` : commandBody;
    }

    addAction(callback) { this.action = callback; }
}

const reducer = (state, action) => {
    switch (action.type) {
    case actionType.initialData: {
        return Object.assign(state, {
            config: {
                myTeam: action.myTeam,
            },
            items: action.items,
            mapFeatures: action.mapFeatures,
        });
    }
    case actionType.tickUpdate: {
        return {
            ...state,
            game: {
                turn: state.game.turn + 1,
                gold: action.gold,
                enemyGold: action.enemyGold,
                roundType: action.roundType,
            },
            units: action.units,
        };
    }
    case actionType.customData: {
        const newState = Object.assign(state, {
            custom: {
                [action.actor]: action.data,
            },
        });
        return newState;
    }
    default:
        break;
    }
    return state;
};

const update = (state, action) => reducer(state, action);

// Readers
const readSetup = ({ readline }) => {
    const myTeam = parseInt(readline(), 10);
    // useful from wood1, represents the number of bushes and the number
    // of places where neutral units can spawn
    const bushAndSpawnPointCount = parseInt(readline(), 10);
    const mapFeatures = [];
    for (let i = 0; i < bushAndSpawnPointCount; i += 1) {
        const inputs = readline().split(' ');
        // eslint-disable-next-line no-shadow
        const entityType = inputs[0]; // BUSH, from wood1 it can also be SPAWN
        const x = parseInt(inputs[1], 10);
        const y = parseInt(inputs[2], 10);
        const radius = parseInt(inputs[3], 10);
        mapFeatures.push({
            entityType,
            x,
            y,
            radius,
        });
    }

    const itemCount = parseInt(readline(), 10); // useful from wood2

    const items = [];
    for (let i = 0; i < itemCount; i += 1) {
        const inputs = readline().split(' ');

        items.push({
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
        });
    }

    return {
        type: actionType.initialData,
        myTeam,
        mapFeatures,
        items,
    };
};

const readTurnData = ({ readline }) => {
    const gold = parseInt(readline(), 10);
    const enemyGold = parseInt(readline(), 10);
    const roundType = parseInt(readline(), 10);
    const entityCount = parseInt(readline(), 10);
    const units = [];
    for (let i = 0; i < entityCount; i += 1) {
        const inputs = readline().split(' ');

        units.push({
            unitId: parseInt(inputs[0], 10),
            team: parseInt(inputs[1], 10),
            unitType: inputs[2], // UNIT, HERO, TOWER, can also be GROOT from wood1
            x: parseInt(inputs[3], 10),
            y: parseInt(inputs[4], 10),
            attackRange: parseInt(inputs[5], 10),
            health: parseInt(inputs[6], 10),
            maxHealth: parseInt(inputs[7], 10),
            shield: parseInt(inputs[8], 10), // useful in bronze
            attackDamage: parseInt(inputs[9], 10),
            movementSpeed: parseInt(inputs[10], 10),
            stunDuration: parseInt(inputs[11], 10), // useful in bronze
            goldValue: parseInt(inputs[12], 10),
            countDown1: parseInt(inputs[13], 10),
            countDown2: parseInt(inputs[14], 10),
            countDown3: parseInt(inputs[15], 10),
            mana: parseInt(inputs[16], 10),
            maxMana: parseInt(inputs[17], 10),
            manaRegeneration: parseInt(inputs[18], 10),
            heroType: inputs[19], // DEADPOOL, VALKYRIE, DOCTOR_STRANGE, HULK, IRONMAN
            isVisible: parseInt(inputs[20], 10), // 0 if it isn't
            itemsOwned: parseInt(inputs[21], 10), // useful from wood1
        });
    }

    return {
        type: actionType.tickUpdate,
        gold,
        enemyGold,
        roundType,
        units,
    };
};

// Math stuff
const median = (values = []) => {
    values.sort((a, b) => a - b);
    const lowMiddle = Math.floor((values.length - 1) / 2);
    const highMiddle = Math.ceil((values.length - 1) / 2);
    return (values[lowMiddle] + values[highMiddle]) / 2;
};

const inDirection = (center, target, distance) => {
    const angle = Math.atan(target.y - center.y, target.x - center.x);
    const x = Math.round(center.x + (distance * Math.cos(angle)));
    const y = Math.round(center.y + (distance * Math.sin(angle)));
    return { x, y };
};

// func flavor
const combine = (f1, f2) => t => f1(t) && f2(t);

// eslint-disable-next-line
const not = fn => function() { return !fn.apply(null, arguments) };

const createMine = state => u => u.team === state.config.myTeam;
const mine = createMine(store);

const isHero = u => u.unitType === unitType.hero;
const isUnit = u => u.unitType === unitType.unit;
const isTower = u => u.unitType === unitType.tower;

const dist = (a, b) => Math.sqrt(((a.x - b.x) ** 2) + ((a.y - b.y) ** 2));
const rcoord = objects => objects.reduce((o1, best) => (o1.x > best ? o1.x : best), objects[0].x);
const lcoord = objects => objects.reduce((o1, best) => (o1.x < best ? o1.x : best), objects[0].x);
const rightmost = objects => (objects.length > 0 ? rcoord(objects) : null);
const leftmost = objects => (objects.length > 0 ? lcoord(objects) : null);

const evaluateLoot = item => ((item.damage * 3) + (item.maxHealth * 2));

const lifeCircle = (hero, units) => units.filter(u =>
    dist(hero, u) <= 140).reduce((s, u) => s + u.health, 0);

const skirmishLine = (units, localMine, localEnemy) => {
    const myUnits = units.filter(combine(localMine, isUnit));
    const theirUnits = units.filter(combine(localEnemy, isUnit));

    const myTower = units.find(localMine, isTower);
    const enemyTower = units.find(combine(localEnemy, isTower));

    const myRightmost = myUnits.length ? rightmost(myUnits) : myTower.x;
    const theirLeftmost = theirUnits.length ? leftmost(theirUnits) : enemyTower.x;
    return (myRightmost.x + theirLeftmost.x) / 2;
};

const isBush = f => f.entityType === entityType.bush;

const closestTo = center =>
    us =>
        us.map(iu => ({ ...iu, dist: dist(center, iu) })).sort(((a, b) => a.dist >= b.dist));

const inMyRange = shooter =>
    units => units.filter(unit => dist(shooter, unit) < shooter.attackRange);

// eslint-disable-next-line no-unused-vars
const inTheirRange = target =>
    units => units.filter(unit => dist(target, unit) < unit.attackRange);

const skirmishInProgress = (units) => {
    const mineUnits = units.filter(combine(mine, isUnit));
    const enemyUnits = units.filter(combine(mine, isUnit));

    // Нет юнитов - нет схватки. Замес у башни не рассматриваем.
    if (mineUnits.length === 0 || enemyUnits.length === 0) return false;

    const weAreLeft = mineUnits[0].x < enemyUnits[0].x;

    const ourAvantgarde = weAreLeft ? rightmost(mineUnits) : leftmost(mineUnits);
    const enemyAvantgarde = weAreLeft ? leftmost(enemyUnits) : rightmost(enemyUnits);

    return Math.abs(ourAvantgarde - enemyAvantgarde) <= 100;
};

let command = null;
const storedItems = [];
const defaultLifeThreshold = 0.3;
const pessimisticLifeThreshold = 0.5;

const transformPrism = (originalStore) => {
    const localMine = createMine(originalStore);
    const localEnemy = not(mine);
    return {
        ...originalStore,
        prism: {
            enemyHero: originalStore.units.find(combine(localMine, isHero)),

            myTower: originalStore.units.find(combine(localMine, isTower)),
            myHeroes: originalStore.units.filter(combine(localMine, isHero)),
            myTroops: originalStore.units.filter(combine(localMine, isUnit)),

            enemyHeroes: originalStore.units.filter(combine(localEnemy, isHero)),
            enemyTroops: originalStore.units.filter(combine(localEnemy, isUnit)),
            enemyTower: originalStore.units.find(combine(localEnemy, isTower)),

            purchasable: originalStore.items.filter(i => i.itemCost <= originalStore.game.gold && !i.isPotion).filter(i => storedItems.findIndex(si => si.name === i.itemName) === -1),
            skirmishLinePos: skirmishLine(originalStore.units, localMine, localEnemy),
            skirmishIsOn: skirmishInProgress(originalStore.units),
        },
    };
};

const generateCommands = (gameData) => {
    const closingSign = u => Math.sign(gameData.prism.myTower.x - u.x);
    const closerToHome = (u, distance) => (u.x + (closingSign(u) * distance));

    if (gameData.game.roundType === -2) {
        return ['DOCTOR_STRANGE'];
    } else if (gameData.game.roundType === -1) {
        return ['IRONMAN'];
    }

    // eslint-disable-next-line
    const commands = gameData.prism.myHeroes.map((myHero) => {
        const heroInRange = (gameData.prism.enemyHeroes && gameData.prism.enemyHeroes.length > 0) ? inMyRange(myHero)(gameData.prism.enemyHeroes).length > 0 : false;
        const unitsInRange = (gameData.prism.enemyTroops && gameData.prism.enemyTroops.length > 0) ? inMyRange(myHero)(gameData.prism.enemyTroops) : [];

        if (!heroInRange && unitsInRange.length === 0 && gameData.prism.myTroops.length > 0) {
            const lootRating = gameData.prism.purchasable.map(i => ({ name: i.itemName, rating: evaluateLoot(i) }));
            lootRating.sort((a, b) => a.rating >= b.rating);
            if (gameData.prism.purchasable.length > 0 && myHero.itemsOwned < 4) {
                command = new Command('BUY', lootRating[0].name);
                command.addAction(() => storedItems.push(lootRating[0]));
            } else if (gameData.prism.myTroops.length > 0) {
                const averageCoord = Math.floor(gameData.prism.myTroops.map(u => u.y).reduce((p, c) => p + c, 0) / gameData.prism.myTroops.length);
                const squad = {
                    x: median(gameData.prism.myTroops.map(u => u.x)),
                    y: averageCoord,
                };

                if (dist(squad, gameData.prism.enemyTower) > gameData.prism.enemyTower.attackRange) {
                    /* if (inTheirRange(squad)(gameData.prism.enemyTroops || []).length > 0) {
                        const saferPosition = closerToHome(squad, dist(myHero, squad) / 2);
                        command = new Command('MOVE', saferPosition, squad.y, 'FOLLOW SQUAD SAFELY');
                    } else { */
                    command = new Command('MOVE', squad.x, squad.y, 'FOLLOW SQUAD');
                    // }
                } else {
                    command = new Command('MOVE', closerToHome(gameData.prism.enemyTower, gameData.prism.enemyTower.attackRange + 10), squad.y);
                }
            }
        } else if (unitsInRange.length > 0) {
            const weakTarget = unitsInRange.sort((a, b) => a.health >= b.health)[0];
            const enemyWeaklings = gameData.prism.enemyTroops.map(unit => ({ ...unit, range: dist(myHero, unit) })).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
            const weaklings = gameData.prism.myTroops.map(unit => ({ ...unit, range: dist(myHero, unit) })).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);

            const closestBushes = closestTo(myHero)(gameData.mapFeatures.filter(isBush));

            if (gameData.prism.skirmishIsOn) { printErr('Skirmish in progress at', gameData.prism.skirmishIsOn); }

            const squadLife = lifeCircle(myHero, gameData.prism.myTroops);

            if (enemyWeaklings.length > 0) {
                command = new Command('ATTACK', enemyWeaklings[0].unitId, null, 'ENEMY WEAKLING');
            } else if (weaklings.length > 0) {
                command = new Command('ATTACK', weaklings[0].unitId, null, 'WEAKLING');
            } else {
                const targetDist = dist(myHero, weakTarget);
                if (
                    myHero.heroType === 'IRONMAN' &&
                    myHero.mana >= 50 &&
                    myHero.countDown3 === 0 &&
                    targetDist <= 250 &&
                    targetDist > 100
                ) {
                    command = new Command('BURNING', weakTarget.x, weakTarget.y, 'BURNING');
                } else if (targetDist <= myHero.attackRange) {
                    command = new Command('ATTACK', weakTarget.unitId, null, `GENERAL TARGET (${Math.floor(targetDist)}, ${myHero.attackRange}, ${weakTarget.health})`);
                } else {
                    command = new Command('MOVE', weakTarget.x, weakTarget.y, 'CREEPING CLOSER');
                }
            }

            const safeSpot = (closestBushes.length > 0) ? closestBushes[0] : gameData.prism.myTower;

            if (Math.abs(gameData.prism.skirmishLinePos - myHero.x) < 100) {
                command = new Command('MOVE', closerToHome({ x: gameData.prism.skirmishLinePos }, 100), myHero.y, 'FROM SKIRMISH LINE');
            }

            if (squadLife <= 200 && gameData.prism.myTroops.length > 0 && unitsInRange.length > 1) {
                if (gameData.prism.myTroops.length > 0) {
                    const squadX = median(gameData.prism.myTroops.filter(unit => dist(myHero, unit) > 140).map(u => u.x));
                    const squadY = Math.floor(gameData.prism.myTroops.map(u => u.y).reduce((p, c) => p + c, 0) / gameData.prism.myTroops.length);
                    if (dist(myHero, { x: squadX, y: squadY }) <= 50) {
                        command = new Command('MOVE', safeSpot.x, safeSpot.y, `LEAVING SQUAD WITH ${squadLife} HP`);
                    }
                } else {
                    command = new Command('MOVE', safeSpot.x, safeSpot.y, 'LEAVING SQ FOR SAFE SPOT');
                }
            }
        } else if (dist(myHero, gameData.prism.enemyTower) <= myHero.attackRange) {
            command = new Command('ATTACK_NEAREST', 'TOWER');
        } else if (heroInRange) {
            command = new Command('ATTACK_NEAREST', 'HERO', null, 'CHAAAARGE');
        } else {
            command = new Command('ATTACK_NEAREST', 'HERO');
        }

        const myHeroPercentage = myHero.health / myHero.maxHealth;
        const enemyHeroPercentage = gameData.prism.enemyHero ? (gameData.prism.enemyHero.health / gameData.prism.enemyHero.maxHealth) : 100;

        const hulkPresent = gameData.prism.enemyHeroes && gameData.prism.enemyHeroes.find(e => e.heroType === 'HULK');
        const lifeThreshold = hulkPresent ? pessimisticLifeThreshold : defaultLifeThreshold;

        if (myHeroPercentage <= lifeThreshold) {
            const healthPotionsForSale = gameData.items.filter(i => i.itemCost <= gameData.game.gold && i.isPotion && i.health);
            if (myHero.health / myHero.maxHealth < lifeThreshold && healthPotionsForSale.length > 0 && myHeroPercentage <= enemyHeroPercentage) {
                if (myHero.itemsOwned === 4) {
                    storedItems.sort((a, b) => a.rating <= b.rating);
                    const lowestItem = storedItems[0];
                    command = new Command('SELL', lowestItem.name);
                    command.addAction(() => {
                        storedItems.shift();
                    });
                } else {
                    command = new Command('BUY', healthPotionsForSale[0].itemName);
                }
            } else if (dist(myHero, gameData.prism.myTower) > 20) {
                if (myHero.heroType === 'IRONMAN' && myHero.mana > 16 && myHero.countDown1 === 0) {
                    const blinkPoint = inDirection(myHero, gameData.prism.myTower, 199);
                    command = new Command('BLINK', blinkPoint.x + 20, blinkPoint.y, ' BLINK TO TOWER');
                } else {
                    command = new Command('MOVE', gameData.prism.myTower.x + 20, gameData.prism.myTower.y, 'TO TOWER');
                }
            } else if (heroInRange) {
                command = new Command('ATTACK_NEAREST', 'HERO');
            } else {
                command = new Command('WAIT');
            }
        }
        return command.generate();
    });

    return commands;
};

// game loop
// eslint-disable-next-line no-unused-vars
const player = (initialStore, reader) => {
    // eslint-disable-next-line no-var
    var playerStore = initialStore;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const turnAction = readTurnData(reader);
        playerStore = update(playerStore, turnAction);

        const transformedStore = transformPrism(playerStore);
        const commands = generateCommands(transformedStore);
        commands.forEach(com => print(com));
    }
};

// const setupAction = readSetup({ readline });
// store = update(store, setupAction);

//player(store, { readline });

export default {
    actionType,
    createMine,
    not,
    combine,
    readSetup,
    readTurnData,
    transformPrism,
    generateCommands,
    skirmishLine,
};
