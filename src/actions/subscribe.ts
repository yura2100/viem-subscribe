import type {
  AbiEvent,
  BlockNumber,
  Chain,
  Client,
  GetLogsErrorType,
  GetLogsParameters,
  GetLogsReturnType,
  Transport,
} from "viem";
import { getLogs } from "viem/actions";
import {
  createStorageId,
  type Storage,
  type StorageStrategy,
} from "../storage/storage.js";
import { getInitialStorageLog } from "./getInitialStorageLog.js";
import { compareStorageLog } from "../storage/storage-log.js";
import { wait } from "../utils/wait.js";

export type PollingStrategy = "before" | "after";

export type SubscribeParameters<
  abiEvent extends AbiEvent | undefined = undefined,
  abiEvents extends
    | readonly AbiEvent[]
    | readonly unknown[]
    | undefined = abiEvent extends AbiEvent ? [abiEvent] : undefined,
  strict extends boolean | undefined = undefined,
> = Omit<
  GetLogsParameters<abiEvent, abiEvents, strict>,
  "fromBlock" | "toBlock" | "blockHash"
> & {
  storage: Storage;
  /**
   * @default "after"
   */
  storageStrategy?: StorageStrategy | undefined;
  fromBlock?: BlockNumber | undefined;
  toBlock?: BlockNumber | undefined;
  /**
   * @default "after"
   */
  pollingStrategy?: PollingStrategy | undefined;
  /**
   * @default 10_000
   */
  pollingInterval?: number | undefined;
};

export type SubscribeYieldType<
  abiEvent extends AbiEvent | undefined = undefined,
  abiEvents extends
    | readonly AbiEvent[]
    | readonly unknown[]
    | undefined = abiEvent extends AbiEvent ? [abiEvent] : undefined,
  strict extends boolean | undefined = undefined,
> = GetLogsReturnType<abiEvent, abiEvents, strict>[number];

export type SubscribeErrorType = GetLogsErrorType;

/**
 * Subscribes and yields emitted [Event Logs](https://viem.sh/docs/glossary/terms#event-log).
 *
 * @param client Client to use
 * @param parameters Parameters {@link SubscribeParameters}
 * @yields Event log {@link SubscribeYieldType}
 * @throws {SubscribeErrorType}
 *
 * @example
 * import { createPublicClient, http, parseAbiItem } from "viem";
 * import { mainnet } from "viem/chains";
 * import { subscribe } from "viem-subscribe";
 *
 * const client = createPublicClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const storage = createStorage();
 * const logs = subscribe(client, { storage });
 *
 * for await (const log of logs) {
 *   console.log(log);
 * }
 */
export async function* subscribe<
  chain extends Chain | undefined,
  const abiEvent extends AbiEvent | undefined = undefined,
  const abiEvents extends
    | readonly AbiEvent[]
    | readonly unknown[]
    | undefined = abiEvent extends AbiEvent ? [abiEvent] : undefined,
  strict extends boolean | undefined = undefined,
>(
  client: Client<Transport, chain>,
  {
    storageStrategy: _storageStrategy,
    storage,
    fromBlock,
    toBlock,
    pollingStrategy: _pollingStrategy,
    pollingInterval: _pollingInterval,
    ...args
  }: SubscribeParameters<abiEvent, abiEvents, strict>,
): AsyncGenerator<
  SubscribeYieldType<abiEvent, abiEvents, strict>,
  void,
  SubscribeErrorType
> {
  const storageId = createStorageId({
    ...args,
    fromBlock,
    toBlock,
    chain: client.chain,
  });
  const storageStrategy = _storageStrategy ?? "after";
  const pollingStrategy = _pollingStrategy ?? "after";
  const pollingInterval = _pollingInterval ?? 10_000;

  let lastLog = await getInitialStorageLog(client, {
    ...args,
    fromBlock,
    toBlock,
    storage,
  });

  while (true) {
    if (pollingStrategy === "before") {
      await wait(pollingInterval);
    }

    const logs: GetLogsReturnType<abiEvent, abiEvents, strict> = await getLogs(
      client,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      { ...args, fromBlock: lastLog.blockNumber } as any,
    );
    const sortedLogs = logs
      .filter((log) => compareStorageLog(lastLog, log) > 0)
      .sort(compareStorageLog);
    for (const log of sortedLogs) {
      const storageLog = {
        blockNumber: log.blockNumber,
        transactionIndex: log.transactionIndex,
        logIndex: log.logIndex,
      };

      if (storageStrategy === "before") {
        await storage(storageId).upsertLog(storageLog);
      }

      lastLog = storageLog;
      yield log;

      if (storageStrategy === "after") {
        await storage(storageId).upsertLog(storageLog);
      }
    }

    if (pollingStrategy === "after") {
      await wait(pollingInterval);
    }
  }
}
