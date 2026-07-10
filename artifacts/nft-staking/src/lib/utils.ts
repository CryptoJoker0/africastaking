import { format } from 'date-fns';
export { cn } from './cn';

export function formatAddress(address: string | null | undefined): string {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatToken(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return '0.0000';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.0000';
  return num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

export function generateMockSignature() {
  return "0x" + "a".repeat(130);
}

export function generateMockMessage(action: string, tokenId: string) {
  return `Africa X1 Staking: ${action} token ${tokenId} at ${Date.now()}`;
}
