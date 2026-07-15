import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchCart, createCheckoutSession } from '../lib/api';
import { convertToDisplayCurrency, formatDisplayMoney } from '../lib/currency';
import SEO from '../components/SEO';
import './Checkout.css';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', detail: 'Visa or Mastercard', logos: ['visa', 'mastercard'] },
  { id: 'paypal', label: 'PayPal', detail: 'Pay with your PayPal account', logos: ['paypal'] },
  { id: 'mpesa', label: 'M-Pesa', detail: 'Mobile money checkout', logos: ['mpesa'] },
];

const ACCEPTED_PAYMENTS = ['stripe', 'visa', 'mastercard', 'paypal', 'mpesa'];
const DELIVERY_METHODS = [
  { id: 'digital', label: 'Digital delivery', detail: 'Email receipt and access instructions', price: 0 },
  { id: 'standard', label: 'Standard shipping', detail: '5-10 business days for eligible print books', price: 0 },
  { id: 'express', label: 'Express shipping', detail: '1-3 business days for eligible print books', price: 9 },
];

function PaymentLogo({ type }) {
  return <span className={`payment-logo payment-logo--${type}`}>{type === 'mastercard' ? 'Mastercard' : type}</span>;
}

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart,      setCart]      = useState({ cartId: null, items: [], subtotal: 0 });
  const [loading,   setLoading]   = useState(true);
  const [placing,   setPlacing]   = useState(false);
  const [error,     setError]     = useState('');
  const [method,    setMethod]    = useState('card');
  const [delivery,  setDelivery]  = useState('digital');
  const [billingSame, setBillingSame] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountStatus, setDiscountStatus] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login', { state: { from: '/checkout' } }); return; }
    setLoading(true);
    fetchCart(user.id).then(c => { setCart(c); setLoading(false); });
  }, [user, navigate]);

  async function handlePlaceOrder(event) {
    event.preventDefault();
    if (placing || cart.items.length === 0) return;
    if (!termsAccepted) {
      setError('Please accept the terms before continuing to payment.');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const { url } = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      setError(err?.message || 'Something went wrong placing your order.');
      setPlacing(false);
    }
  }

  function handleApplyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountStatus('Enter a code to test the validation state.');
      return;
    }
    setDiscountStatus(code === 'TEST10' ? 'TEST10 accepted in UI preview. Backend discount logic is not connected yet.' : 'Code not recognised in test mode.');
  }

  if (loading) {
    return <div className="checkout-page"><div className="checkout-loading">Loading…</div></div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <SEO title="Checkout | IndieConverters" description="Complete your purchase." path="/checkout" />
        <div className="checkout-empty">
          <h1>Your cart is empty</h1>
          <p>Add a book to your cart before checking out.</p>
          <Link to="/shop" className="btn btn-primary">Browse the shop</Link>
        </div>
      </div>
    );
  }

  const subtotalDisplay = convertToDisplayCurrency(cart.subtotal, 'USD') || 0;
  const deliveryFee = DELIVERY_METHODS.find(option => option.id === delivery)?.price || 0;
  const estimatedTax = 0;
  const paymentFee = 0;
  const total = subtotalDisplay + deliveryFee + estimatedTax + paymentFee;

  return (
    <div className="checkout-page">
      <SEO title="Checkout | IndieConverters" description="Complete your purchase." path="/checkout" />
      <div className="checkout-shell">
        <form className="checkout-main" onSubmit={handlePlaceOrder}>
          <nav className="checkout-steps" aria-label="Checkout progress">
            <Link to="/cart">Cart</Link>
            <span aria-hidden="true">›</span>
            <strong>Details</strong>
            <span aria-hidden="true">›</span>
            <span>Payment</span>
          </nav>

          <div className="checkout-title-row">
            <div>
              <span className="eyebrow">Stripe test mode</span>
              <h1>Complete your order</h1>
            </div>
            <span className="checkout-mode-pill">Secure Stripe checkout</span>
          </div>

          <section className="checkout-section">
            <h2>Contact details</h2>
            <div className="checkout-field-grid checkout-field-grid--2">
              <label>
                <span>First name*</span>
                <input name="firstName" placeholder="First name" autoComplete="given-name" />
              </label>
              <label>
                <span>Last name*</span>
                <input name="lastName" placeholder="Last name" autoComplete="family-name" />
              </label>
              <label>
                <span>Email*</span>
                <input name="email" type="email" defaultValue={user.email || ''} placeholder="you@example.com" autoComplete="email" />
              </label>
              <label>
                <span>Phone number</span>
                <input name="phone" placeholder="+44 7000 000000" autoComplete="tel" />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2>Delivery details</h2>
            <div className="checkout-delivery-options">
              {DELIVERY_METHODS.map(option => (
                <label className={`checkout-delivery-option${delivery === option.id ? ' checkout-delivery-option--active' : ''}`} key={option.id}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={option.id}
                    checked={delivery === option.id}
                    onChange={() => setDelivery(option.id)}
                  />
                  <span className="checkout-radio-dot" />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                  <b>{formatDisplayMoney(option.price, 'EUR')}</b>
                </label>
              ))}
            </div>
            <div className="checkout-field-grid checkout-field-grid--3">
              <label>
                <span>Country*</span>
                <input name="country" placeholder="United Kingdom" autoComplete="country-name" />
              </label>
              <label>
                <span>City*</span>
                <input name="city" placeholder="London" autoComplete="address-level2" />
              </label>
              <label>
                <span>Postcode*</span>
                <input name="postcode" placeholder="SW1A 1AA" autoComplete="postal-code" />
              </label>
            </div>
            <label className="checkout-textarea-label">
              <span>Order note</span>
              <textarea name="note" placeholder="Anything the author or Indie Converters team should know?" />
            </label>
          </section>

          <section className="checkout-section">
            <div className="checkout-section-head">
              <h2>Billing details</h2>
              <label className="checkout-checkline">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={event => setBillingSame(event.target.checked)}
                />
                <span>Same as delivery</span>
              </label>
            </div>

            {!billingSame && (
              <div className="checkout-field-grid checkout-field-grid--3">
                <label>
                  <span>Billing country*</span>
                  <input name="billingCountry" placeholder="United Kingdom" autoComplete="billing country-name" />
                </label>
                <label>
                  <span>Billing city*</span>
                  <input name="billingCity" placeholder="London" autoComplete="billing address-level2" />
                </label>
                <label>
                  <span>Billing postcode*</span>
                  <input name="billingPostcode" placeholder="SW1A 1AA" autoComplete="billing postal-code" />
                </label>
              </div>
            )}
          </section>

          <section className="checkout-section">
            <h2>Payment method</h2>
            <div className="checkout-payment-options">
              {PAYMENT_METHODS.map(option => (
                <label className={`checkout-payment-option${method === option.id ? ' checkout-payment-option--active' : ''}`} key={option.id}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={option.id}
                    checked={method === option.id}
                    onChange={() => setMethod(option.id)}
                  />
                  <span className="checkout-radio-dot" />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                  <span className="checkout-option-logos">
                    {option.logos.map(logo => <PaymentLogo key={logo} type={logo} />)}
                  </span>
                </label>
              ))}
            </div>

            <div className="checkout-accepted">
              <span>Accepted payment methods</span>
              <div>
                {ACCEPTED_PAYMENTS.map(type => <PaymentLogo key={type} type={type} />)}
              </div>
            </div>
          </section>

          <div className="checkout-sim-banner">
            <strong>Stripe test mode</strong>
            <span>You'll be redirected to Stripe to complete payment securely. No real charge will be made — use a Stripe test card (e.g. 4242 4242 4242 4242, any future expiry/CVC).</span>
          </div>

          <label className="checkout-terms">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={event => setTermsAccepted(event.target.checked)}
            />
            <span>I agree to the Terms. After payment, readers receive confirmation and access or fulfillment instructions where applicable.</span>
          </label>

          {error && <p className="checkout-error">{error}</p>}

          <button className="checkout-submit" disabled={placing || !termsAccepted}>
            {placing ? 'Redirecting to Stripe…' : `Continue to Stripe · ${formatDisplayMoney(total, 'EUR')}`}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Your Cart</h2>
          <div className="checkout-summary-items">
            {cart.items.map(item => (
              <div className="checkout-summary-row" key={item.id}>
                <div className="checkout-summary-cover-wrap">
                  {item.image_url
                    ? <img className="checkout-summary-cover" src={item.image_url} alt="" />
                    : <div className="checkout-summary-cover checkout-summary-cover--ph" />
                  }
                  <span>{item.quantity}</span>
                </div>
                <div className="checkout-summary-info">
                  <span className="checkout-summary-title">{item.title}</span>
                  <span className="checkout-summary-qty">Direct-sale book</span>
                </div>
                <span className="checkout-summary-price">{formatDisplayMoney(Number(item.price) * item.quantity, 'USD')}</span>
              </div>
            ))}
          </div>

          <label className="checkout-discount">
            <span aria-hidden="true">%</span>
            <input value={discountCode} onChange={event => setDiscountCode(event.target.value)} placeholder="Discount code" />
            <button type="button" onClick={handleApplyDiscount}>Apply</button>
          </label>
          {discountStatus && <p className={`checkout-discount-status${discountStatus.includes('accepted') ? ' checkout-discount-status--ok' : ''}`}>{discountStatus}</p>}

          <div className="checkout-totals">
            <div>
              <span>Subtotal</span>
              <strong>{formatDisplayMoney(cart.subtotal, 'USD')}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>{formatDisplayMoney(deliveryFee, 'EUR')}</strong>
            </div>
            <div>
              <span>Estimated taxes</span>
              <strong>{formatDisplayMoney(estimatedTax, 'EUR')}</strong>
            </div>
            <div>
              <span>Payment fee</span>
              <strong>{formatDisplayMoney(paymentFee, 'EUR')}</strong>
            </div>
            <div className="checkout-total-row">
              <span>Total</span>
              <strong>{formatDisplayMoney(total, 'EUR')}</strong>
            </div>
          </div>

          <button className="checkout-summary-submit" onClick={handlePlaceOrder} disabled={placing || !termsAccepted}>
            {placing ? 'Placing order…' : 'Continue to Payment'}
          </button>
        </aside>
      </div>
    </div>
  );
}
