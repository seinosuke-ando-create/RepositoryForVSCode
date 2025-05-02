
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
    displayHandsWithRanks(players, communityCards); // ←これ！

}

function createCardImg(card) {
    let fileName = card.value + "_of_" + card.suit + ".png";
    return '<img src="images/' + fileName + '" alt="' + card.value + ' of ' + card.suit + '">';
}
function displayHandsWithRanks(players, communityCards) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = ''; // 前回の結果をクリア

    players.forEach((player, index) => {
        const combined = [...player.hand, ...communityCards];
        const bestHand = evaluateBestHand(combined);
        const handText = bestHand.name + '（' + bestHand.values.join(', ') + '）';

        const playerResult = document.createElement('div');
        playerResult.className = 'player-result';
        playerResult.innerText = `プレイヤー${index + 1}：${handText}`;
        resultsDiv.appendChild(playerResult);
    });
    // 役名とランク（強い順）
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

// 7枚の中から最強の5枚を選ぶ
function evaluateBestHand(cards) {
    const allCombos = getAllFiveCardCombos(cards);
    let bestHand = null;

    for (const combo of allCombos) {
        const hand = evaluateFiveCards(combo);
        if (!bestHand || isHandStronger(hand, bestHand)) {
            bestHand = hand;
        }
    }
    return bestHand;
}

// 5枚で役を判定する
function evaluateFiveCards(cards) {
    const values = cards.map(c => valueToNumber(c.value)).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    const counts = {};
    for (const v of values) {
        counts[v] = (counts[v] || 0) + 1;
    }

    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = checkStraight(values);

    if (isFlush && isStraight && values.includes(14) && values.includes(10)) {
        return { name: "ロイヤルストレートフラッシュ", rank: HAND_RANKS["ロイヤルストレートフラッシュ"], values };
    }
    if (isFlush && isStraight) {
        return { name: "ストレートフラッシュ", rank: HAND_RANKS["ストレートフラッシュ"], values };
    }
    if (Object.values(counts).includes(4)) {
        const four = getKeyByValue(counts, 4);
        const kicker = values.filter(v => v !== four);
        return { name: "フォーカード", rank: HAND_RANKS["フォーカード"], values: [four, ...kicker] };
    }
    if (Object.values(counts).includes(3) && Object.values(counts).includes(2)) {
        const three = getKeyByValue(counts, 3);
        const two = getKeyByValue(counts, 2);
        return { name: "フルハウス", rank: HAND_RANKS["フルハウス"], values: [three, two] };
    }
    if (isFlush) {
        return { name: "フラッシュ", rank: HAND_RANKS["フラッシュ"], values };
    }
    if (isStraight) {
        return { name: "ストレート", rank: HAND_RANKS["ストレート"], values };
    }
    if (Object.values(counts).includes(3)) {
        const three = getKeyByValue(counts, 3);
        const kickers = values.filter(v => v !== three);
        return { name: "スリーカード", rank: HAND_RANKS["スリーカード"], values: [three, ...kickers] };
    }
    const pairs = Object.keys(counts).filter(k => counts[k] === 2).map(Number).sort((a, b) => b - a);
    if (pairs.length >= 2) {
        const kickers = values.filter(v => !pairs.includes(v));
        return { name: "ツーペア", rank: HAND_RANKS["ツーペア"], values: [...pairs, ...kickers] };
    }
    if (pairs.length === 1) {
        const kickers = values.filter(v => v !== pairs[0]);
        return { name: "ワンペア", rank: HAND_RANKS["ワンペア"], values: [pairs[0], ...kickers] };
    }
    return { name: "ハイカード", rank: HAND_RANKS["ハイカード"], values };
}

// 5枚の組み合わせ全部作る
function getAllFiveCardCombos(cards) {
    const results = [];
    const n = cards.length;
    function combine(start, combo) {
        if (combo.length === 5) {
            results.push(combo);
            return;
        }
        for (let i = start; i < n; i++) {
            combine(i + 1, combo.concat([cards[i]]));
        }
    }
    combine(0, []);
    return results;
}

// 役比較
function isHandStronger(hand1, hand2) {
    if (hand1.rank !== hand2.rank) {
        return hand1.rank > hand2.rank;
    }
    for (let i = 0; i < hand1.values.length; i++) {
        if ((hand1.values[i] || 0) > (hand2.values[i] || 0)) return true;
        if ((hand1.values[i] || 0) < (hand2.values[i] || 0)) return false;
    }
    return false;
}

// サポート
function valueToNumber(v) {
    if (v === "J") return 11;
    if (v === "Q") return 12;
    if (v === "K") return 13;
    if (v === "A") return 14;
    return parseInt(v, 10);
}
function checkStraight(values) {
    const set = [...new Set(values)];
    if (set.length < 5) return false;
    set.sort((a, b) => a - b);
    for (let i = 0; i <= set.length - 5; i++) {
        if (set[i] + 4 === set[i + 4]) return true;
    }
    // A2345チェック
    if (set.includes(14)) {
        const wheel = [2, 3, 4, 5];
        if (wheel.every(v => set.includes(v))) {
            return true;
        }
    }
    return false;
}
function getKeyByValue(obj, value) {
    return parseInt(Object.keys(obj).find(key => obj[key] === value));
}

}

