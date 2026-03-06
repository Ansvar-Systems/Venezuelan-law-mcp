# Privacy & Client Confidentiality

**IMPORTANT READING FOR LEGAL PROFESSIONALS**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Venezuelan bar association rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- Venezuelan bar rules (Federación de Colegios de Abogados de Venezuela — FEDECAV) require strict confidentiality (secreto profesional)

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/venezuelan-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/venezuelan-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://venezuelan-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text (texto de la ley), provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (Venezuela)

### Venezuelan Bar Association Rules

Venezuelan lawyers (abogados y abogadas) are bound by strict confidentiality rules under the Ley de Abogados and the Código de Ética Profesional del Abogado Venezolano, regulated by FEDECAV and regional Colegios de Abogados.

#### Secreto Profesional (Duty of Confidentiality)

- All client communications are privileged under the Ley de Abogados and Código de Ética
- Client identity may be confidential in sensitive matters
- Case strategy and legal analysis are protected
- Information that could identify clients or matters must be safeguarded
- Breach of confidentiality may result in disciplinary proceedings before the Tribunal Disciplinario of the relevant Colegio de Abogados

### Venezuelan Data Protection Law (Ley Especial contra los Delitos Informáticos / LOPD)

Under Venezuelan data protection rules:

- The **Ley Especial contra los Delitos Informáticos** (2001) and related instruments govern data handling
- Professional confidentiality rules impose separate obligations independent of data protection law
- When using cloud AI services on client matters, consider your professional ethics obligations as the primary framework

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does Article 1159 of the Código Civil Venezolano say about contracts?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the criminal penalties for corruption under Venezuelan law (Ley Contra la Corrupción)?"
```

- Query pattern may reveal you are working on a specific matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases (Editorial Jurídica Venezolana, Pierre Tapia) with proper agreements

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms (Abogados Independientes / Estudios Jurídicos Pequeños)

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (Editorial Jurídica Venezolana, Pierre Tapia) or official sources (gazetaoficial.gob.ve, tsj.gob.ve) directly

### For Large Firms / Corporate Legal (Firmas Grandes / Departamentos Legales)

1. Evaluate data processing implications before integrating cloud AI tools
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns

### For Government / Public Sector (Entidades Públicas)

1. Use self-hosted deployment, no external APIs
2. Follow applicable Venezuelan government IT security guidelines
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/Venezuelan-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **FEDECAV / Colegio Guidance**: Consult FEDECAV or your regional Colegio de Abogados for professional ethics guidance on AI tool use

---

**Last Updated**: 2026-03-06
**Tool Version**: 1.0.0
