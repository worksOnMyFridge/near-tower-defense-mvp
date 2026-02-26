/**
 * Список кошельков для near-connect (в коде, чтобы гарантированно попадал в сборку).
 * HOT Wallet всегда первый.
 */
import type { WalletManifest } from '@hot-labs/near-connect';

const asManifest = (w: Record<string, unknown>) => w as unknown as WalletManifest;

/** Порядок: MyNearWallet первым, затем HOT Wallet (проверка — библиотека может скрывать 1-й элемент). */
function buildWalletList(): WalletManifest[] {
  const hot = asManifest({
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
    features: { signMessage: true, signInWithoutAddKey: true, signAndSendTransaction: true, signAndSendTransactions: true, testnet: true },
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
  });
  const rest = [
  asManifest({
    id: 'mynearwallet',
    name: 'MyNearWallet',
    icon: 'https://storage.herewallet.app/upload/d0544304123d10518af961a15d5722ff1cef7abf62155f830e6d733e41f7da4b.png',
    description: 'Web wallet for NEAR.',
    website: 'https://mynearwallet.com',
    version: '1.0.0',
    executor: 'https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/mnw.js',
    type: 'sandbox',
    platform: { web: 'https://app.mynearwallet.com' },
    features: { signMessage: true, signInWithoutAddKey: true, signAndSendTransaction: true, signAndSendTransactions: true, testnet: true },
    permissions: { storage: true, allowsOpen: ['https://app.mynearwallet.com'] },
  }),
  asManifest({
    id: 'meteor-wallet',
    name: 'Meteor Wallet',
    icon: 'https://raw.githubusercontent.com/Meteor-Wallet/meteor_wallet_sdk/main/assets/meteor-logo-svg.svg',
    description: 'The most simple and secure wallet to manage your crypto, access DeFi, and explore Web3',
    website: 'https://meteorwallet.app/',
    version: '1.1.0',
    executor: 'https://raw.githubusercontent.com/Meteor-Wallet/meteor_wallet_sdk/data-storage/storage/meteor-near-connect-latest.js',
    type: 'sandbox',
    platform: { web: 'https://wallet.meteorwallet.app', chrome: '' },
    features: { signMessage: true, signInWithoutAddKey: true, signAndSendTransaction: true, signAndSendTransactions: true, mainnet: true, testnet: true },
    permissions: { storage: true, allowsOpen: [], external: ['meteorCom', 'meteorComV2'] },
  }),
  asManifest({
    id: 'intear-wallet',
    name: 'Intear Wallet',
    icon: 'https://storage.herewallet.app/upload/3f24b26bb142cd65ee694b78f8b3004976ebd97d9fc82f4c07d99b27bc124672.png',
    description: 'A fast and secure wallet for everyday interactions with dapps',
    website: 'https://intea.rs/',
    version: '1.0.0',
    executor: 'https://wallet.intear.tech/near-selector.js',
    type: 'sandbox',
    platform: { web: 'https://wallet.intear.tech' },
    features: { signMessage: true, signAndSendTransaction: true, signAndSendTransactions: true, signInWithoutAddKey: true, testnet: true },
    permissions: { storage: true, location: true, allowsOpen: ['https://wallet.intear.tech', 'intear://'] },
  }),
  asManifest({
    id: 'near-mobile',
    name: 'NEAR Mobile',
    icon: 'https://storage.herewallet.app/upload/179839f01189bc54afea2fd34eb092ddb6d63c97b5c8c9e418317285fd751f0c.webp',
    description: 'Discover the only NEAR wallet you will need: NEAR Mobile',
    website: 'https://nearmobile.app',
    version: '1.0.0',
    executor: 'https://raw.githubusercontent.com/hot-dao/near-selector/refs/heads/main/repository/near-mobile.js',
    type: 'sandbox',
    platform: { android: '', ios: '' },
    features: { signMessage: true, signInWithoutAddKey: true, signAndSendTransaction: true, signAndSendTransactions: true, testnet: true },
    permissions: { storage: true, allowsOpen: [] },
  }),
  asManifest({
    id: 'near-cli',
    name: 'NEAR CLI',
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%231a1a2e'/%3E%3Cpolyline points='18 40 28 30 18 20' fill='none' stroke='%2300d4aa' stroke-width='3'/%3E%3Cline x1='32' y1='42' x2='46' y2='42' stroke='%2300d4aa' stroke-width='3'/%3E%3C/svg%3E",
    description: 'Sign transactions using near-cli-rs in your terminal',
    website: 'https://near.cli.rs',
    version: '1.0.0',
    executor: 'https://raw.githubusercontent.com/near/near-cli-connect/refs/heads/main/dist/near-cli.js',
    type: 'sandbox',
    platform: {},
    features: { signMessage: true, signInWithoutAddKey: true, signAndSendTransaction: true, signAndSendTransactions: true, mainnet: true, testnet: true },
    permissions: { storage: true, clipboardWrite: true },
  }),
  ];
  return [rest[0], hot, ...rest.slice(1)];
}

export const WALLET_MANIFESTS: WalletManifest[] = buildWalletList();
