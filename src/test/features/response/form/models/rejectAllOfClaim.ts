import { expect } from 'chai'

import { Validator } from 'class-validator'
import { expectValidationError } from '../../../../app/forms/models/validationUtils'
import { RejectAllOfClaim, RejectAllOfClaimOption, ValidationErrors } from 'response/form/models/rejectAllOfClaim'

describe('RejectAllOfClaim', () => {
  describe('validation', () => {
    const validator: Validator = new Validator()

    it('should reject when undefined option', () => {
      const errors = validator.validateSync(new RejectAllOfClaim(undefined))

      expect(errors.length).to.equal(1)
      expectValidationError(errors, ValidationErrors.OPTION_REQUIRED)
    })

    it('should reject when invalid option', () => {
      const errors = validator.validateSync(new RejectAllOfClaim('reject all'))

      expect(errors.length).to.equal(1)
      expectValidationError(errors, ValidationErrors.OPTION_REQUIRED)
    })

    it('should accept when recognised option', () => {
      RejectAllOfClaimOption.all().forEach(type => {
        const errors = validator.validateSync(new RejectAllOfClaim(type))

        expect(errors.length).to.equal(0)
      })
    })
  })
})
