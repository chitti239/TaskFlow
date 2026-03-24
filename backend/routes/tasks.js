const router = require('express').Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create task
router.post('/', async (req, res) => {
  try {
    const { text, dueDate, importance, subject, tags, notes } = req.body;
    if (!text) return res.status(400).json({ message: 'Task text is required' });
    const task = await Task.create({
      user: req.userId, text,
      dueDate: dueDate || null,
      importance: importance || 'high',
      subject: subject || '',
      tags: tags || [],
      notes: notes || '',
      subtasks: [],
    });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH update task
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const { text, dueDate, importance, done, subject, tags, notes, subtasks } = req.body;
    if (text !== undefined)      task.text = text;
    if (dueDate !== undefined)   task.dueDate = dueDate;
    if (importance !== undefined) task.importance = importance;
    if (done !== undefined)      task.done = done;
    if (subject !== undefined)   task.subject = subject;
    if (tags !== undefined)      task.tags = tags;
    if (notes !== undefined)     task.notes = notes;
    if (subtasks !== undefined)  task.subtasks = subtasks;
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
