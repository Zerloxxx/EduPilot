const levelNames = ['Теория', 'Легко', 'Легко+', 'Средне', 'Сложно', 'Зачёт']

function pickOptions(answer, wrong, shift) {
  const base = [answer, ...wrong].map(String)
  const offset = shift % base.length
  const options = [...base.slice(offset), ...base.slice(0, offset)]
  return { options, correct: options.indexOf(String(answer)) }
}

function explanation(error, steps, tip) {
  return { error, steps, tip }
}

function theory(title, intro, formulas, remember, notes) {
  return {
    title,
    intro,
    blocks: [
      { type: 'formulas', title: 'Формулы', items: formulas },
      { type: 'remember', title: 'Важно запомнить', items: remember },
      { type: 'notes', title: 'Запиши', items: notes },
    ],
  }
}

function task(id, text, answer, wrong, error, steps, tip, shift) {
  const picked = pickOptions(answer, wrong, shift)
  return {
    id,
    text,
    options: picked.options,
    correct: picked.correct,
    explanation: explanation(error, steps.map(String), tip),
  }
}

function makeSection({ id, taskNumber, label, emoji, description, color, theoryData, makeTasks }) {
  return {
    id,
    taskNumber,
    label,
    emoji,
    description,
    color,
    levels: [
      { index: 0, theory: theory(...theoryData) },
      ...[1, 2, 3, 4, 5].map(level => ({
        index: level,
        tasks: makeTasks(level).map((item, index) => task(
          `${id.replace('_', '')}_l${level}_t${index + 1}`,
          item.text,
          item.answer,
          item.wrong,
          item.error,
          item.steps,
          item.tip,
          level + index
        )),
      })),
    ],
  }
}

