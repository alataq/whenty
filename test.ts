// Import all exports from index.ts under the namespace 'when' (lowercase)
import * as when from './src/index';

// --- ANSI Escape Codes for Colors ---
const Colors = {
    Reset: "\x1b[0m",
    FgGreen: "\x1b[32m",
    FgRed: "\x1b[31m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
};

let passedTests = 0;
let failedTests = 0;

/**
 * A simple assertion function for manual testing with colorized output.
 * @param condition The condition to check.
 * @param message The message to display if the condition is false.
 */
function assert(condition: boolean, message: string) {
    if (condition) {
        console.log(`${Colors.FgGreen}✅ PASS: ${message}${Colors.Reset}`);
        passedTests++;
    } else {
        console.error(`${Colors.FgRed}❌ FAIL: ${message}${Colors.Reset}`);
        failedTests++;
    }
}

/**
 * A simple mock callback function that tracks if it was called and how many times.
 */
function createMockCallback() {
    let callCount = 0;
    const mock = (...args: any[]) => {
        callCount++;
        // console.log(`  Mock callback called. Current count: ${callCount}`); // Optional: for detailed debugging
    };
    mock.wasCalled = () => callCount > 0;
    mock.getCallCount = () => callCount;
    mock.reset = () => { callCount = 0; };
    return mock;
}

/**
 * Runs all test cases.
 */
