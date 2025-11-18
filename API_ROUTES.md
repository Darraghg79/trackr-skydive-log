# API Routes Reference

## Authentication
All endpoints require Supabase authentication. Include user session in requests.

## Common Parameters

### Query Parameters (GET requests)
- `limit` - Max items to return (default: 50, max: 100)
- `offset` - Number of items to skip (default: 0)
- `orderBy` - Field to sort by (default varies by entity)
- `order` - Sort direction: `asc` or `desc` (default varies)
- `isActive` - Filter by active status: `true` or `false`

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Gear Components

### GET /api/gear-components
List all gear components for authenticated user.

**Query params:** `type`, `isActive`, `limit`, `offset`, `orderBy`, `order`

### POST /api/gear-components
Create new gear component.

**Body:**
```json
{
  "type": "MAIN|RESERVE|AAD|CONTAINER|OTHER",
  "name": "string",
  "manufacturer": "string",
  "model": "string?",
  "serialNumber": "string?",
  "previousJumpCount": 0,
  "serviceDate": "2025-01-01?",
  "isActive": true
}
```

### GET /api/gear-components/[id]
Get single gear component with rig assignments.

### PATCH /api/gear-components/[id]
Update gear component (all fields optional).

### DELETE /api/gear-components/[id]
Delete gear component.

---

## Rigs

### GET /api/rigs
List all rigs for authenticated user with gear components.

**Query params:** `isActive`, `limit`, `offset`, `orderBy`, `order`

### POST /api/rigs
Create new rig with optional component assignments.

**Body:**
```json
{
  "name": "string",
  "isActive": true,
  "componentIds": ["uuid1", "uuid2"]
}
```

### GET /api/rigs/[id]
Get single rig with all assigned gear components.

### PATCH /api/rigs/[id]
Update rig. Pass `componentIds` to reassign components.

### DELETE /api/rigs/[id]
Delete rig and all component assignments.

---

## Dropzones

### GET /api/dropzones
List all dropzones for authenticated user.

**Query params:** `isActive`, `limit`, `offset`, `orderBy`, `order`

### POST /api/dropzones
Create new dropzone.

**Body:**
```json
{
  "name": "string",
  "address": "string",
  "country": "string",
  "contactName": "string?",
  "contactEmail": "email?",
  "currency": "USD",
  "rateAFF": 250.00,
  "rateTandem": 300.00,
  "rateCamera": 75.00,
  "rateCoach": 50.00,
  "rateHandcam": 25.00,
  "taxRate": 10.00,
  "isActive": true
}
```

### GET /api/dropzones/[id]
Get single dropzone.

### PATCH /api/dropzones/[id]
Update dropzone.

### DELETE /api/dropzones/[id]
Delete dropzone.

---

## User Jump Types

### GET /api/user-jump-types
List all custom jump types for authenticated user.

**Query params:** `isActive`

### POST /api/user-jump-types
Create new jump type.

**Body:**
```json
{
  "name": "string",
  "isDefault": false,
  "sortOrder": 1,
  "isActive": true
}
```

### GET /api/user-jump-types/[id]
Get single jump type.

### PATCH /api/user-jump-types/[id]
Update jump type.

### DELETE /api/user-jump-types/[id]
Delete jump type.

---

## User Aircraft

### GET /api/user-aircrafts
List all custom aircraft for authenticated user.

**Query params:** `isActive`

### POST /api/user-aircrafts
Create new aircraft.

**Body:**
```json
{
  "name": "string",
  "isDefault": false,
  "sortOrder": 1,
  "isActive": true
}
```

### GET /api/user-aircrafts/[id]
Get single aircraft.

### PATCH /api/user-aircrafts/[id]
Update aircraft.

### DELETE /api/user-aircrafts/[id]
Delete aircraft.

---

## Jumps

### GET /api/jumps
List all jumps for authenticated user with related data.

**Query params:** 
- `dropzoneId` - Filter by dropzone
- `isWorkJump` - Filter work jumps: `true` or `false`
- `startDate` - Filter from date (ISO)
- `endDate` - Filter to date (ISO)
- `limit`, `offset`, `orderBy`, `order`

