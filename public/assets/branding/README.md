# Branding Assets

Drop the primary IndieConverters logos, wordmarks, and color reference swatches into this directory.

Recommended structure:

```
public/assets/branding/
  logo-light.svg
  logo-dark.svg
  palette.json
```

Anything inside `public/` is automatically served by Next.js, so you can reference files with `/assets/branding/logo-light.svg` inside components (e.g., header hero lockup). Once the final logo is added we can update the header + Tailwind palette to match the official colors.
