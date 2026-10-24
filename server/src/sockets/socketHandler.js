const crypto = require('crypto');
const Quiz = require('../models/Quiz');
const { verifyTokenDirect } = require('../middleware/auth');
const { assignUniqueAvatar } = require('../utils/avatars');
const { generateRoomCode } = require('../utils/codeGenerator');
const {
  createMemoryRoom,
  getRoomState,
  removeRoomState,
  getPlayersList,
  getRankedLeaderboard,
  getAnswerDistribution,
  persistRoomToDB,
} = require('./gameState');

function setupSocketHandlers(io) {
  // Middleware to detect admin token if provided in socket handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      const decoded = verifyTokenDirect(token);
      if (decoded) {
        socket.isAdmin = true;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // -------------------------------------------------------------
    // 1. ADMIN: CREATE GAME ROOM
    // -------------------------------------------------------------
    socket.on('admin:createRoom', async (payload, callback = () => {}) => {
      try {
        // Verify admin permissions
        const token = payload?.token || socket.handshake.auth?.token;
        const decoded = verifyTokenDirect(token);
        if (!socket.isAdmin && !decoded) {
          return callback({ success: false, message: 'Unauthorized: Admin token required' });
        }
        socket.isAdmin = true;

        const { quizId } = payload;
        if (!quizId) {
          return callback({ success: false, message: 'quizId is required' });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return callback({ success: false, message: 'Selected quiz not found in database' });
        }

        if (!quiz.questions || quiz.questions.length === 0) {
          return callback({ success: false, message: 'Quiz has no questions' });
        }

        // Generate unique 6-char room code
        let roomCode = generateRoomCode();
        while (getRoomState(roomCode)) {
          roomCode = generateRoomCode();
        }

        const room = createMemoryRoom({
          code: roomCode,
          quizId: quiz._id,
          quizTitle: quiz.title,
          questions: quiz.questions,
          adminSocketId: socket.id,
        });

        // Save initial state to MongoDB
        await persistRoomToDB(room);

        socket.roomCode = roomCode;
        socket.join(roomCode);

        console.log(`[GameRoom Created] Code: ${roomCode} | Quiz: "${quiz.title}" (${quiz.questions.length} Qs)`);

        const responseData = {
          success: true,
          roomCode,
          quizTitle: quiz.title,
          totalQuestions: quiz.questions.length,
        };

        callback(responseData);
        socket.emit('admin:roomCreated', responseData);
      } catch (err) {
        console.error('[admin:createRoom] Error:', err);
        callback({ success: false, message: 'Failed to create game room: ' + err.message });
      }
    });

    // -------------------------------------------------------------
    // 2. PLAYER: JOIN ROOM
    // -------------------------------------------------------------
    socket.on('player:join', (payload, callback = () => {}) => {
      try {
        const { roomCode, name } = payload || {};
        if (!roomCode || !name) {
          return callback({ success: false, message: 'Room code and player name are required' });
        }

        const cleanCode = roomCode.toUpperCase().trim();
        const trimmedName = name.trim();

        if (trimmedName.length < 1 || trimmedName.length > 25) {
          return callback({ success: false, message: 'Player name must be between 1 and 25 characters' });
        }

        const room = getRoomState(cleanCode);
        if (!room) {
          return callback({ success: false, message: 'Game room not found. Please verify the code.' });
        }

        if (room.status !== 'lobby') {
          return callback({ success: false, message: 'This game has already started and cannot accept new players.' });
        }

        // Check for duplicate player name (case-insensitive)
        const nameTaken = Array.from(room.players.values()).some(
          p => p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (nameTaken) {
          return callback({ success: false, message: `The name "${trimmedName}" is already taken in this room. Please choose another!` });
        }

        // Assign unique avatar not currently in use
        const usedAvatars = Array.from(room.players.values()).map(p => p.avatar);
        const avatar = assignUniqueAvatar(usedAvatars);

        const playerId = crypto.randomUUID ? crypto.randomUUID() : `p_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const playerObj = {
          playerId,
          name: trimmedName,
          avatar,
          score: 0,
          totalTime: 0,
          correctCount: 0,
          connected: true,
          socketId: socket.id,
        };

        room.players.set(playerId, playerObj);

        // Track metadata on socket
        socket.roomCode = cleanCode;
        socket.playerId = playerId;
        socket.join(cleanCode);

        console.log(`[Player Joined] Room: ${cleanCode} | Player: ${trimmedName} (${avatar})`);

        const responsePayload = {
          success: true,
          playerId,
          roomCode: cleanCode,
          name: trimmedName,
          avatar,
          quizTitle: room.quizTitle,
        };

        callback(responsePayload);

        // Notify entire room (host + players)
        io.to(cleanCode).emit('room:playersUpdate', getPlayersList(room));
      } catch (err) {
        console.error('[player:join] Error:', err);
        callback({ success: false, message: 'Error joining room: ' + err.message });
      }
    });

    // -------------------------------------------------------------
    // 3. PLAYER: RECONNECT
    // -------------------------------------------------------------
    socket.on('player:reconnect', (payload, callback = () => {}) => {
      try {
        const { roomCode, playerId } = payload || {};
        if (!roomCode || !playerId) {
          return callback({ success: false, message: 'Missing roomCode or playerId' });
        }

        const cleanCode = roomCode.toUpperCase().trim();
        const room = getRoomState(cleanCode);

        if (!room) {
          return callback({ success: false, message: 'Room is no longer active' });
        }

        const player = room.players.get(playerId);
        if (!player) {
          return callback({ success: false, message: 'Player record not found in this room' });
        }

        // Restore connection
        player.connected = true;
        player.socketId = socket.id;

        socket.roomCode = cleanCode;
        socket.playerId = playerId;
        socket.join(cleanCode);

        // Prepare current snapshot for reconnected player
        const currentQIndex = room.currentQuestionIndex;
        let questionData = null;
        let hasAnswered = false;
        let selectedOption = null;
        let revealData = null;
        let remainingSeconds = 0;

        if (room.status === 'active' && currentQIndex >= 0) {
          const q = room.questions[currentQIndex];
          const elapsed = (Date.now() - room.questionStartTime) / 1000;
          remainingSeconds = Math.max(0, Math.ceil(room.questionDuration - elapsed));

          const qAnswers = room.answersByQuestion.get(currentQIndex);
          if (qAnswers && qAnswers.has(playerId)) {
            hasAnswered = true;
            selectedOption = qAnswers.get(playerId).selectedOption;
          }

          questionData = {
            questionIndex: currentQIndex,
            totalQuestions: room.questions.length,
            text: q.text,
            options: q.options,
            duration: remainingSeconds,
          };
        } else if (room.status === 'revealed' && currentQIndex >= 0) {
          const q = room.questions[currentQIndex];
          const qAnswers = room.answersByQuestion.get(currentQIndex);
          const ans = qAnswers ? qAnswers.get(playerId) : null;
          const leaderboard = getRankedLeaderboard(room, currentQIndex);
          const rankObj = leaderboard.find(l => l.playerId === playerId);

          revealData = {
            questionIndex: currentQIndex,
            correctIndex: q.correctIndex,
            selectedOption: ans ? ans.selectedOption : null,
            isCorrect: ans ? ans.isCorrect : false,
            timeTaken: ans ? ans.timeTaken : 20,
            currentScore: player.score,
            currentRank: rankObj ? rankObj.rank : null,
            totalPlayers: room.players.size,
          };
        }

        const snapshot = {
          success: true,
          roomCode: cleanCode,
          status: room.status,
          quizTitle: room.quizTitle,
          player: {
            playerId: player.playerId,
            name: player.name,
            avatar: player.avatar,
            score: player.score,
            totalTime: Number(player.totalTime.toFixed(2)),
          },
          currentQuestionIndex: currentQIndex,
          totalQuestions: room.questions.length,
          questionData,
          hasAnswered,
          selectedOption,
          revealData,
          remainingSeconds,
        };

        callback(snapshot);

        // Update player list in room
        io.to(cleanCode).emit('room:playersUpdate', getPlayersList(room));
      } catch (err) {
        console.error('[player:reconnect] Error:', err);
        callback({ success: false, message: 'Reconnection failed: ' + err.message });
      }
    });

    // -------------------------------------------------------------
    // 4. ADMIN: START GAME
    // -------------------------------------------------------------
    socket.on('admin:startGame', (payload, callback = () => {}) => {
      try {
        const { roomCode } = payload || {};
        const cleanCode = (roomCode || socket.roomCode || '').toUpperCase().trim();
        const room = getRoomState(cleanCode);

        if (!room) {
          return callback({ success: false, message: 'Room not found' });
        }

        if (room.adminSocketId !== socket.id && !socket.isAdmin) {
          return callback({ success: false, message: 'Only the host can start the quiz' });
        }

        if (room.players.size === 0) {
          return callback({ success: false, message: 'Cannot start quiz with 0 players!' });
        }

        room.status = 'active';
        room.startedAt = new Date();

        io.to(cleanCode).emit('room:gameStarted', {
          roomCode: cleanCode,
          totalQuestions: room.questions.length,
          totalPlayers: room.players.size,
        });

        callback({ success: true, message: 'Quiz started' });
      } catch (err) {
        console.error('[admin:startGame] Error:', err);
        callback({ success: false, message: err.message });
      }
    });

    // -------------------------------------------------------------
    // 5. ADMIN: SEND QUESTION
    // -------------------------------------------------------------
    socket.on('admin:sendQuestion', (payload, callback = () => {}) => {
      try {
        const { roomCode } = payload || {};
        const cleanCode = (roomCode || socket.roomCode || '').toUpperCase().trim();
        const room = getRoomState(cleanCode);

        if (!room) {
          return callback({ success: false, message: 'Room not found' });
        }

        if (room.adminSocketId !== socket.id && !socket.isAdmin) {
          return callback({ success: false, message: 'Only the host can send questions' });
        }

        dispatchQuestion(io, room, callback);
      } catch (err) {
        console.error('[admin:sendQuestion] Error:', err);
        callback({ success: false, message: err.message });
      }
    });

    // -------------------------------------------------------------
    // 6. ADMIN: NEXT QUESTION
    // -------------------------------------------------------------
    socket.on('admin:nextQuestion', (payload, callback = () => {}) => {
      try {
        const { roomCode } = payload || {};
        const cleanCode = (roomCode || socket.roomCode || '').toUpperCase().trim();
        const room = getRoomState(cleanCode);

        if (!room) {
          return callback({ success: false, message: 'Room not found' });
        }

        if (room.adminSocketId !== socket.id && !socket.isAdmin) {
          return callback({ success: false, message: 'Only the host can advance questions' });
        }

        // If currently revealed or active, move to next
        if (room.currentQuestionIndex + 1 >= room.questions.length) {
          // Finished all 20 questions! Finish game
          finishGame(io, room);
          return callback({ success: true, finished: true });
        }

        dispatchQuestion(io, room, callback);
      } catch (err) {
        console.error('[admin:nextQuestion] Error:', err);
        callback({ success: false, message: err.message });
      }
    });

    // -------------------------------------------------------------
    // 7. PLAYER: SUBMIT ANSWER
    // -------------------------------------------------------------
    socket.on('player:answer', (payload, callback = () => {}) => {
      try {
        const { roomCode, playerId, questionIndex, selectedOption } = payload || {};
        const cleanCode = (roomCode || socket.roomCode || '').toUpperCase().trim();
        const room = getRoomState(cleanCode);

        if (!room) {
          return callback({ success: false, message: 'Game room not found' });
        }

        if (room.status !== 'active') {
          return callback({ success: false, message: 'Question is not currently active' });
        }

        if (questionIndex !== room.currentQuestionIndex) {
          return callback({ success: false, message: 'Answer submitted for invalid question index' });
        }

        if (![0, 1, 2, 3].includes(selectedOption)) {
          return callback({ success: false, message: 'Invalid option selected' });
        }

        const player = room.players.get(playerId);
        if (!player) {
          return callback({ success: false, message: 'Player not recognized' });
        }

        const qAnswers = room.answersByQuestion.get(room.currentQuestionIndex);
        if (!qAnswers) {
          return callback({ success: false, message: 'Question state error' });
        }

        if (qAnswers.has(playerId)) {
          return callback({ success: false, message: 'Answer already locked for this question' });
        }

        // Calculate authoritative response time
        const now = Date.now();
        const timeTaken = Math.min(20, Math.max(0.05, Number(((now - room.questionStartTime) / 1000).toFixed(2))));

        const currentQ = room.questions[room.currentQuestionIndex];
        const isCorrect = selectedOption === currentQ.correctIndex;
        const points = isCorrect ? 10 : 0;

        // Cumulative update
        player.score += points;
        player.totalTime += timeTaken;
        if (isCorrect) {
          player.correctCount += 1;
        }

        // Store answer record
        qAnswers.set(playerId, {
          playerId,
          questionIndex: room.currentQuestionIndex,
          selectedOption,
          isCorrect,
          timeTaken,
          answeredAt: new Date(),
        });

        callback({ success: true, message: 'Answer locked successfully!' });

        // Broadcast live answered count to admin and all players
        const answeredCount = qAnswers.size;
        const totalPlayers = room.players.size;
        const connectedPlayersCount = Array.from(room.players.values()).filter(p => p.connected).length;
        const allAnswered = answeredCount >= connectedPlayersCount && connectedPlayersCount > 0;

        io.to(cleanCode).emit('question:answerCount', {
          answeredCount,
          totalPlayers,
          connectedPlayersCount,
          allAnswered,
        });

        // NOTE: We do NOT trigger immediate reveal here.
        // We wait until the 20-second server timer runs its full course, so all players
        // see their answer locked and the countdown timer finishes before revealing correct/incorrect.
      } catch (err) {
        console.error('[player:answer] Error:', err);
        callback({ success: false, message: err.message });
      }
    });

    // -------------------------------------------------------------
    // 8. DISCONNECT HANDLING
    // -------------------------------------------------------------
    socket.on('disconnect', () => {
      const roomCode = socket.roomCode;
      const playerId = socket.playerId;

      if (!roomCode) return;
      const room = getRoomState(roomCode);
      if (!room) return;

      if (playerId && room.players.has(playerId)) {
        const player = room.players.get(playerId);
        player.connected = false;
        console.log(`[Player Disconnected] Room: ${roomCode} | Player: ${player.name}`);

        io.to(roomCode).emit('room:playersUpdate', getPlayersList(room));

      } else if (socket.id === room.adminSocketId) {
        console.log(`[Host Disconnected] Room: ${roomCode}`);
      }
    });

    // -------------------------------------------------------------
    // 9. ADMIN: REVEAL EARLY (Optional Host Override)
    // -------------------------------------------------------------
    socket.on('admin:revealEarly', (payload, callback = () => {}) => {
      try {
        const { roomCode } = payload || {};
        const cleanCode = (roomCode || socket.roomCode || '').toUpperCase().trim();
        const room = getRoomState(cleanCode);

        if (!room) return callback({ success: false, message: 'Room not found' });
        if (room.adminSocketId !== socket.id && !socket.isAdmin) {
          return callback({ success: false, message: 'Only the host can reveal early' });
        }

        if (room.status === 'active') {
          console.log(`[Host Early Reveal] Room: ${cleanCode} Q#${room.currentQuestionIndex + 1}`);
          revealQuestionResults(io, room);
          callback({ success: true });
        }
      } catch (err) {
        callback({ success: false, message: err.message });
      }
    });
  });
}

