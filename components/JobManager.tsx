
import React, { useState, useRef, useMemo } from 'react';
import { Job, Status, User } from '../types';
import { Plus, Upload, X, Search, FileDown, Pencil, CheckSquare, Square } from 'lucide-react';

interface JobManagerProps {
  category: string;
  subCategory: string;
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (id: string, updates: Partial<Job>) => void;
  onDeleteJob: (id: string) => void;
  onDeleteCancelled: () => void;
  onBulkAddJobs: (jobs: Job[]) => void;
  currentUser: User;
}

export const JobManager: React.FC<JobManagerProps> = ({
  category,
  subCategory,
  jobs,
  onAddJob,
  onUpdateJob,
  onBulkAddJobs,
  currentUser
}) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Job>>({
    status: 'Pending',
    dateInput: new Date().toISOString().split('T')[0],
    keterangan: '',
    konfirmasiCabang: false,
    disposisi: false,
    approve: false
  });

  const isPenyesuaian = category === "Penyesuaian";

  const handleEdit = (job: Job) => {
    setEditingId(job.id);
    setFormData({
      dateInput: job.dateInput,
      branchDept: job.branchDept,
      jobType: job.jobType,
      status: job.status,
      deadline: job.deadline,
      keterangan: job.keterangan || '',
      konfirmasiCabang: job.konfirmasiCabang || false,
      disposisi: job.disposisi || false,
      approve: job.approve || false
    });
    setView('form');
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingId(null);
    setFormData({
      status: 'Pending',
      dateInput: new Date().toISOString().split('T')[0],
      branchDept: '',
      jobType: '',
      deadline: '',
      keterangan: '',
      konfirmasiCabang: false,
      disposisi: false,
      approve: false
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const jobPayload = {
      dateInput: formData.dateInput,
      branchDept: formData.branchDept,
      jobType: formData.jobType,
      status: formData.status as Status,
      deadline: formData.deadline,
      keterangan: formData.keterangan,
      konfirmasiCabang: formData.konfirmasiCabang,
      disposisi: formData.disposisi,
      approve: formData.approve
    };

    if (editingId) {
        onUpdateJob(editingId, jobPayload);
    } else {
        const newJob: Job = {
            id: crypto.randomUUID(),
            category,
            subCategory,
            ...jobPayload,
            dateInput: formData.dateInput || new Date().toISOString().split('T')[0],
            branchDept: formData.branchDept || '',
            jobType: formData.jobType || '',
            status: (formData.status as Status) || 'Pending',
            deadline: formData.deadline || '',
            createdBy: currentUser.email
        };
        onAddJob(newJob);
    }
    
    handleCancelForm();
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => 
        j.category === category && 
        j.subCategory === subCategory &&
        (j.branchDept.toLowerCase().includes(searchTerm.toLowerCase()) || 
        j.jobType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.keterangan && j.keterangan.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [jobs, category, subCategory, searchTerm]);

  const getStatusColor = (status: Status, deadline: string) => {
    const isOverdue = new Date() > new Date(deadline) && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(status);
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    switch (status) {
      case 'Completed':
      case 'DONE': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress': 
      case 'On Proses': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Hold': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancel':
      case 'Drop': return 'bg-slate-200 text-slate-800 border-slate-300';
      default: return 'bg-sky-50 text-sky-800 border-sky-100';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
      <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Daftar Pekerjaan (Saya)</h2>
          <div className="text-sm text-gray-400 mt-1 font-medium">{category} / {subCategory}</div>
        </div>
        
        {view === 'list' && (
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
              <button onClick={() => setView('form')} className="flex items-center justify-center px-6 py-2.5 bg-[#EE2E24] text-white rounded-xl hover:bg-red-700 text-sm font-bold shadow-lg shadow-red-100 transition-all active:scale-95"><Plus className="w-4 h-4 mr-2" /> Input Pekerjaan</button>
          </div>
        )}
      </div>

      <div className="p-6 flex-1 bg-gray-50/30">
        {view === 'form' ? (
          <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-gray-800 tracking-tight uppercase italic">Input <span className="text-[#EE2E24]">Data Baru</span></h3>
                <button onClick={handleCancelForm} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Tanggal</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-[#EE2E24] transition-all bg-gray-50/50" 
                    value={formData.dateInput} 
                    onChange={e => setFormData({...formData, dateInput: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Cabang / Dept</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Jakarta / Ops"
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-[#EE2E24] transition-all bg-gray-50/50" 
                    value={formData.branchDept} 
                    onChange={e => setFormData({...formData, branchDept: e.target.value})} 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Nama Pekerjaan</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Deskripsi pekerjaan..."
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-[#EE2E24] transition-all bg-gray-50/50" 
                    value={formData.jobType} 
                    onChange={e => setFormData({...formData, jobType: e.target.value})} 
                  />
                </div>
                 <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Keterangan (Optional)</label>
                  <textarea 
                    placeholder="Tambahkan catatan atau keterangan tambahan..."
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl min-h-[120px] focus:ring-4 focus:ring-red-50 focus:border-[#EE2E24] transition-all bg-gray-50/50" 
                    value={formData.keterangan || ''} 
                    onChange={e => setFormData({...formData, keterangan: e.target.value})} 
                  />
                </div>

                {/* Validasi & Persetujuan Panel (Sesuai Gambar) */}
                <div className="md:col-span-2 p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckSquare size={18} className="text-[#002F6C]" />
                        <span className="text-sm font-black text-[#002F6C] uppercase tracking-wider">Validasi & Persetujuan</span>
                    </div>
                    <div className="flex flex-wrap gap-10">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={formData.konfirmasiCabang} 
                                onChange={e => setFormData({...formData, konfirmasiCabang: e.target.checked})}
                            />
                            {formData.konfirmasiCabang ? <CheckSquare className="text-[#002F6C] w-6 h-6" /> : <Square className="text-gray-300 w-6 h-6 group-hover:text-[#002F6C]" />}
                            <span className="text-sm font-bold text-gray-700">Konfirmasi Cabang</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={formData.disposisi} 
                                onChange={e => setFormData({...formData, disposisi: e.target.checked})}
                            />
                            {formData.disposisi ? <CheckSquare className="text-[#002F6C] w-6 h-6" /> : <Square className="text-gray-300 w-6 h-6 group-hover:text-[#002F6C]" />}
                            <span className="text-sm font-bold text-gray-700">Disposisi</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={formData.approve} 
                                onChange={e => setFormData({...formData, approve: e.target.checked})}
                            />
                            {formData.approve ? <CheckSquare className="text-[#002F6C] w-6 h-6" /> : <Square className="text-gray-300 w-6 h-6 group-hover:text-[#002F6C]" />}
                            <span className="text-sm font-bold text-gray-700">Approve</span>
                        </label>
                    </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Status</label>
                  <select 
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-[#EE2E24] transition-all bg-gray-50/50 appearance-none" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as Status})}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Hold">Hold</option>
                    <option value="Cancel">Cancel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">Deadline</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-[#EE2E24] transition-all bg-gray-50/50" 
                    value={formData.deadline} 
                    onChange={e => setFormData({...formData, deadline: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex justify-end pt-10 gap-4">
                 <button type="button" onClick={handleCancelForm} className="px-10 py-3.5 border-2 border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all">Batal</button>
                <button type="submit" className="px-12 py-3.5 bg-[#002F6C] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-900 transition-all active:scale-95">Simpan Data</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Cari di data saya..." className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-red-50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            <div className="overflow-x-auto rounded-[2.5rem] border border-gray-100 shadow-xl bg-white overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                  <tr>
                    <th className="p-6">Pekerjaan</th>
                    <th className="p-6">Cabang / Dept</th>
                    <th className="p-6">Validasi</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Deadline</th>
                    <th className="p-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJobs.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center text-gray-400 italic font-medium">Belum ada data pekerjaan yang diinput.</td></tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50/80 transition-all group">
                        <td className="p-6">
                            <div className="font-black text-gray-800 text-[13px]">{job.jobType}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 italic truncate max-w-[200px]">{job.keterangan || '-'}</div>
                        </td>
                        <td className="p-6 font-black text-gray-800">{job.branchDept}</td>
                        <td className="p-6">
                            <div className="flex gap-2">
                                <div className={`w-3 h-3 rounded-full ${job.konfirmasiCabang ? 'bg-green-500' : 'bg-gray-200'}`} title="Konfirmasi Cabang"></div>
                                <div className={`w-3 h-3 rounded-full ${job.disposisi ? 'bg-blue-500' : 'bg-gray-200'}`} title="Disposisi"></div>
                                <div className={`w-3 h-3 rounded-full ${job.approve ? 'bg-indigo-500' : 'bg-gray-200'}`} title="Approve"></div>
                            </div>
                        </td>
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${getStatusColor(job.status, job.deadline)}`}>{job.status}</span>
                        </td>
                        <td className="p-6 font-black">{new Date(job.deadline).toLocaleDateString('id-ID')}</td>
                        <td className="p-6 text-center">
                          <button onClick={() => handleEdit(job)} className="p-3 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Edit Data"><Pencil className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
