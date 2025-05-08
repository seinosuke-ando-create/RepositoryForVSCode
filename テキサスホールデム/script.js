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
const positions = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];

let deck = [];
let players = [];
let communityCards = [];
let revealedCount = 0;
let dealerIndex = 0; // 最初のBTNはplayer0

function getRotatedPositions(startIndex) {
    return positions.slice(startIndex).concat(positions.slice(0, startIndex));
}

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

function compareValues(vals1, vals2) {
    for (let i = 0; i < Math.max(vals1.length, vals2.length); i++) {
        const v1 = vals1[i] || 0;
        const v2 = vals2[i] || 0;
        if (v1 !== v2) return v1 - v2;
    }
    return 0;
}

function deal() {
    createDeck();
    shuffleDeck();
    players = [];
    communityCards = [];
    revealedCount = 0;
    dealerIndex = (dealerIndex + 1) % 6;
    const rotatedPositions = getRotatedPositions(dealerIndex);

    // プレイヤーに2枚ずつ配布
    for (let i = 0; i < 6; i++) {
        const card1 = deck.pop();
        const card2 = deck.pop();
        players.push({
            name: `Player ${i === 0 ? 'YOU' : i}`,
            hand: [card1, card2],
            chips: 100 // ← ここで初期チップを100に設定
        });
    
        const playerDiv = document.getElementById("player" + i);
        playerDiv.innerHTML = `
         <div class="hand">
           ${createCardImg(card1)}
           ${createCardImg(card2)}
         </div>
         <div>${rotatedPositions[i]} Player${i === 0 ? 'YOU' : i}</div> <div class="chips">チップ: ${players[i].chips} BB</div> <div class="rank"></div>
       `;
    }

    // コミュニティカード（伏せた状態）
    for (let i = 0; i < 5; i++) {
        communityCards.push(deck.pop());
    }

    const communityDiv = document.getElementById("communityCards");
    communityDiv.innerHTML = `<div id="card0"></div><div id="card1"></div><div id="card2"></div><div id="card3"></div><div id="card4"></div>`;

    document.getElementById("results").innerHTML = '';
}

// 3枚公開（フロップ）
function revealFlop() {
    if (revealedCount !== 0) return;
    for (let i = 0; i < 3; i++) {
        document.getElementById("card" + i).innerHTML = createCardImg(communityCards[i]);
    }
    revealedCount = 3;
}

// 1枚追加（ターン）
function revealTurn() {
    if (revealedCount !== 3) return;
    document.getElementById("card3").innerHTML = createCardImg(communityCards[3]);
    revealedCount = 4;
}

// さらに1枚追加（リバー）＋役判定
function revealRiver() {
    if (revealedCount !== 4) return;
    document.getElementById("card4").innerHTML = createCardImg(communityCards[4]);
    revealedCount = 5;

    // 役判定表示
    displayHandsWithRanks(players, communityCards);
}

function displayHandsWithRanks(players, communityCards) {
    const allEvaluated = players.map((player, index) => {
        const combined = [...player.hand, ...communityCards];
        const bestHand = evaluateBestHand(combined);
        return {
            index,
            rank: bestHand.rank,
            name: bestHand.name,
            values: bestHand.values
        };
    });

    // 勝者の特定
    allEvaluated.sort((a, b) => b.rank - a.rank || compareValues(b.values, a.values));
    const best = allEvaluated[0];
    const winners = allEvaluated.filter(p =>
        p.rank === best.rank && compareValues(p.values, best.values) === 0
    );

    // 勝者をコミュニティカード下に表示
    const resultText = winners.length === 1
        ? `勝者: プレイヤー${winners[0].index}（${winners[0].name}）`
        : `引き分け: ${winners.map(p => `プレイヤー${p.index}（${p.name}）`).join(', ')}`;
    document.getElementById("results").innerText = resultText;

    // 各プレイヤーの役を表示
    allEvaluated.forEach(player => {
        const playerDiv = document.getElementById("player" + player.index);
        const rankDiv = playerDiv.querySelector(".rank");
        if (rankDiv) {
            rankDiv.innerText = player.name;
        }
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
