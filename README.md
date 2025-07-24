# Whenty

Execute a function when a condition becomes true. A lightweight, zero-dependency library for polling a condition and executing a callback once it's met.

## Installation

```
npm install whenty
```

## Usage

Whenty exports two main functions: `sync` and `async`.

### `sync(condition, callback, intervalMs, timeoutMs)`

The `sync` function is best for fire-and-forget scenarios where you don't need to wait for the result. It polls the `condition` and executes the `callback` once true.

**Parameters:**

* `condition`: A function that returns a boolean (`() => boolean`). This function is polled repeatedly.

* `callback`: A function to execute once the `condition` returns `true` (`() => void`).

* `intervalMs` (optional): The time in milliseconds between each poll of the `condition` function. Defaults to `50`ms.

* `timeoutMs` (optional): The maximum time in milliseconds to wait for the condition to become true. If the timeout is reached and the condition is still `false`, polling stops and the callback is **not** executed. Defaults to `0` (no timeout, polls indefinitely).

**Example: Basic Usage**

```typescript
import * as when from "whenty";
// or
const when = require("whenty")

let counter = 0;

// Wait until `counter` is 3, then log a message.
when.sync(() => counter === 3, () => {
  console.log('Condition met! Counter is 3.');
});

// This will increment `counter` every 500ms, triggering the callback.
setInterval(() => {
  counter++;
  console.log(`Counter: ${counter}`);
}, 500);

/*
Expected output (approximately):
Counter: 1
Counter: 2
Counter: 3
Condition met! Counter is 3.
(Polling for `when.sync` stops here)
*/
```

**Example: Using `intervalMs` and `timeoutMs`**

```typescript
import * as when from "whenty";

let dataLoaded = false;

// Simulate a very slow data load that takes 5 seconds
setTimeout(() => {
  dataLoaded = true;
  console.log('Data is finally loaded (after 5s).');
}, 5000);

console.log('Started waiting for data, with a 2-second timeout...');

// Poll every 100ms, but give up after 2 seconds
when.sync(
  () => dataLoaded,
  () => {
    console.log('Data load condition met!');
  },
  100,  // Check every 100 milliseconds
  2000  // Timeout after 2 seconds
);

/*
Expected output (approximately):
Started waiting for data, with a 2-second timeout...
(2 seconds pass)
Data is finally loaded (after 5s).
(Note: "Data load condition met!" will NOT be printed because the timeout was hit before dataLoaded became true.
The `when.sync` operation stopped after 2 seconds.)
*/
```

### `async(condition, callback, intervalMs, timeoutMs)`

The `async` function returns a `Promise<boolean>` that resolves to `true` after the callback is executed. If a `timeoutMs` is provided and the condition is not met within that time, the Promise will `reject` with an error. This is useful when you need to use `await` to ensure the task is complete before continuing.

**Parameters:**

* `condition`: A function that returns a boolean (`() => boolean`).

* `callback`: A function to execute once the `condition` returns `true` (`() => void`).

* `intervalMs` (optional): The time in milliseconds between each poll of the `condition` function. Defaults to `50`ms.

* `timeoutMs` (optional): The maximum time in milliseconds to wait for the condition to become true. If the timeout is reached and the condition is still `false`, the Promise `rejects` with an error. Defaults to `5000`ms (5 seconds).

**Example: Basic Usage with `await`**

```typescript
import * as when from "whenty";
// or
const when = require("whenty")

let dataReady = false;

async function fetchData() {
  console.log('Fetching data...');
  // Simulate data fetching that takes 1.5 seconds
  await new Promise(resolve => setTimeout(() => {
    dataReady = true;
    resolve(true);
  }, 1500));
  console.log('Data fetched!');
}

async function processDataWhenReady() {
  console.log('Waiting for data to be ready...');
  await when.async(() => dataReady, () => {
    console.log('Data is ready! Processing...');
  });
  console.log('Finished processing data.');
}

fetchData();
processDataWhenReady();

/*
Expected output:
Fetching data...
Waiting for data to be ready...
(1.5 seconds pass)
Data fetched!
Data is ready! Processing...
Finished processing data.
*/
```

**Example: Handling Timeout in `async`**

```typescript
import * as when from "whenty";

let isServiceUp = false;

async function connectToService() {
  console.log('Attempting to connect to service...');
  try {
    // Try to connect, but give up after 1 second (1000ms)
    await when.async(
      () => isServiceUp,
      () => {
        console.log('Service is up and running!');
      },
      50,   // Check every 50ms
      1000  // Timeout after 1 second
    );
    console.log('Successfully connected to service.');
  } catch (error: any) {
    console.error(`Failed to connect: ${error.message}`);
  }
}

connectToService();

// Simulate service coming up eventually (after 2 seconds)
setTimeout(() => {
  isServiceUp = true;
  console.log('Service actually came online now.');
}, 2000);

/*
Expected output:
Attempting to connect to service...
(1 second passes)
Failed to connect: Condition not met within 1000ms.
Service actually came online now.
*/
```

## How It Works

Both `sync` and `async` functions internally use `setInterval` to repeatedly call the provided `condition` function at the specified `intervalMs`.

* **Condition Met**: Once the `condition` function returns `true`, the `setInterval` is immediately cleared (stopping the polling), and the `callback` function is executed. For `async`, the returned Promise also resolves to `true`.

* **Timeout**: If a `timeoutMs` is provided and the `condition` does not become `true` within that time, a `setTimeout` will trigger. This `setTimeout` will clear the `setInterval` to prevent indefinite polling. For `async`, the returned Promise `rejects` with an `Error` indicating the timeout. For `sync`, the polling simply stops, and the callback is not executed.

This design ensures efficient resource usage by clearing timers as soon as the waiting is over or the maximum wait time is exceeded.

## License

ISC

## Contributing

Contributions are welcome! If you find a bug, have a feature request, or want to improve the documentation, please feel free to open an issue or submit a pull request.

## Tests

To run the test suite for Whenty, clone the repository and ensure you have [Bun](https://bun.sh/) installed. Then, execute the following commands in the project root:

```bash
bun install
bun test
```