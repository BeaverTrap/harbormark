/**
 * Pull merchant buy/sell lists and class-guide routines from the
 * Monsters & Memories Wiki on Miraheze (CC BY-SA 4.0).
 */
const API = "https://monstersandmemories.miraheze.org/w/api.php";
const UA = "Skillooth/0.1 (local fan tool; CC BY-SA 4.0 attribution)";
const WIKI = "https://monstersandmemories.miraheze.org/wiki/";

const CLASSES = [
  "Archer",
  "Bard",
  "Beastmaster",
  "Cleric",
  "Druid",
  "Elementalist",
  "Enchanter",
  "Fighter",
  "Inquisitor",
  "Monk",
  "Necromancer",
  "Paladin",
  "Ranger",
  "Rogue",
  "Shadow Knight",
  "Shaman",
  "Spellblade",
  "Wizard",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", formatversion: "2" })}`;
  let lastError = new Error(url);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error.info || JSON.stringify(data.error));
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

function pageContent(page) {
  const revision = page.revisions?.[0];
  if (!revision) return "";
  return revision.slots?.main?.content ?? revision.content ?? "";
}

async function categoryPages(title) {
  const pages = [];
  let cont = "";
  do {
    const params = {
      action: "query",
      generator: "categorymembers",
      gcmtitle: title,
      gcmnamespace: "0",
      gcmlimit: "20",
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
    };
    if (cont) params.gcmcontinue = cont;
    const data = await api(params);
    pages.push(...(data.query?.pages ?? []));
    cont = data.continue?.gcmcontinue ?? "";
    await sleep(250);
  } while (cont);
  return pages;
}

async function pagesByTitle(titles) {
  const pages = [];
  for (let i = 0; i < titles.length; i += 10) {
    const batch = titles.slice(i, i + 10);
    const data = await api({
      action: "query",
      titles: batch.join("|"),
      prop: "revisions",
      rvprop: "content",
      rvslots: "main",
      redirects: "1",
    });
    pages.push(...(data.query?.pages ?? []));
    await sleep(250);
  }
  return pages;
}

function cleanWiki(text) {
  let value = text.replace(/<!--[\s\S]*?-->/g, "");
  value = value.replace(/<ref[\s\S]*?<\/ref>/gi, "");
  value = value.replace(/<[^>]+>/g, " ");
  for (let pass = 0; pass < 6; pass += 1) {
    const next = value.replace(/\{\{[^{}]*\}\}/g, " ");
    if (next === value) break;
    value = next;
  }
  value = value.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  value = value.replace(/\[\[([^\]]+)\]\]/g, "$1");
  value = value.replace(/'{2,}/g, "");
  value = value.replace(/&nbsp;/g, " ");
  value = value.replace(/&amp;/g, "&");
  value = value.replace(/\s+/g, " ");
  return value.trim();
}

function usefulTradeLine(item) {
  if (/^(linksto|mode|namespace|ordermethod)\s*=/i.test(item)) return false;
  if (/buys:$|sells:$/i.test(item)) return false;
  if (/^(nothing!?|currently buys nothing\.?|not a good commerce vendor|various)$/i.test(item)) return false;
  if (/about anything|most items at|discounted price|lesser price|reduced cost/i.test(item)) return false;
  return true;
}

function listItems(text) {
  if (!text) return [];
  const chunks = text.split(/\n+|(?=\*\s)/);
  const items = [];
  for (const chunk of chunks) {
    const piece = cleanWiki(chunk.replace(/^\*+\s*/, ""));
    if (!piece || !usefulTradeLine(piece)) continue;
    if (/^(none|unknown|n\/a|-)$/i.test(piece)) continue;
    if (/location needed|description needed|replace this text/i.test(piece)) continue;
    if (!items.includes(piece)) items.push(piece);
  }
  return items;
}

function isGreedy(name, buyText) {
  return /greedy|shady|shifty|suspicious/i.test(name) || /about anything|most items|discounted price|lesser price|reduced cost/i.test(buyText);
}

function splitZones(text) {
  return cleanWiki(text)
    .split(/[,/]|\band\b|\bor\b/i)
    .map((part) => part.trim())
    .filter((part) => part && !/^unknown$/i.test(part) && part.length < 40);
}

