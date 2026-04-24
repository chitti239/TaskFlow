const router = require('express').Router();
const Exam = require('../models/Exam');
const auth = require('../middleware/auth');
router.use(auth);
router.get('/',       async (req,res) => { try{ res.json(await Exam.find({user:req.userId}).sort({date:1})); }catch(e){res.status(500).json({message:e.message});} });
router.post('/',      async (req,res) => { try{ const e=await Exam.create({...req.body,user:req.userId}); res.status(201).json(e); }catch(e){res.status(500).json({message:e.message});} });
router.delete('/:id', async (req,res) => { try{ await Exam.findOneAndDelete({_id:req.params.id,user:req.userId}); res.json({message:'deleted'}); }catch(e){res.status(500).json({message:e.message});} });
module.exports = router;
