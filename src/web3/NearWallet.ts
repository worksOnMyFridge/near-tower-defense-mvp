/**
 * Подключение NEAR кошелька (read-only в Фазах 1–2).
 * Использует @near-wallet-selector: выбор кошелька, получение accountId без отправки транзакций.
 */

import type { WalletSelector } from '@near-wallet-selector/core';

const NETWORK = (import.meta.env.VITE_NEAR_NETWORK as string) || 'testnet';
/** contractId для ключа доступа при signIn (можно placeholder для read-only). */
const APP_CONTRACT_ID = import.meta.env.VITE_NEAR_APP_CONTRACT_ID || 'nftower.game';

let selectorInstance: WalletSelector | null = null;

/**
 * Инициализация Wallet Selector. Вызывать один раз при загрузке приложения (например, из меню).
 */
export async function initNearWallet(): Promise<WalletSelector | null> {
  if (selectorInstance) return selectorInstance;
  if (typeof window === 'undefined') return null;

  try {
    const { setupWalletSelector } = await import('@near-wallet-selector/core');
    const { setupMyNearWallet } = await import('@near-wallet-selector/my-near-wallet');

    selectorInstance = await setupWalletSelector({
      network: NETWORK as 'mainnet' | 'testnet',
      modules: [setupMyNearWallet()],
    });
    return selectorInstance;
  } catch (e) {
    console.warn('NearWallet: init failed', e);
    return null;
  }
}

/**
 * Получить текущий accountId подключённого кошелька (или null).
 */
export async function getNearAccountId(): Promise<string | null> {
  const selector = selectorInstance ?? (await initNearWallet());
  if (!selector) return null;
  const state = selector.store.getState();
  const accounts = state.accounts;
  const accountId = accounts.length > 0 ? accounts[0].accountId : null;
  return accountId;
}

/**
 * Проверить, подключён ли кошелёк.
 */
export async function isNearSignedIn(): Promise<boolean> {
  const selector = selectorInstance ?? (await initNearWallet());
  if (!selector) return false;
  return selector.isSignedIn();
}

/**
 * Запросить подключение кошелька (редирект на MyNearWallet или открытие окна).
 */
export async function requestNearSignIn(): Promise<boolean> {
  const selector = selectorInstance ?? (await initNearWallet());
  if (!selector) return false;
  try {
    const wallet = await selector.wallet();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Параметры для браузерного кошелька (MyNearWallet). Типы @near-wallet-selector — пересечение всех вариантов (в т.ч. hardware), приводим.
    const signInParams = {
      contractId: APP_CONTRACT_ID,
      successUrl: origin || undefined,
      failureUrl: origin || undefined,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await wallet.signIn(signInParams as any);
    return true;
  } catch (e) {
    console.warn('NearWallet: signIn failed', e);
    return false;
  }
}

/**
 * Отключить кошелёк (sign out).
 */
export async function nearSignOut(): Promise<void> {
  const selector = selectorInstance ?? (await initNearWallet());
  if (!selector) return;
  try {
    const wallet = await selector.wallet();
    await wallet.signOut();
  } catch (e) {
    console.warn('NearWallet: signOut failed', e);
  }
}
