import { IsEthereumAddress, IsString, MinLength } from 'class-validator';

export class VerifySignatureDto {
  @IsEthereumAddress()
  address!: string;

  /** The exact message string returned by POST /auth/nonce, as signed by the wallet. */
  @IsString()
  @MinLength(1)
  message!: string;

  @IsString()
  @MinLength(1)
  signature!: string;
}
