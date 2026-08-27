import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FinanceService } from './finance.service';

/** Everything here requires a signed-in wallet and only ever touches that wallet's own data. */
@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('cards')
  listCards(@CurrentUser() user: AuthenticatedUser) {
    return this.financeService.listCards(user.id);
  }

  @Post('cards')
  addCard(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCardDto) {
    return this.financeService.addCard(user.id, dto);
  }

  @Get('banks')
  listBankAccounts(@CurrentUser() user: AuthenticatedUser) {
    return this.financeService.listBankAccounts(user.id);
  }

  @Post('banks')
  addBankAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.financeService.addBankAccount(user.id, dto);
  }

  @Get('transactions')
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: TransactionType,
  ) {
    return this.financeService.listTransactions(user.id, type);
  }

  @Post('transactions')
  addTransaction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.financeService.addTransaction(user.id, dto);
  }

  @Get('portfolio')
  portfolio(@CurrentUser() user: AuthenticatedUser) {
    return this.financeService.portfolioSummary(user.id);
  }
}
