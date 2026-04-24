const router = require('express').Router();
const Template = require('../models/Template');
const auth = require('../middleware/auth');
router.use(auth);
router.get('/',       async (req,res) => { try{ res.json(await Template.find({user:req.userId}).sort({createdAt:-1})); }catch(e){res.status(500).json({message:e.message});} });
router.post('/',      async (req,res) => { try{ const t=await Template.create({...req.body,user:req.userId}); res.status(201).json(t); }catch(e){res.status(500).json({message:e.message});} });
router.patch('/:id',  async (req,res) => { try{ const t=await Template.findOneAndUpdate({_id:req.params.id,user:req.userId},req.body,{new:true}); res.json(t); }catch(e){res.status(500).json({message:e.message});} });
router.delete('/:id', async (req,res) => { try{ await Template.findOneAndDelete({_id:req.params.id,user:req.userId}); res.json({message:'deleted'}); }catch(e){res.status(500).json({message:e.message});} });
module.exports = router;
