// src/utils/userColors.js

// Tailwind renk paletleri (Arka plan ve Yazı rengi çiftleri)
const colors = [
    { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
    { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
    { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
    { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
    { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
    { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
];

/**
 * Kullanıcı ID'sine göre sabit bir renk stili döndürür.
 * @param {number|string} userId - Kullanıcı ID'si
 * @returns {object} { bg, text, border } renk sınıfları
 */
export const getUserColor = (userId) => {
    if (!userId) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    
    // ID'yi sayıya çevir
    const id = parseInt(userId, 10);
    
    // Modulo işlemi ile her ID için diziden sabit bir index bul
    // Örneğin: ID 5 ise ve 12 renk varsa, 5. rengi alır.
    // ID 17 ise (17 % 12 = 5) yine 5. rengi alır.
    const index = id % colors.length;
    
    return colors[index];
};
