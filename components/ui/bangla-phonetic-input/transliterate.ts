/*
  Avro-style phonetic Bangla: English letters in, Bangla script out.
  Pure functions, no React, so the same rules can run on the server.

    ami  → আমি      tumi → তুমি      bangla → বাংলা
    prothom → প্রথম  bondhu → বন্ধু   bakyo → বাক্য

  Case matters like in Avro: t ত / T ট, d দ / D ড, n ন / N ণ, sh শ / S ষ, r র / R ড়,
  o (inherent) / O ো, i ি / I ী, u ু / U ূ.
*/

type Token =
  | { kind: "vowel"; indep: string; kar: string }
  | { kind: "consonant"; value: string; reph?: boolean }
  | { kind: "ya" } // y / Z: ya-phala after a consonant, য় elsewhere
  | { kind: "wa" } // w: ba-phala after a consonant, ও elsewhere
  | { kind: "ng" } // ং, or ঙ before a vowel
  | { kind: "sign"; value: string }
  | { kind: "digit"; value: string };

const V = (indep: string, kar: string): Token => ({ kind: "vowel", indep, kar });
const C = (value: string): Token => ({ kind: "consonant", value });

/** Longest patterns first. Case-sensitive; lowercase is tried when an uppercase letter has no rule. */
const PATTERNS: [string, Token][] = (
  [
    // vowels
    ["rri", V("ঋ", "ৃ")],
    ["OU", V("ঔ", "ৌ")],
    ["OI", V("ঐ", "ৈ")],
    ["ee", V("ঈ", "ী")],
    ["oo", V("উ", "ু")],
    ["o", V("অ", "")],
    ["O", V("ও", "ো")],
    ["a", V("আ", "া")],
    ["i", V("ই", "ি")],
    ["I", V("ঈ", "ী")],
    ["u", V("উ", "ু")],
    ["U", V("ঊ", "ূ")],
    ["e", V("এ", "ে")],
    // consonants and clusters
    ["kkh", C("ক্ষ")],
    ["kSh", C("ক্ষ")],
    ["ngg", C("ঙ্গ")],
    ["ngk", C("ঙ্ক")],
    ["chh", C("ছ")],
    ["t``", C("ৎ")],
    ["rr", { kind: "consonant", value: "র", reph: true }],
    ["kh", C("খ")],
    ["gh", C("ঘ")],
    ["gg", C("জ্ঞ")],
    ["Ng", C("ঙ")],
    ["ng", { kind: "ng" }],
    ["ch", C("ছ")],
    ["jh", C("ঝ")],
    ["NG", C("ঞ")],
    ["Th", C("ঠ")],
    ["Dh", C("ঢ")],
    ["Rh", C("ঢ়")],
    ["th", C("থ")],
    ["dh", C("ধ")],
    ["ph", C("ফ")],
    ["bh", C("ভ")],
    ["sh", C("শ")],
    ["Sh", C("ষ")],
    ["t`", C("ৎ")],
    ["k", C("ক")],
    ["g", C("গ")],
    ["c", C("চ")],
    ["j", C("জ")],
    ["J", C("জ")],
    ["T", C("ট")],
    ["D", C("ড")],
    ["R", C("ড়")],
    ["N", C("ণ")],
    ["t", C("ত")],
    ["d", C("দ")],
    ["n", C("ন")],
    ["p", C("প")],
    ["f", C("ফ")],
    ["b", C("ব")],
    ["v", C("ভ")],
    ["m", C("ম")],
    ["z", C("য")],
    ["Y", C("য়")],
    ["r", C("র")],
    ["l", C("ল")],
    ["S", C("ষ")],
    ["s", C("স")],
    ["h", C("হ")],
    ["x", C("ক্স")],
    ["q", C("ক")],
    ["y", { kind: "ya" }],
    ["Z", { kind: "ya" }],
    ["w", { kind: "wa" }],
    ["^", { kind: "sign", value: "ঁ" }],
  ] as [string, Token][]
).sort((a, b) => b[0].length - a[0].length);

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const HASANTA = "্";

