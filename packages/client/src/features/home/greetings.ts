/** Greetings follow the local time and remain stable until the next visit. */
export const HERO_GREETING_SLOTS: { from: number, to: number, lines: string[] }[] = [
  { from: 5, to: 12, lines: ['早上好，{name}。新的征程开始了。', '晨光已至，{name}，准备出发。'] },
  { from: 12, to: 18, lines: ['{name}，今天的任务是什么？', '前路清晰，{name}，继续前进。'] },
  { from: 18, to: 22, lines: ['晚上好，{name}。还有什么任务？', '{name}，每一步都值得记录。'] },
  { from: 22, to: 29, lines: ['夜深了，{name}，我们稳步前行。', '{name}，星光之下，继续探索。'] },
]

export const HERO_GREETING_ANYTIME: string[] = [
  '{name}，新的征程从这里开始。',
  '指挥终端就绪，{name}。',
  '一起出发吧，{name}。',
  '{name}，今天想探索什么？',
]

function comrade(username: string) {
  const name = username.trim() || '指挥官'
  return name.endsWith('同志') ? name : `${name}同志`
}

/** Choose a welcome from the current time slot and the all-day pool. */
export function pickHeroGreeting(username: string, draw: number) {
  const hour = new Date().getHours()
  const clock = hour < 5 ? hour + 24 : hour
  let lines = HERO_GREETING_ANYTIME
  for (const slot of HERO_GREETING_SLOTS) {
    if (clock >= slot.from && clock < slot.to) lines = slot.lines.concat(HERO_GREETING_ANYTIME)
  }
  const line = lines[Math.min(lines.length - 1, Math.floor(draw * lines.length))]
  return line.replace('{name}', comrade(username))
}

/** The studio layout keeps one welcoming line. */
export function pickStudioGreeting(username: string) {
  return `${comrade(username)}，新的征程从这里开始。`
}
