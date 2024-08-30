import { assert, expect } from '@esm-bundle/chai';
import { fake } from 'sinon';
import { AccessToken, type AccessTokenResponse } from '../../../src/auth/oidc.js';

// // const qsparse = (s: string) => Object.fromEntries(new URLSearchParams(s));
const qsparse = (s: string) =>
  [...new URLSearchParams(s).entries()].reduce((o, i) => ({ ...o, [i[0]]: i[1] }), {});

const ok = {
  ok: true,
  redirected: false,
  status: 200,
  statusText: 'ok',
  type: 'basic',
  url: 'about:none',
} as Awaited<ReturnType<typeof fetch>>;

function mockFetch(
  r: Partial<AccessTokenResponse> = {},
  {
    ok = true,
    status = 200,
    statusText = 'OK',
  }: { ok?: boolean; status?: number; statusText?: string } = {}
) {
  const json = fake.resolves(r);
  const text = fake.resolves(JSON.stringify(r));
  return fake.resolves({ json, ok, status, statusText, text });
}

const algorithmSigner = {
  name: 'RSASSA-PKCS1-v1_5',
  hash: 'SHA-256',
  modulusLength: 2048,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
};

// Due to Jest mocks not working with ESModules currently,
// these tests use poor man's mocking
describe('AccessToken', () => {
  describe('userinfo endpoint', () => {
    it('appends Auth header and calls userinfo', async () => {
      const mf = mockFetch({ access_token: 'fdfsdffsdf' });
      const accessToken = new AccessToken(
        {
          oidcOrigin: 'https://auth.invalid/auth/realms/yeet',
          clientId: 'yoo',
          exchange: 'refresh',
          refreshToken: 'ignored',
        },
        mf
      );
      const res = await accessToken.info('fakeToken');
      expect(res).to.have.property('access_token', 'fdfsdffsdf');
      expect(mf.lastCall.firstArg).to.match(
        /\/auth\/realms\/yeet\/protocol\/openid-connect\/userinfo$/
      );
      expect(mf).to.have.nested.property('lastArg.headers.Authorization', 'Bearer fakeToken');
    });
    it('error causes errors', async () => {
      const mf = mockFetch(
        { access_token: 'fdfsdffsdf' },
        { ok: false, status: 401, statusText: 'Unauthorized' }
      );
      const accessToken = new AccessToken(
        {
          exchange: 'client',
          oidcOrigin: 'https://auth.invalid',
          clientId: 'yoo',
          clientSecret: 'asdfa',
        },
        mf
      );
      try {
        await accessToken.info('fakeToken');
        assert.fail();
      } catch (e) {
        expect(e.message).to.match(/Unauthorized/);
      }
    });
  });

  describe('exchanging refresh token for token with TDF claims', () => {
    describe('using client credentials', () => {
      it('passes client creds with refresh grant type to token endpoint', async () => {
        const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, [
          'sign',
          'verify',
        ]);
        const mf = mockFetch({ access_token: 'fdfsdffsdf' });
        const accessToken = new AccessToken(
          {
            exchange: 'refresh',
            oidcOrigin: 'https://auth.invalid/auth/realms/yeet/',
            clientId: 'myid',
            refreshToken: 'refresh',
            signingKey,
            dpopEnabled: true,
          },
          mf
        );
        const res = await accessToken.get(true);
        expect(res).to.equal('fdfsdffsdf');
        expect(mf.lastCall.firstArg).to.match(
          /\/auth\/realms\/yeet\/protocol\/openid-connect\/token$/
        );
        const body = qsparse(mf.lastCall.lastArg.body);
        expect(body).to.eql({
          grant_type: 'refresh_token',
          client_id: 'myid',
          refresh_token: 'refresh',
        });
        expect(mf.lastCall.lastArg.headers).to.have.property('X-VirtruPubKey');
        expect(mf.lastCall.lastArg.headers).to.have.property('DPoP');
      });
      it('passes client creds with refresh grant type to token endpoint and dPoP disabled', async () => {
        const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, [
          'sign',
          'verify',
        ]);
        const mf = mockFetch({ access_token: 'fdfsdffsdf' });
        const accessToken = new AccessToken(
          {
            exchange: 'refresh',
            oidcOrigin: 'https://auth.invalid/auth/realms/yeet/',
            clientId: 'myid',
            refreshToken: 'refresh',
            signingKey,
            dpopEnabled: false,
          },
          mf
        );
        const res = await accessToken.get(true);
        expect(res).to.equal('fdfsdffsdf');
        expect(mf.lastCall.firstArg).to.match(
          /\/auth\/realms\/yeet\/protocol\/openid-connect\/token$/
        );
        const body = qsparse(mf.lastCall.lastArg.body);
        expect(body).to.eql({
          grant_type: 'refresh_token',
          client_id: 'myid',
          refresh_token: 'refresh',
        });
        expect(mf.lastCall.lastArg.headers).not.to.have.property('X-VirtruPubKey');
        expect(mf.lastCall.lastArg.headers).not.to.have.property('DPoP');
      });
    });
    describe('using browser flow', () => {
      it('passes only refresh token with refresh grant type to token endpoint', async () => {
        const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, [
          'sign',
          'verify',
        ]);
        const mf = mockFetch({ access_token: 'fake_token' });
        const accessToken = new AccessToken(
          {
            oidcOrigin: 'https://auth.invalid',
            exchange: 'refresh',
            clientId: 'browserclient',
            refreshToken: 'fakeRefreshToken',
            signingKey,
          },
          mf
        );
        const res = await accessToken.get(true);
        expect(res).to.eql('fake_token');
        expect(mf.lastCall.firstArg).to.match(/\/protocol\/openid-connect\/token$/);
        const body = qsparse(mf.lastCall.lastArg.body);
        expect(body).to.eql({
          grant_type: 'refresh_token',
          client_id: 'browserclient',
          refresh_token: 'fakeRefreshToken',
        });
      });
    });
  });

  describe('exchanging external JWT for token with TDF claims', () => {
    describe('using client credentials', () => {
      it('passes client creds and JWT with exchange grant type to token endpoint', async () => {
        const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, [
          'sign',
          'verify',
        ]);
        const mf = mockFetch({ access_token: 'fake_token' });
        const accessToken = new AccessToken(
          {
            oidcOrigin: 'https://auth.invalid//',
            clientId: 'myid',
            exchange: 'external',
            externalJwt: 'subject.token',
            signingKey,
          },
          mf
        );
        const res = await accessToken.get(true);
        expect(res).to.eql('fake_token');
        expect(mf.lastCall.firstArg).to.match(/\/protocol\/openid-connect\/token$/);
        const body = qsparse(mf.lastCall.lastArg.body);
        expect(body).to.eql({
          audience: 'myid',
          client_id: 'myid',
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token: 'subject.token',
          subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        });
      });
    });

    describe('using browser flow', () => {
      it('passes only external JWT with exchange grant type to token endpoint', async () => {
        const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, ['sign']);
        const mf = mockFetch({ access_token: 'fake_token' });
        const accessToken = new AccessToken(
          {
            exchange: 'external',
            oidcOrigin: 'https://auth.invalid',
            clientId: 'browserclient',
            externalJwt: 'fdfsdffsdf',
            signingKey,
          },
          mf
        );

        const res = await accessToken.get(true);
        expect(res).to.eql('fake_token');
        expect(mf.lastCall.firstArg).to.match(/\/protocol\/openid-connect\/token$/);
        const body = qsparse(mf.lastCall.lastArg.body);
        expect(body).to.eql({
          audience: 'browserclient',
          client_id: 'browserclient',
          grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          subject_token: 'fdfsdffsdf',
          subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
        });
      });
    });
  });

  describe('get token', () => {
    describe('clientCredentials and no cached tokenset', () => {
      it('should call token endpoint using client credentials if no cached tokenset', async () => {
        const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, ['sign']);
        const mf = mockFetch({ access_token: 'notreal' });
        const accessTokenClient = new AccessToken(
          {
            oidcOrigin: 'https://auth.invalid/',
            clientId: 'myid',
            clientSecret: 'mysecret',
            exchange: 'client',
            signingKey,
          },
          mf
        );
        // Do a refresh to cache tokenset
        const atr = await accessTokenClient.get(true);
        expect(atr).to.eql('notreal');
        expect(mf.lastCall.firstArg).to.eql('https://auth.invalid/protocol/openid-connect/token');
        const parseArgs = qsparse(mf.lastCall.lastArg.body);
        expect(parseArgs).to.have.property('grant_type', 'client_credentials');
        expect(parseArgs).to.have.property('client_id', 'myid');
        expect(parseArgs).to.have.property('client_secret', 'mysecret');
      });

      it('should throw error if no cached tokenset and no client creds in config', async () => {
        const mf = mockFetch({ access_token: 'notreal' });
        try {
          const accessTokenClient = new AccessToken(
            {
              oidcOrigin: 'https://auth.invalid',
              exchange: 'client',
              clientId: '',
              clientSecret: undefined as unknown as string,
            },
            mf
          );

          await accessTokenClient.get(true);
        } catch (e) {
          expect(e.message).to.match(/client identifier/);
        }
      });
    });
  });

  describe('cached tokenset', () => {
    it('should call userinfo endpoint and return cached tokenset', async () => {
      const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, ['sign']);
      const mf = mockFetch({ access_token: 'notreal' });
      const accessTokenClient = new AccessToken(
        {
          oidcOrigin: 'https://auth.invalid',
          clientId: 'myid',
          clientSecret: 'mysecret',
          exchange: 'client',
          signingKey,
        },
        mf
      );
      accessTokenClient.data = {
        refresh_token: 'r',
        access_token: 'a',
      };
      // Do a refresh to cache tokenset
      const res = await accessTokenClient.get(true);
      expect(res).to.eql('a');
      // TODO Why do we do an info call here?
      // expect(mf.callCount).to.eql(0);
    });
    it('should attempt to refresh token if userinfo call throws error', async () => {
      const signingKey = await crypto.subtle.generateKey(algorithmSigner, true, ['sign']);
      const json = fake.resolves({ access_token: 'a' });
      const mf = fake((url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        if (!init) {
          return Promise.reject('No init found');
        }
        if (init.method === 'POST') {
          return Promise.resolve({ ...ok, json });
        }
        return Promise.reject(`yee [${url}] [${JSON.stringify(init.headers)}]`);
      });
      const accessTokenClient = new AccessToken(
        {
          oidcOrigin: 'https://auth.invalid',
          clientId: 'myid',
          clientSecret: 'mysecret',
          exchange: 'client',
          signingKey,
        },
        mf
      );
      accessTokenClient.data = {
        refresh_token: 'r',
        access_token: 'a',
      };
      // Do a refresh to cache tokenset
      const res = await accessTokenClient.get(true);
      expect(res).to.eql('a');
      expect(mf.callCount).to.eql(2);
    });
  });
});
