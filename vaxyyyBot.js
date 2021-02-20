/*
 * This is an javascript player bot api for istrolid
 */

var hook = hook || {
    timer: setInterval(() => vaxyyyBot.tick(), 60)
};

let _fleet = {
    tab: null,
    row: null
};

//-----------------------------------------------------------------------------
// Controls, stores and runs the bots
/** @namespace */
var vaxyyyBot = vaxyyyBot || {

    bots: [],
    enabled: false,
    anti_afk: false, // dose what it says stops you from been afk or disconnecting
    reload: false,
    step: 0,
    messageQueue: [],
    last_msg: {},
    current_bot: {},
    self: {},
    last_server_name: "",

    tick: function () {
        let queue, i, bot, data;
        if (vaxyyyBot.enabled) {
            vaxyyyBot.self = commander;
            vaxyyyBot.step++;
            if (vaxyyyBot.step % 1152 === 0) { // 69,120 ticks
                if (vaxyyyBot.reload) order.join_server(battleMode.serverName);
                memory.root_save(); // saves memory
            } else if (vaxyyyBot.step % 17 === 0) { // 1,020 ticks
                queue = vaxyyyBot.messageQueue[0];
                if (queue) {
                    rootNet.send("message", {
                        text: queue.text,
                        channel: queue.channel
                    });
                    vaxyyyBot.messageQueue.shift();
                }
                if (vaxyyyBot.anti_afk) {
                    if (!rootNet && rootNet.websocket.readyState === WebSocket.CLOSED) rootNet.connect();
                    network.send(`mouseMove`, [0, 0], false);
                }

                if (vaxyyyBot.last_server_name !== battleMode.serverName) {
                    for (i = 0; i < vaxyyyBot.bots.length; i++) {
                        bot = vaxyyyBot.bots[i];
                        try {
                            setTimeout(() => { // just so has time to load in
                                if (bot && typeof bot.join === "function") {
                                    vaxyyyBot.current_bot = bot;
                                    bot.join();
                                }
                            }, 8000);
                        } catch (e) {
                            console.error(e.stack);
                        }
                    }
                    vaxyyyBot.last_server_name = battleMode.serverName;
                }
            } else if (vaxyyyBot.step % 8 === 0) { // 480 ticks
                for (i = 0; i < vaxyyyBot.bots.length; i++) {
                    bot = vaxyyyBot.bots[i];
                    try {
                        if (bot && typeof bot.run === "function") {
                            vaxyyyBot.current_bot = bot;
                            bot.run();
                        }
                        if (bot && typeof bot.message === "function") {
                            data = chat.lines[chat.lines.length - 1];
                            if (data === undefined) return;
                            if (vaxyyyBot.last_msg === data) return;
                            vaxyyyBot.last_msg = data;
                            vaxyyyBot.current_bot = bot;
                            bot.message(data);
                        }
                    } catch (e) {
                        console.error(e.stack);
                    }
                }
            }
        } else {
            vaxyyyBot.step = 0;
        }
    },

    add_bot: function (bot) {
        if (memory.data[bot.name] === undefined) memory.data[bot.name] = {};
        let data = Object.assign({
            memory: memory.data[bot.name],
            self: vaxyyyBot.self
        }, bot);
        try {
            if (bot && bot.start !== undefined && typeof bot.start === "function") {
                vaxyyyBot.current_bot = bot;
                bot.start = bot.start.bind(data);
                bot.start();
            }
        } catch (e) {
            console.error(e.stack);
        }

        if (bot.message) bot.message = bot.message.bind(data);
        if (bot.run) bot.run = bot.run.bind(data);
        if (bot.join) bot.join = bot.join.bind(data);

        vaxyyyBot.bots.push(bot);
    },

    clear_bots: function () {
        vaxyyyBot.bots = [];
    },
};

