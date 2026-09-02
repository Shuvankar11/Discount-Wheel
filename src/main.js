/**
 * The Nail Canvas - Main Controller (Mobile-Optimized)
 * Direct center-spin interaction with zero form friction,
 * adhering to strict customer criteria:
 * - 10%, 20%, 30%, 40%, 50%
 * - Every 10th customer unlocks guaranteed 40% or 50%
 * - Non-10th customers receive 10%, 20%, or 30%
 */

import confetti from 'canvas-confetti';
import { ThreeWheel } from './threeWheel.js';
import { soundEngine } from './soundEngine.js';
import {
  determineNextSpinOutcome,
  generateVoucherCode,
  getSpinCount,
  setSpinCount,
  getSpinHistory,
  recordSpinResult,
  getStoredConfig,
  saveConfig,
  getAdminPin,
  updateHistoryClaimStatus,
  resetAllCounters
} from './discountEngine.js';

// DOM Elements
const threeContainer = document.getElementById('threeContainer');
const btnCenterSpin = document.getElementById('btnCenterSpin');

// Audio controls
const btnAudioToggle = document.getElementById('btnAudioToggle');
const iconVolumeOn = document.getElementById('iconVolumeOn');
const iconVolumeMute = document.getElementById('iconVolumeMute');

// Winner Modal Elements
const winnerModal = document.getElementById('winnerModal');
const winnerDiscountAmount = document.getElementById('winnerDiscountAmount');
const winnerPrizeSub = document.getElementById('winnerPrizeSub');
const vdDiscountText = document.getElementById('vdDiscountText');
const btnNextCustomer = document.getElementById('btnNextCustomer');

// Admin Modal Elements
const btnStaffPanel = document.getElementById('btnStaffPanel');
const adminModal = document.getElementById('adminModal');
const btnCloseAdmin = document.getElementById('btnCloseAdmin');
const adminPinView = document.getElementById('adminPinView');
const adminDashboardView = document.getElementById('adminDashboardView');
const adminPinInput = document.getElementById('adminPinInput');
const btnUnlockAdmin = document.getElementById('btnUnlockAdmin');
const pinError = document.getElementById('pinError');
const statTotalSpins = document.getElementById('statTotalSpins');
const statCurrentCycle = document.getElementById('statCurrentCycle');
const statNextJackpotIn = document.getElementById('statNextJackpotIn');
const statTotalHighWins = document.getElementById('statTotalHighWins');
const btnForceJackpot = document.getElementById('btnForceJackpot');
const btnResetCycle = document.getElementById('btnResetCycle');
const btnExportCsv = document.getElementById('btnExportCsv');
const historyTableBody = document.getElementById('historyTableBody');
const historyCountBadge = document.getElementById('historyCountBadge');

// State
let threeWheel = null;
let currentVoucherRecord = null;
let audioEnabled = true;

/**
 * Initialize Application
 */
function init() {
  threeWheel = new ThreeWheel(threeContainer);
  setupEvents();
}

/**
 * Secret cycle tracker runs strictly in backend & staff dashboard
 */
function updateCycleDisplay() {
  // Kept secret from customers - only visible in Admin Panel
}

/**
 * Execute Spin
 */
function handleSpinClick() {
  if (threeWheel.isSpinning) return;

  // Pre-determine outcome strictly according to shop criteria
  const outcome = determineNextSpinOutcome();

  // Disable center button during spin
  btnCenterSpin.disabled = true;

  // Increment spin count in persistent storage
  setSpinCount(outcome.customerNumber);

  // Reset forceNextJackpot if active
  const config = getStoredConfig();
  if (config.forceNextJackpot) {
    config.forceNextJackpot = false;
    saveConfig(config);
  }

  // Trigger 3D wheel spin
  threeWheel.spinTo(outcome, () => {
    onSpinFinished(outcome);
  });
}

/**
 * Handle Spin Completion
 */
function onSpinFinished(outcome) {
  btnCenterSpin.disabled = false;

  const voucherCode = generateVoucherCode(outcome.discount);
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  currentVoucherRecord = {
    customerNumber: outcome.customerNumber,
    discount: outcome.discount,
    isJackpot: outcome.isJackpot,
    voucherCode,
    timestamp: now.toISOString(),
    formattedDate: dateFormatted,
    redeemed: false
  };

  recordSpinResult(currentVoucherRecord);

  // Sound and confetti celebration
  if (outcome.isJackpot) {
    soundEngine.playWinJackpot();
    launchMegaConfetti();
  } else {
    soundEngine.playWinNormal();
    launchStandardConfetti();
  }

  // Populate voucher modal safely via textContent
  winnerDiscountAmount.textContent = `${outcome.discount}%`;
  winnerPrizeSub.textContent = outcome.isJackpot ? '✦ MEGA JACKPOT DISCOUNT ✦' : 'LUCKY DRAW DISCOUNT';
  vdDiscountText.textContent = `${outcome.discount}% OFF`;

  // Display Winner Modal
  winnerModal.classList.add('active');

  // Refresh live cycle display
  updateCycleDisplay();
}

/**
 * Standard Confetti Shower
 */
function launchStandardConfetti() {
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { y: 0.65 },
    colors: ['#D4AF37', '#E5989B', '#FFFFFF', '#F2C8BD']
  });
}

/**
 * Grand Mega Jackpot Confetti Fireworks
 */
