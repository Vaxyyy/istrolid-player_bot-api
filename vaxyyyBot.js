/*
 * This is an javascript player bot api for istrolid
 */

 /**
 * checks parameter 
 * 
 * @param {constructor} type - type to compare 
 * @param {any} value - value to check
 * @param {any} set - set value if undefined
 * @param {number} i - number of position in array 
 */
function check(type, value, set, i) {
    if (value === undefined && set !== undefined) return set;
    switch (type) {
        case Boolean:
            if (typeof value === "boolean") return value;
            break;
        case String:
            if (typeof value === "string") return value;
            break;
        case Number:
            if (typeof value === "number") return value;
            break;
        case Array:
            if (Array.isArray(value)) return value;
            break;
        case Object:
            if (value instanceof Object) return value;
            break;
        default:
            throw new Error("param : Expecting " + type.name + " " + i ? i++ : "");
    }
    throw new Error("param : Expecting " + type.name + " " + i ? i++ : "");
};

/**
 * checks list of parameters 
 * 
 * @param {array} parameter_types - types to compare 
 * @param {array} values - values to check
 */
function check_list(parameter_types, values) {
    if (parameter_types.length !== values.length) throw new Error(`parameters has ${parameter_types.length} parameters, but the values has ${values.length}`);
    for (let i = 0; i < values.length; i++) check(parameter_types[i], values[i], undefined, i)
};

function compare_obj(obj, need) {
    obj_length = Object.keys(obj).length;
    need_length = Object.keys(need).length;

    if (obj_length !== need_length) throw new Error(`need has ${need_length} values, but the obj has ${obj_length}`);

    for (let i in need) {
        if (i in obj) {
        } else throw new Error("Compare : Expecting " + i);
    }
    return obj;
};

var hook = hook || {
    timer: setInterval(() => vaxyyyBot.tick(), 60)
};

var vaxyyyBot = vaxyyyBot || {
    enabled: true,
    anti_afk: true,
    host: commander.host,
    step: 0,
    messageQueue: [],

    tick: function () {
        if (vaxyyyBot.enabled) {
            if (vaxyyyBot.step % 17 === 0) {
                let queue = this.messageQueue[0];
                if (queue) {
                    rootNet.send("message", {
                        text: queue.text,
                        channel: queue.channel
                    });
                    this.messageQueue.shift();
                }
                if (vaxyyyBot.anti_afk) {
                    if (!rootNet && rootNet.websocket.readyState === WebSocket.CLOSED) return rootNet.connect();
                    network.send(`mouseMove`, [0, 0], false);
                }
            }
            vaxyyyBot.step++;
        } else {
            vaxyyyBot.step = 0;
        }
    }
}

