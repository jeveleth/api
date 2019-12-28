const chai = require('chai')
const util = require('../../../../../app/api/v1/routes/util')

const assert = chai.assert

describe('Routes Util Tests', () => {
  describe('createAPIResponse', () => {
    it('should not have errors by default', () => {
      var response = util.createAPIResponse()
      assert.isTrue(response.errors.length === 0)
    })

    it('should have one error in response', () => {
      var response = util.createAPIResponse({
        errors: ['You did a thing wrong']
      })
      assert.isTrue(response.errors.length === 1)
      assert.isTrue(response.errors[0] === 'You did a thing wrong')
    })

    it('should not have notices by default', () => {
      var response = util.createAPIResponse()
      assert.isTrue(response.notices.length === 0)
    })

    it('should have one notice in response', () => {
      var response = util.createAPIResponse({
        notices: ['Just a heads up']
      })
      assert.isTrue(response.notices.length === 1)
      assert.isTrue(response.notices[0] === 'Just a heads up')
    })

    it('should not have warnings by default', () => {
      var response = util.createAPIResponse()
      assert.isTrue(response.warnings.length === 0)
    })

    it('should have one warning in response', () => {
      var response = util.createAPIResponse({
        warnings: ['Things could have gone better']
      })
      assert.isTrue(response.warnings.length === 1)
      assert.isTrue(response.warnings[0] === 'Things could have gone better')
    })
  })
})
