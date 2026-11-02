# Security, Privacy & Boundary Audit Report
**Project:** AI Workspace (Workflow AI)  
**Author:** Yash Raj (Member 4 - Class Roll No: 2360014)  
**Mentor:** Prof. Sajal Mitra  
**Week 7 Milestone:** Conduct user testing, security/basic privacy checks, and regression testing.  

---

## 1. Google OAuth & External Integration Boundaries
A critical security requirement specified in `09 - Security and Privacy.md` is ensuring that the AI Workspace never compromises user accounts or performs unauthorized write operations:

| Security Checklist Item | Verification Status | Implementation Proof |
|---|---|---|
| **Restricted Read-Only Scopes** | **COMPLIANT** | Only `gmail.readonly` and `calendar.readonly` requested. Zero compose/send/modify scopes. |
| **No Google Write Endpoints** | **COMPLIANT** | Audited all server routes in `server/src/routes/calendarRoutes.ts`. Zero POST/PATCH/DELETE endpoints exist for calendar events. |
| **Server-Side Token Storage** | **COMPLIANT** | Google access and refresh tokens are strictly handled server-side. Never exposed in API responses or browser storage. |
| **User Data Isolation** | **COMPLIANT** | All data queries in `server/src/database/store.ts` enforce `userId === req.user.id`. |
| **Prompt Injection Protection** | **COMPLIANT** | Email content, note text, and uploaded documents are handled strictly as passive data parameters, not executable instructions. |

---

## 2. Token Lifecycle & Authentication Security
- **JWT Session Tokens:** Generated with HMAC-SHA256 and signed with environment-protected secret keys (`JWT_SECRET`).
- **Session Expiry:** 7 days rolling validity. Revocation on logout removes active session tokens.
- **Password Protection:** Uses `bcryptjs` with salt rounds = 10. Passwords never stored in plaintext.

---

## 3. Privacy & Data Minimization Audit
- Full email bodies are **not** permanently persisted in the application database. Only extracted candidate tasks, dates, and source references are retained with user consent.
- Uploaded files are isolated within user-scoped paths and subject to maximum 10 MB size limits and MIME validation.
- Activity audit logs record high-level operational events (`TASK_CREATED`, `PLAN_GENERATED`) without storing sensitive content.
