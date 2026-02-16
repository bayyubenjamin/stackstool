import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect, openContractCall } from '@stacks/connect';
import { StacksMainnet, StacksTestnet } from '@stacks/network'; // Sesuaikan network
import { uintCV, stringAsciiCV, PostConditionMode } from '@stacks/transactions';
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

// --- KONFIGURASI SMART CONTRACT ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; // Ganti dengan alamat deploy Anda jika beda
const CONTRACT_NAME = 'genesis-core-v4'; // Sesuai file Anda

// Konfigurasi Stacks Session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

// --- DATA MISI (Frontend Definition) ---
// ID harus sesuai dengan ID yang Anda atur di contract jika ada validasi, 
// tapi untuk V4 core 'complete-mission' menerima task-id uint bebas.
const MISSION_LIST = [
  { id: 1, name: "Follow Twitter", desc: "Follow @stacksone to stay updated.", reward: 50, icon: "🐦", completed: false },
  { id: 2, name: "Join Discord", desc: "Join our community server.", reward: 100, icon: "💬", completed: false },
  { id: 3, name: "First Transaction", desc: "Make your first transaction on Stacks.", reward: 200, icon: "💸", completed: false },
  { id: 4, name: "Share Profile", desc: "Share your genesis profile.", reward: 30, icon: "🔗", completed: false }
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
          await fetchUserProfile(user.profile.stxAddress.mainnet);
        } else if (userSession.isSignInPending()) {
          const user = await userSession.handlePendingSignIn();
          setUserData(user);
          await fetchUserProfile(user.profile.stxAddress.mainnet);
        }
      } catch (error) {
        console.error("⚠️ Sesi error, reset...", error);
        userSession.signUserOut(); 
        setUserData(null);
        window.location.reload(); 
      }
    };
    checkSession();
  }, []);

  // --- FUNGSI LOGIN ---
  const connectWallet = () => {
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
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUserData(null);
    setUserXP(0);
    setTasks(MISSION_LIST); // Reset tampilan task
  };

  const fetchUserProfile = async (walletAddress) => {
    setLoading(true);
    try {
      let { data: user } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();
      if (user) {
        setUserXP(user.xp || 0);
        setUserLevel(user.level || 1);
        if (user.last_checkin) {
          setHasCheckedIn(new Date(user.last_checkin).toDateString() === new Date().toDateString());
        }
        // Load completed tasks logic here if saved in DB
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    setLoading(false);
  };

  // --- 1. LOGIKA CHECK-IN (FIXED) ---
  const handleCheckIn = async () => {
    if (!userData) return alert("Connect wallet first!");
    
    // Panggil fungsi daily-check-in di genesis-core-v4
    await openContractCall({
      network: new StacksMainnet(), // Gunakan StacksTestnet() jika testing
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'daily-check-in',
      functionArgs: [], // Tidak butuh argumen
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log("Check-in Transaction sent:", data);
        setHasCheckedIn(true); // Update UI Optimistik
        // Opsional: Simpan timestamp ke Supabase agar persisten
      },
    });
  };

  // --- 2. LOGIKA MINT BADGE (FIXED) ---
  const handleMintBadge = async (badgeType) => {
    if (!userData) return alert("Connect wallet first!");

    // Mapping nama badge di UI ke nama di Contract
    // Pastikan string ini match dengan 'badge-name' di create-badge contract Anda
    const badgeNameMap = {
      'genesis': 'genesis-badge', // Contoh: sesuaikan dengan nama di contract
      'node': 'node-badge',
      'guardian': 'guardian-badge'
    };

    const contractBadgeName = badgeNameMap[badgeType] || badgeType;

    await openContractCall({
      network: new StacksMainnet(),
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'claim-badge',
      functionArgs: [stringAsciiCV(contractBadgeName)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log(`Minting ${badgeType} sent:`, data);
        // Update UI status badge jadi true (loading/pending)
        setBadgesStatus(prev => ({ ...prev, [badgeType]: true }));
      },
    });
  };

  // --- 3. LOGIKA MISSION (FIXED) ---
  const handleCompleteMission = async (taskId) => {
    if (!userData) return alert("Connect wallet first!");
    
    // Cari reward task tersebut
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await openContractCall({
      network: new StacksMainnet(),
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'complete-mission',
      functionArgs: [uintCV(taskId), uintCV(task.reward)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log("Mission Transaction sent:", data);
        // Update state task jadi completed secara lokal
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      },
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
          {userData.profile.stxAddress.mainnet.slice(0,5)}...
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-400 animate-pulse">Memuat profil...</p>
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
              // PASSING FUNGSI MINT KE HOME
              handleMint={handleMintBadge} 
            />
          )}
          
          {activeTab === 'tasks' && (
            <Tasks 
              // PASSING DATA TASKS YANG SUDAH DIISI
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
              // PASSING FUNGSI CHECK-IN YANG SUDAH FIX
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
