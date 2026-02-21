-- AlterEnum: Change Shift enum from English to Spanish
-- Step 1: Add new Spanish values to the enum
ALTER TYPE "Shift" ADD VALUE IF NOT EXISTS 'MATUTINA';
ALTER TYPE "Shift" ADD VALUE IF NOT EXISTS 'VESPERTINA';

-- Step 2: Update existing data
UPDATE "applications" SET shift = 'MATUTINA' WHERE shift = 'MORNING';
UPDATE "applications" SET shift = 'VESPERTINA' WHERE shift = 'AFTERNOON';

-- Note: Removing old enum values requires recreating the enum, which is complex
-- For now, we've added the new values and migrated the data
-- The old values (MORNING, AFTERNOON) will remain in the enum but unused
