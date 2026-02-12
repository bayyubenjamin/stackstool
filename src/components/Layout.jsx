import React from 'react';

const Layout = ({ children, activeTab, setActiveTab, walletButton }) => {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠' },
    { id: 'tasks', label: 'Missions', icon: '⚔️' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen flex bg-stx-dark text-white font-sans overflow-hidden">
      
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="w-64 hidden md:flex flex-col border-r border-slate-800 bg-stx-dark/95 backdrop-blur-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-stx-accent to-blue-500 rounded-lg flex items-center justify-center font-bold">A</div>
          <span className="font-bold tracking-tight text-xl">AIRDROP</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                activeTab === item.id
                  ? 'bg-stx-accent text-white shadow-lg shadow-stx-accent/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Current Season</p>
            <p className="text-sm font-bold text-green-400">● Live Phase 1</p>
          </div>
        </div>
      </aside>

      {/* --- MOBILE NAV (Bottom) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around p-4 z-50">
         {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-stx-accent' : 'text-slate-500'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] uppercase font-bold">{item.label}</span>
            </button>
          ))}
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen">
        
        {/* Topbar Mobile/Desktop */}
        <header className="sticky top-0 z-10 bg-stx-dark/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold md:hidden">AIRDROP APP</h2>
          <div className="hidden md:block text-slate-400 text-sm">
            Welcome back, Hunter.
          </div>
          <div>
            {walletButton}
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full pb-24 md:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
