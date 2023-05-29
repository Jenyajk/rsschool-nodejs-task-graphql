import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import {areValuesMissing, checkIsValidIdentifier} from "../../utils/validator";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return fastify.db.profiles.findMany()
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | null> {
      try {
        const res = await fastify.db.profiles.findOne({ key: 'id', equals: request.params.id });
        if (res) {
          return res;
        } else {
          reply.code(404).send({ message: 'Not found' });
          return null;
        }
      } catch (error) {
        reply.code(500).send({ message: 'Internal Server Error' });
        return null;
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const foundUser = await this.db.users.findOne({ key: "id", equals: request.body.userId });
        const foundMemberType = await this.db.memberTypes.findOne({ key: "id", equals: request.body.memberTypeId });
        const foundProfile = await this.db.profiles.findOne({ key: "userId", equals: request.body.userId });

        if (areValuesMissing(foundUser, foundMemberType, foundProfile)) {
          throw fastify.httpErrors.badRequest();
        }

        const createdProfile = await fastify.db.profiles.create(request.body);
        return createdProfile;
      } catch (error: any) {
        reply.code(400).send({ message: error.message ?? "Bad Request" });
        return error;
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        const deletedProfile = await fastify.db.profiles.delete(request.params.id);
        return deletedProfile;
      } catch (error) {
        return  reply.code(400).send({ message: (error as Error).message ?? "Bad Request" });
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      if (!checkIsValidIdentifier(request.params.id)) {
        throw fastify.httpErrors.badRequest();
      }

      return fastify.db.profiles.change(request.params.id, request.body)

      try {
        if (request.params.id) {
          const memberType = await fastify.db.memberTypes.findOne({key:'id', equals:request.params.id})
          if(!memberType) throw new Error ('MemberType does not exist');
        }
        return await fastify.db.profiles.change(request.params.id, request.body)
      }
      catch (error: any) {
        return reply.code(400).send({message: error.message || "Bad Request"})
      }
    }
  );
};

export default plugin;
