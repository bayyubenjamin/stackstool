# Genesis One | Stacks Ecosystem Interface

**Genesis One** is a decentralized application (dApp) built on the Stacks blockchain designed to gamify user onboarding and identity verification. The platform integrates secure wallet authentication, an XP-based progression system, and on-chain interaction tasks, powered by a reactive frontend and a Supabase backend.

![Project Status](https://img.shields.io/badge/status-live%20mainnet-success.svg)
![Blockchain](https://img.shields.io/badge/blockchain-Stacks%20(Bitcoin%20L2)-purple.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 🌟 Key Features

### 🔐 Secure Authentication & Identity
- **Stacks Wallet Integration:** Seamless connection using `@stacks/connect` (supporting Leather, Xverse, and other SIP-18 wallets).
- **Identity Persistence:** User profiles are automatically synced between the blockchain wallet and the Supabase database.

### 🎮 Gamified Progression System
- **XP & Leveling:** Users earn Experience Points (XP) to increase their "Security Level" within the platform.
- **Soulbound Badges:** Non-transferable tokens (SBT) minted directly to the user's wallet upon reaching specific milestones.
- **Daily Check-ins:** Recurring on-chain rewards for active daily participation.
- **Real-time Updates:** Immediate UI feedback (Optimistic UI) for level-ups and reward claims.

### 📋 Mission Control
- **Task Tracking:** Interactive mission list (e.g., Ecosystem Access, Network Signal).
- **Smart Contract Verification:** Validates task completion on-chain before awarding XP.
- **State Management:** Tracks completed tasks, prevents duplicate rewards, and persists progress across sessions.

### ⚡ Modern UI/UX
- **Responsive Dashboard:** Built with **Tailwind CSS** for a futuristic, "Cyber/Dark Mode" aesthetic.
- **Performance:** Powered by **Vite** for lightning-fast HMR and build times.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18  
- **Build Tool:** Vite  
- **Styling:** Tailwind CSS  
- **State Management:** React Hooks  

### Blockchain (Web3)
- **Language:** Clarity Smart Contracts  
- **Network:** Stacks Mainnet (Bitcoin Layer 2)  
- **SDK:** Stacks.js (`@stacks/connect`, `@stacks/transactions`)  
- **Development Tool:** Clarinet  

### Backend (Web2)
- **Database:** Supabase (PostgreSQL)  
- **Realtime:** Supabase Realtime Subscription  

---

## 📜 Smart Contracts

The platform operates using three interconnected smart contracts deployed on the Stacks Mainnet:

| Contract Name      | Functionality                                      | Status     |
|-------------------|----------------------------------------------------|------------|
| **Genesis Core**  | Main controller for XP, Levels, and Logic.         | ✅ Active  |
| **Genesis Badges**| SIP-009 NFT (Soulbound) for user achievements.     | ✅ Active  |
| **Genesis Missions** | Manages daily check-ins and task validation.   | ✅ Active  |

> **Deployer Address:** `SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3`

---

## 🚀 Getting Started

Follow these steps to set up the project locally for development.

### Prerequisites
- Node.js (v18 or higher)
- A Stacks Wallet extension (Leather or Xverse) installed in your browser.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bayyubenjamin/stacksone.git
   cd stacksone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**

   Create a `.env` file in the root directory and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```
src/
├── components/        # UI Components (Layout, Sidebar, Cards)
├── pages/             # Main Views (Home, Tasks, Profile)
├── assets/            # Static assets (Images, Icons)
├── contracts/         # Clarity Smart Contracts source code
├── polyfills.js       # Buffer & Global polyfills for Web3 compatibility
├── supabaseClient.js  # Supabase configuration
├── App.jsx            # Main Logic, Routing & Contract Calls
└── main.jsx           # Entry point
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project  
2. Create your feature branch  
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes  
   ```bash
   git commit -m "Add some AmazingFeature"
   ```
4. Push to the branch  
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request  

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="center">
Built with ❤️ for the Stacks Ecosystem
</p>
