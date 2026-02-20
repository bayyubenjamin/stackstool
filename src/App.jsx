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

// --- KONFIGURASI SMART CONTRACT V10 ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; 
const CONTRACT_NAME = 'genesis-core-v10'; // Diperbarui ke v10

const MISSION_LIST = [
  { id: 1, name: "Credential Analysis", desc: "Verify protocol eligibility tier.", reward: 50, icon: "🛡️", completed: false },
  { id: 2, name: "Identity Verification", desc: "Authenticate on-chain DID.", reward: 100, icon: "🆔", completed: false },
  { id: 3, name: "Protocol Activation", desc: "Activate initial node state.", reward: 200, icon: "⚡", completed: false }
];

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [badgesStatus, setBadgesStatus] = useState({ genesis: false, node: false, guardian: false });

  useEffect(() => {
    const checkSession = async () => {
      if (userSession.isUserSignedIn()) {
        const user = userSession.loadUserData(); 
        setUserData(user);
        fetchUserProfile(user.profile.stxAddress.mainnet);
      } else if (userSession.isSignInPending()) {
        const user = await userSession.handlePendingSignIn();
        setUserData(user);
        fetchUserProfile(user.profile.stxAddress.mainnet);
      }
    };
    checkSession();
  }, []);

  const fetchUserProfile = async (walletAddress) => {
    try {
      let { data: user } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();
      if (user) {
        setUserXP(user.xp || 0);
        setUserLevel(user.level || 1);
        if (user.last_checkin) {
          const lastCheck = new Date(user.last_checkin).toDateString();
          setHasCheckedIn(lastCheck === new Date().toDateString());
        }
      }
    } catch (error) { console.error("Error profile:", error); }
  };

  // --- LOGIKA MINT BADGE (CORE V10) ---
  const handleMintBadge = async (badgeType) => {
    if (!userData) return alert("Connect wallet first!");

    // Nama ini harus sama dengan yang didaftarkan via 'create-badge' di Core v10
    const badgeNameMap = {
      'genesis': 'genesis',
      'node': 'node',
      'guardian': 'guardian'
    };

    const rawBadgeName = badgeNameMap[badgeType] || badgeType;
    console.log(`Attempting to claim from Core v10: ${rawBadgeName}`);
    
    await openContractCall({
      network: new StacksMainnet(), 
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME, // genesis-core-v10
      functionName: 'claim-badge',
      functionArgs: [stringAsciiCV(rawBadgeName)], 
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log(`Minting ${badgeType} via Core v10 sent:`, data);
        setBadgesStatus(prev => ({ ...prev, [badgeType]: true }));
      },
    });
  };

  const handleCompleteMission = async (taskId) => {
    if (!userData) { alert("Connect wallet first!"); return false; }
    const task = MISSION_LIST.find(t => t.id === taskId);
    
    return new Promise((resolve) => {
      openContractCall({
        network: new StacksMainnet(), 
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME, // genesis-core-v10
        functionName: 'complete-mission',
        functionArgs: [uintCV(Number(taskId)), uintCV(Number(task.reward))], 
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log("Mission tx sent to Core v10:", data);
          setUserXP(prev => prev + task.reward);
          resolve(true);
        },
        onCancel: () => resolve(false)
      });
    });
  };

  const handleCheckIn = async () => {
    if (!userData) return alert("Connect wallet first!");
    await openContractCall({
      network: new StacksMainnet(), 
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME, // genesis-core-v10
      functionName: 'daily-check-in',
      functionArgs: [],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log("Check-in via Core v10 success");
        setHasCheckedIn(true);
        setUserXP(prev => prev + 20);
      },
    });
  };

  const connectWallet = () => {
    showConnect({ 
      userSession, 
      appDetails: {name: 'Genesis Platform', icon: window.location.origin + '/vite.svg'} 
    });
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      walletButton={
        !userData ? 
        <button onClick={connectWallet} className="bg-orange-500 px-4 py-2 rounded-lg font-bold text-xs transition-all">
          CONNECT WALLET
        </button> :
        <button onClick={() => { userSession.signUserOut(); setUserData(null); }} className="bg-slate-800 px-4 py-2 rounded-lg font-mono text-xs hover:bg-slate-700 transition-colors">
          {userData.profile.stxAddress.mainnet.slice(0,5)}...{userData.profile.stxAddress.mainnet.slice(-5)}
        </button>
      }
    >
      {activeTab === 'home' && (
        <Home 
          userData={userData} 
          userXP={userXP} 
          userLevel={userLevel} 
          badgesStatus={badgesStatus} 
          handleMint={handleMintBadge} 
          connectWallet={connectWallet}
        />
      )}
      
      {activeTab === 'tasks' && (
        <Tasks 
          initialTasks={MISSION_LIST} 
          handleTask={handleCompleteMission} 
        />
      )}

      {activeTab === 'vault' && <Vault userData={userData} />}
      
      {activeTab === 'profile' && (
        <Profile 
          userData={userData} 
          userXP={userXP} 
          userLevel={userLevel} 
          hasCheckedIn={hasCheckedIn} 
          handleCheckIn={handleCheckIn} 
          disconnectWallet={() => { userSession.signUserOut(); setUserData(null); }} 
        />
      )}
    </Layout>
  );
}

export default App;
