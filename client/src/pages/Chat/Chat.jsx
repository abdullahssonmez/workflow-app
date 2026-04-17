import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import { getUserColor } from '../../utils/userColors';

// --- SOCKET BAĞLANTISI ---
// Backend adresinizin doğru olduğundan emin olun (örn: 5000 portu)
const socket = io.connect();

// --- İKONLAR (Heroicons) ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const DotsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" /><path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" /></svg>;
const ModalHeaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-600"><path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" /><path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" /></svg>;

const UserGroupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;

// Diğer ikonların yanına ekle:
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const FindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;

// Sohbet Altı İkonları
const SmileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500 cursor-pointer hover:text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-500 cursor-pointer hover:text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;
// Temizlenmiş, düzgün hizalanan ikon
const SendIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);
const ChevronDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const TaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>;
const WorkflowListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>;

const ChatIllustration = () => (
    <svg width="300" height="250" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6">
        <g fill="none" fillRule="evenodd">
            <circle cx="200" cy="150" r="100" fill="#FEF2F2" />
            <rect x="100" y="50" width="200" height="140" rx="4" fill="#E5E7EB" opacity="0.3" />
            <rect x="110" y="60" width="80" height="50" rx="2" fill="#fff" />
            <rect x="210" y="60" width="80" height="50" rx="2" fill="#fff" />
            <rect x="110" y="120" width="180" height="50" rx="2" fill="#fff" />
            <path d="M180,240 C180,240 170,200 190,170 C190,170 170,160 170,140 C170,120 190,110 200,110 C210,110 230,120 230,140 C230,160 210,170 210,170 C230,200 220,240 220,240 L180,240 Z" fill="#1F2937" />
            <circle cx="200" cy="130" r="15" fill="#FCA5A5" />
            <path d="M185,240 L170,280 L230,280 L215,240" fill="#374151" />
            <path d="M190,170 C190,170 160,200 160,190" stroke="#FCA5A5" strokeWidth="8" strokeLinecap="round" />
            <path d="M210,170 C210,170 240,190 230,180" stroke="#FCA5A5" strokeWidth="8" strokeLinecap="round" />
            <path d="M160,200 Q140,240 160,260 L240,260 Q260,240 240,200 Z" fill="#EF4444" opacity="0.2" />
            <path d="M170,220 L160,280" stroke="#EF4444" strokeWidth="4" />
            <path d="M230,220 L240,280" stroke="#EF4444" strokeWidth="4" />
            <path d="M240,100 L290,100 L290,130 L260,130 L250,140 L250,130 L240,130 Z" fill="#EF4444" />
            <rect x="250" y="110" width="30" height="4" rx="2" fill="#fff" opacity="0.8" />
            <rect x="250" y="118" width="20" height="4" rx="2" fill="#fff" opacity="0.8" />
            <path d="M120,80 L170,80 L170,110 L140,110 L130,120 L130,110 L120,110 Z" fill="#3B82F6" />
            <rect x="130" y="90" width="30" height="4" rx="2" fill="#fff" opacity="0.8" />
            <rect x="130" y="98" width="20" height="4" rx="2" fill="#fff" opacity="0.8" />
        </g>
    </svg>
);

// --- TARIH FORMATLAMA YARDIMCILARI ---
const isSameDay = (d1, d2) => {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

const formatDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) {
        return "Bugün";
    } else if (isSameDay(date, yesterday)) {
        return "Dün";
    } else {
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
};

