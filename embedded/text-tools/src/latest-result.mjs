export function createLatestResult(onResult, onError = () => {}) {
  let version = 0;
  return {
    invalidate() { version++; },
    async run(operation) {
      const current = ++version;
      try {
        const result = await operation();
        if (current === version) onResult(result);
      } catch (error) {
        if (current === version) onError(error);
      }
    },
  };
}
