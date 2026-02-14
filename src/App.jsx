import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect'; // Gunakan showConnect untuk reliabilitas
import { uintCV, stringAsciiCV } from '@stacks/transactions'; 
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3';
const CONTRACT_CORE = 'genesis-core-v4';

// Inisialisasi Session
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [badgesStatus, setBadgesStatus] = useState({ genesis: false, node: false, guardian: false });

  const [txStatus, setTxStatus] = useState({ type: 'idle', message: '', txId: null });

  // Cek sesi saat refresh
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const user = userSession.loadUserData();
      setUserData(user);
      fetchUserProfile(user.profile.stxAddress.mainnet);
    }
  }, []);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'Genesis Platform',
        icon: window.location.origin + '/vite.svg',
      },
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
  };

  const fetchUserProfile = async (walletAddress) => {
    setLoading(true);
    try {
      let { data: user } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();
      if (user) {
        setUserXP(user.xp || 0);
        setUserLevel(user.level || 1);
        setCompletedTaskIds(user.completed_tasks || []);
        setBadgesStatus(typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges || {});
        if (user.last_checkin) {
          setHasCheckedIn(new Date(user.last_checkin).toDateString() === new Date().toDateString());
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    setLoading(false);
  };

  // --- Transaction Monitor & Handlers Tetap Sama (Seperti kode sebelumnya) ---
  // ... (Gunakan monitorTransaction, handleCheckIn, handleTask, handleMint dari kode lama Anda)

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} txStatus={txStatus} walletButton={
      !userData ? 
      <button onClick={connectWallet} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-bold text-xs transition-colors">CONNECT WALLET</button> :
      <button onClick={disconnectWallet} className="bg-slate-800 px-4 py-2 rounded-lg font-mono text-xs">{userData.profile.stxAddress.mainnet.slice(0,5)}...{userData.profile.stxAddress.mainnet.slice(-4)}</button>
    }>
      {loading ? <div className="p-10 text-center animate-pulse">Syncing...</div> :
       activeTab === 'home' ? <Home userData={userData} userXP={userXP} userLevel={userLevel} badgesStatus={badgesStatus} handleMint={handleMint} connectWallet={connectWallet} hasCheckedIn={hasCheckedIn} /> :
       activeTab === 'tasks' ? <Tasks tasks={[{id:1, name:"Ecosystem Access", reward:50, icon:"🌐", completed:completedTaskIds.includes(1)}, {id:2, name:"Identity Verification", reward:50, icon:"🛡️", completed:completedTaskIds.includes(2)}, {id:3, name:"Network Signal", reward:100, icon:"📡", completed:completedTaskIds.includes(3)}]} handleTask={handleTask} /> :
       <Profile userData={userData} userXP={userXP} userLevel={userLevel} hasCheckedIn={hasCheckedIn} handleCheckIn={handleCheckIn} disconnectWallet={disconnectWallet} />}
    </Layout>
  );
}

export default App;
