import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); 

  // --- LOGIN STATELERİ ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // --- ŞİFREMİ UNUTTUM STATELERİ ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('idle');
  const [forgotMessage, setForgotMessage] = useState('');

  // --- ŞİFRE YENİLEME STATELERİ ---
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState('idle'); 
  const [resetMessage, setResetMessage] = useState('');

  // Validasyonlar
  const [validations, setValidations] = useState({
    length: false, upper: false, lower: false, number: false, symbol: false
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isResetFormValid, setIsResetFormValid] = useState(false);

  // --- URL KONTROLÜ ---
  useEffect(() => {
    const token = searchParams.get('resetToken');
    if (token) {
      setResetToken(token);
      setShowResetModal(true);
    }
  }, [searchParams]);

  // --- ŞİFRE KONTROLÜ ---
  const handlePasswordChange = (val) => {
    setNewPassword(val);
    setValidations({
      length: val.length >= 8,
      upper: /[A-Z]/.test(val),
      lower: /[a-z]/.test(val),
      number: /\d/.test(val),
      symbol: /[@$!%*?&.,]/.test(val)
    });
    setPasswordsMatch(val === confirmNewPassword);
  };

  const handleConfirmChange = (val) => {
    setConfirmNewPassword(val);
    setPasswordsMatch(val === newPassword);
  };

  useEffect(() => {
    const allRulesMet = Object.values(validations).every(Boolean);
    const match = newPassword === confirmNewPassword && newPassword !== '';
    setIsResetFormValid(allRulesMet && match);
  }, [validations, newPassword, confirmNewPassword]);

  // --- API FONKSİYONLARI ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.status === 200) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user)); 
        navigate('/'); 
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotStatus('loading');
    setForgotMessage('');
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      if (response.status === 200) {
        setForgotStatus('success');
        setForgotMessage(data.message);
      } else {
        setForgotStatus('error');
        setForgotMessage(data.error || 'Hata oluştu.');
      }
    } catch (err) {
      setForgotStatus('error');
      setForgotMessage('Sunucu hatası.');
    }
  };

  const handleResetSubmit = async () => {
    if (!isResetFormValid) return;
    setResetStatus('loading');
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword })
      });
      const data = await response.json();
      if (response.status === 200) {
        setResetStatus('success');
        setResetMessage(data.message);
        setTimeout(() => {
          setShowResetModal(false);
          setSearchParams({});
        }, 3000);
      } else {
        setResetStatus('error');
        setResetMessage(data.error || 'Hata oluştu.');
      }
    } catch (err) {
      setResetStatus('error');
      setResetMessage('Sunucu hatası.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      
      {/* --- ANA LOGIN KARTI --- */}
      <div className="flex w-full max-w-5xl shadow-2xl rounded-xl overflow-hidden bg-white h-auto md:h-[80vh] z-10">
        <div className="hidden md:flex md:w-1/2 bg-gray-100 items-center justify-center p-8 relative">
          <div className="text-center">
             <h2 className="text-2xl font-bold text-gray-800 mb-2">İş Akışınızı Hızlandırın</h2>
             <p className="text-gray-600 text-base">"LIG Sigorta ile projelerimizi %40 daha hızlı tamamlıyoruz."</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-ligRed"></div>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="LIG Sigorta Logo" className="h-32 w-auto object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Giriş Yap</h2>
            <p className="text-center text-sm text-gray-600 mb-6">
              Hesabınız yok mu? <Link to="/register" className="font-medium text-ligRed">Hemen kayıt olun</Link>
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-ligRed p-3 mb-4 rounded-r text-red-700 text-sm">
                <b>Hata:</b> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-ligRed focus:ring-2 focus:ring-ligRed-light outline-none transition-all text-sm"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Şifre</label>
                  <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-medium text-ligRed hover:text-ligRed-dark">
                    Şifremi unuttum?
                  </button>
                </div>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-ligRed focus:ring-2 focus:ring-ligRed-light outline-none transition-all text-sm"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-ligRed hover:bg-ligRed-dark text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md shadow-ligRed/20 text-sm mt-2">
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* --- MODAL 1: ŞİFREMİ UNUTTUM (MİNİMAL TASARIM) --- */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          {/* max-w-sm: Daha dar kutu, p-6: Daha az boşluk */}
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 relative">
            
            {/* Kapatma butonu biraz daha küçük */}
            <button onClick={() => setShowForgotModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            {forgotStatus === 'success' ? (
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">E-posta Gönderildi!</h3>
                <p className="text-gray-600 text-sm mb-4 leading-snug">{forgotMessage}</p>
                <button onClick={() => setShowForgotModal(false)} className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 rounded-lg text-sm transition-all">Tamam</button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Şifremi Unuttum</h3>
                <p className="text-gray-500 mb-5 text-xs">
                  Hesabınıza ait e-posta adresini girerek şifre yenileme bağlantısı alabilirsiniz.
                </p>

                {forgotStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p className="text-xs text-red-700 font-medium">{forgotMessage}</p>
                  </div>
                )}
                
                <form onSubmit={handleForgotSubmit}>
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                      E-posta Adresi
                    </label>
                    <input 
                      type="email" 
                      value={forgotEmail} 
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="ornek@ligsigorta.com" 
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-ligRed focus:ring-ligRed-light focus:ring-2 outline-none text-sm placeholder-gray-400 transition-all"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={forgotStatus === 'loading'}
                    className="w-full bg-ligRed hover:bg-ligRed-dark text-white font-bold py-2.5 rounded-lg shadow-md shadow-ligRed/20 disabled:opacity-70 text-sm transition-transform active:scale-[0.98]"
                  >
                    {forgotStatus === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Gönderiliyor
                      </span>
                    ) : 'Bağlantı Gönder'}
                  </button>
                  
                  <div className="mt-3 text-center">
                    <button type="button" onClick={() => setShowForgotModal(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                      Vazgeç
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 2: ŞİFRE YENİLEME (TOKEN İLE GELİNCE) --- */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in zoom-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 relative border-t-4 border-ligRed">
              
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Şifrenizi Yenileyin</h2>
              <p className="text-center text-gray-500 text-xs mb-5">Güvenliğiniz için yeni bir şifre belirleyin.</p>

              {resetStatus === 'success' ? (
                 <div className="text-center py-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Başarılı!</h3>
                    <p className="text-gray-600 text-sm mt-1">Şifreniz güncellendi.</p>
                 </div>
              ) : (
                <>
                  {resetStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-3 text-xs font-medium text-center">
                      {resetMessage}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <input 
                        type="password" 
                        placeholder="Yeni Şifre"
                        value={newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 focus:border-ligRed focus:ring-2 focus:ring-ligRed-light outline-none transition-all text-sm placeholder-gray-400"
                      />
                      <div className="mt-2 grid grid-cols-2 gap-1 px-1">
                        <span className={`text-[9px] ${validations.length ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {validations.length ? '✓' : '•'} En az 8 Karakter
                        </span>
                        <span className={`text-[9px] ${validations.upper ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {validations.upper ? '✓' : '•'} Büyük Harf
                        </span>
                        <span className={`text-[9px] ${validations.lower ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {validations.lower ? '✓' : '•'} Küçük Harf
                        </span>
                        <span className={`text-[9px] ${validations.number ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {validations.number ? '✓' : '•'} Rakam
                        </span>
                        <span className={`text-[9px] ${validations.symbol ? 'text-green-600 font-bold' : 'text-gray-400'}`}>
                          {validations.symbol ? '✓' : '•'} Sembol
                        </span>
                      </div>
                    </div>

                    <div>
                      <input 
                        type="password" 
                        placeholder="Şifreniz (Tekrar)"
                        value={confirmNewPassword}
                        onChange={(e) => handleConfirmChange(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-lg border outline-none text-sm transition-all placeholder-gray-400
                          ${!passwordsMatch && confirmNewPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-ligRed focus:ring-ligRed-light'}
                        `}
                      />
                    </div>

                    <button 
                      onClick={handleResetSubmit}
                      disabled={!isResetFormValid || resetStatus === 'loading'}
                      className={`w-full font-bold py-2.5 rounded-lg transition-all shadow-md mt-1 text-sm
                        ${isResetFormValid 
                          ? 'bg-ligRed hover:bg-ligRed-dark text-white cursor-pointer transform hover:scale-[1.02]' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                      `}
                    >
                      {resetStatus === 'loading' ? 'Güncelleniyor...' : 'Şifremi Yenile'}
                    </button>
                  </div>
                </>
              )}
           </div>
        </div>
      )}

    </div>
  );
};

export default Login;
