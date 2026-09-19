import { createServerFn } from "@tanstack/react-start";

export type EnvWalletConfig = {
  configured: boolean;
  tmn_key_id: string;
  msisdn: string;
  login_token: string;
  tmn_id: string;
  device_id: string;
  pin: string;
  proxy_ip: string;
  proxy_username: string;
  proxy_password: string;
};

/**
 * Exposes TrueMoney credentials from the server environment (platform secrets
 * delivered to /run/base44/app.env) to the client store so the wallet can
 * auto-connect on startup. Consistent with the existing addAccount flow which
 * already stores credentials client-side in the persisted zustand store.
 */
export const getEnvWalletConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<EnvWalletConfig> => {
    const tmn_key_id = process.env.TMN_KEY_ID ?? "";
    const msisdn = process.env.TMN_MSISDN ?? "";
    const login_token = process.env.TMN_LOGIN_TOKEN ?? "";
    const tmn_id = process.env.TMN_ID ?? "";
    return {
      configured: Boolean(tmn_key_id && msisdn && login_token && tmn_id),
      tmn_key_id,
      msisdn,
      login_token,
      tmn_id,
      device_id: process.env.TMN_DEVICE_ID ?? "",
      pin: process.env.TMN_PIN ?? "",
      proxy_ip: process.env.TMN_PROXY_IP ?? "",
      proxy_username: process.env.TMN_PROXY_USERNAME ?? "",
      proxy_password: process.env.TMN_PROXY_PASSWORD ?? "",
    };
  },
);
