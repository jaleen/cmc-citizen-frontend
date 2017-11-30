import { Validator } from 'class-validator'

import { ResponseDraft } from 'response/draft/responseDraft'
import { DefendantPaymentType } from 'response/form/models/defendantPaymentOption'
import { PayBySetDate } from 'response/draft/payBySetDate'
import { StatementOfMeans } from 'response/draft/statementOfMeans'

const validator = new Validator()

function isValid (input): boolean {
  return input !== undefined && validator.validateSync(input).length === 0
}

export class WhenWillYouPayTask {
  static isCompleted (responseDraft: ResponseDraft): boolean {
    return isValid(responseDraft.defendantPaymentOption)
      && this.paymentDetailsAreProvidedFor(responseDraft)
      && this.statementOfMeansIsCompletedIfApplicable(responseDraft)
  }

  private static paymentDetailsAreProvidedFor (responseDraft: ResponseDraft): boolean {
    if (responseDraft.defendantPaymentOption.option === DefendantPaymentType.BY_SET_DATE) {
      return responseDraft.payBySetDate !== undefined
        && isValid(responseDraft.payBySetDate.paymentDate)
        && this.explanationIsValidIfRequired(responseDraft.payBySetDate)
    } else if (responseDraft.defendantPaymentOption.option === DefendantPaymentType.INSTALMENTS) {
      return isValid(responseDraft.defendantPaymentPlan)
    } else {
      throw new Error(`Unknown payment option: ${responseDraft.defendantPaymentOption.option}`)
    }
  }

  private static explanationIsValidIfRequired (payBySetDate: PayBySetDate): boolean {
    if (payBySetDate.requiresExplanation()) {
      return isValid(payBySetDate.explanation)
    } else {
      return true
    }
  }

  private static statementOfMeansIsCompletedIfApplicable (responseDraft: ResponseDraft): boolean {
    if (StatementOfMeans.isApplicableFor(responseDraft)) {
      return responseDraft.statementOfMeans !== undefined
        && isValid(responseDraft.statementOfMeans.residence)
    }
    return true
  }
}