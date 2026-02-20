import React, { useState, useEffect } from 'react';
import { showConnect, openContractCall } from '@stacks/connect'; 
import { StacksMainnet } from '@stacks/network';
import { uintCV, stringAsciiCV, PostConditionMode } from '@stacks/transactions';
import { supabase, userSession } from './supabaseClient'; 
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';
import Vault from './pages/Vault';

// --- KONFIGURASI SMART CONTRACT ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; 
// PENTING: Pastikan CONTRACT_NAME ini sama persis dengan nama contract yang lu deploy
// Jika di Stacks Explorer namanya genesis-missions-v4, ubah menjadi 'genesis-missions-v4'
const CONTRACT_NAME = 'genesis-core-v5'; 

const MISSION_LIST = [
  { 
    id: 1, 
    name: "Credential Analysis", 
    desc: "Scan wallet history to verify protocol eligibility tier.", 
    reward: 50, 
    icon: "🛡️", 
    completed: false 
  },
  { 
    id: 2, 
    name: "Identity Verification", 
    desc: "Authenticate on-chain DID and sync reputation score.", 
    reward: 100, 
    icon: "🆔", 
    completed: false 
  },
  { 
    id: 3, 
    name: "Protocol Activation", 
    desc: "Execute the initial state transition to activate node.", 
    reward: 200, 
    icon: "⚡", 
    completed: false 
  }
];

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  
  // State User
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [badgesStatus, setBadgesStatus] = useState({ genesis: false, node: false, guardian: false });

  // --- HANDLING SESI ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (userSession.isUserSignedIn()) {
          const user = userSession.loadUserData(); 
          setUserData(user);
          fetchUserProfile(user.profile.stxAddress.mainnet);
        } else if (userSession.isSignInPending()) {
          const user = await userSession.handlePendingSignIn();
          setUserData(user);
          fetchUserProfile(user.profile.stxAddress.mainnet);
        }
      } catch (error) {
        console.error("⚠️ Session error:", error);
        if (error.message && error.message.includes('JSON data version')) {
            localStorage.removeItem('blockstack-session');
            window.location.reload();
        }
      }
    };
    checkSession();
  }, []);

  // --- FUNGSI LOGIN ---
  const connectWallet = () => {
    try {
      showConnect({
        appDetails: { name: 'Genesis Platform', icon: window.location.origin + '/vite.svg' },
        redirectTo: '/',
        onFinish: () => {
          const user = userSession.loadUserData();
          setUserData(user);
          fetchUserProfile(user.profile.stxAddress.mainnet);
        },
        userSession, 
      });
    } catch (err) {
      console.error("Connect error:", err);
    }
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUserData(null);
    setUserXP(0);
    setUserLevel(1);
  };

  const fetchUserProfile = async (walletAddress) => {
    try {
      let { data: user } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();
      if (user) {
        setUserXP(user.xp || 0);
        setUserLevel(user.level || 1);
        if (user.last_checkin) {
          const lastCheck = new Date(user.last_checkin).toDateString();
          const today = new Date().toDateString();
          setHasCheckedIn(lastCheck === today);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  // --- 1. LOGIKA CHECK-IN ---
  const handleCheckIn = async () => {
    if (!userData) return alert("Connect wallet first!");
    
    try {
      await openContractCall({
        network: new StacksMainnet(), 
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'daily-check-in',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log("Check-in tx sent:", data);
          setHasCheckedIn(true);
          setUserXP(prev => prev + 20);
        },
      });
    } catch (e) {
      console.error("Check-in error:", e);
    }
  };

  // --- 2. LOGIKA MINT BADGE ---
  const handleMintBadge = async (badgeType) => {
    if (!userData) return alert("Connect wallet first!");

    const badgeNameMap = {
      'genesis': 'genesis-badge',
      'node': 'node-badge',
      'guardian': 'guardian-badge'
    };

    const rawBadgeName = badgeNameMap[badgeType] || badgeType;
    if (!rawBadgeName) {
        console.error("Invalid Badge Type:", badgeType);
        return;
    }
    const safeBadgeName = String(rawBadgeName); 

    try {
      console.log(`Minting badge: ${safeBadgeName}`);
      
      await openContractCall({
        network: new StacksMainnet(), 
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'claim-badge',
        functionArgs: [stringAsciiCV(safeBadgeName)], 
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log(`Minting ${badgeType} sent:`, data);
          setBadgesStatus(prev => ({ ...prev, [badgeType]: true }));
        },
      });
    } catch (e) {
      console.error("Mint badge error details:", e);
    }
  };

  // --- 3. LOGIKA MISSION ---
  const handleCompleteMission = async (taskId) => {
    if (!userData) {
      alert("Connect wallet first!");
      return false; // Return false agar Tasks.jsx tahu proses batal
    }
    
    const task = MISSION_LIST.find(t => t.id === taskId);
    if (!task) {
        console.error("Task not found!");
        return false;
    }

    const numId = Number(taskId);
    const numReward = Number(task.reward);

    console.log(`Starting Mission: ${numId} Reward: ${numReward}`);

    // Return Promise agar sinkron dengan (await handleTask) di Tasks.jsx
    return new Promise((resolve) => {
      openContractCall({
        network: new StacksMainnet(), 
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'complete-mission',
        functionArgs: [uintCV(numId), uintCV(numReward)], 
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log("Mission tx sent:", data);
          setUserXP(prev => prev + task.reward);
          resolve(true); // Kirim sinyal sukses ke Tasks.jsx
        },
        onCancel: () => {
          console.log("Mission tx cancelled.");
          resolve(false); // Kirim sinyal batal ke Tasks.jsx
        }
      });
    });
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      walletButton={
        !userData ? 
        <button 
          onClick={connectWallet} 
          className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
        >
          CONNECT WALLET
        </button> :
        <button 
          onClick={disconnectWallet} 
          className="bg-slate-800 px-4 py-2 rounded-lg font-mono text-xs hover:bg-slate-700 transition-colors"
        >
          {userData.profile.stxAddress.mainnet.slice(0,5)}...{userData.profile.stxAddress.mainnet.slice(-5)}
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 animate-pulse">Initializing Protocol Interface...</p>
        </div>
      ) : (
        <>
          {activeTab === 'home' && (
            <Home 
              userData={userData} 
              userXP={userXP} 
              userLevel={userLevel} 
              badgesStatus={badgesStatus} 
              connectWallet={connectWallet} 
              hasCheckedIn={hasCheckedIn} 
              handleMint={handleMintBadge} 
            />
          )}
          
          {activeTab === 'tasks' && (
            <Tasks 
              initialTasks={MISSION_LIST} // Pakai initialTasks agar di-manage oleh komponen Tasks.jsx
              handleTask={handleCompleteMission} 
            />
          )}

          {activeTab === 'vault' && (
            <Vault 
              userData={userData} 
            />
          )}
          
          {activeTab === 'profile' && (
            <Profile 
              userData={userData} 
              userXP={userXP} 
              userLevel={userLevel} 
              hasCheckedIn={hasCheckedIn} 
              handleCheckIn={handleCheckIn} 
              disconnectWallet={disconnectWallet} 
            />
          )}
        </>
      )}
    </Layout>
  );
}

export default App;
