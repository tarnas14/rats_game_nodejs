# rats-game JS client

This is an example client for the rats-game, written in nodejs. It deals with
the minimal amount of work that needs to be done to communicate with the game server.
It contains examples of sending commands and retrieving game information from the server.

This implementation doesn't contain any sophisticated logic. You will have to
figure it out on your own.

# how to use

When started, the client will enter a game loop that will wait for its turn and
execute actions based on the game phase (more information in the game ruleset).

Install dependencies with `yarn` or `npm install`

Use `node . --help` in the root to see what arguments are needed to run the client.
To run the client you will use something like `node . -t 'YOUR_AUTH_TOKEN' -s '192.168.1.123:8880/'`
or your OS equivalent.
