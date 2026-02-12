import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // State untuk navigasi
  
  // Data Mockup
  const [userXP, setUserXP] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);
const [tasks, setTasks] = useState([
    { id: 1, name: "Follow Twitter", desc: "Follow @stacks_tool for updates.", reward: 50, completed: false, icon: "🐦" },
    { id: 2, name: "Join Discord", desc: "Join our community server.", reward: 50, completed: false, icon: "💬" },
    { id: 3, name: "Retweet Pinned", desc: "Spread the word about this airdrop.", reward: 100, completed: false, icon: "🔁" },
  ])

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
      setUserXP(120); // Simulasi load data dari server
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    }
  }, []);

  // --- ACTIONS ---
  const connectWallet = () => {
    showConnect({
      appDetails: { name: 'Stacks Airdrop', icon: window.location.origin + '/vite.svg' },
      redirectTo: '/',
      onFinish: () => setUserData(userSession.loadUserData()),
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut("/");
    setUserData(null);
    setUserXP(0);
  };

  const handleCheckIn = () => {
    if (hasCheckedIn) return;
    setHasCheckedIn(true);
    setUserXP(prev => prev + 20);
  };

  const handleTask = (taskId) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId && !t.completed) {
        setUserXP(prev => prev + t.reward);
        return { ...t, completed: true };
      }
      return t;
    }));
  };

  const handleMint = () => {
    if (!userData) return alert("Connect wallet first!");
    setHasMinted(true);
    alert("Minting initiated...");
  };

  // --- RENDER PAGE CONTENT ---
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home userData={userData} userXP={userXP} hasMinted={hasMinted} handleMint={handleMint} connectWallet={connectWallet} />;
      case 'tasks':
        return <Tasks tasks={tasks} handleTask={handleTask} />;
      case 'profile':
        return <Profile userData={userData} userXP={userXP} hasCheckedIn={hasCheckedIn} handleCheckIn={handleCheckIn} />;
      default:
        return <Home />;
    }
  };

  // Tombol Wallet untuk dioper ke Layout
  const WalletButton = !userData ? (
    <button onClick={connectWallet} className="bg-stx-accent hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition">
      CONNECT
    </button>
  ) : (
    <button onClick={disconnectWallet} className="border border-stx-accent/50 text-stx-accent hover:bg-stx-accent hover:text-white text-xs font-mono px-4 py-2 rounded-lg transition">
      {userData.profile.stxAddress.testnet.slice(0,4)}...{userData.profile.stxAddress.testnet.slice(-4)}
    </button>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} walletButton={WalletButton}>
      {renderContent()}
    </Layout>
  );
}

export default App;