async function runTests() {
    console.log(`${Colors.FgBlue}${Colors.Bright}--- Starting when.js Test Suite ---${Colors.Reset}\n`);

    // --- Test Cases for when.sync ---
    console.log(`${Colors.FgYellow}## Testing when.sync()${Colors.Reset}`);
    console.log(`${Colors.Dim}------------------------------------${Colors.Reset}`);

    // Test 1.1: sync function - condition becomes true after several checks
    console.log('\n--- Test 1.1: when.sync calls callback when condition becomes true ---');
    let syncTest1ConditionMet = false;
    const syncTest1Callback = createMockCallback();
    let syncTest1Counter = 0;

    when.sync(
        () => {
            syncTest1Counter++;
            if (syncTest1Counter >= 3) {
                syncTest1ConditionMet = true;
            }
            return syncTest1ConditionMet;
        },
        syncTest1Callback,
        10 // intervalMs
    );

    // Give it enough time for the condition to be met (3 checks * 10ms = 30ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 100));
    assert(syncTest1Callback.wasCalled(), 'Test 1.1: syncTest1Callback was called');
    assert(syncTest1Callback.getCallCount() === 1, 'Test 1.1: syncTest1Callback was called exactly once');


    // Test 1.2: sync function - condition is true immediately
    console.log('\n--- Test 1.2: when.sync calls callback immediately if condition is true ---');
    const syncTest2Callback = createMockCallback();
    when.sync(
        () => true,
        syncTest2Callback,
        10 // intervalMs
    );

    await new Promise(resolve => setTimeout(resolve, 20)); // Short delay to confirm immediate call
    assert(syncTest2Callback.wasCalled(), 'Test 1.2: syncTest2Callback was called immediately');
    assert(syncTest2Callback.getCallCount() === 1, 'Test 1.2: syncTest2Callback was called exactly once');


    // Test 1.3: sync function - condition never becomes true
    console.log('\n--- Test 1.3: when.sync does not call callback if condition never becomes true (will hang if not forced exit) ---');
    const syncTest3Callback = createMockCallback();
    // IMPORTANT: This call creates an interval that will run indefinitely in the background
    // because your current `when.sync` does not have a timeout mechanism and `conditionFn()` always returns false.
    when.sync(
        () => false, // This condition will never be true
        syncTest3Callback,
        10 // intervalMs
    );

    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for a reasonable period for assertion
    assert(!syncTest3Callback.wasCalled(), 'Test 1.3: syncTest3Callback was NOT called');
    assert(syncTest3Callback.getCallCount() === 0, 'Test 1.3: syncTest3Callback was called zero times');


    // --- Test Cases for when.async ---
    console.log(`\n${Colors.FgYellow}## Testing when.async()${Colors.Reset}`);
    console.log(`${Colors.Dim}------------------------------------${Colors.Reset}`);

    // Test 2.1: async function - condition becomes true and promise resolves
    console.log('\n--- Test 2.1: when.async calls callback and resolves promise when condition is met ---');
    const asyncTest1Callback = createMockCallback();
    let asyncTest1Counter = 0;
    let asyncTest1ConditionMet = false;

    try {
        const result = await when.async(
            () => {
                asyncTest1Counter++;
                if (asyncTest1Counter >= 2) {
                    asyncTest1ConditionMet = true;
                }
                return asyncTest1ConditionMet;
            },
            asyncTest1Callback,
            10 // intervalMs
        );

        assert(asyncTest1Callback.wasCalled(), 'Test 2.1: asyncTest1Callback was called');
        assert(asyncTest1Callback.getCallCount() === 1, 'Test 2.1: asyncTest1Callback was called exactly once');
        assert(result === true, 'Test 2.1: async promise resolved to true');
    } catch (error: any) {
        assert(false, `Test 2.1: async failed with error: ${error.message}`);
    }

    // Test 2.2: async function - condition is true immediately and promise resolves
    console.log('\n--- Test 2.2: when.async resolves immediately if condition is true ---');
    const asyncTest2Callback = createMockCallback();
    try {
        const result = await when.async(
            () => true,
            asyncTest2Callback,
            10 // intervalMs
        );

        assert(asyncTest2Callback.wasCalled(), 'Test 2.2: asyncTest2Callback was called immediately');
        assert(asyncTest2Callback.getCallCount() === 1, 'Test 2.2: asyncTest2Callback was called exactly once');
        assert(result === true, 'Test 2.2: async promise resolved to true immediately');
    } catch (error: any) {
        assert(false, `Test 2.2: async failed with error: ${error.message}`);
    }

    // Test 2.3: async function - condition never becomes true (promise will never resolve/reject on its own)
    console.log('\n--- Test 2.3: when.async does not resolve if condition never becomes true (will hang if not forced exit) ---');
    const asyncTest3Callback = createMockCallback();
    let promiseResolved = false;
    let promiseRejected = false;

    // IMPORTANT: This call creates an interval that will run indefinitely in the background
    // because your current `when.async` does not have a timeout mechanism
    // and `conditionFn()` always returns false. The promise will NEVER resolve or reject.
    const asyncPromise = when.async(
        () => false, // This condition will never be true
        asyncTest3Callback,
        10 // intervalMs
    )
    .then(() => { promiseResolved = true; })
    .catch(() => { promiseRejected = true; });

    // We wait for a short period to confirm it hasn't resolved/rejected YET
    await new Promise(resolve => setTimeout(resolve, 100));

    assert(!promiseResolved, 'Test 2.3: async promise was NOT resolved');
    assert(!promiseRejected, 'Test 2.3: async promise was NOT rejected'); // This remains true as it won't reject without a timeout
    assert(!asyncTest3Callback.wasCalled(), 'Test 2.3: asyncTest3Callback was NOT called');
    assert(asyncTest3Callback.getCallCount() === 0, 'Test 2.3: asyncTest3Callback was called zero times');


    // --- Test Summary ---
    console.log(`\n${Colors.FgBlue}${Colors.Bright}--- Test Summary ---${Colors.Reset}`);
    console.log(`${Colors.Dim}--------------------${Colors.Reset}`);
    if (failedTests === 0) {
        console.log(`${Colors.FgGreen}All ${passedTests} tests passed! 🎉${Colors.Reset}`);
    } else {
        console.log(`${Colors.FgGreen}${passedTests} tests passed, ${Colors.FgRed}${failedTests} tests failed.${Colors.Reset}`);
    }
    console.log(`${Colors.FgBlue}${Colors.Bright}--- Test Suite Finished ---${Colors.Reset}\n`);

    // Crucially, force the process to exit to prevent hanging due to
    // `setInterval` calls that never naturally clear (e.g., Test 1.3 and 2.3).
    process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
    console.error(`${Colors.FgRed}An unexpected error occurred during testing:`, error, Colors.Reset);
    failedTests++;
    process.exit(1); // Exit with error code if an uncaught error occurs
});