/**
 * Dispatches a new question to the room
 */
function dispatchQuestion(io, room, callback = () => {}) {
  // Clear any existing timer
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  room.currentQuestionIndex += 1;
  const qIndex = room.currentQuestionIndex;

  if (qIndex >= room.questions.length) {
    finishGame(io, room);
    return callback({ success: true, finished: true });
  }

  const q = room.questions[qIndex];
  room.status = 'active';
  room.questionStartTime = Date.now();
  room.answersByQuestion.set(qIndex, new Map());

  // 1. Send question to players WITHOUT the correctIndex
  const playerQuestionPayload = {
    questionIndex: qIndex,
    totalQuestions: room.questions.length,
    text: q.text,
    options: q.options,
    duration: room.questionDuration,
  };

  // 2. Send question to admin WITH the correctIndex
  const adminQuestionPayload = {
    ...playerQuestionPayload,
    correctIndex: q.correctIndex,
  };

  // Emit to all players in room except admin
  io.to(room.code).emit('question:new', playerQuestionPayload);

  // Send admin specific event with correctIndex included
  if (room.adminSocketId) {
    io.to(room.adminSocketId).emit('question:adminNew', adminQuestionPayload);
  }

  // Initial answer count broadcast
  io.to(room.code).emit('question:answerCount', {
    answeredCount: 0,
    totalPlayers: room.players.size,
  });

  console.log(`[Question Sent] Room: ${room.code} | Q#${qIndex + 1} of ${room.questions.length}: "${q.text.substring(0, 35)}..."`);

  // Start 20-second authoritative server timer
  room.timer = setTimeout(() => {
    console.log(`[Timer Expired] Room: ${room.code} | Q#${qIndex + 1} 20s elapsed -> Revealing`);
    revealQuestionResults(io, room);
  }, room.questionDuration * 1000);

  callback({ success: true, questionIndex: qIndex });
}