function launchMegaConfetti() {
  const duration = 2.5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF1493', '#FFFFFF']
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF1493', '#FFFFFF']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Setup All Event Listeners
 */
function setupEvents() {
  // Center spin button click
  btnCenterSpin.addEventListener('click', handleSpinClick);

  // Also tapping on the 3D canvas triggers spin
  threeContainer.addEventListener('click', (e) => {
    if (e.target !== btnCenterSpin && !btnCenterSpin.contains(e.target)) {
      handleSpinClick();
    }
  });

  // Audio mute/unmute
  btnAudioToggle.addEventListener('click', () => {
    audioEnabled = soundEngine.toggleSound();
    if (audioEnabled) {
      iconVolumeOn.style.display = 'block';
      iconVolumeMute.style.display = 'none';
    } else {
      iconVolumeOn.style.display = 'none';
      iconVolumeMute.style.display = 'block';
    }
  });

  // Next Customer / Spin Again
  btnNextCustomer.addEventListener('click', () => {
    winnerModal.classList.remove('active');
  });

  // Staff Modal Open
  btnStaffPanel.addEventListener('click', () => {
    adminModal.classList.add('active');
    adminPinInput.value = '';
    pinError.style.display = 'none';
    adminPinView.style.display = 'block';
    adminDashboardView.style.display = 'none';
    adminPinInput.focus();
  });

  // Close Admin Modal
  btnCloseAdmin.addEventListener('click', () => {
    adminModal.classList.remove('active');
  });

  // Admin PIN Unlock
  btnUnlockAdmin.addEventListener('click', checkAdminPin);
  adminPinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkAdminPin();
  });

  // Admin Controls
  btnForceJackpot.addEventListener('click', () => {
    const config = getStoredConfig();
    config.forceNextJackpot = !config.forceNextJackpot;
    saveConfig(config);
    if (config.forceNextJackpot) {
      btnForceJackpot.textContent = 'Jackpot FORCED for Next Spin!';
      btnForceJackpot.style.background = '#22c55e';
      btnForceJackpot.style.color = '#000';
    } else {
      btnForceJackpot.textContent = 'Force Jackpot Next Spin';
      btnForceJackpot.style.background = '';
      btnForceJackpot.style.color = '';
    }
    updateCycleDisplay();
  });

  btnResetCycle.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the customer count back to 0?')) {
      resetAllCounters();
      renderAdminDashboard();
    }
  });

  btnExportCsv.addEventListener('click', exportHistoryToCsv);
}

/**
 * Validate Admin PIN
 */
function checkAdminPin() {
  const entered = adminPinInput.value.trim();
  const correctPin = getAdminPin();

  if (entered === correctPin) {
    pinError.style.display = 'none';
    adminPinView.style.display = 'none';
    adminDashboardView.style.display = 'block';
    renderAdminDashboard();
  } else {
    pinError.style.display = 'block';
  }
}

/**
 * Render Admin Dashboard Data
 */
function renderAdminDashboard() {
  const totalSpins = getSpinCount();
  const config = getStoredConfig();
  const interval = config.jackpotInterval || 10;
  const history = getSpinHistory();

  const cycleIndex = (totalSpins % interval);
  const spinsToJackpot = interval - cycleIndex;
  const highWins = history.filter(h => h.discount >= 40).length;

  statTotalSpins.textContent = String(totalSpins);
  statCurrentCycle.textContent = `${cycleIndex} / ${interval}`;
  statNextJackpotIn.textContent = String(spinsToJackpot);
  statTotalHighWins.textContent = String(highWins);
  historyCountBadge.textContent = `${history.length} Records`;

  historyTableBody.replaceChildren();

  if (history.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.setAttribute('colspan', '5');
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '1.5rem';
    emptyCell.textContent = 'No customer spins recorded yet.';
    emptyRow.appendChild(emptyCell);
    historyTableBody.appendChild(emptyRow);
    return;
  }

  history.forEach(item => {
    const row = document.createElement('tr');

    // Customer #
    const tdNum = document.createElement('td');
    tdNum.textContent = `#${item.customerNumber}`;
    row.appendChild(tdNum);

    // Discount
    const tdDisc = document.createElement('td');
    tdDisc.textContent = `${item.discount}% OFF`;
    tdDisc.style.fontWeight = 'bold';
    tdDisc.style.color = item.discount >= 40 ? '#FFD700' : '#ffffff';
    row.appendChild(tdDisc);

    // Voucher Code
    const tdCode = document.createElement('td');
    tdCode.textContent = item.voucherCode;
    tdCode.style.fontFamily = 'monospace';
    row.appendChild(tdCode);

    // Time
    const tdTime = document.createElement('td');
    tdTime.textContent = item.formattedDate || (new Date(item.timestamp)).toLocaleDateString();
    row.appendChild(tdTime);

    // Action (Claim toggle)
    const tdAct = document.createElement('td');
    const claimBtn = document.createElement('button');
    claimBtn.className = `badge-redeemed ${item.redeemed ? 'claimed' : 'unclaimed'}`;
    claimBtn.textContent = item.redeemed ? 'Redeemed' : 'Mark Claimed';
    claimBtn.type = 'button';
    claimBtn.style.cursor = 'pointer';

    claimBtn.addEventListener('click', () => {
      const newState = !item.redeemed;
      updateHistoryClaimStatus(item.voucherCode, newState);
      renderAdminDashboard();
    });

    tdAct.appendChild(claimBtn);
    row.appendChild(tdAct);

    historyTableBody.appendChild(row);
  });
}

/**
 * Export Customer History to CSV for Salon Staff
 */
function exportHistoryToCsv() {
  const history = getSpinHistory();
  if (history.length === 0) {
    alert('No records to export yet.');
    return;
  }

  let csv = 'Customer Number,Discount,Voucher Code,Timestamp,Redeemed\n';
  history.forEach(h => {
    const discount = `${h.discount}%`;
    const code = `"${h.voucherCode}"`;
    const time = `"${h.timestamp}"`;
    const redeemed = h.redeemed ? 'YES' : 'NO';
    csv += `${h.customerNumber},${discount},${code},${time},${redeemed}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TheNailCanvas_Discounts_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
