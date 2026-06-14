import React, { useState } from 'react';
import API from '../services/api';
import { 
  MessageSquare, FileText, Compass, Send, Sparkles, Upload, 
  BookOpen, CheckCircle, AlertCircle, HelpCircle, ChevronRight 
} from 'lucide-react';

const AIWorkspace = () => {
  const [activeTab, setActiveTab] = useState('chat'); // chat, meeting, career
  
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your Enterprise AI Assistant. I can help answer HR questions, explain policies, detail project rules, and direct you to training documentation. What would you like to know today?', source: '', model: '' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Meeting Assistant States
  const [notesText, setNotesText] = useState('');
  const [notesFile, setNotesFile] = useState(null);
  const [meetingResult, setMeetingResult] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(false);

  // Career Planner States
  const [targetRole, setTargetRole] = useState('');
  const [currentSkills, setCurrentSkills] = useState('');
  const [careerResult, setCareerResult] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);

  // --- AI CHAT ASSISTANT HANDLERS ---
  const handleSendChat = async (textToSend = null) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    if (!textToSend) setChatInput('');
    
    // Add user message
    const updatedMessages = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(updatedMessages);
    setChatLoading(true);

    try {
      const res = await API.post('/api/ai/chat', { query });
      setChatMessages([...updatedMessages, { 
        role: 'assistant', 
        text: res.data.answer,
        source: res.data.rag_source,
        model: res.data.model_used
      }]);
    } catch (err) {
      console.error(err);
      setChatMessages([...updatedMessages, { 
        role: 'assistant', 
        text: 'Sorry, I encountered an error searching the knowledge base. Please check if the API services are running.',
        source: 'Error Fallback',
        model: 'None'
      }]);
    }
    setChatLoading(false);
  };

  const sampleQuestions = [
    { text: "How do I apply for annual leave?", label: "HR handbook leaves" },
    { text: "What is the policy for late arrivals?", label: "Attendance regulations" },
    { text: "How do I submit my completed task?", label: "Work submission guidelines" },
    { text: "Are there any training resources for FastAPI?", label: "Learning materials" }
  ];

  // --- MEETING ASSISTANT HANDLERS ---
  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!notesText.trim() && !notesFile) return;

    setMeetingLoading(true);
    setMeetingResult(null);

    const formData = new FormData();
    if (notesText) formData.append('transcript', notesText);
    if (notesFile) formData.append('file', notesFile);

    try {
      const res = await API.post('/api/ai/meeting', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMeetingResult(res.data);
    } catch (err) {
      console.error(err);
    }
    setMeetingLoading(false);
  };

  // --- CAREER PLANNER HANDLERS ---
  const handleCareerSubmit = async (e) => {
    e.preventDefault();
    if (!targetRole.trim() || !currentSkills.trim()) return;

    setCareerLoading(true);
    setCareerResult(null);

    const formData = new FormData();
    formData.append('target_role', targetRole);
    formData.append('skills', currentSkills);

    try {
      const res = await API.post('/api/ai/career', formData);
      setCareerResult(res.data);
    } catch (err) {
      console.error(err);
    }
    setCareerLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-5 border-b border-enterprise-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span>AI Workspace</span>
          </h2>
          <p className="text-xs text-enterprise-400 mt-1">Access RAG search pipelines, meeting summarizers, and career planners.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-enterprise-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all duration-150 ${
            activeTab === 'chat' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-enterprise-400 hover:text-enterprise-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Company Assistant (RAG)</span>
        </button>
        <button
          onClick={() => setActiveTab('meeting')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all duration-150 ${
            activeTab === 'meeting' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-enterprise-400 hover:text-enterprise-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Meeting Assistant</span>
        </button>
        <button
          onClick={() => setActiveTab('career')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all duration-150 ${
            activeTab === 'career' 
              ? 'border-brand-primary text-brand-primary' 
              : 'border-transparent text-enterprise-400 hover:text-enterprise-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Career Path Planner</span>
        </button>
      </div>

      {/* --- TAB CONTENT: RAG CHAT --- */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-270px)]">
          {/* Chat Window */}
          <div className="lg:col-span-3 flex flex-col bg-enterprise-900 border border-enterprise-800 rounded-xl overflow-hidden shadow-sm h-full">
            {/* Messages Area */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-xl p-4 text-xs leading-relaxed space-y-2 border ${
                    msg.role === 'user'
                      ? 'bg-brand-primary border-brand-primary text-white'
                      : 'bg-enterprise-950 border-enterprise-850 text-enterprise-200'
                  }`}>
                    <p className="whitespace-pre-line font-medium">{msg.text}</p>
                    
                    {/* Metadata tags for AI response */}
                    {msg.role === 'assistant' && msg.source && (
                      <div className="border-t border-enterprise-850/50 pt-2 flex flex-wrap gap-2 text-[10px] text-enterprise-500 font-semibold uppercase tracking-wider">
                        <span>Source: {msg.source}</span>
                        <span>•</span>
                        <span>Model: {msg.model}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] bg-enterprise-950 border border-enterprise-850 rounded-xl p-4 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-enterprise-850 bg-enterprise-950/20">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ask a question about employee handbook, hybrid remote rules, task submissions..."
                  className="w-full pl-4 pr-12 py-3 bg-enterprise-950 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 placeholder-enterprise-600 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={!chatInput.trim()}
                  className="absolute right-2 top-2 p-1.5 bg-brand-primary hover:bg-brand-hover disabled:bg-enterprise-800 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Help Sidebar */}
          <div className="space-y-6">
            <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-enterprise-100 text-xs flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-brand-primary" />
                <span>Quick Questions</span>
              </h3>
              <p className="text-[11px] text-enterprise-500">Click a sample question to test the Multi-RAG query classification and vector routing.</p>
              <div className="space-y-2">
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(q.text)}
                    className="w-full text-left p-3 bg-enterprise-950 border border-enterprise-850 hover:border-enterprise-700 rounded-lg text-[11px] font-semibold text-enterprise-300 transition-colors flex items-center justify-between group"
                  >
                    <span>{q.text}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-enterprise-600 group-hover:text-brand-primary transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: MEETING SUMMARY --- */}
      {activeTab === 'meeting' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Paste notes panel */}
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm flex flex-col space-y-5">
            <div>
              <h3 className="font-bold text-enterprise-100 text-sm">Upload Transcript or Notes</h3>
              <p className="text-xs text-enterprise-500 mt-1">Paste a meeting discussion transcript below or upload a plain text transcript file.</p>
            </div>
            
            <form onSubmit={handleMeetingSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Paste Transcript</label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="e.g., Sarah: We need to finalize the JWT token duration. Marcus: Let's set it to 24 hours. Thomas: I will write the middleware today..."
                  className="w-full h-[250px] p-4 bg-enterprise-950 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Or Upload TXT File</label>
                <div className="flex items-center space-x-3 p-3 bg-enterprise-950 border border-enterprise-800 rounded-xl">
                  <Upload className="w-5 h-5 text-enterprise-500 shrink-0" />
                  <input
                    type="file"
                    accept=".txt"
                    onChange={(e) => setNotesFile(e.target.files[0])}
                    className="text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-enterprise-800 file:text-enterprise-300 hover:file:bg-enterprise-700 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={meetingLoading || (!notesText.trim() && !notesFile)}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover disabled:bg-enterprise-800 disabled:text-enterprise-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {meetingLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Summary & Action Items</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result panel */}
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm min-h-[400px]">
            <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-4">Analysis Result</h3>
            
            {meetingLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-enterprise-500 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
                <span className="text-xs">Analyzing transcript details using routed LLM...</span>
              </div>
            )}

            {!meetingLoading && !meetingResult && (
              <div className="flex flex-col items-center justify-center py-24 text-enterprise-600 border border-dashed border-enterprise-800 rounded-xl h-[90%]">
                <FileText className="w-12 h-12 opacity-20 mb-2" />
                <span className="text-xs font-semibold">Await input submit</span>
              </div>
            )}

            {!meetingLoading && meetingResult && (
              <div className="space-y-6 text-xs text-enterprise-300">
                <div className="space-y-2">
                  <h4 className="font-bold text-enterprise-200 uppercase tracking-wider text-[10px]">Executive Summary</h4>
                  <p className="bg-enterprise-950 p-4 border border-enterprise-850 rounded-xl leading-relaxed">{meetingResult.summary}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-brand-primary uppercase tracking-wider text-[10px]">Action Items</h4>
                  <ul className="list-disc list-inside space-y-1.5 bg-enterprise-950/50 p-4 rounded-xl border border-enterprise-850/50">
                    {meetingResult.action_items.map((item, idx) => (
                      <li key={idx} className="leading-snug">{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-brand-danger uppercase tracking-wider text-[10px]">Deadlines</h4>
                    <ul className="list-disc list-inside space-y-1 bg-enterprise-950 p-3 rounded-xl border border-enterprise-850">
                      {meetingResult.deadlines.map((item, idx) => (
                        <li key={idx} className="truncate">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-brand-success uppercase tracking-wider text-[10px]">Key Decisions</h4>
                    <ul className="list-disc list-inside space-y-1 bg-enterprise-950 p-3 rounded-xl border border-enterprise-850">
                      {meetingResult.key_decisions.map((item, idx) => (
                        <li key={idx} className="truncate">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: CAREER PLANNER --- */}
      {activeTab === 'career' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Config form */}
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm h-fit">
            <h3 className="font-bold text-enterprise-100 text-sm mb-4">Skill Gap Input</h3>
            <form onSubmit={handleCareerSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">Desired Target Role</label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior AI Backend Engineer"
                  className="w-full px-4 py-2.5 bg-enterprise-950 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-enterprise-400 uppercase tracking-wider">My Current Skills</label>
                <textarea
                  required
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  placeholder="e.g., Python, FastAPI, SQLite, Git (comma separated)"
                  className="w-full h-[120px] p-4 bg-enterprise-950 border border-enterprise-800 hover:border-enterprise-750 focus:border-brand-primary rounded-xl text-xs text-enterprise-100 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <button
                type="submit"
                disabled={careerLoading || !targetRole.trim() || !currentSkills.trim()}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover disabled:bg-enterprise-800 disabled:text-enterprise-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {careerLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Run Skill Gap Analysis</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results panel */}
          <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm lg:col-span-2 min-h-[400px]">
            <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 mb-4">Career Progression Engine Report</h3>
            
            {careerLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-enterprise-500 space-y-3 animate-pulse">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-primary"></div>
                <span className="text-xs">Computing skills overlap and recommendations...</span>
              </div>
            )}

            {!careerLoading && !careerResult && (
              <div className="flex flex-col items-center justify-center py-24 text-enterprise-600 border border-dashed border-enterprise-800 rounded-xl h-[85%]">
                <Compass className="w-12 h-12 opacity-20 mb-2 animate-spin" style={{ animationDuration: '20s' }} />
                <span className="text-xs font-semibold">Enter your target role and skills to compute roadmap</span>
              </div>
            )}

            {!careerLoading && careerResult && (
              <div className="space-y-6 text-xs text-enterprise-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-enterprise-950 p-4 border border-enterprise-850 rounded-xl">
                  <div>
                    <h4 className="text-[10px] text-enterprise-500 font-bold uppercase tracking-wider">Promotion Readiness</h4>
                    <p className="text-sm font-extrabold text-enterprise-100 mt-0.5">{careerResult.promotion_readiness}</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-brand-success/15 border border-brand-success/30 px-3 py-1 rounded text-brand-success font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Assessment Completed</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-enterprise-200 uppercase tracking-wider text-[10px]">Skill Gap Analysis</h4>
                  <p className="bg-enterprise-950 p-4 border border-enterprise-850 rounded-xl leading-relaxed">{careerResult.skill_gap_analysis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Required skills */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-brand-primary uppercase tracking-wider text-[10px]">Core Target Skills Required</h4>
                    <div className="bg-enterprise-950 p-4 border border-enterprise-850 rounded-xl space-y-2">
                      {careerResult.required_skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          <span className="font-semibold text-enterprise-200">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-brand-warning uppercase tracking-wider text-[10px]">Improvement Suggestions</h4>
                    <div className="bg-enterprise-950 p-4 border border-enterprise-850 rounded-xl space-y-2">
                      {careerResult.improvement_suggestions.map((sug, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-brand-warning shrink-0 mt-0.5" />
                          <span className="leading-snug">{sug}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Learning path */}
                <div className="space-y-2">
                  <h4 className="font-bold text-brand-success uppercase tracking-wider text-[10px]">AI-Generated Learning Path</h4>
                  <div className="bg-enterprise-950 p-4 border border-enterprise-850 rounded-xl space-y-3">
                    {careerResult.learning_path.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <span className="w-5 h-5 rounded-full bg-brand-success/10 border border-brand-success/30 text-brand-success flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed mt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIWorkspace;
