
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
    let content = '';
    let filename = '';
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
    const csvHeaderList: string[] = category === 'TARIF' 
        ? ['ORIGIN', 'DEST', 'SYS_CODE', 'Service Master', 'Tarif Master', 'SLA Master', 'Service IT', 'Tarif IT', 'SLA IT', 'Keterangan']
        : ['ORIGIN', 'DEST', 'SERVICE IT', 'ACUAN', 'BP Master', 'BT Master', 'BD Master', 'BP IT', 'BT IT', 'BD IT', 'Keterangan'];

    const esc = (val: any): string => {
        const s = String(val ?? '');
        return (s.includes(',') || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csvRowsList: string[] = dataToExport.map(row => {
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

    const blob = new Blob([[csvHeaderList.join(','), ...csvRowsList].join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Laporan_Validasi_${category}.csv`;
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
      let offset = 0;
      let leftover = '';
      let headers: string[] | null = null;
      let delimiter = ',';
      const CHUNK_SIZE = 1024 * 1024 * 2; // 2MB
      
      while (offset < file.size) {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const text = await slice.text();
          const cleanText = (offset === 0) ? text.replace(/^\uFEFF/, '') : text;
          const rawLines = (leftover + cleanText).split(/\r\n|\n/);
          leftover = (offset + CHUNK_SIZE < file.size) ? (rawLines.pop() || '') : '';

          if (rawLines.length > 0) {
              let startIndex = 0;
              if (!headers) {
                  const first = rawLines[0];
                  delimiter = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
                  headers = parseLine(first, delimiter);
                  startIndex = 1;
              }
              const chunkRows: CSVRowData[] = [];
              for (let i = startIndex; i < rawLines.length; i++) {
                  if (!rawLines[i].trim()) continue;
                  const vals = parseLine(rawLines[i], delimiter);
                  const obj: CSVRowData = {};
                  headers.forEach((h, idx) => { if (h) obj[h.trim()] = vals[idx] || ''; });
                  chunkRows.push(obj);
              }
              onRows(chunkRows);
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
        await processFileChunked(fileMaster, (chunk) => {
            chunk.forEach(row => {
                const k = String(row[Object.keys(row).find(k => k.toUpperCase().includes(category === 'BIAYA' ? 'DEST' : 'SYS')) || ''] || '').trim().toUpperCase();
                if (k) masterMap.set(k, row);
            });
        }, (p) => setProgress(p * 0.3));

        setStatusMessage('Validasi Data IT...');
        const fullReportList: FullValidationRow[] = [];
        const mismatchesList: ValidationMismatch[] = [];
        let matches = 0, blanks = 0, globalIdx = 0;

        const parseNum = (v: any) => parseInt(String(v || '0').replace(/[^0-9]/g, '')) || 0;

        await processFileChunked(fileIT, (chunk) => {
            chunk.forEach(itRow => {
                globalIdx++;
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
                    const issues: string[] = [];
                    if (reportRow.tarifIT !== reportRow.tarifMaster) issues.push('Tarif');
                    if (reportRow.slaFormIT !== reportRow.slaFormMaster) issues.push('SLA');
                    if (issues.length > 0) {
                        reportRow.keterangan = `Tidak sesuai: ${issues.join(', ')}`;
                        mismatchesList.push({ rowId: globalIdx, reasons: issues, details: [] });
                    } else matches++;
                } else blanks++;
                fullReportList.push(reportRow);
            });
        }, (p) => setProgress(30 + (p * 0.7)));

        const finalResult: ValidationResult = { totalRows: fullReportList.length, matches, blanks, mismatches: mismatchesList, fullReport: fullReportList };
        setResult(finalResult);
        setHistory(prev => [{
            id: Date.now().toString(), timestamp: new Date().toLocaleString('id-ID'),
            fileNameIT: fileIT.name, fileNameMaster: fileMaster.name, category, result: finalResult
        }, ...prev]);

    } catch (e: any) { alert(`Error: ${e.message}`); }
    finally { setIsValidating(false); }
  };

  const displayedRows = useMemo(() => {
    if (!result?.fullReport) return [];
    if (reportFilter === 'MATCH') return result.fullReport.filter(r => r.keterangan === 'Sesuai');
    if (reportFilter === 'MISMATCH') return result.fullReport.filter(r => r.keterangan.startsWith('Tidak sesuai'));
    if (reportFilter === 'BLANK') return result.fullReport.filter(r => r.keterangan.includes('Tidak Ada'));
    return result.fullReport;
  }, [result, reportFilter]);

  const paginatedRows = displayedRows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-[#002F6C] uppercase italic tracking-tighter">Validasi <span className="text-[#EE2E24]">{category}</span></h2>
        <p className="text-gray-500 font-medium">Sistem Pembanding Data IT vs Master Data JNE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[ {t:'IT', f:fileIT, c:'blue'}, {t:'MASTER', f:fileMaster, c:'red'} ].map(x => (
          <div key={x.t} className={`bg-white p-8 rounded-[2.5rem] shadow-xl border-2 transition-all group ${x.f ? 'border-green-500' : 'border-gray-100 hover:border-gray-300'}`}>
            <div className={`w-16 h-16 rounded-3xl bg-${x.c}-50 text-${x.c}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <FileUp size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Data {x.t}</h3>
            <input type="file" id={`f-${x.t}`} className="hidden" accept=".csv" onChange={e => handleFileChange(e, x.t as any)} />
            <label htmlFor={`f-${x.t}`} className="block w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl text-center cursor-pointer hover:bg-gray-50 text-sm font-bold text-gray-400 truncate">
                {x.f ? x.f.name : 'Pilih File CSV...'}
            </label>
            <button onClick={() => downloadTemplate(x.t as any)} className="mt-4 text-xs font-black uppercase text-blue-600 hover:underline flex items-center gap-1">
                <Download size={14} /> Download Template
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center">
        {isValidating ? (
            <div className="w-full max-w-md space-y-2 bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                <div className="flex justify-between text-xs font-black uppercase"><span className="text-gray-400">{statusMessage}</span><span className="text-blue-600">{progress}%</span></div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden"><div className="bg-[#002F6C] h-full transition-all duration-300" style={{width:`${progress}%`}}></div></div>
            </div>
        ) : (
            <button onClick={processValidation} disabled={!fileIT || !fileMaster} className="px-12 py-5 bg-[#002F6C] text-white rounded-[2rem] font-black uppercase italic tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-900 hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0">
                Mulai Validasi Sekarang
            </button>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
            <div className="p-10 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-2xl font-black text-gray-800 uppercase italic">Hasil <span className="text-[#EE2E24]">Analisa</span></h3>
                <button onClick={() => downloadFullReport()} className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-green-100 flex items-center gap-2 hover:bg-green-700">
                    <Download size={16}/> Export Full Report
                </button>
            </div>
            <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { l: 'Total Data', v: result.totalRows, c: 'blue', f: 'ALL' },
                    { l: 'Data Sesuai', v: result.matches, c: 'green', f: 'MATCH' },
                    { l: 'Ketidaksesuaian', v: result.mismatches.length, c: 'red', f: 'MISMATCH' },
                    { l: 'Master Kosong', v: result.blanks, c: 'amber', f: 'BLANK' }
                ].map(s => (
                    <div key={s.l} onClick={() => { setReportFilter(s.f as any); setCurrentPage(1); setShowFullReport(true); }} className={`p-8 rounded-[2.5rem] bg-${s.c}-50 border border-${s.c}-100 cursor-pointer hover:scale-105 transition-all`}>
                        <p className={`text-[10px] font-black uppercase text-${s.c}-600 tracking-widest mb-1`}>{s.l}</p>
                        <p className="text-4xl font-black text-gray-800">{s.v.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* MODAL FULL REPORT */}
      {showFullReport && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h4 className="text-xl font-black text-gray-800 uppercase italic">Detail Tabel <span className="text-[#EE2E24]">{reportFilter}</span></h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Menampilkan {displayedRows.length} baris data</p>
                    </div>
                    <button onClick={() => setShowFullReport(false)} className="p-3 bg-white text-gray-400 hover:text-red-600 rounded-2xl shadow-sm transition-all"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-auto p-8 scrollbar-hide">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-white shadow-sm font-black uppercase text-gray-400 tracking-widest border-b">
                            <tr>
                                <th className="p-4 bg-gray-50 rounded-tl-2xl">SYS CODE</th>
                                <th className="p-4 bg-gray-50">Master Data</th>
                                <th className="p-4 bg-gray-50">Data IT</th>
                                <th className="p-4 bg-gray-50 rounded-tr-2xl">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedRows.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 font-black text-gray-800">{r.sysCode}</td>
                                    <td className="p-4">
                                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                            <p className="font-bold text-blue-700">{r.serviceMaster}</p>
                                            <p className="text-[10px] font-medium text-gray-500">Tarif: {r.tarifMaster.toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="bg-red-50/50 p-3 rounded-xl border border-red-100">
                                            <p className="font-bold text-red-700">{r.serviceIT}</p>
                                            <p className="text-[10px] font-medium text-gray-500">Tarif: {r.tarifIT.toLocaleString()}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] border ${r.keterangan === 'Sesuai' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{r.keterangan}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 bg-gray-50 border-t flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-400">Halaman {currentPage} dari {Math.ceil(displayedRows.length / ROWS_PER_PAGE)}</p>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-30"><ChevronLeft size={18}/></button>
                        <button disabled={currentPage >= Math.ceil(displayedRows.length / ROWS_PER_PAGE)} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-30"><ChevronRight size={18}/></button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
