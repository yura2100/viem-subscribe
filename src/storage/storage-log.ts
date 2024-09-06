export type StorageLog = {
  blockNumber: bigint;
  transactionIndex: number;
  logIndex: number;
};

export function compareStorageLog<storageLog extends StorageLog>(
  a: storageLog,
  b: storageLog,
): number {
  return (
    Number(a.blockNumber - b.blockNumber) ||
    a.transactionIndex - b.transactionIndex ||
    a.logIndex - b.logIndex
  );
}
