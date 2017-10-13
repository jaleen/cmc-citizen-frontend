import { expect } from 'chai'
import * as request from 'supertest'
import * as config from 'config'
import { attachDefaultHooks } from '../../../routes/hooks'
import '../../../routes/expectations'
import { Paths } from 'response/paths'
import { app } from '../../../../main/app'
import * as idamServiceMock from '../../../http-mocks/idam'
import * as draftStoreServiceMock from '../../../http-mocks/draft-store'
import * as claimStoreServiceMock from '../../../http-mocks/claim-store'
import { sampleClaimObj } from '../../../http-mocks/claim-store'
import { checkAuthorizationGuards } from './checks/authorization-check'
import { checkAlreadySubmittedGuard } from './checks/already-submitted-check'
import { checkCountyCourtJudgmentRequestedGuard } from './checks/ccj-requested-check'

const cookieName: string = config.get<string>('session.cookieName')
const pagePath: string = Paths.timelinePage.evaluateUri({ externalId: sampleClaimObj.externalId })

describe('Defendant response: timeline', () => {

  attachDefaultHooks(app)

  describe('on GET', () => {

    checkAuthorizationGuards(app, 'get', pagePath)

    context('when user authorised', () => {

      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor(1, 'cmc-private-beta', 'defendant')
      })

      checkAlreadySubmittedGuard(app, 'get', pagePath)
      checkCountyCourtJudgmentRequestedGuard(app, 'get', pagePath)

      context('when response and CCJ not submitted', () => {

        it('should return 500 and render error page when cannot retrieve claim', async () => {
          claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error')

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'))
        })

        it('should return 500 and render error page when cannot retrieve draft', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId()
          draftStoreServiceMock.rejectFind('Error')

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'))
        })

        it('should render page when everything is fine', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId()
          draftStoreServiceMock.resolveFind('response')

          await request(app)
            .get(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.successful.withText('Add your timeline of events'))
        })
      })
    })
  })

  describe('on POST', () => {

    checkAuthorizationGuards(app, 'post', pagePath)

    describe('for authorized user', () => {

      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor(1, 'cmc-private-beta', 'defendant')
      })

      checkAlreadySubmittedGuard(app, 'post', pagePath)
      checkCountyCourtJudgmentRequestedGuard(app, 'post', pagePath)

      describe('errors are handled propely', () => {

        it('should return 500 and render error page when cannot retrieve claim', async () => {
          claimStoreServiceMock.rejectRetrieveClaimByExternalId('HTTP error')

          await request(app)
            .post(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'))
        })

        it('should return 500 and render error page when cannot retrieve draft', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId()
          draftStoreServiceMock.rejectFind('Error')

          await request(app)
            .post(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .expect(res => expect(res).to.be.serverError.withText('Error'))
        })
      })

      describe('update row action', () => {

        context('valid form', () => {

          it('should render page when form is valid, amount within limit and everything is fine', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId()
            draftStoreServiceMock.resolveFind('response')
            draftStoreServiceMock.resolveSave(100)

            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send({ rows: [{ date: 'Damaged roof', description: '299' }] })
              .expect(res => expect(res).to.be.successful.withText('Add your timeline of events'))
          })
        })

        context('invalid form', () => {

          it('should render page when date undefined', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId()
            draftStoreServiceMock.resolveFind('response')

            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send({ rows: [{ date: undefined, description: '299' }] })
              .expect(res => expect(res).to.be.successful.withText('Enter a date'))
          })

          it('should render page when description undefined', async () => {
            claimStoreServiceMock.resolveRetrieveClaimByExternalId()
            draftStoreServiceMock.resolveFind('response')

            await request(app)
              .post(pagePath)
              .set('Cookie', `${cookieName}=ABC`)
              .send({ rows: [{ date: 'May', description: undefined }] })
              .expect(res => expect(res).to.be.successful.withText('Enter a description of what happened'))
          })
        })
      })

      describe('add row action', () => {

        it('should render page when valid input', async () => {
          claimStoreServiceMock.resolveRetrieveClaimByExternalId()
          draftStoreServiceMock.resolveFind('response')

          await request(app)
            .post(pagePath)
            .set('Cookie', `${cookieName}=ABC`)
            .send({ action: { addRow: 'Add row' } })
            .expect(res => expect(res).to.be.successful.withText('Add your timeline of events'))
        })
      })
    })
  })
})