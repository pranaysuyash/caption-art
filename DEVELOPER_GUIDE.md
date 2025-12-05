# Caption Art Developer Guide

Quick reference for working with the Caption Art codebase after UI improvements.

## Design System

### Using Design Tokens

Import tokens in your component CSS:
```css
@import '../styles/design-tokens.css';
```

Use semantic variables:
```css
.my-component {
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

### Color System

**Brand Colors:**
- `--color-brand-primary` (#3b82f6) - Primary actions
- `--color-brand-secondary` (#6366f1) - Secondary elements

**Semantic Colors:**
- `--color-success` (#10b981) - Success states
- `--color-warning` (#f59e0b) - Warnings
- `--color-danger` (#ef4444) - Errors
- `--color-info` (#3b82f6) - Info messages

**UI Colors:**
- `--color-text-primary` - Main text
- `--color-text-secondary` - Secondary text
- `--color-text-tertiary` - Disabled/muted text
- `--color-bg-primary` - Main background
- `--color-bg-secondary` - Secondary background
- `--color-border` - Borders

### Spacing Scale

Based on 4px unit:
- `--space-xs` (4px)
- `--space-sm` (8px)
- `--space-md` (12px)
- `--space-lg` (16px)
- `--space-xl` (24px)
- `--space-2xl` (32px)
- `--space-3xl` (48px)

### Typography

**Font Families:**
```css
--font-heading: 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'Fira Code', monospace;
```

**Font Sizes:**
```css
--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
--font-size-3xl: 2rem;     /* 32px */
```

## Component Patterns

### Buttons

```tsx
// Primary action
<button className="btn btn-primary">
  Save Changes
</button>

// Secondary action
<button className="btn btn-secondary">
  Cancel
</button>

// Ghost/minimal
<button className="btn btn-ghost">
  <Settings size={18} />
</button>

// Sizes
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary">Default</button>
<button className="btn btn-primary btn-lg">Large</button>
```

### Cards

```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Card Title</h3>
    <button className="btn btn-ghost btn-sm">
      <MoreVertical size={16} />
    </button>
  </div>
  <div className="card-content">
    Card content goes here
  </div>
  <div className="card-footer">
    <button className="btn btn-secondary">Cancel</button>
    <button className="btn btn-primary">Save</button>
  </div>
</div>
```

### Responsive Grids

```tsx
<div className="grid grid-responsive">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>
```

CSS:
```css
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-xl);
}

@media (max-width: 1199px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .grid-responsive {
    grid-template-columns: 1fr;
  }
}
```

### Loading States

```tsx
{loading ? (
  <div className="loading-spinner">
    <Loader2 className="animate-spin" size={24} />
    <span>Loading...</span>
  </div>
) : (
  <div>{content}</div>
)}
```

### Empty States

```tsx
<div className="empty-state">
  <Inbox size={48} />
  <h3>No campaigns yet</h3>
  <p>Create your first campaign to get started</p>
  <button className="btn btn-primary">
    <Plus size={18} />
    Create Campaign
  </button>
</div>
```

## API Integration

### Using Account Client

```tsx
import { accountClient } from '../lib/api/accountClient';

// Get organization
const org = await accountClient.getOrganization();

// Invite user
const newUser = await accountClient.inviteUser({
  email: 'user@example.com',
  role: 'member'
});

// Update subscription
const sub = await accountClient.updateSubscription('professional', 'annual');
```

### Error Handling

```tsx
try {
  const result = await accountClient.someMethod();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Show error toast/message
  toast.error(error.message || 'An error occurred');
}
```

### Loading Pattern

```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  async function loadData() {
    try {
      const result = await accountClient.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  loadData();
}, []);
```

## Routing

### Route Structure

```
/agency/
├── workspaces                          # Workspace list
├── workspaces/:id/campaigns            # Campaign list
├── workspaces/:id/campaigns/:id        # Campaign detail
├── workspaces/:id/campaigns/:id/review # Review grid
└── settings                            # Account settings
    ├── organization
    ├── users
    ├── billing
    ├── security
    ├── integrations
    ├── brand-kits
    └── audit-logs
