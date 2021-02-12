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
    for (let i = 0; i < values.length; i++) check(parameter_types[i], values[i], undefined, i);
};

function compare_obj(obj, need) {
    obj_length = Object.keys(obj).length;
    need_length = Object.keys(need).length;

    if (obj_length !== need_length) throw new Error(`need has ${need_length} values, but the obj has ${obj_length}`);

    for (let i in need) {
        if (!(i in obj)) throw new Error("Compare : Expecting " + i);
    }
    return obj;
};

class EventEmitter extends EventTarget {};
const emit = new EventEmitter();

emit.addEventListener(
    'istrolid-chat-message',
    (event) => {
        for (let i in vaxyyyBot.bots) {
            let bot = vaxyyyBot.bots[i];
            try {
                if (bot && typeof bot.message === "function") {
                    bot.message(event.detail);
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
);

var hook = hook || {
    timer: setInterval(() => vaxyyyBot.tick(), 60)
};

let _fleet = {
    tab: null,
    row: null
};

var vaxyyyBot = vaxyyyBot || {

    bots: [],
    enabled: false,
    anti_afk: false, // dose what it says stops you from been afk or disconnecting
    host: false,
    step: 0,
    messageQueue: [],
    last_msg: {},

    tick: function () {
        if (vaxyyyBot.enabled) {
            if (vaxyyyBot.step % 17 === 0) {
                let queue = vaxyyyBot.messageQueue[0];
                if (queue) {
                    rootNet.send("message", {
                        text: queue.text,
                        channel: queue.channel
                    });
                    vaxyyyBot.messageQueue.shift();
                }
                if (vaxyyyBot.anti_afk) {
                    if (!rootNet && rootNet.websocket.readyState === WebSocket.CLOSED) return rootNet.connect();
                    network.send(`mouseMove`, [0, 0], false);
                }
            } else if (vaxyyyBot.step % 8 === 0) {
                vaxyyyBot.host = commander.host;

                for (let i in vaxyyyBot.bots) {
                    let bot = vaxyyyBot.bots[i];
                    try {
                        if (bot && typeof bot.run === "function") {
                            bot.run();
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

                let data = chat.lines[chat.lines.length - 1];
                if (data === undefined) return;
                if (vaxyyyBot.last_msg === data) return;
                vaxyyyBot.last_msg = data;

                emit.dispatchEvent(
                    new CustomEvent('istrolid-chat-message', {
                        detail: data
                    })
                );
            }
            vaxyyyBot.step++;
        } else {
            vaxyyyBot.step = 0;
        }
    },

    add_bot: function (bot) {
        vaxyyyBot.bots.push(bot);
    },

    clear_bots: function() {
        vaxyyyBot.bots = [];
    },
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
     * @param {object} location - location
     */
    set_fleet: async function (location) {
        location = check(Object, location);
        location = compare_obj(location, _fleet);

        commander.fleet.selection = location;
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

        mode = check(String, mode);
        network.send("configGame", {
            type: mode
        });
    },

    /**
     * Join side
     * 
     * @param {string} side - name of side to join | alpha, beta, spectators
     */
    join_side: function (side) {
        side = check(String, side);
        network.send("switchSide", side);
    },

    /**
     * Join server
     * 
     * @param {string} name - name of server to join
     */
    join_server: function (name) {
        name = check(String, name);
        battleMode.joinServer(name);
    },

    /**
     * Kick player
     * 
     * @param {number|string} player - player to kick
     * @param {string} type - number || name
     */
    kick_player: function (player, type) {
        if (!vaxyyyBot.host) throw new Error("not host");
        type = check(String, type);

        if (type === "number") {
            player = check(Number, player);

            return network.send("kickPlayer", player);
        } else if (type === "name") {
            player = check(String, player);

            let number, p;
            for (number in sim.players) {
                p = sim.players[number];
                if (p.name.toLowerCase() === player.toLowerCase()) return network.send("kickPlayer", number);
            }
            throw new Error(player + " : player not found");
        } else throw new Error("no player kicked");
    },

    /**
     * Add AI player
     * 
     * @param {string|object} fleet - fleet
     * @param {string} name - name for ai
     * @param {string} side - side to add to | alpha, beta
     * @param {string} type - name || location
     */
    add_ai: async function (fleet, name, side, type) {
        check_list([String, String, String], [name, side, type])

        let fleetAis, aiName, ref, row, tab, col, aiBuildBar;
        if (type === "location") {
            fleet = check(Object, fleet);

            fleet = compare_obj(fleet, _fleet);

            aiBuildBar = [];
            for (col = i = 0; i < 10; col = ++i) aiBuildBar.push(commander.fleet[getFleetKey(fleet.row, col, fleet.tab)]);
            network.send("addAi", name, side, aiBuildBar);
        } else if (type === "name") {
            fleet = check(String, fleet);

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
        }
    },

    /**
     * Copy Fleet
     * 
     * @param {object} from - location of fleet
     * @param {object} to - location to copy to
     */
    copy_fleet: async function (from, to) {
        let i, j, keyF, keyT;


        from = compare_obj(from, _fleet);
        to = compare_obj(to, _fleet);

        check_list([String, Number, String, Number], [from.tab, from.row, to.tab, to.row]);

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

var get = {
    /**
     * Gets name of fleet
     *
     * @param {object} location - location
     * @return {string} - fleet name
     */
    fleet_name: function (location) {
        check(Object, location);

        location = compare_obj(location, _fleet);

        return commander.fleet.ais[`${location.row},${location.tab}`];
    },

    /**
     * Gets location of fleet by name
     *
     * @param {string} name - fleet name
     * @return {object} - fleet location
     */
    fleet_location: function (name) {
        name = check(String, name);
        let fleet, fleet_name, ref;

        for (fleet in commander.fleet.ais) {
            fleet_name = commander.fleet.ais[fleet];
            if (fleet_name === name) {
                ref = fleet.split(",");
                return {
                    row: parseInt(ref[0]),
                    tab: ref[1]
                }
            }
        }
        throw new Error(name + " : fleet not found");
    },
}

var current = {
    /**
     * Gets name of the current fleet
     *
     * @return {string} - current fleet name
     */
    fleet_name: function () {
        location = commander.fleet.selection;
        return commander.fleet.ais[`${location.row},${location.tab}`];
    },

    /**
     * Gets location of the current fleet
     *
     * @return {object} - current fleet location
     */
    fleet_location: function () {
        return commander.fleet.selection;
    },
}