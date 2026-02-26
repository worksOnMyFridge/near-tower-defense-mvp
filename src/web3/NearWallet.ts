/**
 * Подключение NEAR кошелька (read-only в Фазах 1–2).
 * Использует @near-wallet-selector + modal-ui: модалка выбора кошелька, затем signIn.
 */

import type { WalletSelector } from '@near-wallet-selector/core';
import type { WalletSelectorModal } from '@near-wallet-selector/modal-ui';

const NETWORK = (import.meta.env.VITE_NEAR_NETWORK as string) || 'testnet';
/** contractId для ключа доступа при signIn (можно placeholder для read-only). */
const APP_CONTRACT_ID = import.meta.env.VITE_NEAR_APP_CONTRACT_ID || 'nftower.game';

let selectorInstance: WalletSelector | null = null;
let modalInstance: WalletSelectorModal | null = null;

/**
 * Инициализация Wallet Selector и модалки. Вызывать один раз при загрузке (например, из меню).
 */
export async function initNearWallet(): Promise<WalletSelector | null> {
  if (selectorInstance) return selectorInstance;
  if (typeof window === 'undefined') return null;

  try {
    const { setupWalletSelector } = await import('@near-wallet-selector/core');
    const { setupModal } = await import('@near-wallet-selector/modal-ui');
    const { setupMyNearWallet } = await import('@near-wallet-selector/my-near-wallet');

    selectorInstance = await setupWalletSelector({
      network: NETWORK as 'mainnet' | 'testnet',
      modules: [setupMyNearWallet()],
    });
    modalInstance = setupModal(selectorInstance, {
      contractId: APP_CONTRACT_ID,
      theme: 'dark',
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
 * Показать модалку выбора кошелька (MyNearWallet и др.). После выбора — редирект на вход в кошелёк.
 */
export async function requestNearSignIn(): Promise<boolean> {
  const selector = selectorInstance ?? (await initNearWallet());
  if (!selector) return false;
  if (!modalInstance) return false;
  try {
    modalInstance.show();
    return true;
  } catch (e) {
    console.warn('NearWallet: modal show failed', e);
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
