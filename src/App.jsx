import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { supabase } from './supabaseClient'; // Import Supabase
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false); // Loading state untuk DB

  // --- STATE DATABASE (Disinkronkan dengan Supabase) ---
  const [userXP, setUserXP] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState([]); // Array ID task yg selesai
  const [hasMinted, setHasMinted] = useState(false);

  // Daftar Task Statis
  const allTasks = [
    { id: 1, name: "Follow Twitter", desc: "Follow @stacks_tool for updates.", reward: 50, icon: "🐦" },
    { id: 2, name: "Join Discord", desc: "Join our community server.", reward: 50, icon: "💬" },
    { id: 3, name: "Retweet Pinned", desc: "Spread the word about this airdrop.", reward: 100, icon: "🔁" },
  ];

  // Gabungkan status completed dari DB dengan list task
  const tasksWithStatus = allTasks.map(task => ({
    ...task,
    completed: completedTaskIds.includes(task.id)
  }));

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setUserData(data);
      // Ambil alamat Mainnet
      const address = data.profile.stxAddress.mainnet; 
      fetchUserProfile(address);
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((data) => {
        setUserData(data);
        const address = data.profile.stxAddress.mainnet;
        fetchUserProfile(address);
      });
    }
  }, []);

  // --- SUPABASE LOGIC ---

  // 1. Fetch atau Create User saat Login
  const fetchUserProfile = async (walletAddress) => {
    setLoading(true);
    
    // Cek apakah user ada di DB
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code === 'PGRST116') {
      // Error code PGRST116 artinya data tidak ditemukan (User Baru) -> Kita Create
      console.log("User baru, mendaftarkan...");
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ wallet_address: walletAddress, xp: 0, completed_tasks: [] }])
        .select()
        .single();
      
      if (createError) console.error("Gagal buat user:", createError);
      else user = newUser;
    }

    if (user) {
      // Set State Lokal dari Database
      setUserXP(user.xp);
      setCompletedTaskIds(user.completed_tasks || []);
      
      // Cek Check-in (Apakah hari ini sudah checkin?)
      if (user.last_checkin) {
        const lastDate = new Date(user.last_checkin).toDateString();
        const today = new Date().toDateString();
        setHasCheckedIn(lastDate === today);
      } else {
        setHasCheckedIn(false);
      }
    }
    setLoading(false);
  };

  // 2. Fungsi Update XP & Data ke DB
  const updateDatabase = async (updates) => {
    if (!userData) return;
    const address = userData.profile.stxAddress.mainnet;

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('wallet_address', address);

    if (error) console.error("Gagal update DB:", error);
  };

  // --- ACTIONS ---

  const connectWallet = () => {
    showConnect({
      appDetails: { name: 'Stacks Airdrop', icon: window.location.origin + '/vite.svg' },
      redirectTo: '/',
      onFinish: () => {
        const data = userSession.loadUserData();
        setUserData(data);
        fetchUserProfile(data.profile.stxAddress.mainnet);
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut("/");
    setUserData(null);
    setUserXP(0);
    setCompletedTaskIds([]);
  };

  const handleCheckIn = async () => {
    if (hasCheckedIn || !userData) return;
    
    // Optimistic Update (Update UI dulu biar cepat)
    const newXP = userXP + 20;
    setUserXP(newXP);
    setHasCheckedIn(true);

    // Kirim ke Backend
    await updateDatabase({
      xp: newXP,
      last_checkin: new Date().toISOString()
    });
  };

  const handleTask = async (taskId) => {
    if (!userData) return;
    const task = allTasks.find(t => t.id === taskId);
    if (!task || completedTaskIds.includes(taskId)) return;

    // Optimistic Update
    const newXP = userXP + task.reward;
    const newCompleted = [...completedTaskIds, taskId];
    
    setUserXP(newXP);
    setCompletedTaskIds(newCompleted);

    // Kirim ke Backend (Simpan XP baru dan Array Task yang selesai)
    await updateDatabase({
      xp: newXP,
      completed_tasks: newCompleted
    });
  };

  const handleMint = () => {
    if (!userData) return alert("Connect wallet first!");
    // Logika Minting Kontrak nanti disini
    setHasMinted(true);
    alert("Smart Contract interaction coming soon!");
  };

  // --- RENDER ---
  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-stx-accent">Loading Data...</div>;

    switch (activeTab) {
      case 'home':
        return <Home userData={userData} userXP={userXP} hasMinted={hasMinted} handleMint={handleMint} connectWallet={connectWallet} />;
      case 'tasks':
        // Pass tasksWithStatus agar UI tahu mana yang completed
        return <Tasks tasks={tasksWithStatus} handleTask={handleTask} />;
      case 'profile':
        return <Profile userData={userData} userXP={userXP} hasCheckedIn={hasCheckedIn} handleCheckIn={handleCheckIn} />;
      default:
        return <Home />;
    }
  };

  const WalletButton = !userData ? (
    <button onClick={connectWallet} className="bg-stx-accent hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
      CONNECT WALLET
    </button>
  ) : (
    <button onClick={disconnectWallet} className="border border-stx-accent/50 text-stx-accent hover:bg-stx-accent hover:text-white text-xs font-mono px-4 py-2 rounded-lg transition">
      {/* Tampilkan address Mainnet */}
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
