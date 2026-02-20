import React, { useState, useEffect, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network'; 
import { 
  callReadOnlyFunction, 
  standardPrincipalCV, 
  uintCV,
  cvToValue,
  PostConditionMode
} from '@stacks/transactions';
import { userSession } from '../supabaseClient'; 
import { CheckCircle, Clock, Zap, Box, Lock, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; 
const BLOCKS_PER_DAY = 144;
const LOCK_PERIOD_BLOCKS = 1008; // ~7 Hari

const Vault = () => {
  // State: Assets
  const [poinBalance, setPoinBalance] = useState(0);
  const [oneBalance, setOneBalance] = useState(0);
  
  // State: Network & Logic
  const [currentBlockHeight, setCurrentBlockHeight] = useState(0);
  const [lastClaimHeight, setLastClaimHeight] = useState(0); // Optional: Fetch from contract if available
  
  // State: UI & Actions
  const [stakeAmount, setStakeAmount] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'info', msg: string }
  const [loading, setLoading] = useState(true); // Default true for initial load
  const [actionLoading, setActionLoading] = useState(false); // For contract calls
  const [activeTab, setActiveTab] = useState('stake'); // 'stake' | 'claim' | 'gacha'

  const network = new StacksMainnet();

  const fetchData = useCallback(async () => {
    if (!userSession.isUserSignedIn()) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    await Promise.all([fetchBalances(), fetchNetworkStatus()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    // Fetch block height every 1 min
    const interval = setInterval(fetchNetworkStatus, 60000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- DATA FETCHING ---
  const fetchNetworkStatus = async () => {
    try {
      const response = await fetch('https://api.mainnet.hiro.so/v2/info');
      const data = await response.json();
      setCurrentBlockHeight(data.stacks_tip_height);
    } catch (e) {
      console.error("Failed to fetch block height", e);
    }
  };

  const fetchBalances = async () => {
    const userData = userSession.loadUserData();
    if (!userData || !userData.profile || !userData.profile.stxAddress) return;
    
    const userAddress = userData.profile.stxAddress.mainnet;
    
    // 1. Get POIN
    try {
      const poinData = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'token-poin',
        functionName: 'get-balance',
        functionArgs: [standardPrincipalCV(userAddress)],
        network,
        senderAddress: userAddress
      });
      setPoinBalance(Number(cvToValue(poinData).value) / 1000000); 
    } catch (e) { 
      console.error("No POIN data or failed to fetch", e); 
    }

    // 2. Get ONE
    try {
      const oneData = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'token-one',
        functionName: 'get-balance',
        functionArgs: [standardPrincipalCV(userAddress)],
        network,
        senderAddress: userAddress
      });
      setOneBalance(Number(cvToValue(oneData).value) / 1000000);
    } catch (e) { 
      console.error("No ONE data or failed to fetch", e); 
    }
  };

  // --- ACTIONS ---
  const handleMaxStake = () => {
    setStakeAmount(poinBalance.toString());
  };

  const handleAction = async (actionType) => {
    if (!userSession.isUserSignedIn()) {
      setStatus({ type: 'error', msg: 'Please connect your wallet first.' });
      return;
    }

    setStatus({ type: 'info', msg: 'Awaiting wallet confirmation...' });
    setActionLoading(true);
    
    const options = {
      network,
      anchorMode: 1,
      contractAddress: CONTRACT_ADDRESS,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        setStatus({ 
          type: 'success', 
          msg: `Tx Broadcasted! ID: ${data.txId.slice(0, 6)}...${data.txId.slice(-4)}` 
        });
        setActionLoading(false);
        // Optimistically trigger a fetch after a few seconds
        setTimeout(fetchData, 10000); 
      },
      onCancel: () => {
        setStatus({ type: 'error', msg: 'Transaction cancelled by user.' });
        setActionLoading(false);
      },
    };

    try {
      if (actionType === 'claim') {
        await openContractCall({
          ...options,
          contractName: 'faucet-distributor',
          functionName: 'claim-daily',
          functionArgs: [],
        });
      } else if (actionType === 'stake') {
        const amount = parseFloat(stakeAmount) * 1000000;
        await openContractCall({
          ...options,
          contractName: 'staking-refinery',
          functionName: 'stake-tokens',
          functionArgs: [uintCV(amount)],
        });
      } else if (actionType === 'gacha') {
        await openContractCall({
          ...options,
          contractName: 'utility-gacha',
          functionName: 'spin-gacha',
          functionArgs: [],
        });
      }
    } catch (error) {
      console.error("Contract call failed:", error);
      setStatus({ type: 'error', msg: 'Failed to initiate transaction.' });
      setActionLoading(false);
    }
  };

  // --- CALCULATIONS ---
  // Note: lastClaimHeight needs to be fetched from the contract map to be accurate. 
  // For now, this is purely UI representation based on mock state.
  const blocksToClaim = (lastClaimHeight + BLOCKS_PER_DAY) - currentBlockHeight;
  const isClaimable = blocksToClaim <= 0 || lastClaimHeight === 0; 
  const estimatedTime = blocksToClaim > 0 ? `~${Math.ceil((blocksToClaim * 10) / 60)} hours` : 'Now';

  // --- COMPONENTS ---
  const StatCard = ({ title, value, unit, icon: Icon, color, isLoading }) => (
    <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-slate-700 p-5 rounded-2xl flex items-center justify-between hover:border-slate-600 transition-all">
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          {isLoading ? (
            <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse"></div>
          ) : (
            <>
              <span className="text-2xl font-bold text-white">{value.toLocaleString()}</span>
              <span className={`text-xs font-bold ${color}`}>{unit}</span>
            </>
          )}
        </div>
      </div>
      <div className={`p-3 rounded-xl bg-slate-800/50 ${color.replace('text-', 'text-opacity-80 ')}`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-b border-slate-800 p-6 md:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                <Lock className="text-indigo-400" /> Genesis Vault
              </h1>
              <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Mainnet Live • Block #{currentBlockHeight || '...'}
              </p>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading || actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 text-sm font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="Available Fuel" 
              value={poinBalance} 
              unit="POIN" 
              icon={Zap} 
              color="text-amber-400"
              isLoading={loading} 
            />
            <StatCard 
              title="Treasury Assets" 
              value={oneBalance} 
              unit="ONE" 
              icon={Box} 
              color="text-indigo-400"
              isLoading={loading} 
            />
            <StatCard 
              title="Staking APY" 
              value={"125"} // Mockup Dynamic APY
              unit="%" 
              icon={TrendingUp} 
              color="text-emerald-400"
              isLoading={loading} 
            />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: NAVIGATION & STATUS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-[#1E293B] rounded-2xl p-2 flex flex-col gap-1">
            {['stake', 'claim', 'gacha'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {tab === 'stake' && <Lock size={18} />}
                {tab === 'claim' && <Clock size={18} />}
                {tab === 'gacha' && <Zap size={18} />}
                <span className="capitalize">{tab} Operations</span>
                {tab === 'claim' && !isClaimable && (
                   <span className="ml-auto text-xs bg-slate-800 px-2 py-1 rounded text-slate-500">Wait</span>
                )}
                {tab === 'claim' && isClaimable && (
                   <span className="ml-auto w-2 h-2 rounded-full bg-green-500"></span>
                )}
              </button>
            ))}
          </div>

          {/* Network Info Widget */}
          <div className="bg-[#1E293B]/50 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Protocol Parameters</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Lock Duration</span>
                <span className="text-slate-200">~7 Days <span className="text-slate-600">({LOCK_PERIOD_BLOCKS} Blocks)</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Supply</span>
                <span className="text-slate-200">100 POIN <span className="text-slate-600">/ 24h</span></span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gacha Odds</span>
                <span className="text-slate-200">33% Win Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION AREA */}
        <div className="lg:col-span-8">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 md:p-8 relative overflow-hidden min-h-[400px]">
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            {/* STATUS NOTIFICATION */}
            {status && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 relative z-10 ${
                status.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                status.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}>
                {status.type === 'success' ? <CheckCircle size={20} /> : 
                 status.type === 'error' ? <AlertCircle size={20} /> :
                 <RefreshCw size={20} className="animate-spin" />}
                <p className="text-sm font-medium">{status.msg}</p>
                <button 
                  onClick={() => setStatus(null)} 
                  className="ml-auto text-slate-500 hover:text-white"
                >
                  ×
                </button>
              </div>
            )}

            {/* Main Content Area - Render based on activeTab */}
            <div className="relative z-10">
              {/* --- TAB: STAKING --- */}
              {activeTab === 'stake' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-white">Refinery Staking</h2>
                      <p className="text-slate-400 text-sm mt-1">Lock $POIN to mint $ONE. Early unstake penalty applies.</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-slate-500 uppercase">Your Balance</p>
                      {loading ? (
                         <div className="h-6 w-16 bg-slate-700/50 rounded animate-pulse mt-1 ml-auto"></div>
                      ) : (
                         <p className="text-xl font-mono font-bold text-white">{poinBalance.toLocaleString()} <span className="text-sm text-slate-500">POIN</span></p>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#0F172A] rounded-2xl p-4 border border-slate-700">
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase">Stake Amount</label>
                      <span className="text-xs text-indigo-400 cursor-pointer hover:text-indigo-300" onClick={handleMaxStake}>Use Max</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-3xl font-bold text-white w-full focus:outline-none placeholder-slate-700"
                        disabled={actionLoading}
                      />
                      <div className="bg-slate-800 px-3 py-1 rounded text-sm font-bold text-slate-300">POIN</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500">Lock Period</p>
                      <p className="text-lg font-bold text-white">{LOCK_PERIOD_BLOCKS} Blocks</p>
                      <p className="text-xs text-slate-500">~7 Days</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl">
                      <p className="text-xs text-slate-500">Est. Reward</p>
                      <p className="text-lg font-bold text-emerald-400">Dynamic</p>
                      <p className="text-xs text-slate-500">Based on Pool Share</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAction('stake')}
                    disabled={actionLoading || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > poinBalance}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.99] flex justify-center items-center gap-2"
                  >
                    {actionLoading ? <RefreshCw className="animate-spin" size={20} /> : null}
                    {parseFloat(stakeAmount) > poinBalance ? 'Insufficient Balance' : 'Confirm Staking'}
                  </button>
                </div>
              )}

              {/* --- TAB: CLAIM --- */}
              {activeTab === 'claim' && (
                <div className="space-y-8 animate-fadeIn text-center py-8">
                  <div className="inline-flex p-4 bg-indigo-500/20 rounded-full mb-4">
                    <Clock size={48} className="text-indigo-400" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">Daily Faucet</h2>
                    <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
                      Protocol distributes free POIN every 144 blocks (approx 24 hours). 
                      Maintain your streak to increase rewards.
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 max-w-sm mx-auto">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-sm">Status</span>
                      <span className={`text-sm font-bold ${isClaimable ? 'text-green-400' : 'text-amber-400'}`}>
                        {isClaimable ? 'Ready to Claim' : 'Cooling Down'}
                      </span>
                    </div>
                    
                    {/* Progress Bar for Cooldown */}
                    {!isClaimable && (
                      <div className="w-full bg-slate-700 h-2 rounded-full mb-2 overflow-hidden">
                        <div 
                          className="bg-amber-400 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.max(0, 100 - (blocksToClaim / BLOCKS_PER_DAY * 100))}%` }}
                        ></div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Next: {estimatedTime}</span>
                      <span>Block #{currentBlockHeight + (isClaimable ? 0 : blocksToClaim)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAction('claim')}
                    disabled={actionLoading /* || !isClaimable */} // Uncomment in production to enforce UI lock
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mx-auto"
                  >
                    {actionLoading ? <RefreshCw className="animate-spin" size={20} /> : null}
                    Claim 100 POIN
                  </button>
                </div>
              )}

              {/* --- TAB: GACHA --- */}
              {activeTab === 'gacha' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-purple-500/20 p-3 rounded-xl">
                      <Zap size={32} className="text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Lucky Burn</h2>
                      <p className="text-slate-400 text-sm">Burn POIN for a chance to mint $ONE.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center hover:border-purple-500 transition-colors cursor-pointer group">
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">💎</div>
                        <p className="text-white font-bold">Prize Pool {i}</p>
                        <p className="text-xs text-slate-500">Win Rate: 33%</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-purple-900/20 border border-purple-500/30 p-6 rounded-2xl text-center">
                    <p className="text-purple-300 font-bold mb-2">Cost per Spin</p>
                    <p className="text-3xl font-bold text-white mb-4">50 <span className="text-sm text-slate-400">POIN</span></p>
                    <button 
                      onClick={() => handleAction('gacha')}
                      disabled={actionLoading || poinBalance < 50}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-purple-900/20 transition-all flex justify-center items-center gap-2"
                    >
                      {actionLoading ? <RefreshCw className="animate-spin" size={20} /> : null}
                      {poinBalance < 50 ? 'Insufficient Balance' : 'SPIN NOW'}
                    </button>
                    <p className="text-xs text-slate-500 mt-4">Proven Fair: Uses Block Hash RNG</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Vault;
