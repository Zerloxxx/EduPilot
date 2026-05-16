// ─── Answer normalization ─────────────────────────────────────────────────────
export function normalizeAnswer(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/−/g, '-')
    .toLowerCase()
}

// ─── SVG Figures ──────────────────────────────────────────────────────────────

// ЕГЭ Задание 1 — Планиметрия: хорда (AB=6, r=5, d=?)
const SVG_CIRCLE_CHORD = `<svg viewBox="0 0 165 155" xmlns="http://www.w3.org/2000/svg" width="165" height="155">
  <circle cx="80" cy="88" r="50" fill="rgba(124,58,237,0.06)" stroke="#9ca3af" stroke-width="2"/>
  <line x1="50" y1="48" x2="110" y2="48" stroke="#9ca3af" stroke-width="2.5"/>
  <circle cx="80" cy="88" r="3" fill="#a855f7"/>
  <line x1="80" y1="48" x2="80" y2="88" stroke="#a855f7" stroke-width="1.8" stroke-dasharray="5,3"/>
  <polyline points="87,48 87,55 80,55" fill="none" stroke="#9ca3af" stroke-width="1.3"/>
  <line x1="80" y1="88" x2="110" y2="48" stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="4,3"/>
  <text x="37" y="44" font-size="13" fill="#9ca3af" font-family="sans-serif">A</text>
  <text x="113" y="44" font-size="13" fill="#9ca3af" font-family="sans-serif">B</text>
  <text x="85" y="103" font-size="12" fill="#9ca3af" font-family="sans-serif">O</text>
  <text x="80" y="40" text-anchor="middle" font-size="11" fill="#6b7280" font-family="sans-serif">AB = 6</text>
  <text x="97" y="76" font-size="11" fill="#6b7280" font-family="sans-serif">r = 5</text>
  <text x="46" y="73" font-size="12" fill="#a855f7" font-family="sans-serif" font-weight="600">d = ?</text>
</svg>`

// ОГЭ Задание 14 — Прямоугольный треугольник: катеты 5 и 12, гипотенуза ?
const SVG_TRIANGLE_5_12 = `<svg viewBox="0 0 185 130" xmlns="http://www.w3.org/2000/svg" width="185" height="130">
  <polygon points="18,105 162,105 18,45" fill="rgba(59,130,246,0.07)" stroke="#9ca3af" stroke-width="2" stroke-linejoin="round"/>
  <polyline points="30,105 30,93 18,93" fill="none" stroke="#9ca3af" stroke-width="1.5"/>
  <text x="90" y="120" text-anchor="middle" font-size="13" fill="#9ca3af" font-family="sans-serif">12</text>
  <text x="4" y="79" font-size="13" fill="#9ca3af" font-family="sans-serif">5</text>
  <text x="104" y="72" font-size="14" fill="#a855f7" font-family="sans-serif" font-weight="600">?</text>
</svg>`

// ОГЭ Задание 16 — Трапеция: a=12, b=8, h=5
const SVG_TRAPEZOID = `<svg viewBox="0 0 170 120" xmlns="http://www.w3.org/2000/svg" width="170" height="120">
  <polygon points="20,100 140,100 120,48 40,48" fill="rgba(59,130,246,0.07)" stroke="#9ca3af" stroke-width="2" stroke-linejoin="round"/>
  <line x1="80" y1="100" x2="80" y2="48" stroke="#9ca3af" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="80" y="115" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">a = 12</text>
  <text x="80" y="40" text-anchor="middle" font-size="12" fill="#9ca3af" font-family="sans-serif">b = 8</text>
  <text x="86" y="80" font-size="11" fill="#a855f7" font-family="sans-serif">h = 5</text>
</svg>`

