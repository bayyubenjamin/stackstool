import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect, openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network'; // FIX: Syntax v6
import { uintCV, stringAsciiCV, PostConditionMode } from '@stacks/transactions';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

// --- KONFIGURASI SMART CONTRACT ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; 
const CONTRACT_NAME = 'genesis-core-v4';

// Konfigurasi Stacks Session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// --- DATA MISI ---
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
  
  // State Tasks
  const [tasks, setTasks] = useState(MISSION_LIST);

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
    setTasks(MISSION_LIST);
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
        network: new StacksMainnet(), // FIX: Gunakan class v6
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
        network: new StacksMainnet(), // FIX: Gunakan class v6
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
    if (!userData) return alert("Connect wallet first!");
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error("Task not found!");
        return;
    }

    const numId = Number(taskId);
    const numReward = Number(task.reward);

    console.log(`Starting Mission: ${numId} Reward: ${numReward}`);

    try {
      await openContractCall({
        network: new StacksMainnet(), // FIX: Gunakan class v6
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'complete-mission',
        functionArgs: [uintCV(numId), uintCV(numReward)], 
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log("Mission tx sent:", data);
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
          setUserXP(prev => prev + task.reward);
        },
      });
    } catch (e) {
      console.error("Mission error details:", e);
    }
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
              tasks={tasks} 
              handleTask={handleCompleteMission} 
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
