import React, { useState, useEffect, useRef } from 'react';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';

const Calendar = () => {
  // --- STATE (DURUM) YÖNETİMİ ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]); // Veritabanından gelen görevler
  
  // Detay Baloncuğu için State
  const [selectedDayDetail, setSelectedDayDetail] = useState(null); 
  const [detailPos, setDetailPos] = useState({ top: 0, left: 0 });
  const detailRef = useRef(null); 

  // Büyük Detay Ekranı (Modal) için State
  const [selectedTask, setSelectedTask] = useState(null);

  // --- FİLTRE STATE'LERİ ---
  // Varsayılan olarak tümü seçili başlar
  const allStatuses = ['Bekliyor', 'Aktif', 'Tamamlandı', 'Askıya Alındı'];
  const allPriorities = ['Çok Yüksek', 'Yüksek', 'Normal', 'Düşük', 'Çok Düşük'];

  const [selectedStatuses, setSelectedStatuses] = useState([...allStatuses]);
  const [selectedPriorities, setSelectedPriorities] = useState([...allPriorities]);

  // --- GÖREVLERİ ÇEK ---
  const fetchTasks = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            setTasks(data);
        }
    } catch (error) {
        console.error("Görevler çekilemedi:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [showModal]); 

  // --- DIŞARI TIKLAMA KONTROLÜ (BALONCUK KAPATMA) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (detailRef.current && !detailRef.current.contains(event.target)) {
        setSelectedDayDetail(null);
      }
    }
    if (selectedDayDetail) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedDayDetail]);

  // --- TAKVİM MATEMATİĞİ ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  let firstDayIndex = new Date(year, month, 1).getDay();
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayIndex; i > 0; i--) {
    const day = prevMonthLastDay - i + 1;
    const dateObj = new Date(year, month - 1, day); 
    calendarDays.push({ day, type: 'prev', date: dateObj });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
    const dateObj = new Date(year, month, i);
    calendarDays.push({ day: i, type: 'current', isToday, date: dateObj });
  }

  const remainingCells = 35 - calendarDays.length; 
  const totalCells = remainingCells < 0 ? 42 : 35; 
  const finalRemaining = totalCells - calendarDays.length;

  for (let i = 1; i <= finalRemaining; i++) {
    const dateObj = new Date(year, month + 1, i);
    calendarDays.push({ day: i, type: 'next', date: dateObj });
  }

  // --- GÖREV FİLTRELEME MANTIĞI ---
  const getTasksForDay = (calendarDate) => {
    return tasks.filter(task => {
        // 1. Tarih Kontrolü
        if (!task.start_date) return false;
        const taskStart = new Date(task.start_date);
        const taskEnd = task.end_date ? new Date(task.end_date) : taskStart; 
        const checkDate = new Date(calendarDate);
        checkDate.setHours(0, 0, 0, 0);
        const start = new Date(taskStart);
        start.setHours(0, 0, 0, 0);
        const end = new Date(taskEnd);
        end.setHours(0, 0, 0, 0);
        
        const dateMatch = checkDate >= start && checkDate <= end;

        // 2. Durum Filtresi (Veritabanından 'status' alanı gelmeli)
        const statusMatch = selectedStatuses.includes(task.status);

        // 3. Öncelik Filtresi (Veritabanından 'priority' text olarak gelmeli örn: 'Yüksek')
        const priorityMatch = selectedPriorities.includes(task.priority);

        return dateMatch && statusMatch && priorityMatch;
    });
  };

  // --- FİLTRE TOGGLE FONKSİYONLARI ---
  const toggleStatus = (status) => {
    if (selectedStatuses.includes(status)) {
        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
        setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const togglePriority = (priority) => {
    if (selectedPriorities.includes(priority)) {
        setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
    } else {
        setSelectedPriorities([...selectedPriorities, priority]);
    }
  };

  // --- DETAY AÇMA ---
  const openDayDetail = (e, date, dayTasks) => {
      e.stopPropagation(); 

      if (dayTasks.length > 0) {
          const rect = e.currentTarget.getBoundingClientRect();
          let top = rect.top;
          let left = rect.right + 10; 

          if (left + 300 > window.innerWidth) { 
              left = rect.left - 310; 
          }
          if (top + 300 > window.innerHeight) {
              top = window.innerHeight - 320;
          }

          setDetailPos({ top, left });
          setSelectedDayDetail({
              date: date,
              tasks: dayTasks
          });
      }
  };

  const openTaskDetail = (e, task) => {
      e.stopPropagation(); 
      setSelectedDayDetail(null); 
      setSelectedTask(task); 
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  return (
    <div className="flex gap-6 h-full font-sans relative">
      
      {/* SOL PANEL */}
      <div className="w-72 bg-white rounded-2xl shadow-sm p-5 flex flex-col h-fit shrink-0">
        {/* BUTON: Rengi Kırmızı Yapıldı */}
        <button onClick={() => setShowModal(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-full flex items-center justify-between mb-8 transition-colors shadow-red-200 shadow-lg cursor-pointer">
          <span className="text-sm">Görev Oluştur</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        
        {/* FİLTRELER: Durum */}
        <div className="mb-6">
            <h3 className="text-gray-800 font-bold mb-3 text-sm flex items-center justify-between">
                Durum
                <button onClick={() => setSelectedStatuses(allStatuses)} className="text-[10px] text-blue-500 hover:underline font-normal">Tümünü Seç</button>
            </h3>
            <div className="space-y-2.5">
                {allStatuses.map(status => (
                    <FilterOption 
                        key={status} 
                        label={status} 
                        isActive={selectedStatuses.includes(status)} 
                        onClick={() => toggleStatus(status)} 
                    />
                ))}
            </div>
        </div>

        {/* FİLTRELER: Öncelik */}
        <div>
            <h3 className="text-gray-800 font-bold mb-3 text-sm flex items-center justify-between">
                Öncelik
                <button onClick={() => setSelectedPriorities(allPriorities)} className="text-[10px] text-blue-500 hover:underline font-normal">Tümünü Seç</button>
            </h3>
            <div className="space-y-2.5">
                {allPriorities.map(priority => (
                    <FilterOption 
                        key={priority} 
                        label={priority} 
                        isActive={selectedPriorities.includes(priority)} 
                        onClick={() => togglePriority(priority)}
                    />
                ))}
            </div>
        </div>
      </div>

      {/* SAĞ PANEL (TAKVİM) */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg></button>
                    <h2 className="text-xl font-bold text-gray-800 min-w-[140px] text-center">{monthNames[month]} {year}</h2>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
                </div>
                <button onClick={goToToday} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">Bugün</button>
            </div>
            {/* SAĞ ÜSTTEKİ AY/HAFTA/GÜN BUTONLARI KALDIRILDI */}
        </div>

        {/* Günler Başlığı */}
        <div className="grid grid-cols-7 border-b border-gray-100 shrink-0">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                <div key={day} className="py-3 text-right pr-4 text-xs font-medium text-gray-400 uppercase tracking-wider">{day}</div>
            ))}
        </div>

        {/* --- TAKVİM IZGARASI --- */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden">
            {calendarDays.map((dateObj, index) => {
                const daysTasks = getTasksForDay(dateObj.date);

                return (
                    <div 
                        key={index}
                        onClick={(e) => openDayDetail(e, dateObj.date, daysTasks)}
                        className={`
                            border-b border-r border-gray-50 p-2 flex flex-col gap-1 cursor-pointer transition-colors relative
                            ${dateObj.type === 'current' ? 'hover:bg-blue-50/50 bg-white' : 'bg-gray-50/40 text-gray-300'}
                            ${dateObj.isToday ? 'bg-blue-50/20' : ''}
                        `}
                        style={{ height: '100%', minHeight: '0' }} 
                    >
                        <div className="flex justify-end shrink-0">
                            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${dateObj.isToday ? 'bg-sky-500 text-white shadow-md' : ''} ${dateObj.type !== 'current' ? 'text-gray-300' : 'text-gray-500'}`}>
                                {dateObj.day}
                            </span>
                        </div>

                        {/* --- GÖREV LİSTESİ ALANI --- */}
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-0">
                            {daysTasks.map((task) => {
                                const isStartDay = new Date(task.start_date).toDateString() === dateObj.date.toDateString();
                                const isEndDay = task.end_date && new Date(task.end_date).toDateString() === dateObj.date.toDateString();
                                
                                let timeDisplay = null;
                                if (isStartDay) timeDisplay = new Date(task.start_date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                                else if (isEndDay) timeDisplay = new Date(task.end_date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});

                                return (
                                    <div 
                                        key={task.id}
                                        className={`${task.priority_color || 'bg-blue-500'} text-black text-[10px] px-2 py-1 rounded shadow-sm font-medium truncate opacity-90 hover:opacity-100`}
                                        title={task.title}
                                    >
                                        {timeDisplay && <span className="font-bold mr-1">{timeDisplay}</span>}
                                        {task.title}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {showModal && <CreateTaskModal onClose={() => setShowModal(false)} />}

      {/* --- GÜN DETAYI BALONCUĞU --- */}
      {selectedDayDetail && (
          <div 
              ref={detailRef}
              className="fixed w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-0 z-[9999] animate-in fade-in zoom-in-95 origin-top-left flex flex-col"
              style={{ top: detailPos.top, left: detailPos.left }}
          >
              <div className="flex justify-between items-center border-b border-gray-50 p-4 bg-gray-50/50 rounded-t-xl">
                  <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-gray-800">
                          {selectedDayDetail.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                          {selectedDayDetail.date.toLocaleDateString('tr-TR', { weekday: 'long' })}
                      </span>
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                      {selectedDayDetail.tasks.length} Görev
                  </div>
              </div>

              <div className="overflow-y-auto max-h-72 p-2 space-y-1 custom-scrollbar">
                  {selectedDayDetail.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        onClick={(e) => openTaskDetail(e, task)}
                        className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg transition-all cursor-pointer group border border-transparent hover:border-gray-100"
                      >
                          <div className={`w-1.5 h-8 rounded-full ${task.priority_color || 'bg-blue-500'} shadow-sm`}></div>
                          
                          <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-gray-700 truncate group-hover:text-gray-900">{task.title}</h4>
                              {task.customer_name && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-sm truncate max-w-[150px]">
                                          {task.customer_name}
                                      </span>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {selectedTask && (
          <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

    </div>
  );
};

// --- GÜNCELLENMİŞ FİLTRE BİLEŞENİ ---
const FilterOption = ({ label, isActive, onClick }) => (
    <div 
        onClick={onClick} 
        className="flex items-center gap-3 cursor-pointer group select-none"
    >
        {/* Yuvarlak Checkbox Mantığı */}
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 group-hover:border-red-400'}`}>
            {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
        </div>
        <span className={`text-sm transition-colors ${isActive ? 'text-gray-800 font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}>
            {label}
        </span>
    </div>
);

export default Calendar;
