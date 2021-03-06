/* Allow chai assertions which don't end in a function call, e.g. expect(thing).to.be.undefined */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-console */
import * as config from 'config'
import * as supertest from 'supertest'
import * as pa11y from 'pa11y'
import * as promisify from 'es6-promisify'
import { expect } from 'chai'

import { RoutablePath } from 'shared/router/routablePath'
import { Paths as EligibilityPaths } from 'eligibility/paths'
import { ErrorPaths as ClaimIssueErrorPaths, Paths as ClaimIssuePaths } from 'claim/paths'
import { ErrorPaths as DefendantFirstContactErrorPaths, Paths as DefendantFirstContactPaths } from 'first-contact/paths'
import { Paths as DefendantResponsePaths, StatementOfMeansPaths, PayBySetDatePaths } from 'response/paths'
import { Paths as CCJPaths } from 'ccj/paths'
import { Paths as OfferPaths } from 'offer/paths'

import './mocks'
import { app } from '../../main/app'

app.locals.csrf = 'dummy-token'

const cookieName: string = config.get<string>('session.cookieName')

const agent = supertest.agent(app)
const pa11yTest = pa11y({
  page: {
    headers: {
      Cookie: `${cookieName}=ABC`
    }
  }
})
const test = promisify(pa11yTest.run, pa11yTest)

function check (url: string): void {
  describe(`Page ${url}`, () => {
    it('should be accessible', async () => {
      const text = await extractPageText(url)
      ensureHeadingIsIncludedInPageTitle(text)

      const messages = await test(agent.get(url).url)
      ensureNoAccessibilityErrors(messages)
    })
  })
}

async function extractPageText (url: string): Promise<string> {
  const res: supertest.Response = await agent.get(url)
    .set('Cookie', `${cookieName}=ABC;state=000MC000`)

  if (res.redirect) {
    throw new Error(`Call to ${url} resulted in a redirect to ${res.get('Location')}`)
  }

  if (!res.ok) {
    throw new Error(`Call to ${url} resulted in ${res.status}`)
  }

  return res.text
}

function ensureHeadingIsIncludedInPageTitle (text: string): void {
  const title: string = text.match(/<title>(.*)<\/title>/)[1]
  const heading: RegExpMatchArray = text.match(/<h1 class="heading-large">\s*(.*)\s*<\/h1>/)

  if (heading) { // Some pages does not have heading section e.g. confirmation pages
    expect(title).to.be.equal(`${heading[1]} - Money Claims`)
  } else {
    expect(title).to.be.not.equal(' - Money Claims')
    console.log(`NOTE: No heading found on page titled '${title}' exists`)
  }
}

function ensureNoAccessibilityErrors (messages: any[]): void {
  const errors = messages.filter((message) => message.type === 'error')
  expect(errors, `\n${JSON.stringify(errors, null, 2)}\n`).to.be.empty
}

const excludedPaths: DefendantResponsePaths[] = [
  ClaimIssuePaths.startPaymentReceiver,
  ClaimIssuePaths.finishPaymentReceiver,
  ClaimIssuePaths.receiptReceiver,
  ClaimIssuePaths.sealedClaimPdfReceiver,
  DefendantResponsePaths.receiptReceiver,
  DefendantResponsePaths.legacyDashboardRedirect,
  OfferPaths.agreementReceiver,
  DefendantFirstContactPaths.receiptReceiver
]

describe('Accessibility', () => {
  function checkPaths (pathsRegistry: object): void {
    Object.values(pathsRegistry).forEach((path: RoutablePath) => {
      const excluded = excludedPaths.some(_ => _ === path)
      if (!excluded) {
        if (path.uri.includes(':externalId')) {
          check(path.evaluateUri({ externalId: '91e1c70f-7d2c-4c1e-a88f-cbb02c0e64d6' }))
        } else {
          check(path.uri)
        }
      }
    })
  }

  checkPaths(EligibilityPaths)
  checkPaths(ClaimIssuePaths)
  checkPaths(ClaimIssueErrorPaths)
  checkPaths(DefendantFirstContactPaths)
  checkPaths(DefendantFirstContactErrorPaths)
  checkPaths(DefendantResponsePaths)
  checkPaths(CCJPaths)
  checkPaths(OfferPaths)
  checkPaths(StatementOfMeansPaths)
  checkPaths(PayBySetDatePaths)
})