// ─── ЕГЭ · Математика (профиль) · Часть 1 · задания 1–12 ─────────────────────
// Структура ФИПИ 2025:
// 1-Планиметрия, 2-Векторы, 3-Стереометрия, 4-Вероятность (классич.),
// 5-Вероятность (теоремы), 6-Уравнения, 7-Вычисления, 8-Производная,
// 9-Прикладная, 10-Текстовая, 11-Графики, 12-Экстремум
const EGE_MATH_TASKS = [
  {
    id: 'em1', number: 1, topic: 'Планиметрия',
    text: 'Хорда **AB** окружности с радиусом **5** равна **6**. Найдите расстояние от центра окружности до хорды.',
    figure: SVG_CIRCLE_CHORD, answer: '4', hint: 'Введите число',
    explain: '$$d = \\sqrt{r^2 - \\left(\\tfrac{AB}{2}\\right)^2} = \\sqrt{25 - 9} = \\sqrt{16} = 4$$',
  },
  {
    id: 'em2', number: 2, topic: 'Векторы',
    text: 'Найдите скалярное произведение векторов $\\vec{a}(2;\\ {-1})$ и $\\vec{b}(3;\\ 4)$.',
    figure: null, answer: '2', hint: 'Введите число',
    explain: '$$\\vec{a}\\cdot\\vec{b} = 2\\cdot3 + (-1)\\cdot4 = 6 - 4 = 2$$',
  },
  {
    id: 'em3', number: 3, topic: 'Стереометрия',
    text: 'Объём цилиндра равен $48\\pi$, радиус основания равен **4**. Найдите высоту цилиндра.',
    figure: null, answer: '3', hint: 'Введите число',
    explain: '$$\\pi r^2 h = 48\\pi \\implies 16h = 48 \\implies h = 3$$',
  },
  {
    id: 'em4', number: 4, topic: 'Вероятность',
    text: 'В урне **4** белых и **6** чёрных шара. Один шар достают наугад. Найдите вероятность того, что он окажется **белым**.',
    figure: null, answer: '0.4', hint: 'Введите десятичную дробь',
    explain: '$$P = \\frac{4}{4 + 6} = \\frac{4}{10} = 0{,}4$$',
  },
  {
    id: 'em5', number: 5, topic: 'Вероятность',
    text: 'Вероятность дождя завтра равна **0,6**, вероятность ветра — **0,5**. События независимы. Найдите вероятность того, что завтра будет **и дождь, и ветер**.',
    figure: null, answer: '0.3', hint: 'Введите десятичную дробь',
    explain: '$$P(A \\cap B) = P(A)\\cdot P(B) = 0{,}6 \\cdot 0{,}5 = 0{,}3$$',
  },
  {
    id: 'em6', number: 6, topic: 'Простейшие уравнения',
    text: 'Решите уравнение:\n$$2^{x+1} = 16$$',
    figure: null, answer: '3', hint: 'Введите x',
    explain: '$$2^{x+1} = 2^4 \\implies x+1 = 4 \\implies x = 3$$',
  },
  {
    id: 'em7', number: 7, topic: 'Вычисления и преобразования',
    text: 'Найдите значение выражения:\n$$\\lg 2 + \\lg 500$$',
    figure: null, answer: '3', hint: 'Введите число',
    explain: '$$\\lg 2 + \\lg 500 = \\lg(2 \\cdot 500) = \\lg 1000 = 3$$',
  },
  {
    id: 'em8', number: 8, topic: 'Функции и производная',
    text: 'Найдите **точку максимума** функции:\n$$f(x) = -x^2 + 4x + 3$$',
    figure: null, answer: '2', hint: 'Введите x',
    explain: '$$f\'(x) = -2x + 4 = 0 \\implies x = 2$$\n\nПоскольку $f\'\'(2) = -2 < 0$, точка $x = 2$ — **максимум**.',
  },
  {
    id: 'em9', number: 9, topic: 'Задача с прикладным содержанием',
    text: 'Тариф такси: **150 рублей** за посадку и **15 рублей** за каждый километр пути. Сколько рублей стоит поездка длиной **12 км**?',
    figure: null, answer: '330', hint: 'Введите число',
    explain: '$$150 + 15 \\cdot 12 = 150 + 180 = 330 \\text{ рублей}$$',
  },
  {
    id: 'em10', number: 10, topic: 'Текстовая задача',
    text: 'Два туриста вышли **навстречу** друг другу одновременно. Расстояние между ними **24 км**. Скорость первого — **4 км/ч**, второго — **2 км/ч**. Через сколько часов они встретятся?',
    figure: null, answer: '4', hint: 'Введите число',
    explain: 'Сближаются со скоростью $4 + 2 = 6$ км/ч. Время встречи:\n$$t = \\frac{24}{6} = 4 \\text{ ч}$$',
  },
  {
    id: 'em11', number: 11, topic: 'Графики функций',
    text: 'Функция $f(x) = x^3 - 3x$. Найдите **количество** точек экстремума функции.',
    figure: null, answer: '2', hint: 'Введите число',
    explain: '$$f\'(x) = 3x^2 - 3 = 0 \\implies x^2 = 1 \\implies x = \\pm 1$$\n\n$x = -1$ — максимум, $x = 1$ — минимум. Итого **2** точки экстремума.',
  },
  {
    id: 'em12', number: 12, topic: 'Наименьшее значение функции',
    text: 'Найдите **наименьшее** значение функции:\n$$f(x) = x^2 - 6x + 10$$',
    figure: null, answer: '1', hint: 'Введите число',
    explain: '$$f(x) = (x-3)^2 + 1 \\geq 1$$\n\nМинимум при $x = 3$: $\\;f(3) = 9 - 18 + 10 = \\mathbf{1}$.',
  },
]

