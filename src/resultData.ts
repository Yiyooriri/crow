export const RESULT_KEYS = ["LUCK", "MISFORTUNE", "OMEN", "GLOW", "NEST", "STORM", "HUNGER"] as const;

export type ResultKey = (typeof RESULT_KEYS)[number];

export type ResultCopy = {
  koreanName: string;
  kr: (name: string) => string;
  en: (name: string) => string;
};

function hasFinalConsonant(value: string) {
  const last = value.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

export function withSubjectParticle(value: string) {
  const name = value.trim();
  return `${name}${hasFinalConsonant(name) ? "이" : "가"}`;
}

export const RESULT_COPY: Record<ResultKey, ResultCopy> = {
  LUCK: {
    koreanName: "행운",
    kr: (name) => `${name}의 날개 위로 바람이 불어온다. 오늘의 바람은 네 편이다. 하지만 날갯짓을 멈추지 않을 때만 닿는다.`,
    en: (name) => `The wind rises beneath ${name}'s wings. Today, the wind is with you. But it only carries those who keep flying.`,
  },
  MISFORTUNE: {
    koreanName: "불운",
    kr: (name) => `${name}의 하늘에 먹구름이 낀다. 추락이 아니다. 잠시 낮게 나는 것일 뿐.`,
    en: (name) => `Dark clouds gather over ${name}'s sky. This is not a fall. Only a lower flight, for now.`,
  },
  OMEN: {
    koreanName: "징조",
    kr: (name) => `${name} 위로 낯선 그림자가 스친다. 정해진 결말은 없다. 다음 날갯짓이 그것을 정한다.`,
    en: (name) => `A strange shadow passes over ${name}. Nothing is decided. The next wingbeat will tell.`,
  },
  GLOW: {
    koreanName: "빛",
    kr: (name) => `${name}의 깃털 끝에 빛이 맺힌다. 아직 작은 빛이다. 하지만 꺼지지 않고 자라는 중이다.`,
    en: (name) => `A glow forms at the edge of ${name}'s feathers. Still small. But it is growing, not fading.`,
  },
  NEST: {
    koreanName: "둥지",
    kr: (name) => `${withSubjectParticle(name)} 잠시 가지 위에 내려앉는다. 멈춤은 후퇴가 아니다. 다음 비행을 준비하는 시간이다.`,
    en: (name) => `${name} settles on the branch for a moment. This pause is not retreat. It is preparing the next flight.`,
  },
  STORM: {
    koreanName: "폭풍",
    kr: (name) => `${name}의 앞에 거센 바람이 몰아친다. 맞바람일수록, 날개는 더 단단해진다.`,
    en: (name) => `A fierce wind rises before ${name}. The harder the headwind, the stronger the wings become.`,
  },
  HUNGER: {
    koreanName: "갈구",
    kr: (name) => `${name}의 안에서 무언가 다시 꿈틀거린다. 배고픔은 약점이 아니다. 그것이 날게 하는 이유다.`,
    en: (name) => `Something stirs again inside ${name}. Hunger is not a weakness. It is the reason to fly.`,
  },
};
