# UniPass Wallet Snap

An example for UniPass Wallet to integrat with [Metamask Snaps](https://docs.metamask.io/guide/snaps.html#what-is-snaps).

>You can try online demo: https://up-wallet-snaps.vercel.app/


There are separate projects for the frontend and snaps.

## Project layout

```
        
└───typescript
    │   package.json        Root project metadata.
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
yarn install
```

## Build the code

Build all packages:

```bash
yarn run build
```

## Run in development

Run the application in development mode (with live reload enabled in the backend):

```bash
yarn run start:dev
```

Point your browser at http://localhost:1901 to see the frontend.


