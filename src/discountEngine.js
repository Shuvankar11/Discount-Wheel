/**
 * The Nail Canvas - Discount Engine
 * Implements shop criteria:
 * - Wheel has 10%, 20%, 30%, 40%, 50%
 * - Every 10th customer gets guaranteed 40% or 50%
 * - Customers 1-9 get standard 10%, 20%, or 30%
 */

// 10 Segments distributed symmetrically around the wheel
export const WHEEL_SEGMENTS = [
  { index: 0, discount: 10, label: '10% OFF', color: '#C97A7E', textColor: '#FFFFFF', sub: 'GLOW' },
  { index: 1, discount: 20, label: '20% OFF', color: '#59253A', textColor: '#FDE2E4', sub: 'CHIC' },
  { index: 2, discount: 30, label: '30% OFF', color: '#B8860B', textColor: '#FFFFFF', sub: 'LUXE' },
  { index: 3, discount: 10, label: '10% OFF', color: '#C97A7E', textColor: '#FFFFFF', sub: 'GLOW' },
  { index: 4, discount: 40, label: '40% OFF', color: '#800020', textColor: '#FFDF78', sub: 'SPECIAL', isHigh: true },
  { index: 5, discount: 20, label: '20% OFF', color: '#59253A', textColor: '#FDE2E4', sub: 'CHIC' },
  { index: 6, discount: 10, label: '10% OFF', color: '#C97A7E', textColor: '#FFFFFF', sub: 'GLOW' },
  { index: 7, discount: 30, label: '30% OFF', color: '#B8860B', textColor: '#FFFFFF', sub: 'LUXE' },
  { index: 8, discount: 50, label: '50% OFF', color: '#4A0E17', textColor: '#FFD700', sub: 'JACKPOT', isHigh: true },
  { index: 9, discount: 20, label: '20% OFF', color: '#59253A', textColor: '#FDE2E4', sub: 'CHIC' },
];

const STORAGE_KEYS = {
  SPIN_COUNT: 'tnc_spin_counter_v1',
  SPIN_COUNT_BACKUP: 'tnc_spin_counter_backup_v1',
  HISTORY: 'tnc_history_v1',
  CONFIG: 'tnc_config_v1',
  ADMIN_PIN: 'tnc_admin_pin_v1'
};

const DEFAULT_CONFIG = {
  jackpotInterval: 10, // Every 10th customer
  shopName: 'The Nail Canvas',
  forceNextJackpot: false,
};

// Safe storage access with error fallback
export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Storage error:', e.message);
  }
}

/**
 * Bulletproof persistent spin counter:
 * Checks primary key, backup key, and history log length.
 * Can NEVER lose count even if the app or browser is killed from recent apps!
 */
export function getSpinCount() {
  try {
    const primary = parseInt(localStorage.getItem(STORAGE_KEYS.SPIN_COUNT) || '0', 10);
    const backup = parseInt(localStorage.getItem(STORAGE_KEYS.SPIN_COUNT_BACKUP) || '0', 10);
    
    let historyCount = 0;
    try {
      const historyRaw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (Array.isArray(history)) historyCount = history.length;
      }
    } catch {}

    const validPrimary = isNaN(primary) ? 0 : primary;
    const validBackup = isNaN(backup) ? 0 : backup;

    return Math.max(validPrimary, validBackup, historyCount);
  } catch {
    return 0;
  }
}

export function setSpinCount(count) {
  try {
    const safeCount = String(Math.max(0, count));
    localStorage.setItem(STORAGE_KEYS.SPIN_COUNT, safeCount);
    localStorage.setItem(STORAGE_KEYS.SPIN_COUNT_BACKUP, safeCount);
  } catch (e) {
    console.warn('Storage error:', e.message);
  }
}

export function resetAllCounters() {
  try {
    localStorage.setItem(STORAGE_KEYS.SPIN_COUNT, '0');
    localStorage.setItem(STORAGE_KEYS.SPIN_COUNT_BACKUP, '0');
    localStorage.setItem(STORAGE_KEYS.HISTORY, '[]');
  } catch (e) {
    console.warn('Reset error:', e.message);
  }
}

export function getAdminPin() {
  try {
    const pin = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    if (!pin || pin === '1234') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '8967');
      return '8967';
    }
    return pin;
  } catch {
    return '8967';
  }
}

export function setAdminPin(newPin) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, String(newPin).trim());
  } catch (e) {
    console.warn('Storage error:', e.message);
  }
}

export function getSpinHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordSpinResult(record) {
  try {
    const history = getSpinHistory();
    history.unshift(record);
    // Keep last 500 records
    if (history.length > 500) history.pop();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.warn('History storage error:', e.message);
  }
}

export function updateHistoryClaimStatus(voucherCode, redeemed) {
  try {
    const history = getSpinHistory();
    const item = history.find(h => h.voucherCode === voucherCode);
    if (item) {
      item.redeemed = redeemed;
      item.redeemedAt = redeemed ? new Date().toISOString() : null;
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
      return true;
    }
  } catch (e) {
    console.warn('Update claim error:', e.message);
  }
  return false;
}

/**
 * Determines the outcome for the NEXT spin.
 * Rule:
 * - Every 10th customer gets either 40% or 50%.
 * - Customers 1-9 get standard 10%, 20%, or 30%.
 */
export function determineNextSpinOutcome() {
  const config = getStoredConfig();
  const currentTotalSpins = getSpinCount();
  const nextCustomerNumber = currentTotalSpins + 1;
  const interval = config.jackpotInterval || 10;

  // Check if this spin triggers the jackpot
  const isJackpotTurn = (nextCustomerNumber % interval === 0) || config.forceNextJackpot;

  let targetDiscount = 10;

  if (isJackpotTurn) {
    // 50% chance between 40% and 50%
    targetDiscount = Math.random() < 0.5 ? 40 : 50;
  } else {
    // Standard turn: Weighted probabilities for 10%, 20%, 30%
    // 50% chance for 10% OFF
    // 35% chance for 20% OFF
    // 15% chance for 30% OFF
    const rand = Math.random();
    if (rand < 0.50) {
      targetDiscount = 10;
    } else if (rand < 0.85) {
      targetDiscount = 20;
    } else {
      targetDiscount = 30;
    }
  }

  // Find all segments matching the target discount
  const matchingSegments = WHEEL_SEGMENTS.filter(s => s.discount === targetDiscount);
  // Pick one matching segment at random if multiple exist
  const selectedSegment = matchingSegments[Math.floor(Math.random() * matchingSegments.length)];

  // Calculate cycle progress
  const cycleIndex = ((nextCustomerNumber - 1) % interval) + 1;
  const spinsUntilJackpot = isJackpotTurn ? 0 : (interval - cycleIndex);

  return {
    customerNumber: nextCustomerNumber,
    discount: targetDiscount,
    segment: selectedSegment,
    isJackpot: targetDiscount >= 40,
    cycleIndex,
    interval,
    spinsUntilJackpot,
    forced: !!config.forceNextJackpot
  };
}

/**
 * Generates a unique, high-entropy salon voucher code
 * Format: TNC-[DISCOUNT]-[RANDOM_4_ALPHANUM]
 */
export function generateVoucherCode(discount) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TNC-${discount}-${rand}`;
}
