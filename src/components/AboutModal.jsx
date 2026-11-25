import { LOCATIONS } from '../data/locations.js';

export default function AboutModal({onClose}){
  return (
    <div className="scrim" onClick={(e)=>{ if(e.target===e.currentTarget)onClose(); }}>
      <div className="modal" role="dialog" aria-label="О проекте">
        <div className="m-head">
          <svg width="30" height="30" viewBox="0 0 32 32"><path d="M16 3 29 27H3Z" fill="none" stroke="#d8b36a" strokeWidth="2"/><circle cx="16" cy="19" r="3.4" fill="#ff5a2a"/></svg>
          <h2>Паспорт проекта</h2>
          <button className="p-x" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="m-body">
          <h3>Название</h3>
          <p><b>«Атлас Вварденфелла»</b> — интерактивная карта локаций The Elder Scrolls III: Morrowind (React + Vite).</p>
          <h3>Функция</h3>
          <ul>
            <li>Панорамируемая и масштабируемая SVG-карта: остров Вварденфелл, Солстейм (Bloodmoon) и материковые земли Tamriel Rebuilt (Аантирин, Тельваннис).</li>
            <li>{LOCATIONS.length} локаций в 12 категориях легенды: от даэдрических руин до имперских фортов; поиск, фильтры по типу/региону/источнику, сортировка, график по регионам, миникарта.</li>
            <li>Практический журнал путешественника: отметки «посещено», избранное, личные заметки — всё в localStorage, перенос через экспорт/импорт JSON, сохранённые виды карты.</li>
            <li>Добавление собственных меток из любых модов кликом по карте, редактирование и удаление с отменой.</li>
            <li>Живая интеграция с UESP MediaWiki API: при выборе локации подтягивается вводный абзац и иллюстрация из энциклопедии (с офлайн-фолбэком).</li>
          </ul>
          <h3>Внешние зависимости</h3>
          <table className="dep-table"><tbody>
            <tr><td>Фреймворк</td><td>React 18.3.1 + ReactDOM 18.3.1 (npm)</td></tr>
            <tr><td>Сборщик</td><td>Vite 6 + @vitejs/plugin-react 4 · <code>npm run dev</code> / <code>npm run build</code></td></tr>
            <tr><td>Внешнее API</td><td>UESP MediaWiki API — en.uesp.net/w/api.php (action=parse, CORS origin=*, AbortController + кэш)</td></tr>
            <tr><td>Библиотеки</td><td>Карта, график, панорама/зум, звук — собственная реализация на SVG/Canvas/Web Audio API, без сторонних библиотек</td></tr>
            <tr><td>Шрифты</td><td>Google Fonts: Cormorant (кириллица), IBM Plex Sans / Mono</td></tr>
            <tr><td>Хостинг</td><td>GitHub Pages через GitHub Actions (workflow в репозитории); base './' для подпапки репозитория</td></tr>
          </tbody></table>
          <h3>Wireframe интерфейса</h3>
          <svg className="wf" viewBox="0 0 560 300">
            <rect x="8" y="8" width="544" height="284" rx="10" fill="#181310" stroke="#3a2f20"/>
            <rect x="8" y="8" width="544" height="38" rx="10" fill="#241d13" stroke="#3a2f20"/>
            <text x="24" y="32" fill="#d8b36a" fontSize="13" fontFamily="IBM Plex Sans">Шапка: бренд · звук · тема · ＋локация · экспорт · о проекте</text>
            <rect x="8" y="46" width="150" height="246" fill="#1c1712" stroke="#3a2f20"/>
            <text x="20" y="70" fill="#b3a488" fontSize="11" fontFamily="IBM Plex Sans">Поиск / фильтры</text>
            <text x="20" y="92" fill="#b3a488" fontSize="11" fontFamily="IBM Plex Sans">Легенда (12 типов)</text>
            <text x="20" y="114" fill="#b3a488" fontSize="11" fontFamily="IBM Plex Sans">Отображение</text>
            <text x="20" y="136" fill="#b3a488" fontSize="11" fontFamily="IBM Plex Sans">График регионов</text>
            <text x="20" y="158" fill="#b3a488" fontSize="11" fontFamily="IBM Plex Sans">Виды · Список</text>
            <rect x="158" y="46" width="402" height="246" fill="#12242e" stroke="#3a2f20"/>
            <path d="M290 110 l40 -14 44 10 30 26 -8 42 -34 30 -52 6 -38 -24 -6 -40 Z" fill="#262620" stroke="#c9a86a"/>
            <circle cx="342" cy="152" r="12" fill="#3a1408" stroke="#ff5a2a"/>
            <text x="300" y="230" fill="#5f7d8c" fontSize="11" fontFamily="IBM Plex Sans">SVG-карта: drag / wheel / pinch</text>
            <rect x="440" y="56" width="26" height="80" rx="5" fill="#241d13" stroke="#3a2f20"/>
            <text x="430" y="152" fill="#b3a488" fontSize="9" fontFamily="IBM Plex Sans">зум-кластер</text>
            <rect x="466" y="226" width="84" height="56" rx="5" fill="#241d13" stroke="#3a2f20"/>
            <text x="478" y="258" fill="#b3a488" fontSize="10" fontFamily="IBM Plex Sans">миникарта</text>
            <rect x="420" y="46" width="140" height="170" fill="rgba(36,29,19,.9)" stroke="#d8b36a" strokeDasharray="4 3"/>
            <text x="432" y="70" fill="#d8b36a" fontSize="11" fontFamily="IBM Plex Sans">Панель деталей</text>
            <text x="432" y="88" fill="#b3a488" fontSize="10" fontFamily="IBM Plex Sans">(выезжает справа)</text>
          </svg>
          <h3>Управление</h3>
          <div className="keys">
            <span><kbd>drag</kbd>панорама</span><span><kbd>wheel</kbd>зум к курсору</span>
            <span><kbd>2×клик</kbd>приблизить</span><span><kbd>pinch</kbd>зум на тач-экране</span>
            <span><kbd>/</kbd>поиск</span><span><kbd>+</kbd><kbd>−</kbd>масштаб</span>
            <span><kbd>0</kbd>весь атлас</span><span><kbd>R</kbd>случайная локация</span>
            <span><kbd>←↑→↓</kbd>сдвиг карты</span><span><kbd>Esc</kbd>закрыть панели</span>
          </div>
          <h3>Как править данные</h3>
          <p>Ванильные и TR-точки — <b>src/data/locations.js</b>: строка <b>[en, ru, тип, регион, x, y, источник, описание]</b>. Категории/регионы/темы — <b>src/data/catalog.js</b>, берега — <b>src/data/geography.js</b>. Свои точки удобнее ставить кнопкой «＋ Локация».</p>
          <h3>Источники</h3>
          <p>Названия и справки: UESP Wiki (CC BY-SA). Очертания берегов — авторская стилизация; координаты приближённые, достаточные для навигации «по клеткам». Tamriel Rebuilt и Bloodmoon принадлежат их авторам; проект некоммерческий, учебный.</p>
        </div>
      </div>
    </div>
  );
}