// ─── ОГЭ · Математика · Часть 1 · задания 1–20 ───────────────────────────────
// Структура ФИПИ 2025:
// 1-5 Практические задачи, 6 Числа и вычисления, 7 Неравенства,
// 8 Степени и корни, 9 Уравнения, 10 Вероятность, 11 Функции,
// 12 Прогрессии, 13 Неравенства, 14 Треугольники, 15 Окружности,
// 16 Четырёхугольники, 17-18 Геометрия, 19 Алгебраические выражения, 20 Текстовая
const OGE_MATH_TASKS = [
  {
    id: 'om1', number: 1, topic: 'Практическая задача',
    text: 'По карте масштаба **1 : 25 000** расстояние между двумя объектами равно **12 см**. Найдите расстояние между ними в **километрах**.',
    figure: null, answer: '3', hint: 'Введите число',
    explain: '$12 \\text{ см} \\times 25\\,000 = 300\\,000 \\text{ см} = 3 \\text{ км}$',
  },
  {
    id: 'om2', number: 2, topic: 'Практическая задача',
    text: 'Стоимость **1 кВт·ч** электроэнергии составляет **4,5 рубля**. За месяц потреблено **80 кВт·ч**. Сколько рублей нужно заплатить?',
    figure: null, answer: '360', hint: 'Введите число',
    explain: '$80 \\times 4{,}5 = 360$ рублей',
  },
  {
    id: 'om3', number: 3, topic: 'Практическая задача',
    text: 'На плане масштаба **1 : 200** площадь прямоугольной комнаты равна **18 см²**. Найдите реальную площадь комнаты в **квадратных метрах**.',
    figure: null, answer: '72', hint: 'Введите число',
    explain: '$18 \\times 200^2 \\text{ см}^2 = 18 \\times 40\\,000 = 720\\,000 \\text{ см}^2 = 72 \\text{ м}^2$',
  },
  {
    id: 'om4', number: 4, topic: 'Практическая задача',
    text: 'В **250 г** йогурта содержится **10 г** белка. Сколько граммов йогурта нужно съесть, чтобы получить **18 г** белка?',
    figure: null, answer: '450', hint: 'Введите число',
    explain: '$x = 250 \\cdot \\dfrac{18}{10} = 450$ г',
  },
  {
    id: 'om5', number: 5, topic: 'Практическая задача',
    text: 'Краска продаётся в банках по **0,5 кг**. Для покраски нужно **3,2 кг** краски. Сколько банок нужно купить (банки не делятся)?',
    figure: null, answer: '7', hint: 'Введите число',
    explain: '$3{,}2 \\div 0{,}5 = 6{,}4$ — нужно **7** банок (округляем вверх).',
  },
  {
    id: 'om6', number: 6, topic: 'Числа и вычисления',
    text: 'Найдите значение выражения:\n$$(-3)^2 - 2\\cdot(-3) + 1$$',
    figure: null, answer: '16', hint: 'Введите число',
    explain: '$9 - 2\\cdot(-3) + 1 = 9 + 6 + 1 = 16$',
  },
  {
    id: 'om7', number: 7, topic: 'Числовые неравенства',
    text: 'Найдите **наименьшее целое** число, удовлетворяющее неравенству:\n$$x > -2{,}7$$',
    figure: null, answer: '-2', hint: 'Введите целое число',
    explain: 'Наименьшее целое число, большее $-2{,}7$ — это $\\mathbf{-2}$.',
  },
  {
    id: 'om8', number: 8, topic: 'Вычисления (степени и корни)',
    text: 'Найдите значение выражения:\n$$\\sqrt{169} - 3^2$$',
    figure: null, answer: '4', hint: 'Введите число',
    explain: '$\\sqrt{169} = 13,\\quad 3^2 = 9,\\quad 13 - 9 = 4$',
  },
  {
    id: 'om9', number: 9, topic: 'Уравнения',
    text: 'Решите уравнение:\n$$2x - 7 = x + 4$$',
    figure: null, answer: '11', hint: 'Введите x',
    explain: '$2x - x = 4 + 7 \\implies x = 11$',
  },
  {
    id: 'om10', number: 10, topic: 'Вероятность',
    text: 'В классе **12** отличников из **30** учеников. Наугад вызывают одного ученика. Найдите вероятность того, что он отличник.',
    figure: null, answer: '0.4', hint: 'Введите десятичную дробь',
    explain: '$$P = \\frac{12}{30} = \\frac{2}{5} = 0{,}4$$',
  },
  {
    id: 'om11', number: 11, topic: 'Функции',
    text: 'Найдите **наименьшее** значение функции:\n$$f(x) = x^2 - 4x + 9$$',
    figure: null, answer: '5', hint: 'Введите число',
    explain: '$f(x) = (x - 2)^2 + 5 \\geq 5$. Минимум при $x = 2$: $f(2) = 4 - 8 + 9 = \\mathbf{5}$.',
  },
  {
    id: 'om12', number: 12, topic: 'Прогрессии',
    text: 'Первый член арифметической прогрессии равен **3**, разность равна **5**. Найдите **шестой** член прогрессии.',
    figure: null, answer: '28', hint: 'Введите число',
    explain: '$a_6 = a_1 + d\\cdot(n-1) = 3 + 5 \\cdot 5 = 28$',
  },
  {
    id: 'om13', number: 13, topic: 'Неравенства',
    text: 'Найдите количество **целых чисел**, являющихся решениями неравенства:\n$$-3 < x \\leq 2$$',
    figure: null, answer: '5', hint: 'Введите число',
    explain: 'Целые числа: $-2,\\;-1,\\;0,\\;1,\\;2$ — итого **5**. (Число $-3$ не входит, $2$ входит.)',
  },
  {
    id: 'om14', number: 14, topic: 'Треугольники',
    text: 'В прямоугольном треугольнике катеты равны **5** и **12**. Найдите гипотенузу.',
    figure: SVG_TRIANGLE_5_12, answer: '13', hint: 'Введите число',
    explain: '$$c = \\sqrt{5^2 + 12^2} = \\sqrt{25 + 144} = \\sqrt{169} = 13$$',
  },
  {
    id: 'om15', number: 15, topic: 'Окружности',
    text: 'Длина окружности равна $10\\pi$. Найдите **радиус** окружности.',
    figure: null, answer: '5', hint: 'Введите число',
    explain: '$C = 2\\pi r \\implies 10\\pi = 2\\pi r \\implies r = 5$',
  },
  {
    id: 'om16', number: 16, topic: 'Четырёхугольники',
    text: 'Основания трапеции равны **12** и **8**, высота равна **5**. Найдите **площадь** трапеции.',
    figure: SVG_TRAPEZOID, answer: '50', hint: 'Введите число',
    explain: '$$S = \\frac{a + b}{2} \\cdot h = \\frac{12 + 8}{2} \\cdot 5 = 10 \\cdot 5 = 50$$',
  },
  {
    id: 'om17', number: 17, topic: 'Четырёхугольники',
    text: 'Площадь прямоугольника равна **48**, одна его сторона равна **6**. Найдите **другую** сторону.',
    figure: null, answer: '8', hint: 'Введите число',
    explain: '$b = S \\div a = 48 \\div 6 = 8$',
  },
  {
    id: 'om18', number: 18, topic: 'Геометрия',
    text: 'Вписанный угол опирается на дугу, равную **120°**. Найдите величину вписанного угла в **градусах**.',
    figure: null, answer: '60', hint: 'Введите число',
    explain: 'Вписанный угол равен половине соответствующей дуги: $120^\\circ \\div 2 = 60^\\circ$.',
  },
  {
    id: 'om19', number: 19, topic: 'Алгебраические выражения',
    text: 'Найдите значение выражения $a^2 - b^2$ при $a = 7$, $b = 3$.',
    figure: null, answer: '40', hint: 'Введите число',
    explain: '$a^2 - b^2 = (a-b)(a+b) = 4 \\cdot 10 = 40$',
  },
  {
    id: 'om20', number: 20, topic: 'Текстовая задача',
    text: 'Велосипедист проехал **60 км** за **3 часа**. Найдите его среднюю скорость в **км/ч**.',
    figure: null, answer: '20', hint: 'Введите число',
    explain: '$v = s \\div t = 60 \\div 3 = 20$ км/ч',
  },
]

