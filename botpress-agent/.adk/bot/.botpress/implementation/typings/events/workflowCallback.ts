/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.

export type WorkflowCallback = {
  workflow: string;
  workflowId: string;
  target: { conversationId: string } | { workflowId: string };
  status: "completed" | "failed" | "canceled" | "timed_out";
  output?: any;
  error?: string;
};
