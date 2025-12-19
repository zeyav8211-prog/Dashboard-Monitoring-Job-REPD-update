
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
  RefreshCcw, X, User, Briefcase, Info, TrendingUp, Target, Trash2, Cloud, Database
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
    isLoading = false,
    storageProvider = 'GAS',
    onProviderChange,
    onForceSync
}) => {
  const stats = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const source = allJobs.length > 0 ? allJobs : jobs;
    
    return {
        total: source.length,
        completed: source.filter(j => ['Completed', 'DONE'].includes(j.status)).length,
        inProgress: source.filter(j => ['In Progress', 'On Proses'].includes(j.status)).length,
        overdue: source.filter(j => {
            const dl = new Date(j.deadline); dl.setHours(0,0,0,0);
            return dl.getTime() <= today.getTime() && !['Completed', 'DONE', 'Drop', 'Cancel'].includes(j.status);
        }).length,
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

  const successRate = useMemo(() => {
    return stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  }, [stats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-6 bg-[#EE2E24] rounded-[2rem] text-white shadow-2xl shadow-red-200 animate-pulse-slow">
            <LayoutDashboard size={42} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-[#002F6C] tracking-tighter uppercase italic leading-none">
              Control <span className="text-[#EE2E24]">Center</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-3">
              JNE Monitoring System - Unit Kerja PPDD
            </p>
          </div>
        </div>

        {/* CLOUD SELECTOR */}
        <div className="flex items-center gap-2 bg-white p-3 rounded-[2rem] shadow-xl border border-gray-100">
          <div className="flex gap-1 p-1 bg-gray-50 rounded-[1.5rem]">
            {(['GAS', 'JSONBIN', 'BOTH'] as const).map(p => (
              <button
                key={p}
                onClick={() => onProviderChange?.(p)}
                className={`px-4 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${
                  storageProvider === p 
                  ? 'bg-[#002F6C] text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-gray-100 mx-2"></div>
          <button 
            onClick={onForceSync} 
            className={`p-3 bg-gray-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* ALERTS SECTION */}
      {stats.overdue > 0 && (
        <div className="animate-blink-red p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between border-4 border-red-600 cursor-pointer group hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-5 text-red-600">
            <AlertOctagon size={36} className="group-hover:rotate-12 transition-transform" />
            <div>
              <p className="font-black uppercase italic text-lg leading-none">{stats.overdue} Task Melewati Batas!</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Sistem mendeteksi keterlambatan kritis</p>
            </div>
          </div>
          <div className="font-black uppercase text-xs italic bg-white px-6 py-2 rounded-full shadow-inner">Tindak Lanjut &rarr;</div>
        </div>
      )}

      {/* STATS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Task', value: stats.total, icon: Briefcase, color: 'blue', sub: 'Semua Kategori' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'green', sub: 'Status DONE' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'amber', sub: 'Sedang Proses' },
          { label: 'Dropped', value: stats.dropped, icon: Trash2, color: 'gray', sub: 'Cancel / Batal' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-gray-100 group hover:-translate-y-3 transition-all duration-500 relative overflow-hidden">
            <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-all group-hover:scale-110 ${
              item.color === 'blue' ? 'bg-blue-50 text-blue-600' :
              item.color === 'green' ? 'bg-green-50 text-green-600' :
              item.color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
            }`}>
              <item.icon size={32} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
            <p className="text-5xl font-black text-gray-800 tracking-tighter leading-none">{item.value.toLocaleString()}</p>
            <p className="text-[9px] font-bold text-gray-300 uppercase mt-4">{item.sub}</p>
            
            {/* Background Decoration */}
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <item.icon size={120} />
            </div>
          </div>
        ))}
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CHART COLUMN */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-2xl font-black uppercase italic flex items-center gap-3">
                <TrendingUp size={28} className="text-[#EE2E24]" />
                Volume <span className="text-[#EE2E24]">Workload</span>
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Persebaran tugas berdasarkan kategori utama</p>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={9} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontWeight: '900', fill: '#94a3b8'}} 
                  interval={0}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 20}} 
                  contentStyle={{borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px'}}
                />
                <Bar dataKey="count" radius={[20, 20, 10, 10]} barSize={45}>
                  {barData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PERFORMANCE SCORE COLUMN */}
        <div className="bg-[#002F6C] p-12 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 text-white">
            <h3 className="text-3xl font-black uppercase italic mb-10 leading-none">Efficiency <span className="text-[#EE2E24]">Score</span></h3>
            
            <div className="space-y-10">
              <div className="p-10 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-2xl">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-4">Success Rate</p>
                <div className="flex items-end gap-3">
                  <p className="text-8xl font-black leading-none tracking-tighter">{successRate}%</p>
                  <TrendingUp size={36} className="text-green-400 mb-2 animate-bounce" />
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full mt-8 overflow-hidden">
                    <div className="bg-green-400 h-full transition-all duration-1000 shadow-lg shadow-green-400/50" style={{ width: `${successRate}%` }}></div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 px-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-[#EE2E24] flex items-center justify-center shadow-lg shadow-red-600/30">
                  <Target size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Health Condition</p>
                  <p className="font-black text-xl uppercase tracking-tighter italic text-white/90">
                    {stats.overdue > 0 ? 'NEEDS ATTENTION' : 'SYSTEM OPTIMAL'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 opacity-10">
            <LayoutDashboard size={250} className="text-white" />
          </div>
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-[#EE2E24] rounded-full blur-[120px] opacity-20"></div>
        </div>
      </div>
    </div>
  );
};
