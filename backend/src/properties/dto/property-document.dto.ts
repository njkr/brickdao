import { IsString, MinLength } from 'class-validator';

export class PropertyDocumentDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  url!: string;
}
