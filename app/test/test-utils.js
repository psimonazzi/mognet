var assert = require("assert");
var utils = require("../lib/utils");
var txt = require("../lib/txt");

describe('utils', function() {
  describe('#pad()', function() {
    it('should pad a number with leading spaces', function() {
      assert.equal("00042", utils.pad(42, 5));
      assert.equal("12", utils.pad(12, 2));
    })
  })

  describe('#extend()', function() {
    it('should extend an object with properties from another', function() {
      var a = { 'p1': 1337, 'p2': ['a', 'b'], 'p3': '♥', 'p4': { 't': 42 } };
      var b = { 'p1': 'foo', 'p2': ['a', 'b', 'c'], 'p4': { 'τ': 0 }, 'p5': [1] };
      a = utils.extend(a, b);

      assert.equal("foo", a.p1);
      assert.equal(3, a.p2.length);
      assert.equal('♥', a.p3);
      assert.equal(undefined, a.p4.t);
      assert.equal(0, a.p4.τ);
      assert.equal(1, a.p5[0]);
    })
  })

  describe('#transliterate()', function() {
    it('should transliterate a Unicode string, performing accent folding', function() {
      assert.equal('accent, folding 1/α', txt.transliterate('Áçčềñṭ, Ḟøłɖǐṅg 1/α'));
    })
  })
  
})
