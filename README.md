# ♿ AcessaAqui — Aplicativo de Acessibilidade Urbana

Aplicação web para visualizar rotas acessíveis, reportar obstáculos e avaliar
a acessibilidade de locais urbanos.

## Stack

| Camada   | Tecnologia                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite + Leaflet.js      |
| Backend  | Python 3.11 + FastAPI             |
| Banco    | Supabase (PostgreSQL + PostGIS)   |
| Deploy   | Vercel (frontend) + Render (API)  |

---

## Configuração rápida

### 1. Supabase (banco de dados)

1. Crie uma conta gratuita em https://supabase.com
2. Crie um novo projeto
3. No **SQL Editor**, execute o arquivo `backend/supabase_schema.sql`
4. Em **Project Settings → API**, copie:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edite .env com suas chaves do Supabase

uvicorn main:app --reload
```

API disponível em: http://localhost:8000  
Documentação automática: http://localhost:8000/docs

### 3. Frontend (React)

```bash
cd frontend
npm install

cp .env.example .env
# Edite .env com suas chaves do Supabase e URL da API

npm run dev
```

App disponível em: http://localhost:5173

---

## Estrutura do projeto

```
acessibilidade-urbana/
├── backend/
│   ├── main.py                  # Entrada FastAPI
│   ├── requirements.txt
│   ├── supabase_schema.sql      # Schema completo do banco
│   ├── .env.example
│   └── app/
│       ├── config.py            # Variáveis de ambiente
│       ├── database.py          # Cliente Supabase
│       ├── dependencies.py      # Auth JWT middleware
│       ├── schemas.py           # Modelos Pydantic
│       └── routers/
│           ├── auth.py          # Login / cadastro
│           ├── obstacles.py     # Obstáculos no mapa
│           ├── places.py        # Locais avaliáveis
│           ├── reviews.py       # Avaliações de acessibilidade
│           └── routes.py        # Rotas (OSRM) + geocodificação
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.jsx  # Sessão do usuário
    │   ├── services/
    │   │   ├── api.js           # Axios + endpoints
    │   │   └── supabase.js      # Cliente Supabase
    │   ├── components/
    │   │   ├── Layout.jsx       # Navbar + shell
    │   │   ├── RoutePanel.jsx   # Painel de rotas
    │   │   └── ObstacleForm.jsx # Modal de reporte
    │   └── pages/
    │       ├── MapPage.jsx      # Mapa principal
    │       ├── PlacesPage.jsx   # Lista de locais
    │       ├── PlaceDetailPage.jsx # Detalhe + avaliações
    │       ├── LoginPage.jsx
    │       ├── RegisterPage.jsx
    │       └── ProfilePage.jsx
    └── .env.example
```

---

## Deploy gratuito

### Frontend → Vercel

1. Suba o repositório no GitHub
2. Em https://vercel.com, importe o repositório
3. Defina o **root directory** como `frontend`
4. Adicione as variáveis de ambiente no painel da Vercel

### Backend → Render

1. Em https://render.com, crie um **Web Service**
2. Defina o **root directory** como `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Adicione as variáveis de ambiente no painel do Render

---

## APIs externas utilizadas (todas gratuitas)

| Serviço    | Uso                              | Limite       |
|------------|----------------------------------|--------------|
| OpenStreetMap | Tiles do mapa               | Ilimitado    |
| OSRM       | Cálculo de rotas pedestres       | Ilimitado    |
| Nominatim  | Geocodificação de endereços      | 1 req/s      |
| Supabase   | Banco + auth + storage + realtime | 500MB / 50k req/mês |

---

## Próximos passos (Fases 4–8 do roteiro)

- [ ] Supabase Realtime para obstáculos em tempo real
- [ ] Upload de fotos nos reportes e avaliações
- [ ] Feed da comunidade com obstáculos próximos
- [ ] Notificações de novos obstáculos na rota favorita
- [ ] PWA — manifest + service worker + cache offline
