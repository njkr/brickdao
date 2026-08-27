export type PropertyStatus = 'AVAILABLE' | 'SOLD_OUT' | 'COMING_SOON';

export type PropertyDocument = {
  id: string;
  name: string;
  url: string;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  price: number;
  tokenPrice: number;
  totalTokens: number;
  tokensSold: number;
  status: PropertyStatus;
  features: string[];
  returnRate: number | null;
  contractAddress: string | null;
  tokenId: number | null;
  documents: PropertyDocument[];
};

export type PortfolioHolding = {
  propertyId: string;
  propertyName: string;
  tokensOwned: number;
  investmentValue: number;
};

export type PortfolioSummary = {
  totalProperties: number;
  totalInvested: number;
  properties: PortfolioHolding[];
};

export type Transaction = {
  id: string;
  type: 'PURCHASE' | 'YIELD';
  tokens: number;
  value: number;
  txHash: string | null;
  createdAt: string;
  property: { id: string; title: string } | null;
};
