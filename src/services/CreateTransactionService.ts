import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionRepository.getBalance();

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError(`Invalid transaction type: ${type}`, 400);
    }

    let checkingCategory = await categoryRepository.findOne({
      title: category,
    });

    if (!checkingCategory) {
      checkingCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(checkingCategory);
    }

    if (type === 'outcome' && balance.total - value < 0) {
      throw new AppError('Not enough $$', 400);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: checkingCategory.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
