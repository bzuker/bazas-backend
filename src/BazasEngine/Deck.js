const Deck = require("card-deck");

class Card {
  constructor(suit, display, value) {
    this.suit = suit;
    this.display = display;
    this.value = value;
    this.key = `${display !== "10" ? display : "0"}${suit
      .slice(0, 1)
      .toUpperCase()}`;
  }
}

const createDeck = () => {
  const types = [
    { display: "A", value: 100 },
    { display: "2", value: 2 },
    { display: "3", value: 3 },
    { display: "4", value: 4 },
    { display: "5", value: 5 },
    { display: "6", value: 6 },
    { display: "7", value: 7 },
    { display: "8", value: 8 },
    { display: "9", value: 9 },
    { display: "10", value: 10 },
    { display: "J", value: 97 },
    { display: "Q", value: 98 },
    { display: "K", value: 99 }
  ];
  const suites = ["heart", "club", "spade", "diamond"];
  const cards = suites
    .map(suit => types.map(type => new Card(suit, type.display, type.value)))
    .reduce((a, b) => a.concat(b), []);

  return new Deck(cards);
};

module.exports = {
  createDeck
};
