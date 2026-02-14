import React from 'react';

const Layout = ({ children, activeTab, setActiveTab, walletButton, txStatus }) => {
  const menuItems = [
    { id: 'home', label: 'Overview', icon: '📊' },
    { id: 'tasks', label: 'Protocol', icon: '💠' },
    { id: 'profile', label: 'Identity', icon: '🆔' },
  ];

  return (
    <div className="min-h-screen flex bg-[#0B1120] text-slate-200 font-sans overflow-hidden relative">
      
      {/* TRANSACTION TOAST */}
      {txStatus && txStatus.type !== 'idle' && (
        <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 z-[60] max-w-sm w-full animate-fade-in-up">
          <div className={`p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-4 ${
            txStatus.type === 'success' ? 'bg-slate-900/95 border-green-500/30' : 
            txStatus.type === 'failed' ? 'bg-slate-900/95 border-red-500/30' : 
            'bg-slate-900/95 border-stx-accent/30'
          }`}>
            <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 ${
              txStatus.type === 'success' ? 'bg-green-500/20 text-green-400' :
              txStatus.type === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-stx-accent/20 text-stx-accent animate-spin'
            }`}>
              {txStatus.type === 'success' ? '✓' : txStatus.type === 'failed' ? '✕' : '⟳'}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm uppercase mb-1 ${
                txStatus.type === 'success' ? 'text-green-400' :
                txStatus.type === 'failed' ? 'text-red-400' :
                'text-stx-accent'
              }`}>
                {txStatus.type.toUpperCase()}
              </p>
              <p className="text-slate-400 text-xs">{txStatus.message}</p>
              {txStatus.txId && (
                <a href={`https://explorer.hiro.so/txid/${txStatus.txId}?chain=mainnet`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[10px] text-stx-accent border-b border-stx-accent/30">
                  VIEW ON EXPLORER ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Desktop */}
      <aside className="w-64 hidden md:flex flex-col border-r border-slate-800 bg-[#0F172A]/95 backdrop-blur-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-stx-accent rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">G</div>
          <span className="font-bold tracking-tight text-lg text-white">GENESIS <span className="text-stx-accent">ONE</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-8">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-slate-800 text-white border-l-2 border-stx-accent' : 'text-slate-500 hover:text-slate-300'}`}>
              <span className="text-lg opacity-80">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <p className="text-[10px] uppercase text-slate-500 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
              <p className="text-xs font-bold text-slate-300">Operational</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-slate-800 flex justify-around p-4 z-50">
         {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-stx-accent' : 'text-slate-600'}`}>
              <span className="text-xl">{item.icon}</span><span className="text-[10px] uppercase font-semibold">{item.label}</span>
            </button>
          ))}
      </div>

      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen">
        <header className="sticky top-0 z-10 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold md:hidden text-white tracking-tight">GENESIS</h2>
          <div className="hidden md:block text-slate-500 text-xs uppercase tracking-widest font-semibold">Secure Environment</div>
          <div>{walletButton}</div>
        </header>
        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full pb-24 md:pb-10">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
