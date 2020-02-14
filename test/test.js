"use strict";

const assert = require('chai').assert;
const IPCIDR = require('../index');
const BigInteger = require('jsbn').BigInteger;
const ipAddress = require('ip-address');

let validCIDR = '5.5.5.8/29';
let validCIDRClear = '5.5.5.8';
let validCIDRStart = '5.5.5.8';
let validCIDREnd = '5.5.5.15';

let v6CIDR = '2602:306:3433:c000::/50';
let v6CIDRCount = '302231454903657293676544';

let validRange = [
  '5.5.5.8',
  '5.5.5.9',
  '5.5.5.10',
  '5.5.5.11',
  '5.5.5.12',
  '5.5.5.13',
  '5.5.5.14',
  '5.5.5.15'
];

let invalidCIDR = 'invalid';

describe('IPCIDR:', function () {
  describe('check validity:', function () {
    it('should be valid', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.isOk(cidr.isValid());
    });

    it('should be invalid', function () {
      let cidr = new IPCIDR(invalidCIDR);
      assert.isNotOk(cidr.isValid());
    });
  });

  describe(".formatIP()", function () {
    it('check as string', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.equal(cidr.formatIP(cidr.address), validCIDRClear);
      const ipAddress = require('ip-address');
    });

    it('check as big integer', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.equal(JSON.stringify(cidr.address.bigInteger()), JSON.stringify(cidr.formatIP(cidr.address, { type: "bigInteger" })));
    });

    it('check as object', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.strictEqual(cidr.address, cidr.formatIP(cidr.address, { type: "addressObject" }));
    });
  });

  describe('.count()', function() {
    it('returns the number of ips in the range', function() {
      let cidr = new IPCIDR(validCIDR);
      assert.notEqual('number', typeof(cidr.count()));
      assert.isTrue(cidr.count().equals(new BigInteger('8')));
    });

    it('returns the number of ips in large ranges', function() {
      let cidr = new IPCIDR(v6CIDR);
      assert.isTrue(cidr.count().equals(new BigInteger(v6CIDRCount)));
    });

    it('returns an integer count', function() {
      let cidr = new IPCIDR(validCIDR);
      assert.equal('number', typeof(cidr.count(true)));
      assert.equal(cidr.count(true), 8);
    });

    it('returns -1 for integer overflow', function() {
      let cidr = new IPCIDR(v6CIDR);
      assert.equal('number', typeof(cidr.count(true)));
      assert.equal(cidr.count(true), -1);
    });
  });

  describe('.random()', function() {
    it('returns random ips', function() {
      let cidr = new IPCIDR(validCIDR);
      let ips = {};
      for (let i = 0; i < 100; i++) {
        ips[cidr.random()] = true;
      }
      assert.equal(Object.keys(ips).length, validRange.length);
      for (let ip in ips) {
        assert.isTrue(validRange.indexOf(ip) > -1);
      }
    });

    it('returns pseudo-random ipv6 ips', function() {
      let cidr = new IPCIDR(v6CIDR);
      for (let i = 0; i < 100; i++) {
        assert.isTrue(cidr.contains(cidr.random()));
      }
    })
  });

  describe(".contains()", function () {
    describe("check as string", function () {
      it('should be true', function () {
        let cidr = new IPCIDR(validCIDR);
        assert.isTrue(cidr.contains('5.5.5.15'));
      });

      it('should be false', function () {
        let cidr = new IPCIDR(validCIDR);
        assert.isFalse(cidr.contains('5.5.5.16'));
      });
    });

    describe("check as big integer", function () {
      it('should be true', function () {
        let cidr = new IPCIDR(validCIDR);
        assert.isTrue(cidr.contains(new BigInteger('84215055')));
      });

      it('should be false', function () {
        let cidr = new IPCIDR(validCIDR);
        assert.isFalse(cidr.contains(new BigInteger('84215056')));
      });
    });

    describe("check as object", function () {
      it('should be true', function () {
        let cidr = new IPCIDR(validCIDR);
        assert.isTrue(cidr.contains(new ipAddress.Address4('5.5.5.15')));
      });

      it('should be false', function () {
        let cidr = new IPCIDR(validCIDR);
        assert.isFalse(cidr.contains(new ipAddress.Address4('5.5.5.16')));
      });
    });
  });

  describe("check methods", function () {
    it('.start()', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.equal(cidr.start(), validCIDRStart);
    });

    it('.end()', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.equal(cidr.end(), validCIDREnd);
    });

    it('.toString()', function () {
      let cidr = new IPCIDR(validCIDR);
      assert.equal(cidr.toString(), validCIDR);
    });

    it('.toRange()', function () {
      let cidr = new IPCIDR(validCIDR);
      let range = cidr.toRange();
      assert.equal(range[0], validCIDRStart);
      assert.equal(range[1], validCIDREnd);
    });

    it('.toObject()', function () {
      let cidr = new IPCIDR(validCIDR);
      let obj = cidr.toObject();
      assert.equal(obj.start, validCIDRStart);
      assert.equal(obj.end, validCIDREnd);
    });
  });

  describe(".toArray()", function () {
    it('should return the full array', function () {
      let cidr = new IPCIDR(validCIDR);
      let array = cidr.toArray();
      assert.equal(JSON.stringify(array), JSON.stringify(validRange));
    });

    it('should return a part of the range', function () {
      let cidr = new IPCIDR(validCIDR);
      let results = {};
      let options = { from: 3, limit: new BigInteger('10') };
      let array = cidr.toArray(options, results);
      assert.equal(results.from.intValue(), options.from);
      assert.equal(results.to.intValue(), results.length.intValue());
      assert.equal(array.length, 5);
    });
  });

  describe(".loop()", function () {
    it('should read the full range', function () {
      let cidr = new IPCIDR(validCIDR);
      let counter = 0;

      return cidr.loop((ip) => {
        assert.equal(validRange[counter], ip);
        counter++;
      }).then(function () {
        assert.equal(counter, validRange.length);
      })
    });

    it('should read a part of the range', function () {
      let cidr = new IPCIDR(validCIDR);
      let counter = 1;
      let results = {};
      let options = {from: counter, limit: 2 };

      return cidr.loop((ip) => {
        assert.equal(validRange[counter], ip);
        counter++;
      }, options, results).then(function () {
        assert.equal(results.from.intValue(), options.from);
        assert.equal(results.limit.intValue(), options.limit);
        assert.equal(results.to.intValue(), options.from + options.limit);
        assert.equal(counter, options.from + options.limit);
      })
    });
  })
});
