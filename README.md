# Venezuelan Law MCP Server

**The venezuela.justia.com alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fvenezuelan-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/venezuelan-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Venezuelan-law-mcp?style=social)](https://github.com/Ansvar-Systems/Venezuelan-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Venezuelan-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Venezuelan-law-mcp/actions/workflows/ci.yml)
[![Provisions](https://img.shields.io/badge/provisions-21%2C391-blue)]()

Query **474 Venezuelan statutes** -- from the Código Civil and Código Penal to the Ley Orgánica del Trabajo, Ley de Protección al Consumidor, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Venezuelan legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Venezuelan legal research means navigating the Gaceta Oficial, cross-referencing legislation through SAREN and official ministry portals, and manually tracking amendments in an environment where legal databases are fragmented and inconsistent. Whether you're:

- A **lawyer** validating citations in a brief or contract before Venezuelan courts
- A **compliance officer** checking obligations under the Ley de Protección de Datos or labor and tax regulations
- A **legal tech developer** building tools for the Venezuelan or Latin American market
- A **researcher** tracing legislative history across 474 Venezuelan statutes

...you shouldn't need dozens of browser tabs and manual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Venezuelan law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://venezuelan-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add venezuelan-law --transport http https://venezuelan-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "venezuelan-law": {
      "type": "url",
      "url": "https://venezuelan-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "venezuelan-law": {
      "type": "http",
      "url": "https://venezuelan-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/venezuelan-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "venezuelan-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/venezuelan-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "venezuelan-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/venezuelan-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally (Spanish examples):

- *"¿Qué dice el Código Civil venezolano sobre las obligaciones contractuales?"*
- *"¿Cuáles son los derechos fundamentales del trabajador según la Ley Orgánica del Trabajo?"*
- *"Busca disposiciones sobre responsabilidad civil en la legislación venezolana"*
- *"¿Qué establece el Código de Comercio sobre las sociedades mercantiles?"*
- *"¿Está vigente la Ley de Protección al Consumidor y al Usuario?"*
- *"¿Cuáles son los requisitos del Código Penal para el delito de estafa?"*
- *"Valida la cita del Código Civil, artículo 1.185 sobre responsabilidad extracontractual"*
- *"Construye un argumento legal sobre protección de datos personales en Venezuela"*
- *"¿Qué dice la Ley Orgánica Procesal del Trabajo sobre los procedimientos laborales?"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes** | 474 statutes | Comprehensive Venezuelan legislation |
| **Provisions** | 21,391 sections | Full-text searchable with FTS5 |
| **Database Size** | ~31 MB | Optimized SQLite, portable |
| **Freshness Checks** | Automated | Drift detection against source |

**Verified data only** -- every citation is validated against official sources (venezuela.justia.com). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from [venezuela.justia.com](https://venezuela.justia.com) and official Venezuelan government sources
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by statute identifier + chapter/section
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
venezuela.justia.com --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                           ^                        ^
                    Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search Justia by statute name | Search by plain Spanish: *"responsabilidad civil extracontractual"* |
| Navigate multi-article codes manually | Get the exact provision with context |
| Manual cross-referencing between codes | `build_legal_stance` aggregates across sources |
| "¿Está vigente esta ley?" → check manually | `check_currency` tool → answer in seconds |
| Find international basis → dig through OAS/IACHR | `get_eu_basis` → linked international instruments |
| No API, no integration | MCP protocol → AI-native |

**Traditional:** Search Gaceta Oficial → Locate PDF → Ctrl+F → Cross-reference with Código Civil or LOTTT → Repeat

**This MCP:** *"¿Cuáles son las causales de despido justificado según la LOTTT?"* → Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 21,391 provisions with BM25 ranking. Supports quoted phrases, boolean operators, prefix wildcards |
| `get_provision` | Retrieve specific provision by statute identifier + article/section number |
| `check_currency` | Check if a statute is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple statutes for a legal topic |
| `format_citation` | Format citations per Venezuelan legal conventions |
| `list_sources` | List all available statutes with metadata and coverage scope |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get international instruments (OAS, IACHR, ILO conventions) that a Venezuelan statute aligns with |
| `get_venezuelan_implementations` | Find Venezuelan laws aligning with a specific international instrument |
| `search_eu_implementations` | Search international documents with Venezuelan implementation counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Venezuelan statutes against international standards |

---

## International Law Alignment

Venezuela is not an EU member state, but Venezuelan law intersects with several international frameworks:

- **IACHR (Inter-American Court of Human Rights)** -- Venezuela was subject to the American Convention on Human Rights; IACHR jurisprudence has historically influenced Venezuelan constitutional law
- **ILO Conventions** -- Venezuela ratified core ILO conventions; the Ley Orgánica del Trabajo (LOTTT) reflects these labor rights obligations
- **OAS frameworks** -- Venezuela participated in OAS conventions on anti-corruption (Convención de Belém do Pará) and other multilateral instruments
- **UN frameworks** -- Venezuelan criminal and civil law reflects obligations under UN human rights treaties, the UNCAC anti-corruption convention, and related instruments
- **FATF/GAFILAT** -- Anti-money laundering statutes align with FATF recommendations (Venezuela is a GAFILAT member)

The international alignment tools allow you to explore these relationships -- checking which Venezuelan provisions correspond to treaty obligations, and vice versa.

> **Note:** International cross-references reflect alignment and treaty relationships. Venezuelan law operates in a distinct civil law tradition, and the tools help identify where Venezuelan and international frameworks address similar domains.

---

## Data Sources & Freshness

All content is sourced from authoritative Venezuelan legal databases:

- **[venezuela.justia.com](https://venezuela.justia.com)** -- Comprehensive Venezuelan statute database
- **[Asamblea Nacional de Venezuela](http://www.asambleanacional.gob.ve)** -- Official legislative portal
- **[Gaceta Oficial](https://www.gacetaoficialvenezuela.com)** -- Official gazette for promulgated legislation

### Data Provenance

| Field | Value |
|-------|-------|
| **Primary source** | venezuela.justia.com |
| **Retrieval method** | Structured ingestion from official sources |
| **Language** | Spanish |
| **Coverage** | 474 Venezuelan statutes |
| **Database size** | ~31 MB |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Docker Security** | Container image scanning + SBOM generation | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Venezuelan legal databases. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources (Gaceta Oficial) for court filings
> - **International cross-references** reflect alignment relationships, not formal transposition
> - **State and municipal legislation is not included** -- this covers national statutes only
> - **Verify amendment status** -- Venezuelan law changes frequently; always confirm currency against the Gaceta Oficial

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

### Professional Responsibility

Members of the **Federación de Colegios de Abogados de Venezuela** should ensure any AI-assisted research complies with professional ethics rules on competence and verification of sources before relying on output in client matters or court filings.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Venezuelan-law-mcp
cd Venezuelan-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest           # Ingest statutes from source
npm run build:db         # Rebuild SQLite database
npm run drift:detect     # Run drift detection against anchors
npm run check-updates    # Check for source updates
npm run census           # Generate coverage census
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~31 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate across 474 statutes

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/colombian-law-mcp](https://github.com/Ansvar-Systems/Colombian-law-mcp)
**Query Colombian statutes directly from Claude** -- Latin American legal research companion. `npx @ansvar/colombian-law-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

**70+ national law MCPs** covering Brazil, Canada, Colombia, Cuba, Denmark, France, Germany, Guyana, Honduras, Ireland, Netherlands, Nicaragua, Norway, Panama, El Salvador, Sweden, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law coverage (Tribunal Supremo de Justicia)
- Gaceta Oficial amendment tracking
- International treaty cross-reference mapping
- Historical statute versions

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (474 statutes, 21,391 provisions)
- [x] International law alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law expansion (TSJ decisions)
- [ ] Gaceta Oficial automated amendment tracking
- [ ] Historical statute versions
- [ ] Regulatory guidance documents

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{venezuelan_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Venezuelan Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Venezuelan-law-mcp},
  note = {474 Venezuelan statutes with 21,391 provisions and international law alignment}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Venezuelan Government (public domain via official sources)
- **International Metadata:** OAS/UN public domain

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server is part of our Latin American legal coverage expansion -- because navigating 474 statutes across a fragmented portal ecosystem shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
