import CanteenItem from '../models/CanteenItem.js';
import CanteenTransaction from '../models/CanteenTransaction.js';

// Items
export const getCanteenItems = async (req, res, next) => {
  try {
    const { category, search, status } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const items = await CanteenItem.find(query).sort({ category: 1, name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

export const createCanteenItem = async (req, res, next) => {
  try {
    const { name, category, price, isVeg, status, mealTiming, description } = req.body;
    const count = await CanteenItem.countDocuments();
    const itemId = `ITEM-${String(count + 101).padStart(3, '0')}`;

    const item = await CanteenItem.create({
      itemId,
      name,
      category,
      price: Number(price),
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      status: status || 'Available',
      mealTiming: mealTiming || 'All Day',
      description: description || '',
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, message: 'Item added to canteen menu', data: item });
  } catch (error) {
    next(error);
  }
};

export const updateCanteenItem = async (req, res, next) => {
  try {
    const item = await CanteenItem.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    res.json({ success: true, message: 'Item updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

export const deleteCanteenItem = async (req, res, next) => {
  try {
    const item = await CanteenItem.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404);
      throw new Error('Menu item not found');
    }
    res.json({ success: true, message: 'Item deleted from canteen menu' });
  } catch (error) {
    next(error);
  }
};

// Transactions
export const getCanteenTransactions = async (req, res, next) => {
  try {
    const transactions = await CanteenTransaction.find().sort({ date: -1 });
    
    const totalIncome = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const netProfit = totalIncome - totalExpense;

    res.json({
      success: true,
      data: transactions,
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        count: transactions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCanteenTransaction = async (req, res, next) => {
  try {
    const { date, description, category, type, amount } = req.body;
    const count = await CanteenTransaction.countDocuments();
    const transactionId = `CNT-${String(count + 1).padStart(3, '0')}`;

    const transaction = await CanteenTransaction.create({
      transactionId,
      date: date ? new Date(date) : new Date(),
      description,
      category,
      type,
      amount: Number(amount),
      createdBy: req.user?._id
    });

    res.status(201).json({ success: true, message: 'Transaction created', data: transaction });
  } catch (error) {
    next(error);
  }
};

export const deleteCanteenTransaction = async (req, res, next) => {
  try {
    const transaction = await CanteenTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    next(error);
  }
};