/**
 * Handles question reveal when 20s expires or all connected players answered
 */
function revealQuestionResults(io, room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  if (room.status === 'revealed' || room.status === 'finished') {
    return; // Prevent duplicate trigger
  }

  room.status = 'revealed';
  const qIndex = room.currentQuestionIndex;
  const currentQ = room.questions[qIndex];
  const qAnswers = room.answersByQuestion.get(qIndex) || new Map();

  // For any player who did not answer, mark as unanswered (0 points, 20s time penalty)
  for (const player of room.players.values()) {
    if (!qAnswers.has(player.playerId)) {
      player.totalTime += room.questionDuration;
      qAnswers.set(player.playerId, {
        playerId: player.playerId,
        questionIndex: qIndex,
        selectedOption: null,
        isCorrect: false,
        timeTaken: room.questionDuration,
        answeredAt: new Date(),
      });
    }
  }

  // Compute cumulative leaderboard and answer distribution
  const leaderboard = getRankedLeaderboard(room, qIndex);
  const distribution = getAnswerDistribution(room, qIndex);

  // Send personalized reveal result to each connected player
  for (const player of room.players.values()) {
    const ans = qAnswers.get(player.playerId);
    const rankObj = leaderboard.find(l => l.playerId === player.playerId);

    if (player.socketId) {
      io.to(player.socketId).emit('question:reveal', {
        questionIndex: qIndex,
        correctIndex: currentQ.correctIndex,
        selectedOption: ans ? ans.selectedOption : null,
        isCorrect: ans ? ans.isCorrect : false,
        timeTaken: ans ? ans.timeTaken : 20,
        currentScore: player.score,
        currentRank: rankObj ? rankObj.rank : null,
        totalPlayers: room.players.size,
      });
    }
  }

  // Send full cumulative leaderboard + distribution to admin dashboard
  if (room.adminSocketId) {
    io.to(room.adminSocketId).emit('admin:leaderboardUpdate', {
      questionIndex: qIndex,
      correctIndex: currentQ.correctIndex,
      distribution,
      leaderboard,
      answeredCount: qAnswers.size,
      totalPlayers: room.players.size,
      isLastQuestion: qIndex >= room.questions.length - 1,
    });
  }

  // Asynchronously persist progress to MongoDB
  persistRoomToDB(room);
}

/**
 * Finishes the game, generates final podium, and saves to MongoDB
 */
function finishGame(io, room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  room.status = 'finished';
  room.finishedAt = new Date();

  const finalLeaderboard = getRankedLeaderboard(room, room.currentQuestionIndex);
  const podium = finalLeaderboard.slice(0, 3);

  console.log(`[Game Finished] Room: ${room.code} | Top 3:`, podium.map(p => `${p.rank}. ${p.name} (${p.score}pts)`).join(', '));

  // Broadcast game:finished to everyone in room
  io.to(room.code).emit('game:finished', {
    roomCode: room.code,
    quizTitle: room.quizTitle,
    podium,
    fullLeaderboard: finalLeaderboard,
  });

  // Persist final state to MongoDB
  persistRoomToDB(room);
}

module.exports = {
  setupSocketHandlers,
};
