import { expect } from 'chai'
import * as request from 'supertest'
import * as config from 'config'

import { attachDefaultHooks } from '../../../routes/hooks'
import '../../../routes/expectations'
import { checkAuthorizationGuards } from './checks/authorization-check'

import { Paths as ClaimPaths } from 'claim/paths'

import { app } from '../../../../main/app'

import * as idamServiceMock from '../../../http-mocks/idam'
import * as draftStoreServiceMock from '../../../http-mocks/draft-store'
import { InterestTypeOption } from 'claim/form/models/interestType'

const cookieName: string = config.get<string>('session.cookieName')
const pageContent: string = 'How do you want to claim interest?'
const pagePath: string = ClaimPaths.interestTypePage.uri

describe('Claim issue: interest type page', () => {
  attachDefaultHooks(app)

  describe('on GET', () => {
    checkAuthorizationGuards(app, 'get', pagePath)

    it('should render page when everything is fine', async () => {
      idamServiceMock.resolveRetrieveUserFor('1', 'citizen')
      draftStoreServiceMock.resolveFind('claim')

      await request(app)
        .get(pagePath)
        .set('Cookie', `${cookieName}=ABC`)
        .expect(res => expect(res).to.be.successful.withText(pageContent))
    })
  })

  describe('on POST', () => {
    checkAuthorizationGuards(app, 'post', pagePath)

    describe('for authorized user', () => {
      beforeEach(() => {
        idamServiceMock.resolveRetrieveUserFor('1', 'citizen')
      })

      it('should render page when form is invalid and everything is fine', async () => {
        draftStoreServiceMock.resolveFind('claim')

        await request(app)
          .post(pagePath)
          .set('Cookie', `${cookieName}=ABC`)
          .expect(res => expect(res).to.be.successful.withText(pageContent, 'div class="error-summary"'))
      })

      it('should return 500 and render error page when form is valid and cannot save draft', async () => {
        draftStoreServiceMock.resolveFind('claim')
        draftStoreServiceMock.rejectSave()

        await request(app)
          .post(pagePath)
          .set('Cookie', `${cookieName}=ABC`)
          .send({ option: InterestTypeOption.SAME_RATE })
          .expect(res => expect(res).to.be.serverError.withText('Error'))
      })

      it('should redirect to interest rate page when form is valid, same rate is selected and everything is fine', async () => {
        draftStoreServiceMock.resolveFind('claim')
        draftStoreServiceMock.resolveSave()

        await request(app)
          .post(pagePath)
          .set('Cookie', `${cookieName}=ABC`)
          .send({ option: InterestTypeOption.SAME_RATE })
          .expect(res => expect(res).to.be.redirect.toLocation(ClaimPaths.interestRatePage.uri))
      })

      it('should throw forbidden error when form is valid, breakdown is selected and everything is fine', async () => {
        draftStoreServiceMock.resolveFind('claim')
        draftStoreServiceMock.resolveSave()

        await request(app)
          .post(pagePath)
          .set('Cookie', `${cookieName}=ABC`)
          .send({ option: InterestTypeOption.BREAKDOWN })
          .expect(res => expect(res).to.be.forbidden.withText('Forbidden'))
      })
    })
  })
})