//-----------------------------------------------------------------------------
// Funtions that let your bot do stuff
/** @namespace */
var order = {
    /**
     * Sends a chat message
     *
     * @param {string} msg - message to send
     * @param {number} max - max lenght of character | max 300
     * @param {string} server - channel name to send message | lobbys server name
     */
    send_message: function (msg, max, server) {
        msg = check(String, msg);
        max = check(Number, max, 300);
        server = check(String, server, battleMode.serverName);

        vaxyyyBot.messageQueue.push({
            text: msg.substring(0, max),
            channel: server
        });
    },

    /**
     * Sets current fleet
     *
     * @warning this will save your istolid account
     * @param {object} path - path of fleet
     */
    set_fleet: async function (path) {
        path = check(Object, path);
        path = compare_obj(path, _fleet);

        commander.fleet.selection = path;
        account.rootSave();
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
    start_Game: function () {
        if (!vaxyyyBot.self.host) throw new Error("not host");

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
        if (!vaxyyyBot.self.host) throw new Error("not host");

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
        if (!vaxyyyBot.self.host) throw new Error("not host");
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
     * @param {string} type - name | path
     */
    add_ai: async function (fleet, name, side, type) {
        check_list([String, String, String], [name, side, type])
        let fleetAis, aiName, ref, row, tab, col, aiBuildBar;

        if (type === "path") {
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
     * @param {object} from - path of fleet
     * @param {object} to - path to copy to
     */
    copy_fleet: async function (from, to) {
        from = compare_obj(from, _fleet);
        to = compare_obj(to, _fleet);
        check_list([String, Number, String, Number], [from.tab, from.row, to.tab, to.row]);
        let i, j, keyF, keyT;

        for (i = j = 0; j < 10; i = ++j) {
            keyF = getFleetKey(from.row, i, from.tab);
            keyT = getFleetKey(to.row, i, to.tab);
            commander.fleet[keyT] = commander.fleet[keyF];
        }
        return commander.fleet.ais[getAIKey(to.row, to.tab)] = commander.fleet.ais[getAIKey(from.row, from.tab)];
    },

    /**
     * Copy Fleet
     * 
     * @param {object} from - path of fleet
     * @param {object} to - path to copy to
     * @param {boolean} copy - copy fleet true | false
     */
    move_fleet: function (from, to, copy) {
        from = compare_obj(from, _fleet);
        to = compare_obj(to, _fleet);
        check_list([String, Number, String, Number], [from.tab, from.row, to.tab, to.row]);
        if (!copy && from.row === to.row && from.tab === to.tab) return;
        check(Boolean, copy);
        let col, dir, empty, i, j, k, l, m, moving, n, ref, ref1, ref2, ref3, ref4, row, tab, v;

        if (get.is_empty_fleet(to.row, to.tab)) {
            this.copy_fleet(from, to);
            if (!copy) {
                delete commander.fleet.ais[getAIKey(from.row, from.tab)];
                for (i = j = 0; j < 10; i = ++j) {
                    commander.fleet[getFleetKey(from.row, i, from.tab)] = "";
                }
            }
        } else if (copy || from.tab !== to.tab) {
            if (from.tab === to.tab) {
                if (from.row >= to.row) {
                    from.row += 1;
                }
                if (to.row >= from.row) {
                    to.row += 1;
                }
            }
            empty = Math.max(from.row, to.row) + 1;
            ref = commander.fleet;
            for (k in ref) {
                v = ref[k];
                ref1 = fromFleetKey(k), row = ref1[0], col = ref1[1], tab = (ref2 = ref1[2]) != null ? ref2 : null;
                if (row === null || col === null) {
                    continue;
                }
                if (tab === to.tab) {
                    if (!isNaN(row) && row >= empty) {
                        if (get.is_empty_fleet(row, tab)) {
                            empty = +row;
                            break;
                        } else {
                            empty = +row + 1;
                        }
                    }
                }
            }
            this.insert_fleet({
                row: empty,
                tab: to.tab
            }, {
                row: to.row,
                tab: to.tab
            });
            this.insert_fleet(from, to, copy);
        } else {
            dir = Math.sign(to.row - from.row);
            moving = {
                name: commander.fleet.ais[getAIKey(from.row, from.tab)],
                specs: []
            };
            for (i = l = 0; l < 10; i = ++l) {
                moving.specs[i] = commander.fleet[getFleetKey(from.row, i, from.tab)];
            }
            for (i = m = ref3 = from.row + dir, ref4 = to.row; ref3 <= ref4 ? m <= ref4 : m >= ref4; i = ref3 <= ref4 ? ++m : --m) {
                this.copy_fleet({
                    row: i,
                    tab: from.tab
                }, {
                    row: i - dir,
                    tab: from.tab
                });
            }
            commander.fleet.ais[getAIKey(to.row, to.tab)] = moving.name;
            for (i = n = 0; n < 10; i = ++n) {
                commander.fleet[getFleetKey(to.row, i, to.tab)] = moving.specs[i];
            }
        }
        return control.savePlayer();
    },

    /**
     * deletes fleet 
     * 
     * @param {object} from - path of fleet
     * @param {object} to - path to copy to
     * @param {boolean} copy - copy fleet true | false
     */
    remove_fleet: function (path) {
        from = compare_obj(path, _fleet);
        check_list([String, Number], [path.tab, path.row]);
        let c, i, j, k, lastRow, r, ref, ref1, ref2, ref3, t, v, row = path.row,
            tab = path.tab;

        if (tab == null) {
            tab = null;
        }
        lastRow = row;
        ref = commander.fleet;
        for (k in ref) {
            v = ref[k];
            ref1 = fromFleetKey(k), r = ref1[0], c = ref1[1], t = ref1[2];
            if (r === null || c === null) {
                continue;
            }
            if (tab === t) {
                if (!isNaN(r) && +r > lastRow) {
                    lastRow = +r;
                }
            }
        }
        for (i = j = ref2 = row + 1, ref3 = lastRow + 1; ref2 <= ref3 ? j <= ref3 : j >= ref3; i = ref2 <= ref3 ? ++j : --j) {
            this.copy_fleet({
                row: i,
                tab: tab
            }, {
                row: i - 1,
                tab: tab
            });
        }
        if (commander.fleet.selection.row > row) {
            return commander.fleet.selection.row -= 1;
        }
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
};

//-----------------------------------------------------------------------------
// Funtions that let you check stuff for bot
/** @namespace */
var get = {
    /**
     * Gets name of fleet
     *
     * @param {object} path - fleet path
     * @return {string} - fleet name
     */
    fleet_path: function (path) {
        check(Object, path);
        path = compare_obj(path, _fleet);

        return commander.fleet.ais[getAIKey[path.row, path.tab]];
    },

    /**
     * Gets path of fleet by name
     *
     * @param {string} name - fleet name
     * @return {object} - fleet path
     */
    fleet_name: function (name) {
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

    /**
     * Gets servers
     *
     * @return {array} - of all servers connected to rootNet
     */
    all_servers: function () {
        let rst = [],
            server;
        for (server in rootNet.servers) {
            rst.push(rootNet.servers[server])
        }
        return rst;
    },

    /**
     * Gets servers
     *
     * @return {array} - of all players connected to rootNet
     */
    all_players: function () {
        let rst = [],
            s, server;
        for (s in rootNet.servers) {
            server = rootNet.servers[s]
            if (server.players !== null) {
                for (player of server.players) {
                    rst.push(player);
                }
            }
        }
        return rst;
    },

    /**
     * Gets player
     *
     * @param {string} name - player name
     * @return {object} - player
     */
    player: function (name) {
        name = check(String, name);
        let number, player;

        for (number in sim.players) {
            player = sim.players[number];
            if (player.name.toLowerCase() === name.toLowerCase()) return player;
        }
        throw new Error(name + " : player not found");
    },

    /**
     * Gets players
     *
     * @return {array} - players and ai players in current server
     */
    current_players: function () {
        let rst = [],
            player;
        for (player of intp.players) {
            rst.push(player);
        }
        return rst;
    },

    /**
     * Gets name of the current fleet
     *
     * @return {string} - current fleet name
     */
    current_fleet_name: function () {
        path = commander.fleet.selection;
        return commander.fleet.ais[`${path.row},${path.tab}`];
    },

    /**
     * Gets path of the current fleet
     *
     * @return {object} - current fleet path
     */
    current_fleet_path: function () {
        return commander.fleet.selection;
    },

    /**
     * checks if empty spec
     *
     * @param {any} spec - spec
     * @return {boolean}
     */
    is_empty_spec: function (spec) {
        let error;
        if (!spec) {
            return true;
        }
        try {
            spec = JSON.parse(spec);
        } catch (error) {
            return true;
        }
        if (spec.parts == null) {
            return true;
        }
        if (spec.parts.length === 0) {
            return true;
        }
        return false;
    },

    /**
     * checks if empty fleet
     *
     * @return {boolean}
     */
    is_empty_fleet: function (path) {
        from = compare_obj(path, _fleet);
        check_list([String, Number], [path.tab, path.row]);
        let i, j, row = path.row,
            tab = path.tab;

        if (commander.fleet.ais[getAIKey(row, tab)]) {
            return false;
        }
        for (i = j = 0; j < 10; i = ++j) {
            if (!get.is_empty_spec(commander.fleet[getFleetKey(row, i, tab)])) {
                return false;
            }
        }
        return true;
    }
};

//-----------------------------------------------------------------------------
// Funtions and storage for bots memory
/** @namespace */
var memory = {

    data: {},

    /**
     * Force saves all memory
     *
     * @warning this will save your istrolid account
     * @warning max 10 Megabytes of data
     */
    root_save: function () {
        if (new Blob([memory.data]).size > 9999999) throw new Error("data to big");
        else {
            commander.fleet.bot_memory = memory.data;
            account.rootSave();
        }
    },

    /**
     * Force loads all memory
     */
    root_load: function () {
        if (commander.fleet.bot_memory === undefined) throw new Error("no memory to load");
        memory.data = commander.fleet.bot_memory;
    },

    /**
     * write data to memory.data
     * 
     * @warning this will not save data to your istolid account 
     * 
     * @param {array} path - path eg ["games", "1v1", "loss"]
     * @param {string} type - add | subtract | set
     * @param {any} data - data to write
     */
    write: function (path, type, data) {
        check(Array, path);
        check(String, type);
        // create obj if doesn't exist & set obj to path
        let i, ele, obj = memory.data[vaxyyyBot.current_bot.name],
            lastPath = path[path.length - 1];
        for (i = 0; i < path.length - 1; i++) {
            ele = path[i];
            // if obj[ele] is not object (undefined or other primitives), make it one.
            // this overrides existing non object letiables
            if (typeof obj[ele] !== "object") obj[ele] = {};
            obj = obj[ele];
        }
        if (obj[lastPath] === undefined) obj[lastPath] = data;
        if (type === "add") {
            return obj[lastPath] += data;
        } else if (type === "subtract") {
            return obj[lastPath] -= data;
        } else if (type === "set") {
            return obj[lastPath] = data;
        } else if (type === "push") {
            if (Array.isArray(obj[lastPath])) {
                return obj[lastPath].push(data);
            } else throw new Error("can not push data");
        } else throw new Error("no valid type selected");
    },

    /**
     * read data from memory.data
     * 
     * // this might not bee the best thing to use becuse well
     * // you can just use this.memory.games.1v1.loss
     * 
     * @param {array} path - path eg ["games", "1v1", "loss"]
     * @return {any} - value
     */
    read: function (path) {
        check(Array, path);
        let i, ele, obj = memory.data[vaxyyyBot.current_bot.name],
            lastPath = path[path.length - 1];
        for (i = 0; i < path.length - 1; i++) {
            ele = path[i];
            obj = obj[ele];
        }
        if (!obj[lastPath]) throw new Error("no data to read");
        else return obj[lastPath];
    }
};

//-----------------------------------------------------------------------------
// IstroStats api Funtions

var istroStats_api = {
    /**
     * pull data from istrostats.r26.me
     * see https://github.com/Rio6/IstroStats/blob/master/README.md for use
     *
     * @param {string} data - api request
     * @return {object} - api response
     */
    GET: async function (data) {
        data = check(String, data);
        const res = await fetch(`http://istrostats.r26.me/api/${data}`).then(res => res.json());
        return await res;
    },
};

//-----------------------------------------------------------------------------
// Funtions that will check stuff for code

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

/**
 * compare two object
 * 
 * @param {array} obj - object to check
 * @param {array} need - object to compare
 */
function compare_obj(obj, need) {
    obj_length = Object.keys(obj).length;
    need_length = Object.keys(need).length;

    if (obj_length !== need_length) throw new Error(`need has ${need_length} values, but the obj has ${obj_length}`);

    for (let i in need) {
        if (!(i in obj)) throw new Error("Compare : Expecting " + i);
    }
    return obj;
};