const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
}, { _id: true });

const taskSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:       { type: String, required: true, trim: true, maxlength: 200 },
    dueDate:    { type: Date, default: null },
    importance: { type: String, enum: ['high', 'low'], default: 'high' },
    done:       { type: Boolean, default: false },
    subject:    { type: String, trim: true, default: '' },
    tags:       [{ type: String, trim: true }],
    notes:      { type: String, trim: true, default: '' },
    subtasks:   [subtaskSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
