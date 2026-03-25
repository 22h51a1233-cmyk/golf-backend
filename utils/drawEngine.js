const User = require('../models/User');

const randomDraw = () => {
  const nums = new Set();
  while (nums.size < 5) nums.add(Math.floor(Math.random() * 45) + 1);
  return [...nums].sort((a, b) => a - b);
};

const algorithmicDraw = async () => {
  const users = await User.find({ 'subscription.status': 'active' }).select('scores');
  const freq = new Array(46).fill(0);
  users.forEach(u => u.scores.forEach(s => freq[s.score]++));
  const maxF = Math.max(...freq.slice(1)) || 1;
  const weights = freq.map((f, i) => i === 0 ? 0 : maxF - f + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const picked = new Set();
  let attempts = 0;
  while (picked.size < 5 && attempts < 1000) {
    attempts++;
    let r = Math.random() * total;
    for (let i = 1; i <= 45; i++) { r -= weights[i]; if (r <= 0) { picked.add(i); break; } }
  }
  // fill if needed
  while (picked.size < 5) picked.add(Math.floor(Math.random() * 45) + 1);
  return [...picked].sort((a, b) => a - b);
};

const calculatePrizePool = (revenue, rollover = 0) => {
  const base = revenue * 0.5; // 50% goes to prizes
  return {
    total: base + rollover,
    fiveMatch: base * 0.40 + rollover,
    fourMatch: base * 0.35,
    threeMatch: base * 0.25,
    jackpotRollover: rollover,
  };
};

const runDraw = async (draw, type = 'random') => {
  const winningNumbers = type === 'algorithmic' ? await algorithmicDraw() : randomDraw();
  const winSet = new Set(winningNumbers);

  const subscribers = await User.find({ 'subscription.status': 'active' }).select('scores name email');
  const five = [], four = [], three = [];

  subscribers.forEach(u => {
    if (!u.scores?.length) return;
    const matches = u.scores.filter(s => winSet.has(s.score)).length;
    if (matches === 5) five.push(u);
    else if (matches === 4) four.push(u);
    else if (matches === 3) three.push(u);
  });

  const pool = draw.prizePool;
  const winners = [];

  const addW = (users, matchType, poolAmt) => {
    if (!users.length) return;
    const prize = poolAmt / users.length;
    users.forEach(u => winners.push({
      userId: u._id,
      matchType,
      matchedNumbers: u.scores.map(s => s.score).filter(n => winSet.has(n)),
      prizeAmount: prize,
      verificationStatus: 'pending',
      paymentStatus: 'pending',
    }));
  };

  addW(five, 'five_match', pool.fiveMatch);
  addW(four, 'four_match', pool.fourMatch);
  addW(three, 'three_match', pool.threeMatch);

  return {
    winningNumbers,
    winners,
    jackpotRolledOver: five.length === 0,
    rolledOverAmount: five.length === 0 ? pool.fiveMatch : 0,
    stats: { fiveMatchCount: five.length, fourMatchCount: four.length, threeMatchCount: three.length, totalParticipants: subscribers.length },
  };
};

module.exports = { randomDraw, algorithmicDraw, calculatePrizePool, runDraw };
