/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type Payload = {
  transcript: Array<{
    id: string;
    role: "assistant" | "user" | "event" | "summary";
    name?: string;
    createdAt?: string;
    content?: string;
    attachments?: Array<{ type: "image"; url: string }>;
    payload?: unknown;
  }>;
};
