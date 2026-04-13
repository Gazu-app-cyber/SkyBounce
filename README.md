# SkyBounce

SkyBounce e um jogo casual mobile/web reconstruido em React + Vite, com foco em partidas curtas, controles simples, monetizacao, skins, ranking e fluxo pronto para deploy web.

## Stack atual

- React
- Vite
- React Router
- Axios
- CSS comum
- Vercel Functions
- Upstash Redis

## Arquitetura

O projeto foi reorganizado para remover a dependencia do Base44 e manter o comportamento principal do app original.

- `src/app/`: definicao das rotas
- `src/pages/`: paginas principais do app
- `src/components/game/`: canvas, HUD, modais e UI do jogo
- `src/components/layout/`: shell de layout
- `src/context/`: autenticacao e sessao
- `src/api/`: cliente axios e chamadas da API
- `src/hooks/`: estado derivado, perfil, audio e modais por rota
- `src/lib/`: configuracoes do jogo e persistencia local
- `src/styles/`: estilos globais, do jogo e dos modais
- `api/`: backend serverless para deploy web

## Rotas

- `/login`: entrada/autenticacao local
- `/`: tela principal do jogo
- `/shop`: abre a loja
- `/leaderboard`: abre o ranking
- `/stats`: abre as estatisticas

As rotas de modal funcionam com React Router e preservam o fluxo de voltar do navegador/dispositivo.

## Funcionalidades implementadas

- gameplay de toque com dificuldade progressiva
- sessoes rapidas com pontuacao crescente
- tela de game over com tentar novamente, voltar ao menu e continuar por anuncio
- skins de bola e skins de mapa
- loja com itens, vidas extras e remocao de anuncios
- ranking global/semanal com destaque da posicao do jogador
- estatisticas do jogador com exclusao de conta
- audio sintetizado via Web Audio API
- persistencia local com sincronizacao via API quando disponivel
- fallback local para uso sem backend configurado

## Substituicoes do Base44

O app original dependia de:

- autenticacao Base44
- entidades `PlayerProfile` e `LeaderboardEntry`
- client SDK proprietario

Nesta versao, isso foi substituido por:

- sessao local simples em React Context
- API REST com axios
- armazenamento local para fallback
- backend serverless proprio em `api/`

## Como rodar localmente

```bash
npm install
npm run dev
```

Abra o projeto em:

```bash
http://localhost:5173
```

Se o backend nao estiver configurado, o app continua funcionando localmente no navegador com persistencia local.

## Variaveis de ambiente

Para frontend + backend web:

```bash
VITE_SKYBOUNCE_API_URL=/api
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Se quiser usar apenas o frontend localmente, a API pode ficar sem configuracao e o fallback local sera usado.

## API web

As funcoes serverless ficam em `api/` e foram preparadas para Vercel.

Endpoints:

- `GET /api/health`
- `GET /api/profile?playerId=...`
- `PUT /api/profile`
- `DELETE /api/profile?playerId=...`
- `GET /api/leaderboard?scope=global|weekly&playerId=...`
- `POST /api/leaderboard/runs`

## Deploy web no Vercel

1. Importe o repositorio no Vercel.
2. Configure as variaveis de ambiente.
3. Faça o deploy.

O arquivo `vercel.json` ja inclui rewrite para SPA, entao as rotas `/shop`, `/leaderboard` e `/stats` continuam funcionando corretamente no deploy.

## Build de producao

```bash
npm run build
npm run preview
```

## Estrutura principal

```text
src/
  api/
  app/
  components/
    game/
    layout/
  context/
  hooks/
  lib/
  pages/
  styles/
api/
  health.js
  profile.js
  leaderboard.js
  leaderboard/
    runs.js
```

## Proximos passos recomendados

- conectar IAP e anuncios reais para mobile
- substituir o audio sintetizado por assets royalty-free finais
- reforcar validacoes do backend para leaderboard em producao
- publicar um deploy web ativo no Vercel