function templateInner(wikitext, name) {
  const match = wikitext.match(new RegExp(`\\{\\{\\s*${name}\\b`, "i"));
  if (!match || match.index === undefined) return "";
  let depth = 0;
  for (let i = match.index; i < wikitext.length - 1; i += 1) {
    const pair = wikitext.slice(i, i + 2);
    if (pair === "{{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (pair === "}}") {
      depth -= 1;
      i += 1;
      if (depth === 0) return wikitext.slice(match.index + 2, i - 1);
    }
  }
  return "";
}

function templateFields(inner) {
  const fields = {};
  if (!inner) return fields;
  let brace = 0;
  let bracket = 0;
  let buf = "";
  const chunks = [];
  for (let i = 0; i < inner.length; i += 1) {
    const pair = inner.slice(i, i + 2);
    if (pair === "{{") {
      brace += 1;
      buf += pair;
      i += 1;
      continue;
    }
    if (pair === "}}") {
      brace = Math.max(0, brace - 1);
      buf += pair;
      i += 1;
      continue;
    }
    if (pair === "[[") {
      bracket += 1;
      buf += pair;
      i += 1;
      continue;
    }
    if (pair === "]]") {
      bracket = Math.max(0, bracket - 1);
      buf += pair;
      i += 1;
      continue;
    }
    if (inner[i] === "|" && brace === 0 && bracket === 0) {
      chunks.push(buf);
      buf = "";
      continue;
    }
    buf += inner[i];
  }
  chunks.push(buf);
  for (const chunk of chunks) {
    const field = chunk.match(/^\s*([A-Za-z0-9_]+)\s*=([\s\S]*)$/);
    if (!field) continue;
    fields[field[1].toLowerCase()] = field[2].trim();
  }
  return fields;
}

function headingSection(wikitext, heading) {
  const match = wikitext.match(new RegExp(`===\\s*${heading}\\s*===([\\s\\S]*?)(?=\\n===|\\n==|$)`, "i"));
  return match ? match[1] : "";
}

function zonesFromCategories(wikitext) {
  return [...wikitext.matchAll(/\[\[Category:\s*([^\]]+?)\s+NPCs\]\]/g)].map((match) =>
    match[1].replace(/_/g, " ").trim(),
  );
}

function wikiUrl(title) {
  return WIKI + encodeURIComponent(title.replace(/ /g, "_"));
}

function linkTarget(target, label) {
  return (label || target).replace(/_/g, " ").trim();
}

function wikiLinks(text) {
  return [...text.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g)].map((match) =>
    linkTarget(match[1], match[2]),
  );
}

function skillName(target, label) {
  return linkTarget(target, label).replace(/^Skill\s+/i, "");
}

