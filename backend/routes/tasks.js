const router = require('express').Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
router.use(auth);

function calcPriority(dueDate, importance) {
  const base = importance === 'high' ? 50 : 0;
  if (!dueDate) return base;
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((new Date(dueDate) - today) / 86400000);
  if (diff < 0)  return base + 50;
  if (diff === 0) return base + 45;
  if (diff <= 2) return base + 35;
  if (diff <= 7) return base + 20;
  return base + 5;
}

router.get('/', async (req,res) => {
  try { res.json(await Task.find({user:req.userId}).sort({createdAt:-1})); }
  catch(e){ res.status(500).json({message:e.message}); }
});

router.get('/:id', async (req,res) => {
  try {
    const t = await Task.findOne({_id:req.params.id,user:req.userId});
    if(!t) return res.status(404).json({message:'Not found'});
    res.json(t);
  } catch(e){ res.status(500).json({message:e.message}); }
});

router.post('/', async (req,res) => {
  try {
    const {text,dueDate,importance,subject,tags,notes,recurring} = req.body;
    if(!text) return res.status(400).json({message:'Text required'});
    const score = calcPriority(dueDate, importance||'high');
    const t = await Task.create({user:req.userId,text,dueDate:dueDate||null,importance:importance||'high',subject:subject||'',tags:tags||[],notes:notes||'',recurring:recurring||'none',priorityScore:score});
    res.status(201).json(t);
  } catch(e){ res.status(500).json({message:e.message}); }
});

router.patch('/:id', async (req,res) => {
  try {
    const t = await Task.findOne({_id:req.params.id,user:req.userId});
    if(!t) return res.status(404).json({message:'Not found'});
    const fields = ['text','dueDate','importance','done','subject','tags','notes','subtasks','grade','recurring','revisionDates','isRevision','priorityScore'];
    fields.forEach(f => { if(req.body[f]!==undefined) t[f]=req.body[f]; });
    if(req.body.text||req.body.dueDate||req.body.importance){
      t.priorityScore = calcPriority(t.dueDate, t.importance);
    }
    // Handle recurring — when marked done, create next occurrence
    if(req.body.done===true && t.recurring!=='none'){
      const next = new Date(t.dueDate||new Date());
      if(t.recurring==='daily') next.setDate(next.getDate()+1);
      if(t.recurring==='weekly') next.setDate(next.getDate()+7);
      await Task.create({
        user:req.userId, text:t.text, importance:t.importance,
        subject:t.subject, tags:t.tags, notes:t.notes,
        recurring:t.recurring, dueDate:next,
        priorityScore:calcPriority(next,t.importance),
      });
    }
    await t.save();
    res.json(t);
  } catch(e){ res.status(500).json({message:e.message}); }
});

router.delete('/:id', async (req,res) => {
  try {
    const t = await Task.findOneAndDelete({_id:req.params.id,user:req.userId});
    if(!t) return res.status(404).json({message:'Not found'});
    res.json({message:'deleted'});
  } catch(e){ res.status(500).json({message:e.message}); }
});

module.exports = router;
