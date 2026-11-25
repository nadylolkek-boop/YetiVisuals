/* ============================================================
   Конфиг для GitHub Pages (статический сайт).

   Заполни свои значения и закоммить файл в репозиторий.
   При запуске через `node server.js` сервер отдаёт свой динамический
   конфиг, поэтому этот файл локально не мешает.
   ============================================================ */
window.YV_CONFIG = {
  mode: 'static',

  /* Supabase: Project URL и anon key из Settings → API */
  supabaseUrl: '',
  supabaseAnonKey: '',

  /* Google AdSense */
  adClient: '',
  adSlots: {
    'after-hero': '',
    'after-features': '',
    'after-how': '',
    'footer': '',
    'download-interstitial': ''
  },

  /* Ссылка на jar. Лучше всего — asset из GitHub Release. */
  jarUrl: 'downloads/yeti-visuals.jar',

  /* Сервис для получения IP при регистрации */
  ipService: 'https://api.ipify.org?format=json'
};
