import React, { useState, useEffect } from 'react';
import { callReadOnlyFunction, standardPrincipalCV, uintCV, cvToValue } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { userSession } from '../supabaseClient'; // Asumsi lokasi supabaseClient sama dengan Vault.jsx

// --- SESUAIKAN KONFIGURASI INI ---
// Alamat contract tempat fungsi cek status task berada
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; // Ganti dengan address lu
// Nama contract yang menyimpan status task (kemungkinan genesis-missions-v4 atau contract core lu)
const CONTRACT_NAME = 'genesis-missions-v5'; 
// Nama fungsi read-only di contract lu untuk mengecek status task (misal: 'is-task-completed', 'get-task-status', dll)
// ASUMSI: fungsi ini menerima 'user' (principal) dan 'task-id' (uint) dan me-return (response bool uint) atau (bool)
const CHECK_FUNCTION_NAME = 'is-task-completed'; 

const Tasks = ({ initialTasks, handleTask }) => {
  // Gunakan local state untuk manage task agar bisa di-update real-time
  const [tasks, setTasks] = useState(initialTasks || []);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const network = new StacksMainnet();

  useEffect(() => {
    if (userSession.isUserSignedIn() && initialTasks && initialTasks.length > 0) {
      syncTaskStatusFromBlockchain();
    } else {
        setTasks(initialTasks || []);
    }
  }, [initialTasks]); // Re-run jika initialTasks berubah atau user login

  const syncTaskStatusFromBlockchain = async () => {
    setLoadingTasks(true);
    const userData = userSession.loadUserData();
    const userAddress = userData.profile.stxAddress.mainnet;

    try {
      // Loop untuk fetch status setiap task
      // NOTE: Idealnya di contract ada fungsi yg return list status, biar gak fetch satu-satu.
      // Tapi untuk sekarang kita loop.
      const updatedTasks = await Promise.all(
        initialTasks.map(async (task) => {
            // Task harian (Daily Check-in) biasanya punya logic berbeda di contract,
            // Jika ID task ini merepresentasikan daily check-in, pastikan contract lu punya 
            // fungsi buat cek apakah user udah check-in HARI INI.
            // Di bawah ini adalah contoh fetch untuk task biasa berbasis ID.
            
            try {
                const statusData = await callReadOnlyFunction({
                    contractAddress: CONTRACT_ADDRESS,
                    contractName: CONTRACT_NAME,
                    functionName: CHECK_FUNCTION_NAME,
                    functionArgs: [
                        standardPrincipalCV(userAddress),
                        uintCV(task.id) // Asumsi fungsi menerima ID task
                    ],
                    network,
                    senderAddress: userAddress
                });

                // cvToValue mengubah tipe data Clarity (response/bool) menjadi JS object
                const val = cvToValue(statusData);
                
                // ASUMSI: fungsi contract mengembalikan boolean `true` jika selesai.
                // Sesuaikan 'isCompleted' ini dengan struktur return value dari contract lu.
                // Misal: val.value === true (jika return (response bool ...)) atau val === true (jika lsg bool)
                const isCompleted = val.value === true || val === true; 

                return { ...task, completed: isCompleted };

            } catch (err) {
                console.warn(`Failed to fetch status for task ${task.id}`, err);
                // Jika gagal fetch (misal fungsi belum ada), fallback ke state awal
                return task; 
            }
        })
      );
      
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Error syncing tasks:", error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Wrapper untuk handleTask agar bisa mengupdate local state sementara nunggu block confirm (Optimistic UI Update)
  const onTaskClick = async (taskId) => {
     // Panggil fungsi asli dari parent untuk kirim Tx
     const txSucceeded = await handleTask(taskId); 
     
     // Jika parent return true atau tx berhasil dikirim, kita optimis update UI
     // Walaupun aslinya harus nunggu block confirm, buat UX lebih enak dibikin loading/completed sementara
     if(txSucceeded !== false) { 
         // Opsional: lu bisa ubah state sementara jadi "Pending" disini kalau mau
         // Tapi untuk meminimalisir error duplikat click, kita disabled dulu.
         setTasks(prevTasks => prevTasks.map(t => 
             t.id === taskId ? { ...t, completed: true } : t
         ));
         
         // Fetch ulang status asli setelah beberapa detik untuk memastikan data akurat
         setTimeout(() => {
             syncTaskStatusFromBlockchain();
         }, 10000); 
     }
  };


  return (
    <div className="space-y-6 relative">
       {/* Indikator Loading Global */}
      {loadingTasks && (
          <div className="absolute -top-10 right-0 flex items-center text-xs text-stx-accent animate-pulse">
              Syncing with blockchain...
          </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Mission Board</h2>
        <span className="bg-stx-accent/20 text-stx-accent px-3 py-1 rounded-full text-xs font-bold">
          {tasks.filter(t => t.completed).length}/{tasks.length} COMPLETE
        </span>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-stx-accent/50 transition-all duration-300">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg ${
                  task.completed ? "bg-green-500 text-black" : "bg-slate-800 text-slate-400"
                }`}>
                  {task.completed ? "✓" : task.icon || "📋"}
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-stx-accent transition-colors">{task.name}</h3>
                  <p className="text-slate-400 text-sm">{task.desc || "Complete this mission to earn rewards."}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-stx-accent font-bold font-mono mb-2">+{task.reward} XP</div>
                <button 
                  onClick={() => onTaskClick(task.id)}
                  disabled={task.completed || loadingTasks}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    task.completed 
                    ? "bg-slate-800 text-slate-500 cursor-default" 
                    : "bg-white text-black hover:bg-stx-accent hover:text-white"
                  } ${loadingTasks && !task.completed ? "opacity-50 cursor-wait" : ""}`}
                >
                  {task.completed ? "Claimed" : "Start"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
