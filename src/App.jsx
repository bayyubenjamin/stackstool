import React, { useState, useEffect } from 'react';
import { connect, disconnect, isConnected, getLocalStorage, openContractCall } from '@stacks/connect';
import { uintCV, stringAsciiCV } from '@stacks/transactions'; 
import { supabase } from './supabaseClient';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile';

const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3';
const CONTRACT_CORE = 'genesis-core-v4';

function App() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [badgesStatus, setBadgesStatus] = useState({ genesis: false, node: false, guardian: false });

  const [txStatus, setTxStatus] = useState({
    type: 'idle',
    message: '',
    txId: null
  });

  // Fungsi baru untuk memantau status transaksi di blockchain
  const monitorTransaction = async (txId, successCallback) => {
    handleTxStatus('pending', 'Transaction broadcasted. Waiting for confirmation...', txId);

    const checkStatus = async () => {
      try {
        const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txId}`);
        const data = await response.json();

        if (data.tx_status === 'success') {
          handleTxStatus('success', 'Transaction confirmed on-chain!', txId);
          if (successCallback) successCallback();
          return true;
        } else if (data.tx_status === 'abort' || data.tx_status.includes('fail')) {
          handleTxStatus('failed', `Transaction Aborted: ${data.error_code || 'Execution Error'}`, txId);
          return true;
        }
        return false; // Masih pending
      } catch (error) {
        console.error("Error monitoring tx:", error);
        return false;
      }
    };

    // Polling setiap 10 detik sampai status berubah
    const interval = setInterval(async () => {
      const isFinished = await checkStatus();
      if (isFinished) clearInterval(interval);
    }, 10000);
  };

  const handleTxStatus = (type, message, txId = null) => {
    setTxStatus({ type, message, txId });
    if (type === 'success' || type === 'failed') {
      setTimeout(() => setTxStatus({ type: 'idle', message: '', txId: null }), 8000);
    }
  };

  const fetchUserProfile = async (walletAddress) => {
    setLoading(true);
    let { data: user, error } = await supabase.from('users').select('*').eq('wallet_address', walletAddress).single();
    if (error && error.code === 'PGRST116') {
      const { data: newUser } = await supabase.from('users').insert([{ 
          wallet_address: walletAddress, xp: 0, level: 1, completed_tasks: [],
          badges: { genesis: false, node: false, guardian: false }
      }]).select().single();
      user = newUser;
    }
    if (user) {
      setUserXP(user.xp || 0);
      setUserLevel(user.level || 1);
      setCompletedTaskIds(user.completed_tasks || []);
      const badges = typeof user.badges === 'string' ? JSON.parse(user.badges) : user.badges;
      setBadgesStatus(badges || { genesis: false, node: false, guardian: false });
      if (user.last_checkin) {
        const lastDate = new Date(user.last_checkin).toDateString();
        const todayDate = new Date().toDateString();
        setHasCheckedIn(lastDate === todayDate);
      }
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (hasCheckedIn || !userData) return;
    handleTxStatus('pending', 'Requesting daily check-in...');
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_CORE, functionName: 'daily-check-in', functionArgs: [], 
      onFinish: (data) => {
        monitorTransaction(data.txId, () => {
          const newXP = userXP + 20;
          const newLevel = Math.floor(newXP / 500) + 1;
          setUserXP(newXP); setUserLevel(newLevel); setHasCheckedIn(true);
          supabase.from('users').update({ xp: newXP, level: newLevel, last_checkin: new Date().toISOString() }).eq('wallet_address', userData.profile.stxAddress.mainnet);
        });
      },
      onCancel: () => handleTxStatus('failed', 'Check-in cancelled')
    });
  };

  const handleTask = async (taskId) => {
    if (!userData) return;
    const task = [{id:1, reward:50}, {id:2, reward:50}, {id:3, reward:100}].find(t => t.id === taskId);
    handleTxStatus('pending', 'Submitting mission to blockchain...');
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_CORE, functionName: 'complete-mission',
      functionArgs: [uintCV(taskId), uintCV(task.reward)],
      onFinish: (data) => {
        monitorTransaction(data.txId, () => {
          const newXP = userXP + task.reward;
          const newCompleted = [...completedTaskIds, taskId];
          setUserXP(newXP); setCompletedTaskIds(newCompleted);
          supabase.from('users').update({ xp: newXP, completed_tasks: newCompleted }).eq('wallet_address', userData.profile.stxAddress.mainnet);
        });
      },
      onCancel: () => handleTxStatus('failed', 'Mission cancelled')
    });
  };

  const handleMint = async (badgeId) => {
    if (!userData || badgesStatus[badgeId]) return;
    handleTxStatus('pending', `Requesting ${badgeId.toUpperCase()} badge...`);
    await openContractCall({
      contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_CORE, functionName: 'claim-badge',
      functionArgs: [stringAsciiCV(badgeId)],
      onFinish: (data) => {
        monitorTransaction(data.txId, () => {
          const newBadges = { ...badgesStatus, [badgeId]: true };
          setBadgesStatus(newBadges);
          supabase.from('users').update({ badges: newBadges }).eq('wallet_address', userData.profile.stxAddress.mainnet);
        });
      },
      onCancel: () => handleTxStatus('failed', 'Minting cancelled')
    });
  };

  const connectWallet = async () => {
    try {
      const response = await connect({ appDetails: { name: 'Genesis Platform', icon: window.location.origin + '/vite.svg' } });
      const stxInfo = response.addresses.find(a => a.symbol === 'STX') || response.addresses[0];
      if (stxInfo) {
        setUserData({ profile: { stxAddress: { mainnet: stxInfo.address } } });
        fetchUserProfile(stxInfo.address);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} walletButton={
      !userData ? <button onClick={connectWallet} className="bg-stx-accent text-white text-xs font-bold px-4 py-2 rounded-lg">CONNECT STACKS</button> :
      <button onClick={() => { disconnect(); setUserData(null); }} className="bg-slate-800 text-slate-300 text-xs font-mono px-4 py-2 rounded-lg">{userData.profile.stxAddress.mainnet.slice(0,4)}...{userData.profile.stxAddress.mainnet.slice(-4)}</button>
    } txStatus={txStatus}>
      {loading ? <div className="text-center p-10">Loading Profile...</div> :
       activeTab === 'home' ? <Home userData={userData} userXP={userXP} userLevel={userLevel} badgesStatus={badgesStatus} handleMint={handleMint} connectWallet={connectWallet} hasCheckedIn={hasCheckedIn} /> :
       activeTab === 'tasks' ? <Tasks tasks={[{id:1, name:"Ecosystem Access", reward:50, icon:"🌐", completed:completedTaskIds.includes(1)}, {id:2, name:"Identity Verification", reward:50, icon:"🛡️", completed:completedTaskIds.includes(2)}, {id:3, name:"Network Signal", reward:100, icon:"📡", completed:completedTaskIds.includes(3)}]} handleTask={handleTask} /> :
       <Profile userData={userData} userXP={userXP} userLevel={userLevel} hasCheckedIn={hasCheckedIn} handleCheckIn={handleCheckIn} disconnectWallet={() => { disconnect(); setUserData(null); }} />}
    </Layout>
  );
}

export default App;
