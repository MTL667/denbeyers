# Den Beyers 💛

Een warme landingpage waar mensen foto's en video's kunnen uploaden met een opkikker/boodschap voor Nick in het ziekenhuis.

## Features

- 📸 Upload foto's en video's met boodschappen
- 🔐 Keycloak authenticatie met role-based access
- 👑 Owner dashboard voor Nick
- 🛡️ Admin moderatie voor uploads
- 📌 Sticky posts voor uitgelichte berichten
- 📱 Mobile-first responsive design
- 🚀 Production-ready met Docker

## Tech Stack

- **Frontend**: Nuxt 3, TypeScript, Tailwind CSS, Nuxt UI
- **Backend**: Nuxt Server Routes (Nitro)
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: S3-compatible (MinIO / AWS S3)
- **Auth**: Keycloak OIDC
- **Deploy**: Docker, EasyPanel

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm/npm

### 2. Start Infrastructure

```bash
# Start PostgreSQL, MinIO, and Keycloak
docker compose up -d postgres minio minio-init keycloak
```

Wait for Keycloak to be ready at http://localhost:8080

### 3. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values (defaults work for local dev)
```

### 4. Install & Run

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# Start development server
npm run dev
```

App is now running at http://localhost:3000

### 5. Access Keycloak Admin

- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`

### Test Users

| User | Email | Password | Role |
|------|-------|----------|------|
| Nick | nick@denbeyers.be | changeme123 | owner |
| Admin | admin@denbeyers.be | changeme123 | admin |

## Keycloak Configuration

### Roles

The app uses three roles:

1. **owner** - Nick
   - Create own posts
   - Set any post as sticky
   - Edit/hide/delete any post
   - Access owner dashboard

2. **admin** - Moderators
   - Approve/hide/delete uploads
   - Set posts as sticky
   - Access admin dashboard

3. **user** - Default
   - Upload photos/videos
   - View public gallery

### Setting Up Roles in Keycloak

1. Go to Keycloak Admin Console
2. Select realm `denbeyers`
3. Go to **Clients** → `denbeyers-app` → **Roles**
4. Create roles: `owner`, `admin`
5. Go to **Users** → Select user → **Role Mappings**
6. Assign client roles from `denbeyers-app`

## MinIO (S3 Storage)

### Local Development

- S3 API: http://localhost:9000
- Console: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`
- Bucket: `denbeyers` (auto-created)

### Production (AWS S3 / EasyPanel MinIO)

Update these environment variables:

```env
S3_ENDPOINT="https://s3.eu-west-1.amazonaws.com"
S3_REGION="eu-west-1"
S3_BUCKET="your-bucket-name"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
```

## Production Deployment

### Docker Build

```bash
# Build production image
docker build -t denbeyers:latest .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e KEYCLOAK_ISSUER="https://..." \
  -e S3_ENDPOINT="https://..." \
  denbeyers:latest
```

### EasyPanel Deployment

1. **Create PostgreSQL Service**
   - Use EasyPanel's built-in PostgreSQL
   - Note the connection string

2. **Create MinIO Service** (or use external S3)
   - Deploy MinIO from EasyPanel marketplace
   - Create bucket `denbeyers`

3. **Configure Keycloak**
   - Deploy Keycloak from marketplace
   - Import realm from `keycloak/realm-export.json`
   - Update redirect URLs for production domain

4. **Deploy App**
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set start command: `node .output/server/index.mjs`
   - Add environment variables:

```env
DATABASE_URL=postgresql://user:pass@postgres:5432/denbeyers
KEYCLOAK_ISSUER=https://auth.denbeyers.be/realms/denbeyers
KEYCLOAK_CLIENT_ID=denbeyers-app
KEYCLOAK_CLIENT_SECRET=<from-keycloak>
KEYCLOAK_REDIRECT_URL=https://denbeyers.be/auth/callback
S3_ENDPOINT=https://minio.denbeyers.be
S3_REGION=us-east-1
S3_BUCKET=denbeyers
S3_ACCESS_KEY=<your-key>
S3_SECRET_KEY=<your-secret>
```

5. **Run Migrations**
   - SSH into container or run via EasyPanel console:
   ```bash
   npx prisma migrate deploy
   ```

6. **Setup Domain & SSL**
   - Point DNS to EasyPanel
   - Enable HTTPS in EasyPanel

## API Endpoints

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/media` | List approved media |

### Authenticated

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/login` | Start login flow |
| GET | `/api/auth/callback` | OIDC callback |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/media/presign` | Get presigned upload URL |
| POST | `/api/media` | Create media record |

### Owner/Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/owner/media/presign` | Presign for owner posts |
| POST | `/api/owner/media` | Create owner post |
| PATCH | `/api/owner/media/:id` | Update media |
| DELETE | `/api/owner/media/:id` | Delete media |
| GET | `/api/admin/media` | List all media (admin view) |

## Database Schema

```prisma
model User {
  id          String      @id @default(cuid())
  keycloakSub String      @unique
  name        String?
  email       String?
  role        Role        @default(USER)
  mediaItems  MediaItem[]
}

model MediaItem {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(...)
  type        MediaType
  s3Key       String
  mimeType    String
  sizeBytes   Int
  message     String?
  displayName String?
  consent     Boolean   @default(false)
  approved    Boolean   @default(false)
  visible     Boolean   @default(true)
  isOwnerPost Boolean   @default(false)
  isSticky    Boolean   @default(false)
  stickyOrder Int?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum MediaType { IMAGE, VIDEO }
enum Role { USER, ADMIN, OWNER }
```

## Development

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate Prisma client
npm run db:migrate:dev  # Create migration
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run typecheck    # TypeScript check
npm run lint         # ESLint
```

### Project Structure

```
denbeyers/
├── app.vue
├── nuxt.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── components/
│   └── MediaCard.vue
├── composables/
│   ├── useAuth.ts
│   ├── useMedia.ts
│   └── useUpload.ts
├── layouts/
│   └── default.vue
├── middleware/
│   ├── auth.ts
│   └── admin.ts
├── pages/
│   ├── index.vue
│   ├── gallery.vue
│   ├── upload.vue
│   └── dashboard/
│       ├── index.vue
│       └── create.vue
├── server/
│   ├── api/
│   │   ├── auth/
│   │   ├── media/
│   │   ├── owner/
│   │   └── admin/
│   └── utils/
│       ├── auth.ts
│       ├── prisma.ts
│       └── s3.ts
├── Dockerfile
├── docker-compose.yml
└── keycloak/
    └── realm-export.json
```

## License

Private - For denbeyers.be only

---

Gemaakt met 💛 voor Nick

