import { expect } from 'chai'
import { Settlement } from 'claims/models/settlement'
import { MadeBy } from 'offer/form/models/madeBy'
import { StatementType } from 'offer/form/models/statementType'
import { Offer } from 'claims/models/offer'
import { PartyStatement } from 'claims/models/partyStatement'

describe('Settlement', () => {

  describe('deserialize', () => {

    it('should return undefined when undefined input given', () => {
      const actual: Settlement = new Settlement().deserialize(undefined)

      expect(actual.partyStatements).to.be.eq(undefined)
    })

    it('should deserialize valid JSON to valid Settlement object', () => {
      const actual: Settlement = new Settlement().deserialize(input())

      expect(actual).to.be.instanceof(Settlement)
      expect(actual.partyStatements.length).to.be.eq(1)
      expect(actual.partyStatements[0]).to.be.instanceof(PartyStatement)
    })
  })

  describe('getDefendantOffer', () => {

    it('should return undefined when no settlement', () => {
      const actual: Settlement = new Settlement().deserialize(undefined)
      expect(actual.getDefendantOffer()).to.be.eq(undefined)
    })

    it('should return undefined when only claimant offer given', () => {
      const actual: Settlement = new Settlement().deserialize(input(StatementType.OFFER, MadeBy.CLAIMANT))
      expect(actual.getDefendantOffer()).to.be.eq(undefined)
    })

    it('should return undefined when only settlement accepted', () => {
      const actual: Settlement = new Settlement().deserialize(input(StatementType.ACCEPTATION))
      expect(actual.getDefendantOffer()).to.be.eq(undefined)
    })

    it('should return undefined when only settlement rejected', () => {
      const actual: Settlement = new Settlement().deserialize(input(StatementType.REJECTION))
      expect(actual.getDefendantOffer()).to.be.eq(undefined)
    })

    it('should return Offer when defendant made an offer', () => {
      const myInput: any = input()
      const offer: Offer = myInput.partyStatements[0].offer
      const actual: Settlement = new Settlement().deserialize(myInput)

      expect(actual.getDefendantOffer().completionDate.format('YYYY-DD-MM')).to.be.eq(offer.completionDate)
      expect(actual.getDefendantOffer().content).to.be.eq(offer.content)
    })
  })

  describe('isOfferAccepted', () => {
    it('should return false when no offer', () => {
      const actual: Settlement = new Settlement().deserialize(undefined)
      expect(actual.isOfferAccepted()).to.be.eq(false)
    })

    it('should return false when there is offer but no acceptation', () => {
      const actual: Settlement = new Settlement().deserialize(input(StatementType.OFFER))
      expect(actual.isOfferAccepted()).to.be.eq(false)
    })

    it('should return false when offer is rejected', () => {
      const actual: Settlement = new Settlement().deserialize(input(StatementType.REJECTION, MadeBy.CLAIMANT))
      expect(actual.isOfferAccepted()).to.be.eq(false)
    })

    it('should return true when offer is accepted', () => {
      const actual: Settlement = new Settlement().deserialize(input(StatementType.ACCEPTATION, MadeBy.CLAIMANT))
      expect(actual.isOfferAccepted()).to.be.eq(true)
    })
  })

  describe('isOfferRejected', () => {
    it('should return false when no offer', () => {
      const settlement: Settlement = new Settlement().deserialize(undefined)
      expect(settlement.isOfferRejected()).to.be.eq(false)
    })

    it('should return false when there is offer but no rejection', () => {
      const settlement: Settlement = new Settlement().deserialize(input(StatementType.OFFER))
      expect(settlement.isOfferRejected()).to.be.eq(false)
    })

    it('should return false when offer is accepted', () => {
      const settlement: Settlement = new Settlement().deserialize(input(StatementType.ACCEPTATION, MadeBy.CLAIMANT))
      expect(settlement.isOfferRejected()).to.be.eq(false)
    })

    it('should return true when offer is rejected', () => {
      const settlement: Settlement = new Settlement().deserialize(input(StatementType.REJECTION, MadeBy.CLAIMANT))
      expect(settlement.isOfferRejected()).to.be.eq(true)
    })
  })
})

function input (type: StatementType = StatementType.OFFER, madeBy: MadeBy = MadeBy.DEFENDANT): any {
  return {
    partyStatements: [
      {
        type: type.value,
        madeBy: madeBy.value,
        offer: {
          content: 'bla',
          completionDate: '2019-10-10'
        }
      }
    ]
  }
}
