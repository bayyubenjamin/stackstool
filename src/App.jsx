import React, { useState, useEffect } from 'react';
import { connect, disconnect, isConnected, getLocalStorage, openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV } from '@stacks/transactions'; 
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

// --- KONFIGURASI KONTRAK (VERSI 2) ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3';
const CONTRACT_CORE = 'genesis-core-v4';

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);

  // State Database
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasCheckedIn, setHasCheckedIn] = useState(false); // State kunci untuk disable tombol
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

  // --- LOGIKA DATABASE & SINKRONISASI ---
  const fetchUserProfile = async (walletAddress) => {
    setLoading(true);
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    // Jika user baru, buat data default
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
      
      // FIX 1: Pastikan badge dibaca sebagai Object, bukan string
      const badges = typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges;
      setBadgesStatus(badges || { genesis: false, node: false, guardian: false });
      
      // FIX 2: Cek Tanggal untuk Validasi Daily Check-in
      if (user.last_checkin) {
        // Bandingkan tanggal terakhir check-in dengan hari ini (lokal user)
        const lastDate = new Date(user.last_checkin).toDateString();
        const todayDate = new Date().toDateString();
        setHasCheckedIn(lastDate === todayDate);
      } else {
        setHasCheckedIn(false);
      }
    }
    setLoading(false);
  };

  const updateDatabase = async (updates) => {
    if (!userData) return;
    const address = userData.profile.stxAddress.mainnet;
    
    // Debugging di console
    console.log("Saving to DB:", updates);

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
    // BLOCK DI FRONTEND: Kalau sudah check-in, hentikan fungsi!
    if (hasCheckedIn) return alert("You have already checked in today! Come back tomorrow.");
    if (!userData) return;

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_CORE,
      functionName: 'daily-check-in',
      functionArgs: [], 
      onFinish: (data) => {
        console.log("Check-in Tx:", data.txId);
        
        // Optimistic UI: Langsung update tampilan seolah sukses
        const newXP = userXP + 20;
        const newLevel = calculateLevel(newXP);
        setUserXP(newXP);
        setUserLevel(newLevel);
        setHasCheckedIn(true); // Langsung kunci tombol
        
        // Simpan ke database
        updateDatabase({ 
          xp: newXP, 
          level: newLevel, 
          last_checkin: new Date().toISOString() // Simpan timestamp sekarang
        });
        
        alert("Check-in Broadcasted! +20 XP");
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
      functionArgs: [uintCV(task.id), uintCV(task.reward)],
      onFinish: (data) => {
        const newXP = userXP + task.reward;
        const newLevel = calculateLevel(newXP);
        const newCompleted = [...completedTaskIds, taskId];
        
        setUserXP(newXP);
        setUserLevel(newLevel);
        setCompletedTaskIds(newCompleted);
        
        updateDatabase({ xp: newXP, level: newLevel, completed_tasks: newCompleted });
        alert(`Mission Submitted! +${task.reward} XP`);
      }
    });
  };

  // 3. Mint Badge
  const handleMint = async (badgeId) => {
    if (!userData) return alert("Connect Wallet Required");
    
    // BLOCK DI FRONTEND: Kalau sudah punya, jangan mint lagi
    if (badgesStatus[badgeId]) return alert("You already own this badge!");

    await openContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_CORE,
      functionName: 'claim-badge',
      functionArgs: [stringAsciiCV(badgeId)],
      onFinish: (data) => {
        console.log("Mint Tx:", data.txId);
        
        // Optimistic UI: Tandai badge sebagai 'true' (Owned)
        const newBadges = { ...badgesStatus, [badgeId]: true };
        setBadgesStatus(newBadges);
        
        updateDatabase({ badges: newBadges }); // Simpan JSON object
        alert(`${badgeId.toUpperCase()} Badge Minting...`);
      }
    });
  };

  // --- RENDER ---
  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-stx-accent font-mono animate-pulse">Syncing User Data...</div>;

    switch (activeTab) {
      case 'home':
        // Pass 'hasCheckedIn' ke Home biar tombolnya bisa didisable
        return <Home 
          userData={userData} 
          userXP={userXP} 
          userLevel={userLevel} 
          badgesStatus={badgesStatus} 
          handleMint={handleMint} 
          connectWallet={connectWallet}
          hasCheckedIn={hasCheckedIn} 
        />;
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
