import { expect } from 'chai'

import { ResponseDraft } from 'response/draft/responseDraft'
import { Response } from 'response/form/models/response'
import { ResponseType } from 'response/form/models/responseType'
import { FreeMediationOption } from 'response/form/models/freeMediation'
import { MoreTimeNeededOption } from 'response/form/models/moreTimeNeeded'
import { RejectAllOfClaim, RejectAllOfClaimOption } from 'response/form/models/rejectAllOfClaim'
import { RejectPartOfClaim, RejectPartOfClaimOption } from 'response/form/models/rejectPartOfClaim'
import { ResidenceType } from 'response/form/models/statement-of-means/residenceType'
import { PayBySetDate as PaymentDate } from 'forms/models/payBySetDate'
import { HowMuchPaidClaimant, HowMuchPaidClaimantOption } from 'response/form/models/howMuchPaidClaimant'

describe('ResponseDraft', () => {

  describe('deserialization', () => {

    it('should return a ResponseDraft instance initialised with defaults for undefined', () => {
      expect(new ResponseDraft().deserialize(undefined)).to.eql(new ResponseDraft())
    })

    it('should return a ResponseDraft instance initialised with defaults for null', () => {
      expect(new ResponseDraft().deserialize(null)).to.eql(new ResponseDraft())
    })

    it('should return a ResponseDraft instance initialised with valid data', () => {
      const responseType: ResponseType = ResponseType.PART_ADMISSION
      const inputData = prepareInputData(responseType, MoreTimeNeededOption.YES)

      const responseDraftModel: ResponseDraft = new ResponseDraft().deserialize(inputData)

      expect(responseDraftModel.response.type).to.eql(responseType)
      expect(responseDraftModel.freeMediation.option).to.eql(FreeMediationOption.YES)
      expect(responseDraftModel.moreTimeNeeded.option).to.eql(MoreTimeNeededOption.YES)
      expect(responseDraftModel.isMoreTimeRequested()).to.be.eql(true)
      expect(responseDraftModel.impactOfDispute.text).to.equal('This dispute has affected me badly, I cried')
      expect(responseDraftModel.statementOfMeans.residence.type).to.eql(ResidenceType.OTHER)
      assertPaymentDateEquals(responseDraftModel.payBySetDate.paymentDate, inputData.payBySetDate.paymentDate)
      expect(responseDraftModel.payBySetDate.explanation.text).to.equal(inputData.payBySetDate.explanation.text)
    })
  })

  describe('isMoreTimeRequested', () => {

    it('should return false when more time was not requested', () => {
      const responseDraftModel: ResponseDraft = new ResponseDraft().deserialize(
        prepareInputData(ResponseType.FULL_ADMISSION, MoreTimeNeededOption.NO)
      )

      expect(responseDraftModel.moreTimeNeeded.option).to.be.eq(MoreTimeNeededOption.NO)
      expect(responseDraftModel.isMoreTimeRequested()).to.be.eq(false)
    })

    it('should return false when instantiated with no input', () => {
      const responseDraftModel: ResponseDraft = new ResponseDraft()

      expect(responseDraftModel.moreTimeNeeded).to.be.eql(undefined)
      expect(responseDraftModel.isMoreTimeRequested()).to.be.eq(false)
    })
  })

  describe('isResponseFullyAdmitted', () => {
    it('should return false when no response type set', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = undefined

      expect(draft.isResponseFullyAdmitted()).to.be.eq(false)
    })

    it('should return false when response is not full admission', () => {
      ResponseType.except(ResponseType.FULL_ADMISSION).forEach(responseType => {
        const draft: ResponseDraft = new ResponseDraft()
        draft.response = new Response(responseType)

        expect(draft.isResponseFullyAdmitted()).to.be.eq(false)
      })
    })

    it('should return true when response is a full admission', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.FULL_ADMISSION)

      expect(draft.isResponseFullyAdmitted()).to.be.eq(true)
    })
  })

  describe('isResponsePartiallyRejectedDueTo', () => {

    it('should return false when no response type set', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = undefined

      expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)).to.be.eq(false)
    })

    it('should return error message when option argument is undefined', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.PART_ADMISSION)

      expect(() => draft.isResponsePartiallyRejectedDueTo(undefined)).to.throw(Error, 'Option is undefined')
    })

    it('should return false message when response type is not a part rejection', () => {
      ResponseType.except(ResponseType.PART_ADMISSION).forEach(responseType => {
        const draft: ResponseDraft = new ResponseDraft()
        draft.response = new Response(responseType)

        expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)).to.be.equal(false)
      })
    })

    it('should return false when response is part admission without subtype selected', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.PART_ADMISSION)
      draft.rejectPartOfClaim = new RejectPartOfClaim(undefined)

      expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)).to.be.equal(false)
    })

    it('should return false when response is part admission with paid what believed was owed (match)', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.PART_ADMISSION)
      draft.rejectPartOfClaim = new RejectPartOfClaim(RejectPartOfClaimOption.PAID_WHAT_BELIEVED_WAS_OWED)

      expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.PAID_WHAT_BELIEVED_WAS_OWED)).to.be.eq(true)
    })

    it('should return true when response is part admission with amount too high (match)', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.PART_ADMISSION)
      draft.rejectPartOfClaim = new RejectPartOfClaim(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)

      expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)).to.be.eq(true)
    })

    it('should return false when response is part admission with wrong option amount too high', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.PART_ADMISSION)
      draft.rejectPartOfClaim = new RejectPartOfClaim(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)

      expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.PAID_WHAT_BELIEVED_WAS_OWED)).to.be.eq(false)
    })

    it('should return false when response is part admission with wrong option paid what believed was owed', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.PART_ADMISSION)
      draft.rejectPartOfClaim = new RejectPartOfClaim(RejectPartOfClaimOption.PAID_WHAT_BELIEVED_WAS_OWED)

      expect(draft.isResponsePartiallyRejectedDueTo(RejectPartOfClaimOption.AMOUNT_TOO_HIGH)).to.be.eq(false)
    })
  })

  describe('isResponseRejectedFullyWithAmountClaimedPaid', () => {

    it('should return false when no response type set', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = undefined

      expect(draft.isResponseRejectedFullyWithAmountClaimedPaid()).to.be.equals(false)
    })

    it('should return false when full rejection option is undefined', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.DEFENCE)
      draft.rejectAllOfClaim = undefined

      expect(draft.isResponseRejectedFullyWithAmountClaimedPaid()).to.be.equals(false)
    })

    it('should return false when payment option undefined', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.DEFENCE)
      draft.rejectAllOfClaim = new RejectAllOfClaim(RejectAllOfClaimOption.ALREADY_PAID)
      draft.howMuchPaidClaimant = undefined

      expect(draft.isResponseRejectedFullyWithAmountClaimedPaid()).to.be.equals(false)
    })

    it('should return true when response is full admission with already paid and amount claimed', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.DEFENCE)
      draft.rejectAllOfClaim = new RejectAllOfClaim(RejectAllOfClaimOption.ALREADY_PAID)
      draft.howMuchPaidClaimant = new HowMuchPaidClaimant(HowMuchPaidClaimantOption.AMOUNT_CLAIMED)

      expect(draft.isResponseRejectedFullyWithAmountClaimedPaid()).to.be.equals(true)
    })
  })

  describe('isResponseRejectedFullyWithDispute', () => {

    it('should return false when no response type set', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = undefined

      expect(draft.isResponseRejectedFullyWithDispute()).to.be.equals(false)
    })

    it('should return false when full rejection option is undefined', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.DEFENCE)
      draft.rejectAllOfClaim = undefined

      expect(draft.isResponseRejectedFullyWithDispute()).to.be.equals(false)
    })

    it('should return true when response is rejected with dispute', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.DEFENCE)
      draft.rejectAllOfClaim = new RejectAllOfClaim(RejectAllOfClaimOption.DISPUTE)

      expect(draft.isResponseRejectedFullyWithDispute()).to.be.equals(true)
    })
  })

  describe('isResponsePopulated', () => {
    it('should return true when response is populated', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = new Response(ResponseType.DEFENCE)

      expect(draft.isResponsePopulated()).to.be.equals(true)
    })

    it('should return false when response is not populated', () => {
      const draft: ResponseDraft = new ResponseDraft()
      draft.response = undefined

      expect(draft.isResponsePopulated()).to.be.equals(false)
    })
  })

  function prepareInputData (responseType: ResponseType, moreTimeOption: string): any {
    return {
      response: {
        type: {
          value: responseType.value,
          displayValue: responseType.displayValue
        }
      },
      freeMediation: {
        option: FreeMediationOption.YES
      },
      moreTimeNeeded: {
        option: moreTimeOption
      },
      impactOfDispute: {
        text: 'This dispute has affected me badly, I cried'
      },
      statementOfMeans: {
        residence: {
          type: {
            value: ResidenceType.OTHER.value,
            displayValue: ResidenceType.OTHER.displayValue
          },
          housingDetails: 'Squat'
        }
      },
      payBySetDate: {
        paymentDate: {
          date: {
            year: 1988,
            month: 2,
            day: 10
          }
        },
        explanation: {
          text: 'I can not pay now'
        }
      }
    }
  }

  function assertPaymentDateEquals (actual: PaymentDate, expected: any) {
    expect(actual.date.year).to.equal(expected.date.year)
    expect(actual.date.month).to.equal(expected.date.month)
    expect(actual.date.day).to.equal(expected.date.day)
  }
})
