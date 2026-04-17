import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getUserColor } from '../../utils/userColors';

const Profile = () => {
  // --- STATE YÖNETİMİ ---

  // 1. Profil Bilgileri
  const [user, setUser] = useState({
    first_name: '',
    last_name: '',
    email: '',
    avatar: null
  });

  // 2. E-Posta Güncelleme Bölümü
  const [emailSection, setEmailSection] = useState({
    password: '',
    newEmail: '',
    isVerified: false,
    statusMsg: null
  });

  // 3. Şifre Değiştirme Bölümü
  const [passSection, setPassSection] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    isVerified: false,
    statusMsg: null
  });

  // 4. Yeni Şifre Kuralları
  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false
  });
  const [passwordMatchError, setPasswordMatchError] = useState(false);

  // 5. BAŞARI MODAL STATE'İ (YENİ EKLENDİ)
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // --- BAŞLANGIÇ VERİSİ ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEmailSection(prev => ({ ...prev, newEmail: parsedUser.email }));
    }
  }, []);

  // --- YARDIMCI: ŞİFRE GÜÇ KONTROLÜ ---
  const checkPasswordStrength = (password) => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[@$!%*?&.,]/.test(password)
    });
  };

  useEffect(() => {
    if (passSection.newPassword) {
      checkPasswordStrength(passSection.newPassword);
      setPasswordMatchError(passSection.confirmPassword && passSection.newPassword !== passSection.confirmPassword);
    }
  }, [passSection.newPassword, passSection.confirmPassword]);

  // --- YARDIMCI: MODAL GÖSTERME FONKSİYONU (YENİ EKLENDİ) ---
  const showSuccessNotification = (title, message) => {
    setSuccessModal({ isOpen: true, title, message });

    // 2 Saniye sonra modalı kapat
    setTimeout(() => {
      setSuccessModal({ isOpen: false, title: '', message: '' });
    }, 2000);
  };

  // --- API: ŞİFRE DOĞRULAMA ---
  const verifyPasswordAPI = async (password, sectionType) => {
    if (!password) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        if (sectionType === 'email') {
          setEmailSection(prev => ({ ...prev, isVerified: true, statusMsg: { type: 'success', text: '✓ Şifre Doğrulandı' } }));
        } else {
          setPassSection(prev => ({ ...prev, isVerified: true, statusMsg: { type: 'success', text: '✓ Şifre Doğrulandı' } }));
        }
      } else {
        if (sectionType === 'email') {
          setEmailSection(prev => ({ ...prev, isVerified: false, statusMsg: { type: 'error', text: '✕ Şifre Yanlış' } }));
        } else {
          setPassSection(prev => ({ ...prev, isVerified: false, statusMsg: { type: 'error', text: '✕ Şifre Yanlış' } }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- EFEKTLER: ŞİFRE GİRİLDİKÇE KONTROL ET ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (emailSection.password.length > 0) {
        verifyPasswordAPI(emailSection.password, 'email');
      } else {
        setEmailSection(prev => ({ ...prev, isVerified: false, statusMsg: null }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [emailSection.password]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (passSection.currentPassword.length > 0) {
        verifyPasswordAPI(passSection.currentPassword, 'password');
      } else {
        setPassSection(prev => ({ ...prev, isVerified: false, statusMsg: null }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [passSection.currentPassword]);


  // --- HANDLERS (GÜNCELLENDİ: alert yerine showSuccessNotification kullanıldı) ---
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ first_name: user.first_name, last_name: user.last_name })
      });
      const data = await res.json();
      if (res.ok) {
        // YENİ: Modal tetikleme
        showSuccessNotification('Profil Güncellendi!', 'Kişisel bilgileriniz başarıyla kaydedildi.');

        localStorage.setItem('user', JSON.stringify({ ...user, ...data.user }));
        window.dispatchEvent(new Event('storage'));
      } else {
        toast.error(data.error || "Hata oluştu");
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: emailSection.newEmail })
      });
      const data = await res.json();
      if (res.ok) {
        // YENİ: Modal tetikleme
        showSuccessNotification('E-Posta Güncellendi!', 'Yeni e-posta adresiniz sisteme tanımlandı.');

        setUser(prev => ({ ...prev, email: data.user.email }));
        localStorage.setItem('user', JSON.stringify({ ...user, ...data.user }));
        setEmailSection({ password: '', newEmail: data.user.email, isVerified: false, statusMsg: null });
      } else {
        toast.error(data.error || "Hata oluştu");
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordMatchError || !Object.values(validations).every(Boolean)) {
      toast.error("Lütfen yeni şifre kurallarına uyunuz.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword: passSection.newPassword })
      });
      if (res.ok) {
        // YENİ: Modal tetikleme
        showSuccessNotification('Şifre Değiştirildi!', 'Hesap güvenliğiniz için şifreniz yenilendi.');

        setPassSection({ currentPassword: '', newPassword: '', confirmPassword: '', isVerified: false, statusMsg: null });
      } else {
        toast.error('Hata oluştu.');
      }
    } catch (err) { console.error(err); }
  };

  const colorStyle = user.id ? getUserColor(user.id) : { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500' };

  return (
    <div className="flex flex-col h-full gap-6 font-sans fade-in animate-in duration-300 relative">

      {/* --- ÜST SEKME ALANI --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-4 flex gap-8 text-sm font-bold text-gray-500">
        <span className="text-ligRed border-b-2 border-ligRed pb-4 -mb-4 px-2">Hesap Bilgileri</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-10">

        {/* --- 1. KİŞİSEL BİLGİLER --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-gray-800 font-bold mb-6 text-lg">Profil Detayları</h3>

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-36 h-36 rounded-3xl flex items-center justify-center text-4xl font-bold border-4 shadow-lg ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
            </div>

            <form onSubmit={handleUpdateInfo} className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">Ad</label>
                <input
                  value={user.first_name}
                  onChange={(e) => setUser({ ...user, first_name: e.target.value })}
                  type="text"
                  autoComplete="given-name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-ligRed transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 ml-1">Soyad</label>
                <input
                  value={user.last_name}
                  onChange={(e) => setUser({ ...user, last_name: e.target.value })}
                  type="text"
                  autoComplete="family-name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-ligRed transition-all"
                />
              </div>

              <div className="md:col-span-2 flex justify-end mt-2">
                <button
                  type="submit"
                  className="bg-ligRed hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                  Güncelle
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* --- 2. E-POSTA GÜNCELLEME --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-gray-800 font-bold mb-6 text-lg">E-Posta Bilgilerini Güncelle</h3>
          <form onSubmit={handleUpdateEmail} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-gray-400 ml-1">Mevcut Şifre (Onay İçin)</label>
              <input
                type="password"
                value={emailSection.password}
                onChange={(e) => setEmailSection({ ...emailSection, password: e.target.value })}
                placeholder="Şifrenizi girin..."
                autoComplete="current-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-ligRed transition-all"
              />
              <p className="text-[10px] text-gray-400 ml-1">E-posta adresini değiştirebilmek için şifre girmelisiniz.</p>

              {emailSection.statusMsg && (
                <div className={`text-[10px] font-bold mt-1 absolute right-1 top-full ${emailSection.statusMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {emailSection.statusMsg.text}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 ml-1">E-Posta</label>
              <input
                value={emailSection.newEmail}
                onChange={(e) => setEmailSection({ ...emailSection, newEmail: e.target.value })}
                type="email"
                autoComplete="email"
                disabled={!emailSection.isVerified}
                className={`w-full border rounded-xl px-4 py-3 text-sm font-semibold transition-all
                    ${emailSection.isVerified
                    ? 'bg-white border-green-300 text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-200'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={!emailSection.isVerified}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2
                        ${emailSection.isVerified
                    ? 'bg-ligRed hover:bg-red-700 text-white hover:shadow-lg cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                    `}
              >
                E-Postayı Güncelle
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
              </button>
            </div>
          </form>
        </div>

        {/* --- 3. ŞİFRE DEĞİŞTİRME --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-gray-800 font-bold mb-6 text-lg">Şifreni Değiştir</h3>
          <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Mevcut Şifre */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-gray-400 ml-1">Mevcut Şifre</label>
              <input
                type="password"
                value={passSection.currentPassword}
                onChange={(e) => setPassSection({ ...passSection, currentPassword: e.target.value })}
                placeholder="••••••"
                autoComplete="current-password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-ligRed transition-all"
              />
              {passSection.statusMsg && (
                <div className={`text-[10px] font-bold mt-1 absolute right-1 top-full ${passSection.statusMsg.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {passSection.statusMsg.text}
                </div>
              )}
            </div>

            {/* Yeni Şifre */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 ml-1">Yeni Şifre</label>
              <input
                type="password"
                value={passSection.newPassword}
                onChange={(e) => setPassSection({ ...passSection, newPassword: e.target.value })}
                disabled={!passSection.isVerified}
                placeholder="••••••"
                autoComplete="new-password"
                className={`w-full border rounded-xl px-4 py-3 text-sm transition-all
                        ${passSection.isVerified
                    ? 'bg-white border-gray-200 text-gray-800 focus:border-ligRed'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
              />

              {passSection.isVerified && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <span className={`text-[10px] ${validations.length ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    {validations.length ? '✓' : '•'} En az 8 Karakter
                  </span>
                  <span className={`text-[10px] ${validations.upper ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    {validations.upper ? '✓' : '•'} Büyük Harf
                  </span>
                  <span className={`text-[10px] ${validations.lower ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    {validations.lower ? '✓' : '•'} Küçük Harf
                  </span>
                  <span className={`text-[10px] ${validations.number ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    {validations.number ? '✓' : '•'} Rakam
                  </span>
                  <span className={`text-[10px] ${validations.symbol ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                    {validations.symbol ? '✓' : '•'} Sembol
                  </span>
                </div>
              )}
            </div>

            {/* Yeni Şifre Tekrar */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 ml-1">Yeni Şifre (Tekrar)</label>
              <input
                type="password"
                value={passSection.confirmPassword}
                onChange={(e) => setPassSection({ ...passSection, confirmPassword: e.target.value })}
                disabled={!passSection.isVerified}
                placeholder="••••••"
                autoComplete="new-password"
                className={`w-full border rounded-xl px-4 py-3 text-sm transition-all
                        ${passSection.isVerified
                    ? `bg-white text-gray-800 focus:border-ligRed ${passwordMatchError ? 'border-red-500 focus:border-red-500' : 'border-gray-200'}`
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
              />

              {passSection.confirmPassword && (
                <p className={`text-[10px] font-bold mt-1 ${passwordMatchError ? 'text-red-600' : 'text-green-600'}`}>
                  {passwordMatchError ? '⚠️ Şifreler uyuşmuyor' : '✓ Şifreler uyuşuyor'}
                </p>
              )}
            </div>

            <div className="md:col-span-3 flex justify-end mt-2">
              <button
                type="submit"
                disabled={!passSection.isVerified || passwordMatchError || !passSection.newPassword}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2
                        ${passSection.isVerified && !passwordMatchError && passSection.newPassword
                    ? 'bg-ligRed hover:bg-red-700 text-white hover:shadow-lg cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                    `}
              >
                Şifreyi Güncelle
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- YENİ EKLENEN: BAŞARI MODALI (Register.jsx ile birebir aynı stil) --- */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white w-[300px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-8 text-center border-t-4 border-ligRed relative overflow-hidden">

            {/* Canlı Yeşil Tik İkonu */}
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{successModal.title}</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              {successModal.message}
            </p>

            {/* Alt Kısımda İnce İlerleme Çizgisi (2 saniyelik animasyon) */}
            <div className="absolute bottom-0 left-0 w-full bg-gray-100 h-1.5">
              <div
                className="bg-ligRed h-full origin-left animate-[progress_2s_linear_forwards]"
                style={{ boxShadow: '0 0 10px rgba(211, 47, 47, 0.3)' }}
              ></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
