# Backend Integration Guide

Everything the backend must provide for this frontend (Expo / React Native app +
PWA) to work, and the step-by-step plan to wire them together.

This frontend is a port of the `secondBrainWeb1` web app, so the API contract
below is exactly what the original web client used. Use it to confirm your
backend matches, then follow the **Integration Plan** at the bottom.

---

## 1. Architecture at a glance

```
┌─────────────────────────────┐         REST + JSON over HTTP          ┌──────────────┐
│  Frontend (one codebase)    │  ───────────────────────────────────▶  │   Backend    │
│  • Android / iOS (native)   │   Authorization: Bearer <JWT>           │  (FastAPI?)  │
│  • PWA (web browser)        │  ◀───────────────────────────────────  │              │
└─────────────────────────────┘         JSON responses                 └──────────────┘
```

- **Transport:** plain REST, JSON request/response, plus `multipart/form-data` for audio uploads.
- **Auth:** JWT bearer token. Login returns a token; the frontend sends it on every authenticated call.
- **State:** the frontend keeps the token + user id in device storage (AsyncStorage on native, localStorage on web).

---

## 2. Base URL configuration

The frontend builds every request URL from a single base URL, read from
`API_BASE_URL` (see [.env](.env) → [app.config.js](app.config.js) → `Constants.expoConfig.extra.apiBaseUrl`,
consumed in [src/constants/api.js](src/constants/api.js)).

| Where the app runs | Correct `API_BASE_URL` |
|---|---|
| Physical phone (Expo Go / dev build) | `http://<PC-LAN-IP>:8000` (e.g. `http://192.168.1.22:8000`) |
| Android emulator | `http://10.0.2.2:8000` |
| iOS simulator | `http://localhost:8000` |
| PWA (web, local dev) | `http://localhost:8000` |
| PWA (deployed) | `https://<your-api-domain>` (HTTPS required) |

The backend **must listen on `0.0.0.0`**, not `localhost`, for a physical phone to reach it:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## 3. Authentication flow

1. `POST /api/auth/register` → create account.
2. `POST /api/auth/login` → returns `{ access_token, user_id }`.
3. The frontend stores both and attaches the token to every subsequent request:
   ```
   Authorization: Bearer <access_token>
   ```
4. If any endpoint returns **HTTP 401**, the frontend clears the token and sends the
   user back to the Login screen. So return 401 for missing/expired/invalid tokens.

**Token format:** any opaque string works (the frontend does not decode it). `user_id`
is used directly in dashboard URLs, so it must be a value safe to put in a path segment.

---

## 4. Complete API contract

Base path prefix: **`/api`**. All endpoints except register/login require the
`Authorization: Bearer` header.

### 4.1 Auth

**`POST /api/auth/register`** — auth: no
```jsonc
// request
{ "email": "user@example.com", "password": "secret" }
// response (any 2xx; body fields not read by the frontend)
{ "message": "registered" }
```

**`POST /api/auth/login`** — auth: no
```jsonc
// request
{ "email": "user@example.com", "password": "secret" }
// response  — REQUIRED fields
{ "access_token": "<jwt>", "user_id": "abc123" }
```

### 4.2 Audio upload & analysis

**`POST /api/audio/upload`** — auth: yes — `multipart/form-data`, field name **`file`**
```jsonc
// response — fields the UI reads (AudioUploadScreen)
{
  "session_id": "string",
  "emotion": "happy",
  "confidence": 0.93,              // 0..1, shown as %
  "global_emotion": "happy",
  "global_confidence": 0.90,
  "user_emotion": "calm",         // nullable -> "Not available"
  "user_confidence": 0.41,        // nullable
  "blend_weight": 0.35,
  "timestamp": "2026-06-20T10:00:00Z",
  "transcription": "text or empty",
  "owner_detection_status": "verified",   // "verified" | "low_confidence" | "not_found"
  "owner_speech_ratio": 0.82,     // nullable -> "N/A", shown as %
  "owner_segments_count": 3,      // nullable
  "other_segments_count": 1,      // nullable
  "speaker_timeline": [
    { "speaker_label": "owner", "start": 0.0, "end": 2.5, "owner_confidence": 0.97 }
  ]
}
```

**`POST /api/audio/feedback`** — auth: yes
```jsonc
// request
{ "session_id": "string", "corrected_emotion": "sad" }   // emotion from the fixed label set (4.6)
// response
{ "message": "feedback recorded", "feedback_count": 5, "training_triggered": true }
```
If `training_triggered` is true, the frontend immediately polls training status (4.5).

### 4.3 Dashboard

**`GET /api/dashboard/stats/{user_id}`** — auth: yes
```jsonc
{
  "total_sessions": 12,
  "avg_confidence": 0.871,
  "emotion_distribution": { "happy": 5, "calm": 4, "sad": 3 }   // label -> count
}
```

**`GET /api/dashboard/emotions/{user_id}?start_date=&end_date=&limit=`** — auth: yes
- Query params (all optional): `start_date`, `end_date` (ISO-8601, e.g. `2026-06-20T00:00:00`), `limit` (int, frontend sends 100).
```jsonc
{
  "emotions": [
    { "session_id": "string", "timestamp": "2026-06-20T10:00:00Z",
      "emotion_label": "happy", "confidence": 0.93 }
  ]
}
```
> Tip: when there is no data, returning a 404 (or a detail containing "Not Found")
> makes the dashboard show a friendly empty state instead of an error.

### 4.4 RAG query

**`POST /api/rag/query`** — auth: yes
```jsonc
// request
{ "query": "what did I say about deadlines?", "top_k": 5 }
// response
{
  "answer": "Generated answer text.",
  "sources": [
    { "session_id": "string", "score": 0.82, "timestamp": "2026-06-20T10:00:00Z", "text": "snippet" }
  ]
}
```

