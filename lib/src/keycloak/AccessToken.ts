const qstringify = (obj: Record<string, string>) => new URLSearchParams(obj).toString();

export type AccessTokenConfig = {
  auth_mode?: 'browser' | 'credentials';
  realm: string;
  client_id: string;
  client_secret?: string;
  auth_server_url: string;
  virtru_client_pubkey?: string;
};

export type AccessTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export class AccessToken {
  config: AccessTokenConfig;

  request: typeof fetch;

  data?: AccessTokenResponse;

  baseUrl: string;

  virtru_client_pubkey?: string;

  extraHeaders: Record<string, string> = {};

  constructor(cfg: AccessTokenConfig, request?: typeof fetch) {
    if (!cfg.client_id) {
      throw new Error('A Keycloak client identifier is currently required for all auth mechanisms');
    }
    if (cfg.auth_mode === 'credentials' && !cfg.client_secret) {
      throw new Error('When using client credentials, both clientId and clientSecret are required');
    }
    this.config = cfg;
    this.request = request || fetch;
    this.baseUrl = cfg.auth_server_url;
    this.virtru_client_pubkey = cfg.virtru_client_pubkey;
    // For POST, always set
    // if (cfg.virtru_client_pubkey) {
    //   request.defaults.headers.post['X-VirtruPubKey'] = cfg.virtru_client_pubkey;
    // }
  }

  setVirtruPubkey(publicKey: string): void {
    this.virtru_client_pubkey = publicKey;
    // request.defaults.headers.post['X-VirtruPubKey'] = cfg.virtru_client_pubkey;
  }

  async info(accessToken: string): Promise<unknown> {
    // TODO make sure realm is uri encoded
    const url = `${this.baseUrl}/auth/realms/${encodeURIComponent(
      this.config.realm
    )}/protocol/openid-connect/userinfo`;
    const response = await this.request(url, {
      headers: {
        ...this.extraHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.json() as unknown;
  }

  async forceRefresh(): Promise<string> {
    // If no token provided, force refresh of cached tokens
    // Auth mode can be `credentials` -> implies that we should have clientID and clientSecret
    // Auth mode can be `browser` -> implies that we're in a browser context, and only have refreshToken
    // Other modes TBD, but that covers the basics
    if (this.config.auth_mode === 'credentials') {
      this.data = undefined;
      return this.get();
    }

    if (typeof this.data == 'object' && this.data?.refresh_token) {
      return this.refresh(this.data.refresh_token);
    }

    throw new Error(
      "forceRefresh refreshes a preexisting cached tokenset, and none exists. Try 'refresh(myToken)' instead."
    );
  }

  async refresh(refreshToken: string): Promise<string> {
    const cfg = this.config;

    const args = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      ...(cfg.client_id && { client_id: cfg.client_id }),
      ...(cfg.auth_mode === 'credentials' &&
        cfg.client_secret && { client_secret: cfg.client_secret }),
    };

    const url = `${this.baseUrl}/auth/realms/${encodeURIComponent(
      cfg.realm
    )}/protocol/openid-connect/token`;
    const response = await this.request(url, {
      method: 'POST',
      body: qstringify(args),
    });

    this.data = await response.json();
    return this.data?.access_token as string;
  }

  async exchangeJwt(jwtToken: string): Promise<string> {
    const cfg = this.config;
    const url = `${this.baseUrl}/auth/realms/${encodeURIComponent(
      cfg.realm
    )}/protocol/openid-connect/token`;

    const args = {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: jwtToken,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      ...(cfg.client_id && { audience: cfg.client_id, client_id: cfg.client_id }),
      ...(cfg.auth_mode === 'credentials' &&
        cfg.client_secret && { client_secret: cfg.client_secret }),
    };

    const response = await this.request(url, {
      method: 'POST',
      body: qstringify(args),
    });
    this.data = await response.json();
    return this.data?.access_token as string;
  }

  async get(): Promise<string> {
    const cfg = this.config;

    if (!this.data?.access_token) {
      if (!cfg.client_id || !cfg.client_secret) {
        throw new Error(`to call get(), either client credentials must be provided in the config,
                          or a cached tokenset from a token refresh from a previous call to refresh() must exist`);
      }
      const url = `${this.baseUrl}/auth/realms/${encodeURIComponent(
        cfg.realm
      )}/protocol/openid-connect/token`;
      const response = await this.request(url, {
        method: 'POST',
        body: qstringify({
          grant_type: 'client_credentials',
          client_id: cfg.client_id,
          client_secret: cfg.client_secret,
        }),
      });
      this.data = await response.json();

      return this.data?.access_token as string;
    }
    try {
      await this.info(this.data.access_token);
      return this.data.access_token;
    } catch (err) {
      try {
        await this.refresh(this.data.refresh_token);
        return this.data.access_token;
      } catch (refreshErr) {
        delete this.data;
        //TODO PLAT-1142
        //Since this is a recursive call - we should add backoffs and retry limits here
        // (and to HTTP calls in this library generally)
        return this.get();
      }
    }
  }
}
