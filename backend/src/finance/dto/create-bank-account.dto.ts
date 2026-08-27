import { IsString, Length, Matches, MinLength } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @MinLength(1)
  bankName!: string;

  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  accountLast4!: string;

  @IsString()
  @Matches(/^\d{9}$/, {
    message: 'routing must be a 9-digit ABA routing number',
  })
  routing!: string;
}
