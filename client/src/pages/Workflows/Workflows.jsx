import React, { useState, useEffect } from 'react';
import AddStageModal from './AddStageModal';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { getUserColor } from "../../utils/userColors";

// --- SABİT SEÇENEKLER ---
const WORKFLOW_TYPES = [
  "OTOKAZA",
  "OTODIŞI-YANGIN",
  "SAĞLIK",
  "HASAR",
  "DASK",
  "TAHSİLAT",
  "DİĞER"
];

// --- İKONLAR ---
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-300 mx-2 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// Düzenle/Sil Menüsü İkonları
const EditMenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const DeleteMenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// --- SİLME MODALI ---
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full border-2 border-orange-300 bg-orange-50 mb-6">
          <span className="text-3xl text-orange-400 font-bold">!</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-3">Emin misiniz?</h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {message ? message : (
            <span>
              <span className="font-semibold text-gray-700">{title}</span> iş akışını silmek istediğinize emin misiniz?
            </span>
          )}
          <br />
          <span className="text-xs text-gray-400">Bu işlem geri alınamaz.</span>
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onConfirm} className="bg-[#1976D2] hover:bg-blue-700 text-white px-8 py-2.5 rounded-md text-sm font-medium transition-colors shadow-md">
            Evet
          </button>
          <button onClick={onClose} className="bg-[#607D8B] hover:bg-gray-600 text-white px-8 py-2.5 rounded-md text-sm font-medium transition-colors shadow-md">
            Hayır
          </button>
        </div>
      </div>
    </div>
  );
};

// --- BİLDİRİM ONAY MODALI (YENİ) ---
const NotificationRequestModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all scale-100 border border-blue-100">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full border-2 border-blue-300 bg-blue-50 mb-6">
          <span className="text-3xl text-blue-500">📩</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-3">Değişiklik Bildirilsin mi?</h3>
        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          Yaptığınız değişiklikler için müşteriye <strong>SMS</strong> ve/veya <strong>E-posta</strong> gönderilsin mi? (Yeni aşama eklenmiş gibi aynı metinle gönderilir)
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onConfirm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md flex-1"
          >
            Evet, Gönder
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-md flex-1"
          >
            Hayır, Sadece Kaydet
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
        >
          İptal Et
        </button>
      </div>
    </div>
  );
};

const Workflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [loading, setLoading] = useState(true);

  // --- YENİ EKLENECEKLER (State ve Handlerlar) ---
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeAssigneeMenuId, setActiveAssigneeMenuId] = useState(null);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  // Ekip verisini çek
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/team', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) setTeamMembers(data);
      } catch (error) { console.error("Hata:", error); }
    };
    fetchTeam();
  }, []);

  // Görevli Ekleme Fonksiyonu
  // Görevli Ekleme Fonksiyonu
  const handleAddAssigneeToWorkflow = async (workflowId, user) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/workflows/${workflowId}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId: user.id })
      });

      if (res.ok) {
        const updatedWorkflows = workflows.map(wf => {
          if (wf.id === workflowId) {
            // Güvenli dizi kontrolü: assignees null ise boş dizi kabul et
            const currentAssignees = wf.assignees || [];
            const exists = currentAssignees.find(u => u.id === user.id);

            if (!exists) {
              // Yeni kişiyi listeye ekle ve state'i güncelle
              return { ...wf, assignees: [...currentAssignees, user] };
            }
          }
          return wf;
        });
        setWorkflows(updatedWorkflows);

        // İşlem bitince menüyü ve aramayı kapat/temizle
        setActiveAssigneeMenuId(null);
        setAssigneeSearch('');
      }
    } catch (error) { console.error("Hata:", error); }
  };

  // Görevli Silme Fonksiyonu
  const handleRemoveAssigneeFromWorkflow = async (workflowId, userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/workflows/${workflowId}/assignees/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updatedWorkflows = workflows.map(wf => {
        if (wf.id === workflowId) {
          return { ...wf, assignees: wf.assignees.filter(u => u.id !== userId) };
        }
        return wf;
      });
      setWorkflows(updatedWorkflows);
    } catch (error) { console.error("Hata:", error); }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState(null);

  // YENİ: Modal'a gönderilecek ek bilgi (Oluşturan Kişi)
  const [activeWorkflowCreator, setActiveWorkflowCreator] = useState(null);

  // Düzenleme / Otomatik Doldurma State'i
  const [editingStage, setEditingStage] = useState(null);
  const [stageDefaults, setStageDefaults] = useState(null);

  // Menü State (Hangi stage'in menüsü açık)
  const [activeMenuStageId, setActiveMenuStageId] = useState(null);

  // Silme Modalı State'leri
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    type: null,
    title: '',
    message: ''
  });

  // YENİ: Bildirim Onay Modalı State'i
  const [notifModal, setNotifModal] = useState({
    isOpen: false,
    pendingStageData: null // Kullanıcı 'Evet'/'Hayır' diyene kadar veriyi burada tutacağız
  });

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  // --- YENİ: Kaydırma İşlemi İçin Location Hook'u ---
  const location = useLocation();

  // --- YENİ: OTOMATİK SCROLL İŞLEMİ ---
  useEffect(() => {
    // Eğer veriler yüklendiyse ve bildirimden (navigasyonla) bir target ID geldiyse
    if (!loading && workflows.length > 0 && location.state?.targetWorkflowId) {
      const targetId = location.state.targetWorkflowId;
      const element = document.getElementById(`workflow-${targetId}`);

      if (element) {
        // Hafif bir gecikme ile kaydır (Sayfanın tam yüklenmesini beklemek için)
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Dikkat çekmek için geçici olarak kenarlık ekle
          element.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
          }, 2000);
        }, 100);
      }
    }
  }, [loading, workflows, location.state]);

  // --- TIKLAMA İLE MENÜLERİ KAPATMA ---
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuStageId(null);
      setActiveAssigneeMenuId(null); // YENİ: Görevli menüsünü de kapat
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/workflows', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setWorkflows(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkflows(); }, []);

  // --- HANDLERS ---
  const handleAddWorkflow = async () => {
    if (!newWorkflowName.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newWorkflowName })
      });
      const newWf = await res.json();
      if (!newWf.stages) newWf.stages = [];
      if (!newWf.assignees) newWf.assignees = [];

      // DEĞİŞİKLİK BURADA: Yeni ekleneni listenin başına alıyoruz (spread operator order reversed)
      setWorkflows([newWf, ...workflows]);

      setNewWorkflowName('');
    } catch (error) { console.error("Hata:", error); }
  };

  const confirmDeleteWorkflow = (wf) => {
    setDeleteModal({ isOpen: true, id: wf.id, type: 'workflow', title: wf.title, message: null });
  };

  const confirmDeleteStage = (stage) => {
    setDeleteModal({
      isOpen: true,
      id: stage.id,
      type: 'stage',
      title: stage.title,
      message: <span><span className="font-semibold text-gray-700">{stage.title}</span> aşamasını silmek istediğinize emin misiniz?</span>
    });
  };

  const handleConfirmDelete = async () => {
    const { id, type } = deleteModal;
    if (!id) return;

    if (type === 'workflow') {
      try {
        await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
        setWorkflows(workflows.filter((wf) => wf.id !== id));
      } catch (error) { console.error("Silme hatası:", error); }
    } else if (type === 'stage') {
      try {
        await fetch(`/api/stages/${id}`, { method: 'DELETE' });
        const updatedWorkflows = workflows.map(wf => ({
          ...wf,
          stages: wf.stages.filter(s => s.id !== id)
        }));
        setWorkflows(updatedWorkflows);
      } catch (error) { console.error("Aşama silme hatası:", error); }
    }
    setDeleteModal({ isOpen: false, id: null, type: null, title: '', message: '' });
  };

  const startEditing = (wf) => { setEditingId(wf.id); setEditTitle(wf.title); };
  const saveEditing = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle })
      });
      setWorkflows(workflows.map((wf) => wf.id === id ? { ...wf, title: editTitle } : wf));
      setEditingId(null); setEditTitle('');
    } catch (error) { console.error("Hata:", error); }
  };

  // --- MODAL & STAGE CRUD ---

  const openAddStageModal = (workflowId) => {
    setActiveWorkflowId(workflowId);
    setEditingStage(null);

    const currentWorkflow = workflows.find(wf => wf.id === workflowId);

    if (currentWorkflow) {
      setActiveWorkflowCreator({
        name: currentWorkflow.creator_name,
        surname: currentWorkflow.creator_surname,
        createdAt: currentWorkflow.created_at
      });
    }

    // YENİ: Otomatik Doldurma Mantığı (Email ve Bildirim Tikleri Eklendi)
    if (currentWorkflow && currentWorkflow.stages && currentWorkflow.stages.length > 0) {
      const lastStage = currentWorkflow.stages[currentWorkflow.stages.length - 1];
      setStageDefaults({
        customerName: lastStage.customer_name || '',
        customerPhone: lastStage.customer_phone || '',
        customerEmail: lastStage.customer_email || '', // <--- YENİ
        sendSms: lastStage.is_sms_enabled || false,
        sendEmail: lastStage.is_email_enabled || false, // <--- YENİ
        assignees: lastStage.assignees || []
      });
    } else {
      setStageDefaults(null);
    }
    setIsModalOpen(true);
  };

  const handleEditStage = (stage, workflowId) => {
    setActiveWorkflowId(workflowId);
    setEditingStage(stage);

    const currentWorkflow = workflows.find(wf => wf.id === workflowId);
    if (currentWorkflow) {
      setActiveWorkflowCreator({
        name: currentWorkflow.creator_name,
        surname: currentWorkflow.creator_surname,
        createdAt: currentWorkflow.created_at
      });
    }

    setStageDefaults({
      stageName: stage.title,
      description: stage.description,
      customerName: stage.customer_name,
      customerPhone: stage.customer_phone,
      customerEmail: stage.customer_email, // <--- YENİ
      sendSms: stage.is_sms_enabled,
      sendEmail: stage.is_email_enabled, // <--- YENİ
      assignees: stage.assignees || []
    });
    setIsModalOpen(true);
  };

  const closeAddStageModal = () => {
    setIsModalOpen(false);
    setActiveWorkflowId(null);
    setEditingStage(null);
    setStageDefaults(null);
    setActiveWorkflowCreator(null);
  };

  const saveStageData = async (stageData, forceNotification = undefined) => {
    // 1. KONTROL: Eğer Düzenleme Modundaysak ve (SMS veya Email) seçiliyse ve Henüz Onay Alınmadıysa
    if (editingStage && (stageData.sendSms || stageData.sendEmail) && forceNotification === undefined) {
      // Modalı aç ve veriyi beklet
      setNotifModal({
        isOpen: true,
        pendingStageData: stageData
      });
      return; // İşlemi durdur, modal cevabını bekle
    }

    try {
      const token = localStorage.getItem('token');

      if (editingStage) {
        // PUT (Düzenleme)
        // forceNotification değerini de body'ye ekle
        const payload = { ...stageData, forceNotification: forceNotification === true };

        const res = await fetch(`/api/stages/${editingStage.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Güncelleme başarısız");

        const updatedStage = await res.json();

        const updatedWorkflows = workflows.map(wf => {
          if (wf.id === activeWorkflowId) {
            return {
              ...wf,
              stages: wf.stages.map(s => s.id === editingStage.id ? updatedStage : s)
            };
          }
          return wf;
        });
        setWorkflows(updatedWorkflows);

        // --- BİLDİRİM SONUÇLARINI KONTROL ET (UPDATE İÇİN DE ARTIK VAR) ---
        if (updatedStage.notifications) {
          const { email, sms } = updatedStage.notifications;
          let successMessages = [];
          let errorMessages = [];

          if (stageData.sendEmail) {
            if (email === 'success') successMessages.push("E-posta gönderildi");
            else if (email === 'error') errorMessages.push("E-posta gönderilemedi");
          }
          if (stageData.sendSms) {
            const isNetgsmSuccess = sms && (sms.startsWith('00') || sms.length > 5);
            if (isNetgsmSuccess) successMessages.push("SMS gönderildi");
            else if (sms) errorMessages.push(`SMS gönderilemedi (${sms})`);
          }

          if (errorMessages.length > 0) {
            const errorText = errorMessages.join(", ");
            const successText = successMessages.length > 0 ? ` (${successMessages.join(", ")} ✅)` : "";
            toast.error(`Güncelleme yapıldı ANCAK: ${errorText}. ${successText}`, { duration: 5000 });
          } else if (successMessages.length > 0) {
            toast.success(`Güncelleme yapıldı ve bildirim gönderildi.`, { duration: 4000 });
          } else {
            toast.success("Aşama güncellendi.");
          }
        } else {
          toast.success("Aşama güncellendi.");
        }

      } else {
        // POST (Yeni Ekleme)
        const payload = { workflow_id: activeWorkflowId, ...stageData };

        const res = await fetch('/api/stages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Ekleme başarısız");

        const responseData = await res.json();

        // --- BİLDİRİM SONUÇLARINI KONTROL ET VE UYARI VER ---
        if (responseData.notifications) {
          const { email, sms } = responseData.notifications;
          let successMessages = [];
          let errorMessages = [];

          // 1. Email Kontrolü
          if (stageData.sendEmail) {
            if (email === 'success') {
              successMessages.push("E-posta gönderildi");
            } else {
              errorMessages.push("E-posta gönderilemedi");
            }
          }

          // 2. SMS Kontrolü
          if (stageData.sendSms) {
            const isNetgsmSuccess = sms && (sms.startsWith('00') || sms.length > 5);
            if (isNetgsmSuccess) {
              successMessages.push("SMS gönderildi");
            } else {
              errorMessages.push(`SMS gönderilemedi (${sms || 'Bağlantı Hatası'})`);
            }
          }

          // Bildirim Göster
          if (errorMessages.length > 0) {
            // Hata varsa (Kısmi başarı veya tam başarısızlık)
            const errorText = errorMessages.join(", ");
            const successText = successMessages.length > 0 ? ` (${successMessages.join(", ")} ✅)` : "";
            toast.error(`Aşama kaydedildi ANCAK: ${errorText}. ${successText}`, { duration: 5000 });
          } else if (successMessages.length > 0) {
            // Sadece Başarılar
            toast.success(`Aşama kaydedildi: ${successMessages.join(" ve ")}.`, { duration: 4000 });
          } else {
            // Bildirim seçilmediyse veya sonuç yoksa standart mesaj
            toast.success("Aşama başarıyla kaydedildi.");
          }

        } else {
          toast.success("Aşama başarıyla kaydedildi.");
        }
        // ----------------------------------------------------

        const stageWithAssignees = {
          ...responseData,
          assignees: stageData.assignees || []
        };

        const updatedWorkflows = workflows.map((wf) => {
          if (wf.id === activeWorkflowId) {
            return { ...wf, stages: [...(wf.stages || []), stageWithAssignees] };
          }
          return wf;
        });
        setWorkflows(updatedWorkflows);
      }
      closeAddStageModal();
    } catch (error) {
      console.error("Kayıt hatası:", error);
      toast.error("İşlem sırasında bir hata oluştu.");
    }
  };

  // Onay Modalı Cevabı
  const handleNotifConfirm = (shouldSend) => {
    const data = notifModal.pendingStageData;
    setNotifModal({ isOpen: false, pendingStageData: null });
    // shouldSend -> true ise forceNotification: true
    saveStageData(data, shouldSend);
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;

  return (
    <div className="w-full h-full flex flex-col gap-6 relative">

      <NotificationRequestModal
        isOpen={notifModal.isOpen}
        onClose={() => setNotifModal({ isOpen: false, pendingStageData: null })}
        onConfirm={handleNotifConfirm}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
      />

      <AddStageModal
        isOpen={isModalOpen}
        onClose={closeAddStageModal}
        onSave={saveStageData}
        // Düzenleme modunda 'editingStage' verilerini kullan, yeni eklemede 'stageDefaults' (otomatik doldurma) kullan.
        initialData={
          editingStage
            ? { ...stageDefaults, title: editingStage.title, description: editingStage.description }
            : stageDefaults
        }
        // YENİ: Oluşturan bilgisini Modala prop olarak gönderiyoruz
        creatorInfo={activeWorkflowCreator}
      />

      <h1 className="text-xl font-bold text-gray-700">İş Akışları</h1>

      <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 flex items-center pr-2">
        <select
          value={newWorkflowName}
          onChange={(e) => setNewWorkflowName(e.target.value)}
          className="flex-1 px-4 py-2 bg-transparent outline-none text-sm text-gray-600 cursor-pointer"
        >
          <option value="" disabled>İş Akış Türü Seçiniz...</option>
          {WORKFLOW_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <button onClick={handleAddWorkflow} className="bg-[#D32F2F] hover:bg-red-800 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1 transition-colors">
          Ekle <PlusIcon />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            id={`workflow-${wf.id}`} // <--- BU SATIR EKLENDİ (Scroll için gerekli)
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative transition-all duration-300"
          >
            <button
              onClick={() => confirmDeleteWorkflow(wf)}
              className="absolute top-4 right-4 text-gray-300 hover:text-[#D32F2F] transition-colors bg-gray-50 hover:bg-red-50 rounded-full p-1"
            >
              <XIcon />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-4 h-8">
                {editingId === wf.id ? (
                  <div className="flex items-center gap-2 w-full max-w-[200px]">
                    <select
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveEditing(wf.id)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditing(wf.id)}
                      className="text-sm font-semibold text-gray-700 border-b border-blue-500 outline-none bg-transparent cursor-pointer w-full py-1"
                    >
                      {WORKFLOW_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold text-gray-800">{wf.title}</h2>
                    <div className="relative group flex items-center">
                      <button onClick={() => startEditing(wf)} className="text-blue-500 hover:text-blue-700 p-1">
                        <PencilIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {(!wf.stages || wf.stages.length === 0) && (
                <p className="text-gray-400 text-sm italic mb-6">Henüz hiçbir aşama yok.</p>
              )}

              {wf.stages && wf.stages.length > 0 && (
                <div className="flex items-center flex-wrap gap-y-4 mb-4">
                  {wf.stages.map((stage, index) => (
                    <React.Fragment key={stage.id}>

                      <div className="border border-gray-200 rounded-lg p-4 bg-white min-w-[180px] shadow-sm flex flex-col hover:border-blue-300 transition-colors relative group">
                        <div className="flex justify-between items-start mb-2 relative">
                          <span className="text-sm font-semibold text-gray-700">{stage.title}</span>

                          {/* --- 3 NOKTA MENÜSÜ --- */}
                          <div className="relative">
                            <div
                              className="text-gray-300 cursor-pointer hover:text-gray-600 p-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuStageId(activeMenuStageId === stage.id ? null : stage.id);
                              }}
                            >
                              ⋮
                            </div>

                            {/* AÇILIR MENÜ (DROPDOWN) - right-0 yerine left-0 yapıldı */}
                            {activeMenuStageId === stage.id && (
                              <div className="absolute left-0 top-6 w-32 bg-white rounded-md shadow-xl border border-gray-100 z-50 py-1 animate-in fade-in zoom-in-95">
                                <button
                                  onClick={() => handleEditStage(stage, wf.id)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                                >
                                  <EditMenuIcon /> Düzenle
                                </button>
                                <button
                                  onClick={() => confirmDeleteStage(stage)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center"
                                >
                                  <DeleteMenuIcon /> Sil
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                          </svg>
                          <span className="text-xs text-gray-500 font-medium">
                            {stage.description ? (stage.description.length > 20 ? stage.description.substring(0, 20) + '...' : stage.description) : 'Açıklama yok'}
                          </span>
                        </div>
                      </div>

                      {index < wf.stages.length - 1 && <ArrowRightIcon />}

                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* --- YENİ ALAN: FOOTER (Buton + Görevliler) --- */}
              <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">

                {/* SOL: Yeni Aşama Butonu */}
                <button
                  onClick={() => openAddStageModal(wf.id)}
                  className="bg-[#D32F2F] hover:bg-red-800 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors z-10 shadow-sm"
                >
                  Yeni Aşama <PlusIcon />
                </button>

                {/* SAĞ: Görevliler (Oluşturan + Assignees) */}
                <div className="flex items-center gap-1 relative">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase mr-2 tracking-wide">GÖREVLİLER</span>

                  {/* 1. OLUŞTURAN (Kilitli) */}
                  <div className="relative group cursor-default">
                    <div className={`w-8 h-8 rounded-full border-2 border-orange-200 flex items-center justify-center text-[10px] font-bold bg-orange-50 text-orange-600`}>
                      {wf.creator_name ? wf.creator_name[0] : '?'}{wf.creator_surname ? wf.creator_surname[0] : '?'}
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-[50] min-w-max">
                      <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow relative">
                        {wf.creator_name} {wf.creator_surname} <span className="opacity-70">(Oluşturan)</span>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>

                  {/* 2. EKİP (Silinebilir) */}
                  {wf.assignees && wf.assignees.map(user => {
                    const colorStyle = getUserColor(user.id);
                    return (
                      <div key={user.id} className="relative group cursor-pointer" onClick={() => handleRemoveAssigneeFromWorkflow(wf.id, user.id)}>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500`}>
                          <span className="group-hover:hidden">{user.first_name[0]}{user.last_name[0]}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4 hidden group-hover:block">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-[50] min-w-max">
                          <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow relative">
                            {user.first_name} {user.last_name}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* 3. EKLE BUTONU (Backdrop + Yukarı Açılan Menü + Tooltip) */}
                  <div className="relative">

                    {/* --- BACKDROP (Görünmez Perde) --- */}
                    {/* Menü açıkken arkayı kilitler */}
                    {activeAssigneeMenuId === wf.id && (
                      <div
                        className="fixed inset-0 z-[9998] cursor-default bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAssigneeMenuId(null);
                        }}
                      ></div>
                    )}

                    {/* BUTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAssigneeMenuId(activeAssigneeMenuId === wf.id ? null : wf.id);
                      }}
                      // Z-Index Mantığı: Menü açıksa en üstte (z-[9999]), kapalıysa normal (z-0)
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border relative group ${activeAssigneeMenuId === wf.id
                        ? 'z-[9999] bg-white border-blue-500 text-blue-600 shadow-md'
                        : 'z-0 bg-gray-100 hover:bg-gray-200 text-gray-500 border-gray-200'
                        }`}
                    >
                      <PlusIcon />

                      {/* TOOLTIP (Siyah Baloncuk) */}
                      {activeAssigneeMenuId !== wf.id && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-[50] min-w-max pointer-events-none">
                          <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow relative">
                            Görevli Ekle
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      )}
                    </button>

                    {/* AÇILIR KİŞİ MENÜSÜ (YUKARI VE İÇERİ AÇILIR) */}
                    {activeAssigneeMenuId === wf.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        // DÜZELTME BURADA: bottom-full (yukarı), right-0 (sağa yapışık ama sola doğru büyür)
                        className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 p-3 z-[9999] animate-in fade-in zoom-in-95 origin-bottom-right"
                      >
                        <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-gray-700">Ekip Üyesi Seç</span>
                          <button onClick={() => setActiveAssigneeMenuId(null)} className="text-gray-400 hover:text-red-500"><XIcon /></button>
                        </div>

                        <input
                          type="text"
                          placeholder="İsim ara..."
                          autoFocus
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 mb-2 transition-all"
                        />

                        <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                          {teamMembers
                            .filter(m => {
                              const isCreator = m.id === wf.creator_id;
                              const isAssigned = wf.assignees && wf.assignees.some(u => u.id === m.id);
                              const matchesSearch = `${m.first_name} ${m.last_name}`.toLowerCase().includes(assigneeSearch.toLowerCase());
                              return !isCreator && !isAssigned && matchesSearch;
                            })
                            .map(member => {
                              const colorStyle = getUserColor(member.id);
                              return (
                                <div
                                  key={member.id}
                                  onClick={() => handleAddAssigneeToWorkflow(wf.id, member)}
                                  className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-md cursor-pointer group transition-colors border border-transparent hover:border-blue-100"
                                >
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm ${colorStyle.bg} ${colorStyle.text}`}>
                                    {member.first_name[0]}{member.last_name[0]}
                                  </div>
                                  <span className="text-xs text-gray-700 font-medium group-hover:text-blue-700">
                                    {member.first_name} {member.last_name}
                                  </span>
                                </div>
                              );
                            })
                          }
                          {teamMembers.length === 0 && <div className="text-center py-2"><span className="text-[10px] text-gray-400">Ekip üyesi yok.</span></div>}
                          {teamMembers.length > 0 && teamMembers.filter(m => !wf.assignees.some(u => u.id === m.id) && m.id !== wf.creator_id).length === 0 && (
                            <div className="text-center py-2"><span className="text-[10px] text-gray-400">Herkes eklendi.</span></div>
                          )}
                        </div>

                        {/* Ok İşareti (Menünün altındaki küçük üçgen) */}
                        <div className="absolute top-full right-3 -mt-[5px] border-4 border-transparent border-t-white"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default Workflows;
