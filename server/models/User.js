import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // 'ravi', 'priya', 'arjun'
  name: { type: String, required: true },
  occupation: { type: String },
  incomeType: { type: String },
  income: [{ type: Number }],
  currentSavings: { type: Number, default: 0 },
  essentialExpenses: { type: Number, default: 0 },
  monthlyDebtPayment: { type: Number, default: 0 },
  financialGoal: { type: String }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
