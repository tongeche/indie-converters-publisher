import './ChatAvatar.css';

export default function ChatAvatar({ variant = 'jane', name = '', photoUrl = '', className = '' }) {
  if (variant === 'user') {
    const initials = String(name || 'You').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    return <span className={`chat-avatar chat-avatar--user ${className}`} aria-label={name || 'You'}>{photoUrl ? <img src={photoUrl} alt="" /> : <strong>{initials || 'Y'}</strong>}</span>;
  }
  const alex = variant === 'alex';
  return (
    <span className={`chat-avatar chat-avatar--${variant} ${className}`} aria-label={alex ? 'Alex' : 'Jane'}>
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs><linearGradient id={`avatar-bg-${variant}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={alex ? '#d9ccff' : '#f4c6a8'} /><stop offset="1" stopColor={alex ? '#7651d3' : '#b87056'} /></linearGradient></defs>
        <rect width="48" height="48" rx="24" fill={`url(#avatar-bg-${variant})`} />
        <path d="M10 48c1-10 6-15 14-15s13 5 14 15" fill={alex ? '#241651' : '#55264b'} />
        <ellipse cx="24" cy="23" rx="10" ry="12" fill={alex ? '#9b684d' : '#7a4938'} />
        {alex ? <path d="M14 22c0-10 5-15 12-13 6 1 9 7 8 14-3-2-5-5-6-8-3 4-8 6-14 7Z" fill="#211a2b" /> : <path d="M13 22c-2-9 4-16 12-15 8 0 12 8 9 17-2-4-4-7-8-9-2 4-7 6-13 7Z" fill="#33202c" />}
        <circle cx="20.5" cy="24" r="1" fill="#201629" /><circle cx="27.5" cy="24" r="1" fill="#201629" />
        <path d="M21 29c2 1.5 4 1.5 6 0" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <i aria-hidden="true">.in</i>
    </span>
  );
}
