# tao-core-sdk-fe

TAO Frontend Core SDK

Core libraries of TAO.

## Install

```
npm i --save @oat-sa/tao-core-sdk
```

## Development

Available scripts in the project:

- `npm run build`: build for production into `dist` directory
- `npm run build:watch`: build for production into `dist` directory and watch for changes
- `npm run lint`: check syntax of code


- `HOST=<host> PORT=<port> npm run test <testname>`: run test suite
  - `HOST` (optional environment variable, default: 127.0.0.1): Test server listen host
  - `PORT` (optional environment variable): Test server listen port
  - `testname` (optional): Specific test to run. If it is not provided, all will be ran.
- `HOST=<host> PORT=<port> npm run test:keepAlive`: start test server
- `HOST=<host> PORT=<port> npm run test:dev` : start the test server and build watching (in background)
