# Quorum — API Reference & Integration Guide
**Next.js 14 Route Handlers · Microsoft Innovate 2026**

---

## 1. API Architecture Overview

All Quorum API endpoints are server-side Next.js 14 App Router Route Handlers (`src/app/api/`). They enforce:
- Content-Type: `application/json`
- Zod schema validation on all incoming request bodies
- Role-based authorization via Supabase Auth headers
- Uniform error responses

### Standard Response Envelope

```json
// Success Response (HTTP 200/201)
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_88f91a2b",
    "timestamp": "2026-09-28T16:00:00.000Z"
  }
}

// Error Response (HTTP 4xx/5xx)
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Missing required field 'events'",
    "details": [ ... ]
  }
}
```

---

## 2. Core Endpoints

### 2.1 Ingestion API
`POST /api/v1/ingest`
- **Description:** Ingests a batch of raw authentication telemetry lines for normalization and staging.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "sourceSystem": "CiscoAnyConnect",
  "format": "jsonl",
  "lines": [
    "{\"timestamp\":\"2026-09-28T09:12:00Z\",\"user\":\"alex\",\"ip\":\"198.51.100.22\",\"action\":\"failed\"}"
  ]
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "acceptedCount": 1,
    "rejectedCount": 0,
    "batchId": "6c498357-e6f9-4d6e-93b5-231a47b1c1d0"
  }
}
```

---

### 2.2 Detection Trigger API
`POST /api/v1/detect/run`
- **Description:** Executes the detection pipeline across the active or specified telemetry batch. Runs F5, F6, F7, F10 and computes Quorum consensus severity.
- **Request Body:**
```json
{
  "batchId": "6c498357-e6f9-4d6e-93b5-231a47b1c1d0",
  "tuningProfile": "DEFAULT"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "signalsCount": 42,
    "incidentsCount": 1,
    "primaryIncident": {
      "id": "inc_901a",
      "severityScore": 100,
      "severityTier": "CRITICAL",
      "severityEquation": "Base 100 (F10_pivot) * 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]",
      "compromisedAccounts": ["marcus.chen"]
    }
  }
}
```

---

### 2.3 Cryptographic Audit Verification API
`GET /api/v1/audit/verify`
- **Description:** Traverses the entire `audit_ledger` hash-chain, recomputing SHA-256 links from genesis to head.
- **Response:**
```json
{
  "success": true,
  "data": {
    "chainValid": true,
    "totalRecords": 314,
    "genesisHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "headHash": "9b12a83c7401d293847291a1834928e019284712039482019482019482019482",
    "tamperedRecordId": null
  }
}
```

---

### 2.4 Interoperability Exports
`GET /api/v1/export/sentinel?incidentId=:id`
- **Output:** Validated Microsoft Sentinel JSON schema payload ready for direct upload or API ingest.

`GET /api/v1/export/stix?incidentId=:id`
- **Output:** STIX 2.1 Bundle containing ThreatActor, Identity, IPv4-Addr, and Sighting objects.
