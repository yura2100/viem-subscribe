import type { Log } from "viem";

export type StorageLog = Pick<
  Log<bigint, number, false>,
  "blockNumber" | "transactionIndex" | "logIndex"
>;

export function compareStorageLog(a: StorageLog, b: StorageLog): number {
  return (
    Number(a.blockNumber - b.blockNumber) ||
    a.transactionIndex - b.transactionIndex ||
    a.logIndex - b.logIndex
  );
}

export function extractStorageLog(log: Log<bigint, number, false>): StorageLog {
  return {
    blockNumber: log.blockNumber,
    transactionIndex: log.transactionIndex,
    logIndex: log.logIndex,
  };
}
