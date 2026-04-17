import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';

const AddCustomerModal = ({ onClose, onSave, initialData = null }) => {
    const isEditMode = !!initialData;

    // İç Onay Modalı State'i
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        surname: initialData?.surname || '',
        // Eğer düzenleme ise ve numara 0 ile başlıyorsa, 0'ı at (input maskesi için)
        phone: initialData?.phone ? (initialData.phone.startsWith('0') ? initialData.phone.substring(1) : initialData.phone) : '',
        email: initialData?.email || '',
    });

    // Hata State'leri
    const [errors, setErrors] = useState({
        name: false,
        surname: false,
        email: false
    });

    // --- TELEFON FORMATLAMA (AKILLI INPUT) ---
    const formatPhoneNumber = (value) => {
        // Sadece rakamları al
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;

        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        }
        if (phoneNumberLength < 9) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
        }
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 8)} ${phoneNumber.slice(8, 10)}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone') {
            const formatted = formatPhoneNumber(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Yazmaya başlayınca hataları temizle
        setErrors(prev => ({ ...prev, [name]: false }));
    };

    // --- E-POSTA DOĞRULAMA ---
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handlePreSubmit = () => {
        const newErrors = {
            name: !formData.name.trim(),
            surname: !formData.surname.trim(),
            email: formData.email && !validateEmail(formData.email)
        };

        setErrors(newErrors);

        // Eğer herhangi bir hata varsa işlemi durdur
        if (newErrors.name || newErrors.surname || newErrors.email) {
            return;
        }

        // Eğer Düzenleme Modundaysak -> ONAY İSTE
        if (isEditMode) {
            setShowConfirm(true);
        } else {
            handleFinalSave();
        }
    };

    const handleFinalSave = async () => {
        // 1. Sadece rakamları al
        let rawPhone = formData.phone.replace(/[^\d]/g, '');

        // 2. Eğer numara '0' ile başlıyorsa (kullanıcı yanlışlıkla 0 yazmışsa), o baştaki 0'ı sil
        if (rawPhone.startsWith('0')) {
            rawPhone = rawPhone.substring(1);
        }

        // 3. Şimdi temiz halinin başına sistemin ihtiyacı olan tek 0'ı ekle
        // Sonuç her zaman: 0531... formatında olur (00531... veya 531... olmaz)
        const finalPhone = rawPhone ? `0${rawPhone}` : '';

        const finalData = {
            ...formData,
            phone: finalPhone
        };

        setIsLoading(true);
        const success = await onSave(finalData);
        setIsLoading(false);

        if (success) {
            onClose();
        }
    };

    const handleConfirmUpdate = () => {
        handleFinalSave(); // Güncellemeyi yap
        setShowConfirm(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-[9999] flex justify-center items-center backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
                <div className="relative w-[450px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                    {/* HEADER */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
                        <div className="flex items-center gap-2 text-[#D32F2F]">
                            <UserPlusIcon />
                            <h2 className="text-sm font-bold text-gray-800">{isEditMode ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</h2>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* FORM CONTENT */}
                    <div className="p-6 space-y-4">

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label required>Ad</Label>
                                <input
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 transition-all placeholder:text-gray-300 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#D32F2F] focus:ring-red-200'}`}
                                    placeholder="Örn: Ahmet"
                                />
                                {errors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">Ad alanı zorunludur.</p>}
                            </div>
                            <div>
                                <Label required>Soyad</Label>
                                <input
                                    name="surname"
                                    type="text"
                                    value={formData.surname}
                                    onChange={handleChange}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 transition-all placeholder:text-gray-300 ${errors.surname ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#D32F2F] focus:ring-red-200'}`}
                                    placeholder="Örn: Yılmaz"
                                />
                                {errors.surname && <p className="text-[10px] text-red-500 mt-1 font-medium">Soyad alanı zorunludur.</p>}
                            </div>
                        </div>

                        <div>
                            <Label icon={<PhoneIcon />}>Telefon Numarası</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium border-r border-gray-300 pr-2">
                                    0
                                </span>
                                <input
                                    name="phone"
                                    type="tel"
                                    maxLength={15} // (5XX) XXX XX XX
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-red-200 transition-all placeholder:text-gray-300 tracking-wide font-medium"
                                    placeholder="(5__) ___ __ __"
                                />
                            </div>
                        </div>

                        <div>
                            <Label icon={<EnvelopeIcon />}>E-Posta Adresi</Label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 transition-all placeholder:text-gray-300 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-[#D32F2F] focus:ring-red-200'}`}
                                placeholder="ornek@email.com"
                            />
                            {errors.email && <p className="text-[10px] text-red-500 mt-1 font-medium">Geçerli bir e-posta adresi giriniz.</p>}
                        </div>

                    </div>

                    {/* FOOTER */}
                    <div className="px-6 py-4 border-t border-gray-50 bg-gray-50 flex justify-end gap-3">
                        <button onClick={onClose} disabled={isLoading} className="px-5 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-50">
                            İptal
                        </button>
                        <button
                            onClick={handlePreSubmit}
                            disabled={isLoading}
                            className={`px-6 py-2 rounded-full bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 transition-all transform active:scale-95 flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>İşleniyor...</span>
                                </>
                            ) : (
                                <>
                                    {isEditMode ? 'Güncelle' : 'Kaydet'}
                                    <SaveIcon />
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* --- İÇ İÇE ONAY MODALI (GÜNCELLEME İÇİN) --- */}
            <ConfirmationModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmUpdate}
                title="Emin misiniz?"
                message={<span><span className="font-bold text-gray-800">{formData.name} {formData.surname}</span> isimli müşterinin bilgilerini güncellemek istediğinize emin misiniz?</span>}
                type="info"
            />
        </>
    );
};

// --- YARDIMCI BİLEŞENLER ---
const Label = ({ children, required, icon }) => (
    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
        {icon && <span className="text-gray-400 w-3.5 h-3.5">{icon}</span>}
        {children}
        {required && <span className="text-red-500 text-sm">*</span>}
    </label>
);

const UserPlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 17.25a4.875 4.875 0 004.875-4.875h2.25c.531 0 1.039.108 1.5.312 1.5.665 2.5 2.14 2.5 3.813v1.5a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75v-1.5z" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg>;
const EnvelopeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;

export default AddCustomerModal;
