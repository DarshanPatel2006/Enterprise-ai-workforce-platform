import React from 'react';
import { 
  Sparkles, Award, Wallet, ArrowUpRight, GraduationCap, Briefcase 
} from 'lucide-react';

const EmployeeTimeline = ({ events = [] }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'join':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'salary':
        return <Wallet className="w-4 h-4 text-blue-400" />;
      case 'promotion':
        return <ArrowUpRight className="w-4 h-4 text-brand-primary" />;
      case 'award':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'certificate':
        return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'join': return 'border-emerald-500/30 bg-emerald-950/20';
      case 'salary': return 'border-blue-500/30 bg-blue-950/20';
      case 'promotion': return 'border-brand-primary/30 bg-brand-primary/10';
      case 'award': return 'border-amber-500/30 bg-amber-950/20';
      case 'certificate': return 'border-cyan-500/30 bg-cyan-950/20';
      default: return 'border-purple-500/30 bg-purple-950/20';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-10 bg-enterprise-900 border border-enterprise-800 rounded-xl">
        <p className="text-sm text-enterprise-500">No milestones recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col">
      <h3 className="font-bold text-enterprise-100 text-base mb-6 flex-shrink-0">Career Timeline</h3>
      
      <div className="max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-enterprise-800 scrollbar-track-transparent">
        <div className="relative pl-6 border-l-2 border-enterprise-800 space-y-8 ml-3 py-1">
        {events.map((event, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline node icon */}
            <div className={`absolute -left-[37px] top-1.5 w-7 h-7 rounded-full border flex items-center justify-center shadow-md ${getBorderColor(event.type)}`}>
              {getIcon(event.type)}
            </div>

            {/* Event Content card */}
            <div className="bg-enterprise-950 border border-enterprise-850 rounded-lg p-4 transition-all duration-150 group-hover:border-enterprise-700">
              <span className="text-[10px] font-bold text-enterprise-500 tracking-wider">
                {event.date}
              </span>
              <h4 className="font-bold text-enterprise-100 text-sm mt-0.5 group-hover:text-white transition-colors">
                {event.title}
              </h4>
              <p className="text-xs text-enterprise-400 mt-2 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default EmployeeTimeline;
