# Атлас Вварденфелла

Интерактивная карта локаций The Elder Scrolls III: Morrowind (React + Vite).
Вварденфелл, Солстейм (Bloodmoon), материк Tamriel Rebuilt; 12 категорий легенды,
поиск/фильтры/сортировка, личные отметки и заметки, свои метки из модов,
экспорт/импорт JSON, живое API UESP, миникарта, график по регионам, звук и пепел.

## Запуск
npm install
npm run dev        # http://localhost:5173
npm run build      # продакшен-сборка в dist/
npm run preview    # локальный просмотр сборки

## Деплой на GitHub Pages
В репозитории: Settings → Pages → Source: **GitHub Actions**.
Workflow `.github/workflows/deploy.yml` соберёт и опубликует `dist` при пуше в `main`.
`base: './'` в vite.config.js уже настроен для подпапки репозитория.

## Данные
- Локации: `src/data/locations.js` — строка `[en, ru, тип, регион, x, y, источник, описание]`
- Категории/регионы/темы: `src/data/catalog.js`
- Берега и география: `src/data/geography.js`
Свои точки удобнее ставить кнопкой «＋ Локация» в интерфейсе.

Паспорт проекта (название, функция, зависимости, wireframe) — кнопка «О проекте» в шапке.