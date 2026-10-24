const express = require('express');
const GameRoom = require('../models/GameRoom');
const { verifyAdminToken } = require('../middleware/auth');
const { getRoomState } = require('../sockets/gameState');

const router = express.Router();

/**
 * GET /api/games/check/:code
 * Public endpoint to check room existence and status before joining
 */
router.get('/check/:code', async (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const memoryRoom = getRoomState(code);

  if (memoryRoom) {
    return res.json({
      success: true,
      exists: true,
      status: memoryRoom.status,
      quizTitle: memoryRoom.quizTitle,
      playerCount: memoryRoom.players.size,
    });
  }

  // Check database if not active in memory
  try {
    const room = await GameRoom.findOne({ code });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Game room not found.' });
    }
    return res.json({
      success: true,
      exists: true,
      status: room.status,
      quizTitle: room.quizTitle,
      playerCount: room.players.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/games/history
 * Admin: retrieve list of finished and past game sessions
 */
router.get('/history', verifyAdminToken, async (req, res) => {
  try {
    const rooms = await GameRoom.find().sort({ createdAt: -1 }).limit(20);
    return res.json({ success: true, games: rooms });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/games/:code/export-csv
 * Generates CSV content or data for admin export
 */
router.get('/:code/export-csv', verifyAdminToken, async (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  try {
    const room = await GameRoom.findOne({ code });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Game room not found.' });
    }

    // Sort players by score desc, totalTime asc
    const sorted = [...room.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTime - b.totalTime;
    });

    const csvRows = [
      ['Rank', 'Avatar', 'Player Name', 'Score', 'Correct Answers', 'Total Response Time (s)', 'Accuracy (%)'].join(','),
    ];

    const totalQuestions = room.answers.length > 0 
      ? Math.max(...room.answers.map(a => a.questionIndex)) + 1 
      : 20;

    sorted.forEach((player, idx) => {
      const accuracy = totalQuestions > 0 ? ((player.correctCount / totalQuestions) * 100).toFixed(1) : 0;
      csvRows.push([
        idx + 1,
        `"${player.avatar}"`,
        `"${player.name.replace(/"/g, '""')}"`,
        player.score,
        player.correctCount,
        player.totalTime.toFixed(2),
        `${accuracy}%`,
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=quiz_results_${code}.csv`);
    return res.send(csvRows.join('\n'));
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
