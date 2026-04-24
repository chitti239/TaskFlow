const router = require('express').Router();
const PomodoroSession = require('../models/PomodoroSession');
const auth = require('../middleware/auth');
router.use(auth);
router.get('/', async (req,res) => {
  try {
    const sessions = await PomodoroSession.find({user:req.userId}).sort({date:-1}).limit(365);
    res.json(sessions);
  } catch(e){ res.status(500).json({message:e.message}); }
});
router.post('/', async (req,res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    let s = await PomodoroSession.findOne({user:req.userId, date:{$gte:today}});
    if(s){ s.count+=1; await s.save(); }
    else { s = await PomodoroSession.create({user:req.userId, taskId:req.body.taskId||null, date:today, count:1}); }
    res.json(s);
  } catch(e){ res.status(500).json({message:e.message}); }
});
module.exports = router;
