import { IntegrationPackage } from "@botpress/sdk";


import integration_webchat from "../bp_modules/integration_webchat";
import integration_chat from "../bp_modules/integration_chat";

export const IntegrationDefinitions = {
 "webchat": integration_webchat,
"chat": integration_chat
} as Record<string, IntegrationPackage>;