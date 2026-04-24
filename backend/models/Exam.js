const mongoose = require('mongoose');
const examSchema = new mongoose.Schema({
  user:    { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  subject: { type:String, required:true, trim:true },
  date:    { type:Date, required:true },
  notes:   { type:String, default:'' },
},{ timestamps:true });
module.exports = mongoose.model('Exam', examSchema);
