/**
 * Venezuelan Law HTML Parser
 *
 * Parses law HTML from asambleanacional.gob.ve and
 * venezuela.justia.com into structured provisions.
 *
 * Venezuelan civil law article patterns:
 *   "Artículo N."  / "Art. N" / "ARTÍCULO N"
 *   "Artículo Único"
 *
 * Structure patterns:
 *   "TÍTULO I", "CAPÍTULO I", "SECCIÓN I"
 *   "DISPOSICIONES TRANSITORIAS", "DISPOSICIONES FINALES"
 *
 * Definition patterns:
 *   "se entiende por", "a los efectos de", "se define como"
 *
 * No child_process needed — all data is HTML, not PDF.
 */

export interface ActIndexEntry {
  id: string;
  title: string;
  titleEn: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  url: string;
  description?: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: string;
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

/* ---------- HTML Cleaning ---------- */

function decodeEntities(text: string): string {
  return text
    .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á').replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í').replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú').replace(/&Ntilde;/g, 'Ñ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«').replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Strip HTML tags and normalize whitespace.
 * Converts block-level tags to newlines for structure preservation.
 */
function htmlToText(html: string): string {
  return html
    // Convert block tags to newlines
    .replace(/<\/?(p|div|br|li|h[1-6]|tr|dt|dd|blockquote)\b[^>]*\/?>/gi, '\n')
    // Remove remaining tags
    .replace(/<[^>]*>/g, '')
    // Decode entities
    .replace(/&[a-zA-Z]+;/g, m => decodeEntities(m))
    .replace(/&#\d+;/g, m => decodeEntities(m))
    .replace(/&#x[0-9a-fA-F]+;/g, m => decodeEntities(m))
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---------- Article Patterns ---------- */

/**
 * Venezuelan article heading patterns, ordered by specificity.
 *
 * Standard forms:
 *   Artículo 1.    / Art. 1.    / ARTÍCULO 1.
 *   Artículo 1°    / Art. 1°
 *   Artículo 1.-   / Art. 1.-
 *   Artículo Único
 */
const ARTICLE_PATTERNS = [
  // "Artículo N" / "Art. N" / "ARTÍCULO N" with various separators
  /(?:^|\n)\s*(?:ART[ÍI]CULO|Art[íi]culo|ART\.?)\s+((?:\d+[\s.]*(?:bis|ter)?|\d+[A-Z]?(?:\.\d+)?|[ÚU]NICO|[ÚU]nico))\s*[.°º]*[-.:–]?\s*([^\n]*)/gimu,
];

/**
 * Chapter/Title/Section heading patterns for Venezuelan law.
 */
const STRUCTURE_RE = /(?:^|\n)\s*((?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|DISPOSICION(?:ES)?(?:\s+(?:TRANSITORIAS?|FINALES?|DEROGATORIAS?|GENERALES?|COMPLEMENTARIAS?))?)\s+[IVXLC0-9]+[^\n]*)/gimu;

/**
 * Broader structure pattern that also catches DISPOSICIONES without a number.
 */
const DISPOSICIONES_RE = /(?:^|\n)\s*(DISPOSICION(?:ES)?\s+(?:TRANSITORIAS?|FINALES?|DEROGATORIAS?|GENERALES?|COMPLEMENTARIAS?))\s*$/gimu;

/**
 * Definition patterns for Venezuelan legal text.
 */
const DEFINITION_PATTERNS = [
  // "se entiende por X ..." / "se entenderá por X ..."
  /se\s+(?:entiende|entender[áa])\s+por\s+"?([^".:,]+)"?\s*(?:,|:)\s*([^.]+\.)/gi,
  // "a los efectos de esta ley, X es ..."
  /a\s+los\s+efectos\s+de\s+(?:esta|la\s+presente)\s+(?:ley|norma)[^:]*:\s*\n?\s*(?:\d+[.)]\s*)?([^:–-]+)\s*[:–-]\s*([^.;]+[.;])/gim,
  // "se define como X ..."
  /se\s+define(?:n)?\s+como\s+"?([^".:,]+)"?\s*(?:,|a|:)\s*([^.]+\.)/gi,
  // Definition lists: "N. Term: definition" or "N) Term.- definition"
  /(?:^|\n)\s*\d+[.)]\s*([^:–.\n]{3,60})\s*[:–.]-?\s+([^.;]{20,}[.;])/gim,
];

/* ---------- Parsing ---------- */

/**
 * Find the start of actual law text, skipping preambles.
 * Venezuelan laws often begin with "EL PRESIDENTE DE LA REPÚBLICA",
 * "LA ASAMBLEA NACIONAL", or "DECRETA:".
 */
function findLawTextStart(text: string): number {
  const startPatterns = [
    /\bLA\s+ASAMBLEA\s+NACIONAL\b/i,
    /\bEL\s+PRESIDENTE\s+DE\s+LA\s+REP[ÚU]BLICA\b/i,
    /\bCONSIDERANDO\b/i,
    /\bDECRETA\s*:/i,
    /\bRESUELVE\s*:/i,
    /(?:^|\n)\s*(?:ART[ÍI]CULO|Art[íi]culo)\s+(?:1|PRIMERO|[ÚU]NICO)\s*[.°º]*[-.:–]/im,
  ];

  let earliestPos = text.length;
  for (const pattern of startPatterns) {
    const match = pattern.exec(text);
    if (match && match.index < earliestPos) {
      earliestPos = match.index;
    }
  }

  return earliestPos === text.length ? 0 : earliestPos;
}

