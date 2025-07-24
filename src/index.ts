export function sync(conditionFn: () => boolean, callback: Function, intervalMs: number = 50) {
    const interval = setInterval(() => {
        if (conditionFn()) {
            clearInterval(interval);
            callback();
        }
    }, intervalMs);
}

export function async(conditionFn: () => boolean, callback: Function, intervalMs: number = 50): Promise<boolean> {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (conditionFn()) {
                clearInterval(interval);
                callback();
                resolve(true);
            }
        }, intervalMs);
    });
}