/** Consonant pairs that form a conjunct when typed back to back (ক + ত → ক্ত). */
const CONJUNCTS = new Set(
  (
    "ক্ক ক্ট ক্ত ক্ম ক্ল ক্স গ্ধ গ্ন গ্ল ঙ্ক ঙ্গ চ্চ চ্ছ জ্জ জ্ব ঞ্চ ঞ্জ ট্ট ড্ড ণ্ট ণ্ড ণ্ণ ত্ত ত্ব ত্ম ত্ন দ্দ দ্ধ দ্ব দ্ভ দ্ম " +
    "ধ্ব ন্ত ন্থ ন্দ ন্ধ ন্ন ন্ম ন্স ন্ট ন্ড প্ত প্ন প্প প্ল ফ্ল ব্দ ব্ধ ব্ব ব্ল ম্প ম্ব ম্ভ ম্ম ম্ল ল্ক ল্প ল্ল ল্ট ল্ড ল্ম " +
    "শ্চ শ্ন শ্ব শ্ম শ্ল ষ্ক ষ্ট ষ্ঠ ষ্ণ ষ্প ষ্ম স্ক স্ট স্ত স্থ স্ন স্প স্ফ স্ব স্ম স্ল হ্ন হ্ম হ্ল চ্ঞ"
  ).split(" "),
);
/** Ra-phala (প্র, গ্র…) after every consonant except these: আমরা and তোমরা are far more common than ম্র. */
const NO_RA_PHALA = new Set(["ম", "র", "য়", "ড়", "ঢ়", "ং"]);

function joins(prev: string, next: string, forced: boolean) {
  if (forced) return true;
  if (next === "র") return !NO_RA_PHALA.has(prev);
  return CONJUNCTS.has(prev + HASANTA + next);
}

function tokenize(input: string): { token: Token | null; raw: string }[] {
  const out: { token: Token | null; raw: string }[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch >= "0" && ch <= "9") {
      out.push({ token: { kind: "digit", value: BN_DIGITS[Number(ch)] }, raw: ch });
      i++;
      continue;
    }
    let hit = PATTERNS.find(([p]) => input.startsWith(p, i));
    // Uppercase letters without their own rule behave like lowercase (Ami → আমি).
    if (!hit && /[A-Z]/.test(ch)) {
      const lower = ch.toLowerCase();
      hit = PATTERNS.find(([p]) => p === lower);
    }
    if (hit) {
      out.push({ token: hit[1], raw: hit[0] });
      i += hit[0].length;
    } else {
      out.push({ token: null, raw: ch });
      i++;
    }
  }
  return out;
}

/** Converts one run of phonetic English to Bangla with Avro-like rules (no dictionary). */
export function transliterate(input: string): string {
  const tokens = tokenize(input);
  let out = "";
  let prev: "start" | "vowel" | "consonant" = "start";
  let lastConsonant = "";
  let forceNext = false;

  tokens.forEach(({ token, raw }, i) => {
    if (!token) {
      out += raw;
      prev = "start";
      return;
    }
    switch (token.kind) {
      case "digit":
        out += token.value;
        prev = "start";
        break;
      case "sign":
        out += token.value;
        break;
      case "vowel":
        out += prev === "consonant" ? token.kar : token.indep;
        prev = "vowel";
        forceNext = false;
        break;
      case "ng": {
        // ঙ before a vowel (বাঙালি), ং otherwise (বাংলা).
        const next = tokens[i + 1]?.token;
        if (next?.kind === "vowel") {
          if (prev === "consonant" && joins(lastConsonant, "ঙ", forceNext)) out += HASANTA;
          out += "ঙ";
          prev = "consonant";
          lastConsonant = "ঙ";
        } else {
          out += "ং";
          prev = "vowel";
        }
        forceNext = false;
        break;
      }
      case "ya":
        if (prev === "consonant") out += HASANTA + "য";
        else {
          out += "য়";
          prev = "consonant";
          lastConsonant = "য়";
        }
        forceNext = false;
        break;
      case "wa":
        if (prev === "consonant") out += HASANTA + "ব";
        else {
          out += "ও";
          prev = "vowel";
        }
        forceNext = false;
        break;
      case "consonant": {
        const first = token.value[0];
        if (prev === "consonant" && joins(lastConsonant, first, forceNext)) out += HASANTA;
        out += token.value;
        prev = "consonant";
        lastConsonant = token.value[token.value.length - 1];
        forceNext = Boolean(token.reph);
        break;
      }
    }
  });
  return out;
}

/* ---------- Dictionary ---------- */

export type BanglaDictionary = Record<string, string | string[]>;

/**
 * Common words people type phonetically, keyed in lowercase. Like Avro's dictionary,
 * it fixes spellings the rules can't guess (তোমাকে, ভালোবাসি, ঢাকা) and is offered first.
 */
