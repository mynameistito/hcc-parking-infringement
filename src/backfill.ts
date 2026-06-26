export type BackfillDelivery = "direct" | "queue";

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

export interface BackfillWindowJob extends BackfillWindow {
  delivery?: BackfillDelivery;
  force?: boolean;
}

export const isLegacyBackfillMessage = (
  body: BackfillMessage | LegacyBackfillMessage
): body is LegacyBackfillMessage => !("windows" in body);

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
