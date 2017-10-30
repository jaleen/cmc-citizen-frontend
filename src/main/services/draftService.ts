import * as config from 'config'
import request from 'client/request'
import { DraftService as BaseDraftService } from '@hmcts/draft-store-client'

import { ServiceAuthTokenFactoryImpl } from 'common/security/serviceTokenFactoryImpl'

export class DraftService extends BaseDraftService {
  constructor () {
    super(config.get<string>('draft-store.url'), request, new ServiceAuthTokenFactoryImpl())
  }
}