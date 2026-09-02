# 💅 The Nail Canvas - 3D Luxury Discount Spin Wheel

A high-end, 3D WebGL interactive Discount Spin Wheel web application designed exclusively for **The Nail Canvas** luxury nail studio & salon.

---

## ✨ Features & Highlights

1. **Realistic 3D Wheel (Three.js WebGL)**:
   - Built with metallic gold bevels, glossy salon lacquer slices, 3D golden studs/pegs around the perimeter, and a center monogram medallion (`TNC`).
   - Dynamic 3D lighting with studio specular reflections and velvet rose accents.
   - Realistic 3D metallic pointer with mechanical tick bounce physics.
   - 3D ambient cosmetic glitter particles drifting in space with interactive mouse/touch parallax tilt.

2. **Accurate Shop Criteria & Logic Engine**:
   - Wheel segments: **10%, 20%, 30%, 40%, 50%**.
   - **Criteria Rule**:
     - Regular customers (spins 1 to 9): Strictly receive **10%, 20%, or 30%** discount.
     - **Every 10th customer** (spins 10, 20, 30, ...): Unlocks the **Mega Jackpot** with a guaranteed **40% or 50%** discount!
   - Persistent customer count tracked in `localStorage` (retains state across page refreshes).

3. **Audio-Visual Immersion (Zero Dependencies)**:
   - Native Web Audio API sound synthesizer:
     - Mechanical ratchet clicks synchronized with peg hits.
     - Spin swoosh effect.
     - Normal win melody chime.
     - Grand brass fanfare + firework sparkles for 40% & 50% Jackpots.
   - Dual-cannon golden confetti fireworks for celebration.

4. **Digital Voucher Generation**:
   - Generates a branded digital discount certificate for each winning customer with:
     - Customer Name & Masked Mobile Number
     - Won Discount Percentage
     - Unique Anti-Fraud Voucher Code (e.g. `TNC-50-K892`)
     - Date & 7-day validity
     - Print / Save Voucher button & Copy Code button.

5. **Discreet Salon Staff / Admin Panel**:
   - Access via the lock icon in the top header (Default PIN: `1234`).
   - **Live Metrics**: Total spins, current cycle progress (`Customer X of 10`), countdown to next 40%/50% Jackpot.
   - **Staff Controls**:
     - Force Jackpot on next spin (for testing or VIP guests).
     - Reset cycle counter to 0.
   - **Audit Log Table**:
     - View all past customer spins, voucher codes, timestamps.
     - One-click "Mark as Redeemed" status toggle.
     - **Export to CSV**: Download full customer spin log to Excel/CSV with one click!

---

## 🚀 How to Run Locally

### Option 1: Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### Option 2: Production Preview
```bash
npm run build
npm run preview
```

### Option 3: Run Automated Verification Tests
```bash
npm test
```
Simulates 100 customer spins and tests all criteria mathematically.

---

## 🔒 Security & Code Quality

- **Zero Unsafe DOM Injections**: Strictly uses `textContent` and `createElement` avoiding any XSS vectors.
- **Strict Content Security Policy (CSP)** configured.
- **Customer Phone Masking** (e.g. `******3210`) to safeguard customer privacy on kiosk displays.
- **Local Persistence**: Zero sensitive data sent to external third-party servers.

---

## 🐙 GitHub Push Instructions

Jab aap bolenge tab hum GitHub pe push karenge. Uske liye steps:
```bash
git init
git add .
git commit -m "Initial commit: The Nail Canvas 3D Discount Spin Wheel"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```
