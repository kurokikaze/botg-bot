function es6uniq(arrArg) {
    return arrArg.filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
    });
}

const actionType = {
    initialData: 'initialData',
    tickUpdate: 'tickUpdate',
}

class Command {
    constructor(type, param1 = null, param2 = null, comment = '') {
        this.type = type;
        this.param1 = param1 || '';
        this.param2 = param2 || '';
        this.comment = comment;
    }
}

Command.prototype.generate = function() { 
    if (this.action) this.action();
    const commandBody = [ this.type, this.param1.toString(), this.param2.toString()].filter(Boolean).join(' ')
    return this.comment ? commandBody + '; ' + this.comment : commandBody;
}

Command.prototype.addAction = function(callback) { this.action = callback; }

var store = {};

const update = (state, action) => reducer(state, action)

const reducer = (state, action) => {
    switch (action.type) {
        case actionType.initialData: {
            return state.extend({
                config: {
                    myTeam: action.myTeam
                },
                items: action.items,
                mapFeatures: action.mapFeatures,
            })
        }
    }
}

const readSetup = () => {
    var myTeam = parseInt(readline());
    var bushAndSpawnPointCount = parseInt(readline()); // usefrul from wood1, represents the number of bushes and the number of places where neutral units can spawn
    const mapFeatures = []
    for (var i = 0; i < bushAndSpawnPointCount; i++) {
        var inputs = readline().split(' ');
        var entityType = inputs[0]; // BUSH, from wood1 it can also be SPAWN
        var x = parseInt(inputs[1]);
        var y = parseInt(inputs[2]);
        var radius = parseInt(inputs[3]);
        mapFeatures.push(
            entityType,
            x,
            y,
            radius
        );
    }
    
    var itemCount = parseInt(readline()); // useful from wood2
    
    const items = [];
    for (var i = 0; i < itemCount; i++) {
        var inputs = readline().split(' ');

        items.push({
            itemName: inputs[0],
            itemCost: parseInt(inputs[1]),
            damage: parseInt(inputs[2]),
            health: parseInt(inputs[3]),
            maxHealth: parseInt(inputs[4]),
            mana: parseInt(inputs[5]),
            maxMana: parseInt(inputs[6]),
            moveSpeed: parseInt(inputs[7]),
            manaRegeneration: parseInt(inputs[8]),
            isPotion: parseInt(inputs[9])
        })
    }

    return {
        type: actionType.initialData,
        myTeam,
        mapFeatures,
        items
    }
}

const setupAction = readSetup();
store = update(store, setupAction);

var { myTeam, mapFeatures, items } = { ...setupAction }

// Math stuff
const median = (values = []) => {
    values.sort((a, b) => a - b);
    let lowMiddle = Math.floor((values.length - 1) / 2);
    let highMiddle = Math.ceil((values.length - 1) / 2);
    return (values[lowMiddle] + values[highMiddle]) / 2;
}

// func flavor
const combine = (f1, f2) => (t) => f1(t) && f2(t);
const not = (fn) => function() { return !fn.apply(null, arguments) };

const mine = u => u.team === myTeam;
const enemy = not(mine);

const isHero = u => u.unitType === 'HERO';
const isUnit = u => u.unitType === 'UNIT';
const isTower = u => u.unitType === 'TOWER';

const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
const rightmost = objects => objects.length > 0 ? objects.reduce((o1, best) => o1.x > best ? o2.x : best, objects[0].x) : null;
const leftmost = objects => objects.length > 0 ? objects.reduce((o1, best) => o1.x < best ? o2.x : best, objects[0].x) : null;

const evaluateLoot = (item) => item.damage * 3 + item.movespeed + item.maxHealth * 2;

const lifeCircle = (hero, units) => units.filter(u => dist(hero, u) <= 140).reduce((s, u) => s += u.health, 0)
const skirmishLine = units => {
    const myRightmost = rightmost(units.filter(mine))
    const theirLeftmost = leftmost(units.filter(enemy))
    return myRightmost + theirLeftmost / 2;
}

const isBush = f => f.entityType === 'BUSH';
const findGoodBushes = skirmishLine => mapFeatures.filter(isBush).map(f => ({ ...f, dist: dist(f, {x: skirmishLine, y: myTower.y})}))

const inMyRange = shooter => units => units.filter(unit => dist(shooter, unit) < shooter.attackRange)
const inTheirRange = target => units => units.filter(unit => dist(target, unit) < unit.attackRange)

