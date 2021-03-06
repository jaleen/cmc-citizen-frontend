import * as config from 'config'
import * as mock from 'nock'
import * as HttpStatus from 'http-status-codes'
import { StatementType } from 'features/offer/form/models/statementType'
import { MadeBy } from 'features/offer/form/models/madeBy'
import { InterestEndDateOption } from 'claim/form/models/interestEndDate'
import { InterestDateType } from 'common/interestDateType'
import { Interest } from 'claims/models/interest'
import { InterestDate } from 'claims/models/interestDate'
import { InterestType as ClaimInterestType } from 'claims/models/interestType'

const serviceBaseURL: string = config.get<string>('claim-store.url')

export const sampleClaimObj = {
  id: 1,
  submitterId: '1',
  externalId: '400f4c57-9684-49c0-adb4-4cf46579d6dc',
  defendantId: '123',
  referenceNumber: '000MC000',
  createdAt: '2017-07-25T22:45:51.785',
  issuedOn: '2017-07-25',
  totalAmountTillToday: 200,
  totalAmountTillDateOfIssue: 200,
  claim: {
    claimants: [
      {
        type: 'individual',
        name: 'John Smith',
        address: {
          line1: 'line1',
          line2: 'line2',
          city: 'city',
          postcode: 'bb127nq'
        },
        dateOfBirth: '1990-02-17'
      }
    ],
    defendants: [
      {
        type: 'individual',
        name: 'John Doe',
        address: {
          line1: 'line1',
          line2: 'line2',
          city: 'city',
          postcode: 'bb127nq'
        }
      }
    ],
    payment: {
      id: '12',
      amount: 2500,
      state: { status: 'failed' }
    },
    amount: {
      type: 'breakdown',
      rows: [{ reason: 'Reason', amount: 200 }]
    },
    interest: {
      type: ClaimInterestType.STANDARD,
      rate: 10,
      reason: 'Special case'
    } as Interest,
    interestDate: {
      type: InterestDateType.SUBMISSION,
      endDateType: InterestEndDateOption.SETTLED_OR_JUDGMENT
    } as InterestDate,
    reason: 'Because I can',
    feeAmountInPennies: 2500,
    timeline: { rows: [{ date: 'a', description: 'b' }] }
  },
  responseDeadline: '2017-08-08',
  countyCourtJudgment: {
    defendantDateOfBirth: '1990-11-01',
    paidAmount: 2,
    paymentOption: 'IMMEDIATELY'
  },
  settlement: {
    partyStatements: [
      {
        type: StatementType.OFFER.value,
        madeBy: MadeBy.DEFENDANT.value,
        offer: { content: 'offer text', completionDate: '2017-08-08' }
      }
    ]
  }
}

export const sampleDefendantResponseObj = {
  respondedAt: '2017-07-25T22:45:51.785',
  response: {
    responseType: 'FULL_DEFENCE',
    defenceType: 'DISPUTE',
    defence: 'I reject this money claim',
    freeMediation: 'yes',
    defendant: {
      type: 'individual',
      name: 'full name',
      address: {
        line1: 'line1',
        line2: 'line2',
        city: 'city',
        postcode: 'bb127nq'
      }
    }
  }
}

export function mockCalculateInterestRate (expected: number): mock.Scope {
  return mock(serviceBaseURL)
    .get('/interest/calculate')
    .query(true)
    .reply(HttpStatus.OK, { amount: expected })
}

export function resolveRetrieveClaimByExternalId (claimOverride?: object): mock.Scope {
  return mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'))
    .reply(HttpStatus.OK, { ...sampleClaimObj, ...claimOverride })
}

export function resolveRetrieveClaimByExternalIdWithResponse (override?: object): mock.Scope {
  return mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'))
    .reply(HttpStatus.OK, { ...sampleClaimObj, ...sampleDefendantResponseObj, ...override })
}

