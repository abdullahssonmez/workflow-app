import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskDetailModal from './Calendar/TaskDetailModal';
import CreateTaskModal from './Calendar/CreateTaskModal';
import { getUserColor } from "../utils/userColors";

// --- MINIMALIST ICONS ---
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const ArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>;

const DashboardHome = () => {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [user, setUser] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [workflows, setWorkflows] = useState([]); // İş akışları için state
    const [loading, setLoading] = useState(true);
    
    // Filtreleme State'i (Varsayılan: 'active')
    const [activeFilter, setActiveFilter] = useState('active');
    
    const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0, urgent: 0 });

    const [selectedTask, setSelectedTask] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // --- YARDIMCI FONKSİYON: BUGÜN BU GÖREV GEÇERLİ Mİ? ---
    const isRelevantForToday = (startDate, endDate) => {
        if (!startDate) return false;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0); 

        const end = endDate ? new Date(endDate) : new Date(startDate);
        end.setHours(23, 59, 59, 999); 

        return start <= today && today <= end;
    };

    // --- VERİ ÇEKME ---
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // 1. Görevleri Çek
                const taskRes = await fetch('/api/tasks', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const taskData = await taskRes.json();

                // 2. İş Akışlarını Çek
                const wfRes = await fetch('/api/workflows', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const wfData = await wfRes.json();

                if (taskRes.ok) setTasks(taskData);
                if (wfRes.ok) setWorkflows(wfData);

                calculateStats(taskData);

            } catch (error) {
                console.error("Dashboard veri hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isCreateModalOpen, selectedTask]);

    // --- İSTATİSTİK HESAPLAMA ---
    const calculateStats = (taskList) => {
        const todaysTasks = taskList.filter(t => isRelevantForToday(t.start_date, t.end_date));

        setStats({
            active: todaysTasks.filter(t => t.status !== 'Tamamlandı').length,
            pending: todaysTasks.filter(t => t.status === 'Bekliyor').length,
            completed: todaysTasks.filter(t => t.status === 'Tamamlandı').length,
            urgent: todaysTasks.filter(t => (t.priority === 'Yüksek' || t.priority === 'Çok Yüksek') && t.status !== 'Tamamlandı').length,
        });
    };

    // --- LİSTE FİLTRELEME MANTIĞI ---
    const getFilteredList = () => {
        const todaysTasks = tasks.filter(t => isRelevantForToday(t.start_date, t.end_date));

        switch (activeFilter) {
            case 'active':
                return todaysTasks.filter(t => t.status !== 'Tamamlandı');
            case 'pending':
                return todaysTasks.filter(t => t.status === 'Bekliyor');
            case 'completed':
                return todaysTasks.filter(t => t.status === 'Tamamlandı');
            case 'urgent':
                return todaysTasks.filter(t => (t.priority === 'Yüksek' || t.priority === 'Çok Yüksek') && t.status !== 'Tamamlandı');
            default:
                return todaysTasks;
        }
    };

    const displayList = getFilteredList();

    // --- SAĞ MENÜ İÇİN VERİLER ---
    // İş Akışlarım (Kullanıcının dahil olduğu tüm iş akışları)
    const myWorkflows = workflows;

    if (loading) return <div className="p-8 text-center text-xs text-gray-400">Yükleniyor...</div>;

    return (
        <div className="w-full h-full flex flex-col gap-6 pb-6 font-sans text-gray-800">
            
            {/* 1. ÜST HEADER */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                        Genel Bakış
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Hoşgeldin {user?.first_name}, işte bugünkü iş özetin.
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-colors"
                >
                    <PlusIcon /> Yeni Görev
                </button>
            </div>

            {/* 2. KPI KARTLARI (BUTONLAŞTIRILDI) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MinimalStatButton 
                    title="Aktif İşler" 
                    subtitle="Bugün"
                    value={stats.active} 
                    isActive={activeFilter === 'active'}
                    onClick={() => setActiveFilter('active')}
                />
                <MinimalStatButton 
                    title="Bekleyen" 
                    subtitle="Bugün"
                    value={stats.pending} 
                    isActive={activeFilter === 'pending'}
                    onClick={() => setActiveFilter('pending')}
                    highlightColor="text-orange-600"
                />
                <MinimalStatButton 
                    title="Tamamlanan" 
                    subtitle="Bugün"
                    value={stats.completed} 
                    isActive={activeFilter === 'completed'}
                    onClick={() => setActiveFilter('completed')}
                    highlightColor="text-green-600"
                />
                <MinimalStatButton 
                    title="Acil / Kritik" 
                    subtitle="Bugün"
                    value={stats.urgent} 
                    isActive={activeFilter === 'urgent'}
                    onClick={() => setActiveFilter('urgent')}
                    highlightColor="text-red-600"
                    isUrgent
                />
            </div>

            {/* 3. İÇERİK ALANI: Split View (Tablo + İş Akışları) */}
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                
                {/* SOL: FİLTRELENMİŞ GÖREV LİSTESİ */}
                <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden h-full">
                    <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-sm font-semibold text-gray-700">
                            {activeFilter === 'active' && 'Bugünün Aktif Görevleri'}
                            {activeFilter === 'pending' && 'Bugün Bekleyen Görevler'}
                            {activeFilter === 'completed' && 'Bugün Tamamlananlar'}
                            {activeFilter === 'urgent' && 'Bugünün Acil Görevleri'}
                        </h2>
                        <button onClick={() => navigate('/calendar')} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                            Takvime Git <ArrowRight />
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {displayList.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Görev Adı</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Müşteri</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Saat</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 text-right">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {displayList.map(task => (
                                        <tr 
                                            key={task.id} 
                                            onClick={() => setSelectedTask(task)} 
                                            className="hover:bg-gray-50 cursor-pointer group transition-colors"
                                        >
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${task.priority_color || 'bg-gray-300'}`}></div>
                                                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{task.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-xs text-gray-500">{task.customer_name || '-'}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500 font-mono">
                                                {task.start_date ? new Date(task.start_date).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '-'}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <StatusBadge status={task.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <span className="text-xs">Bu kategoride bugün için kayıt bulunamadı.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* SAĞ: İŞ AKIŞLARIM (TEK KART, SOL İLE EŞİT YÜKSEKLİK) */}
                <div className="w-full lg:w-80 h-full">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                İş Akışlarım
                            </h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {myWorkflows.length > 0 ? (
                                <div className="flex flex-col">
                                    {myWorkflows.map(wf => (
                                        <div 
                                            key={wf.id} 
                                            onClick={() => navigate('/workflows', { state: { targetWorkflowId: wf.id } })}
                                            className="group flex items-center gap-3 p-4 border-b border-gray-50 last:border-none hover:bg-gray-50 cursor-pointer transition-all"
                                        >
                                            {/* Minimal İkon Alanı */}
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:scale-105 transition-all duration-200">
                                                <WorkflowIcon />
                                            </div>
                                            
                                            {/* İçerik */}
                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <p className="text-xs font-semibold text-gray-700 truncate group-hover:text-indigo-700 transition-colors">
                                                        {wf.title}
                                                    </p>
                                                </div>
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    {wf.stages ? `${wf.stages.length} Aşama` : 'Aşama Yok'}
                                                </p>
                                            </div>

                                            {/* Sağ Ok */}
                                            <div className="text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all">
                                                <ChevronRight />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                                    <div className="p-3 bg-gray-50 rounded-full">
                                        <WorkflowIcon />
                                    </div>
                                    <p className="text-xs">Henüz iş akışınız yok.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALLAR */}
            {selectedTask && (
                <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
            {isCreateModalOpen && (
                <CreateTaskModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
};

// --- YENİLENMİŞ BUTON STİLİNDEKİ STAT KARTI ---
const MinimalStatButton = ({ title, subtitle, value, highlightColor, isUrgent, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            relative p-4 rounded-lg flex flex-col justify-between h-24 transition-all duration-200 text-left w-full group
            border ${isActive ? 'border-gray-800 ring-1 ring-gray-800 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'}
        `}
    >
        <div className="flex justify-between w-full">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isUrgent ? 'text-red-600' : 'text-gray-500'} ${isActive ? 'text-gray-900' : ''}`}>
                {title}
            </span>
            <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-sm font-medium">
                {subtitle}
            </span>
        </div>

        <div className="flex items-end justify-between mt-auto w-full">
            <span className={`text-3xl font-light tracking-tight ${highlightColor ? highlightColor : 'text-gray-900'}`}>
                {value}
            </span>
            
            {/* Seçili olduğunu gösteren ikon */}
            {isActive && (
                <div className="text-gray-800 animate-in zoom-in duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
        
        {isUrgent && value > 0 && !isActive && (
            <span className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        )}
    </button>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'Bekliyor': 'text-orange-600',
        'Aktif': 'text-green-600',
        'Tamamlandı': 'text-blue-600',
        'Askıya Alındı': 'text-gray-400'
    };
    const dotStyles = {
        'Bekliyor': 'bg-orange-500',
        'Aktif': 'bg-green-500',
        'Tamamlandı': 'bg-blue-500',
        'Askıya Alındı': 'bg-gray-400'
    };
    
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status] || 'text-gray-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || 'bg-gray-400'}`}></span>
            {status}
        </span>
    );
};

export default DashboardHome;
