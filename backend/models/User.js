const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  username:      { type:String, required:true, unique:true, trim:true, lowercase:true, minlength:2, maxlength:30 },
  email:         { type:String, required:true, unique:true, trim:true, lowercase:true, match:[/^\S+@\S+\.\S+$/,'Valid email required'] },
  password:      { type:String, required:true, minlength:4 },
  longestStreak: { type:Number, default:0 },
  totalCompleted:{ type:Number, default:0 },
  theme:         { type:String, default:'default' },
  avatarColor:   { type:String, default:'' },
},{ timestamps:true });
userSchema.pre('save', async function(next){ if(!this.isModified('password')) return next(); this.password=await bcrypt.hash(this.password,10); next(); });
userSchema.methods.comparePassword = function(c){ return bcrypt.compare(c,this.password); };
module.exports = mongoose.model('User', userSchema);
