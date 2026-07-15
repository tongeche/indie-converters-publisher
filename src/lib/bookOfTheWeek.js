export function pickBookOfTheWeek(books, { preferDirectSale = true } = {}) {
  const completeBooks = books.filter(book => book.coverUrl && book.blurb);
  const coveredBooks = books.filter(book => book.coverUrl);
  const eligibleBooks = completeBooks.length ? completeBooks : coveredBooks.length ? coveredBooks : books;
  if (!eligibleBooks.length) return null;

  const directSaleBooks = preferDirectSale ? eligibleBooks.filter(book => book.isDirectSale) : [];
  const weeklyPool = directSaleBooks.length ? directSaleBooks : eligibleBooks;
  const now = new Date();
  const yearStart = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const weekNumber = Math.floor((today - yearStart) / 604800000);
  return weeklyPool[weekNumber % weeklyPool.length];
}
