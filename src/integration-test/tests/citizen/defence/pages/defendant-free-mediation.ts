import I = CodeceptJS.I

const I: I = actor()

const buttons = {
  submit: 'input[type=submit]'
}

export class DefendantFreeMediationPage {

  chooseYes (): void {
    I.checkOption('Yes')
    I.click(buttons.submit)
  }
}
