const router = require('express').Router();
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
router.use(auth);

router.get('/', async (req,res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const totalCompleted = await Task.countDocuments({user:req.userId,done:true});
    const tasks = await Task.find({user:req.userId,done:true}).sort({updatedAt:-1});
    // calc streak
    const doneDates=[...new Set(tasks.map(t=>{const d=new Date(t.updatedAt);d.setHours(0,0,0,0);return d.getTime()}))].sort((a,b)=>b-a);
    let streak=0, longest=user.longestStreak||0;
    const today=new Date();today.setHours(0,0,0,0);
    let check=today.getTime();
    for(const d of doneDates){ if(d===check){streak++;check-=86400000;}else break; }
    if(streak>longest){ longest=streak; await User.findByIdAndUpdate(req.userId,{longestStreak:longest,totalCompleted}); }
    res.json({...user.toObject(),totalCompleted,currentStreak:streak,longestStreak:longest});
  } catch(e){ res.status(500).json({message:e.message}); }
});

router.patch('/', async (req,res) => {
  try {
    const {email,theme,currentPassword,newPassword} = req.body;
    const user = await User.findById(req.userId);
    if(email) user.email=email;
    if(theme) user.theme=theme;
    if(newPassword){
      if(!currentPassword) return res.status(400).json({message:'Current password required'});
      if(!await user.comparePassword(currentPassword)) return res.status(401).json({message:'Wrong current password'});
      user.password=newPassword;
    }
    await user.save();
    res.json({username:user.username,email:user.email,theme:user.theme,avatarColor:user.avatarColor});
  } catch(e){ res.status(500).json({message:e.message}); }
});

module.exports = router;
