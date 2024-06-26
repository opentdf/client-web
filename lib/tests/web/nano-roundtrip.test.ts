import { expect } from '@esm-bundle/chai';
import { type AuthProvider, HttpRequest, withHeaders } from '../../src/auth/auth.js';

import { NanoTDFClient } from '../../src/index.js';

const authProvider = <AuthProvider>{
  updateClientPublicKey: async () => {
    /* mocked function */
  },
  withCreds: async (req: HttpRequest): Promise<HttpRequest> =>
    withHeaders(req, {
      Authorization:
        'Bearer dummy-auth-token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ0ZGYiLCJzdWIiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMn0.XFu4sQxAd6n-b7urqTdQ-I9zKqKSQtC04unHsMSpJjc',
    }),
};

const kasEndpoint = 'http://localhost:3000';

describe('Local roundtrip Tests', () => {
  it('roundtrip string', async () => {
    const client = new NanoTDFClient({ authProvider, kasEndpoint });
    const cipherText = await client.encrypt('hello world');
    const client2 = new NanoTDFClient({ authProvider, kasEndpoint });
    const actual = await client2.decrypt(cipherText);
    expect(new TextDecoder().decode(actual)).to.be.equal('hello world');
  });
});
