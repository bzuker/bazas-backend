const { Player } = require("./Player");
const { createDeck } = require("./Deck");
const defaultSettings = {
  initialCardAmount: 3,
  lastCardAmount: 8
};

class BazasEngine {
  constructor(settings = defaultSettings) {
    this.settings = settings;
    this.players = [];
    this.rounds = [];
    this.deck = createDeck();
    this.currentRound = {
      started: false,
      doneRequestingBazas: false,
      cards: this.settings.initialCardAmount,
      increasing: true,
      cardsRemaining: this.settings.initialCardAmount,
      triumphCard: null,
      firstCard: null,
      firstToPlay: null,
      nextToPlay: null,
      requestedBazas: [],
      playedCards: [],
      winners: [],
      winner: null
    };
  }

  startGame() {
    const firstPlayer = this.players[Math.floor(Math.random() * this.players.length)];
    this.currentRound = {
      started: true,
      doneRequestingBazas: false,
      cards: this.settings.initialCardAmount,
      increasing: true,
      cardsRemaining: this.settings.initialCardAmount,
      triumphCard: null,
      firstCard: null,
      firstToPlay: firstPlayer.id,
      nextToPlay: firstPlayer.id,
      requestedBazas: [],
      playedCards: [],
      winners: [],
      winner: null
    };

    this.deal();
  }

  deal() {
    this.deck.shuffle();
    for (const player of this.players) {
      const cards = this.deck.drawRandom(this.currentRound.cards);
      player.setHand(cards);
    }

    this.currentRound.triumphCard = this.deck.draw();
  }

  requestBazas(playerId, bazas) {
    const player = this.players.find(x => x.id === playerId);
    const hasAlreadyPlayed = this.currentRound.requestedBazas.find(
      x => x.playerId === playerId
    );

    if (hasAlreadyPlayed) {
      throw new Error(`Player ${player.name} has already played this round`);
    }

    if (this.currentRound.requestedBazas.length + 1 === this.players.length) {
      // TODO: Check that the amount of requested is != to cards dealt
      if (!this.isValidBazasRequest(parseInt(bazas, 10))) {
        throw new Error("Invalid bazas request");
      }
      console.log("Done requesting");
      this.currentRound.doneRequestingBazas = true;
    }

    this.currentRound.requestedBazas.push({
      playerId,
      bazas: parseInt(bazas, 10)
    });
    const nextPlayer = this.playerToTheRight(playerId);
    this.currentRound.nextToPlay = nextPlayer;
  }

  isValidBazasRequest(bazas) {
    const requested = this.currentRound.requestedBazas.reduce(
      (prev, curr) => prev + curr.bazas,
      0
    );
    return requested + bazas !== this.currentRound.cards;
  }

  playCard(playerId, card) {
    const player = this.players.find(x => x.id === playerId);
    const hasAlreadyPlayed = this.currentRound.playedCards.find(
      x => x.playerId === playerId
    );

    if (hasAlreadyPlayed) {
      throw new Error(`Player ${player.name} has already played this round`);
    }

    if (playerId !== this.currentRound.nextToPlay) {
      throw new Error(`It's not player ${player.name}'s turn.`);
    }

    if (this.currentRound.playedCards.length === 0) {
      this.currentRound.firstCard = card;
    } else {
      if (
        player.hasSuit(this.currentRound.firstCard.suit) &&
        card.suit !== this.currentRound.firstCard.suit
      ) {
        throw new Error("Invalid suit played");
      }
    }

    this.currentRound.playedCards.push({ playerId, card });
    player.playCard(card);

    // If the circle is not done yet, move to the right
    if (this.currentRound.playedCards.length !== this.players.length) {
      const nextPlayer = this.playerToTheRight(playerId);
      this.currentRound.nextToPlay = nextPlayer;
      return null;
    }

    const winner = this.getWinner(this.currentRound.playedCards);
    this.currentRound.winners.push(winner);
    this.currentRound.winner = winner;
    return winner;
  }

