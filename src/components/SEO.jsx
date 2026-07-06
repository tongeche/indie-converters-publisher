const SITE_URL = 'https://indieconverters.uk';

// React 19 hoists <title>/<meta>/<link> rendered anywhere in the tree into
// document.head automatically, so this needs no provider/portal setup.
export default function SEO({ title, description, path = '', image }) {
  const url = `${SITE_URL}${path}`;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
    </>
  );
}
