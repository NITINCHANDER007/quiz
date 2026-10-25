const express = require('express');
const Quiz = require('../models/Quiz');
const { verifyAdminToken } = require('../middleware/auth');

const router = express.Router();

// Helper validator for question items
function validateQuestion(q, index) {
  if (!q.text || typeof q.text !== 'string' || !q.text.trim()) {
    return `Question #${index + 1} is missing text.`;
  }
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    return `Question #${index + 1} must have exactly 4 options.`;
  }
  for (let i = 0; i < 4; i++) {
    if (typeof q.options[i] !== 'string' || !q.options[i].trim()) {
      return `Question #${index + 1}, Option ${String.fromCharCode(65 + i)} is empty.`;
    }
  }
  if (q.correctIndex === undefined || q.correctIndex === null || ![0, 1, 2, 3].includes(Number(q.correctIndex))) {
    return `Question #${index + 1} must specify a valid correct option index (0, 1, 2, or 3).`;
  }
  return null;
}

const sampleQuiz = require('../seed/sampleQuiz.json');

const DEFAULT_QUIZ = {
  _id: 'sample-python-basics',
  title: sampleQuiz.title,
  description: sampleQuiz.description,
  questionCount: sampleQuiz.questions.length,
  questions: sampleQuiz.questions,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * GET /api/quizzes
 * Retrieve all quizzes (summarized, admin only)
 */
router.get('/', verifyAdminToken, async (req, res) => {
  try {
    let formatted = [];
    try {
      const quizzes = await Quiz.find().sort({ createdAt: -1 });
      formatted = quizzes.map(q => ({
        _id: q._id,
        title: q.title,
        description: q.description,
        questionCount: q.questions.length,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
    } catch (dbErr) {
      console.warn('[Quiz API] Database query skipped or failed, using fallback quiz:', dbErr.message);
    }

    if (formatted.length === 0) {
      formatted.push({
        _id: DEFAULT_QUIZ._id,
        title: DEFAULT_QUIZ.title,
        description: DEFAULT_QUIZ.description,
        questionCount: DEFAULT_QUIZ.questionCount,
        createdAt: DEFAULT_QUIZ.createdAt,
        updatedAt: DEFAULT_QUIZ.updatedAt,
      });
    }

    return res.json({ success: true, quizzes: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/quizzes/:id
 * Retrieve single quiz by ID with full questions
 */
router.get('/:id', verifyAdminToken, async (req, res) => {
  try {
    if (req.params.id === 'sample-python-basics') {
      return res.json({ success: true, quiz: DEFAULT_QUIZ });
    }
    const quiz = await Quiz.findById(req.params.id).catch(() => null);
    if (!quiz) {
      return res.json({ success: true, quiz: DEFAULT_QUIZ });
    }
    return res.json({ success: true, quiz });
  } catch (error) {
    return res.json({ success: true, quiz: DEFAULT_QUIZ });
  }
});

/**
 * POST /api/quizzes
 * Create new quiz with questions
 */
router.post('/', verifyAdminToken, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz title is required' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least 1 question is required' });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
    }

    const sanitizedQuestions = questions.map(q => ({
      text: q.text.trim(),
      options: q.options.map(opt => String(opt).trim()),
      correctIndex: Number(q.correctIndex),
    }));

    const quiz = new Quiz({
      title: title.trim(),
      description: description ? description.trim() : '',
      questions: sanitizedQuestions,
    });

    await quiz.save();
    return res.status(201).json({ success: true, quiz, message: 'Quiz created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/quizzes/:id
 * Update existing quiz
 */
router.put('/:id', verifyAdminToken, async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty' });
      quiz.title = title.trim();
    }

    if (description !== undefined) {
      quiz.description = description.trim();
    }

    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: 'At least 1 question is required' });
      }

      for (let i = 0; i < questions.length; i++) {
        const err = validateQuestion(questions[i], i);
        if (err) {
          return res.status(400).json({ success: false, message: err });
        }
      }

      quiz.questions = questions.map(q => ({
        text: q.text.trim(),
        options: q.options.map(opt => String(opt).trim()),
        correctIndex: Number(q.correctIndex),
      }));
    }

    await quiz.save();
    return res.json({ success: true, quiz, message: 'Quiz updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/quizzes/:id
 * Delete quiz
 */
router.delete('/:id', verifyAdminToken, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    return res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/quizzes/bulk-import
 * Validates and imports questions from JSON
 */
router.post('/bulk-import', verifyAdminToken, (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions must be a non-empty array of question objects.',
      });
    }

    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i], i);
      if (err) {
        return res.status(400).json({ success: false, message: err });
      }
    }

    const validatedQuestions = questions.map(q => ({
      text: q.text.trim(),
      options: q.options.map(opt => String(opt).trim()),
      correctIndex: Number(q.correctIndex),
    }));

    return res.json({
      success: true,
      questions: validatedQuestions,
      count: validatedQuestions.length,
      message: `Successfully validated ${validatedQuestions.length} questions for import.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
