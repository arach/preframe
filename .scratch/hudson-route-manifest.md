# Preframe API Route Manifest for Hudson

Routes that preframe's catalog UI expects to exist. Hudson's app router needs to either
proxy these or re-export the preframe route handlers.

## Required API Routes

### Core (used by LogoStudio + ports.ts — needed for Hudson logo flow)
| Route | Methods | Consumer |
|---|---|---|
| `/api/compositions/[compositionId]/jobs` | GET, POST | ports.ts, LogoStudio, QueueView, NewComposition, VideoDetail |
| `/api/compositions/[compositionId]/jobs/[jobId]` | GET | (exists in preframe, not directly fetched by catalog) |
| `/api/jobs` | GET | QueueView |
| `/api/jobs/[jobId]` | GET | ports.ts |
| `/api/jobs/[jobId]/retry` | POST | QueueView |
| `/api/logos/upload` | POST | LogoStudio |
| `/api/health` | GET | Hudson service check |

### Catalog CRUD
| Route | Methods | Consumer |
|---|---|---|
| `/api/catalog/ingest` | POST | AssetsView, NewComposition |
| `/api/catalog/delete` | POST | Provider |
| `/api/source` | GET, POST | CodePanel, QueueView, VideoDetail |

### Music
| Route | Methods | Consumer |
|---|---|---|
| `/api/music/generate` | POST | NewComposition, MusicView |
| `/api/music/lyrics` | POST | NewComposition |
| `/api/music/delete` | POST | Provider |

### Inference
| Route | Methods | Consumer |
|---|---|---|
| `/api/inference` | POST | NewComposition |

### Remotion
| Route | Methods | Consumer |
|---|---|---|
| `/api/remotion/status` | GET | RemotionStatusPill, FramePreview |
| `/api/remotion/start` | POST | RemotionStatusPill, FramePreview |

### Settings
| Route | Methods | Consumer |
|---|---|---|
| `/api/settings/provider` | GET, POST | SettingsView |

### Queue (internal)
| Route | Methods | Consumer |
|---|---|---|
| `/api/queue` | POST | (internal) |
| `/api/queue/[id]` | GET | (internal) |
| `/api/queue/process` | POST | (internal) |

## Static Files
| Path | Consumer |
|---|---|
| `/catalog-data.json` | Provider (guarded with `r.ok` check) |
| `/curated-snippets.json` | Provider (guarded with `r.ok` check) |

## Notes
- All route handlers already exist in `preframe/app/api/`. Hudson could re-export them
  rather than rewriting (e.g. `export { GET, POST } from '@preframe/app/api/...'`).
- For the logo-only flow, the **Core** section is the minimum viable set.
- Static JSON files are optional — Provider gracefully handles 404s after the recent fix.
