import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getUserColor } from "../../utils/userColors";

const TaskDetailModal = ({ task, onClose }) => {
    // =================================================================================================
    // 1. STATE TANIMLAMALARI
    // =================================================================================================

    const [fullTask, setFullTask] = useState(null);
    const [originalTask, setOriginalTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deletedFileIds, setDeletedFileIds] = useState([]);

    // --- ONAY MODALI STATE'İ (YENİ EKLENDİ) ---
    // Silme ve Güncelleme işlemleri için ortak kullanılacak yapı
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'delete' veya 'update'
        title: '',
        message: '',
        onConfirm: null
    });

    // --- AKTİVİTE VE YORUM STATE'LERİ ---
    const [activities, setActivities] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);
    const activitiesListRef = useRef(null);

    // --- GÖREV DÜZENLEME STATE'LERİ ---
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');

    // --- DURUM (STATUS) STATE'LERİ ---
    const [status, setStatus] = useState(task?.status || 'Aktif');
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    // --- ÖNCELİK (PRIORITY) STATE'LERİ ---
    const [priority, setPriority] = useState(task?.priority || 'Normal');
    const [priorityColor, setPriorityColor] = useState(task?.priority_color || 'bg-emerald-500');
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);

    // --- EKİP VE SEÇİM STATE'LERİ ---
    const [teamMembers, setTeamMembers] = useState([]);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    // --- MÜŞTERİ STATE'LERİ ---
    const [customers, setCustomers] = useState([]);
    const [isEditingCustomer, setIsEditingCustomer] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');

    // --- TARİH DÜZENLEME STATE'LERİ ---
    const [isEditingDate, setIsEditingDate] = useState(false);

    // =================================================================================================
    // 2. REF VE MEMO TANIMLAMALARI
    // =================================================================================================

    const statusRef = useRef(null);
    const priorityRef = useRef(null);
    const fileInputRef = useRef(null);
    const assigneeRef = useRef(null);
    const customerRef = useRef(null);
    const dateRef = useRef(null);

    // Ekranda gösterilecek görevin güncel hali (Anlık değişimler için)
    const displayTask = useMemo(() => {
        const base = fullTask || task;
        return {
            ...base,
            status,
            priority,
            priority_color: priorityColor
        };
    }, [fullTask, task, status, priority, priorityColor]);

    // =================================================================================================
    // 3. EFFECT (YAN ETKİ) KANCALARI
    // =================================================================================================

    // --- OTOMATİK SCROLL (WhatsApp Mantığı) ---
    // Yeni mesaj geldiğinde en alta kaydır
    // --- OTOMATİK SCROLL (Düzeltilmiş) ---
    // Sadece aktiviteler kutusunu aşağı kaydırır, ana sayfayı etkilemez.
    useEffect(() => {
        if (activitiesListRef.current) {
            const container = activitiesListRef.current;
            // Scroll'u en alta eşitliyoruz
            container.scrollTop = container.scrollHeight;
        }
    }, [activities]);

    // --- CLICK OUTSIDE (DIŞARI TIKLAMA KAPATMA) ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (statusRef.current && !statusRef.current.contains(event.target)) setIsStatusOpen(false);
            if (priorityRef.current && !priorityRef.current.contains(event.target)) setIsPriorityOpen(false);
            if (assigneeRef.current && !assigneeRef.current.contains(event.target)) setIsAssigneeOpen(false);
            if (customerRef.current && !customerRef.current.contains(event.target)) setIsEditingCustomer(false);
            if (dateRef.current && !dateRef.current.contains(event.target)) setIsEditingDate(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Dropdown konumu hesaplama (Görevliler için)
    useEffect(() => {
        if (isAssigneeOpen && assigneeRef.current) {
            const rect = assigneeRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.top,
                left: rect.right + 5
            });
        }
    }, [isAssigneeOpen]);

    // --- VERİ ÇEKME İŞLEMLERİ (FETCH) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                // 1. Görev Detayını Çek
                const taskRes = await fetch(`/api/tasks/${task.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (taskRes.ok) {
                    const data = await taskRes.json();
                    setFullTask(data);
                    setOriginalTask(JSON.parse(JSON.stringify(data)));
                    setStatus(data.status);
                    setPriority(data.priority);
                    setPriorityColor(data.priority_color);

                    // Edit state'lerini de güncelle
                    setEditedTitle(data.title);
                    setEditedDescription(data.description || '');
                }

                // 2. Ekip Üyelerini Çek
                const teamRes = await fetch('/api/team', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (teamRes.ok) {
                    const teamData = await teamRes.json();
                    if (Array.isArray(teamData)) setTeamMembers(teamData);
                }

                // 3. Aktiviteleri Çek
                const activitiesRes = await fetch(`/api/tasks/${task.id}/activities`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (activitiesRes.ok) {
                    const actData = await activitiesRes.json();
                    setActivities(actData);
                }

                // 4. Müşterileri Çek (Demo Veri)
                const mockCustomers = [
                    { id: 1, name: 'Örnek Şirket' },
                    { id: 2, name: 'Acme Holding' },
                    { id: 3, name: 'Tech Solutions' }
                ];
                setCustomers(mockCustomers);

            } catch (error) {
                console.error("Veriler çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [task.id]);

    // =================================================================================================
    // 4. SİLME VE GÜNCELLEME İŞLEMLERİ (MODAL İLE TETİKLENEN)
    // =================================================================================================

    // --- SİLME TETİKLEYİCİSİ (MODAL AÇAR) ---
    const handleDeleteTrigger = () => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Uyarı!',
            message: 'Görevi silmek istediğinizden emin misiniz? Göreve tekrar ulaşmak istiyorsanız görevi arşivlemelisiniz. Bu işlem geri alınamaz.',
            onConfirm: executeDeleteTask
        });
    };

    // --- GÜNCELLEME TETİKLEYİCİSİ (MODAL AÇAR) ---
    const handleUpdateTrigger = () => {
        setConfirmModal({
            isOpen: true,
            type: 'update',
            title: 'Uyarı!',
            message: `"${displayTask.title}" üzerindeki değişiklikleri kaydetmek istediğinizden emin misiniz?`,
            onConfirm: executeUpdateTask
        });
    };

    // --- API: SİLME İŞLEMİ (GERÇEK FONKSİYON) ---
    const executeDeleteTask = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // İşlem başarılı, sayfayı yenile ve kapat
                window.location.reload();
                onClose();
            } else {
                const err = await response.json();
                toast.error("Silme hatası: " + (err.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error(error);
            toast.error("Sunucuya bağlanılamadı.");
        } finally {
            // Modalı kapat
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    // --- YENİ FONKSİYON: DOSYA LİSTESİNDEN KALDIRMA ---
    const handleRemoveExistingFile = (fileId) => {
        // 1. Silinecekler listesine ID'yi ekle
        setDeletedFileIds(prev => [...prev, fileId]);

        // 2. Görünümden kaldır (UI güncellemesi)
        setFullTask(prev => ({
            ...prev,
            files: prev.files.filter(f => f.id !== fileId)
        }));
    };

    // --- DOSYA İNDİRME FONKSİYONU ---
    const handleDownload = (storedName, originalName) => {
        if (!storedName) {
            toast.error("Bu dosya henüz sunucuya kaydedilmediği için indirilemez.");
            return;
        }

        // Backend'deki güvenli indirme rotasına yönlendir
        // res.download sayesinde tarayıcı dosyayı doğrudan indirmeye başlar
        const downloadUrl = `/api/download/${storedName}`;

        // Gizli bir link oluşturup tıklatarak indirmeyi başlatıyoruz
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', originalName); // İndirilen dosyanın orijinal adı
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // --- API: GÜNCELLEME İŞLEMİ (Düzeltilmiş ve FormData'lı Hali) ---
    const executeUpdateTask = async () => {
        const finalTitle = isEditingTask ? editedTitle : displayTask.title;
        const finalDesc = isEditingTask ? editedDescription : (displayTask.description || '');

        const formData = new FormData();
        formData.append('title', finalTitle);
        formData.append('description', finalDesc);
        formData.append('customerName', displayTask.customer_name || '');
        formData.append('status', status);
        formData.append('priority', priority);
        formData.append('priorityColor', priorityColor);
        formData.append('startDate', displayTask.start_date || '');
        formData.append('endDate', displayTask.end_date || '');
        formData.append('newComment', commentText); // Yorum
        // --- executeUpdateTask İÇİNDE FormData eklemelerinin olduğu yere ekle ---
        formData.append('deletedFileIds', JSON.stringify(deletedFileIds));
        // Array verileri JSON String olarak
        formData.append('tags', JSON.stringify(displayTask.tags || []));
        formData.append('assigneeIds', JSON.stringify(displayTask.assignees ? displayTask.assignees.map(u => u.id) : []));
        formData.append('steps', JSON.stringify(displayTask.steps ? displayTask.steps.map(s => ({
            text: s.text,
            description: s.description,
            completed: s.is_completed // Backend is_completed bekliyor olabilir, kontrol et
        })) : []));

        // Sadece YENİ dosyaları ekle
        if (displayTask.files && displayTask.files.length > 0) {
            displayTask.files.forEach(file => {
                if (file.fileObj) { // handleFileChange ile eklenenlerde bu key var
                    formData.append('files', file.fileObj);
                }
            });
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    // 'Content-Type': 'application/json', <-- KALDIRILDI
                    'Authorization': `Bearer ${token}`
                },
                body: formData // JSON stringify yerine
            });

            if (response.ok) {
                setCommentText('');
                window.location.reload();
                onClose();
            } else {
                const err = await response.json();
                toast.error("Hata: " + (err.error || "Bilinmeyen hata"));
            }
        } catch (error) {
            console.error(error);
            toast.error("Sunucu hatası.");
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    // =================================================================================================
    // YENİ: DEĞİŞİKLİK KONTROLÜ VE KAPATMA MANTIĞI
    // =================================================================================================

    // Değişiklik olup olmadığını kontrol eden fonksiyon
    const hasUnsavedChanges = () => {
        if (!originalTask || !fullTask) return false;

        // 1. Status (Durum) Kontrolü
        if (status !== originalTask.status) return true;

        // 2. Priority (Öncelik) Kontrolü
        if (priority !== originalTask.priority) return true;

        // 3. Müşteri Adı Kontrolü
        if ((fullTask.customer_name || '') !== (originalTask.customer_name || '')) return true;

        // 4. Tarih Kontrolü
        if (fullTask.start_date !== originalTask.start_date) return true;
        if (fullTask.end_date !== originalTask.end_date) return true;

        // 5. Görevliler (Assignees) Kontrolü (ID listesi üzerinden)
        const currentAssigneeIds = (fullTask.assignees || []).map(u => u.id).sort().join(',');
        const originalAssigneeIds = (originalTask.assignees || []).map(u => u.id).sort().join(',');
        if (currentAssigneeIds !== originalAssigneeIds) return true;

        // 6. Adımlar (Steps) Kontrolü
        // Sadece metin, açıklama ve tamamlanma durumunu karşılaştırıyoruz
        const simplifySteps = (steps) => steps?.map(s => ({ t: s.text, d: s.description, c: s.is_completed })) || [];
        if (JSON.stringify(simplifySteps(fullTask.steps)) !== JSON.stringify(simplifySteps(originalTask.steps))) return true;

        // 7. Başlık ve Açıklama Kontrolü (Edit modundaysa edit edilenleri, değilse mevcut durumu kontrol et)
        const currentTitle = isEditingTask ? editedTitle : fullTask.title;
        const currentDesc = isEditingTask ? editedDescription : (fullTask.description || '');

        if (currentTitle !== originalTask.title) return true;
        if (currentDesc !== (originalTask.description || '')) return true;

        return false;
    };

    // Çarpıya veya İptal'e basıldığında çalışacak fonksiyon
    const handleCloseAttempt = () => {
        if (hasUnsavedChanges()) {
            setConfirmModal({
                isOpen: true,
                type: 'discard', // Yeni tip: Değişiklikleri at
                title: 'Kaydedilmemiş Değişiklikler!',
                message: 'Yaptığınız değişiklikler kaydedilmedi. Pencereyi kapatırsanız bu değişiklikler kaybolacak. Emin misiniz?',
                onConfirm: () => {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    onClose(); // Değişiklikleri umursamadan kapat
                }
            });
        } else {
            onClose(); // Değişiklik yoksa direkt kapat
        }
    };

    // =================================================================================================
    // 5. DİĞER FONKSİYONLAR (YORUM, DOSYA, ADIMLAR VB.)
    // =================================================================================================

    // --- YORUM GÖNDERME FONKSİYONU ---
    const handleSendComment = async () => {
        if (!commentText.trim()) return;
        setIsSendingComment(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/tasks/${task.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: commentText })
            });

            if (res.ok) {
                setCommentText('');
                // Listeyi yenilemek için aktiviteleri tekrar çekelim
                const updatedRes = await fetch(`/api/tasks/${task.id}/activities`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const updatedData = await updatedRes.json();
                setActivities(updatedData);
            }
        } catch (error) {
            console.error("Yorum gönderilemedi", error);
        } finally {
            setIsSendingComment(false);
        }
    };

    // --- BAŞLIK/AÇIKLAMA DÜZENLEME ---
    const handleSaveTaskEdit = () => {
        setFullTask(prev => ({
            ...prev,
            title: editedTitle,
            description: editedDescription
        }));
        setIsEditingTask(false);
    };

    const handleCancelTaskEdit = () => {
        setEditedTitle(displayTask.title);
        setEditedDescription(displayTask.description || '');
        setIsEditingTask(false);
    };

    // --- GÖREVLİ EKLEME/ÇIKARMA ---
    const handleSelectAssignee = (member) => {
        const currentAssignees = fullTask?.assignees || [];
        if (!currentAssignees.find(m => m.id === member.id)) {
            setFullTask(prev => ({
                ...prev,
                assignees: [...currentAssignees, member]
            }));
        }
        setIsAssigneeOpen(false);
        setAssigneeSearch('');
    };

    const handleRemoveAssignee = (memberId) => {
        setFullTask(prev => ({
            ...prev,
            assignees: prev.assignees.filter(m => m.id !== memberId)
        }));
    };

    // --- DOSYA YÜKLEME ---
    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        const newFiles = files.map(file => ({
            id: `temp-${Date.now()}-${file.name}`,
            file_name: file.name,
            uploaded_at: new Date().toISOString(),
            fileObj: file // YENİ: Gerçek dosya objesini saklıyoruz
        }));

        setFullTask(prev => ({
            ...prev,
            files: [...(prev?.files || []), ...newFiles]
        }));

        event.target.value = '';
    };

    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    // --- ADIM YÖNETİMİ ---
    const addNewStep = () => {
        const newStep = {
            id: `temp-${Date.now()}`,
            text: '',
            description: '',
            isNew: true
        };
        setFullTask(prev => {
            const currentSteps = prev?.steps || [];
            return { ...prev, steps: [...currentSteps, newStep] };
        });
    };

    const updateStep = (stepId, updates) => {
        setFullTask(prev => {
            if (!prev) return prev;
            const updatedSteps = prev.steps.map(s =>
                s.id === stepId ? { ...s, ...updates, isNew: false } : s
            );
            return { ...prev, steps: updatedSteps };
        });
    };

    const deleteStep = (stepId) => {
        setFullTask(prev => {
            if (!prev) return prev;
            const updatedSteps = prev.steps.filter(s => s.id !== stepId);
            return { ...prev, steps: updatedSteps };
        });
    };

    // --- STİL TANIMLARI ---
    const statusOptions = [
        { label: 'Bekliyor', bgClass: 'bg-orange-100', textClass: 'text-orange-700', borderClass: 'border-orange-200', dotClass: 'bg-orange-500' },
        { label: 'Aktif', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700', borderClass: 'border-emerald-200', dotClass: 'bg-emerald-500' },
        { label: 'Tamamlandı', bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderClass: 'border-blue-200', dotClass: 'bg-blue-500' },
        { label: 'Askıya Alındı', bgClass: 'bg-purple-100', textClass: 'text-purple-700', borderClass: 'border-purple-200', dotClass: 'bg-purple-500' },
    ];

    const currentStatusStyle = statusOptions.find(s => s.label === status) || statusOptions[1];

    const priorityOptions = [
        { label: 'Çok Yüksek', color: 'bg-red-500' },
        { label: 'Yüksek', color: 'bg-amber-400' },
        { label: 'Normal', color: 'bg-emerald-500' },
        { label: 'Düşük', color: 'bg-blue-500' },
    ];

    if (!task) return null;

    // =================================================================================================
    // 6. RENDER (GÖRÜNTÜLEME)
    // =================================================================================================

    return (
        <>
            {/* --- ÖZEL ONAY MODALI (KULLANICININ İSTEDİĞİ GÖRSEL TASARIM) --- */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative transform transition-all scale-100">
                        {/* İKON (Turuncu Daire ve Ünlem) */}
                        <div className="mx-auto mb-5 w-20 h-20 rounded-full border-[3px] border-orange-300 flex items-center justify-center bg-white">
                            <span className="text-orange-400 text-5xl font-normal">!</span>
                        </div>

                        {/* BAŞLIK */}
                        <h3 className="text-2xl font-bold text-gray-700 mb-3">{confirmModal.title}</h3>

                        {/* MESAJ */}
                        <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2 break-words">
                            {confirmModal.message}
                        </p>

                        {/* BUTONLAR */}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={confirmModal.onConfirm}
                                className={`px-6 py-2.5 rounded-lg text-white text-sm font-bold shadow-md transition-transform active:scale-95 ${confirmModal.type === 'delete'
                                        ? 'bg-[#dc3545] hover:bg-red-700'  // Silme ise Kırmızı
                                        : 'bg-[#0d6efd] hover:bg-blue-700' // Güncelleme ise Mavi
                                    }`}
                            >
                                Evet
                            </button>
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2.5 rounded-lg bg-[#6c757d] hover:bg-gray-600 text-white text-sm font-bold shadow-md transition-transform active:scale-95"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ANA GÖREV DETAY MODALI --- */}
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">

                {/* MODAL PENCERESİ */}
                <div className="bg-white w-full max-w-[1100px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">

                    {/* KAPATMA BUTONU */}
                    <button
                        onClick={handleCloseAttempt}
                        className="absolute top-4 right-4 z-50 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    {/* ORTA ALAN (SCROLL EDİLEBİLİR) */}
                    <div className="flex-1 flex overflow-hidden">

                        {/* SOL KOLON (ANA İÇERİK) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pr-10">

                            {/* 1. BAŞLIK VE HEADER BUTONLARI */}
                            <div className="flex justify-between items-start mb-6 gap-4">
                                {/* SOL TARAF: Başlık */}
                                <div className="flex-1 min-w-0"> {/* DEĞİŞİKLİK 1: min-w-0 eklendi */}
                                    {isEditingTask ? (
                                        <div className="bg-[#eff4f6] p-1.5 rounded-full animate-in fade-in zoom-in-95 duration-200 border border-transparent hover:border-blue-100 transition-colors">
                                            <input
                                                type="text"
                                                value={editedTitle}
                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                className="w-full bg-white border border-gray-200 text-gray-800 text-lg font-bold rounded-full py-2 px-4 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-400"
                                                placeholder="Görev başlığı..."
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-2 py-2 px-1 break-words"> {/* DEĞİŞİKLİK 2: break-words eklendi */}
                                            {displayTask.title}
                                        </h1>
                                    )}
                                </div>

                                {/* SAĞ TARAF: Aksiyon Butonları ve Durum */}
                                <div className="flex items-center gap-3 shrink-0 pt-1">
                                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                        {isEditingTask ? (
                                            <>
                                                <TooltipButton
                                                    onClick={handleCancelTaskEdit}
                                                    colorClass="text-red-500 hover:text-red-600 hover:bg-red-100"
                                                    tooltipText="Vazgeç"
                                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                                                />
                                                <TooltipButton
                                                    onClick={handleSaveTaskEdit}
                                                    colorClass="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-100"
                                                    tooltipText="Kaydet"
                                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <TooltipButton
                                                    onClick={() => setIsEditingTask(true)}
                                                    colorClass="text-gray-500 hover:text-blue-600 hover:bg-blue-100"
                                                    tooltipText="Görevi Düzenle"
                                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>}
                                                />
                                                <div className="w-px h-5 bg-gray-200 mx-0.5"></div>
                                                <TooltipButton
                                                    onClick={handleDeleteTrigger} // MODAL TETİKLEYİCİSİ
                                                    colorClass="text-gray-500 hover:text-red-600 hover:bg-red-100"
                                                    tooltipText="Görevi Sil"
                                                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>}
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="relative" ref={statusRef}>
                                        <button
                                            onClick={() => setIsStatusOpen(!isStatusOpen)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm shrink-0 border ${currentStatusStyle.bgClass} ${currentStatusStyle.textClass} ${currentStatusStyle.borderClass}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${currentStatusStyle.dotClass}`}></div>
                                            <span>{status}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 opacity-70"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                        </button>

                                        {isStatusOpen && (
                                            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                                {statusOptions.map((opt) => (
                                                    <button
                                                        key={opt.label}
                                                        onClick={() => { setStatus(opt.label); setIsStatusOpen(false); }}
                                                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${opt.dotClass}`}></div>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 2. AÇIKLAMA */}
                            <div className="mb-6">
                                {isEditingTask ? (
                                    <div className="bg-[#eff4f6] p-2 rounded-xl animate-in fade-in zoom-in-95 duration-200 border border-transparent hover:border-blue-100 transition-colors">
                                        <textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            className="w-full bg-white p-4 text-sm text-gray-700 border border-gray-200 shadow-sm outline-none resize-none min-h-[100px] rounded-2xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-400"
                                            placeholder="Görev açıklaması giriniz..."
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-sm leading-relaxed px-1">
                                        {displayTask.description || "Bu görev için herhangi bir açıklama girilmemiş."}
                                    </p>
                                )}
                            </div>

                            {/* --- DOSYALAR (GÖRÜNTÜLEME VE İNDİRME) --- */}
                            {fullTask?.files && fullTask.files.length > 0 && (
                                <div className="mb-6 grid grid-cols-3 gap-3">
                                    {fullTask.files.map((file) => (
                                        <div
                                            key={file.id}
                                            onClick={() => handleDownload(file.stored_name, file.file_name)}
                                            className="relative flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group w-full h-14"
                                            title="İndirmek için tıklayın"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // İndirme işlemini tetiklemesini önler
                                                    handleRemoveExistingFile(file.id);
                                                }}
                                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 z-10 scale-90 group-hover:scale-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <div className="shrink-0">
                                                <FileIcon fileName={file.file_name} />
                                            </div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <span className="text-xs font-bold text-gray-700 truncate block w-full" title={file.file_name}>
                                                    {file.file_name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 truncate">
                                                    {new Date(file.uploaded_at).toLocaleDateString('tr-TR')} • İndir
                                                </span>
                                            </div>
                                            {/* İndirme İkonu */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5M12 3v13.5" /></svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 3. ANA DOSYA YÜKLEME BUTONU */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />

                            <div className="flex flex-wrap gap-2 mb-8">
                                <ActionButton
                                    icon="cloud-upload"
                                    label="Dosya Yükle"
                                    onClick={() => fileInputRef.current.click()}
                                />
                            </div>

                            {/* 4. GÖREV ADIMLARI */}
                            <div className="mb-8">
                                <SectionTitle>Görev Adımları</SectionTitle>
                                <div className="mt-4 space-y-3">
                                    {fullTask?.steps && fullTask.steps.length > 0 ? (
                                        fullTask.steps.map((step, index) => (
                                            <TaskStepItem
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                onUpdate={updateStep}
                                                onDelete={deleteStep}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-3 w-full group cursor-text">
                                            <div className="w-5 h-5 flex items-center justify-center text-gray-300 font-bold text-xs">1.</div>
                                            <span className="text-sm text-gray-400 italic">Henüz adım eklenmedi.</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={addNewStep}
                                        className="flex items-center gap-3 w-full group cursor-pointer mt-2 opacity-50 hover:opacity-100 hover:bg-gray-50 rounded-lg p-1 transition-all"
                                    >
                                        <div className="w-5 h-5 flex items-center justify-center text-gray-300 group-hover:text-blue-500 font-bold text-xs transition-colors">+</div>
                                        <span className="text-sm text-gray-400 group-hover:text-blue-500 italic transition-colors">Yeni adım ekle...</span>
                                    </button>
                                </div>
                            </div>

                            {/* 5. AKTİVİTELER VE YORUMLAR (SCROLL & ORDER AYARLI) */}
                            <div className="mt-10 pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <SectionTitle noMargin>Aktiviteler</SectionTitle>
                                </div>

                                {/* LİSTE */}
                                {/* LİSTE */}
                                {/* Ref'i buradaki kapsayıcı div'e veriyoruz */}
                                <div
                                    ref={activitiesListRef}
                                    className="space-y-5 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex flex-col"
                                >
                                    {activities.length === 0 && (
                                        <p className="text-sm text-gray-400 italic">Henüz bir aktivite yok.</p>
                                    )}

                                    {activities.map((act) => {
                                        // Tarih formatla
                                        const dateStr = new Date(act.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

                                        if (act.activity_type === 'system') {
                                            // --- SİSTEM BİLDİRİMİ ---
                                            const parts = act.message.split(':');
                                            const mainMsg = parts[0];
                                            const highlight = parts[1] || '';

                                            return (
                                                <div key={act.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                                                    </div>
                                                    <div className="text-xs text-gray-500 pt-1.5 leading-relaxed">
                                                        <span className="text-gray-400">{dateStr} • </span>
                                                        <span className="font-bold text-gray-800">{act.first_name} {act.last_name}</span>
                                                        {' '}{mainMsg}
                                                        {highlight && <span className="font-bold text-emerald-600 ml-1">{highlight}</span>}
                                                    </div>
                                                </div>
                                            );
                                        } else {
                                            // --- KULLANICI YORUMU ---
                                            // User ID var mı kontrol et, yoksa varsayılan
                                            const colorStyle = getUserColor(act.user_id);

                                            return (
                                                <div key={act.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                                    {/* Rengi uygula: bg-purple-100 yerine colorStyle kullanıyoruz */}
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border border-white shadow-sm shrink-0 uppercase ${colorStyle.bg} ${colorStyle.text}`}>
                                                        {act.first_name?.[0]}{act.last_name?.[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-100 inline-block max-w-full">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-bold text-gray-800">{act.first_name} {act.last_name}</span>
                                                                <span className="text-[10px] text-gray-400">{dateStr}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{act.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>

                                {/* YORUM YAZMA ALANI */}
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 border border-white shadow-sm shrink-0">BEN</div>
                                    <div className="flex-1 border border-gray-200 rounded-xl bg-white shadow-sm focus-within:ring-1 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all overflow-hidden relative">
                                        <input
                                            type="text"
                                            placeholder="Yorum yazın..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                                            className="w-full px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none pr-20"
                                        />

                                        {/* Gönder Butonu */}
                                        <button
                                            onClick={handleSendComment}
                                            disabled={isSendingComment || !commentText.trim()}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-full transition-colors shadow-sm shadow-emerald-100"
                                        >
                                            {isSendingComment ? '...' : 'Gönder'}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* ================= SAĞ KOLON (SIDEBAR) ================= */}
                        <div className="w-80 bg-gray-50/50 border-l border-gray-100 px-6 pb-6 pt-14 overflow-y-auto flex flex-col gap-6">

                            {/* MÜŞTERİ ALANI */}
                            <SidebarSection title="Müşteri">
                                <div ref={customerRef} className="relative min-h-[28px]">
                                    {isEditingCustomer ? (
                                        <div className="animate-in fade-in duration-100">
                                            <input
                                                type="text"
                                                className="w-full text-sm font-medium text-gray-800 bg-white border border-blue-400 rounded px-2 py-1 outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all"
                                                value={fullTask?.customer_name || ''}
                                                onChange={(e) => setFullTask(prev => ({ ...prev, customer_name: e.target.value }))}
                                                autoFocus
                                                placeholder="Müşteri adı giriniz..."
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative group flex items-center justify-between w-full h-7 pr-7">
                                            <span className={`${displayTask.customer_name ? 'text-gray-800 font-medium' : 'text-gray-400 italic'} text-sm truncate cursor-default w-full select-none`}>
                                                {displayTask.customer_name || 'Müşteri ekle...'}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEditingCustomer(true);
                                                }}
                                                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer group/btn z-10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                </svg>

                                                <span className="absolute bottom-full right-0 mb-2 hidden group-hover/btn:block bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-50">
                                                    Düzenle
                                                    <span className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></span>
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </SidebarSection>

                            {/* Tarihler */}
                            <SidebarSection title="Başlangıç Tarihi - Bitiş Tarihi">
                                <div ref={dateRef} className="relative min-h-[40px]">
                                    {isEditingDate ? (
                                        <div className="flex flex-col gap-2 animate-in fade-in duration-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold mb-0.5">Başlangıç</span>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full text-xs border border-blue-400 rounded px-2 py-1.5 outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all bg-white text-gray-700"
                                                    value={formatDateForInput(fullTask?.start_date)}
                                                    onChange={(e) => setFullTask(prev => ({ ...prev, start_date: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold mb-0.5">Bitiş</span>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full text-xs border border-blue-400 rounded px-2 py-1.5 outline-none shadow-sm focus:ring-2 focus:ring-blue-100 transition-all bg-white text-gray-700"
                                                    value={formatDateForInput(fullTask?.end_date)}
                                                    onChange={(e) => setFullTask(prev => ({ ...prev, end_date: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setIsEditingDate(true)}
                                            className="group relative cursor-pointer hover:bg-gray-100 -mx-2 px-2 py-1 rounded-md transition-colors"
                                        >
                                            <div className="text-sm text-gray-700">
                                                <div className="flex items-center justify-between">
                                                    <p>{displayTask.start_date ? new Date(displayTask.start_date).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : <span className="text-gray-400 italic">Başlangıç seç...</span>}</p>
                                                </div>
                                                <div className="w-px h-3 bg-gray-300 ml-1 my-0.5"></div>
                                                <div className="flex items-center justify-between">
                                                    <p>{displayTask.end_date ? new Date(displayTask.end_date).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : <span className="text-gray-400 italic">Bitiş seç...</span>}</p>
                                                </div>
                                            </div>

                                            <div className="absolute top-1/2 right-2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-sm border border-gray-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </SidebarSection>

                            {/* Görevliler */}
                            <SidebarSection title="Görevliler">
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {/* Mevcut Görevliler */}
                                    {fullTask?.assignees && fullTask.assignees.length > 0 ? (
                                        fullTask.assignees.map(user => {
                                            const colorStyle = getUserColor(user.id);
                                            return (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleRemoveAssignee(user.id)}
                                                    className={`group relative w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border shadow-sm ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} hover:bg-red-500 hover:text-white hover:border-red-500`}
                                                >
                                                    <span className="text-[10px] font-bold group-hover:hidden">
                                                        {user.first_name[0]}{user.last_name[0]}
                                                    </span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 hidden group-hover:block">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
                                                        <div className="bg-black text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap relative">
                                                            {user.first_name} {user.last_name}
                                                            <div className="absolute top-full left-3.5 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-black"></div>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] border border-white shadow-sm">?</div>
                                    )}

                                    {/* Ekleme Butonu ve Dropdown */}
                                    <div className="relative" ref={assigneeRef}>
                                        <button
                                            onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                                            className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                                        </button>

                                        {isAssigneeOpen && (
                                            <div
                                                className="fixed w-56 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 z-[9999] animate-in fade-in zoom-in-95 origin-top-left"
                                                style={{ top: dropdownPos.top, left: dropdownPos.left }}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Kişi adı ara..."
                                                    autoFocus
                                                    value={assigneeSearch}
                                                    onChange={(e) => setAssigneeSearch(e.target.value)}
                                                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 mb-2"
                                                />
                                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
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
                                                                {fullTask?.assignees?.some(m => m.id === member.id) && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-500 ml-auto"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {teamMembers.length === 0 && <p className="text-[10px] text-gray-400 text-center py-2">Yükleniyor...</p>}
                                                    {teamMembers.length > 0 && teamMembers.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 && (
                                                        <p className="text-[10px] text-gray-400 text-center py-2">Sonuç yok.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </SidebarSection>

                            {/* ÖNCELİK */}
                            <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0 relative" ref={priorityRef}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-[11px] font-bold text-gray-900">Öncelik</h4>
                                </div>

                                <button
                                    onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white transition-all shadow-sm ${priorityColor || 'bg-emerald-500'}`}
                                >
                                    {priority}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                </button>

                                {isPriorityOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                                        {priorityOptions.map((opt) => (
                                            <button
                                                key={opt.label}
                                                onClick={() => { setPriority(opt.label); setPriorityColor(opt.color); setIsPriorityOpen(false); }}
                                                className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                            >
                                                <div className={`w-3 h-3 rounded-full ${opt.color}`}></div>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sahip */}
                            <SidebarSection title="Sahip - Oluşturma Tarihi">
                                <div className="text-sm text-gray-700">
                                    <p className="font-semibold">{fullTask?.ownerName || 'Yükleniyor...'}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{new Date(displayTask.created_at).toLocaleString('tr-TR')}</p>
                                </div>
                            </SidebarSection>

                        </div>
                    </div>

                    {/* ================= FOOTER ================= */}
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
                        <button onClick={handleCloseAttempt} className="flex items-center gap-1 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md text-xs font-bold transition-colors">
                            <span>İptal</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* GÜNCELLE BUTONU - MODAL TETİKLER */}
                        <button
                            onClick={handleUpdateTrigger}
                            className="flex items-center gap-1.5 px-5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-bold shadow-md shadow-blue-100 transition-all transform hover:scale-105"
                        >
                            <span>Güncelle</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};

// =================================================================================================
// 7. YARDIMCI BİLEŞENLER (TAM VE EKSİKSİZ)
// =================================================================================================

const TooltipButton = ({ onClick, icon, tooltipText, colorClass, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`group relative p-2 rounded-md transition-colors ${disabled ? 'text-gray-300 cursor-default' : colorClass}`}
        >
            {icon}
            {!disabled && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 animate-in fade-in duration-75">
                    {tooltipText}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></span>
                </span>
            )}
        </button>
    );
};

const TaskStepItem = ({ step, index, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(step.isNew || false);
    const [text, setText] = useState(step.text);
    const [description, setDescription] = useState(step.description || '');
    const [showDescription, setShowDescription] = useState(!!step.description);

    useEffect(() => {
        setText(step.text);
        setDescription(step.description || '');
        if (!isEditing) {
            setShowDescription(!!step.description);
        }
    }, [step, isEditing]);

    const handleSave = () => {
        if (text.trim()) {
            onUpdate(step.id, {
                text: text,
                description: showDescription ? description : ''
            });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        if (step.isNew) {
            onDelete(step.id);
        } else {
            setIsEditing(false);
            setText(step.text);
            setDescription(step.description || '');
            setShowDescription(!!step.description);
        }
    };

    const removeDescriptionBox = () => {
        setShowDescription(false);
        setDescription('');
    };

    const addDescriptionBox = () => {
        setShowDescription(true);
    };

    if (isEditing) {
        return (
            <div className="bg-[#eff4f6] p-2 rounded-lg animate-in fade-in zoom-in-95 duration-200 border border-transparent hover:border-blue-100 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-500 font-medium text-sm w-4 text-center">{index + 1}.</span>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-full py-1.5 px-3 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-400"
                            placeholder="Adım başlığını giriniz..."
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center gap-1 pl-1">
                        <TooltipButton
                            onClick={addDescriptionBox}
                            disabled={showDescription}
                            colorClass="text-orange-400 hover:text-orange-500 hover:bg-orange-50"
                            tooltipText="Açıklama Ekle"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>}
                        />
                        <div className="w-px h-5 bg-gray-300 mx-1"></div>
                        <TooltipButton
                            onClick={handleCancel}
                            colorClass="text-red-500 hover:text-red-600 hover:bg-red-50"
                            tooltipText="Vazgeç"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>}
                        />
                        <TooltipButton
                            onClick={handleSave}
                            colorClass="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                            tooltipText="Kaydet"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        />
                    </div>
                </div>
                {showDescription && (
                    <div className="pl-7 pr-1 animate-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-slate-500 font-bold text-xs">Açıklama</span>
                            <button
                                onClick={removeDescriptionBox}
                                className="text-red-400 hover:text-red-600 text-[10px] font-semibold flex items-center gap-0.5 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                Kaldır
                            </button>
                        </div>
                        <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-50 transition-all">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-transparent p-3 text-xs text-gray-600 placeholder-gray-400 outline-none resize-none min-h-[60px] rounded-xl"
                                placeholder="Açıklama giriniz..."
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="group relative">
            <div className="flex items-start gap-3 min-h-[30px] p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-sm font-bold text-gray-400 mt-0.5 min-w-[20px] text-right">
                    {index + 1}.
                </span>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-700">
                            {step.text}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white shadow-sm border border-gray-100 rounded-md px-1 py-0.5 absolute right-2 top-1">
                            <button onClick={() => setIsEditing(true)} className="group/edit relative p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/edit:block bg-black text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 animate-in fade-in duration-75">
                                    Düzenle
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></span>
                                </span>
                            </button>
                            <div className="w-[1px] h-3 bg-gray-200 mx-0.5"></div>
                            <button onClick={() => onDelete(step.id)} className="group/delete relative p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/delete:block bg-black text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 animate-in fade-in duration-75">
                                    Sil
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black"></span>
                                </span>
                            </button>
                        </div>
                    </div>
                    {step.description && (
                        <div className="mt-1 p-2 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-gray-600 leading-relaxed">
                            {step.description}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SidebarSection = ({ title, children, action }) => (
    <div className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-[11px] font-bold text-gray-900">{title}</h4>
            {action && <button className="text-[10px] font-bold text-gray-400 hover:text-blue-500 transition-colors">{action}</button>}
        </div>
        {children}
    </div>
);

const SectionTitle = ({ children, noMargin }) => (
    <h3 className={`text-sm font-bold text-gray-800 ${noMargin ? '' : 'mb-2'}`}>{children}</h3>
);

const ActionButton = ({ icon, label, onClick }) => {
    const getIcon = (name) => {
        if (name === 'cloud-upload') return <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.75 2 2 0 0119.5 19.5h-9.25V10.5" />;
        return null;
    };

    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-xs font-bold transition-colors"
        >
            {label}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                {getIcon(icon)}
            </svg>
        </button>
    );
};

const FileIcon = ({ fileName }) => {
    const ext = fileName.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
        return (
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#FEE2E2" />
                <path d="M14 2V9H20" fill="#EF4444" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#EF4444" fontFamily="sans-serif">PDF</text>
            </svg>
        );
    }
    return (
        <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#EBF5FF" />
            <path d="M14 2V9H20" fill="#3B82F6" />
        </svg>
    );
};

export default TaskDetailModal;
