import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    symbol: false,
    touched: false // YENİ: Kullanıcı etkileşimi başladı mı?
  });

  const [matchError, setMatchError] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (!validations.touched) setValidations(prev => ({ ...prev, touched: true }));

    if (name === 'password') {
      checkPasswordStrength(value);
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setMatchError(true);
      } else {
        setMatchError(false);
      }
    }

    if (name === 'confirmPassword') {
      if (formData.password && value !== formData.password) {
        setMatchError(true);
      } else {
        setMatchError(false);
      }
    }
  };

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
    const allRulesMet = Object.values(validations).every(Boolean);
    const passwordsMatch = !matchError && formData.confirmPassword !== '';
    const otherFieldsFilled = formData.firstName && formData.lastName && formData.email;

    if (allRulesMet && passwordsMatch && otherFieldsFilled) {
      setFormValid(true);
    } else {
      setFormValid(false);
    }
  }, [formData, validations, matchError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formValid) return;

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        // Modal'ı aç
        setShowSuccessModal(true);

        // Bekleme süresi 2 saniyeye (2000ms) düşürüldü
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error('Hata: ' + (data.error || 'Kayıt başarısız'));
      }
    } catch (err) {
      console.error(err);
      toast.error('Sunucu hatası!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-5xl shadow-2xl rounded-xl overflow-hidden bg-white h-auto md:h-[90vh]">

        {/* --- SOL TARAF --- */}
        <div className="hidden md:flex md:w-1/2 bg-gray-100 items-center justify-center p-8 relative">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aramıza Katılın</h2>
            <p className="text-gray-600 text-base">"Takım işbirliğinde yeni bir dönem başlıyor."</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-ligRed"></div>
        </div>

        {/* --- SAĞ TARAF --- */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-sm mx-auto w-full">

            <div className="flex justify-center mb-2">
              <img src={logo} alt="LIG Sigorta Logo" className="h-32 w-auto object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Hesap Oluştur</h2>
            <p className="text-center text-sm text-gray-600 mb-4">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-medium text-ligRed hover:text-ligRed-dark transition-colors">
                Giriş yapın
              </Link>
            </p>

            {/* FORM BAŞLANGICI: autoComplete="off" eklendi */}
            <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ad</label>
                  <input
                    type="text" name="firstName" onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-3 py-2 rounded-lg border outline-none text-sm transition-all ${
                      /* Hata varsa kırmızı, yoksa normal */
                      !formData.firstName && validations.touched ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-ligRed focus:ring-ligRed-light'
                      }`}
                  />
                  {!formData.firstName && validations.touched && <p className="text-[10px] text-red-500 mt-1">Zorunlu alan</p>}
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Soyad</label>
                  <input
                    type="text" name="lastName" onChange={handleChange}
                    autoComplete="off"
                    className={`w-full px-3 py-2 rounded-lg border outline-none text-sm transition-all ${!formData.lastName && validations.touched ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-ligRed focus:ring-ligRed-light'
                      }`}
                  />
                  {!formData.lastName && validations.touched && <p className="text-[10px] text-red-500 mt-1">Zorunlu alan</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">E-posta</label>
                {/* E-posta için autoComplete="off" */}
                <input
                  type="email" name="email" onChange={handleChange}
                  autoComplete="off"
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-sm transition-all ${(!formData.email || (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))) && validations.touched
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-ligRed focus:ring-ligRed-light'
                    }`}
                />
                {(!formData.email || (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))) && validations.touched && (
                  <p className="text-[10px] text-red-500 mt-1">{!formData.email ? 'Zorunlu alan' : 'Geçersiz e-posta formatı'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Şifre</label>
                {/* Şifre için autoComplete="new-password" (EN ÖNEMLİSİ BU) */}
                <input
                  type="password" name="password" onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-ligRed focus:ring-2 focus:ring-ligRed-light outline-none text-sm"
                />

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
                    {validations.symbol ? '✓' : '•'} Sembol (@$!%*?&.)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Şifre Tekrar</label>
                {/* Şifre Tekrar için de autoComplete="new-password" */}
                <input
                  type="password" name="confirmPassword" onChange={handleChange}
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 rounded-lg border outline-none text-sm transition-all
                    ${matchError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-ligRed focus:ring-ligRed-light'}
                  `}
                />
                {matchError && (
                  <p className="text-[10px] text-red-600 mt-1 font-bold">⚠️ Şifreler uyuşmuyor!</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!formValid}
                className={`w-full font-bold py-2.5 px-4 rounded-lg transition-all shadow-md mt-2 text-sm
                  ${formValid
                    ? 'bg-ligRed hover:bg-ligRed-dark text-white cursor-pointer transform hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              >
                Hesap Oluştur
              </button>
            </form>

            <p className="text-[10px] text-center text-gray-500 mt-2">
              Kayıt olarak <a href="#" className="text-ligRed underline">Kullanım Koşullarını</a> kabul etmiş olursunuz.
            </p>

          </div>
        </div>
      </div>
      {/* --- MİNİMAL BAŞARILI KAYIT MODALI (KIRMIZI ÇERÇEVE & YEŞİL TİK) --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
          <div className="bg-white w-[300px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-8 text-center border-t-4 border-ligRed relative overflow-hidden">

            {/* Canlı Yeşil Tik İkonu - Sade kırmızılığı kıran nokta */}
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">İşlem Tamamlandı!</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              Hesabınız başarıyla oluşturuldu.<br />
              <span className="font-medium text-gray-700">Yönlendiriliyorsunuz...</span>
            </p>

            {/* Alt Kısımda İnce İlerleme Çizgisi (Sekmeye devam eden efekt) */}
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

export default Register;
