# 🔍 Asian Groceries — Codebase Specification & Audit Report

> Deep audit of `e-commerce-app-design`. Every dead file, every bug, every mismatch, every security issue, every naming problem — all catalogued with severity and plain-English explanation.

---

## 🗂️ TABLE OF CONTENTS

1. [Garbage Code — Causes Errors](#1-garbage-code--causes-errors-in-production)
2. [Dead Code — Silent, Non-Bothering](#2-dead-code--silent-non-bothering-elements)
3. [Critical Data Mismatches](#3-critical-data-mismatches--field-name-bugs)
4. [Security Issues](#4-security-issues)
5. [Frontend Errors & UI Bugs](#5-frontend-errors--ui-bugs)
6. [Backend / API Errors](#6-backend--api-errors)
7. [Naming & Branding Inconsistencies](#7-naming--branding-inconsistencies)
8. [Missing Features (Summarised)](#8-missing-features-summarised)
9. [Configuration & Environment Issues](#9-configuration--environment-issues)
10. [Duplicate Code](#10-duplicate-code)
11. [TypeScript / Type Safety Issues](#11-typescript--type-safety-issues)

---

## 1. 🔴 Garbage Code — Causes Errors in Production

These files/patterns exist in the codebase and **actively cause errors or will fail** in a live environment.

---

### 1.1 ❌ `app/api/firebase-test/route.ts` — Debug Endpoint Left Open

**File:** `app/api/firebase-test/route.ts`
**Problem:** A diagnostic endpoint that lists all Firestore collection names. The file's own comment says:
> "Remove or restrict this route before going to production."

It was never removed. In production, **anyone** can call:
```
GET https://yourdomain.com/api/firebase-test
```
…and receive:
```json
{
  "status": "connected",
  "project": "asian-groceries-c1b58",
  "collections": ["orders", "products", "settings", "users", ...]
}
```
This reveals the internal Firestore schema, collection names, and Firebase project ID to the public.

**Severity:** 🔴 HIGH — Information disclosure vulnerability  
**Fix:** Delete the file entirely, or add `if (process.env.NODE_ENV !== 'development') return 404`

---

### 1.2 ❌ `firestore.indexes.json` — Empty, Will Break Queries in Production

**File:** `firestore.indexes.json`
**Problem:** File contains only `{ "indexes": [], "fieldOverrides": [] }`. The following Firestore queries are used in multiple components:

```typescript
// lib/use-active-order.ts
query(orders, where('customerEmail', '==', email), where('status', '!=', 'Delivered'), orderBy('status'), orderBy('createdAt', 'desc'))

// components/homepage-status.tsx + account-order-status.tsx
query(orders, where('customerEmail', '==', email), orderBy('createdAt', 'desc'))
```

Firestore **requires a composite index** for any query with both `where()` and `orderBy()` on different fields. Without it, these queries throw:
```
FirebaseError: The query requires an index.
```

**Severity:** 🔴 HIGH — Customer dashboard, homepage order status, and active order tracking **will not work** without the indexes.  
**Fix:** Add the required composite indexes to `firestore.indexes.json` and deploy with `firebase deploy --only firestore:indexes`

---

### 1.3 ❌ `app/api/emails/route.ts` — Wrong Import

**File:** `app/api/emails/route.ts`, Line 1
**Problem:**
```typescript
import { NextResponse } from 'next/headers'  // ❌ WRONG
```
`NextResponse` lives in `'next/server'`, NOT `'next/headers'`. This causes a **runtime module error** — the endpoint will crash on any request.

**Severity:** 🔴 HIGH — `/api/emails` endpoint is completely broken  
**Fix:** Change to `import { NextResponse } from 'next/server'`

---

### 1.4 ❌ `admin-actions.ts` — Admin Writes Orders via Client SDK (Security Bypass)

**File:** `lib/admin-actions.ts`, Line 40
**Problem:** The `updateOrderStatus()` function writes to Firestore using the **Client SDK** (`clientDb`), not the Admin SDK. The Firestore security rule for orders is:
```
allow create, update, delete: if false;
```
This means **client-side updates to orders are denied**. The admin's "Update Status" button in the dashboard will silently fail (or throw a permission error) for orders.

**Analogy:** The manager has a key to the office but keeps trying to use the customer entrance — the door won't open.

**Severity:** 🔴 HIGH — Admin cannot update order status from the dashboard  
**Fix:** Route order status updates through the Admin SDK via a server API route (`/api/admin/orders`), not the Client SDK.

---

## 2. 🟡 Dead Code — Silent, Non-Bothering Elements

These exist in the codebase, don't crash anything, but serve no purpose and add confusion.

---

### 2.1 `app/api/checkout/route.ts` — Permanent Stub (410 Gone)

**File:** `app/api/checkout/route.ts`
**What it is:** Returns `410 Gone` on every POST. No code paths call this endpoint — checkout goes directly to `/api/orders`.
**Impact:** None (it's dead). But it wastes a file and confuses anyone reading the codebase.
**Recommendation:** Delete the file.

---

### 2.2 `app/api/webhooks/stripe/route.ts` — Permanent Stub (410 Gone)

**File:** `app/api/webhooks/stripe/route.ts`
**What it is:** Returns `410 Gone` on every POST. Stripe is not used.
**Impact:** None. Waste of a file.
**Recommendation:** Delete the file (and the `/api/webhooks/` directory entirely).

---

### 2.3 `components/account-order-status.tsx` — Component Never Rendered

**File:** `components/account-order-status.tsx`
**What it is:** A full order status timeline component using `StatusBadge`. It imports `useAuth`, queries Firestore for the user's latest order, and renders a step-by-step timeline.

**The problem:** Only the file itself imports `status-badge`. Searching the entire codebase for `account-order-status` shows it's only referenced in its own first line — **nothing imports or renders it**.

**Analogy:** A fully built display shelf in the warehouse, never moved onto the shop floor.
**Impact:** Dead component. It also queries a field `data.amountTotal` that doesn't exist in current orders (they have `grandTotal`) — so it would show `€0.00` even if it were rendered.
**Recommendation:** Either wire it into the customer dashboard or delete it.

---

### 2.4 `components/ui/status-badge.tsx` — Only Used by Dead Component

**File:** `components/ui/status-badge.tsx`
**What it is:** A styled badge component for order status variants (`paid`, `accepted`, `preparing`, `dispatched`, `delivered`).
**Problem:** It is only imported in `account-order-status.tsx`, which itself is never rendered (see 2.3 above).
**Recommendation:** If `account-order-status` is deleted, delete this too. If it's wired up, keep it.

---

### 2.5 `lib/use-active-order.ts` — Used Once, Queries a Non-Existent Field

**File:** `lib/use-active-order.ts`
**What it is:** A hook that queries Firestore for the user's active (non-Delivered) order.
**Used in:** Only `components/site-header.tsx` imports it.
**Problem:** It reads `data.itemsSummary` — a field that is **never written** by the current order pipeline (`/api/orders/route.ts`). So `itemsSummary` will always be an empty string `''`.
**Also:** It reads `data.amountTotal` — but orders store `grandTotal`, not `amountTotal`. The displayed amount will always be `0`.
**Recommendation:** Fix field names to `grandTotal` and remove `itemsSummary` (or use items array).

---

### 2.6 `scripts/` Directory — Development Scripts Not Excluded from Build

**Directory:** `scripts/`
**Contains:** `test-named-db.ts`, `seed-database.ts`
**Problem:** These are local development scripts that include `console.log` statements and raw Firebase credentials access. They shouldn't be part of the production repo or build — but there's no `.tsignore` or build exclusion.
**Impact:** Low (they don't auto-run), but they are visible in the repository.
**Recommendation:** Add to `.gitignore` or move to a separate dev tooling folder excluded from the build.

---

## 3. 🔴 Critical Data Mismatches — Field Name Bugs

These are **silent bugs** — no error is thrown, but wrong data (usually `€0.00` or blank) is displayed.

---

### 3.1 `grandTotal` vs `amountTotal` — The Big Mismatch

| Where | Field Written | Field Read | Result |
|---|---|---|---|
| `app/api/orders/route.ts` | **`grandTotal`** | — | Source of truth |
| `app/admin/page.tsx` | — | `amountTotal` | Always shows **€0.00** |
| `app/admin/orders/page.tsx` | — | `amountTotal` | Always shows **€0.00** |
| `app/admin/analytics/page.tsx` | — | `amountTotal` | Revenue analytics always **€0** |
| `lib/use-active-order.ts` | — | `amountTotal` | Active order amount: **€0** |
| `components/homepage-status.tsx` | — | `amountTotal` | Homepage order amount: **€0** |
| `components/account-order-status.tsx` | — | `amountTotal` | **€0** (dead anyway) |
| `app/lib/order-types.ts` | — | declares both | Type says `amountTotal: number`, `grandTotal?: number` |

**Analogy:** The cashier writes the total in the "Grand Total" box. But the manager's report template only looks at the "Amount Total" box — which is blank. So the manager thinks every order was free.

**Impact:** Admin dashboard turnover = €0. Analytics revenue = €0. All financial reporting is broken.
**Fix:** Either rename `grandTotal` → `amountTotal` in `route.ts`, OR update all readers to use `grandTotal`.

---

### 3.2 `itemsSummary` — Field Never Written

| Where | Status |
|---|---|
| `app/lib/order-types.ts` | Declares `itemsSummary: string` in Order type |
| `app/api/orders/route.ts` | **Never writes `itemsSummary`** |
| `app/admin/orders/page.tsx` | Reads `order.itemsSummary` — shows `—` always |
| `lib/use-active-order.ts` | Reads `data.itemsSummary` — always `''` |

**Fix:** Either write `itemsSummary` in the order API, or remove it from the type and all readers.

---

### 3.3 `sessionId` — Declared in Type, Never Written

**File:** `app/lib/order-types.ts`, Line 30
The `Order` type declares `sessionId: string` — a field from the old Stripe integration. No code writes it to Firestore.
**Impact:** Any code reading `order.sessionId` gets `undefined`.
**Fix:** Remove from `Order` type.

---

### 3.4 `ticketNum` vs `ticketNumber` — Two Names for the Same Thing

| Location | Field Name |
|---|---|
| `app/api/orders/route.ts` (writes) | `ticketNumber` |
| `app/lib/order-types.ts` | `ticketNumber?: string` |
| `lib/use-active-order.ts` (reads) | `data.ticketNum` → falls back to `doc.id.slice(0,8)` |
| `components/homepage-status.tsx` | `ticketNum: docSnap.id.slice(0,8).toUpperCase()` — doesn't even try to read from data |

**Impact:** `use-active-order` and `homepage-status` never show the real ticket number — they manufacture a fake one from the document ID prefix.
**Fix:** Use `data.ticketNumber` consistently everywhere.

---

## 4. 🔴 Security Issues

---

### 4.1 Admin Email Hardcoded as String Literal in 4+ Files

The admin gate checks `user.email === 'indianmarket@test.com'` in:
- `app/admin/layout.tsx` (3 occurrences)
- `app/admin/login/page.tsx` (3 occurrences)  
- `app/api/admin/products/route.ts` (1 occurrence)
- `app/admin/settings/page.tsx` (shown in display)

**Problems:**
1. If the email ever changes, all 4+ files need updating — risk of missing one.
2. The test domain `@test.com` in the email suggests this was a development credential never updated for production.
3. It's hardcoded in client-rendered pages — the email is visible in the browser bundle.

**Analogy:** The security code for the safe is written on a sticky note on every desk in the office.
**Fix:** Move admin email(s) to an environment variable or a Firestore `admins` collection with role checks.

---

### 4.2 `lib/admin-actions.ts` — Client SDK Used for Admin Writes

Already covered in 1.4. The security rules block these writes, but the code silently tries anyway — creating confusing behaviour (no error shown to admin, but nothing saved).

---

### 4.3 Firestore Rules — `allow write: if request.auth != null` for Products/Collections/Slides

**File:** `firestore.rules`
```
match /products/{id} {
  allow write: if request.auth != null;
}
```
Any **logged-in Firebase user** (not just the admin) can write products, slides, offers, settings, and collections. Since the app allows public sign-up (Google + Email), **any customer account can delete or modify all products**.

**Analogy:** Any loyalty card holder can also rearrange the shelves and change the price tags.
**Fix:** Change write rules to require the admin email:
```
allow write: if request.auth.token.email == 'indianmarket@test.com';
```
Or use Firebase Custom Claims for proper role-based access.

---

### 4.4 `api/firebase-test` — Public Info Disclosure (See 1.1)

Already covered. Delete the file.

---

### 4.5 `re_mock_key` Fallback for Resend API

**Files:** `app/api/orders/route.ts` and `app/api/emails/route.ts`
```typescript
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key')
```
If `RESEND_API_KEY` is not set in production, the code silently uses the fake key `re_mock_key`. Resend will accept the initialisation but fail on `.send()` — and since the email is fire-and-forget, **this failure is swallowed silently**. No emails are sent, no error is logged prominently.

**Analogy:** The receipt printer is broken, but the cashier still tells the customer "receipt sent!" and nobody notices.
**Fix:** Add a startup check that throws if `RESEND_API_KEY` is missing in production.

---

## 5. 🟠 Frontend Errors & UI Bugs

---

### 5.1 Checkout Form — Requires Auth But No Auth Guard

**File:** `components/checkout-form.tsx`, Line 47
```typescript
const customerName = user?.displayName || ''
```
The checkout form reads the name from Firebase Auth. If the customer is **not logged in**, `customerName` is `''`. The order then goes through with a blank customer name — no validation prevents this.

**Impact:** Orders with blank names appear in the admin with no identifier.
**Fix:** Require login before reaching checkout, or add a manual name field as fallback.

---

### 5.2 `DESTINATIONS` Array Defined in Three Separate Files

The list of transit hubs (Kaunas, Klaipėda, Šiauliai, Panevėžys, Alytus) with prices is defined in:
- `components/checkout-form.tsx` — `const DESTINATIONS = [...]`
- `components/bus-tracker.tsx` — `const DESTINATIONS = [...]` (different structure — includes `eta`, `name`)
- `components/customer-dashboard.tsx` — `const TERMINAL_OPTIONS = [...]`

**Problem:** Three separate sources of truth. If a destination or price changes, it must be updated in all three places. They already differ — bus-tracker has ETA data, checkout doesn't.
**Fix:** Centralise into `lib/destinations.ts` and import everywhere.

---

### 5.3 Admin Settings Page — Save Button Does Nothing (No Firestore Write)

**File:** `app/admin/settings/page.tsx`, Line 22
```typescript
const handleSave = (e: React.FormEvent) => {
  e.preventDefault()
  setSaved(true)
  setTimeout(() => setSaved(false), 3000)
}
```
The "Save All Settings" button shows a green ✅ "Settings saved successfully!" banner, but **never writes anything to Firestore**. All data is local `useState` only.

**Impact:** Admin believes settings are saved. On page refresh, all changes are lost.
**Analogy:** You typed the recipe into the computer, it said "saved", but the hard drive wasn't connected.

---

### 5.4 Admin Settings — Hardcoded `storeName: 'IndianMarket'`

**File:** `app/admin/settings/page.tsx`, Line 9
The default `storeName` is `'IndianMarket'` — the old brand name. The store is called "Asian Groceries". Since nothing ever saves or loads from Firestore, this value is permanently shown in the settings form.

---

### 5.5 `homepage-status.tsx` — `amountTotal` Field Never Populated

**File:** `components/homepage-status.tsx`, Line 82
Reads `data.amountTotal ?? 0` — this field is never written. So the homepage always shows `€0.00` for the latest order amount.

---

### 5.6 `bus-tracker.tsx` — Hardcoded Static ETAs

**File:** `components/bus-tracker.tsx`
The `DESTINATIONS` array in this file includes `eta: '2h 15m'`, `eta: '3h 40m'` etc. These are static strings — they never come from a real courier API or even from Firestore. The tracker shows a fake live map UI but provides no real tracking information.

**Analogy:** The shop has a tracking board that looks like a live departure board at an airport — but all the times are painted on.

---

### 5.7 Customer Dashboard — Order Query Requires Composite Index (Will Fail)

**File:** `components/customer-dashboard.tsx`, somewhere around Firestore query setup
The query `WHERE customerEmail == x ORDER BY createdAt DESC` requires a composite Firestore index. Without it (see 1.2), the customer's order history section throws a Firestore error and shows nothing.

---

## 6. 🟠 Backend / API Errors

---

### 6.1 `/api/emails` — Wrong Import (Runtime Crash)

Already covered in 1.3. This is the highest-priority fix.

---

### 6.2 `updateOrderStatus` Uses Client SDK — Blocked by Security Rules

Already covered in 1.4. Admin status updates fail silently.

---

### 6.3 Email Tracking Link Points to Wrong Domain

**File:** `app/api/orders/route.ts`, Line 80
```typescript
Track your order at <a href="https://asianmarket.lt/track?ticket=${params.ticketNumber}">asianmarket.lt/track</a>
```
The domain `asianmarket.lt` is hardcoded. If the app is deployed elsewhere (e.g., Firebase App Hosting, Vercel), this link is **broken** in every confirmation email.
**Fix:** Use an environment variable `NEXT_PUBLIC_APP_URL`.

---

### 6.4 `deliveryFee` Sent from Client, Used in Server Total — Price Tampering Risk

**File:** `app/api/orders/route.ts`, Line 100
The server validates that `deliveryFee` is a non-negative number — but **trusts the client's value**:
```typescript
if (typeof deliveryFee !== 'number' || deliveryFee < 0) { ... }
```
A malicious client can send `deliveryFee: 0` and get free delivery.
**Fix:** Recalculate `deliveryFee` server-side by looking up `transitHub` in the `settings/transitHubs` Firestore document.

---

### 6.5 `grandTotal` Calculated Twice in `route.ts`

**File:** `app/api/orders/route.ts`, Lines 201 and 230
```typescript
const grandTotal = subtotal + deliveryFee  // line 201, inside transaction
// ...
const grandTotal = subtotal + deliveryFee  // line 230, AFTER transaction
```
The variable is declared twice with `const` in the same scope — this is a bug that would fail TypeScript compilation or cause a `SyntaxError` at runtime. One of them is unused.
**Fix:** Remove the duplicate line 230 declaration.

---

## 7. 🟡 Naming & Branding Inconsistencies

---

### 7.1 Firestore Database Named `'indianmarket'`

**Files:** `lib/firebase-client.ts`, `lib/firebase-admin.ts`, `scripts/test-named-db.ts`
```typescript
const clientDb = getFirestore(clientApp, 'indianmarket')
```
The named Firestore database is `'indianmarket'` — the old brand name. The app is rebranded as "Asian Groceries". While functionally fine, it creates confusion and cannot be renamed in Firestore without migrating all data.

---

### 7.2 Store Name `'IndianMarket'` in Settings

**File:** `app/admin/settings/page.tsx`, Line 9
Default `storeName: 'IndianMarket'` — old brand.

---

### 7.3 `support@indianmarket.lt` in Invoice

**File:** `lib/invoice.ts`, Line 130
```
For support, contact support@indianmarket.lt
```
Old domain/brand in the PDF invoice that gets downloaded by customers.

---

### 7.4 Admin Login Page Placeholder

**File:** `app/admin/login/page.tsx`, Line 130
```
placeholder="indianmarket@test.com"
```
Old email shown as placeholder in the admin login form — visible to anyone who visits `/admin/login`.

---

### 7.5 Two Firebase Client Files With Same Purpose

There are **two** Firebase client init files:
- `app/lib/firebase-client.ts` — simpler, no Analytics, exports `clientDb` and `clientAuth`
- `lib/firebase-client.ts` — more complete, includes Analytics, named DB `'indianmarket'`

Different components import from different paths. This means some components connect to the **default Firestore database** (no name = `(default)`) and others connect to the named `'indianmarket'` database. This can cause data not to appear where expected.
**Fix:** Delete `app/lib/firebase-client.ts` and update all imports to use `lib/firebase-client.ts`.

---

## 8. 🟡 Missing Features (Summarised)

| Feature | Why It Matters |
|---|---|
| Composite Firestore indexes | Order history queries crash without them |
| Payment verification pipeline | All orders "Pending Payment" forever |
| Admin email via env var | Hardcoded email is a maintenance timebomb |
| Delivery fee server-side lookup | Clients can set delivery fee to €0 |
| `itemsSummary` written in orders API | Admin orders list shows `—` for every order |
| Forgot password flow | Customers locked out permanently |
| Stock reservation | Race condition on last-item purchases |
| Sitemap + OG meta | Zero SEO presence |
| Push/SMS notifications | Customers must actively check tracking |
| Email verification on sign-up | Fake emails accepted |
| Settings saved to Firestore | Admin settings reset on every page load |
| Proper Firestore security rules | Any logged-in user can edit products |

---

## 9. ⚙️ Configuration & Environment Issues

---

### 9.1 `.env.local` Contains Real Credentials in Git Repo

**File:** `.env.local` (2909 bytes)
The `.env.local` file exists in the project directory. If `.gitignore` doesn't exclude it (the `.gitignore` does include `.env*.local`), real API keys could be committed.
**Verify:** Run `git log --all -- .env.local` to confirm it has never been committed.

---

### 9.2 Firebase Service Account JSON Committed to Repo

**File:** `asian-groceries-c1b58-firebase-adminsdk-fbsvc-f3372efadf.json` (2403 bytes)
A Firebase Admin SDK service account JSON file exists in the root directory. If this is tracked by Git, **it is a critical security leak** — anyone with the repo can impersonate the service account and access all Firestore data.
**Action:** Check `git log -- asian-groceries-c1b58-firebase-adminsdk-fbsvc-f3372efadf.json`. If committed, revoke the service account immediately in Google Cloud Console and generate a new one. Store credentials in environment variables, not files.

---

### 9.3 `RESEND_API_KEY` Falls Back to Fake Key

Already covered in 4.5. No emails sent if env var missing.

---

### 9.4 `LIBRETRANSLATE_URL` Silently Optional

If not set, the app defaults to MyMemory API — which has a daily free quota. No monitoring, no alerting when the quota is exhausted. The translation silently falls back to showing the original text with a language code suffix.

---

## 10. 🟡 Duplicate Code

| What's Duplicated | Where | Fix |
|---|---|---|
| Bus destinations list | `checkout-form.tsx`, `bus-tracker.tsx`, `customer-dashboard.tsx` | Extract to `lib/destinations.ts` |
| Firebase client init | `app/lib/firebase-client.ts` AND `lib/firebase-client.ts` | Delete `app/lib/`, use root `lib/` only |
| `StatusBadge` inline component | `customer-dashboard.tsx` defines its own `StatusBadge` at line 86, ignoring `components/ui/status-badge.tsx` | Use the shared component |
| Order type definitions | `app/lib/order-types.ts` AND inline types in every admin page | Use the shared type everywhere |
| Firestore query for latest order | `homepage-status.tsx`, `account-order-status.tsx`, `use-active-order.ts` | Use the `useActiveOrder` hook everywhere |

---

## 11. 🔵 TypeScript / Type Safety Issues

| Issue | File | Detail |
|---|---|---|
| `any` type used extensively | `app/admin/settings/page.tsx` | `Field` component uses `any` for all props |
| `any` on order data | Multiple admin pages | `const data = snap.data() as any` bypasses type safety |
| `sessionId` in `Order` type | `app/lib/order-types.ts` | Field never written — causes misleading TypeScript inference |
| `dietary` alias on `Product` | `lib/products.ts` | Both `diet` and `dietary` defined — one is an alias from admin portal; causes confusion about which is canonical |
| Variant `size` and `label` both optional | `lib/products.ts` | `v.label ?? v.size ?? ''` used in order matching — if both are undefined, variant matching fails silently |
| `isSubmitting` never reset on success | `checkout-form.tsx` | After successful order, `setIsSubmitting(false)` is never called — but since `orderCreated` is set to true, the form is replaced. Low severity but leaks state. |

---

*Full codebase audit — `e-commerce-app-design` — Asian Groceries project.*
