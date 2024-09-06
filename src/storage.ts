import {
  type AbiEvent,
  type Address,
  type BlockNumber,
  type Chain,
  type Hex,
  keccak256,
  stringify,
  toHex,
} from "viem";
import type { StorageLog } from "./storage-log.js";

export type StorageStrategy = "before" | "after";

export type Storage = (storageId: Hex) => {
  getLog: () => Promise<StorageLog | null>;
  upsertLog: (log: StorageLog) => Promise<void>;
};

export type CreateStorageIdParameters = {
  address?: Address | Address[] | undefined;
  args?: readonly unknown[] | Record<string, unknown> | undefined;
  chain?: Chain | undefined;
  event?: AbiEvent | undefined;
  events?: readonly unknown[] | readonly AbiEvent[] | undefined;
  fromBlock?: BlockNumber | undefined;
  toBlock?: BlockNumber | undefined;
  strict?: boolean | undefined;
};

export type StorageId = Hex;

export function createStorageId(args: CreateStorageIdParameters): StorageId {
  const value = stringify(args);
  return keccak256(toHex(value));
}
