import React from 'react';
import { Clock, Calendar, CheckSquare, RefreshCw, Eye } from 'lucide-react';

const KanbanBoard = ({ tasks, onTaskClick, onReviewClick, userRole }) => {
  const columns = [
    { id: 'Todo', title: 'To Do', color: 'border-t-brand-danger bg-rose-950/10' },
    { id: 'In Progress', title: 'In Progress', color: 'border-t-brand-warning bg-amber-950/10' },
    { id: 'Testing', title: 'Testing', color: 'border-t-brand-info bg-cyan-950/10' },
    { id: 'Completed', title: 'Completed', color: 'border-t-brand-success bg-emerald-950/10' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-220px)] overflow-hidden">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        
        return (
          <div 
            key={col.id} 
            className="flex flex-col bg-enterprise-900 border border-enterprise-800 rounded-xl max-h-full overflow-hidden"
          >
            {/* Column Header */}
            <div className={`p-4 border-t-4 ${col.color} border-b border-enterprise-850 flex items-center justify-between`}>
              <h3 className="font-bold text-enterprise-200 text-sm tracking-wide uppercase">{col.title}</h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-enterprise-800 text-enterprise-400">
                {colTasks.length}
              </span>
            </div>

            {/* Tasks Container */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0">
              {colTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-enterprise-600 border border-dashed border-enterprise-800 rounded-lg">
                  <CheckSquare className="w-8 h-8 opacity-20 mb-2" />
                  <span className="text-xs">No Tasks</span>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 bg-enterprise-950 border border-enterprise-850 hover:border-enterprise-700 rounded-lg shadow-sm transition-all duration-150 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-enterprise-100 text-sm leading-snug group-hover:text-white transition-colors">
                          {task.title}
                        </h4>
                      </div>
                      <p className="text-xs text-enterprise-400 line-clamp-2 mb-4">
                        {task.description}
                      </p>
                    </div>

                    <div className="border-t border-enterprise-850/50 pt-3 flex flex-col space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-enterprise-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{task.due_date || 'No Date'}</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-bold">
                          Weight: {task.weight}
                        </span>
                      </div>

                      {/* Action buttons based on task state and role */}
                      {col.id === 'Testing' && userRole === 'Manager' && (
                        <button
                          onClick={() => onReviewClick(task)}
                          className="w-full mt-2 py-1.5 px-3 bg-brand-primary hover:bg-brand-hover text-white rounded font-medium text-xs flex items-center justify-center space-x-1.5 shadow transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Work</span>
                        </button>
                      )}

                      {col.id !== 'Testing' && col.id !== 'Completed' && userRole === 'Employee' && (
                        <button
                          onClick={() => onTaskClick(task)}
                          className="w-full mt-2 py-1.5 px-3 bg-enterprise-800 hover:bg-enterprise-700 text-enterprise-200 rounded font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Submit Work</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
