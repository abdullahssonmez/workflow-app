import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100 border border-gray-100">
        
        {/* Ünlem İkonu */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full border-2 border-orange-100 bg-orange-50 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-orange-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
           {message}
        </p>

        <div className="flex justify-center gap-3">
           <button 
             onClick={onConfirm} 
             className={`${type === 'danger' ? 'bg-[#D32F2F] hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-2.5 rounded-full text-sm font-bold transition-colors shadow-md active:scale-95`}
           >
             Evet
           </button>
           <button 
             onClick={onClose} 
             className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-2.5 rounded-full text-sm font-bold transition-colors active:scale-95"
           >
             Hayır
           </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationModal;
