const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  totalTime: {
    type: Number,
    default: 0, // In seconds, sum of answer times
  },
  correctCount: {
    type: Number,
    default: 0,
  },
  connected: {
    type: Boolean,
    default: true,
  },
  socketId: {
    type: String,
    default: null,
  },
});

const answerRecordSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
  },
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedOption: {
    type: Number,
    default: null, // 0, 1, 2, 3 or null if timed out
  },
  isCorrect: {
    type: Boolean,
    default: false,
  },
  timeTaken: {
    type: Number,
    default: 20, // seconds
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
});

const gameRoomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    quizTitle: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['lobby', 'active', 'finished'],
      default: 'lobby',
    },
    currentQuestionIndex: {
      type: Number,
      default: -1,
    },
    players: [playerSchema],
    answers: [answerRecordSchema],
    startedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GameRoom', gameRoomSchema);
