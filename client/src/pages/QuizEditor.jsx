import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileJson,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { apiGetQuiz, apiCreateQuiz, apiUpdateQuiz, apiBulkImport } from '../utils/api';

const DEFAULT_QUESTION = () => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

export default function QuizEditor() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState(() => Array.from({ length: 20 }, DEFAULT_QUESTION));
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bulk import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    if (isEditing) {
      async function loadQuiz() {
        setLoading(true);
        try {
          const res = await apiGetQuiz(id);
          if (res.success && res.quiz) {
            setTitle(res.quiz.title || '');
            setDescription(res.quiz.description || '');
            setQuestions(res.quiz.questions || []);
          } else {
            setError(res.message || 'Failed to load quiz');
          }
        } catch (err) {
          setError(err.message || 'Error fetching quiz details');
        } finally {
          setLoading(false);
        }
      }
      loadQuiz();
    }
  }, [id, isEditing]);

  const handleQuestionChange = (index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const newOpts = [...updated[qIndex].options];
      newOpts[optIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: newOpts };
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, DEFAULT_QUESTION()]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      alert('Quiz must have at least one question.');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // Bulk import JSON
  const handleBulkImport = () => {
    setImportError('');
    try {
      const parsed = JSON.parse(importJsonText);
      const questionArray = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!Array.isArray(questionArray) || questionArray.length === 0) {
        setImportError('JSON must contain an array of question objects (or an object with a "questions" array).');
        return;
      }

      // Check format of questions
      for (let i = 0; i < questionArray.length; i++) {
        const q = questionArray[i];
        if (!q.text) {
          setImportError(`Question #${i + 1} is missing the "text" field.`);
          return;
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          setImportError(`Question #${i + 1} must contain an "options" array with exactly 4 strings.`);
          return;
        }
        if (q.correctIndex === undefined || ![0, 1, 2, 3].includes(Number(q.correctIndex))) {
          setImportError(`Question #${i + 1} must specify "correctIndex" (0, 1, 2, or 3).`);
          return;
        }
      }

      if (parsed.title && !title) {
        setTitle(parsed.title);
      }
      if (parsed.description && !description) {
        setDescription(parsed.description);
      }

      setQuestions(questionArray);
      setShowImportModal(false);
      setImportJsonText('');
      setSuccess(`Successfully imported ${questionArray.length} questions!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setImportError('Invalid JSON format: ' + err.message);
    }
  };

  // Export current questions as JSON
  const handleExportJson = () => {
    const payload = {
      title: title || 'Untitled Quiz',
      description,
      questions,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('Quiz JSON copied to clipboard!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Quiz title is required.');
      return;
    }

    if (questions.length !== 20) {
      const proceed = window.confirm(
        `This quiz currently has ${questions.length} questions. Kahoot standard is 20 questions. Do you still want to save?`
      );
      if (!proceed) return;
    }

    // Validate that no fields are empty
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question #${i + 1} cannot have an empty question text.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          setError(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        questions,
      };

      const res = isEditing ? await apiUpdateQuiz(id, data) : await apiCreateQuiz(data);
      if (res.success) {
        setSuccess('Quiz saved successfully! Redirecting...');
        setTimeout(() => navigate('/admin'), 1200);
      } else {
        setError(res.message || 'Failed to save quiz');
      }
    } catch (err) {
      setError(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const optionStyles = [
    { label: 'A', shape: '▲', color: 'border-red-500/40 focus-within:border-red-400', badge: 'bg-kahoot-red' },
    { label: 'B', shape: '◆', color: 'border-blue-500/40 focus-within:border-blue-400', badge: 'bg-kahoot-blue' },
    { label: 'C', shape: '●', color: 'border-yellow-500/40 focus-within:border-yellow-400', badge: 'bg-kahoot-yellow' },
    { label: 'D', shape: '■', color: 'border-green-500/40 focus-within:border-green-400', badge: 'bg-kahoot-green' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {isEditing ? 'Edit Quiz' : 'Create New 20-Question Quiz'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">
              Each question has 4 options and 1 correct answer index.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-gray-200 transition-colors"
          >
            <Upload className="w-4 h-4 text-brand-purple" />
            <span>Bulk Import JSON</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-gray-200 transition-colors"
          >
            <Download className="w-4 h-4 text-brand-pink" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Quiz Metadata */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <div>
            <label className="block text-xs uppercase font-extrabold text-gray-300 tracking-wider mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. World Geography & Science Trivia..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-brand-purple text-white text-lg font-bold placeholder-gray-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-extrabold text-gray-300 tracking-wider mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description of the quiz theme and audience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 focus:border-brand-purple text-white text-sm placeholder-gray-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Questions Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Questions List</h2>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full border ${
                questions.length === 20
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              }`}
            >
              {questions.length} / 20 Questions
            </span>
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Questions list */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-lg relative"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-black uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  <span>Question #{qIndex + 1}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  title="Remove this question"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Question Text */}
              <div className="mb-5">
                <input
                  type="text"
                  required
                  placeholder={`Question #${qIndex + 1} prompt...`}
                  value={q.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-brand-purple text-white font-semibold placeholder-gray-500 outline-none transition-all"
                />
              </div>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {q.options.map((opt, optIndex) => {
                  const style = optionStyles[optIndex];
                  const isCorrect = q.correctIndex === optIndex;

                  return (
                    <div
                      key={optIndex}
                      className={`relative flex items-center gap-3 p-2.5 rounded-2xl bg-black/30 border transition-all ${
                        isCorrect
                          ? 'ring-2 ring-emerald-400 border-emerald-400 bg-emerald-500/10'
                          : style.color
                      }`}
                    >
                      {/* Option Shape & Letter */}
                      <div
                        className={`w-9 h-9 rounded-xl ${style.badge} flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow`}
                      >
                        {style.shape}
                      </div>

                      {/* Input */}
                      <input
                        type="text"
                        required
                        placeholder={`Option ${style.label}...`}
                        value={opt}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="w-full bg-transparent text-white font-medium placeholder-gray-500 text-sm outline-none"
                      />

                      {/* Correct Option Selector Radio */}
                      <label
                        className={`cursor-pointer px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 select-none ${
                          isCorrect
                            ? 'bg-emerald-500 text-white shadow'
                            : 'bg-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={isCorrect}
                          onChange={() => handleQuestionChange(qIndex, 'correctIndex', optIndex)}
                          className="sr-only"
                        />
                        {isCorrect ? '✓ Correct' : 'Mark'}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Save Bar */}
        <div className="sticky bottom-6 z-30 glass-panel p-4 rounded-2xl border border-white/15 shadow-2xl flex items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-gray-300">
            Total Questions: <span className="font-bold text-white">{questions.length}</span> (20 standard)
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-indigo-600 hover:from-brand-purple/90 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-brand-purple/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Quiz'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-pop-in">
          <div className="relative w-full max-w-2xl bg-brand-surface border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FileJson className="w-5 h-5 text-brand-purple" />
              <span>Bulk Import Questions via JSON</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Paste a JSON array of 20 questions or an object with a <code className="text-brand-pink font-mono">questions</code> key. Each item requires <code className="text-brand-pink font-mono">text</code>, an <code className="text-brand-pink font-mono">options</code> array of 4 strings, and <code className="text-brand-pink font-mono">correctIndex</code> (0-3).
            </p>

            {importError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                {importError}
              </div>
            )}

            <textarea
              rows={12}
              placeholder={`[\n  {\n    "text": "What is the capital of France?",\n    "options": ["Berlin", "Madrid", "Paris", "Rome"],\n    "correctIndex": 2\n  }\n]`}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full font-mono text-xs p-4 rounded-xl bg-black/40 border border-white/10 focus:border-brand-purple text-gray-200 outline-none resize-none"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-bold shadow-md shadow-brand-purple/20"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
