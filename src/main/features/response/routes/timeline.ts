import * as express from 'express'

import { Paths } from 'response/paths'
import { Form } from 'forms/form'
import { FormValidator } from 'app/forms/validation/formValidator'
import { MAX_NUMBER_OF_EVENTS, Timeline } from 'response/form/models/timeline'
import { ErrorHandling } from 'common/errorHandling'
import { DraftService } from 'common/draft/draftService'

function renderView (form: Form<Timeline>, res: express.Response): void {
  res.render(Paths.timelinePage.associatedView, {
    form: form,
    claimantName: res.locals.user.claim.claimData.claimant.name,
    canAddMoreEvents: form.model.rows.length < MAX_NUMBER_OF_EVENTS
  })
}

function actionHandler (req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (req.body.action) {
    const form: Form<Timeline> = req.body
    if (req.body.action.addRow) {
      form.model.appendRow()
    }
    return renderView(form, res)
  }
  next()
}

export default express.Router()
  .get(Paths.timelinePage.uri, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    renderView(new Form(res.locals.user.responseDraft.document.timeline), res)
  })
  .post(
    Paths.timelinePage.uri,
    FormValidator.requestHandler(Timeline, Timeline.fromObject, undefined, ['addRow']),
    actionHandler,
    ErrorHandling.apply(async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
      const form: Form<Timeline> = req.body

      if (form.hasErrors()) {
        renderView(form, res)
      } else {
        form.model.clearUselessRows()
        res.locals.user.responseDraft.document.timeline = form.model

        await DraftService.save(res.locals.user.responseDraft, res.locals.user.bearerToken)
        renderView(form, res)
      }
    })
  )