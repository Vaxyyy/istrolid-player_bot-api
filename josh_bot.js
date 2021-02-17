vaxyyyBot.clear_bots();
memory.root_load();

vaxyyyBot.add_bot({
    name: "josh", // this is josh bot :)
    message: function (data) {
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
                        order.send_message("ggwp");
                        memory.write(["games", "total"], "add", 1);
                        if (text.includes(commander.side)) {
                            memory.write(["games", sim.serverType, "wins"], "add", 1);
                        } else {
                            memory.write(["games", sim.serverType, "loss"], "add", 1);
                        }
                    } else if (text === "Game ends in a draw!") {
                        order.send_message("wp");
                        memory.write(["games", "total"], "add", 1);
                        memory.write(["games", sim.serverType, "draw"], "add", 1);
                    } else if (text.includes("does not have enough players.")) {
                        order.send_message("uh...");
                    }
                    /*
                    else if (text.includes("surrenders")) {
                        order.send_message("ggwp");
                    }
                    */
                    if (battleMode.serverName === "Istroverse (KevX)") {
                        if (alliances.joined) {
                            if (text.includes("has created")) {
                                sendMessage("A rivalry alliance");
                            } else if (text.includes(`${commander.name} has been invited to`)) {
                                if (args[4] === alliances.name) {
                                    sendMessage(`Im already in your alliance`);
                                } else {
                                    sendMessage(`Sorry im in the "${alliances.name}" alliance`);
                                }
                            } else if (text.includes(`${commander.name} has been kicked from ${alliances.name}`)) {
                                alliances.joined = false;
                                alliances.name = "";
                                sendMessage("Cya, thanks for having me");
                            } else if (text.includes(`has disbanded ${alliances.name}`)) {
                                alliances.joined = false;
                                alliances.name = "";
                                sendMessage("Bye alliances");
                            }
                        } else {
                            if (text.includes("has created")) {
                                sendMessage("new clan, nice");
                            } else if (text.includes(`${commander.name} has been invited to`)) {
                                alliances.name = args[4];
                                alliances.joined = true;
                                sendMessage("Ok, i will join :)");
                                sendMessage("!join " + alliances.name);
                            }
                        }
                    }
                }
                if (text.includes(`kicked ${commander.name}`)) {
                    order.send_message("cya");
                }

            } else if (name === commander.name) {

            } else {
                
            }

            memory.root_save(); // 10/10 should not run this as like this big bad
        }
    },
    run: function () {},
});

vaxyyyBot.enabled = true;
