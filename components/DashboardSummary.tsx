
import React, { useMemo, useState } from 'react';
import { Job } from '../types';
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

const COLORS = ['#EE2E24', '#002F6C', '#10B981', '#F59E0B', '#6366F1', '#94a3b8'];

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

  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const source = allJobs.length > 0 ? allJobs : jobs;
    
    return {
        total: source.length,
        completed: source.filter(j => ['Completed', 'DONE'].includes(j.status)).length,
        inProgress: source.filter(j => ['In Progress', 'On Proses'].includes(j.status)).length,
        overdue: source.filter(j => new Date(j.deadline) <= today && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status)).length,
        nearDeadline: source.filter(j => {
            const dl = new Date(j.deadline); dl.setHours(0,0,0,0);
            return dl.getTime() === tomorrow.getTime() && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status);
        }).length,
        dropped: source.filter(j => ['Cancel', 'Drop'].includes(j.status)).length
    };
  }, [allJobs, jobs]);

  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(MENU_STRUCTURE).forEach(cat => counts[cat] = 0);
    (allJobs.length > 0 ? allJobs : jobs).forEach(job => {
      if (counts[job.category] !== undefined) counts[job.category]++;
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [allJobs, jobs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* ALERTS */}
      <div className="space-y-4">
        {stats.overdue > 0 && (
          <div className="animate-blink-red p-5 rounded-3xl shadow-xl flex items-center justify-between border-2 border-red-500 cursor-pointer group">
            <div className="flex items-center gap-4 font-black uppercase italic tracking-tighter">
              <AlertOctagon size={28} />
              <span>{stats.overdue} Deadline Melewati Batas Waktu!</span>
            </div>
            <div className="text-xs font-bold underline group-hover:translate-x-1 transition-transform">LIHAT &rarr;</div>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-[#EE2E24] rounded-[2rem] text-white shadow-2xl shadow-red-200">
            <LayoutDashboard size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#002F6C] tracking-tighter uppercase italic">Dashboard <span className="text-[#EE2E24]">Monitor</span></h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Real-time Job Tracking System JNE</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={onForceSync} className={`p-3 text-gray-400 hover:text-blue-600 transition-all ${isLoading ? 'animate-spin' : ''}`}><RefreshCcw size={20}/></button>
          <div className="h-8 w-px bg-gray-100"></div>
          <p className="px-4 text-[10px] font-black text-[#002F6C] uppercase italic">{storageProvider} CLOUD ACTIVE</p>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
            { l: 'Total Tugas', v: stats.total, i: Briefcase, c: 'blue' },
            { l: 'Selesai', v: stats.completed, i: CheckCircle2, c: 'green' },
            { l: 'Proses', v: stats.inProgress, i: Clock, c: 'amber' },
            { l: 'Terhenti/Batal', v: stats.dropped, i: Trash2, c: 'gray' }
        ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 hover:-translate-y-2 transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-${item.c}-50 text-${item.c}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <item.i size={28} />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.l}</p>
                <p className="text-4xl font-black text-gray-800 tracking-tighter">{item.v}</p>
            </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <h3 className="text-xl font-black uppercase italic mb-10 flex items-center gap-3">
                <TrendingUp className="text-[#EE2E24]" /> Volume <span className="text-[#EE2E24]">Pekerjaan</span>
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fill: '#94a3b8'}} />
                        <YAxis hide />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius:'20px', border:'none', boxShadow:'0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={50}>
                            {barData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-[#002F6C] p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10 text-white">
                <h3 className="text-2xl font-black uppercase italic mb-10">Pencapaian <span className="text-[#EE2E24]">Unit</span></h3>
                <div className="space-y-8">
                    <div className="p-6 bg-white/10 backdrop-blur-md rounded-[2rem] border border-white/10">
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Success Rate</p>
                        <p className="text-5xl font-black">{stats.total ? Math.round((stats.completed/stats.total)*100) : 0}%</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Target size={24} className="text-red-500" /></div>
                        <div>
                            <p className="text-[10px] font-black text-white/50 uppercase">Health Score</p>
                            <p className="font-bold">{stats.overdue > 0 ? 'MEMBUTUHKAN TINDAKAN' : 'OPTIMAL'}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-600/20 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
};
