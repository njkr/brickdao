import { IsString, Length, Matches, MinLength } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  brand!: string;

  // Only ever the last 4 digits — never a full PAN, on this endpoint or in storage.
  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  last4!: string;

  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'exp must be in MM/YY format',
  })
  exp!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}
