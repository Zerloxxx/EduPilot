const sectionDefs = [
  { id: 'oge_m1', taskNumber: 1, emoji: '🧮', color: '#6366f1', label: 'Числа и вычисления', description: 'Дроби, десятичные, степени, проценты, корни', pointValue: 1 },
  { id: 'oge_m2', taskNumber: 2, emoji: '📐', color: '#7c3aed', label: 'Алгебраические выражения', description: 'Упрощение, подстановка, разложение на множители', pointValue: 1 },
  { id: 'oge_m3', taskNumber: 3, emoji: '⚖️', color: '#8b5cf6', label: 'Линейные уравнения', description: 'Решение линейных уравнений и уравнений, сводящихся к ним', pointValue: 1 },
  { id: 'oge_m4', taskNumber: 4, emoji: '🔢', color: '#a855f7', label: 'Квадратные уравнения', description: 'Дискриминант, теорема Виета, неполные квадратные уравнения', pointValue: 1 },
  { id: 'oge_m5', taskNumber: 5, emoji: '🔗', color: '#ec4899', label: 'Системы уравнений', description: 'Системы двух линейных уравнений с двумя переменными', pointValue: 1 },
  { id: 'oge_m6', taskNumber: 6, emoji: '↔️', color: '#f43f5e', label: 'Неравенства', description: 'Линейные неравенства и системы неравенств, числовые промежутки', pointValue: 1 },
  { id: 'oge_m7', taskNumber: 7, emoji: '📈', color: '#f97316', label: 'Функции и графики', description: 'Линейная, квадратичная, обратная пропорциональность', pointValue: 1 },
  { id: 'oge_m8', taskNumber: 8, emoji: '🎲', color: '#f59e0b', label: 'Вероятность', description: 'Классическая вероятность, сумма и произведение вероятностей', pointValue: 1 },
  { id: 'oge_m9', taskNumber: 9, emoji: '📏', color: '#eab308', label: 'Планиметрия: длины и углы', description: 'Теорема Пифагора, свойства углов, признаки подобия', pointValue: 1 },
  { id: 'oge_m10', taskNumber: 10, emoji: '🟦', color: '#84cc16', label: 'Планиметрия: площади', description: 'Площади треугольника, трапеции, параллелограмма, круга', pointValue: 1 },
  { id: 'oge_m11', taskNumber: 11, emoji: '⭕', color: '#22c55e', label: 'Окружность и круг', description: 'Длина окружности, площадь круга, вписанные и описанные фигуры', pointValue: 1 },
  { id: 'oge_m12', taskNumber: 12, emoji: '📦', color: '#10b981', label: 'Стереометрия', description: 'Объёмы куба, параллелепипеда, цилиндра, конуса, шара', pointValue: 1 },
  { id: 'oge_m13', taskNumber: 13, emoji: '📊', color: '#14b8a6', label: 'Статистика', description: 'Среднее значение, медиана, мода, размах, чтение диаграмм', pointValue: 1 },
  { id: 'oge_m14', taskNumber: 14, emoji: '🗺️', color: '#06b6d4', label: 'Координатная плоскость', description: 'Расстояние между точками, середина отрезка, уравнение прямой', pointValue: 1 },
  { id: 'oge_m15', taskNumber: 15, emoji: '📉', color: '#0ea5e9', label: 'Реальная математика: графики', description: 'Чтение и анализ графиков реальных зависимостей', pointValue: 1 },
  { id: 'oge_m16', taskNumber: 16, emoji: '🗓️', color: '#3b82f6', label: 'Реальная математика: таблицы', description: 'Извлечение информации из таблиц, расписаний, прайс-листов', pointValue: 1 },
  { id: 'oge_m17', taskNumber: 17, emoji: '💰', color: '#6366f1', label: 'Проценты и пропорции', description: 'Скидки, наценки, налоги, кредиты, курсы валют', pointValue: 1 },
  { id: 'oge_m18', taskNumber: 18, emoji: '🚗', color: '#7c3aed', label: 'Задачи на движение', description: 'Скорость, время, расстояние; встречное движение и догонялки', pointValue: 1 },
  { id: 'oge_m19', taskNumber: 19, emoji: '🏗️', color: '#8b5cf6', label: 'Задачи на работу и смеси', description: 'Совместная работа, концентрация раствора, сплавы', pointValue: 1 },
  { id: 'oge_m20', taskNumber: 20, emoji: '🔣', color: '#a855f7', label: 'Комбинаторика и логика', description: 'Перебор вариантов, подсчёт комбинаций, логические задачи', pointValue: 1 },
  { id: 'oge_m21', taskNumber: 21, emoji: '🧩', color: '#ec4899', label: 'Алгебра (часть 2)', description: 'Дробно-рациональные выражения, преобразования', pointValue: 2 },
  { id: 'oge_m22', taskNumber: 22, emoji: '📐', color: '#f43f5e', label: 'Геометрия (часть 2)', description: 'Доказательства, вычисление элементов фигур', pointValue: 2 },
  { id: 'oge_m23', taskNumber: 23, emoji: '🌍', color: '#f97316', label: 'Реальная математика (ч.2)', description: 'Практическая задача с экономическим или бытовым содержанием', pointValue: 2 },
  { id: 'oge_m24', taskNumber: 24, emoji: '🔬', color: '#f59e0b', label: 'Сложная алгебра', description: 'Уравнения и неравенства с параметром или нестандартным методом', pointValue: 3 },
  { id: 'oge_m25', taskNumber: 25, emoji: '🏆', color: '#eab308', label: 'Сложная геометрия', description: 'Планиметрическая задача с доказательством и вычислениями', pointValue: 3 },
];

