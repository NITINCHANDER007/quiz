const GameRoom = require('../models/GameRoom');

// In-memory registry of active game rooms
const activeRooms = new Map();

/**
 * Creates an in-memory game room instance
 */
function createMemoryRoom({ code, quizId, quizTitle, questions, adminSocketId }) {
  const room = {
    code,
    quizId,
    quizTitle,
    questions,
    adminSocketId,
    status: 'lobby', // 'lobby' | 'active' | 'revealed' | 'finished'
    currentQuestionIndex: -1,
    questionStartTime: null,
    questionDuration: 20, // 20 seconds server-authoritative
    timer: null,
    players: new Map(), // playerId -> player object
    answersByQuestion: new Map(), // questionIndex -> Map(playerId -> answer)
  };

  activeRooms.set(code, room);
  return room;
}

/**
 * Retrieves a room from memory by code
 */
function getRoomState(code) {
  if (!code) return null;
  return activeRooms.get(code.toUpperCase().trim());
}

/**
 * Removes a room from memory (e.g. after finish or teardown)
 */
function removeRoomState(code) {
  const room = getRoomState(code);
  if (room && room.timer) {
    clearTimeout(room.timer);
  }
  activeRooms.delete(code.toUpperCase().trim());
}

/**
 * Helper to get all player list array
 */
function getPlayersList(room) {
  return Array.from(room.players.values()).map(p => ({
    playerId: p.playerId,
    name: p.name,
    avatar: p.avatar,
    score: p.score,
    totalTime: Number(p.totalTime.toFixed(2)),
    correctCount: p.correctCount,
    connected: p.connected,
  }));
}

/**
 * Computes ranked leaderboard:
 * Highest score first; tie breaker: lowest totalTime.
 */
function getRankedLeaderboard(room, currentQuestionIndex = null) {
  const players = Array.from(room.players.values());

  const sorted = players.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.totalTime - b.totalTime;
  });

  return sorted.map((p, index) => {
    let lastAnswerCorrect = null;
    if (currentQuestionIndex !== null && room.answersByQuestion.has(currentQuestionIndex)) {
      const qAnswers = room.answersByQuestion.get(currentQuestionIndex);
      const playerAns = qAnswers.get(p.playerId);
      if (playerAns) {
        lastAnswerCorrect = playerAns.isCorrect;
      } else {
        lastAnswerCorrect = false;
      }
    }

    return {
      rank: index + 1,
      playerId: p.playerId,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      totalTime: Number(p.totalTime.toFixed(2)),
      correctCount: p.correctCount,
      connected: p.connected,
      lastAnswerCorrect,
    };
  });
}

/**
 * Computes distribution of answers for current question: { 0: countA, 1: countB, 2: countC, 3: countD }
 */
function getAnswerDistribution(room, questionIndex) {
  const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, unanswered: 0 };
  const answers = room.answersByQuestion.get(questionIndex);
  if (!answers) return distribution;

  for (const record of answers.values()) {
    if (record.selectedOption !== null && record.selectedOption !== undefined) {
      distribution[record.selectedOption] = (distribution[record.selectedOption] || 0) + 1;
    } else {
      distribution.unanswered = (distribution.unanswered || 0) + 1;
    }
  }

  return distribution;
}

/**
 * Persists in-memory room state into MongoDB GameRoom document
 */
async function persistRoomToDB(room) {
  try {
    const playersArray = Array.from(room.players.values()).map(p => ({
      playerId: p.playerId,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      totalTime: p.totalTime,
      correctCount: p.correctCount,
      connected: p.connected,
      socketId: p.socketId,
    }));

    const answersArray = [];
    for (const [qIdx, qMap] of room.answersByQuestion.entries()) {
      for (const ans of qMap.values()) {
        answersArray.push({
          playerId: ans.playerId,
          questionIndex: qIdx,
          selectedOption: ans.selectedOption,
          isCorrect: ans.isCorrect,
          timeTaken: ans.timeTaken,
          answeredAt: ans.answeredAt || new Date(),
        });
      }
    }

    await GameRoom.findOneAndUpdate(
      { code: room.code },
      {
        code: room.code,
        quizId: room.quizId,
        quizTitle: room.quizTitle,
        status: room.status,
        currentQuestionIndex: room.currentQuestionIndex,
        players: playersArray,
        answers: answersArray,
        ...(room.status === 'finished' ? { finishedAt: new Date() } : {}),
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`[DB] Error persisting room ${room.code} to MongoDB:`, err.message);
  }
}

module.exports = {
  activeRooms,
  createMemoryRoom,
  getRoomState,
  removeRoomState,
  getPlayersList,
  getRankedLeaderboard,
  getAnswerDistribution,
  persistRoomToDB,
};
