import React, { useState } from 'react';
import toast from 'react-hot-toast';

// İKONLAR
const TeamIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-blue-600"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const LoadingSpinner = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

const RespondToInviteModal = ({ isOpen, onClose, notification, onActionComplete }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !notification) return null;

  const handleResponse = async (action) => {
    // action: 'accept' veya 'reject'
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/team/invite/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationId: notification.id,
          action: action
        })
      });

      if (response.ok) {
        // İşlem başarılıysa ana ekrana haber ver (listeyi yenilesin)
        toast.success("Davet yanıtlandı.");
        onActionComplete();
        onClose();
      } else {
        toast.error("İşlem sırasında bir hata oluştu.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex justify-center items-center backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden zoom-in duration-200 relative border border-gray-100">

        {/* Üst Kısım: Görsel */}
        <div className="bg-gradient-to-b from-blue-50 to-white p-8 flex flex-col items-center text-center border-b border-gray-50">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 ring-4 ring-blue-50">
            <TeamIcon />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Ekip Daveti</h3>
          <p className="text-sm text-gray-500 mt-2 px-4">
            <span className="font-semibold text-gray-700">{notification.message}</span>
          </p>
          <p className="text-xs text-gray-400 mt-4">Bu daveti kabul ederek ekibin verilerine erişim sağlayabileceksiniz.</p>
        </div>

        {/* Alt Kısım: Butonlar */}
        <div className="p-6 bg-white">
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse('reject')}
              disabled={loading}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 hover:text-gray-800 transition-all focus:scale-[0.98]"
            >
              Reddet
            </button>

            <button
              onClick={() => handleResponse('accept')}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all focus:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <LoadingSpinner /> : 'Kabul Et & Katıl'}
            </button>
          </div>

          <button onClick={onClose} className="w-full text-center text-xs text-gray-400 mt-4 hover:text-gray-600 transition-colors">
            Daha sonra karar ver
          </button>
        </div>

      </div>
    </div>
  );
};

export default RespondToInviteModal;
