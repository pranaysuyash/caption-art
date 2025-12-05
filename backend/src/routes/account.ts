import { Router } from 'express';
import { AccountService } from '../services/accountService';
import { createAuthMiddleware } from './auth';

const router = Router();
const authInfo = createAuthMiddleware();

// Apply auth middleware to all routes
router.use(authInfo);

// Organization
router.get('/organization', async (req: any, res) => {
  try {
    const org = await AccountService.getOrganization(req.agency.id);
    res.json(org);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/organization', async (req: any, res) => {
  try {
    const org = await AccountService.updateOrganization(req.agency.id, req.body);
    res.json(org);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users
router.get('/users', async (req: any, res) => {
  try {
    const users = await AccountService.getUsers(req.agency.id);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/invite', async (req: any, res) => {
  try {
    const { email, role } = req.body;
    const user = await AccountService.inviteUser(req.agency.id, email, role);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/users/:id/role', async (req: any, res) => {
  try {
    const { role } = req.body;
    const user = await AccountService.updateUserRole(req.params.id, role);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req: any, res) => {
  try {
    // Prevent deleting self? logic should be in service or here.
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await AccountService.removeUser(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/:id/suspend', async (req: any, res) => {
    try {
        const user = await AccountService.suspendUser(req.params.id);
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/users/:id/reactivate', async (req: any, res) => {
    try {
        const user = await AccountService.reactivateUser(req.params.id);
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Billing
router.get('/billing/subscription', async (req: any, res) => {
  try {
    const sub = await AccountService.getSubscription(req.agency.id);
    res.json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/billing/subscription', async (req: any, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const sub = await AccountService.updateSubscription(req.agency.id, planId, billingCycle);
    res.json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/billing/subscription/cancel', async (req: any, res) => {
  try {
    const sub = await AccountService.cancelSubscription(req.agency.id);
    res.json(sub);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/billing/invoices', async (req: any, res) => {
  try {
    const invoices = await AccountService.getInvoices(req.agency.id);
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/billing/payment-methods', async (req: any, res) => {
  try {
    const methods = await AccountService.getPaymentMethods(req.agency.id);
    res.json(methods);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Logs
router.get('/audit-logs', async (req: any, res) => {
  try {
    const logs = await AccountService.getAuditLogs(req.agency.id, req.query);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit-logs/export', async (req: any, res) => {
    // TODO: Implement export functionality (CSV/JSON generation)
    // For now, return not implemented or basic json
    res.status(501).json({ error: 'Not implemented' });
});

// Integrations
router.get('/integrations', async (req: any, res) => {
  try {
    const integrations = await AccountService.getIntegrations(req.agency.id);
    res.json(integrations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/integrations/:provider/connect', async (req: any, res) => {
  try {
    const result = await AccountService.connectIntegration(req.agency.id, req.params.provider, req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/integrations/:id', async (req: any, res) => {
  try {
    await AccountService.disconnectIntegration(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Keys
router.get('/api-keys', async (req: any, res) => {
  try {
    const keys = await AccountService.getApiKeys(req.agency.id);
    res.json(keys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api-keys', async (req: any, res) => {
  try {
    const { name, scopes } = req.body;
    const key = await AccountService.createApiKey(req.agency.id, name, scopes);
    res.json(key);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api-keys/:id/revoke', async (req: any, res) => {
  try {
    await AccountService.revokeApiKey(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Brand Kits
router.get('/brand-kits', async (req: any, res) => {
  try {
    const kits = await AccountService.getBrandKits(req.agency.id);
    res.json(kits);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Settings
router.get('/settings', async (req: any, res) => {
  try {
    const settings = await AccountService.getSettings(req.agency.id);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/settings', async (req: any, res) => {
  try {
    const settings = await AccountService.updateSettings(req.agency.id, req.body);
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
