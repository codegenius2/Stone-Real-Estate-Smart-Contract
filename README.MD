# Stone Real Estate Smart Contract

This repo contains all the smart contracts related to the Stone Real Estate Tokenization plateform.

## Test

### Install dependencies

Open your terminal and run :

```sh
$ npm i
```

### Using Truffle develop

run :

```sh
$ truffle develop
```

Open another terminal and run :

```sh
$ truffle test
```

### Using ganache

To install Ganache globally, run :

```sh
$ npm install ganache --global
```

Once installed globally, you can start ganache right from your command line :

```sh
ganache
```

Then open the `truffle-config.js` file, look for :

```js
development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 9545, // 9545 for truffle develop // 8545 Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
```

replace with :

```js
development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // 9545 for truffle develop // 8545 Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },
```

Open another terminal and run :

```sh
$ truffle test
```
