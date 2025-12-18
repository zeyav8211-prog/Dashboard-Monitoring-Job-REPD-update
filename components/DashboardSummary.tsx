
import React, { useMemo, useState } from 'react';
import { Job, Status } from '../types';
import { MENU_STRUCTURE } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  AlertCircle, CheckCircle2, Clock, CalendarDays, ArrowLeft, Search, 
  LayoutDashboard, Hourglass, AlertOctagon, AlertTriangle, 
  RefreshCcw, X, User, Briefcase, Info, TrendingUp, Target, Trash2
} from 'lucide-react';

interface DashboardSummaryProps {
  jobs: Job[]; 
  allJobs?: Job[]; 
  onDeleteJob: (id: string) => void;
  isLoading?: boolean;
  isSaving?: boolean;
  storageProvider?: 'GAS' | 'JSONBIN' | 'BOTH';
  onProviderChange?: (provider: 'GAS' | 'JSONBIN' | 'BOTH') => void;
  onForceSync?: () => void;
}

const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6366F1', '#EE2E24', '#002F6C', '#94a3b8'];

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({ 
    jobs, 
    allJobs = [],
    onDeleteJob,
    isLoading = false,
    storageProvider = 'GAS',
    onProviderChange,
    onForceSync
}) => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const summarySource = allJobs.length > 0 ? allJobs : jobs;

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    
    return {
        total: summarySource.length,
        completed: summarySource.filter(j => ['Completed', 'DONE'].includes(j.status)).length,
        pending: summarySource.filter(j => j.status === 'Pending').length,
        inProgress: summarySource.filter(j => ['In Progress', 'On Proses'].includes(j.status)).length,
        hold: summarySource.filter(j => j.status === 'Hold').length,
        cancelled: summarySource.filter(j => ['Cancel', 'Drop'].includes(j.status)).length,
        overdue: summarySource.filter(j => new Date(j.deadline) <= today && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status)).length,
        nearDeadline: summarySource.filter(j => {
            const dl = new Date(j.deadline); dl.setHours(0,0,0,0);
            return dl.getTime() === tomorrow.getTime() && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status);
        }).length
    };
  }, [summarySource]);

  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(MENU_STRUCTURE).forEach(cat => counts[cat] = 0);
    summarySource.forEach(job => {
      if (counts[job.category] !== undefined) {
        counts[job.category] = (counts[job.category] || 0) + 1;
      }
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [summarySource]);

  const pieData = useMemo(() => [
    { name: 'Pending', value: stats.pending },
    { name: 'On Proses', value: stats.inProgress },
    { name: 'Completed', value: stats.completed },
    { name: 'Hold', value: stats.hold },
    { name: 'Dropped', value: stats.cancelled },
    { name: 'Deadline', value: stats.overdue },
  ].filter(d => d.value > 0), [stats]);

  const filteredJobsList = useMemo(() => {
    if (!filterStatus) return [];
    let result = jobs; 
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    if (filterStatus === 'Total') result = jobs;
    else if (filterStatus === 'Critical (H-0)') result = jobs.filter(j => new Date(j.deadline) <= today && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status));
    else if (filterStatus === 'Warning (H-1)') result = jobs.filter(j => { const dl = new Date(j.deadline); dl.setHours(0,0,0,0); return dl.getTime() === tomorrow.getTime() && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status); });
    else if (filterStatus === 'Completed') result = jobs.filter(j => ['Completed', 'DONE'].includes(j.status));
    else if (filterStatus === 'In Progress' || filterStatus === 'On Proses') result = jobs.filter(j => ['In Progress', 'On Proses'].includes(j.status));
    else if (filterStatus === 'Pending') result = jobs.filter(j => j.status === 'Pending');
    else if (filterStatus === 'Hold') result = jobs.filter(j => j.status === 'Hold');
    else if (filterStatus === 'Cancelled/Drop' || filterStatus === 'Dropped') result = jobs.filter(j => ['Cancel', 'Drop'].includes(j.status));
    else if (Object.keys(MENU_STRUCTURE).includes(filterStatus)) result = jobs.filter(j => j.category === filterStatus);

    if (searchTerm) {
        const s = searchTerm.toLowerCase();
        result = result.filter(j => j.branchDept.toLowerCase().includes(s) || j.jobType.toLowerCase().includes(s) || j.category.toLowerCase().includes(s));
    }
    return result;
  }, [jobs, filterStatus, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ALERTS SECTION */}
      <div className="space-y-3">
        {stats.overdue > 0 && (
          <div onClick={() => setFilterStatus('Critical (H-0)')} className="animate-blink-red p-4 rounded-xl shadow-lg flex items-center justify-between cursor-pointer border-2 border-red-500 group">
            <div className="flex items-center gap-3 font-black uppercase tracking-tighter italic text-sm md:text-base">
              <AlertOctagon size={24} className="group-hover:rotate-12 transition-transform" /> 
              <span>{stats.overdue} PEKERJAAN UNIT MELEWATI DEADLINE! (H-0)</span>
            </div>
            <div className="font-bold underline text-[10px] md:text-xs group-hover:translate-x-1 transition-transform">LIHAT &rarr;</div>
          </div>
        )}
        {stats.nearDeadline > 0 && (
          <div onClick={() => setFilterStatus('Warning (H-1)')} className="animate-blink-orange p-4 rounded-xl shadow-lg flex items-center justify-between cursor-pointer border-2 border-orange-500 group">
            <div className="flex items-center gap-3 font-black uppercase tracking-tighter italic text-sm md:text-base">
              <AlertTriangle size={24} className="group-hover:rotate-12 transition-transform" /> 
              <span>{stats.nearDeadline} PEKERJAAN UNIT DEADLINE BESOK! (H-1)</span>
            </div>
            <div className="font-bold underline text-[10px] md:text-xs group-hover:translate-x-1 transition-transform">LIHAT &rarr;</div>
          </div>
        )}
      </div>

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#EE2E24] rounded-2xl text-white shadow-xl shadow-red-200">
            <LayoutDashboard size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Dashboard <span className="text-[#002F6C]">Summary</span></h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Monitoring Pekerjaan Seluruh Unit Kerja</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            {(['GAS', 'JSONBIN', 'BOTH'] as const).map(p => (
              <button key={p} onClick={() => onProviderChange?.(p)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${storageProvider === p ? 'bg-[#EE2E24] text-white shadow-md' : 'text-gray-400 hover:text-gray-800'}`}>
                {p === 'BOTH' ? 'Dual-Cloud' : p}
              </button>
            ))}
          </div>
          <button onClick={onForceSync} className={`p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 hover:text-blue-600 transition-all ${isLoading ? 'animate-spin' : 'hover:scale-110'}`}>
            <RefreshCcw size={18}/>
          </button>
        </div>
      </div>

      {filterStatus ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <button onClick={() => setFilterStatus(null)} className="p-2.5 bg-white rounded-xl border border-gray-200 text-gray-400 hover:text-[#EE2E24] transition-all">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-black text-gray-800 uppercase italic">Daftar Saya: <span className="text-[#EE2E24] underline underline-offset-4">{filterStatus}</span></h2>
             </div>
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Cari..." className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-[#EE2E24]/5" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
          </div>
          
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b">
                      <tr>
                        <th className="p-6">Pekerjaan / Kategori</th>
                        <th className="p-6">Cabang/Dept</th>
                        <th className="p-6">Status</th>
                        <th className="p-6">Deadline</th>
                        <th className="p-6">Dibuat Oleh</th>
                        <th className="p-6 text-center">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {filteredJobsList.map(job => (
                        <tr key={job.id} onClick={() => setSelectedJob(job)} className="hover:bg-gray-50/80 transition-all group cursor-pointer">
                            <td className="p-6">
                                <div className="font-black text-gray-800 text-[13px] uppercase truncate max-w-[250px]">{job.jobType}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{job.category} - {job.subCategory}</div>
                            </td>
                            <td className="p-6 font-black text-gray-800">{job.branchDept}</td>
                            <td className="p-6">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border ${job.status === 'Cancel' || job.status === 'Drop' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    {job.status}
                                </span>
                            </td>
                            <td className="p-6 font-bold">{new Date(job.deadline).toLocaleDateString('id-ID')}</td>
                            <td className="p-6 text-[10px] text-gray-400 font-medium italic">{job.createdBy || '-'}</td>
                            <td className="p-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    {(job.status === 'Cancel' || job.status === 'Drop') && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteJob(job.id); }}
                                            className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                                            title="Hapus Data Terbatalkan"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <Info size={18} className="text-gray-300 group-hover:text-[#002F6C] transition-colors" />
                                </div>
                            </td>
                        </tr>
                      ))}
                      {filteredJobsList.length === 0 && (
                          <tr><td colSpan={6} className="p-20 text-center text-gray-400 italic">Tidak ada data ditemukan.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total', value: stats.total, icon: CalendarDays, color: 'blue' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'green' },
              { label: 'On Proses', value: stats.inProgress, icon: Clock, color: 'sky' },
              { label: 'Warning (H-1)', value: stats.nearDeadline, icon: Hourglass, color: 'amber' },
              { label: 'Critical (H-0)', value: stats.overdue, icon: AlertCircle, color: 'red' },
              { label: 'Dropped', value: stats.cancelled, icon: Info, color: 'slate' }
            ].map((item, idx) => (
              <div key={idx} onClick={() => setFilterStatus(item.label)} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all group active:scale-95">
                <div className={`p-4 rounded-2xl bg-${item.color}-50 text-${item.color}-600 mb-4 group-hover:scale-110 group-hover:bg-${item.color}-600 group-hover:text-white transition-all shadow-sm`}>
                  <item.icon size={28}/>
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest text-center leading-tight mb-1">{item.label}</p>
                <p className="text-3xl font-black text-gray-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black uppercase tracking-tight mb-8 italic flex items-center gap-3">
                <TrendingUp size={24} className="text-[#EE2E24]" />
                Volume Pekerjaan <span className="text-[#EE2E24]">Unit</span>
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData} onClick={(data) => data && data.activeLabel && setFilterStatus(String(data.activeLabel))} className="cursor-pointer">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fill: '#94a3b8'}} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fill: '#94a3b8'}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="count" fill="#EE2E24" radius={[10, 10, 0, 0]} barSize={40}>
                        {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#EE2E24' : '#002F6C'} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#002F6C] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-8">Status <span className="text-red-500">Global</span></h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={pieData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={65} outerRadius={90} 
                                    paddingAngle={5} dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius: '12px'}} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', color: 'white'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                <div className="relative z-10 grid grid-cols-2 gap-3 mt-6">
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                        <p className="text-[10px] uppercase font-black text-white/50 mb-1">Success Rate</p>
                        <p className="text-2xl font-black text-white">{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-center">
                        <p className="text-[10px] uppercase font-black text-white/50 mb-1">Unit Health</p>
                        <div className="flex items-center gap-2">
                            <Target size={16} className={stats.overdue > 0 ? 'text-red-400' : 'text-green-400'} />
                            <span className="text-xs font-bold text-white uppercase">{stats.overdue > 0 ? 'Action Required' : 'Optimal'}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <h3 className="text-xl font-black uppercase tracking-tight mb-6 italic">Analisa <span className="text-[#002F6C]">Kinerja Unit</span></h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4"><TrendingUp size={20}/></div>
                    <p className="text-sm font-bold text-gray-800 mb-2">Kecepatan Penyelesaian</p>
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                        Unit telah menyelesaikan <span className="font-bold text-[#002F6C]">{stats.completed} tugas</span>. 
                        Tingkat penyelesaian mencapai <span className="font-bold text-[#EE2E24]">{stats.total ? ((stats.completed/stats.total)*100).toFixed(1) : 0}%</span> dari seluruh antrian pekerjaan.
                    </p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4"><AlertCircle size={20}/></div>
                    <p className="text-sm font-bold text-gray-800 mb-2">Risiko Keterlambatan</p>
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                        Ditemukan <span className="font-bold text-red-600">{stats.overdue} pekerjaan Critical</span> dan <span className="font-bold text-orange-600">{stats.nearDeadline} pekerjaan H-1</span>. 
                        Direkomendasikan prioritas pada kategori yang mendekati batas waktu.
                    </p>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4"><CheckCircle2 size={20}/></div>
                    <p className="text-sm font-bold text-gray-800 mb-2">Kapasitas Kerja</p>
                    <p className="text-xs text-gray-500 leading-relaxed italic">
                        Volume pekerjaan tertinggi saat ini berada pada kategori <span className="font-bold text-gray-700">{barData.reduce((prev, curr) => prev.count > curr.count ? prev : curr).name}</span>. 
                        Resource disarankan difokuskan pada area beban tinggi.
                    </p>
                </div>
             </div>
          </div>
        </>
      )}

      {/* JOB DETAIL MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden">
                <div className="relative p-8 border-b border-gray-100 bg-gray-50/50">
                    <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl shadow-sm transition-all"><X size={24} /></button>
                    <div className="flex items-center gap-4 mb-2">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${selectedJob.status === 'Cancel' || selectedJob.status === 'Drop' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{selectedJob.status}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedJob.category} / {selectedJob.subCategory}</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-800 uppercase italic leading-tight">{selectedJob.jobType}</h2>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4"><div className="p-3 bg-blue-50 text-[#002F6C] rounded-2xl"><CalendarDays size={20}/></div><div><p className="text-[10px] font-black text-gray-400 uppercase">Input</p><p className="font-bold">{new Date(selectedJob.dateInput).toLocaleDateString('id-ID')}</p></div></div>
                        <div className="flex items-center gap-4"><div className="p-3 bg-red-50 text-[#EE2E24] rounded-2xl"><Hourglass size={20}/></div><div><p className="text-[10px] font-black text-gray-400 uppercase">Deadline</p><p className="font-bold text-red-600">{new Date(selectedJob.deadline).toLocaleDateString('id-ID')}</p></div></div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4"><div className="p-3 bg-gray-50 text-gray-700 rounded-2xl"><Briefcase size={20}/></div><div><p className="text-[10px] font-black text-gray-400 uppercase">Unit</p><p className="font-bold">{selectedJob.branchDept}</p></div></div>
                        <div className="flex items-center gap-4"><div className="p-3 bg-gray-50 text-gray-700 rounded-2xl"><User size={20}/></div><div><p className="text-[10px] font-black text-gray-400 uppercase">User</p><p className="font-bold italic">{selectedJob.createdBy || 'Unknown'}</p></div></div>
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Keterangan</p>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 italic text-gray-600">{selectedJob.keterangan || 'Tidak ada catatan.'}</div>
                    </div>
                </div>
                <div className="p-8 bg-gray-50 flex justify-end"><button onClick={() => setSelectedJob(null)} className="px-8 py-3 bg-[#002F6C] text-white rounded-2xl font-black uppercase text-xs">Tutup</button></div>
            </div>
        </div>
      )}
    </div>
  );
};
