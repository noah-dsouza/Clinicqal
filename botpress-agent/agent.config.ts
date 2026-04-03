import { z, defineConfig } from '@botpress/runtime';

export default defineConfig({
  name: 'cliniq-health-assistant',
  description: 'ClinIQ AI Health Assistant — personalized health insights from your digital twin',

  bot: {
    state: z.object({}),
  },

  user: {
    state: z.object({}),
  },

  dependencies: {
    integrations: {
      webchat: {
        version: 'webchat@latest',
        enabled: true,
      },
      chat: {
        version: 'chat@latest',
        enabled: true,
      },
    },
  },
});
