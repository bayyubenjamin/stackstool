import React, { useState, useEffect } from 'react';
import { connect, disconnect, isConnected, getLocalStorage, openContractCall } from '@stacks/connect';
// FIX 1: Ganti import 'uint' -> 'uintCV', 'stringAscii' -> 'stringAsciiCV'
import { uintCV, stringAsciiCV } from '@stacks/transactions'; 
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

// --- KONFIGURASI KONTRAK ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3';
const CONTRACT_CORE = 'genesis-core-v2';

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);

  // State Database (Tampilan Frontend)
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [badgesStatus, setBadgesStatus] = useState({
    genesis: false,
    node: false,
    guardian: false
  });

  const allTasks = [
    { id: 1, name: "Ecosystem Access", desc: "Connect with the official protocol channels.", reward: 50, icon: "🌐" },
    { id: 2, name: "Identity Verification", desc: "Verify your status in our secure server.", reward: 50, icon: "🛡️" },
    { id: 3, name: "Network Signal", desc: "Amplify the genesis announcement.", reward: 100, icon: "📡" },
  ];

  const tasksWithStatus = allTasks.map(task => ({
    ...task,
    completed: completedTaskIds.includes(task.id)
  }));

  useEffect(() => {
    if (isConnected()) {
      const storageData = getLocalStorage();
      const stxAddress = storageData?.addresses?.stx?.[0]?.address;
      if (stxAddress) {
        const legacyUserData = { profile: { stxAddress: { mainnet: stxAddress } } };
        setUserData(legacyUserData);
        fetchUserProfile(stxAddress);
      }
    }
  }, []);

  // --- SUPABASE SYNC ---
  const fetchUserProfile = async (walletAddress) => {
    setLoading(true);
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newUser } = await supabase
        .from('users')
        .insert([{ 
            wallet_address: walletAddress, 
            xp: 0, level: 1, completed_tasks: [],
            badges: { genesis: false, node: false, guardian: false }
        }]).select().single();
      user = newUser;
    }

    if (user) {
      setUserXP(user.xp || 0);
      setUserLevel(user.level || 1);
      setCompletedTaskIds(user.completed_tasks || []);
      setBadgesStatus(user.badges || { genesis: false, node: false, guardian: false });
      
      if (user.last_checkin) {
        const lastDate = new Date(user.last_checkin).toDateString();
        setHasCheckedIn(lastDate === new Date().toDateString());
      }
    }
    setLoading(false);
  };

  const updateDatabase = async (updates) => {
    if (!userData) return;
    const address = userData.profile.stxAddress.mainnet;
    await supabase.from('users').update(updates).eq('wallet_address', address);
  };

  const calculateLevel = (currentXP) => Math.floor(currentXP / 500) + 1;

  // --- WALLET CONNECT ---
  const connectWallet = async () => {
    try {
      const response = await connect({
        appDetails: { name: 'Genesis Platform', icon: window.location.origin + '/vite.svg' }
      });
      const stxInfo = response.addresses.find(a => a.symbol === 'STX') || response.addresses[0];
      if (stxInfo) {
        const legacyUserData = { profile: { stxAddress: { mainnet: stxInfo.address } } };
        setUserData(legacyUserData);
        fetchUserProfile(stxInfo.address);
      }
    } catch (error) { console.error("Connect failed:", error); }
  };

  const disconnectWallet = () => {
    disconnect();
    setUserData(null);
  };

  // --- WEB3 INTERACTIONS ---

  // 1. Daily Check-in
  const handleCheckIn = async () => {
    if (hasCheckedIn || !userData) return;

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_CORE,
      functionName: 'daily-check-in',
      functionArgs: [], 
      onFinish: (data) => {
        console.log("Check-in Tx:", data.txId);
        const newXP = userXP + 20;
        const newLevel = calculateLevel(newXP);
        setUserXP(newXP);
        setUserLevel(newLevel);
        setHasCheckedIn(true);
        updateDatabase({ xp: newXP, level: newLevel, last_checkin: new Date().toISOString() });
        alert("Check-in Transaction Broadcasted! +20 XP (Pending Confirmation)");
      },
    });
  };

  // 2. Complete Task
  const handleTask = async (taskId) => {
    if (!userData) return;
    const task = allTasks.find(t => t.id === taskId);
    if (!task || completedTaskIds.includes(taskId)) return;

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_CORE,
      functionName: 'complete-mission',
      functionArgs: [
        // FIX 2: Gunakan uintCV() bukan uint()
        uintCV(task.id),
        uintCV(task.reward)
      ],
      onFinish: (data) => {
        console.log("Mission Tx:", data.txId);
        const newXP = userXP + task.reward;
        const newLevel = calculateLevel(newXP);
        const newCompleted = [...completedTaskIds, taskId];
        setUserXP(newXP);
        setUserLevel(newLevel);
        setCompletedTaskIds(newCompleted);
        updateDatabase({ xp: newXP, level: newLevel, completed_tasks: newCompleted });
        alert(`Mission Submitted! +${task.reward} XP (Pending Confirmation)`);
      }
    });
  };

  // 3. Mint Badge
  const handleMint = async (badgeId) => {
    if (!userData) return alert("Connect Wallet Required");

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_CORE,
      functionName: 'claim-badge',
      functionArgs: [
        // FIX 3: Gunakan stringAsciiCV() bukan stringAscii()
        stringAsciiCV(badgeId)
      ],
      onFinish: (data) => {
        console.log("Mint Tx:", data.txId);
        const newBadges = { ...badgesStatus, [badgeId]: true };
        setBadgesStatus(newBadges);
        updateDatabase({ badges: newBadges });
        alert(`${badgeId.toUpperCase()} Badge Minting... Check your wallet!`);
      }
    });
  };

  // --- RENDER ---
  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-stx-accent font-mono animate-pulse">Synchronizing On-Chain Data...</div>;

    switch (activeTab) {
      case 'home':
        return <Home userData={userData} userXP={userXP} userLevel={userLevel} badgesStatus={badgesStatus} handleMint={handleMint} connectWallet={connectWallet} />;
      case 'tasks':
        return <Tasks tasks={tasksWithStatus} handleTask={handleTask} badgesStatus={badgesStatus} />;
      case 'profile':
        return <Profile userData={userData} userXP={userXP} userLevel={userLevel} hasCheckedIn={hasCheckedIn} handleCheckIn={handleCheckIn} disconnectWallet={disconnectWallet} />;
      default: return <Home />;
    }
  };

  const WalletButton = !userData ? (
    <button onClick={connectWallet} className="bg-stx-accent hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-lg shadow-blue-500/20">
      CONNECT STACKS
    </button>
  ) : (
    <button onClick={disconnectWallet} className="border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 text-xs font-mono px-4 py-2 rounded-lg transition">
      {userData.profile.stxAddress.mainnet.slice(0,4)}...{userData.profile.stxAddress.mainnet.slice(-4)}
    </button>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} walletButton={WalletButton}>
      {renderContent()}
    </Layout>
  );
}

export default App;
