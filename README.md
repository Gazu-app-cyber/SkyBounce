# SkyBounce

Jogo casual mobile/web com foco em sessoes curtas, monetizacao, leaderboard e preparo para publicacao.

## O que ja esta pronto

- gameplay de toque com dificuldade progressiva
- tela de derrota com reinicio, voltar ao menu e continue por anuncio
- skins de mapa e progresso local
- stats, persistencia e remocao de anuncios por compra unica
- leaderboard com fallback local
- backend serverless em `api/` para perfil e ranking
- deploy web preparado para Vercel

## Rodando localmente

```bash
npm install
npm run dev
```

Sem backend configurado, o app funciona com fallback local no navegador.

## Backend web

As funcoes serverless ficam em `api/` e usam Upstash Redis.

Variaveis necessarias no deploy:

```bash
VITE_SKYBOUNCE_API_URL=/api
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Endpoints:

- `GET /api/health`
- `GET /api/profile?playerId=...`
- `PUT /api/profile`
- `DELETE /api/profile?playerId=...`
- `GET /api/leaderboard?scope=global|weekly&playerId=...`
- `POST /api/leaderboard/runs`

## Deploy web no Vercel

1. Importe o repositorio no Vercel.
2. Configure as variaveis do arquivo `.env.example`.
3. Faca o deploy.

O arquivo `vercel.json` ja inclui rewrite para SPA, entao rotas como `/shop`, `/leaderboard` e `/stats` continuam funcionando.

## Build

```bash
npm run build
```
