
import express from 'express';
import { getUser } from '../controllers/userController.js';
import { analyzeFinances, simulateFinances } from '../controllers/financeController.js';
import { getAdvice, chatWithAI } from '../controllers/aiController.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: "Krypton API is running" });
});

router.get('/demo/:userId', getUser);
router.post('/analyze', analyzeFinances);
router.post('/simulate', simulateFinances);
router.post('/ai/advice', getAdvice);
router.post('/ai/chat', chatWithAI);

export default router;
