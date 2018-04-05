function es6uniq(arrArg) {
return arrArg.filter((elem, pos, arr) => {
    return arr.indexOf(elem) == pos;
});
}

class Command {
    constructor(type, param1 = null, param2 = null) {
        this.type = type;
        this.param1 = param1 || '';
        this.param2 = param2 || '';
    }	
}

Command.prototype.generate = function() { 
    if (this.action) this.action();
    return [ this.type, this.param1.toString(), this.param2.toString()].filter(Boolean).join(' ') 
}
Command.prototype.addAction = function(callback) { this.action = callback; }

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
    var [ 
        itemName,
        itemCost,
        damage,
        health,
        maxHealth,
        mana,
        maxMana,
        moveSpeed,
        manaRegeneration,
        isPotion
    ] = [ ...inputs ];

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

const median = (values = []) => {
    values.sort((a, b) => a - b);
    let lowMiddle = Math.floor((values.length - 1) / 2);
    let highMiddle = Math.ceil((values.length - 1) / 2);
    return (values[lowMiddle] + values[highMiddle]) / 2;
}

const mine = u => u.team === 0;
const enemy = u => u.team === 1;
const isHero = u => u.type === 'HERO';

const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

var command = null;

const storedItems = [];
const defaultCommand = new Command('WAIT');

const evaluateLoot = (item) => item.damage * 3 + item.movespeed + item.maxHealth * 2;

var stored_potions = [];
const lifeThreshold = 0.4;

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

    const enemyHero = units.find(u => u.team != myTeam && u.unitType === 'HERO');
    const myTower = units.find(u => u.team == myTeam && u.unitType === 'TOWER');
    const enemyTower = units.find(u => u.team != myTeam && u.unitType === 'TOWER');
    const myHeroes = units.filter(u => u.team === myTeam && u.unitType === 'HERO');
    const myTroops = units.filter(u => u.team == myTeam && u.unitType === 'UNIT' && u.health > 0 && u.isVisible);
    const enemyTroops = units.filter(u => u.team != myTeam && u.unitType === 'UNIT' && u.health > 0 && u.isVisible);

    printErr('RoundType', roundType);
    if (roundType === -2) {
        print('DOCTOR_STRANGE');
    } else if (roundType === -1) {
        print('HULK');
    } else {
        printErr('units', units.length, 'my heroes', myHeroes.length);
        
        for (var myHeroId in myHeroes) {

            myHero = myHeroes[myHeroId];
            const heroInRange = (myHero && enemyHero) ? dist(myHero, enemyHero) <= myHero.attackRange : false;
            const unitsInRange = enemyTroops.map(unit => ({...unit, range: dist(myHero, unit)})).filter(unit => unit.range <= myHero.attackRange);

            printErr('Units in range:', unitsInRange.length, 'myX', myHero.x)
            printErr('My tower:', myTower.x, myTower.y)

            if (!heroInRange && unitsInRange.length == 0 && myTroops.length > 0) {
                const purchasable = items.filter(i => i.itemCost <= gold && !i.isPotion).filter(i => storedItems.findIndex(si => si.name == i.itemName) == -1);
                const lootRating = purchasable.map(i => ({ name: i.itemName, rating: evaluateLoot(i)}));
                lootRating.sort((a,b) => a.rating >= b.rating);
                if (purchasable.length > 0 && myHero.itemsOwned < 4) {
                    command = new Command('BUY', lootRating[0].name);
                    command.addAction(() => storedItems.push(lootRating[0]));
                } else {
                    if (myTroops.length > 0) {
                        const avgX = median(myTroops.map(u => u.x));
                        const avgY = Math.floor(myTroops.map(u => u.y).reduce( ( p, c ) => p + c, 0 ) / myTroops.length);
                        if (dist({x: avgX, y: avgY}, enemyTower) > enemyTower.attackRange) {
                            command = new Command('MOVE', avgX, avgY);
                        } else {
                            command = new Command('MOVE', avgY, enemyTower.x - enemyTower.attackRange - 10);
                        }
                    } else {
                        command = new Command('MOVE', enemyHero.x, enemyHero.y);
                    }
                }
            } else {
                if (unitsInRange.length > 0) {
                    const weakTarget = unitsInRange.sort((a, b) => a.health >= b.health)[0]
                    const enemyWeaklings = enemyTroops.map(unit => ({...unit, range: dist(myHero, unit)})).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
                    const weaklings = myTroops.map(unit => ({...unit, range: dist(myHero, unit)})).filter(unit => unit.range <= myHero.attackRange && unit.health <= myHero.attackDamage);
    
                    if (enemyWeaklings.length > 0) {
                        command = new Command('MOVE_ATTACK', enemyWeaklings[0].unitId);
                    } else if (weaklings.length > 0) { 
                        command = new Command('MOVE_ATTACK', weaklings[0].unitId);
                    } else {
                        command = new Command('ATTACK', weakTarget.unitId);
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
            
            if (myHeroPercentage <= lifeThreshold) {
                const healthPotionsForSale = items.filter(i => i.itemCost <= gold && i.isPotion && i.health);
                if (myHero.health / myHero.maxHealth < lifeThreshold && healthPotionsForSale.length > 0 && myHeroPercentage <= enemyHeroPercentage) {
                    if (myHero.itemsOwned === 4) {
                        storedItems.sort((a,b) => a.rating <= b.rating);
                        const lowestItem = storedItems[0];
                        command = new Command('SELL', lowestItem.name);
                        command.addAction(() => {
                            storedItems.unshift();
                        })
                    } else {
                        command = new Command('BUY', healthPotionsForSale[0].itemName);
                    }
                } else {
                    if (dist(myHero, myTower) > myTower.attackRange - 20) {
                        command = new Command('MOVE', myTower.x, myTower.y);
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