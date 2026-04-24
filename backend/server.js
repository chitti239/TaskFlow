require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/exams',     require('./routes/exams'));
app.use('/api/pomodoro',  require('./routes/pomodoro'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/profile',   require('./routes/profile'));

app.get('/api/health', (req,res) => res.json({status:'ok'}));

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB connected'); app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`)); })
  .catch(e => { console.error('❌ MongoDB error:', e.message); process.exit(1); });
