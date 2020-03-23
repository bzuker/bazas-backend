const uuid = require("uuid");

class Player {
  constructor(name) {
    this.id = uuid.v4();
    this.name = name;
    this.score = 0;
    this.hand = null;
    this.bazas = 0;
  }

  hasSuit(suit) {
    return this.hand.some(x => x.suit === suit);
  }

  playCard(card) {
    this.hand = this.hand.filter(x => x.key !== card.key);
  }

  setHand(cards) {
    this.hand = cards;
  }

  addPoints(points) {
    this.score += points;
  }

  addBaza() {
    this.bazas += 1;
  }

  resetBazas() {
    this.bazas = 0;
  }
}

module.exports = {
  Player
};
