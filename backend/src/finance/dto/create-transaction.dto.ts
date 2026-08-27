import { TransactionType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Records a purchase or yield event against the caller's own account.
 * `txHash` is optional so this still works against a locally deployed
 * contract without a real chain in front of it, but when it's present the
 * value should be a real transaction hash from the wallet's `writeContract`
 * call — this endpoint doesn't itself verify the chain, it just records
 * what the frontend observed.
 */
export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokens?: number;

  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsString()
  txHash?: string;
}
