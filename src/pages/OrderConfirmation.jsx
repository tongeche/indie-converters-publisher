import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchOrder } from '../lib/api';
import { formatDisplayMoney } from '../lib/currency';
import SEO from '../components/SEO';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOrder(id).then(o => { setOrder(o); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="order-page"><div className="container"><p className="order-loading">Loading…</p></div></div>;
  }

  if (!order) {
    return (
      <div className="order-page">
        <div className="container order-notfound">
          <h1>Order not found</h1>
          <Link to="/browse" className="btn btn-primary">Browse the catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <SEO title="Order Confirmation | IndieConverters" description="Your order confirmation." path={`/order/${id}`} />
      <div className="container order-card">
        <span className="order-check" aria-hidden="true">✓</span>
        <h1>{order.status === 'paid' ? 'Thanks for your purchase' : 'Order received'}</h1>
        <p className="order-sub">
          Order <strong>#{order.id.slice(0, 8)}</strong> · {new Date(order.paid_at || order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        <div className="order-items">
          {(order.order_items || []).map(item => (
            <div className="order-item-row" key={item.id}>
              <span className="order-item-title">{item.title}</span>
              <span className="order-item-qty">Qty {item.quantity}</span>
              <span className="order-item-price">{formatDisplayMoney(Number(item.unit_price) * item.quantity, order.currency || 'USD')}</span>
            </div>
          ))}
        </div>

        <div className="order-total-row">
          <span>Total paid</span>
          <strong>{formatDisplayMoney(order.total, order.currency || 'USD')}</strong>
        </div>

        <p className="order-note">
          This purchase was processed in test mode — no real payment was charged.
        </p>

        <Link to="/browse" className="btn btn-primary order-continue-btn">Continue browsing</Link>
      </div>
    </div>
  );
}