const theoryRules = {
  1: [['Процент', 'X% от N = N * X / 100'], ['Степени', 'a^m * a^n = a^(m+n)'], ['Корень', 'sqrt(a^2) = a при a >= 0']],
  2: [['Подстановка', 'сначала подставь значение переменной, потом считай'], ['Скобки', 'a(b + c) = ab + ac'], ['Разность квадратов', 'a^2 - b^2 = (a - b)(a + b)']],
  3: [['Линейное уравнение', 'ax + b = c, значит x = (c - b) / a'], ['Проверка', 'подставь найденный x в исходное уравнение']],
  4: [['Дискриминант', 'D = b^2 - 4ac'], ['Корни', 'x = (-b ± sqrt(D)) / 2a'], ['Виет', 'x1 + x2 = -b/a, x1*x2 = c/a']],
  5: [['Сложение уравнений', 'складывай уравнения, если коэффициенты противоположны'], ['Подстановка', 'вырази одну переменную и подставь во второе уравнение']],
  6: [['Знак неравенства', 'при умножении на отрицательное число знак меняется'], ['Промежуток', 'x > a — точка пустая и луч вправо']],
  7: [['Линейная функция', 'y = kx + b'], ['Квадратичная функция', 'y = ax^2 + bx + c'], ['Обратная пропорциональность', 'y = k / x']],
  8: [['Классическая вероятность', 'P = число подходящих исходов / число всех исходов'], ['Противоположное событие', 'P(не A) = 1 - P(A)']],
  9: [['Пифагор', 'c^2 = a^2 + b^2'], ['Сумма углов треугольника', '180 градусов'], ['Подобие', 'соответственные стороны пропорциональны']],
  10: [['Треугольник', 'S = a*h/2'], ['Параллелограмм', 'S = a*h'], ['Трапеция', 'S = (a + b)*h/2'], ['Круг', 'S = pi*r^2']],
  11: [['Длина окружности', 'C = 2*pi*r'], ['Площадь круга', 'S = pi*r^2'], ['Вписанный угол', 'равен половине дуги, на которую опирается']],
  12: [['Параллелепипед', 'V = a*b*c'], ['Цилиндр', 'V = pi*r^2*h'], ['Конус', 'V = pi*r^2*h/3'], ['Шар', 'V = 4*pi*r^3/3']],
  13: [['Среднее', 'сумма значений / количество'], ['Медиана', 'середина упорядоченного ряда'], ['Размах', 'максимум - минимум']],
  14: [['Расстояние', 'sqrt((x2 - x1)^2 + (y2 - y1)^2)'], ['Середина', '((x1 + x2)/2; (y1 + y2)/2)']],
  15: [['График', 'читай подписи осей и единицы измерения'], ['Скорость изменения', 'изменение величины / изменение времени']],
  16: [['Таблица', 'сначала найди нужную строку и столбец'], ['Сумма покупки', 'цена * количество']],
  17: [['Скидка', 'новая цена = цена * (100 - p) / 100'], ['Наценка', 'новая цена = цена * (100 + p) / 100'], ['Пропорция', 'a/b = c/d']],
  18: [['Движение', 'S = v*t'], ['Встречное движение', 'скорости складываются'], ['Догоняние', 'скорости вычитаются']],
  19: [['Работа', 'A = p*t'], ['Совместная работа', 'производительности складываются'], ['Концентрация', 'масса вещества = масса раствора * процент / 100']],
  20: [['Правило умножения', 'если выборов a и b, всего a*b вариантов'], ['Перебор', 'фиксируй первый выбор и считай остальные']],
  21: [['Дробь', 'знаменатель не равен 0'], ['Сокращение', 'сокращай только множители, а не слагаемые']],
  22: [['Доказательство', 'указывай теорему и почему её можно применить'], ['Подобие', 'равные углы дают пропорции сторон']],
  23: [['Практическая задача', 'переведи текст в выражения и единицы'], ['Округление', 'проверяй, нужно ли округлять вверх']],
  24: [['Параметр', 'рассматривай особые случаи отдельно'], ['ОДЗ', 'сначала выпиши ограничения']],
  25: [['Сложная геометрия', 'делай чертёж и вводи обозначения'], ['Вспомогательная линия', 'часто помогает высота, медиана или радиус']],
};