function trivialOf(line) {
  const match = line.match(/Trivial:\s*(?:≤|<=)?\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function parsePlayerCrafted(text, fallbackProduct) {
  const recipes = [];
  let current = null;
  let pendingSkill = "";
  const lines = text.replace(/<br\s*\/?>/gi, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const bareSkill = line.match(/^\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]$/);
    if (bareSkill) {
      pendingSkill = skillName(bareSkill[1], bareSkill[2]);
      continue;
    }
    const starred = line.match(/^\*\s+\[\[([^\]|#]+)(?:\|([^\]]+))?\]\](.*)$/);
    const ingredientLine = /x\s*\d+\s*\[\[/i.test(line);
    if (starred && !ingredientLine && !/^\*\s+In\s+/i.test(line)) {
      const name = skillName(starred[1], starred[2]);
      const qtyMatch = starred[3].match(/x\s*(\d+)/i);
      const trivial = trivialOf(line);
      if (pendingSkill || qtyMatch) {
        current = {
          product: name,
          qty: qtyMatch ? Number(qtyMatch[1]) : 1,
          skill: pendingSkill || name,
          trivial,
          stations: [],
          ingredients: [],
        };
      } else {
        current = {
          product: fallbackProduct,
          qty: 1,
          skill: name,
          trivial,
          stations: [],
          ingredients: [],
        };
      }
      recipes.push(current);
      continue;
    }
    if (!current) continue;
    const yielded = line.match(/Yield:\s*(.+?)\s*x\s*(\d+)/i);
    if (yielded) {
      const named = wikiLinks(yielded[1])[0] || cleanWiki(yielded[1]);
      if (named) current.product = named;
      current.qty = Number(yielded[2]);
      continue;
    }
    if (/^(?:\*+\s*)?In\s+/i.test(line)) {
      const stationText = line.replace(/^(?:\*+\s*)?In\s+/i, "").replace(/:$/, "");
      const stations = wikiLinks(stationText);
      current.stations = stations.length > 0 ? stations : [cleanWiki(stationText)].filter(Boolean);
      continue;
    }
    const ingredient = line.match(
      /x\s*(\d+)\s*\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\](?:\s*[-–]\s*(.+))?/i,
    );
    if (!ingredient) continue;
    current.ingredients.push({
      name: linkTarget(ingredient[2], ingredient[3]),
      qty: Number(ingredient[1]),
      note: ingredient[4] ? cleanWiki(ingredient[4]) : "",
    });
  }
  return recipes.filter((recipe) => recipe.product && recipe.skill && recipe.ingredients.length > 0);
}

function parseRecipePage(page) {
  const wikitext = pageContent(page);
  if (!wikitext || page.missing || /^#redirect/i.test(wikitext)) return [];
  const box = templateFields(templateInner(wikitext, "ItemBox"));
  const item = templateFields(templateInner(wikitext, "Itempage"));
  const icon = (box.icon_id || "").trim();
  return parsePlayerCrafted(item.playercrafted || "", page.title).map((recipe) => ({
    ...recipe,
    wiki: wikiUrl(page.title),
    icon,
  }));
}

async function iconUrls(ids) {
  const urls = new Map();
  const pending = [...ids].filter(Boolean);
  for (let i = 0; i < pending.length; i += 40) {
    const batch = pending.slice(i, i + 40).map((id) => `File:${id}.png`);
    const data = await api({
      action: "query",
      titles: batch.join("|"),
      prop: "imageinfo",
      iiprop: "url",
    });
    for (const page of data.query?.pages ?? []) {
      const url = page.imageinfo?.[0]?.url ?? "";
      const id = String(page.title ?? "")
        .replace(/^File:/, "")
        .replace(/\.png$/i, "");
      if (url && id) urls.set(id, url);
    }
    await sleep(250);
  }
  return urls;
}

function clockSeconds(value) {
  if (!value || /[?]/.test(value)) return null;
  if (/instant/i.test(value)) return 0;
  const minutes = value.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minutes) return Number(minutes[1]) * 60;
  const seconds = value.match(/(\d+(?:\.\d+)?)/);
  return seconds ? Number(seconds[1]) : null;
}

function effectBand(text) {
  const dot = text.match(
    /(?:Increase|Decrease) Hitpoints by (\d+(?:\.\d+)?)(?:\s*\(L(\d+)\))?(?:\s*to\s*(\d+(?:\.\d+)?)\s*\(L(\d+)\))?\s*every\s*(\d+(?:\.\d+)?)\s*seconds/i,
  );
  if (dot) {
    return {
      kind: "dot",
      low: Number(dot[1]),
      high: Number(dot[3] ?? dot[1]),
      lowLevel: dot[2] ? Number(dot[2]) : null,
      highLevel: dot[4] ? Number(dot[4]) : null,
      every: Number(dot[5]),
    };
  }
  const hit = text.match(
    /(Increase|Decrease) Hitpoints by (\d+(?:\.\d+)?)(?:\s*\(L(\d+)\))?(?:\s*to\s*(\d+(?:\.\d+)?)\s*\(L(\d+)\))?/i,
  );
  if (hit) {
    return {
      kind: hit[1].toLowerCase() === "increase" ? "heal" : "direct",
      low: Number(hit[2]),
      high: Number(hit[4] ?? hit[2]),
      lowLevel: hit[3] ? Number(hit[3]) : null,
      highLevel: hit[5] ? Number(hit[5]) : null,
    };
  }
  const weapon = text.match(/(\d+(?:\.\d+)?)%\s*\(L(\d+)\)(?:\s*to\s*(\d+(?:\.\d+)?)%\s*\(L(\d+)\))?/);
  if (!weapon || !/damage|weapon|physical|melee|attack/i.test(text)) return null;
  return {
    kind: "weapon",
    low: Number(weapon[1]),
    high: Number(weapon[3] ?? weapon[1]),
    lowLevel: Number(weapon[2]),
    highLevel: weapon[4] ? Number(weapon[4]) : Number(weapon[2]),
  };
}

const CLASS_ALIAS = new Map(CLASSES.map((name) => [name.toLowerCase(), name]));
CLASS_ALIAS.set("shadowknight", "Shadow Knight");
CLASS_ALIAS.set("beast master", "Beastmaster");

function canonClass(name) {
  const cleaned = name.replace(/_/g, " ").trim();
  return CLASS_ALIAS.get(cleaned.toLowerCase()) ?? cleaned;
}

function parseSpellPage(page) {
  const wikitext = pageContent(page);
  if (!wikitext || page.missing || /^#redirect/i.test(wikitext)) return null;
  const inner = templateInner(wikitext, "Spellpagesmart") || templateInner(wikitext, "spellpage");
  if (!inner) return null;
  const fields = templateFields(inner);
  const name = cleanWiki(fields.spellname || "") || page.title;
  const classes = [];
  const seenGates = new Set();
  for (const match of (fields.classes || "").matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\][\s\S]{0,40}?Level\s*(\d+)/gi)) {
    const gate = { className: canonClass(match[1]), level: Number(match[2]) };
    const key = `${gate.className}|${gate.level}`;
    if (seenGates.has(key)) continue;
    seenGates.add(key);
    classes.push(gate);
  }
  if (classes.length === 0 || !name) return null;
  let direct = null;
  let dot = null;
  let heal = null;
  let weapon = null;
  const blob = `${fields.slots || ""}\n${fields.description || ""}`;
  for (const piece of blob.split("\n")) {
    const band = effectBand(piece);
    if (!band) continue;
    if (band.kind === "dot" && !dot) {
      dot = { low: band.low, high: band.high, lowLevel: band.lowLevel, highLevel: band.highLevel, every: band.every };
    }
    if (band.kind === "direct" && !direct) {
      direct = { low: band.low, high: band.high, lowLevel: band.lowLevel, highLevel: band.highLevel };
    }
    if (band.kind === "heal" && !heal) {
      heal = { low: band.low, high: band.high, lowLevel: band.lowLevel, highLevel: band.highLevel };
    }
    if (band.kind === "weapon" && !weapon) {
      weapon = { low: band.low, high: band.high, lowLevel: band.lowLevel, highLevel: band.highLevel };
    }
  }
  if (!direct && !dot && !heal && !weapon) return null;
  const manaText = (fields.mana || "").trim();
  return {
    name,
    wiki: wikiUrl(page.title),
    icon: (fields.spellicon || "").trim(),
    skill: cleanWiki(fields.skill || ""),
    resist: cleanWiki(fields.resist || ""),
    target: cleanWiki(fields.target_type || ""),
    mana: /^\d+/.test(manaText) ? Number(manaText) : null,
    cast: clockSeconds(fields.casting_time || ""),
    recast: clockSeconds(fields.recast_time || ""),
    duration: clockSeconds(fields.duration || ""),
    classes,
    direct,
    dot,
    heal,
    weapon,
  };
}

async function collectSpells() {
  const pages = await categoryPages("Category:Spells & Abilities");
  const spells = [];
  const seen = new Set();
  for (const page of pages) {
    const spell = parseSpellPage(page);
    if (!spell || seen.has(spell.name.toLowerCase())) continue;
    seen.add(spell.name.toLowerCase());
    spells.push(spell);
  }
  const icons = await iconUrls(new Set(spells.map((spell) => spell.icon).filter(Boolean)));
  for (const spell of spells) spell.icon = icons.get(spell.icon) ?? "";
  spells.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`spells ${spells.length}`);
  return spells;
}

async function collectRecipes() {
  const pages = await categoryPages("Category:Tradeskill Recipe");
  const recipes = [];
  const seen = new Set();
  let unparsed = 0;
  for (const page of pages) {
    const parsed = parseRecipePage(page);
    if (parsed.length === 0) {
      const item = templateFields(templateInner(pageContent(page), "Itempage"));
      if (item.playercrafted && item.playercrafted.trim()) {
        unparsed += 1;
        if (unparsed <= 8) console.log(`unparsed recipe ${page.title}`);
      }
      continue;
    }
    for (const recipe of parsed) {
      const key = `${recipe.product}|${recipe.skill}|${recipe.ingredients.map((part) => `${part.qty}:${part.name}`).join(",")}`;
      if (seen.has(key)) continue;
      seen.add(key);
      recipes.push(recipe);
    }
  }
  const icons = await iconUrls(new Set(recipes.map((recipe) => recipe.icon).filter(Boolean)));
  for (const recipe of recipes) {
    recipe.icon = icons.get(recipe.icon) ?? "";
  }
  recipes.sort((a, b) => a.product.localeCompare(b.product) || (a.trivial ?? 0) - (b.trivial ?? 0));
  console.log(`recipes ${recipes.length} unparsed ${unparsed}`);
  return recipes;
}

function parseMerchant(page) {
  const wikitext = pageContent(page);
  if (!wikitext || /^#redirect/i.test(wikitext)) return null;
  const fields = templateFields(templateInner(wikitext, "Merchantpage"));
  const rawBuys = fields.buys || headingSection(wikitext, "Buys");
  const sells = listItems(fields.sells || headingSection(wikitext, "Sells"));
  const buys = listItems(rawBuys);
  let zones = splitZones(fields.zone || "");
  if (zones.length === 0) zones = zonesFromCategories(wikitext);
  const location = cleanWiki(fields.location || headingSection(wikitext, "Location"));
  const name = page.title;
  const greedy = isGreedy(name, rawBuys);
  if (sells.length === 0 && buys.length === 0 && !greedy) return null;
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    name,
    zones,
    location: /location needed|unknown/i.test(location) ? "" : location,
    sells,
    buys,
    greedy,
    wiki: wikiUrl(name),
  };
}

function levelRange(title) {
  const beyond = title.match(/levels?\s*(\d+)\s*and beyond/i);
  if (beyond) return { minLevel: Number(beyond[1]), maxLevel: 60 };
  const range = title.match(/levels?\s*(\d+)\s*(?:-|–|—|to)+\s*(\d+)/i);
  if (range) return { minLevel: Number(range[1]), maxLevel: Number(range[2]) };
  const one = title.match(/\blevel\s*(\d+)\b/i);
  if (one) return { minLevel: Number(one[1]), maxLevel: Number(one[1]) };
  return { minLevel: null, maxLevel: null };
}

function guideLinks(wikitext, selfTitle) {
  const links = [];
  const seen = new Set([selfTitle.toLowerCase()]);
  for (const match of wikitext.matchAll(/\[\[([^\]|#]+)/g)) {
    const title = match[1].replace(/_/g, " ").trim();
    if (!title || /^(file|category|user|template|image):/i.test(title)) continue;
    if (!/guide|combo|rotation/i.test(title)) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    links.push(title);
  }
  return links.slice(0, 3);
}

function tableToLines(table) {
  const rows = table
    .replace(/\|\}/g, "")
    .split("|-")
    .slice(1)
    .map((row) => {
      const cells = [];
      for (const part of row.split(/\n(?=[!|])/)) {
        const label = cleanWiki(part.split("|").pop() ?? "");
        if (!label || label === "}" || label.length > 180) continue;
        cells.push(label);
      }
      return cells;
    })
    .filter((row) => row.length > 0);
  if (rows.length === 0) return [];
  const header = rows[0];
  const body = rows.slice(1);
  if (body.length > 0 && header.length > 2 && body.every((row) => row.length === header.length)) {
    const lines = [];
    for (const row of body) {
      for (let index = 1; index < row.length; index += 1) {
        if (/^first\s+second/i.test(header[index] ?? "")) continue;
        lines.push(`${row[0]} + ${header[index]}: ${row[index]}`);
      }
    }
    if (lines.length > 0) return lines;
  }
  if (rows.every((row) => row.length === 2)) return rows.map((row) => `${row[0]}: ${row[1]}`);
  return rows.map((row) => row.join(" · "));
}

function expandTables(text) {
  let out = "";
  let index = 0;
  while (index < text.length) {
    const start = text.indexOf("{|", index);
    if (start < 0) {
      out += text.slice(index);
      break;
    }
    out += text.slice(index, start);
    let depth = 0;
    let cursor = start;
    let end = -1;
    while (cursor < text.length - 1) {
      const pair = text.slice(cursor, cursor + 2);
      if (pair === "{|") {
        depth += 1;
        cursor += 2;
        continue;
      }
      if (pair === "|}") {
        depth -= 1;
        cursor += 2;
        if (depth === 0) {
          end = cursor;
          break;
        }
        continue;
      }
      cursor += 1;
    }
    if (end < 0 || end - start > 30000) {
      out += "{|";
      index = start + 2;
      continue;
    }
    out += `\n${tableToLines(text.slice(start, end)).join("\n")}\n`;
    index = end;
  }
  return out;
}

function normalizeGuideText(wikitext) {
  let text = expandTables(wikitext.replace(/\r/g, ""));
  text = text.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, title) => {
    const marks = "=".repeat(Number(level) + 1);
    const plain = title.replace(/<[^>]+>/g, " ");
    return `\n${marks} ${plain} ${marks}\n`;
  });
  text = text.replace(/<li[^>]*>/gi, "\n* ");
  text = text.replace(/<\/li>|<\/p>|<br\s*\/?>|<\/(ul|ol|div)>/gi, "\n");
  return text;
}

function sectionsFrom(wikitext, source) {
  const lines = normalizeGuideText(wikitext).split("\n");
  const sections = [];
  let current = { title: "Overview", depth: 1, lines: [] };
  const push = () => {
    const kept = [];
    for (const line of current.lines) {
      const raw = line.trim();
      if (/^(\{\||\|\}|\|-|!|\|)/.test(raw)) continue;
      if (/scope\s*=|background-color|wikitable/i.test(raw)) continue;
      const text = cleanWiki(line.replace(/^[*#:;]+\s*/, ""));
      if (!text || text.length < 2) continue;
      if (/scope\s*=|background-color/i.test(text)) continue;
      if (/^category:/i.test(text)) continue;
      kept.push(text);
    }
    if (kept.length === 0) return;
    sections.push({
      title: current.title,
      depth: current.depth,
      source,
      ...levelRange(current.title),
      lines: kept,
    });
  };
  for (const line of lines) {
    const heading = line.match(/^(=+)\s*(.+?)\s*\1\s*$/);
    if (heading) {
      push();
      current = { title: cleanWiki(heading[2]), depth: heading[1].length, lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  push();
  return sections;
}

function parseGuide(className, page, extras) {
  const wikitext = pageContent(page);
  const missing = Boolean(page.missing) || !wikitext || /^#redirect/i.test(wikitext);
  const sections = missing ? [] : sectionsFrom(wikitext, "");
  for (const extra of extras) {
    const extraText = pageContent(extra);
    if (!extraText || /^#redirect/i.test(extraText)) continue;
    sections.push(...sectionsFrom(extraText, extra.title));
  }
  const chars = sections.reduce((sum, section) => sum + section.lines.join(" ").length, 0);
  return {
    className,
    wikiTitle: `${className} Guides`,
    wiki: wikiUrl(`${className} Guides`),
    missing,
    thin: missing || chars < 500,
    sections,
  };
}

function firstTable(wikitext) {
  const start = wikitext.indexOf("{|");
  if (start < 0) return "";
  const lines = wikitext.slice(start).split("\n");
  const kept = [];
  let depth = 0;
  for (const line of lines) {
    if (/^\{\|/.test(line.trim())) depth += 1;
    if (depth > 0) kept.push(line);
    if (/^\|\}/.test(line.trim())) {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return kept.join("\n");
}

function stripTables(text) {
  const lines = text.split("\n");
  const kept = [];
  let depth = 0;
  for (const line of lines) {
    if (/^\{\|/.test(line.trim())) {
      depth += 1;
      continue;
    }
    if (depth > 0) {
      if (/^\|\}/.test(line.trim())) depth -= 1;
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

function infoboxFields(table) {
  const fields = {};
  for (const row of table.split(/\n\|-/)) {
    const match = row.match(/!\s*(?:[^|\n]*\|\s*)?([A-Za-z][A-Za-z '&]+?)\s*\n\|\s*(?:[^|\n]*\|\s*)?([\s\S]*)$/);
    if (!match) continue;
    fields[match[1].trim().toLowerCase()] = match[2].trim();
  }
  return fields;
}

function tidyField(raw) {
  return cleanWiki(raw).replace(/\s*\|\}.*$/, "").replace(/\s+/g, " ").trim();
}

function fieldList(raw) {
  if (!raw) return [];
  return raw
    .split(/<br\s*\/?>/i)
    .map((part) => tidyField(part))
    .filter(Boolean);
}

function proseLines(text) {
  let value = text.replace(/<ref[\s\S]*?<\/ref>/gi, "");
  value = value.replace(/<br\s*\/?>/gi, "\n");
  value = value.replace(/<\/(p|div|li|tr|h\d)>/gi, "\n");
  value = value.replace(/<[^>]+>/g, " ");
  value = value.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  value = value.replace(/\[\[([^\]]+)\]\]/g, "$1");
  value = value.replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, "$1");
  value = value.replace(/'{2,}/g, "");
  value = value.replace(/[💡⚠️]/g, "");
  value = value.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  return value
    .split("\n")
    .map((line) => line.replace(/^[\s*\-#]+/, "").replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 2 && line.length < 420)
    .filter((line) => !/chart formatting|click the column|sortable|\{\{|navbox|category:/i.test(line))
    .filter((line) => !/^required tools:?$/i.test(line));
}

function skillSections(wikitext) {
  const stripped = stripTables(wikitext).replace(/<tabber>[\s\S]*?<\/tabber>/gi, "");
  const sections = [];
  for (const part of stripped.split(/\n(?===+[^=])/)) {
    const match = part.match(/^==+\s*([^=]+?)\s*==+\s*\n?([\s\S]*)$/);
    if (!match) continue;
    const title = match[1].trim();
    if (/recipe|chart|catalog|node|tabber/i.test(title)) continue;
    const lines = proseLines(match[2]).slice(0, 8);
    if (lines.length === 0) continue;
    sections.push({ title, lines });
    if (sections.length >= 4) break;
  }
  return sections;
}

function parseSkill(page) {
  const wikitext = pageContent(page);
  if (!wikitext || page.missing || /^#redirect/i.test(wikitext)) return null;
  const name = page.title.replace(/^Skill\s+/i, "");
  const fields = infoboxFields(firstTable(wikitext));
  const intro = proseLines(stripTables(wikitext).split(/\n==/)[0]).filter((line) => line.length > 40).slice(0, 2);
  return {
    name,
    role: tidyField(fields.role || ""),
    trainers: fieldList(fields.trainers || fields.trainer || ""),
    location: tidyField(fields.location || ""),
    tools: fieldList(fields["primary tools"] || fields["primary tool"] || ""),
    station: tidyField(fields["crafting station"] || fields["target nodes"] || ""),
    intro,
    sections: skillSections(wikitext),
    wiki: wikiUrl(page.title),
  };
}

async function collectSkills() {
  const pages = await categoryPages("Category:Tradeskills");
  const skills = [];
  const seen = new Set();
  for (const page of pages) {
    const skill = parseSkill(page);
    if (!skill || seen.has(skill.name)) continue;
    seen.add(skill.name);
    skills.push(skill);
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`skills ${skills.length}`);
  return skills;
}

if (process.argv.includes("--skills-only")) {
  const { readFile, writeFile, mkdir } = await import("node:fs/promises");
  const dataDir = new URL("../src/data/", import.meta.url);
  const skillsFile = new URL("skills.json", dataDir);
  const metaFile = new URL("meta.json", dataDir);
  await mkdir(dataDir, { recursive: true });
  const skills = await collectSkills();
  await writeFile(skillsFile, `${JSON.stringify(skills, null, 2)}\n`);
  let meta = {};
  try {
    meta = JSON.parse(await readFile(metaFile, "utf8"));
  } catch {
    meta = {};
  }
  meta.skillCount = skills.length;
  meta.scrapedAt = new Date().toISOString();
  await writeFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`wrote ${skills.length} skills`);
  process.exit(0);
}

if (process.argv.includes("--spells-only")) {
  const { readFile, writeFile, mkdir } = await import("node:fs/promises");
  const dataDir = new URL("../src/data/", import.meta.url);
  const spellsFile = new URL("spells.json", dataDir);
  const metaFile = new URL("meta.json", dataDir);
  await mkdir(dataDir, { recursive: true });
  const spells = await collectSpells();
  await writeFile(spellsFile, `${JSON.stringify(spells, null, 2)}\n`);
  let meta = {};
  try {
    meta = JSON.parse(await readFile(metaFile, "utf8"));
  } catch {
    meta = {};
  }
  meta.spellCount = spells.length;
  meta.scrapedAt = new Date().toISOString();
  await writeFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`wrote ${spells.length} spells`);
  process.exit(0);
}

if (process.argv.includes("--probe")) {
  const samples = await pagesByTitle(["Hide Cap", "Alum", "Angelfish Bisque", "Rawhide Scraps"]);
  for (const page of samples) {
    console.log(page.title, JSON.stringify(parseRecipePage(page), null, 2));
  }
  process.exit(0);
}

const merchants = [];
const seen = new Set();
for (const page of await categoryPages("Category:Merchant")) {
  const merchant = parseMerchant(page);
  if (!merchant || seen.has(merchant.id)) continue;
  seen.add(merchant.id);
  merchants.push(merchant);
}
merchants.sort((a, b) => a.name.localeCompare(b.name));

const guidePages = await pagesByTitle(CLASSES.map((name) => `${name} Guides`));
const byTitle = new Map(guidePages.map((page) => [page.title, page]));
const extraTitles = [];
for (const name of CLASSES) {
  const page = byTitle.get(`${name} Guides`);
  if (!page) continue;
  for (const title of guideLinks(pageContent(page), `${name} Guides`)) extraTitles.push(title);
}
const extraPages = await pagesByTitle([...new Set(extraTitles)]);
const extrasByTitle = new Map(extraPages.map((page) => [page.title.toLowerCase(), page]));
const guides = CLASSES.map((name) => {
  const page = byTitle.get(`${name} Guides`) ?? { title: `${name} Guides`, missing: true };
  const extras = guideLinks(pageContent(page), `${name} Guides`)
    .map((title) => extrasByTitle.get(title.toLowerCase()))
    .filter(Boolean);
  return parseGuide(name, page, extras);
});

const { readFile, writeFile, mkdir } = await import("node:fs/promises");
const dataDir = new URL("../src/data/", import.meta.url);
const recipes = await collectRecipes();
const spells = await collectSpells();
const skills = await collectSkills();
const merchantsFile = new URL("merchants.json", dataDir);
const guidesFile = new URL("guides.json", dataDir);
const recipesFile = new URL("recipes.json", dataDir);
const spellsFile = new URL("spells.json", dataDir);
const skillsFile = new URL("skills.json", dataDir);
const metaFile = new URL("meta.json", dataDir);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

await mkdir(dataDir, { recursive: true });
const previousMeta = await readJson(metaFile);
const merchantsChanged = JSON.stringify(await readJson(merchantsFile)) !== JSON.stringify(merchants);
const guidesChanged = JSON.stringify(await readJson(guidesFile)) !== JSON.stringify(guides);
const recipesChanged = JSON.stringify(await readJson(recipesFile)) !== JSON.stringify(recipes);
const spellsChanged = JSON.stringify(await readJson(spellsFile)) !== JSON.stringify(spells);
const skillsChanged = JSON.stringify(await readJson(skillsFile)) !== JSON.stringify(skills);

if (!merchantsChanged && !guidesChanged && !recipesChanged && !spellsChanged && !skillsChanged && previousMeta) {
  console.log("unchanged");
} else {
  if (merchantsChanged || !(await readJson(merchantsFile))) {
    await writeFile(merchantsFile, `${JSON.stringify(merchants, null, 2)}\n`);
  }
  if (guidesChanged || !(await readJson(guidesFile))) {
    await writeFile(guidesFile, `${JSON.stringify(guides, null, 2)}\n`);
  }
  if (recipesChanged || !(await readJson(recipesFile))) {
    await writeFile(recipesFile, `${JSON.stringify(recipes, null, 2)}\n`);
  }
  if (spellsChanged || !(await readJson(spellsFile))) {
    await writeFile(spellsFile, `${JSON.stringify(spells, null, 2)}\n`);
  }
  if (skillsChanged || !(await readJson(skillsFile))) {
    await writeFile(skillsFile, `${JSON.stringify(skills, null, 2)}\n`);
  }
  await writeFile(
    metaFile,
    `${JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        source: "Monsters & Memories Wiki (Miraheze)",
        license: "CC BY-SA 4.0",
        licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
        merchantCount: merchants.length,
        guideCount: guides.filter((guide) => !guide.thin).length,
        recipeCount: recipes.length,
        spellCount: spells.length,
        skillCount: skills.length,
      },
      null,
      2,
    )}\n`,
  );
  console.log("updated");
}

const buyLines = [...new Set(merchants.flatMap((merchant) => merchant.buys))].sort();
console.log(`recipes ${recipes.length}`);
console.log(`spells ${spells.length}`);
console.log(`merchants ${merchants.length}`);
console.log(`with buys ${merchants.filter((merchant) => merchant.buys.length).length}`);
console.log(`with sells ${merchants.filter((merchant) => merchant.sells.length).length}`);
console.log(`greedy ${merchants.filter((merchant) => merchant.greedy).length}`);
console.log("buy lines:");
for (const line of buyLines) console.log(` - ${line}`);
console.log("guides:");
for (const guide of guides) {
  const titles = guide.sections.map((section) => section.title).slice(0, 8).join(" · ");
  console.log(
    ` - ${guide.className}: ${guide.missing ? "missing" : guide.thin ? "thin" : "written"} sections=${guide.sections.length} ${titles}`,
  );
}