```

### Navigation

```tsx
import { useNavigate, useParams } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  const { workspaceId, campaignId } = useParams();

  const goToCampaigns = () => {
    navigate(`/agency/workspaces/${workspaceId}/campaigns`);
  };

  const goToSettings = () => {
    navigate('/agency/settings');
  };
}
```

### Protected Routes

All agency routes are protected by `AuthGuard`:

```tsx
<Route
  path="/agency/*"
  element={
    <AuthGuard isAuthenticated={isAuthenticated} loading={loading}>
      <AgencyRoutes />
    </AuthGuard>
  }
/>
```

## State Management

### Using React Hooks

```tsx
// Simple state
const [count, setCount] = useState(0);

// Derived state
const [items, setItems] = useState([]);
const activeItems = items.filter(item => item.active);

// Side effects
useEffect(() => {
  // Runs on mount and when dependencies change
  fetchData();
}, [dependency]);

// Memoization
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

### Context Pattern

```tsx
// Create context
const MyContext = createContext(null);

// Provider
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// Consumer
function MyComponent() {
  const { state, setState } = useContext(MyContext);
}
```

## Form Handling

### Basic Form

```tsx
function MyForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await saveData(formData);
      // Success
    } catch (error) {
      setErrors({ form: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

## Permissions

### Checking Permissions

```tsx
import { ROLE_PERMISSIONS } from '../types/account';

function hasPermission(userRole, permission) {
  return ROLE_PERMISSIONS[userRole]?.includes(permission);
}

// Usage
const canManageBilling = hasPermission(user.role, 'billing.manage');

if (canManageBilling) {
  // Show billing controls
}
```

### Role-Based Rendering

```tsx
function MyComponent({ user }) {
  const isOwnerOrAdmin = ['owner', 'admin'].includes(user.role);
  
  return (
    <div>
      {/* Everyone sees this */}
      <div>Public content</div>
      
      {/* Only owners and admins see this */}
      {isOwnerOrAdmin && (
        <div>Admin controls</div>
      )}
      
      {/* Only owners see this */}
      {user.role === 'owner' && (
        <div>Owner-only controls</div>
      )}
    </div>
  );
}
```

## Testing

### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<MyComponent loading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

### API Tests

```tsx
import { accountClient } from '../lib/api/accountClient';

describe('Account API', () => {
  it('fetches organization', async () => {
    const org = await accountClient.getOrganization();
    expect(org).toHaveProperty('id');
    expect(org).toHaveProperty('name');
  });

  it('handles errors', async () => {
    await expect(
      accountClient.inviteUser({ email: 'invalid' })
    ).rejects.toThrow();
  });
});
```

## Performance

### Optimization Tips

1. **Use React.memo for expensive components:**
```tsx
const MyComponent = React.memo(({ data }) => {
  // Component code
});
```

2. **Lazy load routes:**
```tsx
const Settings = lazy(() => import('./components/SettingsPage'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

3. **Debounce search inputs:**
```tsx
const debouncedSearch = useMemo(
  () => debounce((term) => search(term), 300),
  []
);
```

4. **Virtual scrolling for long lists:**
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

## Debugging

### Console Logging

```tsx
// Development only
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### React DevTools

- Install React DevTools browser extension
- Inspect component props and state
- Profile performance issues

### Network Debugging

```tsx
// Log all API calls
const originalFetch = window.fetch;
window.fetch = (...args) => {
  console.log('API call:', args[0]);
  return originalFetch(...args);
};
```

## Common Issues

### Issue: Styling not applying
**Solution:** Check import order, ensure design tokens are loaded first

### Issue: Route not found
**Solution:** Check route path matches exactly, including trailing slashes

### Issue: API call fails
**Solution:** Check authentication, verify API endpoint in `.env` file

### Issue: State not updating
**Solution:** Ensure you're using functional updates for state based on previous state

```tsx
// Wrong
setState(state + 1);

// Right
setState(prev => prev + 1);
```

## Resources

- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express Documentation](https://expressjs.com)

## Getting Help

1. Check existing documentation
2. Search codebase for similar patterns
3. Review component examples in `frontend/src/components`
4. Ask team members
5. Review git history for context: `git log --follow path/to/file`