const sections = [
  makeSection({
    id: 'cs_1',
    taskNumber: 1,
    label: 'Кодирование информации',
    emoji: '💾',
    description: 'Формула N=2^i, объём текста V=K*i',
    color: '#6366f1',
    theoryData: [
      'Задание №1 — Кодирование информации',
      'В таких задачах считают, сколько бит нужно для кодирования символов и какой объём занимает сообщение. Важно не путать количество символов, количество бит на символ и итоговый объём.',
      [
        { label: 'Мощность алфавита', formula: 'N = 2^i' },
        { label: 'Объём текста', formula: 'V = K * i' },
        { label: 'Перевод', formula: '1 байт = 8 бит' },
      ],
      ['Каждый бит удваивает число возможных символов.', 'Сначала считай в битах, потом переводи в байты.', '2^8 = 256 — частая база для кодировки.'],
      ['Степени двойки до 2^10.', 'Формулы N=2^i и V=K*i.', 'Перевод битов в байты.'],
    ],
    makeTasks: level => {
      const bits = [level + 3, level + 4, level + 5, level + 6, level + 7]
      return bits.map((b, index) => {
        const symbols = 2 ** b
        const count = (index + 2) * 40 + level * 10
        const bytes = (count * 8) / 8
        return index % 2 === 0
          ? {
              text: `Для кодирования одного символа используют ${b} бит. Сколько разных символов можно закодировать?`,
              answer: symbols,
              wrong: [symbols / 2, symbols + b, symbols * 2],
              error: 'Типичная ошибка — умножить число бит на 2 вместо возведения двойки в степень.',
              steps: [`Используем формулу N=2^i.`, `Подставляем i=${b}.`, `Получаем N=${symbols}.`],
              tip: 'Если спрашивают число вариантов, почти всегда нужна степень двойки.',
            }
          : {
              text: `Сообщение содержит ${count} символов, каждый кодируется 8 битами. Каков объём сообщения в байтах?`,
              answer: bytes,
              wrong: [bytes * 8, bytes / 2, bytes + 8],
              error: 'Частая ошибка — оставить ответ в битах, хотя спрашивают байты.',
              steps: [`V=${count}*8=${count * 8} бит.`, `Делим на 8.`, `Получаем ${bytes} байт.`],
              tip: 'При 8 битах на символ число байтов равно числу символов.',
            }
      })
    },
  }),
  makeSection({
    id: 'cs_2',
    taskNumber: 2,
    label: 'Системы счисления',
    emoji: '🔢',
    description: 'Перевод 2/8/10/16, алгоритм деления',
    color: '#8b5cf6',
    theoryData: [
      'Задание №2 — Системы счисления',
      'Нужно переводить числа между системами счисления и понимать вес каждого разряда. Чаще всего встречаются основания 2, 8, 10 и 16.',
      [
        { label: 'Разрядный перевод', formula: 'abc_p = a*p^2 + b*p + c' },
        { label: 'Из 10 в p', formula: 'деление на p с остатком' },
        { label: '2 в 16', formula: 'группы по 4 бита' },
      ],
      ['HEX: A=10, B=11, C=12, D=13, E=14, F=15.', 'Остатки при делении читают снизу вверх.', 'Справа налево в двоичной системе идут веса 1,2,4,8...'],
      ['Таблицу HEX-цифр.', 'Алгоритм деления с остатком.', 'Степени двойки.'],
    ],
    makeTasks: level => [9 + level, 13 + level, 17 + level, 21 + level, 25 + level].map((n, index) => {
      const binary = n.toString(2)
      const hex = n.toString(16).toUpperCase()
      return index % 2 === 0
        ? {
            text: `Переведите число ${binary}₂ в десятичную систему.`,
            answer: n,
            wrong: [n - 1, n + 1, n + 3],
            error: 'Нельзя читать двоичное число как десятичное.',
            steps: [`Расставляем веса разрядов.`, `Складываем степени двойки там, где стоит 1.`, `Получаем ${n}.`],
            tip: 'Подписывай веса 1, 2, 4, 8, 16 справа налево.',
          }
        : {
            text: `Чему равно число ${hex}₁₆ в десятичной системе?`,
            answer: n,
            wrong: [n + 16, n - 2, n + 2],
            error: 'В шестнадцатеричной системе буквы обозначают числа, а не переменные.',
            steps: [`Записываем разряды по основанию 16.`, `HEX-цифры A-F заменяем на 10-15.`, `Получаем ${n}.`],
            tip: 'Запомни A=10 ... F=15.',
          }
    }),
  }),
  makeSection({
    id: 'cs_3',
    taskNumber: 3,
    label: 'Логика',
    emoji: '⚡',
    description: 'И/ИЛИ/НЕ/импликация, таблицы истинности',
    color: '#ec4899',
    theoryData: [
      'Задание №3 — Логика',
      'В задании проверяют логические операции и таблицы истинности. Главное — аккуратно соблюдать порядок операций и не ошибаться в импликации.',
      [
        { label: 'A И B', formula: 'истина, если A=1 и B=1' },
        { label: 'A ИЛИ B', formula: 'истина, если есть хотя бы одна 1' },
        { label: 'A → B', formula: 'ложно только при 1 → 0' },
      ],
      ['Для n переменных в таблице 2^n строк.', 'НЕ выполняется раньше И и ИЛИ.', 'Импликация ложна только в одном случае.'],
      ['Таблицы истинности И/ИЛИ/НЕ.', 'Правило импликации.', 'Порядок операций.'],
    ],
    makeTasks: level => [
      ['A И B', 'истинно только когда A=1 и B=1', 1],
      ['A ИЛИ B', 'истинно когда хотя бы одно значение равно 1', 3],
      ['НЕ A', 'меняет 1 на 0 и 0 на 1', 0],
      ['A → B', 'ложно только при A=1, B=0', 2],
      ['таблица для переменных', `для ${level + 2} переменных строк ${2 ** (level + 2)}`, 4],
    ].map((row, index) => ({
      text: index === 4 ? `Сколько строк в таблице истинности для ${level + 2} переменных?` : `Какое утверждение верно для операции ${row[0]}?`,
      answer: index === 4 ? 2 ** (level + 2) : row[1],
      wrong: index === 4 ? [level + 2, 2 * (level + 2), 2 ** (level + 1)] : ['истинно всегда', 'ложно всегда', 'истинно только при A=0'],
      error: 'Частая ошибка — забыть точное правило операции.',
      steps: [`Определяем операцию.`, `Применяем её таблицу истинности.`, `Выбираем подходящий вариант.`],
      tip: 'Для логики лучше выписывать мини-таблицу, а не решать на глаз.',
    })),
  }),
  makeSection({
    id: 'cs_4',
    taskNumber: 4,
    label: 'Файловая система',
    emoji: '📁',
    description: 'Абсолютные/относительные пути, ".."',
    color: '#f59e0b',
    theoryData: [
      'Задание №4 — Файловая система',
      'Нужно читать дерево каталогов и строить путь к файлу. Обычно проверяют абсолютные пути, относительные пути и переход на уровень выше.',
      [
        { label: 'Абсолютный путь', formula: 'от корня или диска' },
        { label: 'Относительный путь', formula: 'от текущей папки' },
        { label: '..', formula: 'папка уровнем выше' },
      ],
      ['Каждое .. поднимает на один каталог вверх.', 'Абсолютный путь не зависит от текущей папки.', 'Относительный путь всегда зависит от точки старта.'],
      ['Что означает ..', 'Разницу абсолютного и относительного пути.', 'Как читать дерево папок.'],
    ],
    makeTasks: level => ['docs', 'img', 'ege', 'tests', 'drafts'].map((folder, index) => ({
      text: `Текущая папка: /school/${folder}/task${level}. Нужно перейти в /school/common/file${index + 1}. Какой относительный путь верный?`,
      answer: `../common/file${index + 1}`,
      wrong: [`common/file${index + 1}`, `../../common/file${index + 1}`, `/common/file${index + 1}`],
      error: 'Ошибка обычно в лишнем или пропущенном переходе на уровень выше.',
      steps: [`Стартуем из /school/${folder}.`, `Поднимаемся в /school через ...`, `Переходим в common/file${index + 1}.`],
      tip: 'Сначала найди общий родительский каталог.',
    })),
  }),
  makeSection({
    id: 'cs_5',
    taskNumber: 5,
    label: 'Компьютерные сети',
    emoji: '🌐',
    description: 'IP-адреса, маски /n, адресов = 2^h',
    color: '#10b981',
    theoryData: [
      'Задание №5 — Компьютерные сети',
      'В задачах про IP важно понимать, сколько бит отдано под сеть, а сколько под адреса узлов. Запись /n показывает количество бит сети.',
      [
        { label: 'IPv4', formula: '32 бита' },
        { label: 'Биты хоста', formula: 'h = 32 - n' },
        { label: 'Адресов', formula: '2^h' },
      ],
      ['/24 оставляет 8 бит под адреса.', 'Чем больше n в /n, тем меньше подсеть.', 'Иногда из общего числа адресов вычитают 2 служебных.'],
      ['Формулу h=32-n.', 'Степени двойки.', 'Смысл записи /24, /25, /26.'],
    ],
    makeTasks: level => [24, 25, 26, 27, 28].map((mask, index) => {
      const h = 32 - mask + (level % 2 === 0 ? 0 : index % 2)
      const fixedMask = 32 - h
      const count = 2 ** h
      return {
        text: `Для IPv4-сети с маской /${fixedMask} сколько всего адресов в подсети?`,
        answer: count,
        wrong: [Math.max(2, count / 2), count - 2, count * 2],
        error: 'Частая ошибка — брать номер маски как число адресов.',
        steps: [`IPv4 содержит 32 бита.`, `Под хосты остаётся h=32-${fixedMask}=${h} бит.`, `Адресов 2^${h}=${count}.`],
        tip: 'В маске /n число n — это биты сети, а не биты хостов.',
      }
    }),
  }),
  makeSection({
    id: 'cs_6',
    taskNumber: 6,
    label: 'Трассировка алгоритмов',
    emoji: '🤖',
    description: 'while/for, таблица значений переменных',
    color: '#3b82f6',
    theoryData: [
      'Задание №6 — Трассировка алгоритмов',
      'Нужно вручную выполнить алгоритм и следить за значениями переменных. Надёжный способ — таблица значений после каждого шага.',
      [
        { label: 'Присваивание', formula: 'x = x + a' },
        { label: 'while', formula: 'повтор, пока условие истинно' },
        { label: 'for', formula: 'цикл с известным числом повторов' },
      ],
      ['Старое значение переменной заменяется новым.', 'Условие while проверяют перед каждой итерацией.', 'Таблица спасает от ошибок в циклах.'],
      ['Шаблон таблицы переменных.', 'Разницу while и for.', 'Правило присваивания.'],
    ],
    makeTasks: level => [2, 3, 4, 5, 6].map((start, index) => {
      const add = level + index
      const repeats = index + 2
      const answer = start + add * repeats
      return {
        text: `Переменная x=${start}. Цикл выполняется ${repeats} раза, каждый раз x=x+${add}. Чему равно x после цикла?`,
        answer,
        wrong: [answer - add, answer + add, start * add],
        error: 'Ошибка часто возникает из-за пропущенной итерации цикла.',
        steps: [`Начальное значение x=${start}.`, `Прибавляем ${add} ровно ${repeats} раза.`, `Итог: ${start}+${add}*${repeats}=${answer}.`],
        tip: 'Записывай номер итерации и значение переменной после неё.',
      }
    }),
  }),
  makeSection({
    id: 'cs_7',
    taskNumber: 7,
    label: 'Объём информации',
    emoji: '📏',
    description: 'Текст/изображение (ш×в×глубина)/звук',
    color: '#06b6d4',
    theoryData: [
      'Задание №7 — Объём информации',
      'Здесь считают объём текста, изображения, звука и скорость передачи. Самое важное — не потерять единицы измерения.',
      [
        { label: 'Изображение', formula: 'V = ширина * высота * глубина' },
        { label: 'Текст', formula: 'V = K * i' },
        { label: 'Передача', formula: 'V = скорость * время' },
      ],
      ['Глубина цвета задаётся в битах на пиксель.', 'Время для звука и передачи часто переводят в секунды.', 'Биты и байты отличаются в 8 раз.'],
      ['Формулу изображения.', 'Формулу передачи данных.', 'Перевод битов в байты.'],
    ],
    makeTasks: level => [40, 50, 60, 70, 80].map((side, index) => {
      const depth = 2 * level + 6
      const bits = side * side * depth
      const bytes = bits / 8
      return {
        text: `Изображение ${side}x${side} пикселей кодируется с глубиной ${depth} бит. Каков объём в байтах?`,
        answer: bytes,
        wrong: [bits, bytes / 2, bytes + side],
        error: 'Частая ошибка — не перевести биты в байты.',
        steps: [`Пикселей: ${side}*${side}=${side * side}.`, `Объём: ${side * side}*${depth}=${bits} бит.`, `В байтах: ${bits}/8=${bytes}.`],
        tip: 'Для изображений сначала считаем пиксели, затем умножаем на глубину цвета.',
      }
    }),
  }),
]

export default sections
