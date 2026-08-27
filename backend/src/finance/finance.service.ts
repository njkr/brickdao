import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';

/**
 * Every read/write here is scoped to the calling user's own `userId` — the
 * caller never gets to pass someone else's id in a query string. BrickFi's
 * `/api/data/cards?holder_id=...` let anyone read or write anyone's records;
 * this is the direct fix for that.
 */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  listCards(userId: string) {
    return this.prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  addCard(userId: string, dto: CreateCardDto) {
    return this.prisma.card.create({ data: { ...dto, userId } });
  }

  listBankAccounts(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  addBankAccount(userId: string, dto: CreateBankAccountDto) {
    return this.prisma.bankAccount.create({ data: { ...dto, userId } });
  }

  listTransactions(userId: string, type?: TransactionType) {
    return this.prisma.transaction.findMany({
      where: { userId, ...(type ? { type } : {}) },
      include: { property: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTransaction(userId: string, dto: CreateTransactionDto) {
    if (dto.propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: dto.propertyId },
      });
      if (!property) throw new NotFoundException('Property not found.');
    }

    return this.prisma.transaction.create({
      data: { ...dto, userId },
      include: { property: { select: { id: true, title: true } } },
    });
  }

  async portfolioSummary(userId: string) {
    const purchases = await this.prisma.transaction.findMany({
      where: { userId, type: TransactionType.PURCHASE },
      include: { property: true },
    });

    const byProperty = new Map<
      string,
      {
        propertyId: string;
        propertyName: string;
        tokensOwned: number;
        investmentValue: number;
      }
    >();
    for (const purchase of purchases) {
      if (!purchase.property) continue;
      const existing = byProperty.get(purchase.property.id) ?? {
        propertyId: purchase.property.id,
        propertyName: purchase.property.title,
        tokensOwned: 0,
        investmentValue: 0,
      };
      existing.tokensOwned += purchase.tokens;
      existing.investmentValue += purchase.value;
      byProperty.set(purchase.property.id, existing);
    }

    const properties = Array.from(byProperty.values());
    return {
      totalProperties: properties.length,
      totalInvested: properties.reduce((sum, p) => sum + p.investmentValue, 0),
      properties,
    };
  }
}
