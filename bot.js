let store = {};
const { readline, print, printErr } = global;

console.log('readline', global.haltBot);

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
}

Command.prototype.generate = function generate() {
    if (this.action) this.action();

    const commandBody = [
        this.type,
        this.param1.toString(),
        this.param2.toString(),
    ].filter(Boolean).join(' ');

    return this.comment ? `${commandBody}; ${this.comment}` : commandBody;
};

Command.prototype.addAction = function addAction(callback) { this.action = callback; };

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
        /*
        {
            gold,
            enemyGold,
            roundType,
            units,
        }
        */
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
const readSetup = () => {
    const myTeam = parseInt(readline(), 10);
    // useful from wood1, represents the number of bushes and the number
    // of places where neutral units can spawn
    const bushAndSpawnPointCount = parseInt(readline(), 10);
    const mapFeatures = [];
    for (let i = 0; i < bushAndSpawnPointCount; i += 1) {
        const inputs = readline().split(' ');
        const entityType = inputs[0]; // BUSH, from wood1 it can also be SPAWN
        const x = parseInt(inputs[1], 10);
        const y = parseInt(inputs[2], 10);
        const radius = parseInt(inputs[3], 10);
        mapFeatures.push(
            entityType,
            x,
            y,
            radius,
        );
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

const readTurnData = () => {
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

const setupAction = readSetup();
store = update(store, setupAction);

/* eslint-disable-next-line no-var, vars-on-top */
var { items } = { ...setupAction };

// Math stuff
const median = (values = []) => {
    values.sort((a, b) => a - b);
    const lowMiddle = Math.floor((values.length - 1) / 2);
    const highMiddle = Math.ceil((values.length - 1) / 2);
    return (values[lowMiddle] + values[highMiddle]) / 2;
};

// func flavor
const combine = (f1, f2) => t => f1(t) && f2(t);

// eslint-disable-next-line
const not = fn => function() { return !fn.apply(null, arguments) };

const createMine = state => u => u.team === state.config.myTeam;
const mine = createMine(store);
const enemy = not(mine);

const isHero = u => u.unitType === unitType.hero;
const isUnit = u => u.unitType === unitType.unit;
const isTower = u => u.unitType === unitType.tower;

const dist = (a, b) => Math.sqrt(((a.x - b.x) ** 2) + ((a.y - b.y) ** 2));
const rcoord = objects => objects.reduce((o1, best) => (o1.x > best ? o1.x : best), objects[0].x);
const lcoord = objects => objects.reduce((o1, best) => (o1.x < best ? o1.x : best), objects[0].x);
const rightmost = objects => (objects.length > 0 ? rcoord(objects) : null);
const leftmost = objects => (objects.length > 0 ? lcoord(objects) : null);

const evaluateLoot = item => ((item.damage * 3) + item.movespeed + (item.maxHealth * 2));

const lifeCircle = (hero, units) => units.filter(u =>
    dist(hero, u) <= 140).reduce((s, u) => s + u.health, 0);

const skirmishLine = (units) => {
    const myRightmost = rightmost(units.filter(mine));
    const theirLeftmost = leftmost(units.filter(enemy));
    return myRightmost + (theirLeftmost / 2);
};

const isBush = f => f.entityType === entityType.bush;

const inMyRange = shooter =>
    units => units.filter(unit => dist(shooter, unit) < shooter.attackRange);
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
const defaultCommand = new Command('WAIT');
const defaultLifeThreshold = 0.3;
const pessimisticLifeThreshold = 0.5;

// game loop
// eslint-disable-next-line no-constant-condition
while (true && !global.haltBot) {

    const turnAction = readTurnData();
    store = update(store, turnAction);

    command = defaultCommand;

    const enemyHero = store.units.find(combine(enemy, isHero));
    const enemyHeroes = store.units.filter(combine(enemy, isHero));
    const myTower = store.units.find(combine(mine, isTower));
    const enemyTower = store.units.find(combine(enemy, isTower));
    const myHeroes = store.units.filter(combine(mine, isHero));
    const myTroops = store.units.filter(combine(mine, isUnit));

    const enemyTroops = store.units.filter(combine(enemy, isUnit));

    const closingSign = u => Math.sign(myTower.x - u.x);
    const closerToHome = (u, distance) => (u.x + (closingSign(u) * distance));

    const closestTo = center =>
        us =>
            us.map(iu => ({ ...iu, dist: dist(center, iu) })).sort(((a, b) => a.dist >= b.dist));

    if (store.game.roundType === -2) {
        print('DOCTOR_STRANGE');
    } else if (store.game.roundType === -1) {
        print('IRONMAN');
    } else {
        printErr('units', store.units.length, 'my heroes', myHeroes.length);

        // eslint-disable-next-line
        const commands = myHeroes.map((myHero) => {
            const heroInRange = inMyRange(myHero)(enemyHeroes);
            const unitsInRange = inMyRange(myHero)(enemyTroops);

            printErr('Units in range:', unitsInRange.length);

            if (!heroInRange && unitsInRange.length === 0 && myTroops.length > 0) {
                const purchasable = items.filter(i => i.itemCost <= store.game.gold && !i.isPotion).filter(i => storedItems.findIndex(si => si.name === i.itemName) === -1);
                const lootRating = purchasable.map(i => ({ name: i.itemName, rating: evaluateLoot(i) }));
                lootRating.sort((a, b) => a.rating >= b.rating);
                if (purchasable.length > 0 && myHero.itemsOwned < 4) {
                    command = new Command('BUY', lootRating[0].name);
                    command.addAction(() => storedItems.push(lootRating[0]));
                } else if (myTroops.length > 0) {
                    const averageCoord = Math.floor(myTroops.map(u => u.y).reduce((p, c) => p + c, 0) / myTroops.length);
                    const squad = {
                        x: median(myTroops.map(u => u.x)),
                        y: averageCoord,
                    };

                    if (dist(squad, enemyTower) > enemyTower.attackRange) {
                        if (inTheirRange(squad)(enemyTroops).length > 0) {
                            const saferPosition = closerToHome(squad, dist(myHero, squad) / 2);
                            command = new Command('MOVE', saferPosition, squad.y, 'FOLLOW SQUAD SAFELY');
                        } else {
                            command = new Command('MOVE', squad.x, squad.y, 'FOLLOW SQUAD');
                        }
                    } else {
                        command = new Command('MOVE', closerToHome(enemyTower, enemyTower.attackRange + 10), squad.y);
                    }
                }
            } else if (unitsInRange.length > 0) {
                const weakTarget = unitsInRange.sort((a, b) => a.health >= b.health)[0];
                const enemyWeaklings = enemyTroops.map(unit => ({ ...unit, range: dist(myHero, unit) })).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
                const weaklings = myTroops.map(unit => ({ ...unit, range: dist(myHero, unit) })).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
                const skirmishLinePos = skirmishLine(store.units);
                const skirmishIsOn = skirmishInProgress(store.units);

                const closestBushes = closestTo(myHero)(store.config.mapFeatures.filter(isBush));

                if (skirmishIsOn) { printErr('Skirmish in progress at', skirmishLinePos); }

                const squadLife = lifeCircle(myHero, myTroops);

                if (enemyWeaklings.length > 0) {
                    command = new Command('ATTACK', enemyWeaklings[0].unitId);
                } else if (weaklings.length > 0) {
                    command = new Command('ATTACK', weaklings[0].unitId);
                } else {
                    command = new Command('ATTACK', weakTarget.unitId);
                }

                const safeSpot = (closestBushes.length > 0) ? closestBushes[0] : myTower;

                if (Math.abs(skirmishLinePos - myHero.x) < 100) {
                    command = new Command('MOVE', closerToHome({ x: skirmishLinePos }, 100), myHero.y, 'FROM SKIRMISH LINE');
                }

                if (squadLife <= 200 && myTroops.length > 0) {
                    if (myTroops.length > 0) {
                        const squadX = median(myTroops.filter(unit => dist(myHero, unit) > 140).map(u => u.x));
                        const squadY = Math.floor(myTroops.map(u => u.y).reduce((p, c) => p + c, 0) / myTroops.length);
                        if (dist(myHero, { x: squadX, y: squadY }) > 50) {
                            command = new Command('MOVE', safeSpot.x, safeSpot.y, `LEAVING SQUAD WITH ${squadLife} HP`);
                        }
                    } else {
                        command = new Command('MOVE', safeSpot.x, safeSpot.y, 'LEAVING SQUAD FOR SAFE SPOT');
                    }
                }
            } else if (dist(myHero, enemyTower) <= myHero.attackRange) {
                command = new Command('ATTACK_NEAREST', 'TOWER');
            } else if (heroInRange) {
                command = new Command('ATTACK_NEAREST', 'HERO');
            } else {
                command = new Command('ATTACK_NEAREST', 'HERO');
            }

            // const unitsTooClose = enemyTroops.map(unit => dist(myHero, unit)).filter(range => range <= 100);
            // const heroTooClose = enemyHero ? dist(myHero, enemyHero) <= 100 : false;

            const myHeroPercentage = myHero.health / myHero.maxHealth;
            const enemyHeroPercentage = enemyHero ? (enemyHero.health / enemyHero.maxHealth) : 100;

            /* if (unitsTooClose.length > 1 || heroTooClose || !myTroops) {
                command = new Command('MOVE', myTower.x, myTower.y);
            } */

            const lifeThreshold = (enemyHero && enemyHero.heroType === 'HULK') ? pessimisticLifeThreshold : defaultLifeThreshold;

            if (myHeroPercentage <= lifeThreshold) {
                const healthPotionsForSale = items.filter(i => i.itemCost <= store.game.gold && i.isPotion && i.health);
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
                } else if (dist(myHero, myTower) > 20) {
                    command = new Command('MOVE', myTower.x + 20, myTower.y, 'TO TOWER');
                } else if (heroInRange) {
                    command = new Command('ATTACK_NEAREST', 'HERO');
                } else {
                    command = new Command('WAIT');
                }
            }

            return command.generate();
        });

        commands.map(print);
    }
}
