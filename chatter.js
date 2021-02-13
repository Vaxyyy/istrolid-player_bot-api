vaxyyyBot.clear_bots();

vaxyyyBot.add_bot({
    name: "chatter",
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
            local = intp.local;
            args.splice(0, 1);

        if (server && !local) {
            if (name === "Server") {
                if (playing) {
                    if (text === "Game is about to start!") {
                        order.send_message("glhf");
                    } else if (text.includes("has won")) {
                        order.send_message("ggwp");
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
                }
                if (text.includes(`kicked ${commander.name}`)) {
                    order.send_message("cya");
                }

            }
        }
    },
    run: function () {
    },
});

vaxyyyBot.enabled = true;