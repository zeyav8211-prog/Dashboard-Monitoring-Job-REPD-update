
import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileUp, AlertTriangle, CheckCircle2, Download, Eye, X, Table as TableIcon, History, RotateCcw, Trash2, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { ValidationResult, ValidationMismatch, FullValidationRow, ValidationDetail, ValidationHistoryItem, ValidationCategory } from '../types';

interface TarifValidatorProps {
    category: ValidationCategory;
}

type CSVRowData = Record<string, any>;

export const TarifValidator: React.FC<TarifValidatorProps> = ({ category }) => {
  const [fileIT, setFileIT] = useState<File | null>(null);
  const [fileMaster, setFileMaster] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0); 
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [selectedMismatch, setSelectedMismatch] = useState<ValidationMismatch | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 50;
  
  const [history, setHistory] = useState<ValidationHistoryItem[]>([]);
  const [reportFilter, setReportFilter] = useState<'ALL' | 'MATCH' | 'MISMATCH' | 'BLANK'>('ALL');

  useEffect(() => {
    const savedHistory = localStorage.getItem('validationHistory');
    if (savedHistory) {
        try {
            setHistory(JSON.parse(savedHistory));
        } catch (e) {
            localStorage.removeItem('validationHistory');
        }
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('validationHistory', JSON.stringify(history));
    } catch (e) {
        if (history.length > 0) {
            localStorage.setItem('validationHistory', JSON.stringify(history.slice(0, 5)));
        }
    }
  }, [history]);

  useEffect(() => {
      setFileIT(null);
      setFileMaster(null);
      setResult(null);
      setSelectedMismatch(null);
      setShowFullReport(false);
      setProgress(0);
      setStatusMessage('');
  }, [category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'IT' | 'MASTER') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'IT') setFileIT(e.target.files[0]);
      else setFileMaster(e.target.files[0]);
    }
  };

  const downloadTemplate = (type: 'IT' | 'MASTER') => {
    let content: string = '';
    let filename: string = '';
    if (category === 'TARIF') {
        if (type === 'IT') {
            content = 'ORIGIN,DEST,SYS_CODE,SERVICE,TARIF,SLA_FORM,SLA_THRU\nMES10612,AMI10000,MES10612AMI10000,REG23,59000,3,5';
            filename = `Template_IT_TARIF.csv`;
        } else {
            content = 'ORIGIN,DEST,SYS_CODE,Service REG,Tarif REG,sla form REG,sla thru REG\nDJJ10000,AMI10000,DJJ10000AMI10000,REG23,107000,4,5';
            filename = `Template_Master_TARIF.csv`;
        }
    } else {
        if (type === 'IT') {
            content = 'ORIGIN,DESTINASI,SERVICE,BT,BD,BD NEXT,BP,BP NEXT\nAMI20100,BDJ10502,REG19,1500,3200,0,0,0';
            filename = `Template_IT_BIAYA.csv`;
        } else {
            content = 'DESTINASI,ZONA,BP OKE23,BP NEXT OKE23,BT OKE23,BD OKE23,BP REG23,BP NEXT REG23,BT REG23,BD REG23,BD NEXT REG23\nAMI10000,A,1500,0,1200,3200,2000,0,1500,3500,0';
            filename = `Template_Master_BIAYA.csv`;
        }
    }
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); window.URL.revokeObjectURL(url);
  };

  const downloadFullReport = (rowsToDownload?: FullValidationRow[]) => {
    if (!result || (!result.fullReport && !rowsToDownload)) {
        alert("Data report tidak tersedia.");
        return;
    }
    
    const dataToExport: FullValidationRow[] = rowsToDownload || result.fullReport || [];
    
    // Explicit typing for csvHeader to avoid TS7034
    const csvHeader: string[] = category === 'TARIF' 
        ? ['ORIGIN', 'DEST', 'SYS_CODE', 'Service Master', 'Tarif Master', 'SLA Master', 'Service IT', 'Tarif IT', 'SLA IT', 'Keterangan']
        : ['ORIGIN', 'DEST', 'SERVICE IT', 'ACUAN', 'BP Master', 'BT Master', 'BD Master', 'BP IT', 'BT IT', 'BD IT', 'Keterangan'];

    const esc = (val: any): string => {
        const s = String(val ?? '');
        return (s.includes(',') || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    // Explicit typing for mapped rows to avoid TS7005
    const csvRows: string[] = dataToExport.map((row: FullValidationRow): string => {
        if (category === 'TARIF') {
            return [
                esc(row.origin), esc(row.dest), esc(row.sysCode), esc(row.serviceMaster), 
                row.tarifMaster, `${row.slaFormMaster}-${row.slaThruMaster}`,
                esc(row.serviceIT), row.tarifIT, `${row.slaFormIT}-${row.slaThruIT}`, esc(row.keterangan)
            ].join(',');
        } else {
            return [
                esc(row.origin), esc(row.dest), esc(row.serviceIT), esc(row.serviceMaster),
                row.bpMaster, row.btMaster, row.bdMaster,
                row.bpIT, row.btIT, row.bdIT, esc(row.keterangan)
            ].join(',');
        }
    });

    const csvContent: string = [csvHeader.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Laporan_Validasi_${category}_${new Date().getTime()}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); window.URL.revokeObjectURL(url);
  };

  const parseLine = (line: string, delimiter: string): string[] => {
    const parts: string[] = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === delimiter && !inQuotes) {
            parts.push(line.substring(start, i));
            start = i + 1;
        }
    }
    parts.push(line.substring(start));
    return parts.map(v => v.trim().replace(/^"|"$/g, ''));
  };

  const processFileChunked = async (
      file: File, 
      onRows: (rows: CSVRowData[]) => void,
      onProgress: (percent: number) => void
  ) => {
      let offset: number = 0;
      let leftover: string = '';
      let headers: string[] | null = null;
      let delimiter: string = ',';
      const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB
      
      while (offset < file.size) {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const text = await slice.text();
          const cleanText = (offset === 0) ? text.replace(/^\uFEFF/, '') : text;
          const rawLines: string[] = (leftover + cleanText).split(/\r\n|\n/);
          leftover = (offset + CHUNK_SIZE < file.size) ? (rawLines.pop() || '') : '';

          if (rawLines.length > 0) {
              let startIndex: number = 0;
              if (!headers) {
                  const first = rawLines[0];
                  delimiter = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
                  headers = parseLine(first, delimiter);
                  startIndex = 1;
              }
              const chunkRowsArray: CSVRowData[] = [];
              for (let i = startIndex; i < rawLines.length; i++) {
                  if (!rawLines[i].trim()) continue;
                  const vals = parseLine(rawLines[i], delimiter);
                  const obj: CSVRowData = {};
                  headers.forEach((h, idx) => { if (h) obj[h.trim()] = vals[idx] || ''; });
                  chunkRowsArray.push(obj);
              }
              onRows(chunkRowsArray);
          }
          offset += CHUNK_SIZE;
          onProgress(Math.min(Math.round((offset / file.size) * 100), 100));
          await new Promise(r => setTimeout(r, 0));
      }
  };

  const processValidation = async () => {
    if (!fileIT || !fileMaster) return;
    setIsValidating(true); setProgress(0); setStatusMessage('Membaca Master Data...');
    
    try {
        const masterMap = new Map<string, CSVRowData>();
        await processFileChunked(fileMaster, (chunk: CSVRowData[]) => {
            chunk.forEach((row: CSVRowData) => {
                const k = String(row[Object.keys(row).find(k => k.toUpperCase().includes(category === 'BIAYA' ? 'DEST' : 'SYS')) || ''] || '').trim().toUpperCase();
                if (k) masterMap.set(k, row);
            });
        }, (p: number) => setProgress(p * 0.3));

        setStatusMessage('Validasi Data IT...');
        const fullReportCollector: FullValidationRow[] = [];
        const mismatchesCollector: ValidationMismatch[] = [];
        let matchesCount: number = 0, blanksCount: number = 0, globalIndexCounter: number = 0;

        const parseNum = (v: any): number => parseInt(String(v || '0').replace(/[^0-9]/g, '')) || 0;

        await processFileChunked(fileIT, (chunk: CSVRowData[]) => {
            chunk.forEach((itRow: CSVRowData) => {
                globalIndexCounter++;
                const sysKey = Object.keys(itRow).find(k => k.toUpperCase().includes(category === 'BIAYA' ? 'DEST' : 'SYS')) || '';
                const sysCode = String(itRow[sysKey] || '').trim().toUpperCase();
                const masterRow = masterMap.get(sysCode);
                
                const reportRow: FullValidationRow = {
                    origin: String(itRow['ORIGIN'] || ''),
                    dest: category === 'BIAYA' ? sysCode : String(itRow['DEST'] || ''),
                    sysCode,
                    serviceMaster: String(masterRow?.[Object.keys(masterRow || {}).find(k => k.toUpperCase().includes('SERV')) || ''] || '-'),
                    tarifMaster: parseNum(masterRow?.[Object.keys(masterRow || {}).find(k => k.toUpperCase().includes('TARIF')) || '']),
                    slaFormMaster: parseNum(masterRow?.[Object.keys(masterRow || {}).find(k => k.toUpperCase().includes('FORM')) || '']),
                    slaThruMaster: parseNum(masterRow?.[Object.keys(masterRow || {}).find(k => k.toUpperCase().includes('THRU')) || '']),
                    serviceIT: String(itRow[Object.keys(itRow).find(k => k.toUpperCase().includes('SERV')) || ''] || '-'),
                    tarifIT: parseNum(itRow[Object.keys(itRow).find(k => k.toUpperCase().includes('TARIF')) || '']),
                    slaFormIT: parseNum(itRow[Object.keys(itRow).find(k => k.toUpperCase().includes('FORM')) || '']),
                    slaThruIT: parseNum(itRow[Object.keys(itRow).find(k => k.toUpperCase().includes('THRU')) || '']),
                    keterangan: masterRow ? 'Sesuai' : 'Master Data Tidak Ada'
                };

                if (masterRow) {
                    const issuesArray: string[] = [];
                    if (reportRow.tarifIT !== reportRow.tarifMaster) issuesArray.push('Tarif');
                    if (reportRow.slaFormIT !== reportRow.slaFormMaster) issuesArray.push('SLA');
                    if (issuesArray.length > 0) {
                        reportRow.keterangan = `Tidak sesuai: ${issuesArray.join(', ')}`;
                        mismatchesCollector.push({ rowId: globalIndexCounter, reasons: issuesArray, details: [] });
                    } else matchesCount++;
                } else blanksCount++;
                fullReportCollector.push(reportRow);
            });
        }, (p: number) => setProgress(30 + (p * 0.7)));

        const finalResult: ValidationResult = { 
            totalRows: fullReportCollector.length, 
            matches: matchesCount, 
            blanks: blanksCount, 
            mismatches: mismatchesCollector, 
            fullReport: fullReportCollector 
        };
        
        setResult(finalResult);
        setHistory((prev: ValidationHistoryItem[]) => [{
            id: Date.now().toString(), 
            timestamp: new Date().toLocaleString('id-ID'),
            fileNameIT: fileIT.name, 
            fileNameMaster: fileMaster.name, 
            category, 
            result: finalResult
        }, ...prev]);

    } catch (e: any) { 
        alert(`Gagal validasi: ${e.message}`); 
    } finally { 
        setIsValidating(false); 
    }
  };

  const filteredRowsForDisplay: FullValidationRow[] = useMemo(() => {
    if (!result?.fullReport) return [];
    if (reportFilter === 'MATCH') return result.fullReport.filter((r: FullValidationRow) => r.keterangan === 'Sesuai');
    if (reportFilter === 'MISMATCH') return result.fullReport.filter((r: FullValidationRow) => r.keterangan.startsWith('Tidak sesuai'));
    if (reportFilter === 'BLANK') return result.fullReport.filter((r: FullValidationRow) => r.keterangan.includes('Tidak Ada'));
    return result.fullReport;
  }, [result, reportFilter]);

  const paginatedRowsForDisplay: FullValidationRow[] = filteredRowsForDisplay.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-[#002F6C] uppercase italic tracking-tighter">Validasi <span className="text-[#EE2E24]">{category}</span></h2>
        <p className="text-gray-500 font-medium font-bold uppercase tracking-widest text-[10px]">JNE Data Integrity System - Build Ver 2.0</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[ {t:'IT', f:fileIT, c:'blue'}, {t:'MASTER', f:fileMaster, c:'red'} ].map(x => (
          <div key={x.t} className={`bg-white p-10 rounded-[3rem] shadow-xl border-2 transition-all group ${x.f ? 'border-green-500 shadow-green-50' : 'border-gray-50 hover:border-gray-200 shadow-gray-100/50'}`}>
            <div className={`w-20 h-20 rounded-[2rem] bg-${x.c === 'blue' ? 'blue-50' : 'red-50'} text-${x.c === 'blue' ? 'blue-600' : 'red-600'} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <FileUp size={40} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2 uppercase italic tracking-tighter">Data {x.t}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Silakan pilih file CSV yang akan divalidasi</p>
            <input type="file" id={`f-${x.t}`} className="hidden" accept=".csv" onChange={e => handleFileChange(e, x.t as any)} />
            <label htmlFor={`f-${x.t}`} className="block w-full p-6 border-2 border-dashed border-gray-200 rounded-[2rem] text-center cursor-pointer hover:bg-gray-50 text-sm font-black text-gray-400 truncate tracking-tight">
                {x.f ? x.f.name : 'KLIK UNTUK MEMILIH FILE'}
            </label>
            <button onClick={() => downloadTemplate(x.t as any)} className="mt-6 text-[10px] font-black uppercase text-blue-600 hover:text-red-600 flex items-center gap-2 transition-colors">
                <Download size={14} /> DOWNLOAD TEMPLATE
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center">
        {isValidating ? (
            <div className="w-full max-w-xl space-y-4 bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                <div className="flex justify-between text-xs font-black uppercase italic tracking-tighter">
                  <span className="text-gray-400">{statusMessage}</span>
                  <span className="text-blue-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-[#002F6C] to-blue-500 h-full transition-all duration-300" style={{width:`${progress}%`}}></div>
                </div>
            </div>
        ) : (
            <button 
              onClick={processValidation} 
              disabled={!fileIT || !fileMaster} 
              className="px-16 py-6 bg-gradient-to-br from-[#002F6C] to-blue-900 text-white rounded-[2.5rem] font-black uppercase italic tracking-widest shadow-2xl shadow-blue-200 hover:-translate-y-2 transition-all active:scale-95 disabled:opacity-30 disabled:translate-y-0"
            >
                JALANKAN VALIDASI DATA
            </button>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
            <div className="p-12 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-800 uppercase italic leading-none tracking-tighter">Laporan <span className="text-[#EE2E24]">Hasil Validasi</span></h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-3">Statistik komparasi data real-time</p>
                </div>
                <button onClick={() => downloadFullReport()} className="px-10 py-4 bg-green-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl shadow-green-100 flex items-center gap-3 hover:bg-green-700 transition-all hover:-translate-y-1">
                    <Download size={20}/> EXPORT DETAIL DATA
                </button>
            </div>
            <div className="p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { l: 'Total Baris', v: result.totalRows, c: 'blue', f: 'ALL' },
                    { l: 'Data Akurat', v: result.matches, c: 'green', f: 'MATCH' },
                    { l: 'Beda Nilai', v: result.mismatches.length, c: 'red', f: 'MISMATCH' },
                    { l: 'Data Master Kosong', v: result.blanks, c: 'amber', f: 'BLANK' }
                ].map(s => (
                    <div key={s.l} onClick={() => { setReportFilter(s.f as any); setCurrentPage(1); setShowFullReport(true); }} className={`p-10 rounded-[3.5rem] bg-${s.c === 'blue' ? 'blue-50' : s.c === 'green' ? 'green-50' : s.c === 'red' ? 'red-50' : 'amber-50'} border-2 border-${s.c === 'blue' ? 'blue-100' : s.c === 'green' ? 'green-100' : s.c === 'red' ? 'red-100' : 'amber-100'} cursor-pointer hover:scale-105 transition-all shadow-sm`}>
                        <p className={`text-[10px] font-black uppercase text-${s.c === 'blue' ? 'blue-600' : s.c === 'green' ? 'green-600' : s.c === 'red' ? 'red-600' : 'amber-600'} tracking-[0.2em] mb-3`}>{s.l}</p>
                        <p className="text-5xl font-black text-gray-800 tracking-tighter leading-none">{s.v.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {showFullReport && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-[95vw] h-[92vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border-4 border-white/20">
                <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h4 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">Preview <span className="text-[#EE2E24]">{reportFilter}</span> Records</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Menampilkan {filteredRowsForDisplay.length} baris data yang terfilter</p>
                    </div>
                    <button onClick={() => setShowFullReport(false)} className="p-4 bg-white text-gray-400 hover:text-red-600 rounded-[1.5rem] shadow-xl hover:shadow-red-50 transition-all active:scale-95"><X size={28}/></button>
                </div>
                <div className="flex-1 overflow-auto p-10 scrollbar-hide">
                    <table className="w-full text-xs text-left border-separate border-spacing-y-4">
                        <thead className="sticky top-0 z-20 bg-gray-50/90 backdrop-blur-md rounded-2xl font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="p-6">SYS CODE</th>
                                <th className="p-6">MASTER DATA</th>
                                <th className="p-6">IT DATA</th>
                                <th className="p-6 text-center">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRowsForDisplay.map((r: FullValidationRow, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 transition-all group bg-white shadow-sm">
                                    <td className="p-6 font-black text-gray-800 rounded-l-[2rem] border-y border-l border-gray-100 bg-white group-hover:bg-blue-50/30">{r.sysCode}</td>
                                    <td className="p-6 border-y border-gray-100 bg-white group-hover:bg-blue-50/30">
                                        <div className="space-y-1">
                                            <p className="font-black text-blue-700 italic uppercase">{r.serviceMaster}</p>
                                            <p className="text-[10px] font-bold text-gray-400">Tarif: Rp {r.tarifMaster.toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="p-6 border-y border-gray-100 bg-white group-hover:bg-blue-50/30">
                                        <div className="space-y-1">
                                            <p className="font-black text-red-700 italic uppercase">{r.serviceIT}</p>
                                            <p className="text-[10px] font-bold text-gray-400">Tarif: Rp {r.tarifIT.toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="p-6 rounded-r-[2rem] border-y border-r border-gray-100 bg-white group-hover:bg-blue-50/30 text-center">
                                        <span className={`px-6 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest border ${r.keterangan === 'Sesuai' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{r.keterangan}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 bg-gray-50 border-t flex justify-between items-center">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Halaman {currentPage} dari {Math.ceil(filteredRowsForDisplay.length / ROWS_PER_PAGE) || 1}</p>
                    <div className="flex gap-4">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-5 bg-white border border-gray-200 text-gray-400 rounded-2xl disabled:opacity-30 hover:shadow-lg transition-all"><ChevronLeft size={24}/></button>
                        <button disabled={currentPage >= Math.ceil(filteredRowsForDisplay.length / ROWS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)} className="p-5 bg-white border border-gray-200 text-gray-400 rounded-2xl disabled:opacity-30 hover:shadow-lg transition-all"><ChevronRight size={24}/></button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
