# UniPass Wallet Snap

An example for UniPass Wallet to integrated with [Metamask Snaps](https://docs.metamask.io/guide/snaps.html#what-is-snaps).

>You can try online demo: https://up-wallet-snaps.vercel.app/


There are separate projects for the frontend and snaps.

## Project layout

```
        
└───typescript
    │   package.json        Root project metadata.
    │    pnpm-lock.yaml      Dependencies lockfile.
    │   pnpm-workspace.yaml Pnpm workspace configuration.
    │ 
    └───packages        
        └───up-frontend      The Poc of Unipass Wallet which connecting snaps of Metamask
        |    └───src            
        └───up-snap          A sub-package for snaps to be installed in Metamask 
            └───src            
```

## Setup

Install dependencies:

```bash
pnpm install
```

## Build the code

Build all packages:

```bash
pnpm run build
```

## Clean generated files

```bash
pnpm run clean
```

## Run in development

Run the application in development mode (with live reload enabled in the backend):

```bash
pnpm run start:dev
```

Point your browser at http://localhost:1903 to see the frontend.


