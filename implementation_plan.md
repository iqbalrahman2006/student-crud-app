# Implementation Plan - Final Enterprise Polish (Safe Mode)

## Goal
Execute the "Final Antigravity Ultra-Prompt" to achieve a robust Consolidated/Detailed view system, high-quality data seeding, and performance stability without regressions.

## User Review Required
> [!IMPORTANT]
> **View Toggle Strategy**: The global `viewMode` ('consolidated' vs 'detailed') will now cascade down to Tables.
> - **Consolidated Mode**: Shows minimal "Executive" columns (Name, Status, Dept / Title, Author, Available).
> - **Detailed Mode**: Shows FULL data columns with horizontal scrolling if needed.
> This replaces the previous "Dashboard vs Dashboard" toggle idea; now it controls *Information Density* across the app.

## Proposed Changes

### 1. View Toggle Propagation
#### [MODIFY] `client/src/App.js`
- Pass `viewMode` prop to `StudentList` (via `renderContent` -> `students` view) and `Library` component.

### 2. Table Render Logic (The "Toggle" Effect)
#### [MODIFY] `client/src/components/StudentList.js`
- Accept `viewMode`.
- **Condition**: If `viewMode === 'consolidated'`, render ONLY `Name`, `Department`, `Status`.
- **Condition**: If `viewMode === 'detailed'`, render ALL columns (Email, Phone, GPA, Dates, etc.).

#### [MODIFY] `client/src/components/library/BookInventory.js`
- Accept `viewMode` (passed from `Library.js`).
- **Condition**: If `viewMode === 'consolidated'`, render ONLY `Title`, `Author`, `Available`.
- **Condition**: If `viewMode === 'detailed'`, render ALL columns (ISBN, Shelf, Pop, etc.).

### 3. Data Seeding Quality
#### [MODIFY] `server/scripts/seed-safe.js`
- Ensure "Popularity" fields are populated.
- Ensure "Department" variety matches the 6 predefined categories for correct Chart rendering.

### 4. Email Engine & Logs
#### [CHECK] `server/src/controllers/libraryController.js` (Trigger Logic)
- Ensure `triggerReminders` writes to Audit Log with action "EMAIL_SENT" or similar.

### 5. Performance
#### [MODIFY] `client/src/components/library/BookInventory.js`
- Ensure `useEffect` for data loading has strict dependency array.
- Confirm Pagination is active (already implemented with `limit: 50`).

## Verification Plan

### Automated Tests
- Update `enterprise.test.js` to verify:
    - `StudentList` shows 3 columns in Consolidated mode.
    - `StudentList` shows 8+ columns in Detailed mode.

### Manual Verification
- **Toggle**: Click toggle -> Watch columns appear/disappear instantly.
- **Scroll**: Check horizontal scroll in Detailed mode on small screen.
- **Seed**: Run script -> Check Charts in Dashboard (should look colorful and populated).

# Phase 10: Library Strict Patch (Complete)
## Goal
Implement missing Borrow/Return/Renew UI/UX and fix Dashboard/Chart issues without touching fetching logic.

## Changes
### Backend
- **`server/src/routes/library.js`**: `POST /borrow` alias added. `/analytics` logic updated for "Borrowed Today".
### Frontend
- **`LibraryAnalytics.js`**: Fixed Chart cutoff, added 0-count description boxes.
- **`LibraryProfileView.js`**: Added Return/Renew buttons to Active Loans table.
- **`Library.js`**: Added "Circulation Actions" panel to Edit Book modal.
- **`bookService.js`**: Verified API methods.

## Verification
- **Build**: `npm run build` passed.
- **Logic**: Checked against Strict Safe Mode requirements.