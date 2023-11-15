import type { GraphQLField } from 'graphql'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { checkUserOrAdminTokenAccess } from './checkUserAccess'

export class CheckAccessWithFeatureFlag extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (
      root: any,
      args: any,
      context: Context,
      info: any
    ) => {
      const {
        vtex: { adminUserAuthToken },
        clients: { masterdata },
      } = context

      const config: { enable: boolean } = await masterdata.getDocument({
        dataEntity: 'auth_validation_config',
        fields: ['enable'],
        id: 'b2b-organizations-graphql',
      })

      if (config?.enable) {
        await checkUserOrAdminTokenAccess(context, adminUserAuthToken)
      }

      return resolve(root, args, context, info)
    }
  }
}