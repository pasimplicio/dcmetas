# Baseline Funcional — DCMetas

**Data**: 2026-04-24
**Objetivo**: Registrar o estado funcional do sistema antes de qualquer refatoração.

---

## Ambiente

| Item | Valor |
|---|---|
| Node.js | v22.14.0 |
| npm | 10.9.2 |
| OS | Windows |
| Banco | SQLite (better-sqlite3) — WAL mode |
| Frontend | Vite 5 + React 18 — porta 5173 |
| Backend | Express 5 — porta 3001 |

## Comandos de Execução

```bash
# Backend
node server.js

# Frontend
npm run dev

# Ambos simultâneos
npm start
```

---

## Rotas da API — Status Validado

| Método | Rota | Status | Tamanho | Tipo |
|---|---|---|---|---|
| GET | `/api/stats` | 200 ✅ | 108 bytes | Leitura |
| GET | `/api/regionais` | 200 ✅ | 135 bytes | Leitura |
| GET | `/api/dashboard` | 200 ✅ | 4.7 MB | Leitura |
| GET | `/api/cortes` | 200 ✅ | 2.3 KB | Leitura |
| GET | `/api/os/pendentes` | 200 ✅ | 24 KB | Leitura |
| GET | `/api/os/pendentes/export` | 200 ✅ | CSV | Leitura |
| GET | `/api/datasource` | 200 ✅ | 98 bytes | Leitura |
| GET | `/api/datasource/test` | 200 ✅ | — | Leitura |
| GET | `/api/pg/dashboard` | 501 (stub) | — | Leitura |
| GET | `/api/pg/cortes` | 501 (stub) | — | Leitura |
| POST | `/api/import` | 200 ✅ | — | **Admin** |
| POST | `/api/clear` | 200 ✅ | — | **Admin** |
| POST | `/api/datasource` | 200 ✅ | — | **Admin** |

## Telas do Frontend

| Tela | Rota | Status |
|---|---|---|
| Arrecadação (Dashboard) | `/` | ✅ Funcional |
| Cortes | `/cortes` | ✅ Funcional |
| O.S. Pendentes | `/os/pendentes` | ✅ Funcional |
| Importação | `/importar` | ✅ Funcional |
| Configurações | `/configuracoes` | ✅ Funcional |

---

## Observações

- O `.env` contém credenciais reais de PostgreSQL (leitura). Está no `.gitignore`.
- O banco SQLite pesa ~68 MB e está no `.gitignore`.
- Rotas `/api/pg/*` são stubs (501) — aguardam mapeamento de tabelas.
- Rotas admin (`/api/import`, `/api/clear`, `/api/datasource` POST) não possuem proteção.
