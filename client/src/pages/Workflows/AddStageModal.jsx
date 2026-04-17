import React, { useState, useEffect, useRef } from 'react';

// --- İKONLAR ---
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const EmailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);
  
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const AddStageModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [stageName, setStageName] = useState('');
  const [description, setDescription] = useState('');
  
  // Müşteri Bilgileri
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Müşteri Arama / Dropdown State'leri
  const [customers, setCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Bildirim Ayarları (SMS & E-Posta) ve Hata
  const [sendSms, setSendSms] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [showNotificationError, setShowNotificationError] = useState(false); 

  // --- MÜŞTERİLERİ ÇEK ---
  useEffect(() => {
    if (isOpen) {
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
            } catch (err) {
                console.error("Müşteri çekme hatası:", err);
            }
        };
        fetchCustomers();
    }
  }, [isOpen]);

  // --- OTOMATİK VERİ DOLDURMA (INITIAL DATA) ---
  useEffect(() => {
    if (isOpen && initialData) {
        setCustomerName(initialData.customerName || '');
        setCustomerPhone(initialData.customerPhone || '');
        setCustomerEmail(initialData.customerEmail || '');
        setSendSms(initialData.sendSms || false);
        setSendEmail(initialData.sendEmail || false);
        setStageName(initialData.title || '');
        setDescription(initialData.description || '');
    } else if (isOpen && !initialData) {
        // Sıfırlama
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setSendSms(false);
        setSendEmail(false);
        setStageName('');
        setDescription('');
    }
  }, [isOpen, initialData]);

  // --- TIKLAMA DIŞI KAPATMA (DROPDOWN) ---
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  if (!isOpen) return null;

  const handleSave = () => {
  if (!stageName.trim()) return;

  // Telefon numarasındaki parantez ve boşlukları temizle
  // Sadece rakamları al, eğer başında 0 varsa onu da at
  let purePhone = customerPhone.replace(/\D/g, '');
  if (purePhone.startsWith('0')) purePhone = purePhone.substring(1);

  onSave({ 
    title: stageName, 
    description,
    customerName,
    customerPhone: purePhone, // backend'e temiz rakamları gönderiyoruz
    customerEmail,
    sendSms,
    sendEmail
  });

  // Formu temizle
  setStageName('');
  setDescription('');
};

  // --- HANDLERS ---
  const handlePhoneChange = (e) => {
    if (showNotificationError) setShowNotificationError(false);
    let value = e.target.value;
    let numbers = value.replace(/\D/g, '');
    if (numbers.startsWith('0')) numbers = numbers.substring(1);
    numbers = numbers.substring(0, 10);
    let formatted = '';
    if (numbers.length > 0) formatted += `(${numbers.substring(0, 3)}`;
    if (numbers.length >= 4) formatted += `) ${numbers.substring(3, 6)}`;
    if (numbers.length >= 7) formatted += ` ${numbers.substring(6, 8)}`;
    if (numbers.length >= 9) formatted += ` ${numbers.substring(8, 10)}`;
    setCustomerPhone(formatted);
  };

  const handleNameChange = (e) => {
    if (showNotificationError) setShowNotificationError(false);
    setCustomerName(e.target.value);
    setShowDropdown(true); // Yazmaya başlayınca listeyi aç
  };

  const handleSelectCustomer = (customer) => {
      setCustomerName(`${customer.name} ${customer.surname}`);
      
      // Telefonu formatla
      let rawPhone = customer.phone || '';
      let numbers = rawPhone.replace(/\D/g, '');
      if (numbers.startsWith('0')) numbers = numbers.substring(1);
      numbers = numbers.substring(0, 10);
      
      let formatted = '';
      if (numbers.length > 0) formatted += `(${numbers.substring(0, 3)}`;
      if (numbers.length >= 4) formatted += `) ${numbers.substring(3, 6)}`;
      if (numbers.length >= 7) formatted += ` ${numbers.substring(6, 8)}`;
      if (numbers.length >= 9) formatted += ` ${numbers.substring(8, 10)}`;
      
      setCustomerPhone(formatted);
      setCustomerEmail(customer.email || '');
      setShowDropdown(false);
      setShowNotificationError(false);
  };

  // Filtrelenmiş Müşteriler
  const filteredCustomers = customers.filter(c => 
      `${c.name} ${c.surname}`.toLowerCase().includes(customerName.toLowerCase())
  );

  const handleNotificationChange = (type) => {
      // Eğer ad soyad boşsa ve bir kutucuk işaretlenmek isteniyorsa uyarı ver
      if (!customerName.trim()) {
          setShowNotificationError(true);
          // İşaretlemeye izin verme
          return;
      }
      
      setShowNotificationError(false);
      if (type === 'sms') setSendSms(!sendSms);
      if (type === 'email') setSendEmail(!sendEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-visible transform transition-all relative p-8">
        
        {/* KAPATMA BUTONU */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1.5 transition-colors">
          <XIcon />
        </button>

        {/* BAŞLIK */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
             {initialData && initialData.title ? 'Aşamayı Düzenle' : 'Aşama Ekle'}
          </h2>
        </div>

        {/* FORM ALANLARI */}
        <div className="space-y-5">
          {/* AŞAMA ADI */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AŞAMA ADI</label>
            <input 
              type="text" 
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20 transition-all shadow-sm"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="Örn: Evrak Kontrolü"
            />
          </div>

          {/* AÇIKLAMA */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AÇIKLAMA</label>
            <textarea 
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20 transition-all resize-none shadow-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aşama hakkında kısa bilgi..."
            />
          </div>

          {/* MÜŞTERİ BİLGİLERİ (GÜNCELLENDİ: Satır satır ayrıldı) */}
          
          {/* SATIR 1: Müşteri Adı ve Telefon */}
          <div className="flex flex-col sm:flex-row gap-5">
             
             {/* 1. Müşteri (Dropdown'lı, Yazılabilir ve Tıklayınca Açılır) */}
             <div className="flex-[1.5] relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">MÜŞTERİ</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className={`w-full border rounded-lg pl-3 pr-8 py-2.5 text-sm text-gray-700 focus:outline-none transition-all shadow-sm ${showNotificationError && !customerName ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200 focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20'}`}
                        value={customerName}
                        onChange={handleNameChange} // Yazınca filtrele ve aç
                        onClick={() => setShowDropdown(true)} // TIKLAYINCA LİSTEYİ AÇ (EKLENEN KISIM)
                        onFocus={() => setShowDropdown(true)} // Odaklanınca aç
                        placeholder="Müşteri Ara veya Yaz..."
                        autoComplete="off"
                    />
                    {/* Ok İkonu (Dropdown hissi vermek için Search yerine ok konulabilir, ama Search istiyorsanız Search kalsın) */}
                    <div 
                        className="absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-gray-600"
                        onClick={() => setShowDropdown(!showDropdown)} // İkona basınca aç/kapat
                    >
                        {/* Aşağı ok ikonu ekledim ki select box gibi görünsün */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>

                {/* AÇILIR LİSTE (DROPDOWN) */}
                {/* customerName kontrolünü kaldırdım ki boşken de tüm liste gelsin */}
                {showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
                        {/* Eğer arama yapılmışsa ve sonuç yoksa */}
                        {filteredCustomers.length === 0 && (
                            <div className="px-4 py-2 text-sm text-gray-400 italic">Sonuç bulunamadı...</div>
                        )}

                        {/* Müşteri Listesi */}
                        {filteredCustomers.map(c => (
                            <div 
                                key={c.id}
                                onClick={() => handleSelectCustomer(c)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0 flex flex-col group transition-colors"
                            >
                                <span className="font-medium group-hover:text-[#D32F2F]">{c.name} {c.surname}</span>
                                <span className="text-[10px] text-gray-400">{c.phone}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* UYARI MESAJI */}
                 {showNotificationError && !customerName && (
                    <div className="absolute top-full left-0 mt-1 text-xs text-red-600 flex items-center gap-1 animate-pulse bg-red-50 px-2 py-1 rounded z-10">
                        <span>Lütfen müşteri adı giriniz.</span>
                    </div>
                )}
             </div>

             {/* 2. Telefon */}
             <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">TELEFON</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-400 group-focus-within:text-[#D32F2F] transition-colors"><PhoneIcon /></span>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <span className="text-gray-500 font-medium text-sm pt-0.5">0</span>
                    </div>
                    <input 
                        type="tel" 
                        className="w-full border border-gray-200 rounded-lg pl-16 pr-3 py-2.5 text-sm text-gray-700 font-mono tracking-wide placeholder-gray-300 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20 transition-all shadow-sm"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        placeholder="(5__) ___ __ __"
                        maxLength={15} 
                    />
                </div>
             </div>
          </div>

          {/* SATIR 2: E-Posta (Ayrı Satır) */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">E-POSTA</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-400 group-focus-within:text-[#D32F2F] transition-colors"><EmailIcon /></span>
                </div>
                <input 
                    type="email" 
                    className="w-full border border-gray-200 rounded-lg pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20 transition-all shadow-sm"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                />
            </div>
          </div>

          {/* BİLDİRİM SEÇENEKLERİ */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                BİLDİRİM TERCİHLERİ
            </label>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm text-gray-600 mb-3">
                    Kaydete basıldığında eklenen aşama müşteriye seçilen yollar ile bildirilecek:
                </p>
                
                <div className="flex items-center gap-6">
                    {/* SMS Checkbox */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNotificationChange('sms')}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${sendSms ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-white border-gray-300'}`}>
                            {sendSms && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <span className="text-sm font-medium text-gray-700 select-none">SMS</span>
                    </div>

                    {/* E-Posta Checkbox */}
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNotificationChange('email')}>
                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${sendEmail ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-white border-gray-300'}`}>
                            {sendEmail && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <span className="text-sm font-medium text-gray-700 select-none">E-Posta</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-100">
            <button 
                onClick={onClose}
                className="bg-gray-50 hover:bg-gray-100 text-gray-500 px-5 py-2 rounded-full font-medium text-xs flex items-center gap-1 transition-colors"
            >
                İptal <span className="text-base leading-none">&times;</span>
            </button>

            <button 
                onClick={handleSave}
                className="text-white px-8 py-2.5 rounded-full font-medium text-xs flex items-center gap-1 transition-colors shadow-md hover:shadow-lg transform active:scale-95"
                style={{ backgroundColor: '#D32F2F' }}
            >
                Kaydet <CheckIcon />
            </button>
        </div>
      </div>
    </div>
  );
};
export default AddStageModal;
