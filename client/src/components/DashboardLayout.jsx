import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import logo from '../assets/logo3.png';
import InviteTeamMemberModal from './InviteTeamMemberModal';
import RespondToInviteModal from './RespondToInviteModal';
import { getUserColor } from '../utils/userColors';
import TaskDetailModal from "../pages/Calendar/TaskDetailModal";


// --- İKONLAR ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.44 1.152-.44 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
const WorkflowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const AddUserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 17.25a4.875 4.875 0 004.875-4.875h2.25c.531 0 1.039.108 1.5.312 1.5.665 2.5 2.14 2.5 3.813v1.5a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75v-1.5z" /></svg>;
const TaskUpdateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const CommentNotifIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-600"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
const ThreeDotsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

const WorkflowUpdateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

const DashboardLayout = () => {
    // YENİ: Bildirimden Tıklanan Görev İçin State
    const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
    const location = useLocation();
    const navigate = useNavigate(); // Yönlendirme için kanca

    // STATE YÖNETİMİ
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedInvite, setSelectedInvite] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const [teamMembers, setTeamMembers] = useState([]);
    // KULLANICI BİLGİSİ STATE'İ
    const [currentUser, setCurrentUser] = useState({ first_name: 'A', last_name: 'Y' }); // Varsayılan

    // YENİ STATE'LER
    const [isMsgDropdownOpen, setIsMsgDropdownOpen] = useState(false); // Mesaj kutusu açık mı?
    const msgDropdownRef = useRef(null); // Dışarı tıklamayı algılamak için

    // YENİ EKLENEN STATE: Ekip arama için
    const [teamSearch, setTeamSearch] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // --- YENİ EKLENEN STATE: SİLME İŞLEMİ İÇİN ---
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    const notifRef = useRef(null);

    // --- GÜVENLİK KONTROLÜ (Token Süresi Dolduysa At) ---
    const checkAuthAndRedirect = (res) => {
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('token');
            navigate('/login');
            return false;
        }
        return true;
    };

    // --- VERİ ÇEKME FONKSİYONLARI ---

    // 1. Bildirimleri Çek
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!checkAuthAndRedirect(res)) return; // Yetki kontrolü

            const data = await res.json();
            if (Array.isArray(data)) setNotifications(data);
        } catch (err) { console.error("Bildirim hatası:", err); }
    };

    // 2. Ekip Listesini Çek
    const fetchTeam = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch('/api/team', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!checkAuthAndRedirect(res)) return; // Yetki kontrolü

            const data = await res.json();
            if (Array.isArray(data)) setTeamMembers(data);
        } catch (err) { console.error("Ekip yükleme hatası:", err); }
    };

    // --- YENİ: EKİP ÜYESİ SİLME FONKSİYONU ---
    const confirmRemoveTeamMember = async () => {
        if (!memberToRemove) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/team/${memberToRemove.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setRemoveModalOpen(false);
                setMemberToRemove(null);
                fetchTeam(); // Listeyi yenile
                toast.success("Ekip üyesi silindi.");
            } else {
                toast.error("Silme işlemi başarısız oldu.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Silme Butonuna Tıklandığında
    const handleRemoveClick = (member) => {
        setMemberToRemove(member);
        setRemoveModalOpen(true);
    };


    // Başlangıçta Verileri Yükle
    useEffect(() => {
        fetchNotifications();
        fetchTeam();

        const interval = setInterval(() => {
            fetchNotifications();
            fetchTeam();
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    // LocalStorage'dan kullanıcıyı al
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    // Bildirim ve Mesaj Kutusu Dışına Tıklama
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
            // YENİ: Mesaj kutusu kontrolü
            if (msgDropdownRef.current && !msgDropdownRef.current.contains(event.target)) {
                setIsMsgDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Bildirim Okundu Yap
    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) { console.error(err); }
    };


    // Güncellenmiş Silme Fonksiyonu
    const clearNotifications = async (type) => {
        // type: 'messages' (sadece mesajlar) veya 'system' (sadece bildirimler)
        try {
            const token = localStorage.getItem('token');
            // URL'e query parameter ekliyoruz
            const res = await fetch(`/api/notifications?type=${type}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // State'i güncelle (Sadece silinen türe göre filtrele)
                if (type === 'messages') {
                    setNotifications(prev => prev.filter(n => !n.type.startsWith('message_')));
                } else {
                    setNotifications(prev => prev.filter(n => n.type.startsWith('message_')));
                }
            }
        } catch (err) { console.error("Silme hatası:", err); }
    };

    const handleNotificationClick = async (notif) => {
        // 1. EĞER BİLDİRİM BİR "DAVET" İSE:
        if (notif.type === 'invite') {
            // Eğer zaten yanıtlanmışsa (is_read: true ise) tekrar açma.
            // Bu sayede Kabul/Reddet yapıldıktan sonra bildirim pasif hale gelir.
            if (notif.is_read) return;

            // Henüz yanıtlanmamışsa Modalı aç ama "markAsRead" ÇAĞIRMA.
            // Böylece "Daha sonra karar ver" denilirse bildirim hala "okunmamış" kalır.
            setSelectedInvite(notif);
            setIsNotifOpen(false);
            return;
        }

        // 2. DİĞER TÜM BİLDİRİMLER İÇİN:
        // Tıklandığı an okundu yap (Mevcut mantık)
        markAsRead(notif.id);

        // --- MESAJ BİLDİRİMLERİ ---
        if (notif.type.startsWith('message_')) {
            setIsMsgDropdownOpen(false);
            const contextType = notif.type.split('_')[1];
            navigate('/chat', {
                state: {
                    targetChat: {
                        type: contextType,
                        id: notif.resource_id
                    }
                }
            });

            // --- SİSTEM BİLDİRİMLERİ (GÖREV VB.) ---
        } else if (notif.type === 'task_update' || notif.type === 'task_comment') {
            if (notif.resource_id) {
                setSelectedTaskForModal({ id: notif.resource_id });
                setIsNotifOpen(false);
            }

        } else if (notif.type === 'workflow_update') {
            if (notif.resource_id) {
                setIsNotifOpen(false);
                navigate('/workflows', { state: { targetWorkflowId: notif.resource_id } });
            }
        }
    };

    // Filtrelenmiş Ekip Listesi
    const filteredTeamMembers = teamMembers.filter(member =>
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(teamSearch.toLowerCase())
    );

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

            {/* SOL MENÜ */}
            <aside className="w-24 bg-ligRed text-white flex flex-col items-center py-6 shadow-none z-30 flex-shrink-0">
                <div className="mb-10">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center">
                        <img src={logo} alt="LIG" className="w-6 h-6 object-contain" />
                    </div>
                </div>
                <ul className="flex-1 w-full flex flex-col gap-2">
                    <SidebarItem to="/" icon={<HomeIcon />} label="Ana Sayfa" active={location.pathname === '/'} />
                    <SidebarItem to="/calendar" icon={<CalendarIcon />} label="Takvimim" active={location.pathname === '/calendar'} />
                    <SidebarItem to="/chat" icon={<ChatIcon />} label="Yazışmalar" active={location.pathname === '/chat'} />
                    <SidebarItem to="/workflows" icon={<WorkflowIcon />} label="İş Akışları" active={location.pathname === '/workflows'} />
                    <SidebarItem to="/customers" icon={<UsersIcon />} label="Müşterilerim" active={location.pathname === '/customers'} />
                </ul>
                <div className="mt-auto flex flex-col items-center gap-4 w-full">
                    <div className="mt-auto flex flex-col items-center gap-4 w-full">
                        {/* PROFİL BUTONU (GÜNCELLENDİ) */}
                        <Link to="/profile">
                            <div
                                className="w-10 h-10 rounded-full bg-red-800 border-2 border-white flex items-center justify-center text-sm font-bold shadow-lg mt-2 cursor-pointer hover:scale-110 transition-transform text-white"
                                title="Profilim"
                            >
                                {currentUser.first_name ? currentUser.first_name[0] : ''}
                                {currentUser.last_name ? currentUser.last_name[0] : ''}
                            </div>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* İÇERİK ALANI */}
            <div className="flex-1 flex flex-col h-full relative bg-gray-50">

                {/* ÜST BAR */}
                <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-8 z-40 relative">
                    <div className="flex items-center gap-2">
                        <h2 className="text-gray-600 font-medium">LIG Sigorta - CRM Paneli</h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex gap-4 text-xs font-bold text-gray-400">

                            {/* --- MESAJLAR ALANI --- */}
                            <div className="relative" ref={msgDropdownRef}>
                                <button
                                    onClick={() => setIsMsgDropdownOpen(!isMsgDropdownOpen)}
                                    className="hover:text-ligRed cursor-pointer relative flex items-center gap-1 uppercase"
                                >
                                    MESAJLAR
                                    {/* Sadece mesaj tipi olan okunmamışları say */}
                                    {notifications.filter(n => !n.is_read && n.type.startsWith('message_')).length > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-blue-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                                            {notifications.filter(n => !n.is_read && n.type.startsWith('message_')).length}
                                        </span>
                                    )}
                                </button>

                                {isMsgDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        {/* Başlık ve Butonlar */}
                                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-700">
                                                Mesajlar ({notifications.filter(n => !n.is_read && n.type.startsWith('message_')).length})
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {notifications.some(n => n.type.startsWith('message_')) && (
                                                    <button
                                                        onClick={() => clearNotifications('messages')}
                                                        className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-medium"
                                                    >
                                                        Tümünü Sil
                                                    </button>
                                                )}
                                                <button onClick={fetchNotifications} className="text-[10px] text-blue-500 hover:underline">
                                                    Yenile
                                                </button>
                                            </div>
                                        </div>

                                        {/* Mesaj Listesi */}
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.filter(n => n.type.startsWith('message_')).length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 text-xs">Henüz yeni mesaj yok.</div>
                                            ) : (
                                                notifications.filter(n => n.type.startsWith('message_')).map((notif) => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => {
                                                            handleNotificationClick(notif);
                                                        }}
                                                        className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${notif.is_read ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
                                                    >
                                                        <div className="pt-0.5">
                                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                                                <ChatIcon />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className={`text-xs font-bold ${notif.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <p className="text-[11px] text-gray-600 mt-0.5 leading-snug line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                            <span className="text-[9px] text-gray-400 mt-1 block">
                                                                {new Date(notif.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* --- MESAJLAR ALANI BİTİŞ --- */}

                            {/* --- BİLDİRİM ALANI --- */}
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                                    className="hover:text-ligRed cursor-pointer relative flex items-center gap-1 uppercase"
                                >
                                    BİLDİRİMLER
                                    {notifications.filter(n => !n.is_read && !n.type.startsWith('message_')).length > 0 && (
                                        <span className="absolute -top-2 -right-3 bg-ligRed text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                                            {notifications.filter(n => !n.is_read && !n.type.startsWith('message_')).length}
                                        </span>
                                    )}
                                </button>

                                {isNotifOpen && (
                                    <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-700">
                                                Bildirimler ({notifications.filter(n => !n.is_read && !n.type.startsWith('message_')).length})
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {notifications.some(n => !n.type.startsWith('message_')) && (
                                                    <button
                                                        onClick={() => clearNotifications('system')}
                                                        className="text-[10px] text-red-500 hover:text-red-700 hover:underline font-medium"
                                                    >
                                                        Tümünü Sil
                                                    </button>
                                                )}
                                                <button onClick={fetchNotifications} className="text-[10px] text-blue-500 hover:underline">
                                                    Yenile
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.filter(n => !n.type.startsWith('message_')).length === 0 ? (
                                                <div className="p-6 text-center text-gray-400 text-xs">Henüz bildirim yok.</div>
                                            ) : (
                                                notifications.filter(n => !n.type.startsWith('message_')).map((notif) => {
                                                    // İKON MANTIĞI
                                                    let IconComp = null;
                                                    if (notif.type === 'invite') {
                                                        IconComp = <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><AddUserIcon /></div>;
                                                    } else if (notif.type === 'task_update') {
                                                        IconComp = <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><TaskUpdateIcon /></div>;
                                                    } else if (notif.type === 'task_comment') {
                                                        IconComp = <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><CommentNotifIcon /></div>;
                                                    } else if (notif.type === 'workflow_update') {
                                                        IconComp = <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0"><WorkflowUpdateIcon /></div>;
                                                    } else {
                                                        IconComp = !notif.is_read ? <div className="w-2 h-2 rounded-full bg-ligRed mt-2 shrink-0"></div> : <div className="w-2 h-2 shrink-0"></div>;
                                                    }

                                                    return (
                                                        <div
                                                            key={notif.id}
                                                            onClick={() => handleNotificationClick(notif)}
                                                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${notif.is_read ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
                                                        >
                                                            <div className="pt-0.5">{IconComp}</div>
                                                            <div className="flex-1">
                                                                <h4 className={`text-xs font-bold ${notif.is_read ? 'text-gray-600' : 'text-gray-800'}`}>
                                                                    {notif.title}
                                                                </h4>
                                                                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                                                                    {notif.message}
                                                                </p>
                                                                <span className="text-[9px] text-gray-400 mt-1 block">
                                                                    {new Date(notif.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* --- BİLDİRİM ALANI BİTİŞ --- */}
                        </div>

                        <div className="flex gap-2 text-gray-400">
                            <Link to="/login" className="flex items-center gap-1 hover:text-ligRed transition-colors">
                                <span className="text-xs font-bold">ÇIKIŞ</span>
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="flex flex-1 overflow-hidden">
                    <main className="flex-1 p-8 overflow-y-auto">
                        <Outlet />
                    </main>

                    {/* ================= SAĞ MENÜ (EKİP) ================= */}
                    <aside className="w-72 bg-white border-l border-gray-100 hidden xl:flex flex-col z-20 shadow-sm">
                        <div className="p-6 pb-2 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Ekip</h3>
                            <div className="flex gap-2 text-gray-400">
                                <button onClick={() => setIsInviteModalOpen(true)} className="hover:text-ligRed transition-colors"><AddUserIcon /></button>
                                <button
                                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                                    className={`hover:text-ligRed transition-colors ${isSearchOpen ? 'text-ligRed' : ''}`}
                                >
                                    <SearchIcon />
                                </button>
                            </div>
                        </div>

                        {/* ARAMA İNPUT ALANI (GİZLİ/AÇIK) */}
                        {isSearchOpen && (
                            <div className="px-6 mb-2">
                                <input
                                    type="text"
                                    placeholder="Ekip üyesi ara..."
                                    value={teamSearch}
                                    onChange={(e) => setTeamSearch(e.target.value)}
                                    className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-ligRed"
                                />
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-6 space-y-3 mt-2">

                            {/* --- DİNAMİK EKİP LİSTESİ (Filtrelenmiş) --- */}
                            {filteredTeamMembers.length === 0 ? (
                                <div className="text-center py-4 text-xs text-gray-400">
                                    {teamMembers.length === 0 ? "Henüz ekip üyeniz yok." : "Aradığınız kişi bulunamadı."}
                                </div>
                            ) : (
                                filteredTeamMembers.map((member) => {
                                    const colorStyle = getUserColor(member.id);
                                    return (
                                        <TeamMemberItem
                                            key={member.id}
                                            member={member} // TÜM OBJEYİ GÖNDERİYORUZ
                                            name={`${member.first_name} ${member.last_name}`}
                                            role={member.role || 'Üye'}
                                            initial={`${member.first_name[0]}${member.last_name[0]}`}
                                            colorObj={colorStyle}
                                            status="online"
                                            onRemove={handleRemoveClick} // SİLME FONKSİYONUNU GÖNDERİYORUZ
                                        />
                                    );
                                })
                            )}

                            {/* DAVET KUTUSU */}
                            <div
                                onClick={() => setIsInviteModalOpen(true)}
                                className="mt-6 p-5 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl text-center hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400 shadow-sm group-hover:text-ligRed group-hover:scale-110 transition-all">
                                    <AddUserIcon />
                                </div>
                                <p className="text-xs text-gray-500 font-medium group-hover:text-gray-700">Yeni bir ekip üyesi davet et</p>
                            </div>
                        </div>


                    </aside>
                </div>
            </div>

            {/* --- MODALLAR --- */}
            <InviteTeamMemberModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />

            <RespondToInviteModal
                isOpen={!!selectedInvite}
                notification={selectedInvite}
                onClose={() => setSelectedInvite(null)}
                onActionComplete={() => {
                    fetchNotifications();
                    fetchTeam();
                    setSelectedInvite(null);
                }}
            />

            {/* YENİ: SİLME ONAY MODALI */}
            {removeModalOpen && (
                <RemoveTeamMemberModal
                    member={memberToRemove}
                    onClose={() => setRemoveModalOpen(false)}
                    onConfirm={confirmRemoveTeamMember}
                />
            )}

            {selectedTaskForModal && (
                <TaskDetailModal
                    task={selectedTaskForModal}
                    onClose={() => setSelectedTaskForModal(null)}
                />
            )}
        </div>
    );
};

// --- ALT BİLEŞENLER ---

const SidebarItem = ({ to, icon, label, active }) => {
    return (
        <li className="w-full pl-0">
            {active ? (
                <Link to={to} className="flex flex-col items-center justify-center gap-1 py-4 ml-3 bg-gray-50 text-ligRed rounded-l-[30px] rounded-r-none shadow-none relative z-50 transition-all">
                    {icon}
                    <span className="text-[10px] font-bold">{label}</span>
                </Link>
            ) : (
                <Link to={to} className="flex flex-col items-center justify-center gap-1 py-4 text-red-100 hover:text-white transition-all opacity-70 hover:opacity-100">
                    {icon}
                    <span className="text-[10px] font-medium">{label}</span>
                </Link>
            )}
        </li>
    );
};

// --- GÜNCELLENMİŞ EKİP ÜYESİ BİLEŞENİ (3 NOKTA + DROPDOWN) ---
const TeamMemberItem = ({ member, name, role, initial, colorObj, status, onRemove }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    let statusColor = "bg-gray-300";
    if (status === "online") statusColor = "bg-green-500";
    if (status === "away") statusColor = "bg-yellow-400";

    // Dışarı tıklayınca menüyü kapat
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-100 relative">
            {/* Profil Resmi */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm relative border ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}>
                {initial}
                <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${statusColor}`}></div>
            </div>

            {/* İsim ve Rol */}
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-700 truncate group-hover:text-ligRed transition-colors">{name}</h4>
                <p className="text-[10px] font-medium text-gray-400 truncate">{role}</p>
            </div>

            {/* 3 NOKTA BUTONU (SAĞ TARAFTA) */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Parent click'i engelle
                        setIsMenuOpen(!isMenuOpen);
                    }}
                    className="p-1 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <ThreeDotsIcon />
                </button>

                {/* SİLME DROPDOWN MENÜSÜ */}
                {isMenuOpen && (
                    <div className="absolute top-8 right-0 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(false);
                                onRemove(member); // Silme işlemini tetikle
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                        >
                            <TrashIcon />
                            Sil
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- YENİ: SİLME ONAY MODALI BİLEŞENİ ---
const RemoveTeamMemberModal = ({ member, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-[400px] text-center transform transition-all scale-100 relative">

                {/* Turuncu Uyarı İkonu */}
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2">Emin misiniz?</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    <span className="font-bold text-gray-700">{member.first_name} {member.last_name}</span> isimli kişiyi ekipten çıkarmak istediğinize emin misiniz? <br />
                    <span className="text-xs">Bu işlem geri alınamaz.</span>
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                    >
                        Evet
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors shadow-md shadow-gray-200"
                    >
                        Hayır
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
