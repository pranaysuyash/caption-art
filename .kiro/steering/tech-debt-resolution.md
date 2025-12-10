# Tech Debt Resolution Policy

## Core Principle

**There is NO such thing as a "pre-existing bug" or "unrelated error."**

When you touch a codebase, you are responsible for its overall health. Tech debt compounds quickly and creates a culture of "someone else's problem." This stops now.

---

## Rules

### 1. All Errors Must Be Resolved

When you encounter ANY error in the codebase:

- ❌ **DO NOT** say "that's pre-existing"
- ❌ **DO NOT** say "that's unrelated to my changes"
- ❌ **DO NOT** say "that's a separate issue"
- ❌ **DO NOT** ignore it and move on

- ✅ **DO** acknowledge the error
- ✅ **DO** add it to the TODO tracker
- ✅ **DO** fix it if it's blocking or critical
- ✅ **DO** fix it incrementally if it's large

### 2. Incremental Resolution is Acceptable

You don't need to fix everything at once. But you DO need to:

1. **Document it** - Add to TODO tracker with details
2. **Categorize it** - Priority, impact, estimated time
3. **Make progress** - Fix a few items each session
4. **Track it** - Update TODO as you resolve items

**Example**: 98 TypeScript errors found
- ✅ Document all 98 in TODO with categories
- ✅ Fix 5-10 per session
- ✅ Track progress in TODO file
- ❌ Ignore them because "they're in test files"

### 3. No Massive Undertaking Excuse

"This would be a massive undertaking" is not an excuse to skip tech debt.

**Why this excuse doesn't work**:
- You created or contributed to the debt (even if indirectly)
- Incremental fixes prevent massive undertakings
- Ignoring debt makes it worse
- Future you will thank present you

**Instead**:
- Break it into small chunks
- Fix a category at a time
- Make steady progress
- Celebrate small wins

### 4. Test Errors Are Real Errors

"It's only in test files" is not a valid reason to ignore errors.

**Why test errors matter**:
- They prevent proper testing
- They indicate type safety issues
- They reduce code quality
- They create confusion for other developers
- They compound over time

**Action required**:
- Fix test TypeScript errors
- Ensure tests actually run
- Maintain test quality
- Keep test coverage high

### 5. Build Success ≠ Code Health

Just because `npm run build` succeeds doesn't mean the code is healthy.

**Production build may succeed while**:
- Test files have errors (excluded from build)
- Type safety is compromised
- Tests don't run
- Code quality is poor

**Full health requires**:
- ✅ Production build succeeds
- ✅ Zero TypeScript errors (including tests)
- ✅ All tests pass
- ✅ No console errors
- ✅ No runtime errors

---

## Implementation Strategy

### When Starting a Task

1. **Audit current state**
   ```bash
   # Check TypeScript errors
   npx tsc --noEmit
   
   # Check test status
   npm test -- --run
   
   # Check build
   npm run build
   ```

2. **Document findings**
   - Add errors to TODO tracker
   - Categorize by type and priority
   - Estimate resolution time

3. **Plan resolution**
   - Identify quick wins
   - Group related errors
   - Set incremental goals

### During Task Execution

1. **Fix as you go**
   - If you touch a file with errors, fix them
   - If you see a quick fix, do it
   - Don't create new tech debt

2. **Make incremental progress**
   - Fix 5-10 errors per session
   - Focus on one category at a time
   - Update TODO tracker

3. **Verify fixes**
   - Run TypeScript check
   - Run affected tests
   - Ensure no new errors introduced

### Before Completing a Task

1. **System health check**
   - Backend starts without errors
   - Frontend starts without errors
   - Zero TypeScript errors in modified files
   - Zero console errors
   - All new tests pass

2. **Update TODO tracker**
   - Mark completed items
   - Add any new issues found
   - Update progress summary

3. **Document progress**
   - Note what was fixed
   - Note what remains
   - Estimate remaining work

---

## Accountability

**You are responsible for**:
- All code you write
- All files you modify
- All errors you encounter
- The overall codebase health
- Making incremental progress on tech debt

**Not just your immediate changes.**

---

## Examples

### ❌ WRONG Approach

```
"I found 98 TypeScript errors but they're all in test files 
and pre-existing, so I'm ignoring them. My feature works, 
so the task is complete."
```

**Problems**:
- Ignores tech debt
- No documentation
- No plan for resolution
- Passes problem to next developer

### ✅ CORRECT Approach

```
"I found 98 TypeScript errors in test files. I've:

1. Documented all errors in TODO tracker
2. Categorized into 5 groups
3. Fixed 8 errors in Category 1 (property tests)
4. Updated TODO with progress
5. Remaining: 90 errors, will fix 10 more next session

My feature works and I've made progress on tech debt."
```

**Benefits**:
- Acknowledges tech debt
- Documents everything
- Makes incremental progress
- Sets clear next steps

---

## TODO Tracker Format

Always maintain a TODO tracker file with:

```markdown
## ✅ COMPLETED TASKS
- [x] Task description
  - Details
  - Files modified
  - Verification steps

## 🔧 TECH DEBT TO RESOLVE
### Category Name (X errors)
**Priority**: High/Medium/Low
**Impact**: Description
**Files affected**: List

**Tasks**:
- [ ] Specific fix needed
- [ ] Another fix needed

## 📋 REMAINING FEATURES
### Feature Name
**Priority**: P0/P1/P2
**Estimated Time**: X hours
**Status**: Not started/In progress/Blocked

**Tasks**:
- [ ] Subtask 1
- [ ] Subtask 2

## 📊 PROGRESS SUMMARY
**Completed**: X tasks
**Remaining**: Y tasks
**Tech Debt Items**: Z errors to fix
```

---

## Enforcement

This policy is **non-negotiable**. Every task must:

1. Document all errors found
2. Make incremental progress on tech debt
3. Update TODO tracker
4. Verify system health

**No exceptions.**

---

## Benefits

Following this policy:

- ✅ Prevents tech debt accumulation
- ✅ Improves code quality over time
- ✅ Makes codebase more maintainable
- ✅ Reduces future debugging time
- ✅ Creates culture of ownership
- ✅ Enables proper testing
- ✅ Increases team confidence

---

**Last Updated**: December 9, 2025