export function rejectRetrieveClaimByExternalId (reason: string = 'Error') {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveRetrieveByClaimantId (claimOverride?: object) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/claimant/[0-9]+'))
    .reply(HttpStatus.OK, [{ ...sampleClaimObj, ...claimOverride }])
}

export function resolveRetrieveByClaimantIdToEmptyList () {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/claimant/[0-9]+'))
    .reply(HttpStatus.OK, [])
}

export function resolveRetrieveByDefendantIdToEmptyList () {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/defendant/[0-9]+'))
    .reply(HttpStatus.OK, [])
}

export function rejectRetrieveByClaimantId (reason: string) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/claimant/[0-9]+'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveIsClaimLinked (status: boolean) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/.+/defendant-link-status'))
    .reply(HttpStatus.OK, { linked: status })
}

export function rejectIsClaimLinked () {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/.+/defendant-link-status'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error')
}

export function resolveRetrieveByLetterHolderId (referenceNumber: string, claimOverride?: any): mock.Scope {
  return mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/letter/[0-9]+'))
    .reply(HttpStatus.OK, { ...sampleClaimObj, referenceNumber: referenceNumber, ...claimOverride })
}

export function rejectRetrieveByLetterHolderId (reason: string) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/letter/[0-9]+'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveRetrieveByDefendantId (referenceNumber: string, defendantId?: string) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/defendant/[0-9]+'))
    .reply(HttpStatus.OK, [{ ...sampleClaimObj, referenceNumber: referenceNumber, defendantId: defendantId }])
}

export function resolveRetrieveByDefendantIdWithResponse (override?: object) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/defendant/[0-9]+'))
    .reply(HttpStatus.OK, [{ ...sampleClaimObj, ...sampleDefendantResponseObj, ...override }])
}

export function rejectRetrieveByDefendantId (reason: string) {
  mock(`${serviceBaseURL}/claims`)
    .get(new RegExp('/defendant/[0-9]+'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveSaveResponse () {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/.+/defendant/[0-9]+'))
    .reply(HttpStatus.OK, { ...sampleClaimObj, defendantId: '1' })
}

export function rejectSaveResponse (reason: string) {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/.+/defendant/[0-9]+'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveRequestForMoreTime () {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/.+/request-more-time'))
    .reply(HttpStatus.OK)
}

export function rejectRequestForMoreTime (reason: string) {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/.+/request-more-time'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveSaveClaimForUser () {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/[0-9]+'))
    .reply(HttpStatus.OK, { ...sampleClaimObj })
}

export function rejectSaveClaimForUser (reason: string = 'HTTP error') {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/[0-9]+'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveSaveCcjForExternalId () {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}' +
      '/county-court-judgment'))
    .reply(HttpStatus.OK, { ...sampleClaimObj })
}

export function rejectSaveOfferForDefendant (reason: string = 'HTTP error') {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/.+/offers/defendant'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveSaveOffer () {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/.+/offers/defendant'))
    .reply(HttpStatus.CREATED)
}

export function resolveAcceptOffer (by: string = 'claimant') {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp(`/.+/offers/${by}/accept`))
    .reply(HttpStatus.CREATED)
}

export function resolveRejectOffer (by: string = 'claimant') {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp(`/.+/offers/${by}/reject`))
    .reply(HttpStatus.CREATED)
}

export function resolveCountersignOffer (by: string = 'defendant') {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp(`/.+/offers/${by}/countersign`))
    .reply(HttpStatus.CREATED)
}

export function rejectSaveCcjForExternalId (reason: string = 'HTTP error') {
  mock(`${serviceBaseURL}/claims`)
    .post(new RegExp('/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}' +
      '/county-court-judgment'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function rejectRetrieveDocument (reason: string) {
  mock(`${serviceBaseURL}/documents`)
    .get(new RegExp('/.+/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'))
    .reply(HttpStatus.INTERNAL_SERVER_ERROR, reason)
}

export function resolveRetrieveDocument () {
  mock(`${serviceBaseURL}/documents`)
    .get(new RegExp('/.+/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}'))
    .reply(HttpStatus.OK, [])
}
