# Privacy & Client Confidentiality

**IMPORTANT READING FOR LEGAL PROFESSIONALS**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Venezuelan bar rules and the data protection landscape in Venezuela.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- Venezuelan abogados are bound by the **secreto profesional** under Article 25 of the Código de Ética del Abogado Venezolano — transmitting client details to cloud infrastructure may breach this duty
- Venezuela has **no comprehensive data protection law** — users cannot rely on a GDPR equivalent or a functioning data protection authority to govern third-party data processors

**Safe Use Options:**
1. **General Legislative Research**: Use the Tool for non-client-specific queries about Venezuelan legislation
2. **Local npm Package**: Install `@ansvar/venezuelan-law-mcp` locally — database queries stay on your machine
3. **Remote Vercel Endpoint**: Queries transit Vercel infrastructure — unsuitable for privileged matters
4. **On-Premise Deployment**: Self-host with a local LLM for client-specific or sensitive work

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

The MCP server itself collects nothing. However, the query text passes through whatever AI infrastructure hosts the MCP client session.

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/venezuelan-law-mcp
```

- The SQLite database is a local file on your machine
- No data is transmitted to external servers (except to the AI client for LLM processing)
- Full control over data at rest
- Recommended for matters involving client-identifying information or case-specific facts

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://venezuelan-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure (Vercel Inc., USA)
- Tool responses return through the same path
- Subject to Vercel's privacy policy and US law
- Not appropriate for queries containing client details, case-specific facts, or commercially sensitive information

#### 3. On-Premise Deployment

- Self-host the MCP server and a local LLM (e.g., Ollama)
- No data leaves your infrastructure
- Required for classified, highly sensitive, or privilege-critical matters

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters, including any legal terms you enter
- **Tool Responses**: Statute text (textos legales), provision content, search results drawn from the local database
- **Metadata**: Timestamps and request identifiers managed by the AI client

**What Does NOT Get Transmitted by This Tool:**
- Files on your computer
- Your full conversation history (depends on AI client configuration — check your AI client's settings)
- Any client data (this Tool stores none)

---

## Professional Obligations (Venezuela)

### INPREABOGADO and the Código de Ética

Abogados practising in Venezuela must be registered with **INPREABOGADO** (Instituto de Previsión Social del Abogado — inpreabogado.org.ve). Professional conduct is governed by the **Código de Ética del Abogado Venezolano**, which establishes binding obligations that bear directly on the use of cloud-based legal research tools.

#### Secreto Profesional (Professional Secrecy) — Article 25

Article 25 of the Código de Ética del Abogado Venezolano establishes the duty of professional secrecy (secreto profesional):

- All information received from or about a client in the course of professional representation is covered
- Client identity may be confidential in matters where disclosure would harm the client
- Case strategy, factual instructions, and legal analysis are protected
- The secreto profesional extends beyond the termination of the client relationship
- Transmitting client-identifying details to foreign cloud infrastructure (Anthropic, Vercel) may constitute a breach of the secreto profesional
- Breach may result in disciplinary proceedings before the Tribunal Disciplinario del Colegio de Abogados and INPREABOGADO

### Duty of Diligence and Competence

The Código de Ética requires abogados to exercise diligence (diligencia) and competence (idoneidad) in all professional activities. Using AI research tools requires understanding how those tools process and transmit data, and taking appropriate steps to prevent client information from reaching unauthorised third parties.

---

## Data Protection Law Context (Venezuela)

### No Comprehensive Data Protection Law

As of 2026, **Venezuela does not have a comprehensive data protection law**. There is no Venezuelan equivalent to the GDPR and no independent data protection authority with jurisdiction over general data processing activities.

This means:

- There is no statutory right to erasure, access, or portability of personal data under Venezuelan law
- No formal data processing agreement requirement exists under Venezuelan domestic law
- Users cannot compel AI service providers to comply with Venezuelan data protection standards under statute

### Constitutional Habeas Data Rights

The **Constitución de la República Bolivariana de Venezuela** (1999) provides a constitutional habeas data right under **Article 28**, which grants individuals the right to access, correct, and destroy information held about them in registers. However:

- Article 28 is directed primarily at government registers and databases
- It does not establish the detailed operational framework of a data protection statute
- Enforcement mechanisms and the practical scope of the right remain limited in the current institutional environment

### Ley Especial contra Delitos Informáticos (2001)

The **Ley Especial contra Delitos Informáticos** (LECDI, 2001) addresses certain cyber-related offences, including unauthorised access to systems and misuse of data. It does not constitute comprehensive data protection legislation and does not govern the use of cloud AI services for legal research.

### Indirect GDPR Exposure

If you process personal data of **EU residents** (for example, advising a Spanish or EU-based client on Venezuelan law matters), the **General Data Protection Regulation (GDPR)** may apply to your processing activities as a controller, regardless of your location in Venezuela. In that case:

- You would be the **Data Controller** for EU resident personal data
- Anthropic and Vercel may be **Data Processors** requiring a formal **Data Processing Agreement (DPA)**
- Transferring EU resident personal data to US-based infrastructure requires appropriate safeguards under GDPR Article 46

This is a complex cross-border question. Consult a lawyer with GDPR expertise before processing EU resident data through cloud AI tools.

### Practical Consequence

The absence of a comprehensive local data protection law means legal professionals in Venezuela must rely on:

1. **Professional conduct rules** (secreto profesional under the Código de Ética del Abogado Venezolano) as the primary constraint on data sharing
2. **Contractual terms** with AI service providers (Anthropic's terms of service, Vercel's data processing terms)
3. **Client consent and engagement letter terms**, where appropriate, to document the client's awareness of research tools used
4. **Deployment architecture choices** — local or on-premise deployment to avoid transmission risk altogether

---

## Risk Assessment by Use Case

### LOW RISK: General Legislative Research

**Safe to use through any deployment:**

```
Example: "What does Article 61 of the Código Penal de Venezuela say about criminal intent?"
```

- No client identity involved
- No case-specific facts
- Publicly available legislative text

### MEDIUM RISK: Anonymised Queries

**Use with caution — even through cloud deployments:**

```
Example: "What are the penalties for estafa (fraud) under Venezuelan criminal law?"
```

- Query pattern may reveal the nature of a matter you are working on
- Anthropic/Vercel infrastructure logs may associate queries with your API key
- Avoid including details that, in combination, could identify a client or case

### HIGH RISK: Client-Specific Queries

**Do NOT transmit through cloud AI services:**

- Remove ALL identifying details before querying
- Use the local npm package with a self-hosted LLM
- Or conduct research directly through the Gaceta Oficial (gacetaoficial.gob.ve) and TSJ (tsj.gob.ve) with no third-party data transmission

Examples of HIGH RISK query content:
- Client names, company names, RIF (Registro de Información Fiscal) numbers
- Specific dates, transaction amounts, or case numbers linked to an identifiable matter
- Details about ongoing judicial proceedings (expedientes)
- Combinations of facts that together identify a client, case, or adverse party

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only (Venezuelan legislation text). No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using the remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

Neither Anthropic nor Vercel is subject to Venezuelan law oversight. Assess their terms of service independently before using these services for professional legal work.

---

## Recommendations

### For Solo Practitioners (Abogados Independientes)

1. Use the local npm package for maximum confidentiality protection
2. Use cloud AI only for non-client-specific general legislative research
3. For client matters, consult the Gaceta Oficial (gacetaoficial.gob.ve) and TSJ (tsj.gob.ve) directly and document your sources
4. Consider including AI tool use disclosure in your engagement letters where appropriate

### For Law Firms (Firmas de Abogados)

1. Establish an internal policy on AI tool use that addresses the secreto profesional obligations under the Código de Ética
2. Train staff on what constitutes safe versus unsafe query content
3. Consider on-premise deployment for matters involving sensitive or high-value client information
4. Where EU resident client data is involved, assess GDPR obligations and obtain appropriate data processing agreements

### For Corporate Legal Departments (Departamentos Jurídicos Corporativos)

1. Review AI tool use policies against the confidentiality obligations in employment contracts and client agreements
2. Use on-premise deployment for internal legal matters involving commercially sensitive or regulated information
3. Do not assume Venezuelan law provides effective data protection recourse against foreign AI providers — no comprehensive statutory framework exists

### For Government and Public Authorities (Organismos Públicos)

1. Use self-hosted deployment — no external cloud APIs
2. Queries relating to unpublished government decisions, internal legal opinions, or policy positions must not be transmitted to external infrastructure
3. Follow any applicable Venezuelan government IT security requirements and classifications

---

## Questions and Support

- **Privacy Questions**: Open an issue on [GitHub](https://github.com/Ansvar-Systems/venezuelan-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **Bar Guidance**: Consult INPREABOGADO (inpreabogado.org.ve) or your Colegio de Abogados for ethics guidance on AI tool use in legal practice

---

**Last Updated**: 2026-03-06
**Tool Version**: 1.0.0
