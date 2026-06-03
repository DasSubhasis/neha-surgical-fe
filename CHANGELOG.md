# Neha Surgical — Change Request Log

> **Purpose:** Records every change made to existing code, logic, or modules after initial development.  
> **How to use:** Add a new row to the summary table and a new section under [Detailed Change Log](#detailed-change-log) for every release or hotfix.

---

## Summary Table

| Version | Date | Type | Module(s) Affected | Change Summary |
|---------|------|------|--------------------|----------------|
| [v1.1.0](#v110--2026-06-03) | 2026-06-03 | Bug Fix | Backend API, Frontend Angular | Fix intermittent network errors after idle period — health endpoint, API retry logic, idle auto-logout, service worker removed |
| [v1.2.0](#v120--2026-06-03) | 2026-06-03 | Enhancement | Payment Collection | Added Payment Mode and Payment Reference Number fields to payment collection |

---

## Detailed Change Log

---

### v1.1.0 — 2026-06-03

**Type:** Bug Fix  
**Reported Issue:** After a few hours of inactivity, users returning to the application see "Network Error — Please check your internet connection" on all pages. Pressing Ctrl+Shift+R (hard browser refresh) fixes the issue temporarily.  
**Root Cause:** Two separate issues working together:
1. The Angular production build had a **Service Worker (ngsw)** active that cached the entire app shell (HTML, JS, CSS). When the backend briefly went down (IIS application pool recycling), the SW served the stale cached app. Normal page navigation did not bypass the SW, so the app stayed in a broken state. Only Ctrl+Shift+R, which explicitly bypasses the SW, recovered the session.
2. **IIS Application Pool Periodic Recycling** — even with idle timeout set to 0, IIS recycles the app pool on a timed interval (default every 29 hours or as configured). During the restart window (5–30 seconds), all connections are refused.

---

#### Files Changed

**Backend — `neha-surgical-be`**

| File | Change |
|------|--------|
| `Program.cs` | Added `GET /api/health` endpoint (anonymous, returns `{ status, timestamp }`) for uptime monitoring and IIS warm-up pings |

**Frontend — `neha-surgical-fe`**

| File | Change |
|------|--------|
| `angular.json` | Removed `"serviceWorker": "ngsw-config.json"` from the production build configuration — service worker disabled entirely |
| `src/app/app.config.ts` | Removed `provideServiceWorker(...)` provider and `isDevMode` import |
| `src/app/app.component.ts` | Removed `SwUpdate` logic; retained idle tracking only |
| `src/app/services/idle.service.ts` | **New file.** Auto-logout service — listens to mouse, keyboard, touch, scroll events; logs out the authenticated user after **60 minutes** of inactivity and redirects to `/login` |
| `src/app/services/api.service.ts` | Updated `request()` method — added smart retry (`count: 2, delay: 3 s`) for `status === 0` (ERR_CONNECTION_REFUSED / network-level) errors, giving the server time to finish recycling before failing to the user |
| `src/app/services/auth.service.ts` | Added same network-error retry (`count: 2, delay: 3 s`) to `sendOtp()`, `verifyOtp()`, `resendOtp()`, and `login()` — these methods call `HttpClient` directly and were not covered by the `ApiService` retry |

---

#### Detailed Code Changes

**`Program.cs` — Health endpoint**
```csharp
// Added before app.Run()
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .AllowAnonymous();
```

**`api.service.ts` — Smart retry in `request()`**
```typescript
// Before: retry(retryCount) — retried blindly
// After: retries only on network errors (status 0), waits 3 s between attempts
retry({
  count: Math.max(retryCount, 2),
  delay: (error, attempt) => {
    if (error?.status === 0 && attempt <= 2) return timer(3000);
    throw error;
  }
})
```

**`auth.service.ts` — Retry added to each auth method**
```typescript
// Added to sendOtp(), verifyOtp(), resendOtp(), login() pipes:
retry({ count: 2, delay: (err) => { if (err.status === 0) return timer(3000); throw err; } })
```

**`idle.service.ts` — New file**
```typescript
// Merges 6 DOM events; switchMap restarts a 60-minute timer on each event.
// On timer expiry → authService.logout() → redirect to /login.
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes
merge(of(null), activity$).pipe(
  switchMap(() => timer(IDLE_TIMEOUT_MS))
).subscribe(() => this.onIdle());
```

---

#### Server-Side Actions Required (IIS)

> These are IIS Manager changes, not code changes. Must be applied on the deployment server.

1. **Disable IIS Periodic Recycling:**  
   IIS Manager → Application Pools → `[Pool Name]` → Advanced Settings → Recycling  
   - Set **Regular time interval** → `0`  
   - Remove any entries under **Specific times**

2. **Enable Application Initialization (recommended):**  
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit
   Set-ItemProperty IIS:\AppPools\[PoolName] startMode AlwaysRunning
   Set-ItemProperty IIS:\Sites\[SiteName] applicationDefaults.preloadEnabled True
   ```

3. **Set up uptime monitor:**  
   Use UptimeRobot (free) or similar — ping `http://[server]:5280/api/health` every 5 minutes.  
   This keeps the process warm and alerts on downtime.

---

#### After Deploying

The existing service worker in users' browsers will self-unregister on the first load of the new build (browser detects `ngsw-worker.js` is gone). Alternatively, users can go to DevTools → Application → Service Workers → Unregister.

---

---

### v1.2.0 — 2026-06-03

**Type:** Enhancement  
**Request:** During payment collection, additional columns are needed to record the payment mode (Cash, Cheque, UPI, NEFT, RTGS, DD, Bank Transfer) and the corresponding reference number (cheque number, UPI/UTR number, transaction reference, DD number, etc.). Existing logic must not change.

---

#### Database Migration

| File | Change |
|------|--------|
| `Database/AlterPaymentCollectionsAddPaymentMode.sql` | **New file.** ALTER TABLE script — adds two nullable columns to the existing `PaymentCollections` table |

```sql
ALTER TABLE PaymentCollections
    ADD COLUMN IF NOT EXISTS payment_mode      VARCHAR(50)  NULL,
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) NULL;
```

> **Run this script once on the live database before deploying the updated application.**

---

#### Files Changed

**Backend — `neha-surgical-be`**

| File | Change |
|------|--------|
| `Models/PaymentCollection.cs` | Added `PaymentMode` and `PaymentReference` properties with `[Column]` mapping |
| `DTOs/PaymentCollectionDto.cs` | Added `PaymentMode` and `PaymentReference` to `PaymentCollectionDto` (response), `CreatePaymentCollectionDto` (POST body), and `UpdatePaymentCollectionDto` (PUT body) |
| `Controllers/PaymentCollectionsController.cs` | Updated both SELECT queries to include `payment_mode`, `payment_reference`; updated INSERT to include both columns; updated dynamic UPDATE builder to handle both fields |

**Frontend — `neha-surgical-fe`**

| File | Change |
|------|--------|
| `src/app/services/payment-collection.service.ts` | Added `paymentMode` and `paymentReference` to `PaymentCollection` and `PaymentFormData` interfaces; exported `PAYMENT_MODES` constant and `paymentReferenceLabel()` helper function |
| `src/app/components/payment-collection/payment-collection.component.ts` | Added two AG Grid columns (Payment Mode, Reference No.); updated form initialisation; updated `handleCreate`, `handleEdit`, `handleSave` diff; added validation rule; updated CSV export headers and data |
| `src/app/components/payment-collection/payment-collection.component.html` | Added Payment Mode dropdown and conditional Reference Number field in create/edit modal; added both fields to view modal |

---

#### Detailed Code Changes

**Payment modes and dynamic label — `payment-collection.service.ts`**
```typescript
export const PAYMENT_MODES = ['Cash', 'Cheque', 'UPI', 'NEFT', 'RTGS', 'DD', 'Bank Transfer'] as const;

export function paymentReferenceLabel(mode: string | null | undefined): string {
  switch (mode) {
    case 'Cheque':        return 'Cheque Number';
    case 'UPI':           return 'UPI / UTR Number';
    case 'NEFT':
    case 'RTGS':          return 'Transaction Reference';
    case 'DD':            return 'DD Number';
    case 'Bank Transfer': return 'Reference Number';
    default:              return 'Reference Number';
  }
}
```

**Validation rule — `payment-collection.component.ts`**
```typescript
// Reference number is required for all modes except Cash
if (this.form.paymentMode && this.form.paymentMode !== 'Cash' && !this.form.paymentReference?.trim()) {
  this.toastService.error(`${paymentReferenceLabel(this.form.paymentMode)} is required for ${this.form.paymentMode} payments`);
  return false;
}
```

**UI behaviour — `payment-collection.component.html`**
- Payment Mode: dropdown (optional field, defaults to blank)
- Reference Number: shown **only when mode is not Cash and not blank**; label changes dynamically based on selected mode; clears automatically when mode changes
- View modal: displays both fields; shows `—` when not set

---

#### Business Rules

| Payment Mode | Reference Field Label | Required |
|---|---|---|
| Cash | *(hidden)* | No |
| Cheque | Cheque Number | Yes |
| UPI | UPI / UTR Number | Yes |
| NEFT | Transaction Reference | Yes |
| RTGS | Transaction Reference | Yes |
| DD | DD Number | Yes |
| Bank Transfer | Reference Number | Yes |
| *(not selected)* | *(hidden)* | No |

---
