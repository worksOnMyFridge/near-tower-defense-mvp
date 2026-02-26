/**
 * Подключение NEAR кошелька (read-only в Фазах 1–2).
 * Использует @hot-labs/near-connect: модалка с HOT Wallet, MyNearWallet и др.
 * Манифест встроен в сборку, чтобы HOT Wallet всегда был в списке (в т.ч. на Vercel).
 */

import type { NearConnector, WalletManifest } from '@hot-labs/near-connect';
import embeddedManifest from './near-connect-manifest.json';

const NETWORK = (import.meta.env.VITE_NEAR_NETWORK as string) || 'testnet';
/** contractId для ключа доступа при signIn (можно placeholder для read-only). */
const APP_CONTRACT_ID = import.meta.env.VITE_NEAR_APP_CONTRACT_ID || 'nftower.game';

/** Минимальная запись HOT Wallet на случай, если в манифесте его нет (fallback для сборки). */
const HOT_WALLET_FALLBACK = {
  id: 'hot-wallet',
  name: 'HOT Wallet',
  icon: 'https://app.hot-labs.org/images/hot/hot-icon.png',
  description: 'Secure Multichain wallet. Manage assets, refuel gas, and mine $HOT on any device with HOT Wallet',
  website: 'https://hot-labs.org/wallet',
  version: '1.0.0',
  executor: 'https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/hotwallet.js',
  type: 'sandbox',
  platform: {
    android: 'https://play.google.com/store/apps/details?id=app.herewallet.hot&hl=en',
    ios: 'https://apps.apple.com/us/app/hot-wallet/id6740916148',
    chrome: 'https://chromewebstore.google.com/detail/hot-wallet/mpeengabcnhhjjgleiodimegnkpcenbk',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/hot-wallet',
    tga: 'https://t.me/hot_wallet/app',
  },
  features: {
    signMessage: true,
    signInWithoutAddKey: true,
    signAndSendTransaction: true,
    signAndSendTransactions: true,
    testnet: true,
  },
  permissions: {
    storage: true,
    allowsOpen: [
      'https://download.hot-labs.org',
      'https://hot-labs.org/wallet',
      'https://t.me/hot_wallet/app',
      'https://play.google.com',
      'https://apps.apple.com',
      'hotwallet://',
      'https://wallet.near.org',
    ],
  },
} as unknown as WalletManifest;

let connectorInstance: NearConnector | null = null;

/**
 * Инициализация NEAR Connect. Манифест встроен — HOT Wallet всегда первый в списке (mainnet и testnet).
 */
export async function initNearWallet(): Promise<NearConnector | null> {
  if (connectorInstance) return connectorInstance;
  if (typeof window === 'undefined') return null;

  try {
    const { NearConnector } = await import('@hot-labs/near-connect');
    const raw = embeddedManifest as unknown as { wallets: WalletManifest[]; version: string };
    const wallets = [...(raw.wallets ?? [])];
    const hotIdx = wallets.findIndex((w) => w.id === 'hot-wallet');
    if (hotIdx === -1) {
      wallets.unshift(HOT_WALLET_FALLBACK);
    } else if (hotIdx > 0) {
      const [hot] = wallets.splice(hotIdx, 1);
      wallets.unshift(hot);
    }
    const manifest = { version: raw.version ?? '1.1.0', wallets };
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
