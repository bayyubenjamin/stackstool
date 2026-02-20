import React, { useState, useEffect } from 'react';
import { callReadOnlyFunction, standardPrincipalCV, uintCV, cvToValue } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { userSession } from '../supabaseClient'; 

// --- CONFIGURATION V10 ---
const CONTRACT_ADDRESS = 'SP3GHKMV4GSYNA8WGBX83DACG80K1RRVQZAZMB9J3'; 
const CONTRACT_NAME = 'genesis-missions-v10'; // DISESUAIKAN DENGAN V10
const CHECK_FUNCTION_NAME = 'is-task-done'; 

const Tasks = ({ initialTasks, handleTask }) => {
  const [tasks, setTasks] = useState(initialTasks || []);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const network = new StacksMainnet();

  useEffect(() => {
    if (userSession.isUserSignedIn() && initialTasks && initialTasks.length > 0) {
      syncTaskStatusFromBlockchain();
    } else {
        setTasks(initialTasks || []);
    }
  }, [initialTasks]);

  const syncTaskStatusFromBlockchain = async () => {
    setLoadingTasks(true);
    const userData = userSession.loadUserData();
    const userAddress = userData.profile.stxAddress.mainnet;

    try {
      const updatedTasks = await Promise.all(
        initialTasks.map(async (task) => {
            try {
                const statusData = await callReadOnlyFunction({
                    contractAddress: CONTRACT_ADDRESS,
                    contractName: CONTRACT_NAME,
                    functionName: CHECK_FUNCTION_NAME,
                    functionArgs: [
                        standardPrincipalCV(userAddress),
                        uintCV(task.id)
                    ],
                    network,
                    senderAddress: userAddress
                });

                const val = cvToValue(statusData);
                const isCompleted = val.value === true || val === true; 

                return { ...task, completed: isCompleted };
            } catch (err) {
                console.warn(`Failed to fetch status for task ${task.id}`, err);
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

  const onTaskClick = async (taskId) => {
     const txSucceeded = await handleTask(taskId); 
     if(txSucceeded !== false) { 
         setTasks(prevTasks => prevTasks.map(t => 
             t.id === taskId ? { ...t, completed: true } : t
         ));
         setTimeout(() => {
             syncTaskStatusFromBlockchain();
         }, 10000); 
     }
  };

  return (
    <div className="space-y-6 relative">
      {loadingTasks && (
          <div className="absolute -top-10 right-0 flex items-center text-xs text-indigo-400 animate-pulse">
              Syncing with v10 blockchain...
          </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Mission Board</h2>
        <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
          {tasks.filter(t => t.completed).length}/{tasks.length} COMPLETE
        </span>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="group relative bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all duration-300">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg ${
                  task.completed ? "bg-green-500 text-black" : "bg-slate-800 text-slate-400"
                }`}>
                  {task.completed ? "✓" : task.icon || "📋"}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{task.name}</h3>
                  <p className="text-slate-400 text-sm">{task.desc}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-indigo-400 font-bold font-mono mb-2">+{task.reward} XP</div>
                <button 
                  onClick={() => onTaskClick(task.id)}
                  disabled={task.completed || loadingTasks}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    task.completed 
                    ? "bg-slate-800 text-slate-500 cursor-default" 
                    : "bg-white text-black hover:bg-indigo-400 hover:text-white"
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