/**
 * Parse cleaned text into structured provisions.
 */
export function parseVELawText(text: string, act: ActIndexEntry): ParsedAct {
  const cleaned = htmlToText(text);
  const startIdx = findLawTextStart(cleaned);
  const lawText = cleaned.substring(startIdx);

  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  interface Heading {
    ref: string;
    title: string;
    position: number;
  }

  const headings: Heading[] = [];

  // Extract article headings
  for (const pattern of ARTICLE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = re.exec(lawText)) !== null) {
      const num = match[1].replace(/\s+/g, '').replace(/\.$/, '');
      const title = (match[2] ?? '').trim();
      const ref = `art${num.toLowerCase()}`;

      // Avoid duplicate refs at the same position
      if (!headings.some(h => h.ref === ref && Math.abs(h.position - match!.index) < 20)) {
        headings.push({
          ref,
          title: title || `Artículo ${num}`,
          position: match.index,
        });
      }
    }
  }

  // Sort by position
  headings.sort((a, b) => a.position - b.position);

  // Collect chapter/section headings for context
  const chapterPositions: { chapter: string; position: number }[] = [];

  const structRe = new RegExp(STRUCTURE_RE.source, STRUCTURE_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = structRe.exec(lawText)) !== null) {
    chapterPositions.push({
      chapter: match[1].trim(),
      position: match.index,
    });
  }

  // Also catch DISPOSICIONES headings without numbers
  const dispRe = new RegExp(DISPOSICIONES_RE.source, DISPOSICIONES_RE.flags);
  while ((match = dispRe.exec(lawText)) !== null) {
    // Avoid duplicates from the structure RE
    if (!chapterPositions.some(cp => Math.abs(cp.position - match!.index) < 10)) {
      chapterPositions.push({
        chapter: match[1].trim(),
        position: match.index,
      });
    }
  }

  chapterPositions.sort((a, b) => a.position - b.position);

  // Extract text between article headings
  let currentChapter = '';
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];
    const endPos = nextHeading ? nextHeading.position : lawText.length;
    const rawBlock = lawText.substring(heading.position, endPos).trim();

    // Determine current chapter
    for (const cp of chapterPositions) {
      if (cp.position <= heading.position) {
        currentChapter = cp.chapter;
      }
    }

    // Clean: join lines and remove excessive whitespace
    const cleanedBlock = rawBlock
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    if (cleanedBlock.length > 10) {
      provisions.push({
        provision_ref: heading.ref,
        chapter: currentChapter || undefined,
        section: currentChapter || act.title,
        title: heading.title,
        content: cleanedBlock,
      });
    }
  }

  // Extract definitions
  for (const pattern of DEFINITION_PATTERNS) {
    const defRe = new RegExp(pattern.source, pattern.flags);
    while ((match = defRe.exec(lawText)) !== null) {
      const term = (match[1] ?? '').trim();
      const definition = (match[2] ?? '').trim();

      if (term.length > 2 && term.length < 100 && definition.length > 10) {
        // Find source provision
        let sourceProvision: string | undefined;
        for (let i = headings.length - 1; i >= 0; i--) {
          if (headings[i].position <= match.index) {
            sourceProvision = headings[i].ref;
            break;
          }
        }

        // Avoid duplicate definitions
        if (!definitions.some(d => d.term.toLowerCase() === term.toLowerCase())) {
          definitions.push({ term, definition, source_provision: sourceProvision });
        }
      }
    }
  }

  // Fallback: if no articles were found, treat entire text as a single provision
  if (provisions.length === 0 && lawText.length > 50) {
    provisions.push({
      provision_ref: 'full-text',
      section: act.title,
      title: act.title,
      content: lawText.substring(0, 50000),
    });
  }

  return {
    id: act.id,
    type: 'statute',
    title: act.title,
    title_en: act.titleEn,
    short_name: act.shortName,
    status: act.status,
    issued_date: act.issuedDate,
    in_force_date: act.inForceDate,
    url: act.url,
    provisions,
    definitions,
  };
}

/**
 * Parse raw HTML (as fetched from the portal) into a ParsedAct.
 *
 * Extracts the law body from the HTML page, strips tags,
 * and delegates to parseVELawText for article parsing.
 */
export function parseVELawHtml(html: string, act: ActIndexEntry): ParsedAct {
  // Try to extract the main body area.
  // The Asamblea Nacional site wraps law text in various containers.
  let bodyHtml = html;

  const wrapperPatterns = [
    // Common CMS wrappers
    /<div[^>]*class=["'][^"']*(?:entry-content|law-content|post-content|article-content|content-body|ley-texto)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    // <article> tag
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // Main tag
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    // Justia wrapper
    /<div[^>]*id=["'](?:content|page-content|main-content)["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of wrapperPatterns) {
    const m = pattern.exec(html);
    if (m && m[1] && m[1].length > 200) {
      bodyHtml = m[1];
      break;
    }
  }

  const text = htmlToText(bodyHtml);

  if (!text || text.trim().length < 50) {
    return {
      id: act.id,
      type: 'statute',
      title: act.title,
      title_en: act.titleEn,
      short_name: act.shortName,
      status: act.status,
      issued_date: act.issuedDate,
      in_force_date: act.inForceDate,
      url: act.url,
      provisions: [],
      definitions: [],
    };
  }

  return parseVELawText(text, act);
}
