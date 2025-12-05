import { useState, useEffect } from 'react';
import { CreditCard, Download, Check, TrendingUp, AlertCircle } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { SubscriptionPlan, Invoice, PaymentMethod } from '../../../types/account';

export function BillingSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const [subData, invoiceData, paymentData] = await Promise.all([
        accountClient.getSubscription(),
        accountClient.getInvoices(),
        accountClient.getPaymentMethods(),
      ]);
      setSubscription(subData);
      setInvoices(invoiceData);
      setPaymentMethods(paymentData);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string, cycle: 'monthly' | 'annual') => {
    try {
      await accountClient.updateSubscription(planId, cycle);
      alert('Subscription updated successfully');
      loadBillingData();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of the current billing period.')) {
      return;
    }

    try {
      await accountClient.cancelSubscription();
      alert('Subscription canceled successfully');
      loadBillingData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const getTierColor = (tier: string) => {
    const colors = {
      free: '#6b7280',
      starter: '#3b82f6',
      professional: '#8b5cf6',
      enterprise: '#f59e0b',
    };
    return colors[tier as keyof typeof colors] || '#6b7280';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">
          <CreditCard size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Billing & Subscription
        </h2>
        <p className="settings-section-description">
          Manage your subscription plan, billing information, and invoices
        </p>
      </div>

      {/* Current Plan */}
      {subscription && (
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px',
          marginBottom: '2rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>Current Plan</div>
              <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>{subscription.name}</h3>
              <div style={{ fontSize: '1.25rem', marginTop: '0.5rem', opacity: 0.9 }}>
                ${subscription.price}/{subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
              </div>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              {subscription.status.toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>Team Seats</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {subscription.usedSeats} / {subscription.seats}
              </div>
              <div style={{
                height: '4px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                marginTop: '0.5rem',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  background: 'white',
                  width: `${(subscription.usedSeats / subscription.seats) * 100}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>Billing Cycle</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, textTransform: 'capitalize' }}>
                {subscription.billingCycle}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>Next Billing Date</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </div>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <AlertCircle size={20} />
              <span>Your subscription will be canceled at the end of the current billing period.</span>
            </div>
          )}
        </div>
      )}

      {/* Available Plans */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Available Plans</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {['starter', 'professional', 'enterprise'].map((tier) => (
            <div
              key={tier}
              style={{
                padding: '1.5rem',
                border: subscription?.tier === tier ? '2px solid #8b5cf6' : '1px solid #e0e0e0',
                borderRadius: '12px',
                background: subscription?.tier === tier ? '#faf5ff' : 'white',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <h4 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  color: getTierColor(tier),
                }}>
                  {tier}
                </h4>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  ${tier === 'starter' ? '49' : tier === 'professional' ? '149' : '499'}
                  <span style={{ fontSize: '1rem', fontWeight: 400, color: '#666' }}>/mo</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  or ${tier === 'starter' ? '470' : tier === 'professional' ? '1,430' : '4,790'}/yr
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', fontSize: '0.9rem' }}>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                  <span>{tier === 'starter' ? '5' : tier === 'professional' ? '15' : 'Unlimited'} seats</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                  <span>{tier === 'starter' ? '10' : tier === 'professional' ? '50' : 'Unlimited'} workspaces</span>
                </li>
                <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                  <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                  <span>{tier === 'starter' ? '100GB' : tier === 'professional' ? '500GB' : 'Unlimited'} storage</span>
                </li>
                {(tier === 'professional' || tier === 'enterprise') && (
                  <>
                    <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                      <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>Advanced analytics</span>
                    </li>
                    <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                      <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>API access</span>
                    </li>
                  </>
                )}
                {tier === 'enterprise' && (
                  <>
                    <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                      <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>SSO & SAML</span>
                    </li>
                    <li style={{ padding: '0.5rem 0', display: 'flex', gap: '0.5rem' }}>
                      <Check size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>Dedicated support</span>
                    </li>
                  </>
                )}
              </ul>

              {subscription?.tier === tier ? (
                <button
                  className="settings-button settings-button-secondary"
                  style={{ width: '100%' }}
                  disabled
                >
                  Current Plan
                </button>
              ) : (
                <button
                  className="settings-button settings-button-primary"
                  style={{ width: '100%' }}
                  onClick={() => handleUpgrade(`plan-${tier}`, 'monthly')}
                >
                  <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Payment Methods</h3>
        {paymentMethods.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <CreditCard size={24} color="#666" />
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {method.brand?.toUpperCase()} •••• {method.last4}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </div>
                  </div>
                </div>
                {method.isDefault && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: '#10b981',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}>
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No payment methods on file.</p>
        )}
        <button
          className="settings-button settings-button-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => alert('Add payment method (Stripe integration required)')}
        >
          Add Payment Method
        </button>
      </div>

      {/* Invoice History */}
      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Invoice History</h3>
        {invoices.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Invoice #</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{invoice.number}</td>
                    <td style={{ padding: '1rem', color: '#666' }}>
                      {new Date(invoice.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        background: invoice.status === 'paid' ? '#d1fae5' : invoice.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: invoice.status === 'paid' ? '#065f46' : invoice.status === 'pending' ? '#92400e' : '#991b1b',
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <a
                        href={invoice.downloadUrl}
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: '#f8f9fa',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          color: '#1a1a1a',
                          textDecoration: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        <Download size={16} />
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666' }}>No invoices yet.</p>
        )}
      </div>

      {/* Danger Zone */}
      {!subscription?.cancelAtPeriodEnd && (
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          border: '2px solid #ef4444',
          borderRadius: '12px',
        }}>
          <h3 style={{ fontSize: '1.1rem', color: '#ef4444', margin: '0 0 0.5rem 0' }}>Danger Zone</h3>
          <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
            Canceling your subscription will disable access at the end of the current billing period.
          </p>
          <button
            className="settings-button settings-button-danger"
            onClick={handleCancelSubscription}
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );
}
