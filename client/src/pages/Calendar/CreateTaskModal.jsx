import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getUserColor } from "../../utils/userColors";

const CreateTaskModal = ({ onClose }) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('Detaylar');
    const [isLoading, setIsLoading] = useState(false);

    // --- MÜŞTERİ DROPDOWN STATE'LERİ (YENİ EKLENDİ) ---
    const [customers, setCustomers] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const customerDropdownRef = useRef(null);

    // HATA YÖNETİMİ STATE'İ (YENİ EKLENDİ)
    const [errors, setErrors] = useState({});

    // Form Alanları State'i
    const [taskName, setTaskName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tags, setTags] = useState('');

    // Adımlar State'i
    const [steps, setSteps] = useState([]);
    const [newStepInput, setNewStepInput] = useState('');

    // Dosyalar State'i
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    // Durum ve Öncelik
    const [status, setStatus] = useState('Aktif');
    const [priorityColor, setPriorityColor] = useState('bg-emerald-500');
    const [priorityLabel, setPriorityLabel] = useState('Normal');

    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    // --- EKİP VE SEÇİM STATE'LERİ ---
    const [teamMembers, setTeamMembers] = useState([]);
    const [assignees, setAssignees] = useState([]);

    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');

    // Dropdown konumu
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    // --- REFS ---
    const statusRef = useRef(null);
    const priorityRef = useRef(null);
    const assigneeRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- MEVCUT KULLANICIYI ÇEK ---
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // --- EKİP VERİSİNİ ÇEK ---
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/team', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTeamMembers(data);
                }
            } catch (error) {
                console.error("Ekip verisi çekilemedi:", error);
            }
        };
        fetchTeam();
    }, []);

    // --- MÜŞTERİLERİ ÇEK (YENİ EKLENDİ) ---
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/customers', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCustomers(data);
                }
            } catch (error) {
                console.error("Müşteri verisi çekilemedi:", error);
            }
        };
        fetchCustomers();
    }, []);

    // --- CLICK OUTSIDE EFFECT (GÜNCELLENDİ) ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (statusRef.current && !statusRef.current.contains(event.target)) setIsStatusOpen(false);
            if (priorityRef.current && !priorityRef.current.contains(event.target)) setIsPriorityOpen(false);

            if (assigneeRef.current && !assigneeRef.current.contains(event.target)) {
                setIsAssigneeOpen(false);
            }

            // YENİ EKLENEN KISIM:
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Dropdown konumu hesaplama
    useEffect(() => {
        if (isAssigneeOpen && assigneeRef.current) {
            const rect = assigneeRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.top,
                left: rect.right + 8
            });
        }
    }, [isAssigneeOpen]);

    // --- MÜŞTERİ SEÇİM İŞLEMLERİ (YENİ EKLENDİ) ---
    const handleSelectCustomer = (customer) => {
        setCustomerName(`${customer.name} ${customer.surname}`);
        setShowCustomerDropdown(false);
    };

    // Filtrelenmiş Müşteri Listesi
    const filteredCustomers = customers.filter(c =>
        `${c.name} ${c.surname}`.toLowerCase().includes(customerName.toLowerCase())
    );


    // --- OLUŞTURMA VE DOĞRULAMA (GÜNCELLENDİ) ---
    const handleCreate = async () => {
        // 1. Validasyon Kontrolü (Alert yerine State kullanımı)
        const newErrors = {};

        if (!taskName.trim()) {
            newErrors.taskName = "Görev adı alanı boş bırakılamaz.";
        }

        if (!startDate) {
            newErrors.startDate = "Başlangıç tarihi seçilmelidir.";
        }

        if (!endDate) {
            newErrors.endDate = "Bitiş tarihi seçilmelidir.";
        } else if (startDate && new Date(endDate) < new Date(startDate)) {
            newErrors.endDate = "Bitiş tarihi, başlangıç tarihinden önce olamaz.";
        }

        // Eğer hata varsa işlemi durdur ve state'i güncelle
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error("Lütfen zorunlu alanları doldurun.");
            // Hata varsa "Detaylar" tabına geri dön ki kullanıcı görsün
            if (activeTab !== 'Detaylar') setActiveTab('Detaylar');
            return;
        }

        setIsLoading(true);

        // 2. FormData Hazırla 
        const formData = new FormData();
        formData.append('title', taskName);
        formData.append('customerName', customerName);
        formData.append('description', description);
        formData.append('status', status);
        formData.append('priority', priorityLabel);
        formData.append('priorityColor', priorityColor);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);

        formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t !== '')));
        formData.append('assigneeIds', JSON.stringify(assignees.map(u => u.id)));
        formData.append('steps', JSON.stringify(steps.map(s => ({ text: s.text, description: s.description, completed: s.completed }))));

        uploadedFiles.forEach((file) => {
            formData.append('files', file);
        });

        // 3. Backend'e Gönder
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                toast.success("Görev başarıyla oluşturuldu!");
                onClose();
            } else {
                const errData = await response.json();
                toast.error("Hata: " + (errData.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error(error);
            toast.error("Sunucuya bağlanılamadı.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- ADIM İŞLEMLERİ ---
    const handleAddStep = () => {
        if (newStepInput.trim() !== '') {
            setSteps([...steps, { id: Date.now(), text: newStepInput, description: '', completed: false }]);
            setNewStepInput('');
        }
    };

    const updateStepText = (id, newText) => {
        setSteps(steps.map(step => step.id === id ? { ...step, text: newText } : step));
    };

    const updateStepDescription = (id, desc) => {
        setSteps(steps.map(step => step.id === id ? { ...step, description: desc } : step));
    };

    const deleteStep = (id) => {
        setSteps(steps.filter(step => step.id !== id));
    };

    // --- DOSYA İŞLEMLERİ ---
    const addFiles = (newFiles) => {
        if (uploadedFiles.length + newFiles.length > 10) {
            toast.error("En fazla 10 dosya yükleyebilirsiniz.");
            return;
        }
        setUploadedFiles([...uploadedFiles, ...newFiles]);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        addFiles(files);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
    };

    const handleRemoveFile = (index) => {
        const newFiles = uploadedFiles.filter((_, i) => i !== index);
        setUploadedFiles(newFiles);
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    // --- KİŞİ SEÇİMİ ---
    const handleSelectAssignee = (member) => {
        if (!assignees.find(m => m.id === member.id)) {
            setAssignees([...assignees, member]);
        }
        setIsAssigneeOpen(false);
        setAssigneeSearch('');
    };

    const handleRemoveAssignee = (id) => {
        setAssignees(assignees.filter(m => m.id !== id));
    };

    // --- DİNAMİK YÜKSEKLİK MANTIĞI ---
    const getModalHeight = () => {
        if (activeTab === 'Dosyalar') {
            const baseHeight = 450;
            const fileRows = Math.ceil(uploadedFiles.length / 3);
            const calculatedHeight = baseHeight + (fileRows * 120);
            return calculatedHeight >= 580 ? '100%' : `${calculatedHeight}px`;
        }
        if (activeTab === 'Adımlar') {
            const calculatedHeight = 450 + (steps.length * 50);
            return calculatedHeight >= 580 ? '100%' : `${calculatedHeight}px`;
        }
        return '100%';
    };

    // --- STYLE DATA ---
    const statusOptions = [
        { label: 'Bekliyor', bgClass: 'bg-orange-100', textClass: 'text-orange-700', borderClass: 'border-orange-200', dotClass: 'bg-orange-500' },
        { label: 'Aktif', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', borderClass: 'border-emerald-200', dotClass: 'bg-emerald-500' },
        { label: 'Tamamlandı', bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderClass: 'border-blue-200', dotClass: 'bg-blue-500' },
        { label: 'Askıya Alındı', bgClass: 'bg-purple-100', textClass: 'text-purple-700', borderClass: 'border-purple-200', dotClass: 'bg-purple-500' },
    ];

    const currentStatusStyle = statusOptions.find(s => s.label === status) || statusOptions[1];

    const priorityOptions = [
        { color: 'bg-red-500', label: 'Çok Yüksek' },
        { color: 'bg-amber-400', label: 'Yüksek' },
        { color: 'bg-emerald-500', label: 'Normal' },
        { color: 'bg-blue-500', label: 'Düşük' },
        { color: 'bg-gray-400', label: 'Çok Düşük' }
    ];

    return (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex justify-center items-center backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">

            {/* --- WRAPPER (Max Yükseklik 580px) --- */}
            <div className="relative w-[750px] h-[580px]">

                {/* --- MODAL --- */}
                <div
                    className="absolute top-0 left-0 w-full bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-[height] duration-300 ease-in-out"
                    style={{ height: getModalHeight() }}
                >

                    {/* HEADER */}
                    <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 bg-white shrink-0">
                        <div className="w-5"></div>
                        <h2 className="text-sm font-bold text-gray-800">Görev Ekle</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* TABS */}
                    <div className="flex items-center justify-center gap-6 px-2 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
                        <TabItem onClick={() => setActiveTab('Detaylar')} icon="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" label="Detaylar" active={activeTab === 'Detaylar'} />
                        <TabItem onClick={() => setActiveTab('Dosyalar')} icon="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" label="Dosyalar" active={activeTab === 'Dosyalar'} />
                        <TabItem onClick={() => setActiveTab('Adımlar')} icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Adımlar" active={activeTab === 'Adımlar'} />
                    </div>

                    {/* --- İÇERİK --- */}
                    <div className="flex-1 overflow-y-auto relative p-0 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">

                        {/* ======================= DETAYLAR ======================= */}
                        {activeTab === 'Detaylar' && (
                            <div className="p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* Üst Satır */}
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1 relative">
                                        <Label required>Görev Adı</Label>
                                        <input
                                            type="text"
                                            value={taskName}
                                            onChange={(e) => {
                                                setTaskName(e.target.value);
                                                // Kullanıcı yazmaya başlayınca hatayı sil
                                                if (errors.taskName) setErrors({ ...errors, taskName: null });
                                            }}
                                            // Hata varsa çerçeve kırmızı olur
                                            className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 transition-all ${errors.taskName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                        />
                                        {/* Hata Mesajı */}
                                        {errors.taskName && (
                                            <p className="text-red-500 text-[10px] mt-1 font-medium animate-in slide-in-from-top-1">
                                                {errors.taskName}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-32 relative" ref={statusRef}>
                                        <Label required>Durum</Label>
                                        <button onClick={() => setIsStatusOpen(!isStatusOpen)} className={`w-full border rounded-md px-2.5 py-1.5 flex justify-between items-center transition-all text-xs font-bold ${currentStatusStyle.bgClass} ${currentStatusStyle.textClass} ${currentStatusStyle.borderClass}`}>
                                            {status}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 opacity-70"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                        </button>
                                        {isStatusOpen && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-20 py-1 animate-in fade-in zoom-in-95 duration-100">
                                                {statusOptions.map((opt) => (
                                                    <div key={opt.label} onClick={() => { setStatus(opt.label); setIsStatusOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                                                        <div className={`w-2 h-2 rounded-full ${opt.dotClass}`}></div>
                                                        <span className="text-xs text-gray-600 font-medium">{opt.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-20 relative" ref={priorityRef}>
                                        <Label required align="right">Öncelik</Label>
                                        <button onClick={() => setIsPriorityOpen(!isPriorityOpen)} className="w-full border border-gray-300 rounded-md px-1 py-1.5 flex justify-center items-center hover:bg-gray-50 transition-colors bg-white">
                                            <div className={`w-4 h-4 rounded-full ${priorityColor} shadow-sm ring-1 ring-white`}></div>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                        {isPriorityOpen && (
                                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-20 p-1.5 flex gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                                                {priorityOptions.map((option) => (
                                                    <div key={option.color} className="relative group">
                                                        <div onClick={() => { setPriorityColor(option.color); setPriorityLabel(option.label); setIsPriorityOpen(false); }} className={`w-5 h-5 rounded-full cursor-pointer hover:scale-125 transition-transform ${option.color} ${priorityColor === option.color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}></div>
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                                            <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap relative">
                                                                {option.label}
                                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label>Açıklama</Label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[60px] resize-none placeholder-gray-400"
                                        placeholder="Görev detayları..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        {/* Başlangıç Tarihi GÜNCELLENDİ: required ve Hata mesajı */}
                                        <Label required icon={<CalendarIcon />}>Başlangıç Tarihi</Label>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                if (errors.startDate) setErrors({ ...errors, startDate: null });
                                            }}
                                            className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.startDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                        />
                                        {errors.startDate && (
                                            <p className="text-red-500 text-[10px] mt-1 font-medium animate-in slide-in-from-top-1">
                                                {errors.startDate}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        {/* Bitiş Tarihi GÜNCELLENDİ: required ve Hata mesajı */}
                                        <Label required icon={<CalendarIcon />}>Bitiş Tarihi</Label>
                                        <input
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={(e) => {
                                                setEndDate(e.target.value);
                                                if (errors.endDate) setErrors({ ...errors, endDate: null });
                                            }}
                                            className={`w-full border rounded-md px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.endDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
                                        />
                                        {errors.endDate && (
                                            <p className="text-red-500 text-[10px] mt-1 font-medium animate-in slide-in-from-top-1">
                                                {errors.endDate}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Etiketler</Label>
                                        <input
                                            type="text"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                                            placeholder="Etiket1, Etiket2..."
                                        />
                                    </div>
                                    <div className="relative" ref={customerDropdownRef}>
                                        <Label>Müşteri</Label>
                                        <input
                                            type="text"
                                            placeholder="Müşteri Ara veya Yaz..."
                                            value={customerName}
                                            onChange={(e) => {
                                                setCustomerName(e.target.value);
                                                setShowCustomerDropdown(true);
                                            }}
                                            onClick={() => setShowCustomerDropdown(true)}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white transition-all"
                                            autoComplete="off"
                                        />

                                        {/* DROPDOWN MENÜ */}
                                        {showCustomerDropdown && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                                {filteredCustomers.length === 0 && (
                                                    <div className="px-3 py-2 text-xs text-gray-400 italic">Sonuç yok...</div>
                                                )}
                                                {filteredCustomers.map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => handleSelectCustomer(c)}
                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-xs text-gray-700 border-b border-gray-50 last:border-0 flex flex-col group"
                                                    >
                                                        <span className="font-medium group-hover:text-blue-600">{c.name} {c.surname}</span>
                                                        {c.phone && <span className="text-[9px] text-gray-400">{c.phone}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* --- GÖREVLİLER --- */}
                                <div className="pt-3 border-t border-gray-50 mt-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Görevliler</span>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {assignees.map(user => (
                                                    <SelectedAvatar
                                                        key={user.id}
                                                        user={user}
                                                        onRemove={() => handleRemoveAssignee(user.id)}
                                                    />
                                                ))}
                                                <div ref={assigneeRef}>
                                                    <button onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}>
                                                        <AddButton />
                                                    </button>
                                                    {isAssigneeOpen && (
                                                        <div
                                                            className="fixed w-56 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 z-[9999] animate-in fade-in zoom-in-95 origin-top-left"
                                                            style={{ top: dropdownPos.top, left: dropdownPos.left }}
                                                        >
                                                            <input
                                                                type="text"
                                                                placeholder="Kişi adı girin.."
                                                                autoFocus
                                                                value={assigneeSearch}
                                                                onChange={(e) => setAssigneeSearch(e.target.value)}
                                                                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 mb-2"
                                                            />
                                                            <div className="max-h-40 overflow-y-auto space-y-1">
                                                                {teamMembers.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(assigneeSearch.toLowerCase())).map(member => {
                                                                    const colorStyle = getUserColor(member.id);
                                                                    return (
                                                                        <div
                                                                            key={member.id}
                                                                            onClick={() => handleSelectAssignee(member)}
                                                                            className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer group"
                                                                        >
                                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${colorStyle.bg} ${colorStyle.text}`}>
                                                                                {member.first_name[0]}{member.last_name[0]}
                                                                            </div>
                                                                            <span className="text-xs text-gray-700 group-hover:text-blue-600 font-medium">
                                                                                {member.first_name} {member.last_name}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {teamMembers.length === 0 && <p className="text-[10px] text-gray-400 text-center py-2">Ekip üyesi bulunamadı.</p>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================= DOSYALAR ======================= */}
                        {activeTab === 'Dosyalar' && (
                            <div
                                className="h-full overflow-y-auto p-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className={`flex flex-col w-full h-full transition-colors rounded-xl ${isDragging ? 'bg-blue-50/50 border-2 border-dashed border-blue-400' : ''} ${uploadedFiles.length === 0 ? 'justify-center items-center' : ''}`}>

                                    {/* 1. DOSYA LİSTESİ */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="grid grid-cols-3 gap-4 w-full mb-6 animate-in fade-in slide-in-from-top-2">
                                            {uploadedFiles.map((file, index) => (
                                                <div key={index} className="relative group border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center bg-white shadow-sm hover:shadow-md transition-all h-32">

                                                    <button
                                                        onClick={() => handleRemoveFile(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hidden group-hover:flex items-center justify-center hover:bg-red-600 transition-colors shadow-md z-10 w-5 h-5"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <div className="mb-2">
                                                        <FileIcon fileName={file.name} />
                                                    </div>

                                                    <span className="text-[10px] text-gray-600 font-bold truncate w-full text-center px-1">
                                                        {file.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 2. YÜKLEME ALANI */}
                                    <div className={`flex flex-col items-center justify-center text-center space-y-4 w-full ${uploadedFiles.length > 0 ? 'mt-auto pt-8 border-t border-dashed border-gray-200' : ''}`}>

                                        <h3 className="text-lg font-bold text-gray-700">Dosya Yükle</h3>
                                        <p className="text-xs font-medium text-gray-400 leading-relaxed px-12 max-w-sm">
                                            {isDragging ? 'Dosyaları buraya bırakın...' : 'Yüklemek istediğin dosyayı bu alana sürükle veya aşağıdaki butona tıkla.'}
                                        </p>

                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            ref={fileInputRef}
                                        />

                                        <button
                                            onClick={triggerFileInput}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all transform hover:-translate-y-1 active:scale-95 group"
                                        >
                                            <span>Dosya Yükle</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:animate-bounce">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ======================= ADIMLAR ======================= */}
                        {activeTab === 'Adımlar' && (
                            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {steps.length > 0 && (
                                    <div className="space-y-3 pl-1">
                                        {steps.map((step, index) => (
                                            <StepItem
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                onUpdateText={updateStepText}
                                                onUpdateDescription={updateStepDescription}
                                                onDelete={deleteStep}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div>
                                    <Label>Yeni Adım</Label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={newStepInput}
                                            onChange={(e) => setNewStepInput(e.target.value)}
                                            className="w-full border border-gray-300 rounded-full pl-4 pr-24 py-2.5 text-xs text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                                            placeholder="Adım adı"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                                        />
                                        <button
                                            onClick={handleAddStep}
                                            className="absolute right-1 top-1 bottom-1 bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-full text-xs font-bold transition-colors flex items-center gap-1 shadow-md"
                                        >
                                            Ekle <span className="text-sm">+</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* FOOTER */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                        <button onClick={onClose} className="flex items-center gap-1 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md text-xs font-bold transition-colors">
                            <span>iptal</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <button
                            onClick={handleCreate}
                            disabled={isLoading}
                            className={`flex items-center gap-1.5 px-5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-bold shadow-md shadow-blue-100 transition-all transform hover:scale-105 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>İşleniyor...</span>
                                </>
                            ) : (
                                <>
                                    <span>Oluştur</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- YARDIMCI BİLEŞENLER ---

const FileIcon = ({ fileName }) => {
    const ext = fileName.split('.').pop().toLowerCase();
    // ... FileIcon kodları aynı ...
    if (ext === 'pdf') {
        return (
            <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#FEE2E2" />
                <path d="M14 2V9H20" fill="#EF4444" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#EF4444" fontFamily="sans-serif">PDF</text>
            </svg>
        );
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return (
            <svg className="w-12 h-12 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#DCFCE7" />
                <path d="M14 2V9H20" fill="#22C55E" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#15803D" fontFamily="sans-serif">XLS</text>
            </svg>
        );
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext)) {
        return (
            <svg className="w-12 h-12 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#F3E8FF" />
                <path d="M14 2V9H20" fill="#A855F7" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#A855F7" fontFamily="sans-serif">IMG</text>
            </svg>
        );
    }
    return (
        <svg className="w-12 h-12 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#EBF5FF" />
            <path d="M14 2V9H20" fill="#3B82F6" />
            <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#3B82F6" fontFamily="sans-serif">{ext.toUpperCase().slice(0, 3)}</text>
        </svg>
    );
};

const StepItem = ({ step, index, onUpdateText, onUpdateDescription, onDelete }) => {
    // ... StepItem kodları aynı ...
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
    const [titleInput, setTitleInput] = useState(step.text);
    const [descInput, setDescInput] = useState(step.description);

    const handleTitleSave = () => {
        if (titleInput.trim()) {
            onUpdateText(step.id, titleInput);
            setIsEditingTitle(false);
        }
    };

    const handleDescriptionChange = (e) => {
        setDescInput(e.target.value);
        onUpdateDescription(step.id, e.target.value);
    };

    return (
        <div className="group">
            <div className="flex items-center gap-3 min-h-[30px]">
                <span className="text-gray-500 font-bold text-sm">{index + 1}.</span>
                {isEditingTitle ? (
                    <input
                        autoFocus
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                        className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none"
                    />
                ) : (
                    <span className="text-gray-800 font-bold text-sm">{step.text}</span>
                )}
                {!isEditingTitle && (
                    <div className="ml-auto flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="relative group/icon">
                            <button onClick={() => setIsEditingTitle(true)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                            </button>
                        </div>
                        <div className="relative group/icon">
                            <button onClick={() => setIsDescriptionOpen(!isDescriptionOpen)} className={`transition-colors ${isDescriptionOpen ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                            </button>
                        </div>
                        <div className="relative group/icon">
                            <button onClick={() => onDelete(step.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {isDescriptionOpen && (
                <div className="ml-7 mt-2 mb-3 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-gray-500">Açıklama</span>
                        <span className="text-[10px] text-gray-300">x</span>
                        <button onClick={() => setIsDescriptionOpen(false)} className="text-xs font-bold text-red-400 hover:text-red-600">Sil</button>
                    </div>
                    <div className="relative border border-gray-200 rounded-lg p-1 bg-white">
                        <textarea
                            value={descInput}
                            onChange={handleDescriptionChange}
                            placeholder="Açıklama ekle..."
                            className="w-full text-xs text-gray-600 p-2 focus:outline-none resize-none min-h-[40px]"
                        ></textarea>
                    </div>
                </div>
            )}
        </div>
    );
};

const SelectedAvatar = ({ user, onRemove }) => {
    // ... SelectedAvatar kodları aynı ...
    const colorStyle = getUserColor(user.id);
    return (
        <div className="relative group cursor-pointer" onClick={onRemove}>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold transition-all ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500`}>
                <span className="group-hover:hidden">{user.first_name[0]}{user.last_name[0]}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 hidden group-hover:block">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100] min-w-max">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg relative">
                    {user.first_name} {user.last_name}
                    <div className="absolute top-full left-3 transform -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        </div>
    );
};

const Avatar = ({ initial, color }) => (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border border-white shadow-sm cursor-pointer hover:scale-110 transition-transform ${color}`}>
        {initial}
    </div>
);

const Label = ({ children, required, align = 'left', icon }) => (
    <label className={`block text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {icon && <span className="text-purple-400 w-3 h-3">{icon}</span>}
        {children}
        {required && <span className="text-red-500">*</span>}
    </label>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
);

const AddButton = () => (
    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 shadow-sm transition-all hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
    </div>
);

const TabItem = ({ icon, label, active, onClick }) => (
    <div onClick={onClick} className={`flex flex-col items-center gap-0.5 cursor-pointer group px-2 ${active ? 'opacity-100' : 'opacity-50 hover:opacity-80 transition-opacity'}`}>
        <div className={`p-1.5 rounded-lg transition-all ${active ? 'bg-white shadow-sm text-blue-600 transform scale-105' : 'group-hover:bg-white/50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
        </div>
        <span className={`text-[10px] font-bold ${active ? 'text-blue-600' : 'text-gray-500'}`}>{label}</span>
    </div>
);

export default CreateTaskModal;
