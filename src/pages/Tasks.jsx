import React from 'react';

const Tasks = ({ tasks, handleTask }) => {
  return (
    <div className="space-y-6">
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
                  onClick={() => handleTask(task.id)}
                  disabled={task.completed}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    task.completed 
                    ? "bg-slate-800 text-slate-500 cursor-default" 
                    : "bg-white text-black hover:bg-stx-accent hover:text-white"
                  }`}
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
