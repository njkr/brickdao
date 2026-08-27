import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PropertyStatus } from '@prisma/client';
import { PropertyDocumentDto } from './property-document.dto';

/**
 * Explicit whitelist of what a client may set. BrickFi's mock data endpoints
 * spread `req.body` straight into storage (mass assignment); every field
 * here is validated and typed instead.
 */
export class CreatePropertyDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsUrl({ require_tld: false })
  imageUrl!: string;

  @IsString()
  @MinLength(1)
  location!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  tokenPrice!: number;

  @IsInt()
  @Min(1)
  totalTokens!: number;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  features!: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  returnRate?: number;

  @IsOptional()
  @IsString()
  contractAddress?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tokenId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertyDocumentDto)
  documents?: PropertyDocumentDto[];
}
