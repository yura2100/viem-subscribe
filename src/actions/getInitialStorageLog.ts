import type { Chain, Client, Transport } from "viem";
import { getBlockNumber } from "viem/actions";
import {
  createStorageId,
  type CreateStorageIdParameters,
  type Storage,
} from "../storage/storage.js";
import type { StorageLog } from "../storage/storage-log.js";

export type GetInitialStorageLogParameters = CreateStorageIdParameters & {
  storage: Storage;
};

export type GetInitialStorageLogReturnType = StorageLog;

export async function getInitialStorageLog<chain extends Chain | undefined>(
  client: Client<Transport, chain>,
  { storage, ...args }: GetInitialStorageLogParameters,
): Promise<GetInitialStorageLogReturnType> {
  const storageId = createStorageId({ ...args, chain: client.chain });
  const [lastLog, lastBlock] = await Promise.all([
    storage(storageId).getLog(),
    getBlockNumber(client),
  ]);
  const fromBlock = args.fromBlock ?? lastBlock;
  if (!lastLog) {
    return { blockNumber: fromBlock, transactionIndex: 0, logIndex: 0 };
  }
  if (fromBlock > lastLog.blockNumber) {
    return { blockNumber: fromBlock, transactionIndex: 0, logIndex: 0 };
  }
  return lastLog;
}
