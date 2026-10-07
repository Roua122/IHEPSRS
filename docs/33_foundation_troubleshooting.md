# Foundation Troubleshooting

## pnpm command unavailable
If Corepack cannot create shims under `C:\Program Files\nodejs`, use the already tested approach:

```powershell
npm install -g pnpm@12.8.1
pnpm --version
```

## Docker error
If `pnpm db:up` reports it cannot connect to `dockerDesktopLinuxEngine`:

1. Open Docker Desktop.
2. Wait until Docker Engine is running.
3. Verify:

```powershell
docker info
```

4. Then:

```powershell
pnpm db:up
```

## Recommended verification order

```powershell
pnpm install
pnpm typecheck
pnpm build
docker info
pnpm db:up
pnpm dev
```

Keep `pnpm dev` running in its terminal. Use a second terminal for Git or other commands.
