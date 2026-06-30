export default function BookCover({ title, author, colorClass = 'cover-clay', coverUrl, size = 'md' }) {
  const sizeStyle = size === 'lg'
    ? { fontSize: '1.1rem' }
    : size === 'sm'
    ? { fontSize: '0.8rem' }
    : {};

  if (coverUrl) {
    const imgStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      borderRadius: 'inherit',
    };
    return (
      <div className={`book-cover book-cover--photo ${colorClass}`} style={sizeStyle}>
        <img src={coverUrl} alt={`Cover of ${title}`} style={imgStyle} loading="lazy" />
      </div>
    );
  }

  return (
    <div className={`book-cover ${colorClass}`} style={sizeStyle}>
      <span className="cover-dot">··</span>
      <div className="cover-title">{title}</div>
      <div className="cover-rule" />
      <div className="cover-author">{author}</div>
    </div>
  );
}
