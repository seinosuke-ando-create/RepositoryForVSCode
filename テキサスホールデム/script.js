// 定数
const suits = ["spade", "heart", "diamond", "club"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const HAND_RANKS = {
    "ロイヤルストレートフラッシュ": 9,
    "ストレートフラッシュ": 8,
    "フォーカード": 7,
    "フルハウス": 6,
    "フラッシュ": 5,
    "ストレート": 4,
    "スリーカード": 3,
    "ツーペア": 2,
    "ワンペア": 1,
    "ハイカード": 0
};

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

function createCardImg(card) {
    let fileName = card.value + "_of_" + card.suit + ".png";
    return '<img src="images/' + fileName + '" alt="' + card.value + ' of ' + card.suit + '">';
}

function deal() {
    createDeck();
    shuffleDeck();

    const players = [];
    for (let i = 0; i < 6; i++) {
        const hand = [deck.pop(), deck.pop()];
        const playerDiv = document.getElementById("player" + i);
        playerDiv.innerHTML = '<div class="hand">' +
            createCardImg(hand[0]) + createCardImg(hand[1]) +
            '</div><div>Player ' + (i === 0 ? 'YOU' : i) + '</div>';
        players.push({ hand });
    }

    const communityCards = [];
    const communityDiv = document.getElementById("communityCards");
    communityDiv.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        const card = deck.pop();
        communityCards.push(card);
        communityDiv.innerHTML += createCardImg(card);
    }

    displayHandsWithRanks(players, communityCards);
}

function displayHandsWithRanks(players, communityCards) {
    players.forEach((player, index) => {
        const combined = [...player.hand, ...communityCards];
        const bestHand = evaluateBestHand(combined);
        const handText = bestHand.name + '（' + bestHand.values.join(', ') + '）';

        const playerDiv = document.getElementById("player" + index);

        // 既存内容のまま上書きせず、下に役だけ追加表示
        let rankDiv = playerDiv.querySelector(".rank");
        if (!rankDiv) {
            rankDiv = document.createElement('div');
            rankDiv.className = 'rank';
            rankDiv.style.marginTop = '5px';
            rankDiv.style.fontSize = '14px';
            rankDiv.style.color = 'white';
            playerDiv.appendChild(rankDiv);
        }
        rankDiv.innerText = handText;
    });
}

function evaluateBestHand(cards) {
    const allCombos = getAllFiveCardCombos(cards);
    let best = null;

    for (const combo of allCombos) {
        const hand = evaluateFiveCards(combo);
        if (!best || isHandStronger(hand, best)) {
            best = hand;
        }
    }
    return best;
}

function getAllFiveCardCombos(cards) {
    const results = [];
    function combine(start, combo) {
        if (combo.length === 5) {
            results.push(combo);
            return;
        }
        for (let i = start; i < cards.length; i++) {
            combine(i + 1, combo.concat(cards[i]));
        }
    }
    combine(0, []);
    return results;
}

function evaluateFiveCards(cards) {
    const vals = cards.map(c => valueToNumber(c.value)).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    const counts = {};
    for (let val of vals) counts[val] = (counts[val] || 0) + 1;

    const flushSuit = suits.find(s => suits.filter(x => x === s).length >= 5);
    const flushCards = flushSuit ? cards.filter(c => c.suit === flushSuit).sort((a, b) => valueToNumber(b.value) - valueToNumber(a.value)) : [];

    const uniqueVals = [...new Set(vals)].sort((a, b) => b - a);
    const straightHigh = getStraightHigh(uniqueVals);

    if (flushCards.length >= 5) {
        const flushVals = flushCards.map(c => valueToNumber(c.value));
        const flushUnique = [...new Set(flushVals)];
        const flushStraight = getStraightHigh(flushUnique);
        if (flushStraight === 14) return { name: "ロイヤルストレートフラッシュ", rank: HAND_RANKS["ロイヤルストレートフラッシュ"], values: [14, 13, 12, 11, 10] };
        if (flushStraight) return { name: "ストレートフラッシュ", rank: HAND_RANKS["ストレートフラッシュ"], values: [flushStraight, flushStraight - 1, flushStraight - 2, flushStraight - 3, flushStraight - 4] };
    }

    const four = getKeyByValue(counts, 4);
    if (four) {
        const kicker = vals.filter(v => v !== four);
        return { name: "フォーカード", rank: HAND_RANKS["フォーカード"], values: [four, ...kicker.slice(0, 1)] };
    }

    const three = getKeyByValue(counts, 3);
    const pair = getKeyByValue(counts, 2);
    if (three && pair) return { name: "フルハウス", rank: HAND_RANKS["フルハウス"], values: [three, pair] };

    if (flushCards.length >= 5) return { name: "フラッシュ", rank: HAND_RANKS["フラッシュ"], values: flushCards.map(c => valueToNumber(c.value)).slice(0, 5) };
    if (straightHigh) return { name: "ストレート", rank: HAND_RANKS["ストレート"], values: [straightHigh, straightHigh - 1, straightHigh - 2, straightHigh - 3, straightHigh - 4] };

    if (three) {
        const kickers = vals.filter(v => v !== three);
        return { name: "スリーカード", rank: HAND_RANKS["スリーカード"], values: [three, ...kickers.slice(0, 2)] };
    }

    const allPairs = Object.keys(counts).filter(k => counts[k] === 2).map(Number).sort((a, b) => b - a);
    if (allPairs.length >= 2) {
        const kickers = vals.filter(v => !allPairs.includes(v));
        return { name: "ツーペア", rank: HAND_RANKS["ツーペア"], values: [allPairs[0], allPairs[1], ...kickers.slice(0, 1)] };
    }
    if (allPairs.length === 1) {
        const kickers = vals.filter(v => v !== allPairs[0]);
        return { name: "ワンペア", rank: HAND_RANKS["ワンペア"], values: [allPairs[0], ...kickers.slice(0, 3)] };
    }

    return { name: "ハイカード", rank: HAND_RANKS["ハイカード"], values: vals.slice(0, 5) };
}

function isHandStronger(h1, h2) {
    if (h1.rank !== h2.rank) return h1.rank > h2.rank;
    for (let i = 0; i < h1.values.length; i++) {
        if ((h1.values[i] || 0) > (h2.values[i] || 0)) return true;
        if ((h1.values[i] || 0) < (h2.values[i] || 0)) return false;
    }
    return false;
}

function valueToNumber(v) {
    if (v === "J") return 11;
    if (v === "Q") return 12;
    if (v === "K") return 13;
    if (v === "A") return 14;
    return parseInt(v);
}

function getKeyByValue(obj, target) {
    const keys = Object.keys(obj).filter(k => obj[k] === target).map(Number);
    if (keys.length === 0) return null;
    return Math.max(...keys);
}

function getStraightHigh(vals) {
    for (let i = 0; i <= vals.length - 5; i++) {
        let isStraight = true;
        for (let j = 1; j < 5; j++) {
            if (vals[i + j - 1] - 1 !== vals[i + j]) {
                isStraight = false;
                break;
            }
        }
        if (isStraight) return vals[i];
    }
    if (vals.includes(14) && vals.includes(2) && vals.includes(3) && vals.includes(4) && vals.includes(5)) {
        return 5;
    }
    return null;
}
