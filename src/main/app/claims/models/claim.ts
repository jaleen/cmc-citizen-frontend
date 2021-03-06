import { Moment } from 'moment'
import { ClaimData } from 'claims/models/claimData'
import { MomentFactory } from 'shared/momentFactory'
import * as config from 'config'
import * as toBoolean from 'to-boolean'
import { CountyCourtJudgment } from 'claims/models/countyCourtJudgment'
import { Response } from 'claims/models/response'
import { ResponseType } from 'claims/models/response/responseCommon'
import { Settlement } from 'claims/models/settlement'
import { Offer } from 'claims/models/offer'
import { ClaimStatus } from 'claims/models/claimStatus'
import { FeatureToggles } from 'utils/featureToggles'

interface State {
  status: ClaimStatus
}

export class Claim {
  id: number
  claimantId: string
  externalId: string
  defendantId: string
  claimNumber: string
  responseDeadline: Moment
  createdAt: Moment
  issuedOn: Moment
  claimData: ClaimData
  moreTimeRequested: boolean
  respondedAt: Moment
  claimantEmail: string
  countyCourtJudgment: CountyCourtJudgment
  countyCourtJudgmentRequestedAt: Moment
  response: Response
  defendantEmail: string
  settlement: Settlement
  settlementReachedAt: Moment
  totalAmountTillToday: number
  totalAmountTillDateOfIssue: number
  totalInterest: number

  deserialize (input: any): Claim {
    if (input) {
      this.id = input.id
      this.claimantId = input.submitterId
      this.externalId = input.externalId
      this.defendantId = input.defendantId
      this.claimNumber = input.referenceNumber
      this.createdAt = MomentFactory.parse(input.createdAt)
      this.responseDeadline = MomentFactory.parse(input.responseDeadline)
      this.issuedOn = MomentFactory.parse(input.issuedOn)
      this.claimData = new ClaimData().deserialize(input.claim)
      this.moreTimeRequested = input.moreTimeRequested
      if (input.respondedAt) {
        this.respondedAt = MomentFactory.parse(input.respondedAt)
      }
      if (input.defendantEmail) {
        this.defendantEmail = input.defendantEmail
      }
      if (input.response) {
        this.response = Response.deserialize(input.response)
      }
      this.claimantEmail = input.submitterEmail
      this.countyCourtJudgment = new CountyCourtJudgment().deserialize(input.countyCourtJudgment)
      if (input.countyCourtJudgmentRequestedAt) {
        this.countyCourtJudgmentRequestedAt = MomentFactory.parse(input.countyCourtJudgmentRequestedAt)
      }
      if (input.settlement) {
        this.settlement = new Settlement().deserialize(input.settlement)
      }
      if (input.settlementReachedAt) {
        this.settlementReachedAt = MomentFactory.parse(input.settlementReachedAt)
      }
      this.totalAmountTillToday = input.totalAmountTillToday
      this.totalAmountTillDateOfIssue = input.totalAmountTillDateOfIssue
      this.totalInterest = input.totalInterest
    }
    return this
  }

  get defendantOffer (): Offer {
    if (!this.settlement) {
      return undefined
    }

    return this.settlement.getDefendantOffer()
  }

  get respondToResponseDeadline (): Moment {
    if (!this.respondedAt) {
      return undefined
    }
    const daysForService = 5
    const daysForResponse = 28
    return this.respondedAt.clone().add(daysForService + daysForResponse, 'days')
  }

  get respondToMediationDeadline (): Moment {
    if (!this.respondedAt) {
      return undefined
    }
    return this.respondedAt.clone().add('5', 'days')
  }

  get remainingDays (): number {
    return this.responseDeadline.diff(MomentFactory.currentDate(), 'days')
  }

  get eligibleForCCJ (): boolean {
    if (!toBoolean(config.get<boolean>('featureToggles.countyCourtJudgment'))) {
      return false
    }

    return !this.countyCourtJudgmentRequestedAt && this.remainingDays < 0 && !this.respondedAt
  }

  get status (): ClaimStatus {
    if (this.countyCourtJudgmentRequestedAt) {
      return ClaimStatus.CCJ_REQUESTED
    } else if (this.isSettlementReached()) {
      return ClaimStatus.OFFER_SETTLEMENT_REACHED
    } else if (this.isOfferAccepted()) {
      return ClaimStatus.OFFER_ACCEPTED
    } else if (this.isOfferRejected()) {
      return ClaimStatus.OFFER_REJECTED
    } else if (this.isOfferSubmitted()) {
      return ClaimStatus.OFFER_SUBMITTED
    } else if (this.eligibleForCCJ) {
      return ClaimStatus.ELIGIBLE_FOR_CCJ
    } else if (this.isClaimRejected()) {
      return ClaimStatus.CLAIM_REJECTED
    } else if (this.moreTimeRequested) {
      return ClaimStatus.MORE_TIME_REQUESTED
    } else if (!this.response) {
      return ClaimStatus.NO_RESPONSE
    } else {
      throw new Error('Unknown Status')
    }
  }

  get stateHistory (): State[] {
    const statuses = [{ status: this.status }]
    if (this.isClaimRejected() && statuses[0].status !== ClaimStatus.CLAIM_REJECTED) {
      statuses.push({ status: ClaimStatus.CLAIM_REJECTED })
    }

    return statuses
  }

  private isOfferSubmitted (): boolean {
    return FeatureToggles.isEnabled('offer')
      && this.settlement && this.response && this.response.responseType === ResponseType.FULL_DEFENCE
  }

  private isOfferAccepted (): boolean {
    return FeatureToggles.isEnabled('offer') && this.settlement && this.settlement.isOfferAccepted()
  }

  private isOfferRejected (): boolean {
    return FeatureToggles.isEnabled('offer') && this.settlement && this.settlement.isOfferRejected()
  }

  private isSettlementReached (): boolean {
    return FeatureToggles.isEnabled('offer') && this.settlement && !!this.settlementReachedAt
  }

  private isClaimRejected (): boolean {
    return this.response && this.response.responseType === ResponseType.FULL_DEFENCE
  }
}
