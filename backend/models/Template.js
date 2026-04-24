const mongoose = require('mongoose');
const templateSchema = new mongoose.Schema({
  user:       { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  name:       { type:String, required:true, trim:true },
  text:       { type:String, required:true, trim:true },
  importance: { type:String, enum:['high','low'], default:'high' },
  subject:    { type:String, default:'' },
  tags:       [String],
  notes:      { type:String, default:'' },
  subtasks:   [{ text:String }],
},{ timestamps:true });
module.exports = mongoose.model('Template', templateSchema);
