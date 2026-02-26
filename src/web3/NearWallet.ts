/**
 * Подключение NEAR кошелька (read-only в Фазах 1–2).
 * Использует @hot-labs/near-connect: модалка с HOT Wallet, MyNearWallet и др.
 */

import type { NearConnector, WalletManifest } from '@hot-labs/near-connect';

const NETWORK = (import.meta.env.VITE_NEAR_NETWORK as string) || 'testnet';
/** contractId для ключа доступа при signIn (можно placeholder для read-only). */
const APP_CONTRACT_ID = import.meta.env.VITE_NEAR_APP_CONTRACT_ID || 'nftower.game';

const MANIFEST_URLS = [
  'https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/manifest.json',
  'https://cdn.jsdelivr.net/gh/hot-dao/near-selector@main/repository/manifest.json',
];

/** Id кошельков, которые должны показываться на testnet (в манифесте у них нет features.testnet). */
const WALLET_IDS_TO_SHOW_ON_TESTNET = ['hot-wallet', 'mynearwallet'];

let connectorInstance: NearConnector | null = null;

/**
 * Загружает манифест (пробуем несколько URL для надёжности на Vercel/CDN) и добавляет
 * testnet: true для HOT Wallet и MyNearWallet, чтобы они отображались при network === 'testnet'.
 */
async function loadManifestWithHotWalletOnTestnet(): Promise<{
  wallets: Array<Record<string, unknown>>;
  version: string;
}> {
  let lastError: Error | null = null;
  for (const url of MANIFEST_URLS) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const data = (await res.json()) as { wallets: Array<Record<string, unknown>>; version: string };
      const network = NETWORK as string;
      if (network !== 'testnet') return data;
      data.wallets = data.wallets.map((w) => {
        if (!WALLET_IDS_TO_SHOW_ON_TESTNET.includes((w.id as string) ?? '')) return w;
        const features = (w.features as Record<string, unknown>) ?? {};
        return { ...w, features: { ...features, testnet: true } };
      });
      return data;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('Failed to load wallet manifest');
}

/**
 * Инициализация NEAR Connect (HOT Wallet, MyNearWallet и др.). Вызывать один раз при загрузке.
 */
export async function initNearWallet(): Promise<NearConnector | null> {
  if (connectorInstance) return connectorInstance;
  if (typeof window === 'undefined') return null;

  try {
    const { NearConnector } = await import('@hot-labs/near-connect');
    const network = NETWORK as 'mainnet' | 'testnet';
    const baseOptions = {
      network,
      signIn: { contractId: APP_CONTRACT_ID, methodNames: [] },
      footerBranding: null,
    };
    try {
      const manifestRaw = await loadManifestWithHotWalletOnTestnet();
      const manifest = manifestRaw as unknown as { wallets: WalletManifest[]; version: string };
      connectorInstance = new NearConnector({ ...baseOptions, manifest });
    } catch (manifestErr) {
      console.warn('NearWallet: custom manifest load failed, using library default', manifestErr);
      connectorInstance = new NearConnector(baseOptions);
    }
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
