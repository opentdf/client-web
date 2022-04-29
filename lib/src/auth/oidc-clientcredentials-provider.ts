import { AuthProvider } from './auth';
import { IOIDCClientCredentialsProvider } from '../nanotdf/interfaces/OIDCInterface';
import VirtruOIDC from './virtru-oidc';

export class OIDCClientCredentialsProvider implements AuthProvider {
  oidcAuth: VirtruOIDC;

  constructor({
    organizationName,
    clientPubKey,
    clientId,
    clientSecret,
    oidcOrigin,
  }: IOIDCClientCredentialsProvider) {
    if (!organizationName || !clientId || !clientSecret) {
      throw new Error(
        'To use this nonbrowser-only provider you must supply organizationName/clientId/clientSecret'
      );
    }

    this.oidcAuth = new VirtruOIDC({
      organizationName,
      clientPubKey,
      clientId,
      clientSecret,
      oidcOrigin,
    });
  }

  async updateClientPublicKey(clientPubkey: string): Promise<void> {
    await this.oidcAuth.refreshTokenClaimsWithClientPubkeyIfNeeded(clientPubkey);
  }

  async authorization(): Promise<string> {
    const accessToken = await this.oidcAuth.getCurrentAccessToken();

    // NOTE It is generally best practice to keep headers under 8KB
    return `Bearer ${accessToken}`;
  }
}
