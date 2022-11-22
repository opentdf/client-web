import { assert } from 'chai';
import { sync as rimrafSync } from 'rimraf';
import { mkdirSync, readFileSync } from 'fs';

import { Client as TDF } from '../../tdf3/src';
import { NodeTdfStream } from '../../tdf3/src/client/NodeTdfStream';
const defaultConfig = {
  clientId: 'id',
  kasEndpoint: 'kas',
  clientSecret: 'secret',
};

const client = new TDF.Client(defaultConfig);

const TEMP_DIR = 'temp/';

describe('client wrapper tests', function () {
  it('client params safe from updating', function () {
    const config = {
      kasEndpoint: 'kasUrl',
      clientId: 'id',
      clientSecret: 'secret',
    };
    const client = new TDF.Client(config);
    assert.deepEqual(config, { ...config });
    assert.deepEqual(config.clientId, client.clientId);

    config.clientId = 'another-id';
    assert.notDeepEqual(config.clientId, client.clientId);
  });

  it('encrypt params sane', function () {
    const paramsBuilder = new TDF.EncryptParamsBuilder();
    assert.ok(!paramsBuilder.getStreamSource());
  });

  it('encrypt params null string source', function () {
    const paramsBuilder = new TDF.EncryptParamsBuilder();
    try {
      paramsBuilder.setStringSource(null);
      throw new Error("didn't throw");
    } catch (e) {
      // TODO: type check exception
    }
  });

  it('encrypt params bad string source', function () {
    const paramsBuilder = new TDF.EncryptParamsBuilder();
    try {
      paramsBuilder.setStringSource(42);
      throw new Error("didn't throw");
    } catch (e) {
      // TODO: type check exception
    }
  });

  it('encrypt params null file source', function () {
    const paramsBuilder = new TDF.EncryptParamsBuilder();
    try {
      paramsBuilder.setFileSource(null);
      throw new Error("didn't throw");
    } catch (e) {
      // TODO: type check exception
    }
  });

  it('encrypt "online" param should be true by default', () => {
    const paramsBuilder = new TDF.EncryptParamsBuilder();

    assert.equal(paramsBuilder.isOnline(), true);
  });

  it('encrypt offline mode can be enabled on setOffline trigger', () => {
    const paramsBuilder = new TDF.EncryptParamsBuilder();
    paramsBuilder.setOffline();

    assert.equal(paramsBuilder.isOnline(), false);
  });

  it('encrypt offline mode can be enabled withOffline', () => {
    const paramsBuilder = new TDF.EncryptParamsBuilder().withOffline();

    assert.equal(paramsBuilder.isOnline(), false);
  });

  it('encrypt offline can be toggled', () => {
    const paramsBuilder = new TDF.EncryptParamsBuilder().withOffline().withOnline();
    assert.equal(paramsBuilder.isOnline(), true);
    assert.equal(paramsBuilder.withOffline().isOnline(), false);
    assert.equal(paramsBuilder.withOnline().withOffline().withOffline().isOnline(), false);
    assert.equal(paramsBuilder.withOnline().isOnline(), true);
    assert.equal(paramsBuilder.isOnline(), true);
  });

  it('encrypt params bad file source', function () {
    const paramsBuilder = new TDF.EncryptParamsBuilder();
    try {
      paramsBuilder.setFileSource(42);
      throw new Error("didn't throw");
    } catch (e) {
      // TODO: type check exception
    }
  });

  it('encrypt params policy id', function () {
    const params = new TDF.EncryptParamsBuilder()
      .withStringSource('hello world')
      .withPolicyId('foo')
      .build();
    assert.equal('foo', params.getPolicyId());
  });

  it('encrypt params mime type', function () {
    const params = new TDF.EncryptParamsBuilder()
      .withStringSource('hello world')
      .withMimeType('text/plain')
      .build();
    assert.equal(params.mimeType, 'text/plain');
  });

  it('decrypt params sane', function () {
    const paramsBuilder = new TDF.DecryptParamsBuilder();
    assert.ok(!paramsBuilder.getStreamSource());
  });

  it('encrypt error', async function () {
    const encryptParams = new TDF.EncryptParamsBuilder().withStringSource('hello world').build();
    try {
      await client.encrypt(encryptParams);
      assert.fail('did not throw');
    } catch (expected) {
      assert.ok(expected);
    }
  });

  it('decrypt error', async function () {
    const decryptParams = new TDF.DecryptParamsBuilder().withStringSource('not a tdf').build();
    try {
      await client.decrypt(decryptParams);
      assert.fail('did not throw');
    } catch (expected) {
      assert.ok(expected);
    }
  });
});

describe('tdf stream tests', function () {
  before(function () {
    rimrafSync(TEMP_DIR);
    mkdirSync(TEMP_DIR);
  });

  after(function () {
    rimrafSync(TEMP_DIR);
  });
  it('plaintext stream string', async function () {
    const pt = new TextEncoder().encode('hello world');
    const stream = new NodeTdfStream(1000, {
      start(controller) {
        controller.enqueue(pt);
        controller.close();
      }
    });
    assert.equal('hello world', await stream.toString());
  });
  it('plaintext stream buffer', async function () {
    const pt = new TextEncoder().encode('hello world');
    const stream = new NodeTdfStream(1000, {
      start(controller) {
        controller.enqueue(pt);
        controller.close();
      }
    });
    assert.equal('hello world', (await stream.toBuffer()).toString('utf-8'));
  });
  it('plaintext stream file', async function () {
    const pt = 'hello world';
    const filename = `${TEMP_DIR}/plain.txt`;
    const stream = new NodeTdfStream(1000, {
      start(controller) {
        controller.enqueue(pt);
        controller.close();
      }
    });
    await stream.toFile(filename);
    const rt = readFileSync(filename, { encoding: 'utf-8' });
    assert.equal(pt, rt);
  });

});
