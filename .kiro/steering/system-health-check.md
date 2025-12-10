---
inclusion: always
---

# System Health Check - Mandatory Before Task Completion

## Critical Rule

**NEVER mark a task as complete or move to the next task until ALL systems are verified working.**

---

## Pre-Task Completion Checklist

Before declaring ANY task complete, you MUST verify:

### 1. Backend Health ✓

```bash
# Start backend
cd backend
npm run dev

# Verify:
# - No startup errors
# - No Prisma errors
# - No database connection errors
# - Server starts successfully
# - All routes load without errors
```

**Common Issues to Check:**
- Prisma adapter configuration (SQLite requires adapter)
- Database connection string
- Missing environment variables
- Port conflicts
- Dependency issues

### 2. Frontend Health ✓

```bash
# Start frontend
cd frontend
npm run dev

# Verify:
# - No TypeScript errors
# - No build errors
# - Dev server starts successfully
# - No console errors on page load
# - All routes accessible
```

**Common Issues to Check:**
- TypeScript compilation errors
- Missing imports
- Component integration issues
- Route configuration
- CSS/styling issues

### 3. Integration Health ✓

**Test the actual user flow:**
1. Open browser to frontend URL
2. Navigate through the app
3. Test new features you just built
4. Verify backend API calls work
5. Check browser console for errors
6. Verify network requests succeed

### 4. Zero Errors Policy ✓

**Before completion, ensure:**
- ✓ Zero TypeScript errors
- ✓ Zero runtime errors
- ✓ Zero console errors
- ✓ Zero build errors
- ✓ Zero test failures (for new code)
- ✓ Backend starts without errors
- ✓ Frontend starts without errors

---

## Verification Commands

### Quick Health Check

```bash
# Backend
cd backend && npm run dev &
BACKEND_PID=$!
sleep 5
curl http://localhost:3001/health || echo "Backend failed"
kill $BACKEND_PID

# Frontend
cd frontend && npm run build
# Should complete without errors
```

### TypeScript Check

```bash
cd frontend
npx tsc --noEmit
# Should show 0 errors
```

### Test Check

```bash
cd frontend
npm test -- --run
# All tests should pass
```

---

## When Issues Are Found

### DO NOT:
- ❌ Ignore errors and move on
- ❌ Say "it's a separate issue"
- ❌ Say "it's a pre-existing bug"
- ❌ Tell user to fix it themselves
- ❌ Mark task as complete with known errors
- ❌ Assume errors don't affect your work
- ❌ Distinguish between "your" errors and "other" errors

### DO:
- ✅ Stop immediately
- ✅ Read the error message carefully
- ✅ Fix the root cause
- ✅ Verify the fix works
- ✅ Re-run health checks
- ✅ Only then proceed

### CRITICAL RULE:
**There is NO such thing as a "pre-existing bug". If there's a bug in the system, it MUST be resolved before marking any task complete. You are responsible for ALL errors in the codebase, regardless of when they were introduced.**

---

## Error Response Protocol

When you encounter an error:

1. **Acknowledge**: "I found an error in [system]. Fixing it now."
2. **Diagnose**: Read error logs, check configuration
3. **Fix**: Make necessary code changes
4. **Verify**: Run the system again
5. **Confirm**: "Error fixed. [System] now running successfully."

---

## Integration Verification

After completing any feature:

### Backend Integration
```bash
cd backend
npm run dev
# Wait for "Server listening on port 3001"
# Check for any error messages
# Verify database connection
```

### Frontend Integration
```bash
cd frontend
npm run dev
# Wait for "Local: http://localhost:5173"
# Open browser
# Check console for errors
# Test the feature
```

### End-to-End Test
1. Start both backend and frontend
2. Navigate to the new feature
3. Perform user actions
4. Verify everything works
5. Check for console/network errors

---

## Tech Debt Resolution

**All tech debt must be resolved before task completion:**

- Database configuration issues
- Missing dependencies
- Broken imports
- TypeScript errors
- Build warnings
- Deprecated code
- Incomplete integrations

**No exceptions.**

---

## Completion Criteria

A task is ONLY complete when:

1. ✅ All code written and integrated
2. ✅ Backend starts without errors
3. ✅ Frontend starts without errors
4. ✅ Zero TypeScript errors
5. ✅ Feature works end-to-end
6. ✅ No console errors
7. ✅ No network errors
8. ✅ All tests pass
9. ✅ Documentation updated
10. ✅ User can actually use the feature

---

## Example: Proper Task Completion

### ❌ WRONG:
```
"I've integrated the feature. The frontend has some TypeScript 
errors but those are unrelated. The backend has a Prisma error 
but that's a separate issue. The feature is complete!"
```

### ✅ CORRECT:
```
"I've integrated the feature. Let me verify both systems:

1. Checking backend... Found Prisma adapter error. Fixing...
2. Fixed Prisma configuration. Backend now starts successfully.
3. Checking frontend... Found TypeScript error in new component. Fixing...
4. Fixed import issue. Frontend now compiles without errors.
5. Testing end-to-end... Feature works correctly.
6. Checking console... No errors.
7. All systems verified. Task complete."
```

---

## Accountability

**You are responsible for:**
- All code you write
- All systems you touch
- All errors you introduce
- All integrations you create
- The entire application health

**Not just your immediate changes.**

---

## Summary

Before saying "done":

1. **Start backend** - verify no errors
2. **Start frontend** - verify no errors
3. **Test feature** - verify it works
4. **Check console** - verify no errors
5. **Check network** - verify API calls work
6. **Run tests** - verify they pass
7. **Fix issues** - resolve any problems
8. **Verify again** - confirm everything works

**Only then** can you mark the task complete.

---

## This Is Non-Negotiable

Every task. Every time. No exceptions.

If you skip these checks, you're not doing your job properly.

---

**Last Updated:** December 7, 2025
