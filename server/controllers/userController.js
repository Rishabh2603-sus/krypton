import User from '../models/User.js';

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving user"
    });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const { type, amount } = req.body;
    const { userId } = req.params;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount required" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (type === "income") {
      user.currentSavings += Number(amount);
      user.income.push(Number(amount));
      // Keep last 12 months for simplicity
      if (user.income.length > 12) {
        user.income.shift();
      }
    } else if (type === "expense") {
      user.essentialExpenses += Number(amount);
    } else {
      return res.status(400).json({ success: false, message: "Invalid transaction type" });
    }

    await user.save();
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding transaction" });
  }
};
