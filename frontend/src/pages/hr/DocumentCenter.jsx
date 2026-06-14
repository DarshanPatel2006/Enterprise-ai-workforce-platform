import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { FileText, Download, Sparkles, AlertCircle } from 'lucide-react';

const DocumentCenter = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form States
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [docType, setDocType] = useState('Offer');
  
  // Custom Fields States
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [salary, setSalary] = useState('');
  const [oldRole, setOldRole] = useState('');
  const [newRole, setNewRole] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [area, setArea] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/hr/employees');
      setEmployees(res.data.filter(u => u.role !== 'Super Admin'));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEmpId || !docType) return;

    setGenerating(true);
    
    // Construct dynamic metadata based on document type
    const metadata = {};
    if (docType === 'Offer' || docType === 'Appointment') {
      if (joiningDate) metadata.joining_date = joiningDate;
      if (salary) metadata.salary = salary;
    } else if (docType === 'Promotion') {
      if (oldRole) metadata.old_role = oldRole;
      if (newRole) metadata.role = newRole;
      if (effectiveDate) metadata.effective_date = effectiveDate;
      if (salary) metadata.salary = salary;
    } else if (docType === 'Warning') {
      if (reason) metadata.reason = reason;
    } else if (docType === 'Experience') {
      if (startDate) metadata.start_date = startDate;
      if (endDate) metadata.end_date = endDate;
      if (newRole) metadata.role = newRole;
    } else if (docType === 'Internship') {
      if (area) metadata.area = area;
      if (startDate) metadata.start_date = startDate;
      if (endDate) metadata.end_date = endDate;
    }

    try {
      const response = await API.post(
        `/api/hr/documents/generate?letter_type=${docType}&emp_id=${selectedEmpId}`,
        metadata,
        { responseType: 'blob' } // CRITICAL: Treat response as a file binary stream
      );

      // Create browser download link for the blob
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `${docType.toLowerCase()}_letter_${selectedEmpId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert("Document generated and downloaded successfully!");
    } catch (err) {
      console.error("Failed to generate document", err);
      alert("Failed to compile document PDF.");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-enterprise-800">
        <h2 className="text-xl font-bold text-enterprise-50 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-brand-primary" />
          <span>HR Document Intelligence Center</span>
        </h2>
        <p className="text-xs text-enterprise-400 mt-1">HR Panel: Auto-generate official corporate letters and internship certificates compiled to PDF.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Generation Config Panel */}
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-enterprise-100 text-sm mb-4">Letter Configurations</h3>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-brand-primary"></div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee Select */}
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Select Staff</label>
                  <select
                    required
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  >
                    <option value="">Choose Employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.profile ? `${e.profile.first_name} ${e.profile.last_name}` : e.email} ({e.profile?.employee_id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doc Type Select */}
                <div className="space-y-2">
                  <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-4 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                  >
                    <option value="Offer">Offer Letter</option>
                    <option value="Appointment">Appointment Letter</option>
                    <option value="Promotion">Promotion Letter</option>
                    <option value="Warning">Warning Letter</option>
                    <option value="Experience">Experience Letter</option>
                    <option value="Internship">Internship Certificate</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC FORM FIELDS BASED ON SELECTED DOC TYPE */}
              <div className="border-t border-enterprise-850 pt-4 space-y-4">
                {(docType === 'Offer' || docType === 'Appointment') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Joining Date</label>
                      <input
                        type="date"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Offered Salary ($ / Year)</label>
                      <input
                        type="text"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="80,000"
                        className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {docType === 'Promotion' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Current Role</label>
                        <input
                          type="text"
                          value={oldRole}
                          onChange={(e) => setOldRole(e.target.value)}
                          placeholder="Junior Developer"
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">New Role</label>
                        <input
                          type="text"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          placeholder="Senior Developer"
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">New Salary ($ / Year)</label>
                        <input
                          type="text"
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          placeholder="95,000"
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Effective Date</label>
                        <input
                          type="date"
                          value={effectiveDate}
                          onChange={(e) => setEffectiveDate(e.target.value)}
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {docType === 'Warning' && (
                  <div className="space-y-2">
                    <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Reason for Warning</label>
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. repeated unexcused lateness exceeding 4 days in June..."
                      className="w-full h-[90px] p-3 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                    />
                  </div>
                )}

                {docType === 'Experience' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Role Served</label>
                      <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="AI Researcher"
                        className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Start Date</label>
                      <input
                        type="text"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        placeholder="Jan 10, 2024"
                        className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {docType === 'Internship' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Internship Track / Area</label>
                      <input
                        type="text"
                        required
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. LLM Prompt Orchestration & Testing"
                        className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">Start Date</label>
                        <input
                          type="text"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          placeholder="e.g. Feb 01, 2026"
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-enterprise-450 font-bold uppercase tracking-wider text-[10px]">End Date</label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-enterprise-950 border border-enterprise-850 rounded-xl text-enterprise-100 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={generating || !selectedEmpId}
                className="w-full py-3 px-4 mt-6 bg-brand-primary hover:bg-brand-hover disabled:bg-enterprise-800 disabled:text-enterprise-500 text-white font-semibold rounded-xl shadow shadow-brand-primary/10 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Generate & Download PDF</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Informative Sidebar */}
        <div className="bg-enterprise-900 border border-enterprise-800 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-enterprise-100 text-sm pb-3 border-b border-enterprise-850 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span>Document Intelligence</span>
          </h3>
          <p className="text-xs text-enterprise-450 leading-relaxed">
            The platform combines rule-based document structures with AI to compile professional employment documents dynamically.
          </p>
          <div className="p-4 bg-enterprise-950 border border-enterprise-850 rounded-xl text-xs space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-primary text-[9px] shrink-0 mt-0.5">1</div>
              <p className="text-enterprise-300">Select an active staff profile or candidate from the dropdown database.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-primary text-[9px] shrink-0 mt-0.5">2</div>
              <p className="text-enterprise-300">Select the letter category. The form will dynamically morph to present fields required by the target template.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-bold text-brand-primary text-[9px] shrink-0 mt-0.5">3</div>
              <p className="text-enterprise-300">Submit to disburse, generate official headers, compile the text, and download a print-ready PDF compiled on the fly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentCenter;
