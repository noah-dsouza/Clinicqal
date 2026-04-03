/* eslint-disable */
/* tslint:disable */
// This file is generated. Do not edit it manually.
import * as conversation from "./conversation/index";
export * as conversation from "./conversation/index";
import * as state from "./state/index";
export * as state from "./state/index";
import * as botState from "./botState/index";
export * as botState from "./botState/index";
import * as userState from "./userState/index";
export * as userState from "./userState/index";
import * as workflowState from "./workflowState/index";
export * as workflowState from "./workflowState/index";
import * as workflowSteps from "./workflowSteps/index";
export * as workflowSteps from "./workflowSteps/index";
import * as dsData from "./dsData/index";
export * as dsData from "./dsData/index";

export type States = {
  "conversation": conversation.Conversation;
  "state": state.State;
  "botState": botState.BotState;
  "userState": userState.UserState;
  "workflowState": workflowState.WorkflowState;
  "workflowSteps": workflowSteps.WorkflowSteps;
  "dsData": dsData.DsData;
}