export const DEFAULT_BANGLA_DICTIONARY: BanglaDictionary = {
  tomar: "তোমার", tomake: "তোমাকে", tomra: "তোমরা", tomader: "তোমাদের",
  apni: "আপনি", apnar: "আপনার", apnake: "আপনাকে", apnara: "আপনারা",
  ki: ["কী", "কি"], kothay: "কোথায়",
  kon: "কোন", shob: "সব",
  oi: "ওই", eta: "এটা", ota: "ওটা", sheta: "সেটা", okhane: "ওখানে",
  // time
  kalke: "কালকে",
  shokal: "সকাল",
  shondhya: "সন্ধ্যা", sondha: "সন্ধ্যা", shoptaho: "সপ্তাহ", mash: "মাস", shomoy: "সময়",
  // yes, no, to be
  ha: "হ্যাঁ", hya: "হ্যাঁ", acho: "আছো",
  holo: "হলো",
  koro: "করো", jai: "যাই", jabo: "যাব", jacchi: "যাচ্ছি", jao: "যাও",
  jan: "যান", ashi: "আসি", asbo: "আসব", ashbo: "আসব", ashchi: "আসছি", esho: "এসো", ashun: "আসুন",
  dekho: "দেখো", bolo: "বলো",
  shuno: "শোনো", shono: "শোনো", pori: "পড়ি", pora: "পড়া",
  khawa: "খাওয়া", chai: "চাই", dao: "দাও", janina: "জানি না",
  // describing
  bhalo: "ভালো", valo: "ভালো", shundor: "সুন্দর", boro: "বড়",
  choto: "ছোট", purono: "পুরোনো",
  aro: "আরও", o: "ও", jodi: "যদি", karon: "কারণ",
  shotti: "সত্যি", sotti: "সত্যি", mittha: "মিথ্যা",
  // feelings
  bhalobashi: "ভালোবাসি", valobashi: "ভালোবাসি", bhalobasha: "ভালোবাসা",
  hridoy: "হৃদয়", dukkho: "দুঃখ",
  // politeness
  dhonnobad: "ধন্যবাদ", donnobad: "ধন্যবাদ", subho: "শুভ",
  shagotom: "স্বাগতম", dukkhito: "দুঃখিত",
  // family and places
  bon: "বোন",
  manush: "মানুষ", bari: "বাড়ি",
  school: "স্কুল", office: "অফিস", dokan: "দোকান",
  bazar: "বাজার",
  dhaka: "ঢাকা", chottogram: "চট্টগ্রাম", chittagong: "চট্টগ্রাম", sylhet: "সিলেট",
  rajshahi: "রাজশাহী", barishal: "বরিশাল",
  // food and things
  cha: "চা",
  mangsho: "মাংস",
  porikkha: "পরীক্ষা", prosno: "প্রশ্ন",
  biswas: "বিশ্বাস",
  // everyday English loanwords
  computer: "কম্পিউটার", mobile: "মোবাইল", phone: "ফোন", internet: "ইন্টারনেট", email: "ইমেইল",
  facebook: "ফেসবুক", message: "মেসেজ", class: "ক্লাস", bus: "বাস", taka: "টাকা",
  // numbers
  char: "চার", pach: "পাঁচ", shat: "সাত",
  at: "আট",
};

/* ---------- Suggestions ---------- */

/** Other plausible readings the rules alone would miss. */
function variants(roman: string): string[] {
  const out: string[] = [];
  // Trailing o as ো (ভালো) instead of the silent inherent vowel (ভাল).
  if (/[^aeiouAEIOU]o$/.test(roman)) out.push(roman.slice(0, -1) + "O");
  // স and শ are pronounced alike.
  if (/sh/.test(roman)) out.push(roman.replace(/sh/g, "s"));
  else if (/s(?!h)/.test(roman)) out.push(roman.replace(/s(?!h)/g, "sh"));
  // Reph (ধর্ম) when r sits before a consonant.
  if (/r(?=[bcdfgjklmnpstvz])/.test(roman)) out.push(roman.replace(/r(?=[bcdfgjklmnpstvz])/g, "rr"));
  return out.map(transliterate);
}

/**
 * Candidates for one phonetic word: dictionary matches first, then the rule-based reading,
 * then variants. Duplicates removed.
 */
export function suggestBangla(roman: string, dictionary: BanglaDictionary = DEFAULT_BANGLA_DICTIONARY, max = 5): string[] {
  if (!roman) return [];
  const hit = dictionary[roman.toLowerCase()];
  const fromDict = hit === undefined ? [] : Array.isArray(hit) ? hit : [hit];
  return [...new Set([...fromDict, transliterate(roman), ...variants(roman)])].slice(0, max);
}

/** Converts a whole sentence or paragraph, word by word, using the dictionary's first choice. */
export function transliterateText(text: string, dictionary: BanglaDictionary = DEFAULT_BANGLA_DICTIONARY): string {
  return text
    .replace(/[A-Za-z0-9^`]+/g, (word) => suggestBangla(word, dictionary, 1)[0] ?? word)
    .replace(/(\S)\.(?=\s|$)/g, "$1।");
}
