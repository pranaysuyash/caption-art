# Frontend Refactor Plan

Last Updated: 2025-12-01
Status: Draft
Related Docs: TECHNICAL_DEBT_REGISTER.md (Items 13,14,17), ARCHITECTURE_IMPROVEMENT_PLAN.md

## Objectives
1. Improve performance (reduce unnecessary compositor rebuilds and duplicate API calls).
2. Enhance maintainability via modular state domains.
3. Strengthen accessibility & UX consistency.
4. Prepare for progressive real-time updates (SSE/WebSocket Phase 4).

---
## Current Pain Points
| Pain Point | Description | Impact |
|------------|-------------|--------|
| Monolithic `App.tsx` | Orchestrates all concerns directly | Hard to extend / test |
| Compositor re-init | Re-created when any dependent state changes | CPU overhead / frame drops |
| Duplicate mask generation | Hidden `MaskGenerator` + manual fetch | Extra cost / race conditions |
| Mixed config sources | Debounce value inline vs UI config constant | Drift risk |
| History vs Auto-Save interplay | Auto-saves intermediate states | Confusing undo semantics |
| Accessibility gaps | Emoji-only controls w/o ARIA labels | Screen reader degradation |
| Unbounded caption list | Captions accumulate indefinitely | Memory growth |
| Missing abort for in-flight tasks | New uploads don't cancel prior requests | Stale state overwrites |

---
## Target Architecture (Component & State Layer)
```
AppProvider (root)
  ├─ UploadProvider
  ├─ CaptionProvider
  ├─ MaskProvider
  ├─ CanvasProvider
  ├─ HistoryProvider
  ├─ ExportProvider
  └─ UIProvider (Theme, Layout)
```

Each provider owns a clearly bounded responsibility, exposing hooks:
- `useUpload()` – file selection, optimization, progress.
- `useCaption()` – caption variants, loading state, regenerate logic.
- `useMask()` – mask generation, regeneration, preview toggles.
- `useCanvas()` – compositor instance, render triggers.
- `useHistory()` – undo/redo, auto-save coordination.
- `useExport()` – export state & progress.
- `useUI()` – layout, theme, social preview platform.

---
## Refactor Phases
| Phase | Focus | Deliverables |
|-------|-------|--------------|
| 1 | Eliminate duplicate mask calls | Remove hidden component; unify mask fetch logic |
| 2 | Provider extraction (Upload/Mask/Caption) | New context modules + migration of logic |
| 3 | Compositor lifecycle optimization | Stable instance + diff-based rendering |
| 4 | History & auto-save coherence | Tag states; batch transient edits |
| 5 | Accessibility improvements | ARIA labels; focus management in modals |
| 6 | Performance instrumentation | RUM metrics, profiler hooks |
| 7 | Realtime readiness | Abstraction for streaming events |

---
## Detailed Changes
### 1. Mask Generation Unification
- Remove hidden `MaskGeneratorComponent` in `App.tsx`.
- Keep single orchestration pipeline within `useMask()` hook.
- Provide `generateMask(imageDataUrl)` returning promise + cancellation handle.

### 2. Provider Abstractions
Folder structure proposal:
```
frontend/src/providers/
  upload.tsx
  caption.tsx
  mask.tsx
  canvas.tsx
  history.tsx
  export.tsx
  ui.tsx
```
Each file exports `<XProvider>` and `useX()` hook.

### 3. Compositor Optimization
- Initialize compositor once when both canvas + image loaded.
- Convert text/style/mask changes into incremental update calls: `compositor.updateTextLayer()`, `updateMask()`, `render()`.
- Avoid clearing caches unnecessarily; maintain internal change flags.

### 4. History & Auto-Save Harmony
- Introduce state classification: `transient` vs `committed`.
- Auto-save only creates `committed` snapshots for: image upload, mask ready, explicit text commit (blur or Enter), template apply.
- Debounced text changes remain transient; undo should revert to last committed.

### 5. Accessibility Enhancements
| Component | Improvement |
|-----------|-------------|
| Toolbar emoji buttons | Add `aria-label` and `role="button"` |
| Export progress overlay | Announce updates via ARIA live region |
| Video preview modal | Implement focus trap & ESC dismissal |
| Upload zone | Provide descriptive drop area label |

### 6. Caption List Management
- Cap stored captions at 50 entries.
- Implement `evictOldest()` when exceeding threshold.
- Provide `pinCaption(caption)` for user favorites (persist pinned subset separately).

### 7. Abortable Operations
Implement `AbortController` for:
- Upload optimization (if multi-stage processing).
- Caption request (OpenAI variants) → abort if new image uploaded.
- Mask request → abort if replaced mid-generation.

### 8. Platform-Aware Shortcuts
- Detect `navigator.platform` or `metaKey` events.
- Map `Cmd+S` to export on macOS; maintain duplication safety.

---
## Performance Goals
| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| Compositor render time (text change) | ~30–50ms | < 20ms p75 |
| Mask generation duplicate calls | 2 per upload (worst-case) | 1 per upload |
| Caption first variant latency | Baseline required | -10% after abort + provider separation |
| CPU time during rapid typing (10 chars/sec) | High re-renders | 30% reduction |

---
## Acceptance Criteria Examples
- Uploading image triggers exactly one mask request (verified by mock call count).
- Undo after rapid typing reverts to last committed meaningful state (tests simulate typing 30 chars then undo once).
- Compositor instance identity stable across text changes (`Object.is(prev, next)` in tests).
- Accessibility audit (axe) passes with zero critical issues for toolbar & modal.

---
## Testing Strategy
| Test Type | Focus |
|-----------|-------|
| Unit | Provider hook logic (state transitions) |
| Integration | Compose providers and simulate multi-step workflow |
| Property-based | Random sequences: upload → type → mask regenerate → undo/redo |
| Performance sampling | Chrome Performance API snapshot vs baseline |
| Accessibility | Jest-axe / Playwright accessibility tree checks |

---
## Migration Steps (Incremental)
1. Create providers skeleton returning existing state from `App` no logic change.
2. Move mask logic & remove hidden component.
3. Migrate caption logic; ensure error/loading states preserved.
4. Introduce compositor wrapper with update methods; adjust effects.
5. Refactor history to differentiate committed vs transient states.
6. Add accessibility improvements & tests.
7. Implement abort controllers & platform-aware shortcuts.
8. Add performance instrumentation & verify targets.

---
## Risk & Mitigation
| Risk | Mitigation |
|------|-----------|
| Regression in complex state flows | Incremental provider migration + snapshot tests |
| Performance not improved | Profile early; adjust dependency arrays |
| User confusion with new undo semantics | Update documentation & tooltip hints |
| Accessibility changes overlooked | Integrate automated axe checks in CI |

---
## Tooling Recommendations
- React Profiler for baseline & post-refactor measurement.
- `why-did-you-render` temporarily to detect excess re-renders.
- Playwright for real canvas interaction & video modal focus tests.

---
## Open Questions
| Question | Path |
|----------|------|
| Introduce global state manager (Zustand/Jotai)? | Start with React Context; evaluate complexity later |
| Use Web Workers for heavy image preprocessing? | Benchmark Phase 2; decide if needed |
| Persist history across sessions? | Not in baseline; optional enhancement |

---
## Summary
This plan decomposes monolithic UI logic into domain providers, optimizes rendering cost, and improves user experience accessibility and responsiveness while paving the way for real-time features. Execution is staged to minimize risk and allow early performance validation.

End of Plan.