// ─── Заглушки ─────────────────────────────────────────────────────────────────
const EGE_CS_TASKS = Array.from({ length: 12 }, (_, i) => ({
  id: `ec${i+1}`, number: i+1, topic: 'Информатика',
  text: `Задание ${i+1} (ЕГЭ · Информатика). _Задания уточняются._`,
  figure: null, answer: `${i+1}`, hint: 'Введите ответ',
  explain: 'Разбор появится в следующем обновлении.',
}))

const OGE_CS_TASKS = Array.from({ length: 10 }, (_, i) => ({
  id: `oc${i+1}`, number: i+1, topic: 'Информатика',
  text: `Задание ${i+1} (ОГЭ · Информатика). _Задания уточняются._`,
  figure: null, answer: `${i+1}`, hint: 'Введите ответ',
  explain: 'Разбор появится в следующем обновлении.',
}))

const EGE_RU_TASKS = Array.from({ length: 12 }, (_, i) => ({
  id: `er${i+1}`, number: i+1, topic: 'Русский язык',
  text: `Задание ${i+1} (ЕГЭ · Русский язык). _Задания уточняются._`,
  figure: null, answer: `${i+1}`, hint: 'Введите ответ',
  explain: 'Разбор появится в следующем обновлении.',
}))

const OGE_RU_TASKS = Array.from({ length: 10 }, (_, i) => ({
  id: `or${i+1}`, number: i+1, topic: 'Русский язык',
  text: `Задание ${i+1} (ОГЭ · Русский язык). _Задания уточняются._`,
  figure: null, answer: `${i+1}`, hint: 'Введите ответ',
  explain: 'Разбор появится в следующем обновлении.',
}))

