export default function BookCover({ title, author, colorClass = 'cover-clay', size = 'md' }) {
  const sizeStyle = size === 'lg'
    ? { fontSize: '1.1rem' }
    : size === 'sm'
    ? { fontSize: '0.8rem' }
    : {};

  return (
    <div className={`book-cover ${colorClass}`} style={sizeStyle}>
      <span className="cover-dot">··</span>
      <div className="cover-title">{title}</div>
      <div className="cover-rule" />
      <div className="cover-author">{author}</div>
    </div>
  );
}
