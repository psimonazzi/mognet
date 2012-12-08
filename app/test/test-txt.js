var assert = require("assert");
var txt = require('../lib/txt');

describe('txt', function() {

  describe('#smarten()', function() {
    it('should refine typography', function() {
      assert.equal('Test ellipsis… \nretest… eof.', txt.smarten('Test ellipsis... \nretest... eof.'));
      assert.equal('Test\n Some “Quotés”. And “others”', txt.smarten('Test\n Some "Quotés". And "others"'));
      assert.equal("Test ‘Single Quotés’ ‘s.", txt.smarten("Test 'Single Quotés' 's."));
      //assert.equal("{ 'json': 'unaffected' }", txt.smarten("{ 'json': 'unaffected' }"));
    });
  })

})