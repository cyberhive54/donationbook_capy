# Time Fields Migration Guide

## Overview
This migration adds hour and minute tracking to collections and expenses, allowing precise datetime recording instead of just dates.

## Database Changes

### New Columns Added
- `collections.time_hour` (INTEGER, 0-23)
- `collections.time_minute` (INTEGER, 0-59)
- `expenses.time_hour` (INTEGER, 0-23)
- `expenses.time_minute` (INTEGER, 0-59)

### Migration Steps

1. **Run the SQL Migration**
   ```sql
   -- Execute this in your Supabase SQL Editor
   -- File: supabase-add-time-fields.sql
   ```

2. **What the Migration Does:**
   - Adds time_hour and time_minute columns to both tables
   - Sets default values to 0 (midnight) for existing records
   - Adds CHECK constraints to ensure valid time values
   - Creates composite indexes for efficient datetime queries

### Important Notes
- **Existing Data**: All existing records will have time set to 00:00 (midnight)
- **Backwards Compatible**: Old code will continue to work, time fields are optional
- **No Data Loss**: This is a non-destructive migration

## Code Changes

### 1. Type Updates
Updated TypeScript interfaces to include time fields:
```typescript
export interface Collection {
  // ... existing fields
  time_hour?: number;
  time_minute?: number;
}

export interface Expense {
  // ... existing fields
  time_hour?: number;
  time_minute?: number;
}
```

### 2. UI Updates
Both `AddCollectionModal` and `AddExpenseModal` now include:
- Hour input (0-23)
- Minute input (0-59)
- Default values set to current time when creating new entries
- Time preserved when editing existing entries

### 3. Display Updates
All tables now show time alongside dates:
- `CollectionTable`
- `ExpenseTable`
- `TransactionTable`

Format: `21 Nov 2024 14:30` (showing date + time)

### 4. Utility Functions
New formatting functions in `lib/utils.ts`:

```typescript
// Format date with optional time
formatDateTime(date: string, hour?: number, minute?: number): string

// Format time only
formatTimeOnly(hour?: number, minute?: number): string
```

### 5. Sorting Logic
Transaction lists now sort by:
1. Date (descending)
2. Hour (descending)
3. Minute (descending)

This ensures chronological ordering throughout the day.

## Usage Examples

### Creating a Collection with Time
```typescript
await supabase.from('collections').insert({
  name: 'John Doe',
  amount: 500,
  group_name: 'Group A',
  mode: 'Cash',
  date: '2024-11-21',
  time_hour: 14,      // 2 PM
  time_minute: 30,    // 30 minutes
  festival_id: festId
});
```

### Querying by DateTime
```sql
-- Get collections for a specific date/time range
SELECT * FROM collections 
WHERE date = '2024-11-21' 
  AND (time_hour > 14 OR (time_hour = 14 AND time_minute >= 30))
ORDER BY date DESC, time_hour DESC, time_minute DESC;
```

## Import/Export Considerations

### JSON Import Format
When importing data, time fields are optional:

```json
{
  "name": "John Doe",
  "amount": 500,
  "group_name": "Group A",
  "mode": "Cash",
  "date": "2024-11-21",
  "time_hour": 14,
  "time_minute": 30,
  "note": "Optional note"
}
```

If time fields are omitted, they default to 0 (midnight).

### CSV Export
Time columns will be included in exports with format: `HH:MM`

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Create new collection with time
- [ ] Edit existing collection (should show 00:00)
- [ ] Create new expense with time
- [ ] Edit existing expense
- [ ] Verify time display in tables
- [ ] Test import/export with time data
- [ ] Check transaction sorting by datetime
- [ ] Verify old records show 00:00 time

## Rollback (If Needed)

If you need to rollback, run:

```sql
ALTER TABLE collections 
  DROP COLUMN IF EXISTS time_hour,
  DROP COLUMN IF EXISTS time_minute;

ALTER TABLE expenses 
  DROP COLUMN IF EXISTS time_hour,
  DROP COLUMN IF EXISTS time_minute;
```

Note: This will permanently remove time data.

## Performance Impact

- **Minimal**: New indexes ensure efficient datetime queries
- **Storage**: ~8 bytes per record (2 integers)
- **Query Speed**: No degradation, improved with composite indexes

## Future Enhancements

Potential improvements:
- Time range filters in reports
- Hourly/minutely analytics
- Time-based automatic sorting
- Timezone support
