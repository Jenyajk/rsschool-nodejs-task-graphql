import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
    return fastify.db.memberTypes.findMany()
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        const res = await fastify.db.memberTypes.findOne({ key: 'id', equals: request.params.id });
        return res ? res : reply.code(404).send({ message: 'Not found' });
      } catch (error) {
        console.error(error);
        reply.code(500).send({ message: 'Internal Server Error' });
        throw error;
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      try {
        const updatedMemberType = await fastify.db.memberTypes.change(request.params.id, request.body);
        return updatedMemberType;
      } catch (error: any) {
        throw fastify.httpErrors.badRequest(error.message || 'Bad Request');
      }
    }
  );
};

export default plugin;
