import React, { useState, useEffect } from 'react';

// İKONLAR
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const InviteTeamMemberModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Modal her açıldığında state'leri sıfırla
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        // Not: Otomatik kapatma (setTimeout) kaldırıldı.
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Bir hata oluştu.');
      }

    } catch (error) {
      setStatus('error');
      setErrorMessage('Sunucuya bağlanılamadı.');
    }
  };

  // Başarılı Durum İçeriği
  if (status === 'success') {
    return (
      <ModalWrapper onClose={onClose}>
        <div className="flex flex-col items-center text-center p-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="mb-4 bg-green-50 p-3 rounded-full">
            <SuccessIcon />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Davet Gönderildi!</h3>
          <p className="text-sm text-gray-600 mb-6">
            <span className="font-medium text-gray-800">{email}</span> adresine davetiyeniz başarıyla iletildi. Kullanıcı onayladığında ekibinizde görünecektir.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-all"
          >
            Tamam
          </button>
        </div>
      </ModalWrapper>
    );
  }

  // Varsayılan / Yükleniyor / Hata Durumu İçeriği
  return (
    <ModalWrapper onClose={onClose}>

      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Ekip Üyesi Davet Et</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100">
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        <p className="text-sm text-gray-500 mb-4">
          Ekibinize katılmasını istediğiniz kişinin sisteme kayıtlı e-posta adresini giriniz.
        </p>

        {/* Hata Mesajı */}
        {status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium rounded-r-md flex items-center gap-2 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            {errorMessage}
          </div>
        )}

        {/* Input Alanı */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <MailIcon />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
            placeholder="ornek@ligsigorta.com"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-all bg-gray-50 focus:bg-white
                    ${status === 'error' ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200' : 'border-gray-200 focus:border-slate-500 focus:ring-1 focus:ring-slate-200'}
                `}
            disabled={status === 'loading'}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleInvite}
            disabled={status === 'loading' || !email}
            className="px-6 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {status === 'loading' ? <LoadingSpinner /> : 'Davet Gönder'}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

// Modal Dış Çerçevesi
const ModalWrapper = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-center backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans" onClick={onClose}>
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[450px] overflow-hidden zoom-in duration-200 relative" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

export default InviteTeamMemberModal;
