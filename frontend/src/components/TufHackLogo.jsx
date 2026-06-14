import React from 'react';

const TufHackLogo = ({ className = 'text-sm', isDark = true }) => {
  return (
    <div className={`flex items-center space-x-1.5 font-bold tracking-tight select-none ${className}`}>
      {/* TUF block: Black background, white text */}
      <span className="bg-black text-white px-2 py-0.5 rounded border border-enterprise-800 shadow-sm font-sans uppercase">
        TUF
      </span>
      
      {/* Center Divider: </> font style */}
      <span className="text-brand-primary font-mono font-extrabold">
        &lt;/&gt;
      </span>
      
      {/* HACK block: White background, black text */}
      <span className={`px-2 py-0.5 rounded shadow-sm font-sans uppercase ${isDark ? 'bg-white text-black' : 'bg-enterprise-950 text-white border border-enterprise-800'}`}>
        HACK
      </span>
    </div>
  );
};

export default TufHackLogo;
