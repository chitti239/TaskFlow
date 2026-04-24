const router = require('express').Router();
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.use(auth);

const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM = `You are Buddy, a chill AI study companion for a student productivity app called TaskFlow. 
Your vibe: helpful, friendly, slightly funny — like a smart friend who actually did the readings. 
Keep replies SHORT (2-4 sentences max). Be direct and useful. 
You can help with: explaining concepts, quick quizzes, motivation, study tips, or just a quick chat.
If someone seems stressed, be warm and human about it.
Never be preachy. Never use bullet points unless they explicitly ask for a list.
Start responses naturally — no "Great question!" or "Certainly!".`;

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }
    
    const model = client.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM,
    });
    
    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    });
    
    const userMessage = messages[messages.length - 1].content;
    const response = await chat.sendMessage(userMessage);
    const reply = response.response.text();
    res.json({ reply });
  } catch (e) {
    console.error('AI Error:', e.message);
    res.status(500).json({ error: e.message || 'AI service unavailable' });
  }
});

module.exports = router;