const Chat = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation(); // <-- BU SATIRI EKLE

    // Mevcut state'lerin yanına ekle:
    const [selectedFiles, setSelectedFiles] = useState([]); // Seçilen dosyalar için
    const fileInputRef = useRef(null); // Dosya seçme penceresini açmak için

    // --- DATA STATES ---
    const [tasks, setTasks] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [groups, setGroups] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- SOHBET STATE'LERİ ---
    const [messages, setMessages] = useState([]); // Mesaj listesi
    const [currentMessage, setCurrentMessage] = useState(''); // Yazılan mesaj
    const [selectedChat, setSelectedChat] = useState(null); // Seçili kişi/görev
    const [currentUser, setCurrentUser] = useState(null); // Giriş yapan kullanıcı
    const messagesEndRef = useRef(null); // Otomatik kaydırma için

    // --- MENÜ VE ARAMA STATE'LERİ (YENİ) ---
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Sağ üst menü açık mı?
    const [isMsgSearchOpen, setIsMsgSearchOpen] = useState(false); // Mesaj arama çubuğu açık mı?
    const [msgSearchTerm, setMsgSearchTerm] = useState(''); // Aranacak kelime
    const menuRef = useRef(null); // Menü dışına tıklamayı algılamak için

    // --- UI STATES ---
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [expandedSections, setExpandedSections] = useState({
        groups: true,
        tasks: true,
        workflows: true,
        team: true
    });

    // --- GRUP ÜYESİ SEÇİM STATE'LERİ ---
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    const memberDropdownRef = useRef(null);

    // --- GRUP MODAL STATE'LERİ (BURAYI EKLEYİN) ---
    const [groupName, setGroupName] = useState('');
    const [groupErrors, setGroupErrors] = useState({});

    // --- BURAYI EKLEYİN: ONAY MODALI STATE'İ ---
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'delete'
    });

    // --- FETCH DATA GÜNCELLEME ---
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const storedUser = localStorage.getItem('user');
            if (storedUser) setCurrentUser(JSON.parse(storedUser));

            // ... Tasks, Workflows, Team fetch kodları aynı kalsın ...

            // YENİ: GRUPLARI ÇEK
            const groupsRes = await fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } });
            if (groupsRes.ok) setGroups(await groupsRes.json());

            // Diğer fetch işlemleri...
            const tasksRes = await fetch('/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
            if (tasksRes.ok) setTasks(await tasksRes.json());

            const workflowsRes = await fetch('/api/workflows', { headers: { 'Authorization': `Bearer ${token}` } });
            if (workflowsRes.ok) setWorkflows(await workflowsRes.json());

            const teamRes = await fetch('/api/team', { headers: { 'Authorization': `Bearer ${token}` } });
            if (teamRes.ok) setTeamMembers(await teamRes.json());

        } catch (error) { console.error("Hata:", error); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- YENİ: BİLDİRİMDEN GELEN SOHBETİ OTOMATİK AÇ ---
    useEffect(() => {
        // 1. Veriler yüklenmiş mi ve URL state'inde hedef var mı?
        if (!loading && location.state?.targetChat) {
            const { type, id } = location.state.targetChat;

            // 2. Eğer zaten bu sohbet açıksa işlem yapma (Burada da == kullanıyoruz)
            if (selectedChat?.id == id && selectedChat?.type === type) return;

            let foundItem = null;

            // 3. İlgili listeden öğeyi bul (DİKKAT: '===' yerine '==' kullanıyoruz)
            if (type === 'group') {
                foundItem = groups.find(g => g.id == id); // <-- ==
                if (foundItem) setExpandedSections(prev => ({ ...prev, groups: true }));
            }
            else if (type === 'task') {
                foundItem = tasks.find(t => t.id == id); // <-- ==
                if (foundItem) setExpandedSections(prev => ({ ...prev, tasks: true }));
            }
            else if (type === 'workflow') {
                foundItem = workflows.find(w => w.id == id); // <-- ==
                if (foundItem) setExpandedSections(prev => ({ ...prev, workflows: true }));
            }
            else if (type === 'team') {
                foundItem = teamMembers.find(m => m.id == id); // <-- ==
                if (foundItem) setExpandedSections(prev => ({ ...prev, team: true }));
            }

            // 4. Öğeyi bulduysak sohbeti başlat
            if (foundItem) {
                handleChatSelect(foundItem, type);

                // State'i temizle
                window.history.replaceState({}, document.title);
            }
        }
    }, [loading, groups, tasks, workflows, teamMembers, location.state]);

    // --- SOCKET DİNLEYİCİSİ (GÜNCELLENDİ) ---
    useEffect(() => {
        const handleReceiveMessage = (data) => {
            // EĞER mesajı gönderen BENSEM, ekrana tekrar basma (Zaten sendMessage içinde bastık)
            if (data.sender_id === currentUser?.id) return;

            setMessages((list) => [...list, data]);
        };

        socket.on('receive_message', handleReceiveMessage);

        // Temizlik
        return () => {
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [currentUser]); // currentUser değişirse listener güncellensin

    // --- OTOMATİK SCROLL ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- CLICK OUTSIDE (Grup Üyesi Seçimi İçin) ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target)) {
                setIsMemberDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Menü dışına tıklayınca kapat
    useEffect(() => {
        function handleClickOutsideMenu(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutsideMenu);
        return () => document.removeEventListener("mousedown", handleClickOutsideMenu);
    }, []);

    // --- HANDLERS (Sohbet Seçimi ve Geçmiş Yükleme) ---
    const handleChatSelect = async (item, type) => {
        setSelectedChat({ ...item, type });
        setMessages([]); // Ekranı temizle

        // Oda İsmi Oluşturma
        let roomName = '';
        if (type === 'task') roomName = `task_${item.id}`;
        else if (type === 'workflow') roomName = `workflow_${item.id}`;
        // handleChatSelect içinde workflow satırının altına:
        else if (type === 'group') roomName = `group_${item.id}`;
        else if (type === 'team') {
            // Özel mesaj için benzersiz oda ID'si (örn: dm_3_5)
            const myId = currentUser?.id;
            const otherId = item.id;
            const minId = Math.min(myId, otherId);
            const maxId = Math.max(myId, otherId);
            roomName = `dm_${minId}_${maxId}`;
        }

        // Odaya Katıl
        socket.emit('join_room', roomName);

        // Geçmiş Mesajları Çek (API)
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/messages/${type}/${item.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const history = await res.json();
                setMessages(history);
            }
        } catch (err) { console.error("Geçmiş alınamadı", err); }
    };

    // --- DOSYA İŞLEMLERİ ---
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
        }
        e.target.value = ''; // Input'u sıfırla ki aynı dosyayı tekrar seçebilsin
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadChatFiles = async () => {
        if (selectedFiles.length === 0) return null;
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/chat/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) return await res.json();
        } catch (error) {
            console.error("Dosya yükleme hatası:", error);
            toast.error("Dosyalar yüklenemedi.");
        }
        return null;
    };

    const sendMessage = async () => {
        // Hem mesaj boşsa hem de dosya yoksa gönderme
        if (!currentUser || !selectedChat || (!currentMessage.trim() && selectedFiles.length === 0)) return;

        let roomName = '';
        if (selectedChat.type === 'task') roomName = `task_${selectedChat.id}`;
        else if (selectedChat.type === 'workflow') roomName = `workflow_${selectedChat.id}`;
        else if (selectedChat.type === 'group') roomName = `group_${selectedChat.id}`;
        else if (selectedChat.type === 'team') {
            const minId = Math.min(currentUser.id, selectedChat.id);
            const maxId = Math.max(currentUser.id, selectedChat.id);
            roomName = `dm_${minId}_${maxId}`;
        }

        // 1. Önce Dosyaları Yükle (Varsa)
        let uploadedFilesData = null;
        if (selectedFiles.length > 0) {
            uploadedFilesData = await uploadChatFiles();
            if (!uploadedFilesData && selectedFiles.length > 0) return; // Hata varsa dur
        }

        // 2. Mesaj Verisini Hazırla
        const messageData = {
            sender_id: currentUser.id,
            context_type: selectedChat.type,
            context_id: selectedChat.id,
            message: currentMessage, // Veritabanı için
            text: currentMessage,    // Arayüz için
            file_info: uploadedFilesData, // Dosya bilgileri
            room: roomName,
            name: `${currentUser.first_name} ${currentUser.last_name}`,

            time: new Date().toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date().toISOString(), // Tarih ayrımı için
            avatar: currentUser.first_name ? currentUser.first_name[0] : '?'
        };

        try {
            // Ekrana hemen bas (Optimistic UI)
            setMessages((prev) => [...prev, messageData]);
            setCurrentMessage('');
            setSelectedFiles([]); // Seçimleri temizle

            socket.emit('join_room', roomName);
            await socket.emit('send_message', messageData);
        } catch (e) {
            toast.error("Mesaj gönderilemedi.");
        }
    };

    // --- YENİ: MODAL İLE MESAJ GEÇMİŞİNİ TEMİZLEME ---
    const handleClearHistoryTrigger = () => {
        setIsMenuOpen(false); // Menüyü kapat
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Sohbeti Temizle',
            message: 'Bu sohbetin tüm geçmişi silinecek. Emin misiniz? Bu işlem geri alınamaz.',
            onConfirm: executeClearHistory // Onaylanırsa çalışacak fonksiyon
        });
    };

    const executeClearHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/messages/${selectedChat.type}/${selectedChat.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setMessages([]); // Ekranı temizle
                setConfirmModal(prev => ({ ...prev, isOpen: false })); // Modalı kapat
            } else {
                toast.error("Silme işlemi başarısız.");
            }
        } catch (err) { console.error(err); }
    };

    // --- YENİ: MODAL İLE GRUBU SİLME ---
    const handleDeleteGroupTrigger = () => {
        setIsMenuOpen(false); // Menüyü kapat
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Grubu Sil',
            message: `"${selectedChat.name}" grubu ve tüm mesajları kalıcı olarak silinecek. Onaylıyor musunuz?`,
            onConfirm: executeDeleteGroup // Onaylanırsa çalışacak fonksiyon
        });
    };

    const executeDeleteGroup = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/groups/${selectedChat.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setGroups(prev => prev.filter(g => g.id !== selectedChat.id));
                setSelectedChat(null); // Sohbeti kapat
                setConfirmModal(prev => ({ ...prev, isOpen: false })); // Modalı kapat
            } else {
                toast.error("Grup silinemedi.");
            }
        } catch (err) { console.error(err); }
    };

    // --- HANDLERS (Grup Üyesi Seçimi) ---
    const handleSelectMember = (member) => {
        if (!selectedMembers.find(m => m.id === member.id)) {
            setSelectedMembers([...selectedMembers, member]);

            // EĞER "Üye seçmelisiniz" HATASI VARSA TEMİZLE (YENİ EKLENDİ)
            if (groupErrors.members) {
                setGroupErrors(prev => ({ ...prev, members: null }));
            }
        }
        setIsMemberDropdownOpen(false);
        setMemberSearchTerm('');
    };

    const handleRemoveMember = (id) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== id));
    };

    // --- GRUP OLUŞTURMA FONKSİYONU (GÜNCELLENDİ) ---
    const handleCreateGroup = async () => {
        // 1. Validasyon Kontrolü
        const newErrors = {};

        if (!groupName.trim()) {
            newErrors.name = "Grup adı boş bırakılamaz.";
        }

        if (selectedMembers.length === 0) {
            newErrors.members = "En az bir kişi seçmelisiniz.";
        }

        // Hata varsa state'i güncelle ve durdur
        if (Object.keys(newErrors).length > 0) {
            setGroupErrors(newErrors);
            return;
        }

        // 2. Backend İsteği
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: groupName,
                    memberIds: selectedMembers.map(m => m.id)
                })
            });

            if (res.ok) {
                const newGroup = await res.json();
                setGroups(prev => [newGroup, ...prev]);

                // Başarılı olunca modalı kapat ve state'leri temizle
                setIsModalOpen(false);
                setSelectedMembers([]);
                setGroupName('');
                setGroupErrors({});

                handleChatSelect(newGroup, 'group');
            } else {
                toast.error("Grup oluşturulurken hata oluştu.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Bağlantı hatası.");
        }
    };

    // --- HELPER FUNCTIONS ---
    const toggleSection = (sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const handleSearchOpen = () => {
        setIsSearchOpen(true);
        // groups: true ekleyerek arama açıldığında grupların da açık kalmasını sağlıyoruz
        setExpandedSections({
            groups: true,   // <--- EKLENMESİ GEREKEN SATIR
            tasks: true,
            workflows: true,
            team: true
        });
    };

    const handleSearchClose = () => {
        setIsSearchOpen(false);
        setSearchTerm('');
    };

    // --- FİLTRELEME MANTIĞI ---
    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredWorkflows = workflows.filter(w =>
        w.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTeam = teamMembers.filter(m =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // filteredTeam'in altına ekle:
    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /// --- YENİ EKLENEN FONKSİYON (Tam burada durmalı) ---
    const getAssigneeNames = (item) => {
        // Eğer ekip sohbetiyse (DM), kişinin kendi rolünü döndür
        if (item.type === 'team') return item.role;

        // Görev veya İş Akışı ise atananları kontrol et
        if (!item.assignees || item.assignees.length === 0) {
            return 'Henüz kimse atanmamış';
        }

        // İsimleri birleştir (Örn: Ahmet Yılmaz, Ayşe Demir)
        return item.assignees.map(u => `${u.first_name} ${u.last_name}`).join(', ');
    };

    return (
        <div className="flex h-full w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans relative">
            {/* --- YENİ EKLENEN: ÖZEL ONAY MODALI --- */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative transform transition-all scale-100 border border-gray-100">
                        {/* İKON (Turuncu Daire ve Ünlem) */}
                        <div className="mx-auto mb-5 w-20 h-20 rounded-full border-[3px] border-orange-300 flex items-center justify-center bg-white shadow-sm">
                            <span className="text-orange-400 text-5xl font-normal">!</span>
                        </div>

                        {/* BAŞLIK */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">{confirmModal.title}</h3>

                        {/* MESAJ */}
                        <p className="text-gray-500 text-sm leading-relaxed mb-8 px-2 break-words">
                            {confirmModal.message}
                        </p>

                        {/* BUTONLAR */}
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={confirmModal.onConfirm}
                                className="px-6 py-2.5 rounded-lg bg-[#dc3545] hover:bg-red-700 text-white text-sm font-bold shadow-md transition-transform active:scale-95"
                            >
                                Evet, Sil
                            </button>
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-6 py-2.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-sm font-bold shadow-md transition-transform active:scale-95"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- SOL MENÜ (LISTE) - DARALTILDI VE MİNİMALİZE EDİLDİ --- */}
            <aside className="w-64 border-r border-gray-100 flex flex-col bg-white transition-all duration-300">

                {/* Başlık ve Araçlar */}
                <div className="h-14 flex items-center justify-between px-3 border-b border-gray-50 shrink-0">
                    {isSearchOpen ? (
                        <div className="flex items-center w-full gap-2 animate-in fade-in duration-200">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-100 rounded-full px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-300 transition-all"
                                />
                            </div>
                            <button onClick={handleSearchClose} className="text-gray-400 hover:text-gray-600 text-[10px] font-bold px-1">
                                İptal
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-gray-700 font-semibold text-sm">Mesajlar</h2>
                            {/* Sadece Arama Butonu Kaldı, 3 Nokta Silindi */}
                            <div>
                                <button onClick={handleSearchOpen} className="hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                                    <SearchIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Mesaj Listesi */}
                <div className="flex-1 overflow-y-auto custom-scrollbar select-none">
                    {loading ? (
                        <div className="p-4 text-center text-[10px] text-gray-400">Yükleniyor...</div>
                    ) : (
                        <>
                            {/* GRUPLAR */}
                            <div>
                                <div onClick={() => toggleSection('groups')} className="bg-gray-50/50 px-3 py-1.5 text-[9px] font-bold text-gray-400 border-b border-gray-50 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span>GRUPLAR ({filteredGroups.length})</span>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${expandedSections.groups ? 'rotate-0' : '-rotate-90'}`} />
                                </div>
                                {expandedSections.groups && (
                                    filteredGroups.map((group) => (
                                        <div key={`group-${group.id}`} onClick={() => handleChatSelect(group, 'group')} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors ${selectedChat?.id === group.id && selectedChat?.type === 'group' ? 'bg-red-50' : 'hover:bg-orange-50'}`}>
                                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shrink-0 text-white shadow-sm">
                                                <UserGroupIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-gray-700 truncate">{group.name}</h4>
                                                <p className="text-[9px] text-gray-400 truncate mt-0.5">{getAssigneeNames(group)}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* GÖREVLER */}
                            <div>
                                <div onClick={() => toggleSection('tasks')} className="bg-gray-50/50 px-3 py-1.5 text-[9px] font-bold text-gray-400 border-b border-gray-50 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span>GÖREVLER ({filteredTasks.length})</span>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${expandedSections.tasks ? 'rotate-0' : '-rotate-90'}`} />
                                </div>
                                {expandedSections.tasks && (
                                    filteredTasks.map((task) => (
                                        <div key={`task-${task.id}`} onClick={() => handleChatSelect(task, 'task')} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors ${selectedChat?.id === task.id ? 'bg-red-50' : 'hover:bg-blue-50'}`}>
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-white shadow-sm">
                                                <TaskIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-gray-700 truncate">{task.title}</h4>
                                                <p className="text-[9px] text-gray-400 truncate mt-0.5">{task.customer_name ? `${task.customer_name} • ` : ''}{task.status}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* İŞ AKIŞLARI */}
                            <div>
                                <div onClick={() => toggleSection('workflows')} className="bg-gray-50/50 px-3 py-1.5 text-[9px] font-bold text-gray-400 border-b border-gray-50 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span>İŞ AKIŞLARI ({filteredWorkflows.length})</span>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${expandedSections.workflows ? 'rotate-0' : '-rotate-90'}`} />
                                </div>
                                {expandedSections.workflows && (
                                    filteredWorkflows.map((wf) => (
                                        <div key={`wf-${wf.id}`} onClick={() => handleChatSelect(wf, 'workflow')} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors ${selectedChat?.id === wf.id ? 'bg-red-50' : 'hover:bg-indigo-50'}`}>
                                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-white shadow-sm">
                                                <WorkflowListIcon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-gray-700 truncate">{wf.title}</h4>
                                                <p className="text-[9px] text-gray-400 truncate mt-0.5">{wf.stages?.length || 0} Aşama</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* EKİP */}
                            <div>
                                <div onClick={() => toggleSection('team')} className="bg-gray-50/50 px-3 py-1.5 text-[9px] font-bold text-gray-400 border-b border-gray-50 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                    <span>EKİP ({filteredTeam.length})</span>
                                    <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${expandedSections.team ? 'rotate-0' : '-rotate-90'}`} />
                                </div>
                                {expandedSections.team && (
                                    filteredTeam.map((member) => {
                                        const colorStyle = getUserColor(member.id);
                                        return (
                                            <div key={`team-${member.id}`} onClick={() => handleChatSelect(member, 'team')} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer border-b border-gray-50 transition-colors ${selectedChat?.id === member.id ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border shadow-sm ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
                                                    {member.first_name[0]}{member.last_name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs font-bold text-gray-700 truncate">{member.first_name} {member.last_name}</h4>
                                                    <p className="text-[9px] text-gray-400 truncate mt-0.5">{member.role}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Alt Buton Minimal */}
                <div className="p-3 border-t border-gray-50 shrink-0">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full bg-[#D32F2F] hover:bg-red-700 text-white py-2 rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        <span>Yeni Grup</span>
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </aside>

            {/* --- SAĞ İÇERİK (SOHBET EKRANI VEYA EMPTY STATE) --- */}
            <main className="flex-1 flex flex-col bg-white relative">
                {!selectedChat ? (
                    // --- EMPTY STATE (HİÇBİR ŞEY SEÇİLİ DEĞİLSE) ---
                    <div className="flex-1 flex flex-col items-center justify-center p-10">
                        <div className="max-w-md text-center">
                            <ChatIllustration />
                            <h2 className="text-xl font-bold text-gray-800 mb-3">Yazışmalar</h2>
                            <p className="text-xs text-gray-500 mb-8 leading-relaxed">
                                Soldaki listeden bir <strong>Görev</strong>, <strong>İş Akışı</strong> veya <strong>Ekip Üyesi</strong> seçerek ilgili sohbeti başlatabilirsiniz.
                            </p>
                        </div>
                    </div>
                ) : (
                    // --- SOHBET ARAYÜZÜ (SEÇİM YAPILINCA) ---
                    <div className="flex flex-col h-full">

                        {/* 1. SOHBET BAŞLIĞI (GÜNCELLENMİŞ MENÜLÜ HALİ) */}
                        <header className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white shrink-0 relative z-20">

                            {/* ARAMA MODU AÇIKSA */}
                            {isMsgSearchOpen ? (
                                <div className="flex items-center w-full gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <SearchIcon />
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Mesajlarda ara..."
                                        value={msgSearchTerm}
                                        onChange={(e) => setMsgSearchTerm(e.target.value)}
                                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                                    />
                                    <button
                                        onClick={() => { setIsMsgSearchOpen(false); setMsgSearchTerm(''); }}
                                        className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 rounded hover:bg-gray-100"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            ) : (
                                /* NORMAL MOD */
                                <>
                                    <div className="flex items-center gap-3">
                                        {/* Avatar Kısmı */}
                                        {selectedChat.type === 'group' ? (
                                            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                                                <UserGroupIcon />
                                            </div>
                                        ) : selectedChat.type === 'team' ? (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border shadow-sm ${getUserColor(selectedChat.id).bg} ${getUserColor(selectedChat.id).text} ${getUserColor(selectedChat.id).border}`}>
                                                {selectedChat.first_name[0]}{selectedChat.last_name[0]}
                                            </div>
                                        ) : selectedChat.type === 'task' ? (
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                                                <TaskIcon />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
                                                <WorkflowListIcon />
                                            </div>
                                        )}

                                        {/* İsim ve Bilgi */}
                                        <div className="overflow-hidden">
                                            <h3 className="text-sm font-bold text-gray-800 truncate max-w-[300px]">
                                                {selectedChat.type === 'team'
                                                    ? `${selectedChat.first_name} ${selectedChat.last_name}`
                                                    : selectedChat.type === 'group'
                                                        ? selectedChat.name
                                                        : selectedChat.title}
                                            </h3>
                                            <p className="text-[10px] text-gray-500 truncate max-w-[400px]">
                                                {getAssigneeNames(selectedChat)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* SAĞ TARAFTAKİ MENÜ BUTONU */}
                                    <div className="relative" ref={menuRef}>
                                        <button
                                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                                            className={`text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-gray-100 text-gray-600' : ''}`}
                                        >
                                            <DotsIcon />
                                        </button>

                                        {/* --- AÇILIR MENÜ (DROPDOWN) --- */}
                                        {isMenuOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right z-50">
                                                <div className="py-1">
                                                    {/* 1. Bul */}
                                                    <button
                                                        onClick={() => { setIsMsgSearchOpen(true); setIsMenuOpen(false); }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <FindIcon />
                                                        Mesajlarda Ara
                                                    </button>

                                                    <div className="h-px bg-gray-50 my-1"></div>

                                                    {/* 2. Sohbeti Temizle (GÜNCELLENDİ) */}
                                                    <button
                                                        onClick={handleClearHistoryTrigger}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <TrashIcon />
                                                        Mesajları Sil
                                                    </button>

                                                    {/* 3. Grubu Sil (GÜNCELLENDİ) */}
                                                    {selectedChat.type === 'group' && (
                                                        <button
                                                            onClick={handleDeleteGroupTrigger}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-50"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
                                                            Grubu Sil
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </header>

                        {/* 2. MESAJ ALANI */}
                        <div className="flex-1 bg-gray-50/50 p-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                {messages
                                    .filter(msg => {
                                        if (!msgSearchTerm) return true;
                                        return (msg.text || "").toLowerCase().includes(msgSearchTerm.toLowerCase());
                                    })
                                    .map((msg, idx, arr) => {
                                        const isMe = msg.sender_id === currentUser?.id;

                                        // --- TARIH AYRIMI MANTIĞI ---
                                        let showDateSeparator = false;
                                        if (msg.timestamp) {
                                            if (idx === 0) {
                                                showDateSeparator = true;
                                            } else {
                                                const prevMsg = arr[idx - 1];
                                                if (prevMsg.timestamp && !isSameDay(msg.timestamp, prevMsg.timestamp)) {
                                                    showDateSeparator = true;
                                                }
                                            }
                                        }

                                        // file_info verisini güvenli bir şekilde diziye çevir
                                        let files = [];
                                        if (msg.file_info) {
                                            if (Array.isArray(msg.file_info)) {
                                                files = msg.file_info;
                                            } else if (typeof msg.file_info === 'string') {
                                                try {
                                                    files = JSON.parse(msg.file_info);
                                                } catch (e) {
                                                    console.error("Dosya verisi işlenemedi", e);
                                                }
                                            }
                                        }


                                        return (
                                            <React.Fragment key={idx}>
                                                {/* TARİH AYIRACI */}
                                                {showDateSeparator && (
                                                    <div className="flex justify-center my-4">
                                                        <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-gray-200 uppercase tracking-wide">
                                                            {formatDateLabel(msg.timestamp)}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>

                                                    {/* AVATAR */}
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border shadow-sm ${isMe ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>
                                                        {msg.avatar || (msg.name ? msg.name[0] : '?')}
                                                    </div>

                                                    {/* MESAJ İÇERİĞİ KUTUSU */}
                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <span className="text-[10px] text-gray-500 mb-1 px-1">{isMe ? 'Ben' : msg.name}</span>

                                                        {/* 1. DOSYALAR (Varsa Kart Olarak Göster) */}
                                                        {files.length > 0 && (
                                                            <div className={`flex flex-col gap-2 mb-2 ${isMe ? 'items-end' : 'items-start'}`}>
                                                                {files.map((file, fIdx) => (
                                                                    <FileMessageCard key={fIdx} file={file} isMe={isMe} />
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* 2. METİN (Varsa Balon Olarak Göster) */}
                                                        {msg.text && msg.text.trim() !== "" && (
                                                            <div className={`py-2 px-4 rounded-2xl shadow-sm text-sm max-w-md break-words border ${isMe ? 'bg-[#374151] text-white rounded-tr-none border-transparent' : 'bg-white text-gray-800 rounded-tl-none border-gray-200'}`}>
                                                                {msg.text}
                                                            </div>
                                                        )}

                                                        {/* SAAT */}
                                                        <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                }
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* 3. INPUT ALANI - DOSYA DESTEKLİ */}
                        <div className="bg-white border-t border-gray-100">

                            {/* --- DOSYA ÖNİZLEME ŞERİDİ --- */}
                            {selectedFiles.length > 0 && (
                                <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto custom-scrollbar animate-in slide-in-from-bottom-2">
                                    {selectedFiles.map((file, index) => (
                                        <div key={index} className="relative group shrink-0 w-16 h-16 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-1">
                                            {/* Silme Butonu */}
                                            <button
                                                onClick={() => removeSelectedFile(index)}
                                                className="absolute -top-1.5 -right-1.5 bg-gray-500 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors shadow-sm z-10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                                            </button>

                                            {/* Dosya İkonu */}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-500 mb-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                            <span className="text-[8px] text-gray-600 truncate w-full text-center px-1">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="px-4 py-3">
                                <div className="flex items-end gap-2 bg-gray-50 p-1 rounded-[20px] border border-gray-200 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-sm">

                                    {/* GİZLİ INPUT */}
                                    <input
                                        type="file"
                                        multiple
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />

                                    {/* SOL BUTON (ARTI - DOSYA EKLE) */}
                                    <div className="flex items-center gap-1 pl-1 pb-1.5">
                                        <button
                                            onClick={() => fileInputRef.current.click()}
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-full"
                                            title="Dosya Ekle"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* TEXT INPUT */}
                                    <textarea
                                        placeholder="Bir mesaj yazın..."
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                        className="flex-1 bg-transparent max-h-24 min-h-[36px] py-2 px-1 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none resize-none custom-scrollbar leading-snug"
                                        rows={1}
                                        style={{ height: 'auto' }}
                                    />

                                    {/* GÖNDER BUTONU */}
                                    <button
                                        onClick={sendMessage}
                                        disabled={!currentMessage.trim() && selectedFiles.length === 0}
                                        className={`
                                    group flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-300 ease-out mb-1 mr-1
                                    ${(currentMessage.trim() || selectedFiles.length > 0)
                                                ? 'bg-gradient-to-tr from-[#D32F2F] to-red-500 text-white hover:scale-105 hover:shadow-red-500/30 cursor-pointer'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                                `}
                                    >
                                        <SendIcon className={`w-4 h-4 ml-0.5 transition-transform duration-300 ${currentMessage.trim() ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </main>

            {/* --- YENİ YAZIŞMA GRUBU MODALI --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">

                    <div className="bg-white rounded-[20px] shadow-2xl w-[450px] p-6 relative flex flex-col items-center border border-gray-100 animate-in zoom-in-95 duration-200">

                        {/* Kapat Butonu */}
                        <button
                            onClick={() => {
                                setIsModalOpen(false);
                                setGroupErrors({});
                                setGroupName('');
                                setSelectedMembers([]);
                            }}
                            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <CloseIcon />
                        </button>

                        {/* Başlık ve İkon */}
                        <div className="flex flex-col items-center mt-2 mb-6">
                            <div className="mb-1 text-gray-700 font-bold flex items-center gap-2">
                                <ModalHeaderIcon />
                                <h3 className="text-base">Yazışma Grubu</h3>
                            </div>
                        </div>

                        {/* İçerik */}
                        <div className="w-full space-y-4">
                            {/* --- Grup Adı (GÜNCELLENDİ) --- */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 ml-1">
                                    Grup Adı <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Grup adını girin.."
                                    value={groupName}
                                    onChange={(e) => {
                                        setGroupName(e.target.value);
                                        if (groupErrors.name) setGroupErrors({ ...groupErrors, name: null });
                                    }}
                                    className={`w-full px-4 py-2.5 rounded-full border text-sm focus:outline-none transition-all placeholder:text-gray-400 
                          ${groupErrors.name
                                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400'
                                        }`}
                                />
                                {groupErrors.name && (
                                    <p className="text-red-500 text-[10px] ml-2 font-medium animate-in slide-in-from-top-1">
                                        {groupErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* --- Grup Üyeleri (GÜNCELLENDİ) --- */}
                            <div className="space-y-1 relative">
                                <label className="text-xs font-bold text-gray-700 ml-1">
                                    Grup Üyeleri <span className="text-red-500">*</span>
                                </label>

                                {/* Üye Seçim Kutusu Çerçevesi */}
                                <div className={`flex items-center gap-1 flex-wrap min-h-[40px] p-2 rounded-xl border transition-all 
                          ${groupErrors.members ? 'border-red-500 bg-red-50' : 'border-transparent'}`}>

                                    {/* Seçili Üyeler */}
                                    {selectedMembers.map(user => (
                                        <SelectedAvatar
                                            key={user.id}
                                            user={user}
                                            onRemove={() => handleRemoveMember(user.id)}
                                        />
                                    ))}

                                    {/* Ekle Butonu ve Dropdown */}
                                    <div ref={memberDropdownRef} className="relative">
                                        <button onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}>
                                            <AddButton />
                                        </button>

                                        {/* --- DROPDOWN MENÜ --- */}
                                        {isMemberDropdownOpen && (
                                            <div
                                                className="absolute left-0 top-full mt-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 p-2 z-[9999] animate-in fade-in zoom-in-95 origin-top-left"
                                            >
                                                {/* Arama Kutusu */}
                                                <input
                                                    type="text"
                                                    placeholder="Kişi adı girin.."
                                                    autoFocus
                                                    value={memberSearchTerm}
                                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 mb-2"
                                                />

                                                {/* Üye Listesi */}
                                                <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                                    {teamMembers.filter(m => `${m.first_name} ${m.last_name}`.toLowerCase().includes(memberSearchTerm.toLowerCase())).map(member => {
                                                        const colorStyle = getUserColor(member.id);
                                                        return (
                                                            <div
                                                                key={member.id}
                                                                onClick={() => handleSelectMember(member)}
                                                                className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer group"
                                                            >
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${colorStyle.bg} ${colorStyle.text}`}>
                                                                    {member.first_name[0]}{member.last_name[0]}
                                                                </div>
                                                                <span className="text-xs text-gray-700 group-hover:text-blue-600 font-medium truncate">
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

                                {/* Üye Seçimi Hata Mesajı */}
                                {groupErrors.members && (
                                    <p className="text-red-500 text-[10px] ml-2 font-medium animate-in slide-in-from-top-1">
                                        {groupErrors.members}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="w-full flex items-center justify-between mt-8 pt-2">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setGroupErrors({});
                                    setGroupName('');
                                    setSelectedMembers([]);
                                }}
                                className="px-6 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                                Kapat
                                <span className="text-[10px] ml-1">✕</span>
                            </button>

                            <button onClick={handleCreateGroup} className="px-6 py-2 rounded-full bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
                                Kaydet
                                <SaveIcon />
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

// --- YARDIMCI COMPONENTLER ---

const SelectedAvatar = ({ user, onRemove }) => {
    const colorStyle = getUserColor(user.id);

    return (
        <div className="relative group cursor-pointer" onClick={onRemove}>
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500`}>
                <span className="group-hover:hidden">{user.first_name[0]}{user.last_name[0]}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 hidden group-hover:block">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-[100] min-w-max">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg relative">
                    {user.first_name} {user.last_name}
                    <div className="absolute top-full left-3 transform -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        </div>
    );
};

const AddButton = () => (
    <div className="w-8 h-8 rounded-full bg-[#D32F2F] text-white flex items-center justify-center hover:bg-red-700 shadow-sm transition-all hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
    </div>
);

export default Chat;

// --- DOSYA TÜRÜNE GÖRE İKON ---
const FileIcon = ({ fileName }) => {
    const ext = fileName?.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
        return (
            <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#FEE2E2" />
                <path d="M14 2V9H20" fill="#EF4444" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#EF4444" fontFamily="sans-serif">PDF</text>
            </svg>
        );
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return (
            <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#DCFCE7" />
                <path d="M14 2V9H20" fill="#22C55E" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#15803D" fontFamily="sans-serif">XLS</text>
            </svg>
        );
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
        return (
            <svg className="w-8 h-8 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#F3E8FF" />
                <path d="M14 2V9H20" fill="#A855F7" />
                <text x="50%" y="17" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#A855F7" fontFamily="sans-serif">IMG</text>
            </svg>
        );
    }
    // Varsayılan Dosya İkonu
    return (
        <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#EBF5FF" />
            <path d="M14 2V9H20" fill="#3B82F6" />
        </svg>
    );
};

// --- ŞIK DOSYA KARTI BİLEŞENİ (GÜNCELLENDİ) ---
const FileMessageCard = ({ file, isMe }) => {
    // İndirme Fonksiyonu
    const handleDownload = (e) => {
        e.preventDefault();
        const rawName = file.fileName || file.path?.split('/').pop();
        // İndirme linkini tetikle
        window.location.href = `/api/download/${rawName}`;
    };

    return (
        // Değişiklik: mb-1.5 kaldırıldı, w-[260px] eklendi (Sabit genişlik hizayı düzeltir)
        <div className={`group flex items-center gap-3 p-3 rounded-xl border shadow-sm w-[260px] transition-all hover:shadow-md bg-white ${isMe ? 'border-gray-200' : 'border-blue-100'}`}>

            {/* 1. Sol: Dosya İkonu */}
            <div className="shrink-0 transition-transform group-hover:scale-110 duration-200">
                <FileIcon fileName={file.originalName || file.name} />
            </div>

            {/* 2. Orta: Dosya İsmi ve Bilgi */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="text-xs font-bold text-gray-700 truncate" title={file.originalName || file.name}>
                    {file.originalName || file.name}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                    {(file.size / 1024).toFixed(1)} KB {/* Varsayılan boyut gösterimi */}
                </span>
            </div>

            {/* 3. Sağ: Modern İndirme Butonu */}
            <button
                onClick={handleDownload}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                title="Dosyayı İndir"
            >
                {/* Yeni İndirme İkonu (ArrowDownTray) */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 9v9m0 0l3-3m-3 3l-3-3m-6-6h12a2.25 2.25 0 012.25 2.25v3" />
                </svg>
            </button>
        </div>
    );
};
