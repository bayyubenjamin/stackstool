import React from 'react';

const Profile = ({ userData, userXP, hasCheckedIn, handleCheckIn }) => {
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-slate-400">Please connect your wallet to view profile.</p>
      </div>
    );
  }

  const level = Math.floor(userXP / 500) + 1;
  const nextLevelXP = level * 500;
  const progress = (userXP / nextLevelXP) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header Profile */}
      <div className="text-center space-y-4">
        <div className="w-24 h-24 mx-auto bg-gradient-to-b from-slate-700 to-slate-900 rounded-full p-1 border-2 border-stx-accent">
           <img 
             src={`https://api.dicebear.com/7.x/identicon/svg?seed=${userData.profile.stxAddress.testnet}`} 
             alt="avatar" 
             className="w-full h-full rounded-full bg-slate-800"
           />
        </div>
        <div>
           <h2 className="text-2xl font-bold text-white">Hunter</h2>
           <p className="text-slate-400 font-mono text-sm bg-slate-900 inline-block px-3 py-1 rounded-full mt-2">
             {userData.profile.stxAddress.testnet}
           </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-5 text-center bg-slate-800/50">
           <p className="text-xs uppercase text-slate-500 font-bold">Current Level</p>
           <p className="text-4xl font-bold text-white">{level}</p>
        </div>
        <div className="glass-panel p-5 text-center bg-slate-800/50">
           <p className="text-xs uppercase text-slate-500 font-bold">Total XP</p>
           <p className="text-4xl font-bold text-stx-accent">{userXP}</p>
        </div>
      </div>

      {/* Progress Level */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div className="flex justify-between text-sm mb-2">
           <span className="text-slate-400">Level Progress</span>
           <span className="text-white font-mono">{userXP} / {nextLevelXP} XP</span>
        </div>
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
           <div 
             className="bg-gradient-to-r from-stx-accent to-purple-500 h-full transition-all duration-500"
             style={{ width: `${progress}%` }}
           ></div>
        </div>
      </div>

      {/* Daily Check-in */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 flex items-center justify-between">
         <div>
            <h3 className="font-bold text-lg">Daily Check-in</h3>
            <p className="text-slate-400 text-xs">Log in daily to earn XP bonuses.</p>
         </div>
         <button 
           onClick={handleCheckIn}
           disabled={hasCheckedIn}
           className={`px-6 py-3 rounded-lg font-bold transition-all ${
             hasCheckedIn 
             ? "bg-slate-700 text-slate-400" 
             : "bg-green-500 hover:bg-green-400 text-black shadow-lg shadow-green-500/20"
           }`}
         >
           {hasCheckedIn ? "DONE" : "CLAIM +20 XP"}
         </button>
      </div>
    </div>
  );
};

export default Profile;