const unique = (items) => [...new Set(items.map(String))];

function options(answer, wrong, seed) {
  const variants = unique([answer, ...wrong]).slice(0, 4);
  while (variants.length < 4) variants.push(String(Number(answer) + variants.length + seed));
  const shift = seed % 4;
  const rotated = variants.map((_, i) => variants[(i + shift) % 4]);
  return { options: rotated, correct: rotated.indexOf(String(answer)) };
}

function makeTask(id, text, answer, wrong, seed, steps, tip) {
  const packed = options(answer, wrong, seed);
  return {
    id,
    text,
    options: packed.options,
    correct: packed.correct,
    explanation: {
      error: 'Частая ошибка — пропустить одно действие или перепутать правило знаков.',
      steps,
      tip,
    },
  };
}

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function frac(a, b) {
  const d = gcd(a, b);
  return `${a / d}/${b / d}`;
}

function mathTask(section, level, n) {
  const id = `${section.id}_l${level}_t${n}`;
  const a = level + n + 2;
  const b = level * 2 + n + 3;
  const c = level + n + 5;
  const seed = section.taskNumber * 17 + level * 5 + n;

  switch (section.taskNumber) {
    case 1: {
      const base = 80 + 20 * n + 10 * level;
      const p = 5 * (level + n);
      const answer = (base * p) / 100;
      return makeTask(id, `Найдите ${p}% от числа ${base}.`, answer, [answer + p, answer - level, base - answer], seed, [`${p}% = ${p}/100`, `${base} * ${p} / 100 = ${answer}`, 'Проверь, что ответ меньше исходного числа при проценте меньше 100.'], 'Процент всегда удобно превращать в дробь со знаменателем 100.');
    }
    case 2: {
      const x = level + n;
      const answer = a * x + b;
      return makeTask(id, `Найдите значение выражения ${a}x + ${b} при x = ${x}.`, answer, [answer + a, answer - b, a + x + b], seed, [`Подставляем x = ${x}`, `${a} * ${x} + ${b} = ${answer}`, 'Сначала умножение, потом сложение.'], 'При подстановке не забывай порядок действий.');
    }
    case 3: {
      const x = level + n + 1;
      const right = a * x + b;
      return makeTask(id, `Решите уравнение ${a}x + ${b} = ${right}.`, x, [x + 1, x - 1, right - b], seed, [`Переносим ${b}: ${a}x = ${right - b}`, `Делим на ${a}: x = ${x}`, 'Проверяем подстановкой.'], 'Сначала убери свободный член, потом дели на коэффициент.');
    }
    case 4: {
      const r1 = level + n;
      const r2 = r1 + 2;
      return makeTask(id, `Уравнение имеет вид (x - ${r1})(x - ${r2}) = 0. Найдите больший корень.`, r2, [r1, r1 + r2, r2 - r1], seed, [`Произведение равно нулю, если один множитель равен нулю.`, `x = ${r1} или x = ${r2}`, `Больший корень: ${r2}.`], 'В разложенном квадратном уравнении корни читаются из множителей.');
    }
    case 5: {
      const x = level + n + 2;
      const y = n + 1;
      return makeTask(id, `Решите систему: x + y = ${x + y}, x - y = ${x - y}. Найдите x.`, x, [y, x + y, x - y], seed, ['Сложим уравнения.', `2x = ${(x + y) + (x - y)}`, `x = ${x}.`], 'Если в системе есть x+y и x-y, сложение сразу убирает y.');
    }
    case 6: {
      const x = level + n + 1;
      const right = a * x + b;
      return makeTask(id, `Решите неравенство ${a}x + ${b} > ${right}.`, `x > ${x}`, [`x < ${x}`, `x > ${x + 1}`, `x < ${x - 1}`], seed, [`${a}x > ${right - b}`, `x > ${x}`, 'Знак не меняется, потому что делим на положительное число.'], 'Следи, на какое число делишь: знак меняется только при отрицательном.');
    }
    case 7: {
      const x = n + level;
      const answer = a * x + b;
      return makeTask(id, `Для функции y = ${a}x + ${b} найдите y при x = ${x}.`, answer, [answer + b, answer - a, a + b + x], seed, [`Подставляем x = ${x}`, `y = ${a} * ${x} + ${b}`, `y = ${answer}.`], 'Координата точки на графике находится обычной подстановкой.');
    }
    case 8: {
      const good = level + n;
      const total = good + c;
      const answer = frac(good, total);
      return makeTask(id, `В коробке ${good} красных и ${c} синих шаров. Какова вероятность достать красный шар?`, answer, [frac(c, total), frac(good, c), `${good}/${good + total}`], seed, [`Всего шаров: ${good} + ${c} = ${total}`, `Благоприятных исходов: ${good}`, `P = ${answer}.`], 'Вероятность — это благоприятные исходы, делённые на все исходы.');
    }
    case 9: {
      const leg1 = 3 + level + n;
      const leg2 = 4 + level + n;
      const hyp = Math.round(Math.sqrt(leg1 * leg1 + leg2 * leg2));
      const answer = leg1 === 3 && leg2 === 4 ? 5 : Math.sqrt(leg1 * leg1 + leg2 * leg2).toFixed(1);
      return makeTask(id, `Катеты прямоугольного треугольника равны ${leg1} и ${leg2}. Найдите гипотенузу с точностью до 0.1.`, answer, [hyp, leg1 + leg2, Math.abs(leg2 - leg1)], seed, [`c^2 = ${leg1}^2 + ${leg2}^2`, `c = sqrt(${leg1 * leg1 + leg2 * leg2})`, `c ≈ ${answer}.`], 'В прямоугольном треугольнике ищи Пифагора.');
    }
    case 10: {
      const answer = (a * b) / 2;
      return makeTask(id, `Основание треугольника равно ${a}, высота к нему равна ${b}. Найдите площадь.`, answer, [a * b, answer + a, answer + b], seed, [`S = a*h/2`, `S = ${a} * ${b} / 2`, `S = ${answer}.`], 'У треугольника площадь в два раза меньше произведения основания на высоту.');
    }
    case 11: {
      const r = level + n + 2;
      const answer = 3 * r * r;
      return makeTask(id, `Найдите площадь круга радиуса ${r}, если pi принять равным 3.`, answer, [6 * r, answer + r, 3 * r], seed, [`S = pi*r^2`, `S = 3 * ${r}^2`, `S = ${answer}.`], 'Не путай площадь круга с длиной окружности.');
    }
    case 12: {
      const answer = a * b * c;
      return makeTask(id, `Измерения прямоугольного параллелепипеда: ${a}, ${b}, ${c}. Найдите объём.`, answer, [a * b + c, answer / a, a + b + c], seed, [`V = a*b*c`, `V = ${a} * ${b} * ${c}`, `V = ${answer}.`], 'Объём прямоугольного параллелепипеда — произведение трёх измерений.');
    }
    case 13: {
      const values = [a, b, c, a + b, c + level];
      const answer = values.reduce((sum, value) => sum + value, 0) / values.length;
      return makeTask(id, `Найдите среднее арифметическое чисел ${values.join(', ')}.`, answer, [answer + 1, answer - 1, Math.max(...values)], seed, ['Складываем все числа.', `Делим сумму на ${values.length}.`, `Получаем ${answer}.`], 'Среднее — это не середина ряда, а сумма, делённая на количество.');
    }
    case 14: {
      const x1 = n;
      const y1 = level;
      const x2 = n + 6;
      const y2 = level + 8;
      const answer = 10;
      return makeTask(id, `Найдите расстояние между точками A(${x1}; ${y1}) и B(${x2}; ${y2}).`, answer, [8, 12, 14], seed, ['Разности координат: 6 и 8.', 'Расстояние = sqrt(6^2 + 8^2).', 'sqrt(100) = 10.'], 'Пара 6-8-10 часто встречается в координатных задачах.');
    }
    case 15:
    case 16:
    case 23: {
      const price = 100 + 20 * n;
      const count = level + 2;
      const answer = price * count;
      return makeTask(id, `По таблице цена одного билета ${price} рублей. Сколько стоят ${count} таких билета?`, answer, [price + count, answer + price, answer - price], seed, [`Цена умножается на количество.`, `${price} * ${count} = ${answer}`, 'Проверь единицы измерения.'], 'В практических задачах сначала найди нужные данные в тексте.');
    }
    case 17: {
      const price = 200 + 50 * n;
      const discount = 10 + level * 5;
      const answer = price * (100 - discount) / 100;
      return makeTask(id, `Товар стоит ${price} рублей. После скидки ${discount}% найдите новую цену.`, answer, [price - discount, price + discount, price * discount / 100], seed, [`Остаётся ${100 - discount}% цены.`, `${price} * ${100 - discount} / 100 = ${answer}`, 'Это новая цена, а не размер скидки.'], 'При скидке важно отличать новую цену от суммы скидки.');
    }
    case 18: {
      const speed = 40 + 5 * level;
      const time = n + 1;
      const answer = speed * time;
      return makeTask(id, `Автомобиль ехал ${time} ч со скоростью ${speed} км/ч. Какое расстояние он проехал?`, answer, [speed + time, speed / time, answer + speed], seed, [`S = v*t`, `S = ${speed} * ${time}`, `S = ${answer} км.`], 'Скорость умножаем на время, если единицы согласованы.');
    }
    case 19: {
      const first = level + 2;
      const second = n + 3;
      const answer = first + second;
      return makeTask(id, `Первая труба наполняет ${first} л/мин, вторая — ${second} л/мин. Сколько литров поступит за 1 минуту при совместной работе?`, answer, [first * second, Math.abs(second - first), answer + 1], seed, ['При совместной работе производительности складываются.', `${first} + ${second} = ${answer}`, 'Время равно 1 минуте.'], 'В задачах на работу складывай скорости выполнения работы.');
    }
    case 20: {
      const shirts = level + 2;
      const pants = n + 2;
      const answer = shirts * pants;
      return makeTask(id, `У ученика ${shirts} рубашки и ${pants} пары брюк. Сколько разных комплектов можно составить?`, answer, [shirts + pants, answer - shirts, answer + pants], seed, [`Для каждой рубашки есть ${pants} выбора.`, `Всего ${shirts} * ${pants}`, `Ответ: ${answer}.`], 'Если выборы независимы, используй правило умножения.');
    }
    case 21:
    case 24: {
      const x = level + n + 1;
      const answer = a / (x + b);
      return makeTask(id, `Найдите значение дроби ${a}/(x + ${b}) при x = ${x}. Ответ округлите до 0.01.`, answer.toFixed(2), [(a / x).toFixed(2), (a / b).toFixed(2), (x / (a + b)).toFixed(2)], seed, [`Знаменатель: ${x} + ${b} = ${x + b}`, `Дробь: ${a}/${x + b}`, `Получаем ${answer.toFixed(2)}.`], 'В дробно-рациональных выражениях сначала считай знаменатель.');
    }
    case 22:
    case 25: {
      const k = level + 1;
      const side = n + 3;
      const answer = side * k;
      return makeTask(id, `Два подобных треугольника имеют коэффициент подобия ${k}. Сторона меньшего равна ${side}. Найдите соответствующую сторону большего.`, answer, [side + k, side * k + k, side / k], seed, [`Соответственные стороны пропорциональны.`, `Большая сторона = ${side} * ${k}`, `Ответ: ${answer}.`], 'В подобных фигурах длины умножаются на коэффициент подобия.');
    }
    default:
      return makeTask(id, `Решите задачу по теме «${section.label}»: найдите ${a} + ${b}.`, a + b, [a * b, a - b, b - a], seed, [`Складываем ${a} и ${b}.`, `Получаем ${a + b}.`, 'Сравни с вариантами ответа.'], 'Начинай с простого действия, которое прямо следует из условия.');
  }
}

