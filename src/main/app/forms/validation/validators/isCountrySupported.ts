import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface
} from 'class-validator'
import { Country } from 'common/country'
import { ErrorLogger } from 'logging/errorLogger'
import { PostcodeInfoResponse } from '@hmcts/postcodeinfo-client'
import { ClientFactory } from 'postcode-lookup/clientFactory'

const postcodeClient = ClientFactory.createInstance()

enum BlockedPostcodes {
  ISLE_OF_MAN = 'IM'
}

@ValidatorConstraint()
export class CheckCountryConstraint implements ValidatorConstraintInterface {

  async validate (value: any | string, args?: ValidationArguments): Promise<boolean> {
    if (value === undefined || value === null || value === '') {
      return true
    }

    if (value.trim().toUpperCase().startsWith(BlockedPostcodes.ISLE_OF_MAN)) {
      return false
    }

    try {
      const postcodeInfoResponse: PostcodeInfoResponse = await postcodeClient.lookupPostcode(value)
      if (!postcodeInfoResponse.valid) {
        return true
      }
      const country = postcodeInfoResponse.country.name
      const countries: Country[] = args.constraints[0]

      return countries.filter(result => result.name.toLowerCase() === country.toLowerCase()).length > 0
    } catch (err) {
      const errorLogger = new ErrorLogger()
      errorLogger.log(err)
      return true
    }
  }

  defaultMessage (args: ValidationArguments) {
    return 'Country is not supported'
  }
}

/**
 * Verify postcode is within accepted list of countries.
 */
export function IsCountrySupported (countries: Country[], validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [countries],
      validator: CheckCountryConstraint
    })
  }
}
