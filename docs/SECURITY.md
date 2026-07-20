# Segurança, LGPD e Open Finance — SubscriptionHub

## 1. OWASP Top 10 (2021) — mitigações

| Risco | Mitigação |
|-------|-----------|
| A01 Broken Access Control | Guards JWT; checagem `resource.userId === req.user.id` em todo serviço; sem IDs adivinháveis únicos sem auth |
| A02 Cryptographic Failures | TLS 1.2+; Argon2id; AES-256-GCM para secrets; hashes de tokens; sem secrets em logs |
| A03 Injection | Prisma parametrizado; validação Zod/class-validator; sanitize HTML em rich text |
| A04 Insecure Design | Threat modeling por domínio; rate limits; confirmação humana em detecções |
| A05 Security Misconfiguration | Headers Helmet; CORS allowlist; secrets via env; least privilege DB |
| A06 Vulnerable Components | Dependabot/pnpm audit no CI; pin de versões |
| A07 Auth Failures | Refresh rotation; revoke family on reuse; MFA fase 2; lockout progressivo |
| A08 Software/Data Integrity | CI signed builds; checksums; webhooks com HMAC |
| A09 Logging/Monitoring Failures | Audit logs + Sentry + alertas de anomalia de login |
| A10 SSRF | Allowlist de URLs em fetch de logos; bloqueio de IPs privados |

## 2. Autenticação e sessões

- Access JWT: 15 minutos, claim `sub`, `sid`, `ver`
- Refresh: 30 dias, opaco, armazenado com hash, rotação a cada uso
- Reuse detection: revoga família de tokens
- Cookies web: `HttpOnly`, `Secure`, `SameSite=Lax` (Strict em fluxos sensíveis)
- CSRF: double-submit cookie em mutações cookie-based; Bearer isento de CSRF clássico

## 3. Proteções de aplicação

- Helmet (CSP report-only → enforce)
- Rate limiting Redis (IP + user)
- Input validation em boundary
- Output encoding React (default XSS safe)
- Upload: tipo MIME sniff + size limit + vírus scan fase 2
- CORS: origins de produção explícitas

## 4. LGPD

### Bases legais

- Execução de contrato (prestação do serviço)
- Consentimento (Open Finance, Gmail, marketing)
- Legítimo interesse limitado (segurança antifraude)

### Direitos do titular

- Acesso, correção, portabilidade (export JSON/CSV)
- Eliminação (soft → hard delete assíncrono)
- Revogação de consentimento por integração
- Informações sobre compartilhamento (suboperadores)

### Minimização

- Não armazenar PAN completo de cartão (apenas brand + last4)
- Corpo de e-mail: extrair campos e opcionalmente descartar raw após N dias
- Retenção de audit logs configurável (default 2 anos)

## 5. Open Finance Brasil

- Integração via **iniciador/agregador** certificado (parceiro), nunca reinventar o framework regulatório no MVP
- Consentimento com finalidade e prazo explícitos
- Tokens em cofre cifrado; rotação e revogação
- Logs de acesso a dados financeiros
- UX de transparência: o que será lido e por quanto tempo
- Desconexão remove credenciais e permite apagar transações importadas

## 6. IA e privacidade

- System prompt proíbe vazar dados de outros usuários
- Tools sempre filtradas por `userId` do token
- Não treinar modelos em dados do usuário sem opt-in
- Redaction de PII em logs de prompts (e-mail, CPF se presente)

## 7. Checklist de release

- [ ] Secrets fora do repositório
- [ ] Migrações revisadas
- [ ] Rate limits ativos
- [ ] Sentry DSN produção
- [ ] Backup Postgres testado
- [ ] Política de privacidade e termos publicados
