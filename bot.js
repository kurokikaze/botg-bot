/* global print, readline */
// eslint-disable-next-line prefer-const
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
    markUnit: 'markUnit',
};

const heroType = {
    ironman: 'IRONMAN',
    doctorStrange: 'DOCTOR_STRANGE',
    valkyrie: 'VALKYRIE',
    hulk: 'HULK',
};

const pullers = [
    heroType.doctorStrange,
    heroType.valkyrie,
];

const unitType = {
    hero: 'HERO',
    unit: 'UNIT',
    tower: 'TOWER',
    groot: 'GROOT',
};

const entityType = {
    bush: 'BUSH',
    spawn: 'SPAWN',
};

const spells = {
    blink: {
        mana: 16,
        range: 200,
    },
    fireball: {
        range: 900,
        mana: 60,
    },
    burning: {
        range: 250,
        mana: 50,
    },
    pull: {
        range: 400,
        mana: 40,
        displacement: 200,
    },
    charge: {
        range: 300,
        mana: 20,
        cooldown: 'countDown1',
    },
    bash: {
        range: 150,
        mana: 40,
        cooldown: 'countDown3',
    },
};

const markUnit = (units, id) => units.map(u => ((u.unitId === id) ? u : ({ ...u, marked: true })));

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
    case actionType.markUnit: {
        return {
            ...state,
            units: markUnit(state.units, action.unitId),
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

class Command {
    constructor(type, param1 = null, param2 = null, comment = '') {
        this.type = type;
        this.param1 = param1;
        this.param2 = param2;
        this.comment = comment;
    }

    generate(/* store */) {
        if (this.action) {
            if (typeof this.action === 'function') {
                this.action();
            }
            // } else {
            //     store = update(store, this.action);
            // }
        }

        const commandBody = [
            this.type,
            this.param1,
            this.param2,
        ].filter(part => part !== '' && part !== null).map(c => c.toString()).join(' ');

        return this.comment ? `${commandBody}; ${this.comment}` : commandBody;
    }

    addAction(callback) { this.action = callback; }
}

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
    const angle = Math.atan2(target.y - center.y, target.x - center.x);
    const x = Math.round(center.x + (distance * Math.cos(angle)));
    const y = Math.round(center.y + (distance * Math.sin(angle)));
    return { x, y };
};

// func flavor
const combine = (f1, f2) => t => f1(t) && f2(t);

// eslint-disable-next-line
const not = fn => function() { return !fn.apply(null, arguments) };

const createMine = state => u => u.team === state.config.myTeam;

const isHero = u => u.unitType === unitType.hero;
const isUnit = u => u.unitType === unitType.unit;
const isGroot = u => u.unitType === unitType.groot;
const isTower = u => u.unitType === unitType.tower;

const dist = (a, b) => Math.sqrt(((a.x - b.x) ** 2) + ((a.y - b.y) ** 2));

const evaluateLoot = item => ((item.damage * 21) + (item.maxHealth) + (item.manaRegeneration * 4));

const lifeCircle = (hero, units) => units.filter(u =>
    dist(hero, u) <= 140).reduce((s, u) => s + u.health, 0);

const closestTo = center =>
    us =>
        us.map(iu => ({ ...iu, dist: dist(center, iu) })).sort(((a, b) => a.dist < b.dist));

const createOnSpawn = state => groot => state.mapFeatures.filter(mf => mf.entityType === entityType.spawn).find(mf => mf.x === groot.x && mf.y === groot.y);

const calculateAvantgarde = (troops, myTower, enemyTower) => ((troops.length > 0) ? closestTo(enemyTower)(troops)[0] : myTower);

const calculateSkirmishLine = (myUnit, enemyUnit) => Math.floor((myUnit.x + enemyUnit.x) / 2);

const isBush = f => f.entityType === entityType.bush;

const inMyRange = shooter =>
    units => units.filter(unit => dist(shooter, unit) < shooter.attackRange);

const inOurRange = (shooter1, shooter2) =>
    units => units.filter(unit => (dist(shooter1, unit) < shooter1.attackRange) && (dist(shooter2, unit) < shooter2.attackRange));

// eslint-disable-next-line no-unused-vars
const inTheirRange = target =>
    units => units.filter(unit => dist(target, unit) < unit.attackRange);

const skirmishInProgress = (myUnit, enemyUnit) => Math.abs(myUnit.x - enemyUnit.x) <= 100;

let command = null;
const storedItems = [];
const defaultLifeThreshold = 0.1;
const pessimisticLifeThreshold = 0.2;
const veryPessimisticLifeThreshold = 0.3;

const transformPrism = (originalStore) => {
    const localMine = createMine(originalStore);
    const localEnemy = not(localMine);
    const onSpawn = createOnSpawn(originalStore);

    const enemyHero = originalStore.units.find(combine(localEnemy, isHero));

    const myTower = originalStore.units.find(combine(localMine, isTower));
    const myHeroes = originalStore.units.filter(combine(localMine, isHero));
    const myTroops = originalStore.units.filter(combine(localMine, isUnit));
    const wanderingGroots = originalStore.units.filter(combine(isGroot, not(onSpawn)));
    const myHeroesTotal = myHeroes.reduce((el, total) => total + el.health, 0);

    const enemyHeroes = originalStore.units.filter(combine(localEnemy, isHero));
    const enemyTroops = originalStore.units.filter(combine(localEnemy, isUnit));
    const enemyTower = originalStore.units.find(combine(localEnemy, isTower));
    const enemyHeroesTotal = enemyHeroes.reduce((el, total) => total + el.health, 0);

    const aggressiveGroots = originalStore.units.find(u => u.unitType === unitType.groot);
    const purchasable = originalStore.items.filter(i => i.itemCost <= originalStore.game.gold && !i.isPotion).filter(i => storedItems.findIndex(si => si.name === i.itemName) === -1);

    const ourAvantgarde = calculateAvantgarde(myTroops, myTower, enemyTower);
    const enemyAvantgarde = calculateAvantgarde(enemyTroops, enemyTower, myTower);

    const skirmishLinePos = calculateSkirmishLine(ourAvantgarde, enemyAvantgarde);
    const skirmishIsOn = skirmishInProgress(ourAvantgarde, enemyAvantgarde);

    return {
        ...originalStore,
        prism: {
            aggressiveGroots,
            enemyHero,
            myTower,
            myHeroes,
            myTroops,
            enemyHeroes,
            enemyTroops,
            enemyTower,
            purchasable,
            skirmishLinePos,
            skirmishIsOn,
            wanderingGroots,
            myHeroesTotal,
            enemyHeroesTotal,
        },
    };
};

const ironmanPrism = (state, myHero) => {
    const safeDifference = 100;
    const enemyIsCloser = (unit) => {
        const enemyHeroes = closestTo(unit)(state.prism.enemyHeroes);
        const myHeroes = closestTo(unit)(state.prism.myHeroes);
        return (
            enemyHeroes.length > 0 &&
            myHeroes.length > 0 &&
            enemyHeroes[0].dist < 290 &&
            (enemyHeroes[0].dist + safeDifference) < myHeroes[0].dist
        );
    };

    const grootsInReach = state.units.filter(isGroot).filter(gr => dist(myHero, gr) <= 900) || [];
    const harrassTargets = grootsInReach.filter(g => g.health === g.maxHealth).filter(enemyIsCloser);

    const newState = {
        ...state,
        prism: {
            ...state.prism,
            harrassTargets,
        },
    };
    return newState;
};

const hulkPrism = (state, myHero) => {
    const chargeTargets = inMyRange({ ...myHero, attackRange: spells.charge.range })(state.prism.enemyHeroes);
    const bashTargets = inMyRange({ ...myHero, attackRange: spells.bash.range })(state.prism.enemyHeroes);

    const newState = {
        ...state,
        prism: {
            ...state.prism,
            chargeTargets,
            bashTargets,
        },
    };
    return newState;
};

const doctorStrangePrism = (state, myHero) => {
    const healingThreshold = 0.9;
    const shieldThreshold = 0.3;

    const otherHeroes = state.prism.myHeroes.filter(h => h.heroType !== heroType.doctorStrange);
    const woundedTargets = otherHeroes.filter(u => (u.health / u.maxHealth) < healingThreshold);
    const tooWoundedTargets = otherHeroes.filter(u => (u.health / u.maxHealth) < shieldThreshold);
    const healingTargets = closestTo(myHero)(woundedTargets).filter(t => t.dist < 250);
    const shieldingTargets = inMyRange({ myHero, attackRange: 500 })(tooWoundedTargets);
    const allStunnedTargets = state.prism.myHeroes.filter(h => h.unitId !== myHero.unitId && h.stunDuration > 0);
    const stunnedTargets = inMyRange({ ...myHero, attackRange: 500 })(allStunnedTargets);

    const pullTargets = closestTo(myHero)([...state.prism.enemyHeroes, ...state.prism.enemyTroops]).filter(h => h.dist <= spells.pull.range);
    const pullResults = pullTargets.map(pt => ({ ...pt, pullResult: inDirection(pt, myHero, spells.pull.displacement) }));

    const heroesTargets = otherHeroes.length ? inOurRange(myHero, otherHeroes[0])(pullResults) : inMyRange(myHero)(pullResults);
    const heroesPullResults = heroesTargets.map(pt => ({ ...pt, pullResult: inDirection(pt, myHero, spells.pull.displacement) }));
    const towerTargets = inMyRange(state.prism.myTower)(heroesPullResults);
    const rangedTargets = pullTargets.filter(u => (u.attackRange > 150));
    const goodPullResults = [...rangedTargets, ...towerTargets];

    const newState = {
        ...state,
        prism: {
            ...state.prism,
            healingTargets,
            goodPullResults,
            stunnedTargets,
            shieldingTargets,
        },
    };
    return newState;
};

/* eslint-disable-next-line no-unused-vars */
const heroPrism = (state, myHero) => {
    const heroInRange = (state.prism.enemyHeroes && state.prism.enemyHeroes.length > 0) ? inMyRange(myHero)(state.prism.enemyHeroes).length > 0 : false;
    const unitsInRange = (state.prism.enemyTroops && state.prism.enemyTroops.length > 0) ? inMyRange(myHero)(state.prism.enemyTroops) : [];
    const pullerPresent = state.prism.enemyHeroes.filter(h => pullers.includes(h.heroType)).length > 0;
    const zonaPeligrosa = pullerPresent ? state.prism.enemyTower.attackRange + 200 : state.prism.enemyTower.attackRange;

    return {
        ...state,
        heroPrism: {
            heroInRange,
            unitsInRange,
            pullerPresent,
            zonaPeligrosa,
        },
    };
};

const generateCommands = (gameData) => {
    const closingSign = u => Math.sign(gameData.prism.myTower.x - u.x);
    const closerToHome = (u, distance) => (u.x + (closingSign(u) * distance));

    if (gameData.game.roundType === -2) {
        return [new Command(heroType.doctorStrange).generate()];
    } else if (gameData.game.roundType === -1) {
        return [new Command(heroType.ironman).generate()];
    }

    const alreadyMarkedUnits = [];

    // eslint-disable-next-line
    const commands = gameData.prism.myHeroes.map((myHero) => {
        const heroInRange = (gameData.prism.enemyHeroes && gameData.prism.enemyHeroes.length > 0) ? inMyRange(myHero)(gameData.prism.enemyHeroes).length > 0 : false;
        const unitsInRange = (gameData.prism.enemyTroops && gameData.prism.enemyTroops.length > 0) ? inMyRange(myHero)(gameData.prism.enemyTroops) : [];
        const pullerPresent = gameData.prism.enemyHeroes.filter(h => pullers.includes(h.heroType)).length > 0;
        const zonaPeligrosa = pullerPresent ? gameData.prism.enemyTower.attackRange + 200 : gameData.prism.enemyTower.attackRange;
        const pullableTargets = inMyRange({ ...myHero, attackRange: 400 })([...gameData.prism.enemyHeroes, ...gameData.prism.enemyTroops]);
        const healthPotionsForSale = gameData.items.filter(i => i.itemCost <= gameData.game.gold && i.isPotion && i.health && !i.mana).sort((i1, i2) => i1.health <= i2.health);

        const canPerformPull = (
            myHero.heroType === heroType.doctorStrange &&
            myHero.mana > 50 &&
            myHero.countDown3 === 0
        );

        const canPerformFireball = (
            myHero.heroType === heroType.ironman &&
            myHero.mana > 100 &&
            myHero.countDown2 === 0
        );

        if (canPerformFireball) {
            const prismedState = ironmanPrism(gameData, myHero);
            if (prismedState.prism.harrassTargets.length > 0) {
                const harrassTarget = closestTo(myHero)(prismedState.prism.harrassTargets)[0];
                return (new Command('FIREBALL', harrassTarget.x, harrassTarget.y, 'HOW DO YOU LIKE THAT')).generate();
            }
        }

        const canPerformCharge = (
            myHero.heroType === heroType.hulk &&
            myHero.mana > spells.charge.mana &&
            myHero[spells.charge.cooldown] === 0
        );

        const canPerformBash = (
            myHero.heroType === heroType.hulk &&
            myHero.mana > spells.bash.mana &&
            myHero[spells.bash.cooldown] === 0
        );


        if (canPerformBash || canPerformCharge) {
            const hulkPrismedState = hulkPrism(gameData, myHero);
            if (canPerformBash && hulkPrismedState.prism.bashTargets.length > 0) {
                return (new Command('BASH', hulkPrismedState.prism.bashTargets[0].unitId, null, 'HULK BASH!')).generate();
            } else if (canPerformCharge && hulkPrismedState.prism.chargeTargets.length > 0) {
                return (new Command('CHARGE', hulkPrismedState.prism.chargeTargets[0].unitId, null, 'HULK SMASH!')).generate();
            }
        }

        if (myHero.heroType === heroType.doctorStrange && myHero.mana >= 40) {
            const prismedState = doctorStrangePrism(gameData, myHero);
            const iNeedShield = myHero.health / myHero.maxHealth <= 0.5;
            const shieldTargets = [...prismedState.prism.stunnedTargets, ...prismedState.prism.shieldingTargets];
            const othersNeedShield = shieldTargets.length > 0;
            const canPerformShield = myHero.countDown2 === 0 && myHero.mana > 40;

            if (othersNeedShield && canPerformShield) {
                return (new Command('SHIELD', shieldTargets[0].unitId, null, 'SHIELDED')).generate();
            } else if (myHero.countDown3 === 0 &&
                prismedState.prism.goodPullResults.length > 0
            ) {
                return (new Command('PULL', prismedState.prism.goodPullResults[0].unitId, null, 'COME GET SOME TOWER')).generate();
            } else if (
                (myHero.health / myHero.maxHealth) > 0.5 &&
                myHero.countDown1 === 0 &&
                prismedState.prism.healingTargets.length > 0) {
                const healingTarget = prismedState.prism.healingTargets[0];
                return (new Command('AOEHEAL', healingTarget.x, healingTarget.y, 'HEROES NEVER DIE')).generate();
            } else if (iNeedShield && canPerformShield) {
                return (new Command('SHIELD', myHero.unitId, null, 'SHIELDED')).generate();
            }
        }

        const whoseTurn = gameData.game.turn % 2 ? heroType.ironman : heroType.doctorStrange;
        const myHeroPercentage = myHero.health / myHero.maxHealth;
        const hulkPresent = gameData.prism.enemyHeroes && gameData.prism.enemyHeroes.find(e => e.heroType === heroType.hulk);

        if (dist(myHero, gameData.prism.enemyTower) <= zonaPeligrosa) {
            const towerSafeSpot = inDirection(gameData.prism.enemyTower, myHero, zonaPeligrosa + 10);
            const canRetreatAndAttack = dist(myHero, towerSafeSpot) < myHero.movementSpeed * 0.9;
            const attackableTargets = inMyRange({ ...towerSafeSpot, attackRange: myHero.attackRange })([...gameData.prism.enemyTroops, ...gameData.prism.enemyHeroes]);
            if (canRetreatAndAttack && attackableTargets.length > 0) {
                command = new Command('MOVE_ATTACK', `${towerSafeSpot.x} ${towerSafeSpot.y}`, attackableTargets[0].unitId, 'RETREATING WITH STYLE');
            } else {
                command = new Command('MOVE', towerSafeSpot.x, towerSafeSpot.y, 'RETREATING');
            }
        } else if (!heroInRange && unitsInRange.length === 0 && gameData.prism.myTroops.length > 0) {
            const lootRating = gameData.prism.purchasable.map(i => ({ name: i.itemName, rating: evaluateLoot(i) }));
            lootRating.sort((a, b) => a.rating <= b.rating);
            if (gameData.prism.purchasable.length > 0 && myHero.itemsOwned < 4 && myHero.heroType === whoseTurn) {
                command = new Command('BUY', lootRating[0].name);
                command.addAction(() => storedItems.push(lootRating[0]));
            } else if (gameData.prism.myTroops.length > 0) {
                const averageCoord = Math.floor(gameData.prism.myTroops.map(u => u.y).reduce((p, c) => p + c, 0) / gameData.prism.myTroops.length);
                const squad = {
                    x: median(gameData.prism.myTroops.map(u => u.x)),
                    y: averageCoord,
                };
                const braveSoldier = closestTo(gameData.prism.enemyTower)(gameData.prism.myTroops)[0];

                if (dist(gameData.prism.enemyTower, braveSoldier) < dist(gameData.prism.enemyTower, squad)) {
                    const arrivalPoint = inDirection(myHero, braveSoldier, myHero.movementSpeed * 0.8);
                    const arrivalTargets = inMyRange({ ...arrivalPoint, attackRange: myHero.attackRange })([...gameData.prism.enemyTroops, ...gameData.prism.enemyHeroes]);
                    if (arrivalTargets.length > 0) {
                        command = new Command('MOVE_ATTACK', `${arrivalPoint.x} ${arrivalPoint.y}`, arrivalTargets[0].unitId, 'RAMBO STYLE');
                    } else {
                        command = new Command('MOVE', braveSoldier.x, braveSoldier.y, 'FOLLOW FRONTLINE');
                    }
                } else if (dist(squad, gameData.prism.enemyTower) > zonaPeligrosa) {
                    // if (inTheirRange(squad)(gameData.prism.enemyTroops || []).length > 0) {
                    //     const saferPosition = closerToHome(squad, dist(myHero, squad) / 2);
                    //     command = new Command('MOVE', saferPosition, squad.y, 'FOLLOW SQUAD SAFELY');
                    // } else {
                    const safeToWalk = Math.abs(squad.x, gameData.prism.skirmishLinePos) > 400;
                    const followPoint = safeToWalk ? inDirection(squad, gameData.prism.enemyTower, 50) : inDirection(squad, gameData.prism.myTower, 50);
                    if (
                        myHero.heroType === heroType.ironman &&
                        myHero.mana > spells.blink.mana &&
                        myHero.countDown1 === 0) {
                        if (dist(myHero, followPoint) < spells.blink.range) {
                            command = new Command('BLINK', followPoint.x, followPoint.y, 'FOLLOW FASTER');
                        } else {
                            const closerPoint = inDirection(myHero, followPoint, spells.blink.range);
                            command = new Command('BLINK', closerPoint.x, closerPoint.y, 'FOLLOW FASTER');
                        }
                    } else {
                        command = new Command('MOVE', followPoint.x, followPoint.y, 'FOLLOW SQUAD');
                    }
                    // }
                } else {
                    command = new Command('MOVE', closerToHome(gameData.prism.enemyTower, zonaPeligrosa), squad.y);
                }
            }
        } else if (heroInRange && pullableTargets.length > 0 && canPerformPull) {
            const sortedPullable = pullableTargets.sort((a, b) => a.attackDamage <= b.attackDamage);
            command = new Command('PULL', sortedPullable[0].unitId, null, 'GET OVER HERE');
        } else if (unitsInRange.length > 0) {
            const weakTarget = unitsInRange.filter(u => !alreadyMarkedUnits.includes(u.unitId)).sort((a, b) => a.health > b.health)[0];
            // const rangedTarget = unitsInRange.filter(u => !alreadyMarkedUnits.includes(u.unitId)).sort((a, b) => a.health > b.health)[0];

            const weaklings = gameData.prism.myTroops.map(unit => ({ ...unit, range: dist(myHero, unit) })).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
            const targetDist = weakTarget ? dist(myHero, weakTarget) : 5000;

            const closestBushes = closestTo(myHero)(gameData.mapFeatures.filter(isBush));

            const squadLife = lifeCircle(myHero, gameData.prism.myTroops);

            if (
                // myHero.heroType === heroType.ironman &&
                // myHero.mana >= spells.burning.mana &&
                // myHero.countDown3 === 0 &&
                // targetDist <= spells.burning.range &&
                // targetDist > 100
                false
            ) {
                command = new Command('BURNING', weakTarget.x, weakTarget.y, 'BURNING');
            // } else if (weakTarget && targetDist <= weakTarget.attackRange) {
                /* const safeShootingSpot = inDirection(weakTarget, myHero, weakTarget.attackRange + 5);
                if (dist(myHero, safeShootingSpot) <= myHero.movementSpeed * 0.8) {
                    command = new Command('MOVE_ATTACK', `${safeShootingSpot.x} ${safeShootingSpot.y}`, weakTarget.unitId, 'SHOOTING FROM DISTANCE');
                } else {
                    const pointInBetween = inDirection(myHero, safeShootingSpot, myHero.movementSpeed * 0.8);
                    command = new Command('MOVE_ATTACK', `${pointInBetween.x} ${pointInBetween.y}`, weakTarget.unitId, '~SHOOTING FROM DISTANCE');
                }
                if (weakTarget && weakTarget.health < myHero.attackDamage && weakTarget.unitType === unitType.unit) {
                    command.addAction(() => { alreadyMarkedUnits.push(weakTarget.unitId); });
                } */
            } else if (gameData.prism.wanderingGroots.length > 0 && inMyRange(myHero)(gameData.prism.wanderingGroots).length > 0) {
                const closestTarget = inMyRange(myHero)(gameData.prism.wanderingGroots);
                command = new Command('ATTACK', closestTarget[0].unitId, null, 'WANDERING GROOT');
            } else if (weaklings.length > 0) {
                const myWeakTarget = weaklings[0];
                command = new Command('ATTACK', myWeakTarget.unitId, null, 'MY OWN WEAKLING');
            // } else if (rangedTarget) {
            //     command = new Command('ATTACK', rangedTarget.unitId, null, 'RANGED TARGET');
            } else {
                const secondWeakTarget = unitsInRange.sort((a, b) => a.health > b.health)[0];
                command = new Command('ATTACK', secondWeakTarget.unitId, null, 'THEIR WEAKLING');
            }

            const manaRequiredForBurning = (myHeroPercentage > 20) ? spells.burning.mana : spells.burning.mana + spells.blink.mana;
            if (
                myHero.heroType === heroType.ironman &&
                myHero.mana >= manaRequiredForBurning &&
                myHero.countDown3 === 0 &&
                targetDist <= spells.burning.range &&
                targetDist > 50
            ) {
                command = new Command('BURNING', weakTarget.x, weakTarget.y, 'BURNING');
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
        } else if (hulkPresent) {
            if (gameData.prism.myTroops.length > 0) {
                const squadX = median(gameData.prism.myTroops.filter(unit => dist(myHero, unit) > 140).map(u => u.x));
                const squadY = Math.floor(gameData.prism.myTroops.map(u => u.y).reduce((p, c) => p + c, 0) / gameData.prism.myTroops.length);
                const spotBehindSquad = inDirection({ x: squadX, y: squadY }, gameData.prism.myTower, 50);
                command = new Command('MOVE', spotBehindSquad.x, spotBehindSquad.y, 'FOLLOW SQUAD CAREFULLY');
            } else {
                command = new Command('MOVE', gameData.prism.myTower.x, gameData.prism.myTower.y, 'FALL BACK');
            }
        } else {
            command = new Command('MOVE', gameData.prism.myTower.x, gameData.prism.myTower.y, 'FALL BACK');
            // command = new Command('ATTACK_NEAREST', 'HERO');
        }


        if (hulkPresent && myHero.heroType === heroType.doctorStrange) {
            const enemyHulk = gameData.prism.enemyHeroes.find(h => h.heroType === heroType.hulk);
            const pullPoint = inDirection(enemyHulk, gameData.prism.myTower, spells.pull.range - 10);

            const hulkInPullDistance = dist(myHero, enemyHulk) <= spells.pull.range;
            const canPullHulk = hulkInPullDistance &&
                myHero.mana >= spells.pull.mana &&
                myHero.countDown3 === 0;

            if (canPullHulk) {
                return (new Command('PULL', enemyHulk.unitId, null, 'GETTING CLOSER...')).generate();
            }

            if (enemyHulk.stunDuration > 0 &&
                inMyRange(myHero)([enemyHulk]).length > 0) {
                return (new Command('ATTACK', enemyHulk.unitId, null, 'HIT HIM...')).generate();
            }

            return (new Command('MOVE', pullPoint.x, pullPoint.y, 'WALKING TO POINT')).generate();
        }

        if (gameData.game.gold > 150 &&
            myHeroPercentage < 0.5 &&
            Math.random() > 0.5 &&
            healthPotionsForSale.length > 0) {
            command = new Command('BUY', healthPotionsForSale[0].itemName);
        }

        const weAreFlimsy = myHero.heroType === heroType.doctorStrange;

        const reallyPessimistic = (hulkPresent && weAreFlimsy) ? veryPessimisticLifeThreshold : pessimisticLifeThreshold;
        const lifeThreshold = (hulkPresent || weAreFlimsy) ? reallyPessimistic : defaultLifeThreshold;
        const onlyDoctorLeft = gameData.prism.enemyHeroes.length === 1 && gameData.prism.enemyHeroes[0].heroType === heroType.doctorStrange;
        const weAreLeading = (gameData.prism.myHeroesTotal > gameData.prism.enemyHeroesTotal * 1.5) || onlyDoctorLeft;

        if (myHeroPercentage <= lifeThreshold && !weAreLeading) {
            const distToTower = dist(myHero, gameData.prism.myTower);
            const hasEnemy = gameData.prism.enemyTroops.length > 0;
            const weaklingInRange = hasEnemy ? inMyRange(myHero)(gameData.prism.enemyTroops).sort((a, b) => a.health > b.health)[0] : false;

            if (myHero.health / myHero.maxHealth < lifeThreshold && healthPotionsForSale.length > 0) {
                command = new Command('BUY', healthPotionsForSale[0].itemName);
            } else if (distToTower > 20) {
                if (myHero.heroType === heroType.ironman && myHero.mana > 16 && myHero.countDown1 === 0) {
                    const blinkPoint = (distToTower > 200) ? inDirection(myHero, gameData.prism.myTower, 199) : gameData.prism.myTower;
                    command = new Command('BLINK', blinkPoint.x, blinkPoint.y, 'BLINK TO TOWER');
                } else {
                    command = new Command('MOVE', gameData.prism.myTower.x + 20, gameData.prism.myTower.y, 'TO TOWER');
                }
            } else if (
                myHero.heroType === heroType.doctorStrange &&
                myHero.mana >= 50 &&
                myHero.countDown1 === 0
            ) {
                command = new Command('AOEHEAL', myHero.x, myHero.y, 'HEALING');
            } else if (
                myHero.heroType === heroType.ironman &&
                myHero.mana >= spells.fireball.mana &&
                myHero.countDown2 === 0 &&
                inMyRange({ ...myHero, attackRange: spells.fireball.range })(gameData.prism.enemyHeroes).length > 0
            ) {
                const fireballable = inMyRange({ ...myHero, attackRange: spells.fireball.range })(gameData.prism.enemyHeroes)[0];
                command = new Command('FIREBALL', fireballable.x, fireballable.y, 'HEALFIREBALLING');
            } else if (weaklingInRange) {
                command = new Command('ATTACK', weaklingInRange.unitId, null, "WHILE WE'RE HERE...");
            } else if (heroInRange) {
                const heroInRangeTarget = inMyRange(myHero)(gameData.prism.enemyHeroes)[0];
                command = new Command('MOVE_ATTACK', myHero.x, myHero.y, heroInRangeTarget.unitId, 'STAND AND SHOOT');
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

if (typeof readline === 'function') {
    const setupAction = readSetup({ readline });
    store = update(store, setupAction);

    player(store, { readline });
}

module.exports = {
    Command,
    actionType,
    createMine,
    not,
    combine,
    update,
    evaluateLoot,
    inDirection,
    isHero,
    readSetup,
    readTurnData,
    transformPrism,
    generateCommands,
    calculateSkirmishLine,
};