### POST /api/jumps
Create new jump with optional gear tracking. Auto-increments user's jump number.

**Body:**
```json
{
  "jumpNumber": 1,
  "date": "2025-01-01",
  "dropzoneId": "uuid",
  "aircraftId": "uuid?",
  "jumpTypeId": "uuid?",
  "rigId": "uuid?",
  "exitAltitude": 13000,
  "deploymentAltitude": 3000,
  "freefallTime": 60,
  "isCutaway": false,
  "notes": "string?",
  "photoUrl": "url?",
  "isWorkJump": false,
  "workJumpType": "AFF|TANDEM|CAMERA|COACH?",
  "customerName": "string?",
  "hasHandcam": false,
  "gearComponentIds": ["uuid1", "uuid2"]
}
```

### GET /api/jumps/[id]
Get single jump with full details including rig, gear, signatures.

### PATCH /api/jumps/[id]
Update jump. Pass `gearComponentIds` to reassign gear.

### DELETE /api/jumps/[id]
Delete jump.

### POST /api/jumps/[id]/signature
Add instructor signature to jump.

**Body:**
```json
{
  "signerLicenseNumber": "string",
  "signatureImage": "base64-string"
}
```

---

## Invoices

### GET /api/invoices
List all invoices for authenticated user.

**Query params:**
- `dropzoneId` - Filter by dropzone
- `status` - Filter by status: `OPEN|SENT|PAID`
- `startDate` - Filter from date (ISO)
- `endDate` - Filter to date (ISO)
- `limit`, `offset`, `orderBy`, `order`

### POST /api/invoices
Create new invoice with line items. Auto-increments invoice number.

**Body:**
```json
{
  "dropzoneId": "uuid",
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-01-01",
  "dueDate": "2025-01-15?",
  "subtotal": 1000.00,
  "taxRate": 10.00,
  "taxAmount": 100.00,
  "total": 1100.00,
  "currency": "USD",
  "status": "OPEN",
  "notes": "string?",
  "pdfUrl": "url?",
  "lineItems": [
    {
      "jumpId": "uuid",
      "itemType": "BASE_JUMP|HANDCAM_ADDON",
      "workJumpType": "AFF|TANDEM|CAMERA|COACH",
      "quantity": 1,
      "unitPrice": 250.00,
      "lineTotal": 250.00
    }
  ]
}
```

### GET /api/invoices/[id]
Get single invoice with all line items and jump details.

### PATCH /api/invoices/[id]
Update invoice metadata (not line items).

**Body:**
```json
{
  "invoiceDate": "2025-01-01?",
  "dueDate": "2025-01-15?",
  "status": "OPEN|SENT|PAID?",
  "notes": "string?",
  "pdfUrl": "url?"
}
```

### DELETE /api/invoices/[id]
Delete invoice and all line items.

---

## User Profile

### GET /api/user
Get current user's profile. Creates profile if doesn't exist.

### PATCH /api/user
Update user profile. Logs jump number changes to audit trail.

**Body (all optional):**
```json
{
  "name": "string?",
  "address": "string?",
  "phone": "string?",
  "taxRegistrationNumber": "string?",
  "licenseNumber": "string?",
  "unitPreference": "METRIC|IMPERIAL?",
  "currentJumpNumber": 1,
  "startingFreefallTime": 0,
  "startingCutaways": 0,
  "invoiceStartingNumber": 1,
  "brandingLogo": "url?",
  "brandingCompanyName": "string?",
  "brandingPrimaryColor": "#3B82F6?",
  "brandingInvoiceFooter": "string?"
}
```

---

## Audit Logs

### GET /api/audit-logs
List jump number change history (read-only).

**Query params:** `limit`, `offset`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "previousNumber": 100,
      "newNumber": 150,
      "reason": "Manual adjustment via settings",
      "changedAt": "2025-01-01T12:00:00Z"
    }
  ]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["name"],
      "message": "Required"
    }
  ]
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
