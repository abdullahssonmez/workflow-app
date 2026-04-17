# Manuel Sunucu Yükleme Rehberi

Bu rehber, projenizi FileZilla kullanarak sunucunuza nasıl yükleyeceğinizi ve çalıştıracağınızı adım adım anlatır.

## Ön Hazırlık
Daha önce yapılan işlemlerle yerel bilgisayarınızda (local) frontend build alınmış ve ayarlar yapılmıştır. Hazır olan dosyalar:
- `client/dist` klasörü (Frontend dosyaları)
- `server` klasörü (Backend kodları)
- `ecosystem.config.js` (PM2 ayarı)
- `nginx.conf` (Sunucu ayarı)
- `.env.production` (Backend ayarları)

## Adım 1: FileZilla ile Dosya Transferi

1.  **FileZilla'yı açın** ve sunucunuza bağlanın (`IP: 104.247.173.246`, Kullanıcı: `root`).
2.  Sunucuda `/var/www` klasörüne gidin. Eğer yoksa oluşturun.
3.  `/var/www` içine `workflow-app` adında bir klasör oluşturun.
4.  **Dosyaları Yükleyin:**
    *   **Frontend**: Yerel bilgisayarınızdaki `client/dist` klasörünün **içindeki her şeyi**, sunucudaki `/var/www/workflow-app/dist` klasörüne yükleyin (Önce `dist` klasörü oluşturun).
    *   **Backend**: Yerel bilgisayarınızdaki `server` klasörünü, `/var/www/workflow-app/server` olarak yükleyin. (`node_modules` klasörünü yüklemeyin! Çok uzun sürer).
    *   **Konfigürasyon**: 
        *   `ecosystem.config.js` dosyasını `/var/www/workflow-app/ecosystem.config.js` konumuna atın.
        *   `.env.production` dosyasını `/var/www/workflow-app/server/.env` olarak yükleyin (Adını `.env` yapın).

**Dosya Yapısı Şöyle Olmalı:**
```
/var/www/workflow-app/
├── dist/               (Frontend dosyaları: index.html, assets vb.)
├── server/             (Backend dosyaları)
│   ├── src/
│   ├── .env            (Yüklediğiniz .env.production dosyası)
│   ├── package.json
│   └── ...
└── ecosystem.config.js
```

## Adım 2: Sunucu Kurulumu (Terminal / SSH)

SSH ile sunucuya bağlanın ve aşağıdaki komutları sırasıyla uygulayın:

1.  **Backend Kurulumu:**
    ```bash
    cd /var/www/workflow-app/server
    npm install
    ```

2.  **Uygulamayı Başlatma (PM2):**
    ```bash
    cd /var/www/workflow-app
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    ```

3.  **Nginx Ayarı:**
    *   Yerel bilgisayarınızda oluşturulan `nginx.conf` dosyasının içeriğini kopyalayın.
    *   Sunucuda dosyayı açın:
        ```bash
        nano /etc/nginx/sites-available/workflow-app
        ```
    *   Kopyaladığınız içeriği yapıştırın ve kaydedin (`CTRL+O`, `Enter`, `CTRL+X`).
    *   Ayarı aktif edin:
        ```bash
        ln -s /etc/nginx/sites-available/workflow-app /etc/nginx/sites-enabled/
        rm /etc/nginx/sites-enabled/default  # Varsayılan ayarı sil (Varsa)
        nginx -t  # Hata kontrolü
        systemctl restart nginx
        ```

## Tebrikler! 🎉
Artık tarayıcınızdan `http://104.247.173.246` adresine giderek uygulamanızı görebilirsiniz.