var order = {
    /**
     * Sends a chat message
     *
     * @param {string} msg - message to send
     * @param {number} max - max lenght of character | max 300
     * @param {string} server - channel name to send message | lobbys server name
     */
    send_message: async function (msg, max, server) {
        msg = check(String, msg);
        max = check(Number, max, 300);
        server = check(String, server, battleMode.serverName);

        vaxyyyBot.messageQueue.push({
            text: msg.substring(0, max),
            channel: server
        });
    },

    /**
     * @warning this will save your account
     * Sets current fleet
     *
     * @param {number} row - row number
     * @param {string} tab - tab name
     */
    set_fleet: async function (row, tab) {
        check_list([Number, String], [row, tab])

        commander.fleet.selection = {
            "row": row,
            "tab": tab
        };
        account.save();
    },

    /**
     * You surrender...
     */
    surrender: function () {
        network.send("surrender");
    },

    /**
     * Starts game
     */
    startGame: function () {
        if (!vaxyyyBot.host) throw new Error("not host");

        if (sim.countDown === 0) {
            if (sim.canStart()) {
                network.send("startGame");
            }
        }
    },

    /**
     * Sets game mode some servers have more then the ones named
     * 
     * @param {string} mode - name of mode | 1v1, 2v2, 3v3, Survival
     */
    set_mode: function (mode) {
        if (!vaxyyyBot.host) throw new Error("not host");

        mode = check(String, mode)
        network.send("configGame", {
            type: mode
        });
    },

    /**
     * Join side
     * 
     * @param {string} side - name of side to join | alpha, beta
     */
    join_side: function (side) {
        side = check(String, side)
        network.send("switchSide", side);
    },

    /**
     * Join server
     * 
     * @param {string} name - name of server to join
     */
    join_server: function (name) {
        name = check(String, name)
        battleMode.joinServer(name);
    },

    /**
     * Kick player
     * 
     * @param {number|string} player - number | name of player to kick
     */
    kick_player: function (player) {
        if (!vaxyyyBot.host) throw new Error("not host");

        if (typeof player === "number") {
            return network.send("kickPlayer", player);
        } else if (typeof player === "string") {
            let number, p;
            for (number in sim.players) {
                p = sim.players[number];
                if (p.name.toLowerCase() === player.toLowerCase()) return network.send("kickPlayer", number);
            }
            throw new Error(player + " : not found");
        } else throw new Error("no player kicked");
    },

    /**
     * Add AI player
     * 
     * @param {string} fleet - name of fleet
     * @param {string} name - name for ai
     * @param {string} side - side to add to | alpha, beta
     */
    add_ai: async function (fleet, name, side) {
        check_list([String, String, String], [fleet, name, side])

        let fleetAis, aiName, ref, row, tab, col, aiBuildBar;

        fleetAis = commander.fleet.ais || {};
        for (key in fleetAis) {
            aiName = fleetAis[key];
            ref = fromAIKey(key), row = ref[0], tab = ref[1];
            if (fleet === aiName) {
                aiBuildBar = [];
                for (col = i = 0; i < 10; col = ++i) aiBuildBar.push(commander.fleet[getFleetKey(row, col, tab)]);
                network.send("addAi", name, side, aiBuildBar);
                break;
            }
        }
    },

    /**
     * Copy Fleet
     * 
     * @param {string} from - location of fleet | { row: number, tab: "string" }
     * @param {string} to - location to copy to | { row: number, tab: "string" }
     */
    copy_fleet: async function (from, to) {
        let _fleet, i, j, keyF, keyT;
        _fleet = { tab: null, row: null};

        from = compare_obj(from, _fleet);
        to = compare_obj(to, _fleet);

        console.log(from.tab, from.row, to.tab, to.row);

        check_list([String, Number, String, Number], [from.tab, from.row, to.tab, to.row])

        for (i = j = 0; j < 10; i = ++j) {
            keyF = getFleetKey(from.row, i, from.tab);
            keyT = getFleetKey(to.row, i, to.tab);
            commander.fleet[keyT] = commander.fleet[keyF];
        }
        return commander.fleet.ais[getAIKey(to.row, to.tab)] = commander.fleet.ais[getAIKey(from.row, from.tab)];
    },

    //network.send("stopOrder");

    //network.send("holdPositionOrder");

    //network.send("followOrder", unit.id, shiftKey, id);

    //network.send("moveOrder", formation, shiftKey, id);

    //network.send("buildRq", index, number)

    //network.send("playerSelected", ids);

    //battleMode.selfDestructOrder();
    //network.send("selfDestructOrder");

    //network.send("setRallyPoint", [0, 0]);
}

var find = {
    /**
     * Gets name of fleet
     *
     * @param {number} row - row number
     * @param {string} tab - tab name
     * @return {string} - fleet name
     */
    fleet_name: async function (row, tab) {
        check_list([Number, String], [row, tab])

        return commander.fleet.ais(row, tab);
    },

    /**
     * Gets location of fleet by name
     *
     * @param {string} name - fleet name
     * @return {string} - string with row and tab of fleet || false
     */
    fleet_location: function (name) {
        name = check(String, name);

        for (const fleet in commander.fleet.ais) {
            let fleet_name = commander.fleet.ais[fleet];
            if (fleet_name === name) {
                return fleet;
            }
        }
        return false;
    },
}

var current = {
    /**
     * Gets name of the current fleet
     *
     * @return {string} - current fleet name
     */
    fleet_name: function () {
        fleet = commander.fleet.selection;
        return commander.fleet.ais[`${fleet.row},${fleet.tab}`];
    },

    /**
     * Gets location of the current fleet
     *
     * @return {string} - current fleet location
     */
    fleet_location: function () {
        return commander.fleet.selection;
    },
}

order.send_message("test");
