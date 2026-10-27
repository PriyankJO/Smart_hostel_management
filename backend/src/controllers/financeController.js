import FinanceTransaction from '../models/FinanceTransaction.js';

export const getFinanceTransactions = async (req, res, next) => {
  try {
    const { type, category, search } = req.query;
    const query = {};

    if (type && type !== 'All') {
      query.type = type;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { payerPayee: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    const transactions = await FinanceTransaction.find(query).sort({ date: -1 });

    const totalIncome = transactions
      .filter(t => t.type === 'Income' && t.status === 'Paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter(t => t.type === 'Expense' && t.status === 'Paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const pendingAmount = transactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({
      success: true,
      count: transactions.length,
      data: transactions,
      summary: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        pendingAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createFinanceTransaction = async (req, res, next) => {
  try {
    const { title, category, type, amount, date, paymentMethod, payerPayee, reference, status, notes } = req.body;

    const count = await FinanceTransaction.countDocuments();
    const transactionId = `TXN-${String(count + 801).padStart(3, '0')}`;

    const transaction = await FinanceTransaction.create({
      transactionId,
      title,
      category,
      type,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod ? String(paymentMethod).trim() : 'UPI',
      payerPayee: payerPayee || '',
      reference: reference || '',
      status: status || 'Paid',
      notes: notes || '',
      recordedBy: req.user?._id
    });

    res.status(201).json({
      success: true,
      message: 'Finance transaction recorded successfully',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

export const updateFinanceTransaction = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    if (updateData.paymentMethod !== undefined) {
      updateData.paymentMethod = String(updateData.paymentMethod).trim();
    }
    if (updateData.amount !== undefined) {
      updateData.amount = Number(updateData.amount);
    }
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    const transaction = await FinanceTransaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    res.json({
      success: true,
      message: 'Finance transaction updated',
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFinanceTransaction = async (req, res, next) => {
  try {
    const transaction = await FinanceTransaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    res.json({
      success: true,
      message: 'Finance transaction deleted'
    });
  } catch (error) {
    next(error);
  }
};
