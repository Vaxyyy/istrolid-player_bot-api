vaxyyyBot.clear_bots();

//memory.root_load();

vaxyyyBot.add_bot({
    name: "josh", // this is josh bot :)
    start: async function () {
        let i, obj, winrate = await istroStats_api.GET(`winrate/?name=${commander.name}`);

        for (i in winrate) {
            obj = winrate[i];
            memory.write(["games", "total"], "add", obj.games);
            memory.write(["games", i, "wins"], "set", obj.wins);
            memory.write(["games", i, "loss"], "set", obj.games - obj.wins);
        }
    },
    join: async function () {
        if (battleMode.serverName === "Istroverse (KevX)") {
            memory.write(["istroverse", "alliances", "joined"], "set", false);
            memory.write(["istroverse", "alliances", "name"], "set", "");
            order.send_message("!alliance");
        }
    },
    message: async function (data) {
        let {
            text,
            name,
            channel,
            color
        } = data,
        name_lower = name.toLowerCase(),
            args = text.split(" "),
            command = args[0].toLowerCase(),
            playing = commander.side === "spectators" ? false : true,
            server = battleMode.server === undefined ? false : true,
            local = intp.local,
            alliances = {
                name: "",
                joined: false
            };
        args.splice(0, 1);

        if (server && !local) {
            if (name === "Server") {
                if (playing) {
                    if (text === "Game is about to start!") {
                        order.send_message("glhf");
                    } else if (text.includes("has won")) {
                        let win_or_loss = text.includes(commander.side) ? "win" : "loss";
                        order.send_message("ggwp");
                        memory.write(["games", "total"], "add", 1);
                        memory.write(["games", sim.serverType, win_or_loss], "add", 1);
                    } else if (text === "Game ends in a draw!") {
                        order.send_message("wp");
                    } else if (text.includes("does not have enough players.")) {
                        order.send_message("uh...");
                    }
                    /*
                    else if (text.includes("surrenders")) {
                        order.send_message("ggwp");
                    }
                    */
                    if (battleMode.serverName === "Istroverse (KevX)") {
                        if (this.memory.istroverse.alliances.joined) {
                            let alliance_name = this.memory.istroverse.alliances.name
                            if (text.includes("has created")) {
                                order.send_message("A rivalry alliance");
                            } else if (text.includes(`${commander.name} has been invited to`)) {
                                if (args[4] === alliance_name) {
                                    order.send_message(`Im already in your alliance`);
                                } else {
                                    order.send_message(`Sorry im in the "${alliance_name}" alliance`);
                                }
                            } else if (text.includes(`${commander.name} has been kicked from ${alliance_name}`)) {
                                memory.write(["istroverse", "alliances", "joined"], "set", false);
                                memory.write(["istroverse", "alliances", "name"], "set", "");
                                order.send_message("Cya, thanks for having me");
                            } else if (text.includes(`has disbanded ${alliance_name}`)) {
                                memory.write(["istroverse", "alliances", "joined"], "set", false);
                                memory.write(["istroverse", "alliances", "name"], "set", "");
                                order.send_message("Bye alliance");
                            }
                        } else {
                            if (text.includes(`${commander.name}, your alliance is`)) {
                                console.log(text, args, args[4]);
                                memory.write(["istroverse", "alliances", "joined"], "set", true);
                                memory.write(["istroverse", "alliances", "name"], "set", args[3]);
                                order.send_message("Oh, forgot I was in an alliance");
                            }
                            if (text.includes("has created")) {
                                order.send_message("new clan, nice");
                            } else if (text.includes(`${commander.name} has been invited to`)) {
                                memory.write(["istroverse", "alliances", "joined"], "set", true);
                                memory.write(["istroverse", "alliances", "name"], "set", args[4]);
                                order.send_message("Ok, i will join :)");
                                order.send_message("!join " + alliance_name);
                            }
                        }
                    }
                }
                if (text.includes(`kicked ${commander.name}`)) {
                    order.send_message("cya");
                }

            } else if (name === commander.name) {

            } else {
                // ["hi", "hey", "hello", "Hi there!", "Howdy"],
                //if (test.includes())
            }
        }
    },
    run: async function () {}
});

vaxyyyBot.enabled = true;
