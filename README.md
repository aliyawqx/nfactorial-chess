# VoiceChess ♞

**Шахматная платформа, которой можно играть голосом и без барьеров.**

> Проект для **nFactorial School**. Цель — не повторить lichess/chess.com, а сделать продукт с реальной нишей: **шахматы для незрячих, людей с ограничениями моторики и тех, кому удобнее говорить, чем кликать**.

---

## ⭐ Главное

**Уникальная ниша:** Web Speech API + Whisper-fallback + полная WCAG 2.1 AA-разметка. Это **underserved-рынок** — Lichess умеет частично, без поддержки казахского и со слабым UX для screen reader.

**Целевая аудитория:**
1. Незрячие и слабовидящие — режим, спроектированный под VoiceOver / NVDA / TalkBack.
2. Пользователи с ограничениями моторики — полная клавиатурная навигация и голосовое управление.
3. Казахоязычная аудитория — единственная платформа с распознаванием шахматных команд на казахском.
4. Те, кто хочет играть «как с человеком» — по голосу, без необходимости тыкать мышью.

---

## 🎯 Что уже работает

### ✅ Уровень «Сильный» (требования ТЗ)

| Требование | Реализация |
|---|---|
| **Игра против ИИ** | Stockfish 18 (lite single-thread WASM) прямо в браузере, 6 уровней от Новичка до Гроссмейстера |
| **История игр** | Все партии (vs AI, локальные) сохраняются в localStorage с PGN, FEN, продолжительностью |
| **Темы** | Светлая / тёмная / системная через `next-themes`, тема high-contrast в CSS variables |
| **Адаптивный дизайн** | Mobile-first, доска во весь экран на телефоне, sidebar на desktop |
| **Локализация** | UI на русском, английском, казахском |

### ✅ Уровень «Великий» — главные фичи

#### 🎙️ Голосовое управление на 3 языках
- Push-to-talk на пробеле, toggle-кнопка для tap-to-talk на мобильных.
- **Поддерживаемые форматы**:
  - 🇷🇺 «конь на эф три», «е четыре», «слон бьёт це пять», «короткая рокировка», «новая игра», «сдаюсь»
  - 🇬🇧 «knight to f3», «e4», «bishop takes c5», «castle kingside», «new game», «resign»
  - 🇰🇿 «ат f3-ке», «ат эф үш», «уәзір h5», «қысқа рокировка», «жаңа ойын», «берілемін»
- **Парсер**: regex + лемматизация + Levenshtein fuzzy match по легальным ходам.
- **Disambiguation**: при неоднозначности TTS-озвучивает «уточните».
- **Web Speech API** для ru/en, **Whisper API fallback** для kk.

#### 👁️ Полная accessibility (WCAG 2.1 AA)
- Доска: `role="grid"` + 64 `role="gridcell"` с `aria-label="e4, белая пешка"`.
- Roving tabindex, навигация стрелками + Enter/Esc + a-h/1-8 для прыжка по координатам + `M` для списка ходов.
- **Глобальный `<LiveRegion>`** — каждый ход озвучивается screen reader.
- Skip link, focus trap, `:focus-visible`, `prefers-reduced-motion`.
- **TTS-озвучка** ходов оппонента и ИИ на родном языке игрока.

#### ♟️ Stockfish 18 без сервера
- WASM-движок в Web Worker, single-thread версия (без COOP/COEP заморочек).
- 6 пресетов сложности (skill 1, 5, 10, 14, 18, 20).

### 🚧 В разработке (Phase 5–7 в roadmap)

- **Мультиплеер по ссылке** через Supabase Realtime (server-authoritative ordering).
- **AI Coach**: post-game analysis Stockfish + комментарии Claude Haiku 4.5.
- **Глобальный лидерборд** с фильтром по городам Казахстана.
- **Stripe Checkout** (Test Mode) для покупки кастомных скинов фигур.
- **Авторизация** через Supabase Auth.

---

## 🛠️ Стек

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 16 (App Router) + React 19 + TypeScript |
| Стили | Tailwind CSS v4 + design tokens в CSS variables |
| Шахматы | `chess.js` + `react-chessboard` + свой a11y-overlay |
| ИИ | `stockfish.wasm` 18 single-thread в Web Worker |
| Голос | Web Speech API + Whisper API fallback |
| i18n | Свой словарь для ru / en / kk |
| Иконки | `lucide-react` |
| Деплой | Vercel |

---

## 🚀 Запуск локально

```bash
git clone <repo-url>
cd nfactorial
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Опционально

#### Whisper для казахского голоса
```env
OPENAI_API_KEY=sk-...
```
Endpoint `/api/speech/transcribe` будет проксировать аудио в Whisper API.

#### Supabase для мультиплеера и облачной истории
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### Stripe Test Mode для скинов
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## ⌨️ Горячие клавиши

| Клавиша | Действие |
|---|---|
| `Стрелки` | Навигация по доске |
| `Enter` / `Space` на клетке | Выбрать / сделать ход |
| `Esc` | Отменить выбор |
| `a-h`, `1-8` | Прыжок по координате |
| `M` на клетке | Озвучить доступные ходы из этой клетки |
| `?` | Список горячих клавиш |
| `Space` вне клетки | **Push-to-talk** — удерживайте и говорите ход |

---

## 🎙️ Voice cookbook

**Ходы:**
- 🇷🇺 «е четыре», «конь эф три», «слон на бэ пять», «ферзь на аш пять», «короткая рокировка»
- 🇬🇧 «e4», «knight to f3», «bishop b5», «queen h5», «castle kingside»
- 🇰🇿 «е төрт», «ат f3-ке», «пиль b5-ке», «уәзір h5», «қысқа рокировка»

**Команды:**
- 🇷🇺 «новая игра», «сдаюсь», «отменить ход», «какие ходы»
- 🇬🇧 «new game», «resign», «undo», «what moves»
- 🇰🇿 «жаңа ойын», «берілемін», «болдырма», «қандай жүрістер»

---

## ♿ Accessibility-чеклист

- ✅ `role="grid"` + 8×8 `gridcell` с aria-label
- ✅ Roving tabindex
- ✅ Полная клавиатурная навигация
- ✅ `<LiveRegion>` для polite/assertive объявлений
- ✅ Skip link
- ✅ Focus visible с контрастом ≥ 3:1
- ✅ `prefers-reduced-motion` поддержка
- ✅ High contrast тема в CSS variables
- ✅ Локализация UI и a11y-объявлений на ru/en/kk
- 🚧 axe-core e2e тесты (Phase 8)
- 🚧 Видео-демо с VoiceOver (Phase 8)

---

## 🙏 Сделано с заботой о доступности

Этот проект — попытка показать, что современный веб может быть инклюзивным **с первого дня**, а не как «фича в roadmap».

— Сделано для **nFactorial School**, май 2026.
