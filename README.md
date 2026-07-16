# React + Vite

## Human support handoff

The assistant's guided human-support chat flow submits to the Netlify function at `/api/support-request` and stores validated requests in `assistant_handoffs`. Apply the Supabase migrations before enabling human handoff in production.

Configure these server-side environment variables in Netlify:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPPORT_REQUEST_HASH_SECRET=
```

`SUPPORT_REQUEST_HASH_SECRET` is optional but recommended for generating abuse-prevention fingerprints. Keep the service-role key server-only; never expose it through a `VITE_*` variable.

This is an asynchronous email handoff, not live chat. Requests are queued in the Supabase `assistant_handoffs` table; assign someone to monitor that queue or connect it to the team's support inbox before launch.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
