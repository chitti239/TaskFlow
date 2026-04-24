const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  user:   { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  taskId: { type:mongoose.Schema.Types.ObjectId, ref:'Task', default:null },
  date:   { type:Date, default:Date.now },
  count:  { type:Number, default:1 },
},{ timestamps:true });
module.exports = mongoose.model('PomodoroSession', sessionSchema);
