import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCart, updateCartItemQuantity, removeFromCart } from '../lib/api';
import { formatDisplayMoney } from '../lib/currency';
import SEO from '../components/SEO';
import './Cart.css';

function CartIcon({ type }) {
  if (type === 'bag') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 8.5h11l1 11h-13l1-11Z" />
        <path d="M9 8.5a3 3 0 0 1 6 0" />
      </svg>
    );
  }

  if (type === 'lock') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" />
        <path d="M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v6.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5V12a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  );
}

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart,    setCart]    = useState({ cartId: null, items: [], subtotal: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId,  setBusyId]  = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/cart' } }); return; }
    setLoading(true);
    fetchCart(user.id).then(c => { setCart(c); setLoading(false); });
  }, [user, navigate]);

  async function handleQuantity(item, quantity) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await updateCartItemQuantity(item.id, quantity);
      setCart(prev => {
        const items = quantity < 1
          ? prev.items.filter(i => i.id !== item.id)
          : prev.items.map(i => i.id === item.id ? { ...i, quantity } : i);
        const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
        return { ...prev, items, subtotal };
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemove(item) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await removeFromCart(item.id);
      setCart(prev => {
        const items = prev.items.filter(i => i.id !== item.id);
        const subtotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
        return { ...prev, items, subtotal };
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="cart-page">
      <SEO title="Your Cart | IndieConverters" description="Review the books in your cart before checkout." path="/cart" />
      <div className="cart-shell">
        <main className="cart-workspace">
          <header className="cart-header">
            <div>
              <span className="eyebrow">Checkout</span>
              <h1>Your cart</h1>
            </div>
            <Link to="/shop" className="cart-header-link">Continue shopping</Link>
          </header>

          {loading ? (
            <p className="cart-loading">Loading…</p>
          ) : cart.items.length === 0 ? (
            <div className="cart-empty">
              <h2>Your cart is empty</h2>
              <p>Books sold directly through Indie Converters can be added from the shop or book detail page.</p>
              <Link to="/shop" className="btn btn-primary">Browse the shop</Link>
            </div>
          ) : (
            <div className="cart-layout">
              <section className="cart-list" aria-label="Cart items">
                <div className="cart-list-head">
                  <span>Book</span>
                  <span>Quantity</span>
                  <span>Total</span>
                </div>
                {cart.items.map(item => (
                  <article className="cart-row" key={item.id}>
                    {item.image_url
                      ? <img className="cart-row-cover" src={item.image_url} alt="" />
                      : <div className="cart-row-cover cart-row-cover--ph" />
                    }
                    <div className="cart-row-info">
                      <span className="cart-row-kicker">Direct-sale book</span>
                      <span className="cart-row-title">{item.title}</span>
                      <span className="cart-row-price">{formatDisplayMoney(item.price, 'USD')} each</span>
                    </div>
                    <div className="cart-row-qty" aria-label={`Quantity for ${item.title}`}>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleQuantity(item, item.quantity - 1)}
                      >−</button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleQuantity(item, item.quantity + 1)}
                      >+</button>
                    </div>
                    <span className="cart-row-line-total">{formatDisplayMoney(Number(item.price) * item.quantity, 'USD')}</span>
                    <button
                      type="button"
                      className="cart-row-remove"
                      disabled={busyId === item.id}
                      onClick={() => handleRemove(item)}
                      aria-label={`Remove ${item.title}`}
                    >
                      ×
                    </button>
                  </article>
                ))}
              </section>

              <aside className="cart-side">
                <div className="cart-summary">
                  <span className="cart-summary-label">Order summary</span>
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <strong>{formatDisplayMoney(cart.subtotal, 'USD')}</strong>
                  </div>
                  <div className="cart-summary-row cart-summary-row--muted">
                    <span>Taxes</span>
                    <span>Calculated later</span>
                  </div>
                  <p className="cart-summary-note">You are buying direct-sale books through Indie Converters. External retailer titles are purchased on their own book pages.</p>
                  <Link to="/checkout" className="btn btn-primary cart-checkout-btn">
                    Proceed to checkout →
                  </Link>
                  <Link to="/shop" className="cart-continue-link">Keep browsing</Link>
                </div>

                <div className="cart-assurance">
                  <span><CartIcon type="lock" /></span>
                  <div>
                    <strong>Private checkout</strong>
                    <p>Your cart only includes direct Indie Converters purchases.</p>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
