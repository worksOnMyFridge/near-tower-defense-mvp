/**
 * Подключение NEAR кошелька (read-only в Фазах 1–2).
 * Использует @hot-labs/near-connect: модалка с HOT Wallet, MyNearWallet и др.
 * Список кошельков задан в walletManifest.ts (в коде), чтобы гарантированно попадал в сборку на Vercel.
 */

import type { NearConnector } from '@hot-labs/near-connect';
import { WALLET_MANIFESTS } from './walletManifest';

const NETWORK = (import.meta.env.VITE_NEAR_NETWORK as string) || 'testnet';
/** contractId для ключа доступа при signIn (можно placeholder для read-only). */
const APP_CONTRACT_ID = import.meta.env.VITE_NEAR_APP_CONTRACT_ID || 'nftower.game';

let connectorInstance: NearConnector | null = null;

/**
 * Инициализация NEAR Connect. Список из walletManifest.ts — HOT Wallet всегда первый.
 */
export async function initNearWallet(): Promise<NearConnector | null> {
  if (connectorInstance) return connectorInstance;
  if (typeof window === 'undefined') return null;

  try {
    const { NearConnector } = await import('@hot-labs/near-connect');
    const manifest = { version: '1.1.0', wallets: WALLET_MANIFESTS };
    connectorInstance = new NearConnector({
      network: NETWORK as 'mainnet' | 'testnet',
      manifest,
      signIn: { contractId: APP_CONTRACT_ID, methodNames: [] },
      footerBranding: null,
    });
    return connectorInstance;
  } catch (e) {
    console.warn('NearWallet: init failed', e);
    return null;
  }
}

/**
 * Получить текущий accountId подключённого кошелька (или null).
 */
export async function getNearAccountId(): Promise<string | null> {
  const connector = connectorInstance ?? (await initNearWallet());
  if (!connector) return null;
  try {
    const wallet = await connector.wallet();
    const accounts = await wallet.getAccounts();
    return accounts.length > 0 ? accounts[0].accountId : null;
  } catch {
    return null;
  }
}

/**
 * Проверить, подключён ли кошелёк.
 */
export async function isNearSignedIn(): Promise<boolean> {
  const accountId = await getNearAccountId();
  return accountId != null;
}

/**
 * Показать модалку выбора кошелька (HOT Wallet, MyNearWallet и др.). После выбора — вход в кошелёк.
 */
export async function requestNearSignIn(): Promise<boolean> {
  const connector = connectorInstance ?? (await initNearWallet());
  if (!connector) return false;
  try {
    await connector.connect();
    return true;
  } catch (e) {
    console.warn('NearWallet: connect failed', e);
    return false;
  }
}

/**
 * Отключить кошелёк (sign out).
 */
export async function nearSignOut(): Promise<void> {
  const connector = connectorInstance ?? (await initNearWallet());
  if (!connector) return;
  try {
    const wallet = await connector.wallet();
    await wallet.signOut();
  } catch (e) {
    console.warn('NearWallet: signOut failed', e);
  }
}
