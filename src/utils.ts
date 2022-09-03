export function timeout(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve(true);
    }, ms);
  })
}

export function parseTimestamp( timestamp: string ) {
  return timestamp.split(".")[0];
}