// ─── Конфигурация симуляций ───────────────────────────────────────────────────
export const EXAM_SIM = {
  ege_math: {
    title: 'ЕГЭ · Математика',
    subtitle: 'Часть 1 · задания 1–12',
    timeMinutes: 90,
    tasks: EGE_MATH_TASKS,
    isStub: false,
    color: '#7c3aed',
  },
  oge_math: {
    title: 'ОГЭ · Математика',
    subtitle: 'Часть 1 · задания 1–20',
    timeMinutes: 70,
    tasks: OGE_MATH_TASKS,
    isStub: false,
    color: '#7c3aed',
  },
  ege_cs: {
    title: 'ЕГЭ · Информатика',
    subtitle: 'Часть 1 · задания 1–12',
    timeMinutes: 55,
    tasks: EGE_CS_TASKS,
    isStub: true,
    color: '#10b981',
  },
  oge_cs: {
    title: 'ОГЭ · Информатика',
    subtitle: 'Часть 1 · задания 1–10',
    timeMinutes: 40,
    tasks: OGE_CS_TASKS,
    isStub: true,
    color: '#10b981',
  },
  ege_russian: {
    title: 'ЕГЭ · Русский язык',
    subtitle: 'Часть 1 · задания 1–12',
    timeMinutes: 55,
    tasks: EGE_RU_TASKS,
    isStub: true,
    color: '#3b82f6',
  },
  oge_russian: {
    title: 'ОГЭ · Русский язык',
    subtitle: 'Часть 1 · задания 1–10',
    timeMinutes: 40,
    tasks: OGE_RU_TASKS,
    isStub: true,
    color: '#3b82f6',
  },
}
