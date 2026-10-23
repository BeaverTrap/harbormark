export type Merchant = {
  id: string;
  name: string;
  zones: string[];
  location: string;
  sells: string[];
  buys: string[];
  greedy: boolean;
  wiki: string;
};

export type GuideSection = {
  title: string;
  depth: number;
  source: string;
  minLevel: number | null;
  maxLevel: number | null;
  lines: string[];
};

export type ClassGuide = {
  className: string;
  wikiTitle: string;
  wiki: string;
  missing: boolean;
  thin: boolean;
  sections: GuideSection[];
};

export type BuyerHit = {
  merchant: Merchant;
  score: number;
  reasons: string[];
};

export type SkillSection = {
  title: string;
  lines: string[];
};

export type TradeSkill = {
  name: string;
  role: string;
  trainers: string[];
  location: string;
  tools: string[];
  station: string;
  intro: string[];
  sections: SkillSection[];
  wiki: string;
};

export type Tab = "craft" | "sell";
