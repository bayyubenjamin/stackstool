import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { callReadOnlyFunction, uintCV } from '@stacks/transactions';

// Konfigurasi Stacks
const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

function App() {
  const [userData, setUserData] = useState(null);
  const [mintCount, setMintCount] = useState(1);
  const [supply, setSupply] = useState(845); // Contoh supply saat ini
  const maxSupply = 1000;
  
  // Setup Network (Ganti ke Mainnet saat production)
  const network = new StacksTestnet(); 

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    } else if (userSession.isSignInPending()) {
      userSession.handlePendingSignIn().then((userData) => {
        setUserData(userData);
      });
    }
  }, []);

  // Fungsi Login Wallet
  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'Stacks Tool',
        icon: window.location.origin + '/vite.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        setUserData(userSession.loadUserData());
      },
      userSession,
    });
  };

  // Fungsi Logout
  const disconnectWallet = () => {
    userSession.signUserOut("/");
    setUserData(null);
  };

  // Fungsi Mint (Placeholder Logic)
  const handleMint = async () => {
    if (!userData) return alert("Please connect wallet first");
    
    // Disini nanti kita panggil Contract Call
    console.log(`Minting ${mintCount} NFT(s)...`);
    
    // Simulasi loading
    alert(`Initiating transaction on Stacks Blockchain for ${mintCount} NFT...`);
    // Nanti kita isi dengan openContractCall() di langkah selanjutnya
  };

  // Kalkulasi Progress Bar
  const progressPercent = (supply / maxSupply) * 100;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      
      {/* --- NAVBAR --- */}
      <nav className="w-full py-6 px-4 md:px-12 border-b border-slate-800 flex justify-between items-center bg-stx-dark/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-8 bg-stx-accent rounded-sm"></div>
          <h1 className="text-xl font-bold tracking-tighter uppercase">Stacks Tool</h1>
        </div>
        
        <div>
          {!userData ? (
            <button 
              onClick={connectWallet}
              className="border border-slate-600 hover:bg-slate-800 text-sm px-4 py-2 rounded transition-colors font-mono"
            >
              [ CONNECT WALLET ]
            </button>
          ) : (
            <button 
              onClick={disconnectWallet}
              className="border border-stx-accent text-stx-accent hover:bg-stx-accent hover:text-white text-sm px-4 py-2 rounded transition-colors font-mono"
            >
              {userData.profile.stxAddress.testnet.slice(0,6)}...{userData.profile.stxAddress.testnet.slice(-4)}
            </button>
          )}
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* Background Gradients (Hiasan) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stx-accent/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Kiri: Teks & Info */}
          <div className="space-y-6">
            <div className="inline-block bg-stx-accent/20 text-stx-accent px-3 py-1 rounded text-xs font-mono mb-2 border border-stx-accent/50">
              ● MINT IS LIVE
            </div>
            <h2 className="text-5xl font-bold leading-tight">
              Secure Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-stx-accent to-blue-400">
                Digital Legacy
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Stacks Tool Genesis Collection. Utilitas premium untuk ekosistem Bitcoin L2. 
              Mint sekarang untuk mendapatkan akses seumur hidup.
            </p>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold">Price</p>
                <p className="text-xl font-mono">50 STX</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold">Supply</p>
                <p className="text-xl font-mono">{maxSupply}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase font-bold">Chain</p>
                <p className="text-xl font-mono">Stacks</p>
              </div>
            </div>
          </div>

          {/* Kanan: Minting Card (Glassmorphism) */}
          <div className="glass-panel p-8 relative">
            {/* Indikator Status */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
               <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
               <span className="text-xs text-green-500 font-mono">OPERATIONAL</span>
            </div>

            <h3 className="text-xl font-bold mb-6">MINT ALLOCATION</h3>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2 font-mono text-slate-400">
                <span>{supply} MINTED</span>
                <span>{maxSupply} TOTAL</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-stx-accent to-blue-500 h-2.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Selector Jumlah */}
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-700 mb-6">
              <button 
                onClick={() => setMintCount(Math.max(1, mintCount - 1))}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              >
                -
              </button>
              <span className="font-mono text-xl">{mintCount}</span>
              <button 
                onClick={() => setMintCount(Math.min(5, mintCount + 1))}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              >
                +
              </button>
            </div>

            {/* Total Price */}
            <div className="flex justify-between items-center mb-6 text-sm">
               <span className="text-slate-400">Total Price</span>
               <span className="font-mono text-white font-bold">{mintCount * 50} STX</span>
            </div>

            {/* Action Button */}
            {userData ? (
              <button onClick={handleMint} className="w-full btn-primary shadow-lg shadow-stx-accent/30">
                CONFIRM MINT
              </button>
            ) : (
              <button onClick={connectWallet} className="w-full bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded cursor-pointer hover:bg-slate-600 transition">
                CONNECT TO MINT
              </button>
            )}

            <p className="text-center text-xs text-slate-500 mt-4">
              Secured by Stacks • Bitcoin L2
            </p>
          </div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-6 text-center text-slate-600 text-xs font-mono border-t border-slate-800">
        <p>STACKS TOOL v1.0.0 &copy; 2024 • SYSTEM NORMAL</p>
      </footer>
    </div>
  );
}

export default App;