const skirmishInProgress = units => {
    const mineUnits = units.filter(combine(mine, isUnit))
    const enemyUnits = units.filter(combine(mine, isUnit))

    // Нет юнитов - нет схватки. Замес у башни не рассматриваем.
    if (mineUnits.length === 0 || enemyUnits.length === 0) return false;

    const weAreLeft = mineUnits[0].x < enemyUnits[0].x;

    const ourAvantgarde = weAreLeft ? rightmost(mineUnits) : leftmost(mineUnits);
    const enemyAvantgarde = weAreLeft ? leftmost(enemyUnits) : rightmost(enemyUnits);

    return Math.abs(ourAvantgarde - enemyAvantgarde) <= 100;
}

var command = null;
const storedItems = [];
const defaultCommand = new Command('WAIT');
var stored_potions = [];
const defaultLifeThreshold = 0.3;
const pessimisticLifeThreshold = 0.5;

// game loop
while (true) {
    var gold = parseInt(readline());
    var enemyGold = parseInt(readline());
    var roundType = parseInt(readline()); // a positive value will show the number of heroes that await a command
    var entityCount = parseInt(readline());
    const units = [];
    for (var i = 0; i < entityCount; i++) {
        var inputs = readline().split(' ');

        units.push({
            unitId: parseInt(inputs[0]),
            team: parseInt(inputs[1]),
            unitType: inputs[2], // UNIT, HERO, TOWER, can also be GROOT from wood1
            x: parseInt(inputs[3]),
            y: parseInt(inputs[4]),
            attackRange: parseInt(inputs[5]),
            health: parseInt(inputs[6]),
            maxHealth: parseInt(inputs[7]),
            shield: parseInt(inputs[8]), // useful in bronze
            attackDamage: parseInt(inputs[9]),
            movementSpeed: parseInt(inputs[10]),
            stunDuration: parseInt(inputs[11]), // useful in bronze
            goldValue: parseInt(inputs[12]),
            countDown1: parseInt(inputs[13]), // all countDown and mana variables are useful starting in bronze
            countDown2: parseInt(inputs[14]),
            countDown3: parseInt(inputs[15]),
            mana: parseInt(inputs[16]),
            maxMana: parseInt(inputs[17]),
            manaRegeneration: parseInt(inputs[18]),
            heroType: inputs[19], // DEADPOOL, VALKYRIE, DOCTOR_STRANGE, HULK, IRONMAN
            isVisible: parseInt(inputs[20]), // 0 if it isn't
            itemsOwned: parseInt(inputs[21]) // useful from wood1
        });
    }
    
    command = defaultCommand;

    const enemyHero = units.find(combine(enemy, isHero));
    const myTower = units.find(combine(mine, isTower));
    const enemyTower = units.find(combine(enemy, isTower));
    const myHeroes = units.filter(combine(mine, isHero));
    const myTroops = units.filter(combine(mine, isUnit));

    const enemyTroops = units.filter(combine(enemy, isUnit));

    const closingSign = u => Math.sign(myTower.x - u.x)
    const closerToHome = (u, dist) => (u.x + closingSign(u) * dist);

    const closestTo = center => (us) => us.map(iu => ({...iu, dist: dist(center, iu)})).sort(((a,b) => a.dist >= b.dist))

    printErr('RoundType', roundType);
    if (roundType === -2) {
        print('DOCTOR_STRANGE');
    } else if (roundType === -1) {
        print('IRONMAN');
    } else {
        printErr('units', units.length, 'my heroes', myHeroes.length);
        
        for (var myHeroId in myHeroes) {

            myHero = myHeroes[myHeroId];
            const heroInRange = myHero && enemyHero && (dist(myHero, enemyHero) <= myHero.attackRange);
            const unitsInRange = inMyRange(myHero)(enemyTroops);

            printErr('Units in range:', unitsInRange.length)
            //printErr('My tower:', myTower.x, myTower.y)

            if (!heroInRange && unitsInRange.length == 0 && myTroops.length > 0) {
                const purchasable = items.filter(i => i.itemCost <= gold && !i.isPotion).filter(i => storedItems.findIndex(si => si.name == i.itemName) == -1);
                const lootRating = purchasable.map(i => ({ name: i.itemName, rating: evaluateLoot(i)}));
                lootRating.sort((a,b) => a.rating >= b.rating);
                if (purchasable.length > 0 && myHero.itemsOwned < 4) {
                    command = new Command('BUY', lootRating[0].name);
                    command.addAction(() => storedItems.push(lootRating[0]));
                } else {
                    if (myTroops.length > 0) {
                        const squad = {
                            x : median(myTroops.map(u => u.x)), 
                            y : Math.floor(myTroops.map(u => u.y).reduce( ( p, c ) => p + c, 0 ) / myTroops.length)
                        };

                        if (dist(squad, enemyTower) > enemyTower.attackRange) {
                            if (inTheirRange(squad)(enemyTroops).length > 0) {
                                const saferPosition = closerToHome(squad, dist(myHero, squad) / 2);
                                command = new Command('MOVE', saferPosition, squad.y, 'FOLLOW SQUAD SAFELY');
                            } else {
                                command = new Command('MOVE', squad.x, squad.y, 'FOLLOW SQUAD');
                            }                            
                        } else {
                            command = new Command('MOVE', closerToHome(enemyTower, enemyTower.attackRange + 10), squadY);
                        }
                    }
                }
            } else {
                if (unitsInRange.length > 0) {
                    const weakTarget = unitsInRange.sort((a, b) => a.health >= b.health)[0]
                    const enemyWeaklings = enemyTroops.map(unit => ({...unit, range: dist(myHero, unit)})).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
                    const weaklings = myTroops.map(unit => ({...unit, range: dist(myHero, unit)})).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
                    const skirmishLinePos = skirmishLine(units);
                    const skirmishIsOn = skirmishInProgress(units);
                    const goodBushes = findGoodBushes(skirmishLinePos).filter(f => f.dist <= myHero.attackRange);

                    const closestBushes = closestTo(myHero)(mapFeatures.filter(isBush));

                    skirmishIsOn && printErr('Skirmish in progress at', skirmishLinePos)

                    const squadLife = lifeCircle(myHero, myTroops);

                    if (enemyWeaklings.length > 0) {
                        command = new Command('ATTACK', enemyWeaklings[0].unitId);
                    } else if (weaklings.length > 0) { 
                        command = new Command('ATTACK', weaklings[0].unitId);
                    } else {
                        command = new Command('ATTACK', weakTarget.unitId);
                    }

                    const safeSpot = (closestBushes.length > 0) ? closestBushes[0] : myTower;

                    if (goodBushes.length > 0 && skirmishIsOn) {
                        if (dist(myHero, goodBushes[0]) > 10) {
                            command = new Command('MOVE', goodBushes.x, goodBushes.y, 'TO THE BUSH');
                        }
                    } else if (Math.abs(skirmishLinePos - myHero.x) < 100) {
                        command = new Command('MOVE', closerToHome({x: skirmishLinePos}, 100), myHero.y, 'FROM SKIRMISH LINE');
                    }

                    if (squadLife <= 200 && myTroops.length > 0) {
                        if (myTroops.length > 0) {
                            const squadX = median(myTroops.filter(unit => dist(myHero, unit) > 140).map(u => u.x));
                            const squadY = Math.floor(myTroops.map(u => u.y).reduce( ( p, c ) => p + c, 0 ) / myTroops.length);
                            if (dist(myHero, {x: squadX, y: squadY}) > 50) {
                                command = new Command('MOVE', safeSpot.x, safeSpot.y, 'LEAVING SQUAD WITH ' + squadLife + ' HP');
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
            }
            
            const unitsTooClose = enemyTroops.map(unit => dist(myHero, unit)).filter(range => range <= 100);
            const heroTooClose = enemyHero ? dist(myHero, enemyHero) <= 100 : false;
            
            const myHeroPercentage = myHero.health / myHero.maxHealth;
            const enemyHeroPercentage = enemyHero ? (enemyHero.health / enemyHero.maxHealth) : 100;
            
            /*if (unitsTooClose.length > 1 || heroTooClose || !myTroops) {
                command = new Command('MOVE', myTower.x, myTower.y);
            }*/

            const lifeThreshold = (enemyHero && enemyHero.heroType === 'HULK') ? pessimisticLifeThreshold : defaultLifeThreshold;
            
            if (myHeroPercentage <= lifeThreshold) {
                const healthPotionsForSale = items.filter(i => i.itemCost <= gold && i.isPotion && i.health);
                if (myHero.health / myHero.maxHealth < lifeThreshold && healthPotionsForSale.length > 0 && myHeroPercentage <= enemyHeroPercentage) {
                    if (myHero.itemsOwned === 4) {
                        storedItems.sort((a,b) => a.rating <= b.rating);
                        const lowestItem = storedItems[0];
                        command = new Command('SELL', lowestItem.name);
                        command.addAction(() => {
                            storedItems.shift();
                        })
                    } else {
                        command = new Command('BUY', healthPotionsForSale[0].itemName);
                    }
                } else {
                    if (dist(myHero, myTower) > 20) {
                        command = new Command('MOVE', myTower.x + 20, myTower.y, 'TO TOWER');
                    } else {
                        if (heroInRange) {
                            command = new Command('ATTACK_NEAREST', 'HERO');
                        } else {
                            command = new Command('WAIT');
                        }
                    }
                }
            }
            
            print(command.generate());
        }
    }
}