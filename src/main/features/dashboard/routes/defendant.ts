import * as express from 'express'

import { Paths } from 'dashboard/paths'
import { ErrorHandling } from 'shared/errorHandling'

import { ClaimStoreClient } from 'claims/claimStoreClient'
import { Claim } from 'claims/models/claim'
import { User } from 'idam/user'

const claimStoreClient: ClaimStoreClient = new ClaimStoreClient()

/* tslint:disable:no-default-export */
export default express.Router()
  .get(Paths.defendantPage.uri, ErrorHandling.apply(async (req: express.Request, res: express.Response): Promise<void> => {
    const { externalId } = req.params
    const user: User = res.locals.user
    const claim: Claim = await claimStoreClient.retrieveByExternalId(externalId, user)

    res.render(Paths.defendantPage.associatedView, {
      claim: claim
    })
  }))
