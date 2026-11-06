/** Supported execution modes for backfill windows. */
export type BackfillDelivery = "direct" | "queue";

/** Inclusive start and end dates for a backfill window. */
export interface BackfillWindow {
  endDate: string;
  startDate: string;
}

/** One queue message may carry many date windows to reduce write operations. */
export interface BackfillMessage {
  delivery?: BackfillDelivery;
  force?: boolean;
  windows: readonly BackfillWindow[];
}

/** Pre-batching queue payload shape (still accepted by the consumer). */
export interface LegacyBackfillMessage {
  endDate: string;
  force?: boolean;
  startDate: string;
}

/** A backfill window with its optional execution settings. */
export interface BackfillWindowJob extends BackfillWindow {
  delivery?: BackfillDelivery;
  force?: boolean;
}

const isLegacyBackfillMessage = (
  body: BackfillMessage | LegacyBackfillMessage
): body is LegacyBackfillMessage => !("windows" in body);

/**
 * Expands a batched or legacy queue message into individual window jobs.
 * @param body - Current or legacy backfill queue payload.
 * @returns Window jobs preserving delivery and force settings.
 */
export const expandBackfillMessage = (
  body: BackfillMessage | LegacyBackfillMessage
): BackfillWindowJob[] => {
  if (isLegacyBackfillMessage(body)) {
    return [
      {
        endDate: body.endDate,
        force: body.force,
        startDate: body.startDate,
      },
    ];
  }

  return body.windows.map((window) => ({
    delivery: body.delivery,
    endDate: window.endDate,
    force: body.force,
    startDate: window.startDate,
  }));
};

/**
 * Groups backfill windows into queue messages of bounded size.
 * @param windows - Windows to dispatch.
 * @param options - Delivery, force, and windows-per-message settings.
 * @returns Batched backfill queue messages.
 */
export const packBackfillQueueMessages = (
  windows: readonly BackfillWindow[],
  options: {
    delivery?: BackfillDelivery;
    force?: boolean;
    windowsPerMessage: number;
  }
): BackfillMessage[] => {
  const messages: BackfillMessage[] = [];
  const batchSize = Math.max(1, options.windowsPerMessage);

  for (let index = 0; index < windows.length; index += batchSize) {
    messages.push({
      delivery: options.delivery ?? "queue",
      force: options.force,
      windows: windows.slice(index, index + batchSize),
    });
  }

  return messages;
};
