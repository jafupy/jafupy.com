export type Token =
  | { type: "ref"; name: string }
  | { type: "lit"; ch: string }
  | { type: "opt"; tokens: Token[] };

export type Subpatterns = Record<string, string[]>;

export const DEFAULT_SUBPATTERNS = [
  { name: "V", value: "a/e/o/y/i" },
  { name: "C", value: "p/t/k/b/d/g/m/n/r/w/h/l/ł/f/j" },
  { name: "S", value: "sz/cz/szcz/zs/dz/dż/zh" },
  { name: "Z", value: "ś/ć/dż/ń/rz" },
  { name: "N", value: "m/n/ŋ" },
];

export function parsePattern(pattern: string): Token[] {
  let i = 0;

  function parseGroup(end: string | null): Token[] {
    const group: Token[] = [];

    while (i < pattern.length) {
      const ch = pattern[i];

      if (ch === end) {
        i++;
        break;
      }

      if (ch === "(") {
        i++;
        group.push({ type: "opt", tokens: parseGroup(")") });
      } else if (ch >= "A" && ch <= "Z") {
        group.push({ type: "ref", name: ch });
        i++;
      } else {
        group.push({ type: "lit", ch });
        i++;
      }
    }

    return group;
  }

  return parseGroup(null);
}

export function generateWord(tokens: Token[], subpatterns: Subpatterns): string {
  return tokens
    .map((token) => {
      if (token.type === "lit") return token.ch;
      if (token.type === "opt") {
        return Math.random() < 0.5 ? generateWord(token.tokens, subpatterns) : "";
      }

      const pool = subpatterns[token.name];
      return pool?.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : token.name;
    })
    .join("");
}

export function generateWords({
  count,
  dedupe,
  pattern,
  subpatterns,
}: {
  count: number;
  dedupe: boolean;
  pattern: string;
  subpatterns: Subpatterns;
}) {
  const tokens = parsePattern(pattern);
  const seen = new Set<string>();
  const words: string[] = [];
  const maxAttempts = count * 20;

  for (let attempts = 0; words.length < count && attempts < maxAttempts; attempts++) {
    const word = generateWord(tokens, subpatterns);
    if (!word || (dedupe && seen.has(word))) continue;
    seen.add(word);
    words.push(word);
  }

  return words;
}

