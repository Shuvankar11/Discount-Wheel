import { WHEEL_SEGMENTS, determineNextSpinOutcome, setSpinCount, getSpinCount } from './src/discountEngine.js';

// Mock localStorage for node environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  clear() { this.store = {}; }
};

console.log('--- STARTING VERIFICATION TESTS ---');

// Test 1: Verify all required segments exist on the wheel
const discountsOnWheel = [...new Set(WHEEL_SEGMENTS.map(s => s.discount))].sort((a, b) => a - b);
console.log('Discounts configured on wheel:', discountsOnWheel);
if (JSON.stringify(discountsOnWheel) !== JSON.stringify([10, 20, 30, 40, 50])) {
  console.error('FAIL: Wheel discounts do not match [10, 20, 30, 40, 50]!');
  process.exit(1);
}
console.log('PASS: Wheel contains exactly 10%, 20%, 30%, 40%, 50% segments.');

// Test 2: Simulate 100 customer spins and verify the 10th customer criteria
let errorCount = 0;
setSpinCount(0);

for (let i = 1; i <= 100; i++) {
  const outcome = determineNextSpinOutcome();
  
  if (outcome.customerNumber !== i) {
    console.error(`FAIL: Customer number mismatch. Expected ${i}, got ${outcome.customerNumber}`);
    errorCount++;
  }

  // Update spin count like the app does
  setSpinCount(outcome.customerNumber);

  const isTenth = (i % 10 === 0);

  if (isTenth) {
    // MUST be 40 or 50
    if (outcome.discount !== 40 && outcome.discount !== 50) {
      console.error(`FAIL: Turn ${i} is the 10th customer, but discount was ${outcome.discount}% (expected 40% or 50%)!`);
      errorCount++;
    } else {
      // verified
    }
  } else {
    // MUST NOT be 40 or 50, MUST be 10, 20, or 30
    if (outcome.discount === 40 || outcome.discount === 50) {
      console.error(`FAIL: Turn ${i} is customer ${i} (not 10th), but received high discount ${outcome.discount}%!`);
      errorCount++;
    }
    if (![10, 20, 30].includes(outcome.discount)) {
      console.error(`FAIL: Turn ${i} received unexpected discount ${outcome.discount}%!`);
      errorCount++;
    }
  }

  // Verify that the segment chosen matches the discount
  if (outcome.segment.discount !== outcome.discount) {
    console.error(`FAIL: Turn ${i} segment discount ${outcome.segment.discount} does not match outcome discount ${outcome.discount}!`);
    errorCount++;
  }
}

if (errorCount === 0) {
  console.log('PASS: All 100 customer simulations passed perfectly!');
  console.log('✔ Non-10th customers (turns 1-9, 11-19, etc.) strictly received 10%, 20%, or 30%.');
  console.log('✔ Every 10th customer (turns 10, 20, 30, 40, etc.) strictly received 40% or 50%!');
} else {
  console.error(`FAILED with ${errorCount} errors.`);
  process.exit(1);
}
