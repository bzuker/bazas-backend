const { BazasEngine } = require("../BazasEngine/BazasEngine");
const waitSeconds = s => new Promise(res => setTimeout(res, s * 1000));

class Room {
  constructor(io, id, settings) {
    this.id = id;
    this.io = io;
    this.room = io.of(`/${id}`);
    this.bazas = new BazasEngine(settings);
    this.participants = [];
    this.started = false;

    this.addEventListeners();
  }

  static createRoom(io, settings = null) {
    const id = Room.createId();
    return new Room(io, id, settings);
  }

  static createId() {
    let result = "";
    let characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i <= 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }

  getRoomInfo() {
    return {
      started: this.started,
      players: this.bazas.getPlayers(),
      currentRound: this.bazas.currentRound
    };
  }

  onAddPlayer(socket) {
    socket.on("add player", (name, pwd) => {
      const participant = this.participants.find(x => x.pwd === pwd && x.player.name === name);
      if (this.started && !participant) {
        socket.emit("not joined");
        return;
      }

      let player;
      // Participant is reconnecting
      if (participant) {
        participant.socket = socket;
        player = participant.player;
        socket.emit('cards', player.hand);
      } else {
        console.log("Adding player", name);
        player = this.bazas.addPlayer(name);
        this.participants.push({ socket, player, pwd });
  
        // Tell everyone that someone joined
        socket.broadcast.emit("join", player);
      }

      // Give the user the room info
      socket.emit("login", player, this.getRoomInfo());
    });
  }

  onStartGame(socket) {
    socket.on("start game", () => {
      console.log("Starting game...");
      this.started = true;
      this.bazas.startGame();
      this.participants.forEach(x => x.socket.emit("cards", x.player.hand));
      this.room.emit("game started", this.getRoomInfo());
    });
  }

  onPlayCard(socket) {
    socket.on("play card", async (playerId, card) => {
      try {
        const winner = this.bazas.playCard(playerId, card);
        const player = this.bazas.players.find(x => x.id === playerId);
        // Send everyone the new info
        this.room.emit("next", this.getRoomInfo());
        
        // Remove the card from the player
        socket.emit("cards", player.hand);

        // If there was a winner, we wait 5 seconds and continue
        if (winner) {
          const nextRound = this.bazas.endCircle();
          await waitSeconds(5);
          this.room.emit("next", this.getRoomInfo());

          if (nextRound === 'GAME OVER') {
            this.room.emit('game over', this.bazas.getScoreTable());
          }

          if (nextRound) {
            this.participants.forEach(x =>
              x.socket.emit("cards", x.player.hand)
            );
          }
        }
      } catch (error) {
        console.log("Invalid card played", error);
        socket.emit("invalid card", error);
      }
    });
  }

  onBazaRequest(socket) {
    socket.on("request bazas", (playerId, bazas) => {
      try {
        this.bazas.requestBazas(playerId, bazas);
        this.room.emit("next", this.getRoomInfo());
      } catch (error) {
        socket.emit("invalid request");
      }
    });
  }

  addEventListeners() {
    this.room.on("connection", socket => {
      console.log(`Connected to room ${this.id}. SocketID: ${socket.id}.`);

      this.onAddPlayer(socket);
      this.onStartGame(socket);
      this.onPlayCard(socket);
      this.onBazaRequest(socket);

      socket.on("disconnect", () => {
        console.info(`${socket.id} disconnected from room ${this.id}`);
      });
    });
  }
}

module.exports = Room;