function makeTheory(section) {
  const rules = theoryRules[section.taskNumber] || [['Правило', section.description]];
  return {
    title: `Задание №${section.taskNumber} — ${section.label}`,
    intro: `В этом задании ОГЭ проверяется тема «${section.label.toLowerCase()}». Обычно нужно аккуратно прочитать условие, выбрать нужное правило и выполнить одно или несколько вычислений без потери единиц измерения.`,
    blocks: [
      {
        type: 'formulas',
        title: ' Формулы / Правила',
        items: rules.map(([label, formula]) => ({ label, formula })),
      },
      {
        type: 'remember',
        title: ' Важно запомнить',
        items: [
          'Сначала выписывай данные из условия, затем выбирай формулу.',
          'Проверяй порядок действий и знак ответа.',
          'Если задача практическая, следи за единицами измерения.',
        ],
      },
      {
        type: 'notes',
        title: ' Запиши в конспект',
        items: [
          `Ключевые формулы по теме «${section.label}».`,
          'Типичные ошибки: неверный знак, лишнее округление, перепутанная формула.',
          'Короткий алгоритм решения: данные → правило → вычисление → проверка.',
        ],
      },
    ],
  };
}

function makeLevels(section) {
  return [
    { index: 0, theory: makeTheory(section) },
    ...[1, 2, 3, 4, 5].map((level) => ({
      index: level,
      tasks: [1, 2, 3, 4, 5].map((n) => mathTask(section, level, n)),
    })),
  ];
}

export default sectionDefs.map((section) => ({
  ...section,
  levels: makeLevels(section),
}));
