import { expect } from 'chai'
import * as request from 'supertest'
import * as config from 'config'

import { attachDefaultHooks } from '../../../routes/hooks'
import '../../../routes/expectations'

import { Paths } from 'dashboard/paths'
import { Paths as CCJPaths } from 'ccj/paths'

import { app } from '../../../../main/app'

import * as idamServiceMock from '../../../http-mocks/idam'
import * as claimStoreServiceMock from '../../../http-mocks/claim-store'
import { checkAuthorizationGuards } from './checks/authorization-check'

import { sampleClaimDraftObj } from '../../../http-mocks/draft-store'
import { company, individual, organisation, soleTrader } from '../../../data/entity/party'

const cookieName: string = config.get<string>('session.cookieName')

const draftPagePath = Paths.claimantPage.evaluateUri({ externalId: 'draft' })
const claimPagePath = Paths.claimantPage.evaluateUri({ externalId: sampleClaimDraftObj.externalId })

describe('Dashboard - claimant page', () => {
  attachDefaultHooks(app)

  describe('on GET', () => {
    checkAuthorizationGuards(app, 'get', claimPagePath)

    context('when user authorised', () => {
      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor('1', 'citizen')
      })

      describe('when claim is in draft stage', () => {
        it('should render page when everything is fine', async () => {
          await request(app)
            .get(draftPagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.successful.withText('Claim number', 'Draft'))
        })
      })

      describe('when claim is not in draft stage', () => {
        it('should return 500 and render error page when cannot retrieve claims', async () => {
          claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error')

          await request(app)
            .get(claimPagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'))
        })

        it('should render page when everything is fine', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId()

          await request(app)
            .get(claimPagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.successful.withText('Claim number', claimStoreServiceMock.sampleClaimObj.referenceNumber))
        })
      })
    })
  })
  describe('on POST for requesting a CCJ', () => {
    checkAuthorizationGuards(app, 'post', claimPagePath)

    context('when user authorised', () => {
      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor('1', 'citizen')
      })

      describe('when claim is in draft stage', () => {
        it(`should render error page`, async () => {
          await request(app)
            .post(draftPagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error', 'Draft external ID is not supported'))
        })
      })

      describe('when claim is not in draft stage', () => {
        describe('when defendant is an individual', () => {
          it('should redirect to CCJ / defendant date of birth page', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId({
              claim: {
                ...claimStoreServiceMock.sampleClaimObj.claim,
                defendants: [individual]
              }
            })

            await request(app)
              .post(claimPagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .expect(res => expect(res).to.be.redirect.toLocation(
                CCJPaths.dateOfBirthPage.evaluateUri({ externalId: sampleClaimDraftObj.externalId })
              ))
          })
        })

        describe('when defendant is not an individual', () => {
          [soleTrader, company, organisation].forEach(party => {
            it(`should redirect to CCJ paid amount page when defendant is ${party.type}`, async () => {
              claimStoreServiceMock.resolveRetrieveClaimByExternalId({
                claim: {
                  ...claimStoreServiceMock.sampleClaimObj.claim,
                  defendants: [party]
                }
              })

              await request(app)
                .post(claimPagePath)
                .set('Cookie', `${cookieName}=ABC`)
                .expect(res => expect(res).to.be.redirect.toLocation(
                  CCJPaths.paidAmountPage.evaluateUri({ externalId: sampleClaimDraftObj.externalId })
                ))
            })
          })
        })
      })
    })
  })
})
