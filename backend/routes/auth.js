const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function signToken(id){ return jwt.sign({userId:id}, process.env.JWT_SECRET, {expiresIn:'1h'}); }

function avatarColor(username){
  const colors=['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63'];
  let hash=0; for(let c of username) hash=c.charCodeAt(0)+((hash<<5)-hash);
  return colors[Math.abs(hash)%colors.length];
}

router.post('/register', async (req,res) => {
  try {
    const {username,email,password} = req.body;
    if(!username||!email||!password) return res.status(400).json({message:'All fields required'});
    if(await User.findOne({username:username.toLowerCase()})) return res.status(409).json({message:'Username taken'});
    if(await User.findOne({email:email.toLowerCase()})) return res.status(409).json({message:'Email already registered'});
    const color = avatarColor(username);
    const user = await User.create({username,email,password,avatarColor:color});
    res.status(201).json({token:signToken(user._id), username:user.username, email:user.email, avatarColor:color});
  } catch(e){ res.status(500).json({message:e.message}); }
});

router.post('/login', async (req,res) => {
  try {
    const {username,password} = req.body;
    if(!username||!password) return res.status(400).json({message:'All fields required'});
    const user = await User.findOne({$or:[{username:username.toLowerCase()},{email:username.toLowerCase()}]});
    if(!user||!await user.comparePassword(password)) return res.status(401).json({message:'Wrong credentials'});
    res.json({token:signToken(user._id), username:user.username, email:user.email, avatarColor:user.avatarColor});
  } catch(e){ res.status(500).json({message:e.message}); }
});

module.exports = router;
