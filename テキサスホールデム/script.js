
const suits = ["spade", "heart", "diamond", "club"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
let deck = [];

function createDeck() {
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ value, suit });
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function deal() {
    createDeck();
    shuffleDeck();

    // 各プレイヤーに2枚ずつ配る
    for (let i = 0; i < 6; i++) {
        const playerDiv = document.getElementById("player" + i);
        playerDiv.innerHTML = '<div class="hand">' +
            createCardImg(deck.pop()) +
            createCardImg(deck.pop()) +
            '</div><div>Player ' + (i === 0 ? 'YOU' : i) + '</div>';
    }

    // コミュニティカードを5枚表示
    const communityDiv = document.getElementById("communityCards");
    communityDiv.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        communityDiv.innerHTML += createCardImg(deck.pop());
    }
}

function createCardImg(card) {
    let fileName = card.value + "_of_" + card.suit + ".png";
    return '<img src="images/' + fileName + '" alt="' + card.value + ' of ' + card.suit + '">';
}
