import { expect } from 'chai';

import { encodeArrayBuffer } from '../../../src/encodings/base64.js';
import {
  CentralDirectory,
  parseCDBuffer,
  readUInt64LE,
  ZipReader,
} from '../../../tdf3/src/utils/zip-reader.js';
import { ZipWriter, dateToDosDateTime, writeUInt64LE } from '../../../tdf3/src/utils/zip-writer.js';

describe('zip utilities', () => {
  describe('dateToDos', () => {
    it('zero', () => {
      const dosEpochStart = new Date('1980-01-01T00:00:00');
      const { date, time } = dateToDosDateTime(dosEpochStart);
      // DOS used 1-indexed day-of-month and month-of-year fields.
      // eslint-disable-next-line no-bitwise
      expect(date).to.equal(0x1 | (0x1 << 5));
      expect(time).to.equal(0);
    });
    it('ninteen ninety nine', () => {
      const dosEpochStart = new Date('1999-12-31T23:59:59');
      const { date, time } = dateToDosDateTime(dosEpochStart);
      // eslint-disable-next-line no-bitwise
      expect(date).to.equal(31 | (12 << 5) | (19 << 9));
      // File modificaiton stamps only had two-second granularity.
      // eslint-disable-next-line no-bitwise
      expect(time).to.equal(29 | (59 << 5) | (23 << 11));
    });
  });

  describe('writeUInt64LE', () => {
    it('not too different', () => {
      // allocate a new uint8array with 8 bytes
      const b0 = new Uint8Array(8);
      new DataView(b0.buffer).setBigUint64(0, BigInt(1), true);
      const b1 = new Uint8Array(8);
      writeUInt64LE(b1, 1, 0);
      expect(b1).to.eql(b0);
    });
    it('unsafe ints throw', () => {
      expect(() => writeUInt64LE(new Uint8Array(0), 2 ** 54, 0)).to.throw(/unsafe number/);
    });
  });
  describe('readUInt64LE', () => {
    it('one', () => {
      const b0 = new Uint8Array(8);
      new DataView(b0.buffer).setBigUint64(0, 1n, true);
      expect(readUInt64LE(b0, 0)).to.equal(1);
    });
    it('unsafe ints throw', () => {
      const b0 = new Uint8Array(8);
      new DataView(b0.buffer).setBigUint64(0, 9007199254740992n, true);
      expect(() => readUInt64LE(b0, 0)).to.throw(/exceeds/);
    });
  });

  describe('localFileHeaders', () => {
    it('standard', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = false;
      const headerBuffer = zipWriter.getLocalFileHeader(
        'Hey.txt',
        0x1337,
        5,
        500,
        new Date('1980-01-01T00:00:00')
      );
      expect(encodeArrayBuffer(headerBuffer.buffer)).to.equal(
        'UEsDBBQACAgAAAAAIQA3EwAABQAAAPQBAAAHAAAASGV5LnR4dA=='
      );
    });
    it('zip64', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = true;
      const headerBuffer = zipWriter.getLocalFileHeader(
        'Hey.txt',
        0x1337,
        5,
        500,
        new Date('1980-01-01T00:00:00')
      );
      expect(encodeArrayBuffer(headerBuffer.buffer)).to.equal(
        'UEsDBBQACAgAAAAAIQA3EwAA//////////8HABwASGV5LnR4dAEAGAAFAAAAAAAAAPQBAAAAAAAAAAAAAAAAAAA='
      );
    });
  });

  describe('dataDescriptors', () => {
    it('standard', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = false;
      const descriptorBuffer = zipWriter.writeDataDescriptor(0x1337, 500);
      expect(encodeArrayBuffer(descriptorBuffer.buffer)).to.equal('UEsHCDcTAAD0AQAA9AEAAA==');
    });
    it('zip64', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = true;
      const descriptorBuffer = zipWriter.writeDataDescriptor(0x1337, 500);
      expect(encodeArrayBuffer(descriptorBuffer.buffer)).to.equal(
        'UEsHCDcTAAD0AQAAAAAAAPQBAAAAAAAA'
      );
    });
  });

  // CHARACTERISTIC TESTS of zip files.
  // TODO(PLAT-1134) Include samples generated by c++ sdk
  describe('centralDirectoryRecords', () => {
    it('standard', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = false;
      const cdrBuffer = zipWriter.writeCentralDirectoryRecord(
        500,
        'Hey.txt',
        2000,
        0x1337,
        0x81a40000,
        new Date('1980-01-01T00:00:00')
      );
      expect(parseCDBuffer(cdrBuffer)).to.deep.include({
        compressedSize: 500,
        uncompressedSize: 500,
        fileName: 'Hey.txt',
        crc32: 0x1337,
        relativeOffsetOfLocalHeader: 2000,
        externalFileAttributes: 2175008768,
        lastModFileDate: 33,
        lastModFileTime: 0,
      });
      expect(encodeArrayBuffer(cdrBuffer.buffer)).to.equal(
        'UEsBAj8DFAAICAAAAAAhADcTAAD0AQAA9AEAAAcAAAAAAAAAAAAAAKSB0AcAAEhleS50eHQ='
      );
    });
    it('zip64', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = true;
      const cdrBuffer = zipWriter.writeCentralDirectoryRecord(
        2 ** 50,
        'Hey.txt',
        2000,
        0x1337,
        0x81a40000,
        new Date('1980-01-01T00:00:00')
      );
      expect(parseCDBuffer(cdrBuffer)).to.deep.include({
        compressedSize: 2 ** 50,
        uncompressedSize: 2 ** 50,
        fileName: 'Hey.txt',
        crc32: 0x1337,
        relativeOffsetOfLocalHeader: 2000,
        externalFileAttributes: 2175008768,
        lastModFileDate: 33,
        lastModFileTime: 0,
      });
      expect(encodeArrayBuffer(cdrBuffer.buffer)).to.equal(
        'UEsBAj8DLQAICAAAAAAhADcTAAD//////////wcAHAAAAAAAAAAAAKSB/////0hleS50eHQBABgAAAAAAAAABAAAAAAAAAAEANAHAAAAAAAA'
      );
    });
  });

  describe('endOfentralDirectoryRecords', () => {
    it('standard', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = false;
      const eocdrBuffer = zipWriter.writeEndOfCentralDirectoryRecord(2, 200, 2000);
      expect(encodeArrayBuffer(eocdrBuffer)).to.equal('UEsFBgAAAAACAAIAyAAAANAHAAAAAA==');
    });
    it('zip64', async () => {
      const zipWriter = new ZipWriter();
      zipWriter.zip64 = true;
      const eocdrBuffer = zipWriter.writeEndOfCentralDirectoryRecord(2, 200, 2000);
      expect(encodeArrayBuffer(eocdrBuffer)).to.equal(
        'UEsGBiwAAAAAAAAAPwMtAAAAAAAAAAAAAgAAAAAAAAACAAAAAAAAAMgAAAAAAAAA0AcAAAAAAABQSwYHAAAAAJgIAAAAAAAAAQAAAFBLBQYAAAAA////////////////AAA='
      );
    });
  });
});

describe('reader', () => {
  it('fails on bad manifest size', async () => {
    const reader = new ZipReader(async () => new Uint8Array([]));
    const fileName = '0.manifest.json';
    try {
      expect(
        await reader.getManifest(
          [
            {
              fileName,
              relativeOffsetOfLocalHeader: 0,
              headerLength: 1024,
              uncompressedSize: 1024 * 1024 * 128,
            } as CentralDirectory,
          ],
          fileName
        )
      ).to.be.undefined;
    } catch (e) {
      expect(e.message).to.contain('too large');
    }
  });
});
