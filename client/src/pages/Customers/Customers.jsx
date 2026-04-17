import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AddCustomerModal from './AddCustomerModal';
import ConfirmationModal from './ConfirmationModal';

// --- IKONLAR ---
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;

const Customers = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- SİLME MODALI STATE'İ ---
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, customer: null });

    // --- 1. VERİLERİ ÇEK (GET) ---
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
            console.error("Müşteriler çekilemedi:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    // --- 2. YENİ EKLE / GÜNCELLE (POST / PUT) ---
    const handleSaveCustomer = async (customerData) => {
        try {
            const token = localStorage.getItem('token');
            let res;

            if (editingCustomer) {
                // GÜNCELLEME (PUT)
                res = await fetch(`/api/customers/${editingCustomer.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(customerData)
                });
            } else {
                // YENİ EKLEME (POST)
                res = await fetch('/api/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(customerData)
                });
            }

            if (res.ok) {
                fetchCustomers();
                setEditingCustomer(null);
                toast.success("İşlem başarılı.");
                return true;
            } else {
                toast.error("İşlem sırasında bir hata oluştu.");
                return false;
            }

        } catch (error) {
            console.error("Kaydetme hatası:", error);
            toast.error("Sunucuya bağlanılamadı.");
            return false;
        }
    };

    // --- 3. SİLME ONAYINI BAŞLAT ---
    const confirmDelete = (customer) => {
        setDeleteModal({ isOpen: true, customer: customer });
    };

    // --- 4. GERÇEK SİLME İŞLEMİ (DELETE) ---
    const handleDelete = async () => {
        const { customer } = deleteModal;
        if (!customer) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/customers/${customer.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Frontend'den de filtreleyerek çıkar (Hızlı görünüm için)
                setCustomers(prev => prev.filter(c => c.id !== customer.id));
                setDeleteModal({ isOpen: false, customer: null }); // Modalı kapat
                toast.success("Müşteri silindi.");
            } else {
                toast.error("Silme başarısız.");
            }
        } catch (error) {
            console.error("Silme hatası:", error);
            toast.error("Bir hata oluştu.");
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleOpenModal = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    }

    // Arama Filtresi
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    );

    return (
        <div className="flex flex-col h-full gap-6 relative font-sans">

            {/* --- ÜST BAŞLIK VE BUTONLAR --- */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Müşterilerim</h1>
                    <p className="text-xs text-gray-400 mt-1">Toplam {customers.length} kayıtlı müşteri</p>
                </div>

                <div className="flex gap-3">
                    {/* ARAMA */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Müşteri ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100 transition-all w-64"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </div>
                    </div>

                    {/* EKLEME BUTONU */}
                    <button
                        onClick={handleOpenModal}
                        className="bg-[#D32F2F] hover:bg-red-800 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-100 transition-all transform hover:scale-105 active:scale-95"
                    >
                        <span>Müşteri Ekle</span>
                        <PlusIcon />
                    </button>
                </div>
            </div>

            {/* --- MÜŞTERİ LİSTESİ (TABLO GÖRÜNÜMÜ) --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">

                {/* Tablo Başlıkları */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-4 pl-2">AD SOYAD</div>
                    <div className="col-span-3">TELEFON</div>
                    <div className="col-span-3">E-POSTA</div>
                    <div className="col-span-2 text-right pr-2">İŞLEMLER</div>
                </div>

                {/* Tablo İçeriği */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-xs">Yükleniyor...</div>
                    ) : filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 items-center hover:bg-red-50/30 transition-colors group"
                            >
                                {/* 1. Kolon: Avatar + İsim */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm shrink-0">
                                        {customer.name[0]}{customer.surname[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-bold text-gray-700 truncate">{customer.name} {customer.surname}</h4>
                                        <span className="text-[10px] text-gray-400">Müşteri ID: #{customer.id}</span>
                                    </div>
                                </div>

                                {/* 2. Kolon: Telefon */}
                                <div className="col-span-3">
                                    <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                        {customer.phone || '-'}
                                    </span>
                                </div>

                                {/* 3. Kolon: E-Posta */}
                                <div className="col-span-3">
                                    <span className="text-xs text-gray-500 truncate block hover:text-blue-500 cursor-pointer transition-colors">
                                        {customer.email || '-'}
                                    </span>
                                </div>

                                {/* 4. Kolon: İşlemler */}
                                <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(customer)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all shadow-sm"
                                        title="Düzenle"
                                    >
                                        <PencilIcon />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(customer)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all shadow-sm"
                                        title="Sil"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                <SearchIcon />
                            </div>
                            <p className="text-sm">Kayıtlı müşteri bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MÜŞTERİ EKLEME/DÜZENLEME MODALI --- */}
            {isModalOpen && (
                <AddCustomerModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCustomer}
                    initialData={editingCustomer}
                />
            )}

            {/* --- SİLME ONAY MODALI (DIŞ) --- */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, customer: null })}
                onConfirm={handleDelete}
                title="Emin misiniz?"
                message={
                    <span>
                        <span className="font-bold text-gray-800">
                            {deleteModal.customer?.name} {deleteModal.customer?.surname}
                        </span> isimli müşteriyi ve tüm verilerini silmek istediğinize emin misiniz?
                    </span>
                }
                type="danger"
            />

        </div>
    );
};

export default Customers;