  endCircle() {
    const winner = this.getWinner(this.currentRound.playedCards);
    const player = this.players.find(x => x.id === winner);
    player.addBaza();
    this.currentRound.cardsRemaining--;
    this.currentRound.playedCards = [];
    this.currentRound.firstCard = null;
    this.currentRound.winner = null;

    if (this.currentRound.cardsRemaining > 0) {
      this.currentRound.nextToPlay = winner;
      return null;
    }

    return this.setNextRound();
  }

  getWinner(playedCards) {
    const triumphCards = playedCards.filter(
      x => x.card.suit === this.currentRound.triumphCard.suit
    );
    const biggestTriumph =
      triumphCards.length > 0 &&
      triumphCards.reduce((maxCard, playedCard) =>
        maxCard.card.value > playedCard.card.value ? maxCard : playedCard
      );

    if (biggestTriumph) {
      const player = this.players.find(x => x.id === biggestTriumph.playerId);
      return player.id;
    }

    const forcedCards = playedCards.filter(
      x => x.card.suit === this.currentRound.firstCard.suit
    );
    const biggestCard = forcedCards.reduce((maxCard, playedCard) =>
      maxCard.card.value > playedCard.card.value ? maxCard : playedCard
    );

    return biggestCard.playerId;
  }

  setNextRound() {
    this.storeRound();
    this.calculateScores();

    if (this.isGameOver()) {
      // TODO: store the game
      return 'GAME OVER';
    }

    this.players.forEach(x => x.resetBazas());
    const cards = this.currentRound.increasing
      ? this.currentRound.cards === this.settings.lastCardAmount ? this.currentRound.cards : this.currentRound.cards + 1
      : this.currentRound.cards - 1;
    const nextPlayer = this.playerToTheRight(this.currentRound.firstToPlay);
    this.currentRound = {
      started: true,
      doneRequestingBazas: false,
      cards,
      increasing:
        this.currentRound.increasing &&
        this.currentRound.cards < this.settings.lastCardAmount,
      cardsRemaining: cards,
      triumphCard: null,
      firstCard: null,
      firstToPlay: nextPlayer,
      nextToPlay: nextPlayer,
      requestedBazas: [],
      playedCards: [],
      winners: [],
      winner: null
    };

    this.deck = createDeck();
    this.deal();
    return this.currentRound;
  }

  storeRound() {
    this.rounds.push({
      cards: this.currentRound.cards,
      triumphCard: this.currentRound.triumphCard,
      firstToPlay: this.currentRound.firstToPlay,
      requestedBazas: this.currentRound.requestedBazas,
      playedCards: this.currentRound.playedCards,
      winners: this.currentRound.winners
    });
  }

  calculateScores() {
    for (const player of this.players) {
      const requested = this.currentRound.requestedBazas.find(
        x => x.playerId === player.id
      ).bazas;
      const won = this.currentRound.winners.filter(x => x === player.id).length;

      console.log(`player ${player.name} won ${won}, requested: ${requested}`);
      player.addPoints(requested === won ? 10 + won ** 2 : won);
    }
  }

  isGameOver() {
    return (
      !this.currentRound.increasing &&
      this.currentRound.cards === this.settings.initialCardAmount
    );
  }

  playerToTheRight(currentPlayerId) {
    const index = this.players.findIndex(x => x.id === currentPlayerId);
    const player =
      index + 1 === this.players.length
        ? this.players[0]
        : this.players[index + 1];
    return player.id;
  }

  addPlayer(name) {
    const player = new Player(name);
    this.players.push(player);
    return player;
  }

  getPlayers() {
    return this.players.map(x => {
      const requested = this.currentRound.requestedBazas.find(
        request => request.playerId === x.id
      );
      const playedCard = this.currentRound.playedCards.find(
        played => played.playerId === x.id
      );
      return {
        id: x.id,
        name: x.name,
        score: x.score,
        bazas: x.bazas,
        requested: requested ? requested.bazas : "-",
        playedCard: playedCard ? playedCard.card : null
      };
    });
  }

  getScoreTable() {
    return this.getPlayers().sort((a, b) => a.score - b.score);
  }
}

module.exports = {
  BazasEngine
};
