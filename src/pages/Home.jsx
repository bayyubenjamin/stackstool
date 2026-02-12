import React from 'react';

const Home = ({ userData, userXP, hasMinted, handleMint, connectWallet }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-stx-accent to-blue-600 p-8 md:p-12 text-center md:text-left shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Genesis Airdrop <br/> is Live
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Earn XP by completing missions and claim your Genesis NFT as proof of early participation.
          </p>
          
          {!userData ? (
            <button onClick={connectWallet} className="bg-white text-stx-accent font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition shadow-lg">
              Connect Wallet to Start
            </button>
          ) : (
            <div className="flex flex-wrap gap-4">
               <button 
                  onClick={handleMint}
                  disabled={hasMinted || userXP < 100}
                  className={`px-6 py-3 rounded-lg font-bold border-2 transition ${
                    hasMinted 
                    ? "bg-black/20 border-transparent text-white/50 cursor-default" 
                    : "bg-white text-stx-accent border-white hover:bg-blue-50"
                  }`}
               >
                  {hasMinted ? "Already Minted" : "Mint Genesis NFT"}
               </button>
               <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-lg backdrop-blur-sm">
                  <span className="text-xs uppercase font-bold text-blue-200">Your XP:</span>
                  <span className="font-mono font-bold">{userXP}</span>
               </div>
            </div>
          )}
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border border-slate-700/50">
           <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Global Minted</h3>
           <p className="text-3xl font-mono">845 / 1000</p>
        </div>
        <div className="glass-panel p-6 border border-slate-700/50">
           <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Network Status</h3>
           <p className="text-3xl font-mono text-green-400">Optimal</p>
        </div>
        <div className="glass-panel p-6 border border-slate-700/50">
           <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Time Remaining</h3>
           <p className="text-3xl font-mono">12d : 04h</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
