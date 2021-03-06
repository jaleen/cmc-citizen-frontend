declare namespace CodeceptJS {
  export interface I {
    createCitizenUser: () => string
    createSolicitorUser: () => string
    createClaim: (claimData: ClaimData, submitterEmail: string) => string
    linkDefendantToClaim: (claimRef: string, claimantEmail: string, defendantEmail: string) => void
    respondToClaim: (referenceNumber: string, ownerEmail: string, responseData: ResponseData, defendantEmail: string) => void
    retrievePin (letterHolderId: string): () => string
    amOnCitizenAppPage: (path: string) => void

    fillField: (locator: string, value: string) => any
    selectOption: (select: string, option: string) => any
  }
}

type CodeceptJSHelper = {
  _before: () => void;
  _after: () => void;
}

declare const codecept_helper: { new(): CodeceptJSHelper }
