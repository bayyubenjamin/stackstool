import React from 'react';

// --- KOMPONEN KARTU BADGE (Internal) ---
const BadgeCard = ({ 
  id, 
  title, 
  subtitle, 
  reqText, 
  isLocked, 
  isMinted, 
  onMint, 
  colorClass, 
  icon 
}) => {
  return (
    <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-500 ${
      isLocked 
        ? "border-slate-800 bg-slate-900/40 opacity-75 grayscale" 
        : isMinted
          ? "border-green-500/30 bg-slate-900/80 shadow-2xl shadow-green-900/20"
          : `border-slate-700 bg-slate-900 hover:border-${colorClass} hover:shadow-2xl hover:shadow-${colorClass}/20`
    }`}>
      
      {/* Background Glow Effect */}
      {!isLocked && !isMinted && (
        <div className={`absolute top-0 right-0 w-64 h-64 bg-${colorClass}/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:bg-${colorClass}/20 transition-all duration-500`}></div>
      )}

      <div className="relative z-10 p-6 flex flex-col h-full">
        {/* Header Badge */}
        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-white/10 ${
            isMinted ? "bg-green-500/10 text-green-400" : `bg-slate-800 text-slate-400 group-hover:text-${colorClass}`
          }`}>
            {isMinted ? "✓" : icon}
          </div>
          {isMinted && (
            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              Owned
            </span>
          )}
          {isLocked && (
            <span className="bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
              Locked
            </span>
          )}
        </div>

        {/* Content */}
        <div className="mb-8 flex-1">
          <h3 className={`text-xl font-bold mb-1 ${isMinted ? "text-white" : "text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400"}`}>
            {title}
          </h3>
          <p className={`text-xs font-bold tracking-widest uppercase mb-3 ${colorClass.replace('bg-', 'text-')}`}>
            {subtitle}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed border-t border-slate-800 pt-3">
            {reqText}
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onMint(id)}
          disabled={isLocked || isMinted}
          className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            isMinted
              ? "bg-slate-800 text-slate-500 cursor-default border border-slate-700"
              : isLocked
                ? "bg-slate-800/50 text-slate-600 cursor-not-allowed border border-transparent"
                : `bg-white text-black hover:bg-${colorClass} hover:text-white shadow-lg shadow-white/5`
          }`}
        >
          {isMinted ? "Badge Secured" : isLocked ? "Requirements Not Met" : "Mint Badge"}
        </button>
      </div>
    </div>
  );
};

// --- HALAMAN UTAMA (HOME) ---
const Home = ({ userData, userXP, userLevel, badgesStatus, handleMint, connectWallet }) => {
  
  // Definisi Badge Logic & Data
  // isLocked: Mengecek apakah user memenuhi syarat XP/Level
  // isMinted: Mengecek status dari smart contract (lewat props badgesStatus)
  const badges = [
    {
      id: 'genesis',
      title: "Genesis Pioneer",
      subtitle: "Phase 1 Access",
      reqText: "Requires 100 Reputation Points. Awarded to early protocol adopters who verify their wallet.",
      icon: "💠",
      colorClass: "stx-accent", // Pastikan class ini ada di tailwind atau ganti 'blue-500'
      isLocked: !userData || userXP < 100, 
      isMinted: badgesStatus?.genesis || false
    },
    {
      id: 'node',
      title: "Node Operator",
      subtitle: "Consistency Tier",
      reqText: "Requires Level 5 (2500 XP). Validate your commitment by maintaining daily synchronization streaks.",
      icon: "⚡",
      colorClass: "purple-500",
      isLocked: !userData || userLevel < 5,
      isMinted: badgesStatus?.node || false
    },
    {
      id: 'guardian',
      title: "Protocol Guardian",
      subtitle: "Elite Status",
      reqText: "Requires Level 10. The highest honor for users who have completed all genesis missions.",
      icon: "🛡️",
      colorClass: "amber-500",
      isLocked: !userData || userLevel < 10,
      isMinted: badgesStatus?.guardian || false
    }
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric Global */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Users</p>
          <p className="text-xl font-mono text-white">845</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Network</p>
          <p className="text-xl font-mono text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Mainnet
          </p>
        </div>

         {/* User Personal Stats (Hanya muncul jika sudah connect) */}
         {userData && (
          <>
            <div className="bg-slate-900/50 border border-stx-accent/30 p-4 rounded-xl backdrop-blur-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 p-2 opacity-20 text-4xl">💎</div>
              <p className="text-stx-accent text-[10px] font-bold uppercase mb-1">Your XP</p>
              <p className="text-xl font-mono text-white">{userXP}</p>
            </div>
            <div className="bg-slate-900/50 border border-purple-500/30 p-4 rounded-xl backdrop-blur-sm relative overflow-hidden">
               <div className="absolute right-0 top-0 p-2 opacity-20 text-4xl">📶</div>
              <p className="text-purple-400 text-[10px] font-bold uppercase mb-1">Your Level</p>
              <p className="text-xl font-mono text-white">{userLevel}</p>
            </div>
          </>
        )}
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto py-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          Establish Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-stx-accent to-purple-500">On-Chain Legacy</span>
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Collect reputation badges to unlock future governance power and airdrop eligibility.
        </p>
        
        {!userData && (
          <div className="mt-8">
            <button 
              onClick={connectWallet} 
              className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-slate-200 transition shadow-xl shadow-white/10 hover:scale-105 transform duration-200"
            >
              Initialize Access
            </button>
          </div>
        )}
      </div>

      {/* Badge Grid System */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <BadgeCard 
            key={badge.id}
            {...badge}
            onMint={handleMint} // Passing fungsi handleMint ke kartu
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center border-t border-slate-800 pt-8 mt-8">
        <p className="text-slate-600 text-xs font-mono">
          GENESIS CONTRACT: <span className="text-slate-500 hover:text-stx-accent cursor-pointer transition">SP3G...9J3</span>
        </p>
      </div>

    </div>
  );
};

export default Home;