### 4.5 Training status

**`GET /api/training-status/{user_id}`** — auth: yes
```jsonc
{
  "job_id": "string or null",
  "status": "queued",            // "queued" | "running" -> frontend polls every 4s; else stops
  "created_at": "ISO or null",
  "started_at": "ISO or null",
  "completed_at": "ISO or null",
  "error_message": "string or null"
}
```

### 4.6 Speaker enrollment

**`GET /api/speaker/enroll/status`** — auth: yes
```jsonc
{
  "enrollment_state": "collecting", // badge styles: "completed" | "collecting" | other
  "samples_collected": 2,
  "max_samples": 5,
  "required_samples": 3,
  "enrolled": false,
  "updated_at": "ISO or null"
}
```

**`POST /api/speaker/enroll/start`** — auth: yes → `{ "message": "..." }`

**`POST /api/speaker/enroll/upload`** — auth: yes — `multipart/form-data`, field **`file`** → `{ "message": "..." }`

**`POST /api/speaker/enroll/complete`** — auth: yes → `{ "message": "..." }`

---

## 5. File uploads (important)

- Method: `POST`, `Content-Type: multipart/form-data`, **form field name must be `file`**.
- Accepted formats the UI offers: `.wav`, `.mp3`, `.m4a`, `.flac`, `.ogg`.
  In-app recording (native dev build) produces **`.m4a` / `audio/x-m4a`** — make sure the backend accepts it.
- The frontend already sends files correctly per platform (native descriptor vs browser `File`),
  so the backend just needs a standard multipart file handler (e.g. FastAPI `UploadFile`).

---

## 6. CORS (required for the PWA only)

Native apps are **not** subject to CORS. The **web/PWA build is** — the browser will block
API calls unless the backend sends CORS headers. The frontend uses `withCredentials: false`,
so a wildcard origin is fine.

FastAPI example:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # or list your web origins, e.g. http://localhost:8081
    allow_methods=["*"],            # GET, POST, OPTIONS
    allow_headers=["*"],            # must include Authorization, Content-Type
    allow_credentials=False,
)
```
The browser will also send `OPTIONS` preflight requests — the middleware handles those.

---

## 7. Error format

The frontend reads error messages from **`error.response.data.detail`** (FastAPI's default
shape). Return errors as:
```jsonc
{ "detail": "Human-readable message" }
```
Special-cased strings the UI reacts to:
- `detail` containing **"not eligible"** → feedback screen shows an enrollment hint.
- `detail`/status containing **404 / "Not Found"** → dashboard & RAG show empty states.
- HTTP **401** → global logout + redirect to Login.

---

## 8. Fixed value contracts

- **Emotion labels** (feedback dropdown, exact strings):
  `neutral, calm, happy, sad, angry, fearful, disgusted, surprised`
- **owner_detection_status:** `verified | low_confidence | not_found`
- **training status (polled while):** `queued | running`

If the backend uses different emotion strings, update
[src/constants/api.js](src/constants/api.js) `EMOTION_LABELS` to match.

---

## 9. Platform differences summary

| Concern | Native (Android/iOS) | PWA (web) |
|---|---|---|
| Base URL | LAN IP / emulator host | localhost / deployed HTTPS |
| CORS | not needed | **required** |
| In-app recording | dev build only | not available (file upload only) |
| HTTPS | optional for local | required to install + for mic on real domains |
| Deep-link URLs | n/a | `/login /register /dashboard /upload /speaker /query` |

---

## 10. Integration plan (do these in order)

1. **Confirm the contract** — check each endpoint in §4 exists on your backend with the
   listed request/response field names. Adjust the backend, or adjust the frontend
   ([src/api/client.js](src/api/client.js) + [src/constants/api.js](src/constants/api.js)) to match.
2. **Bind the server** to `0.0.0.0:8000`.
3. **Set `API_BASE_URL`** in [.env](.env) for your run target (§2). Restart `expo start` after editing.
4. **Enable CORS** (§6) if you will use the PWA.
5. **Verify auth round-trip:** register → login → confirm `{access_token, user_id}` →
   confirm an authenticated GET (e.g. dashboard stats) succeeds with the Bearer header.
6. **Verify uploads:** POST a `.wav` to `/api/audio/upload`, confirm the response has the
   §4.2 fields; the result screen should populate.
7. **Verify the long flows:** speaker enrollment (start → upload×3 → complete) and feedback →
   training-status polling.
8. **Network sanity:** from the phone's browser open `http://<API_BASE_URL>/docs` (FastAPI) —
   if it loads, the device can reach the backend.

---

## 11. Quick verification checklist

- [ ] `POST /api/auth/login` returns `access_token` + `user_id`
- [ ] Authenticated requests accept `Authorization: Bearer <token>`
- [ ] Invalid/expired token → HTTP 401
- [ ] `POST /api/audio/upload` accepts multipart field `file` (incl. `.m4a`)
- [ ] Upload response includes `session_id`, `emotion`, `confidence`, `speaker_timeline`
- [ ] `GET /api/dashboard/stats/{user_id}` returns `total_sessions`, `avg_confidence`, `emotion_distribution`
- [ ] `GET /api/dashboard/emotions/{user_id}` returns `emotions[]` with `emotion_label`
- [ ] `POST /api/rag/query` returns `answer` + `sources[]`
- [ ] `GET /api/training-status/{user_id}` returns `status` (`queued`/`running` while active)
- [ ] Speaker enroll status returns `enrollment_state`, `samples_collected`, `max_samples`, `required_samples`, `enrolled`
- [ ] Errors use `{ "detail": "..." }`
- [ ] CORS enabled (for PWA)
```
