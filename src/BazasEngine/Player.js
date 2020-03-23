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
    const sorted = cards.sort((a, b) => {
      if (a.suit === b.suit) {
        return a.value - b.value;
      }

      return a.suit > b.suit ? 1 : -1;
    })
    this.hand = sorted;
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
