import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import {checkIsValidIdentifier} from "../../utils/validator";
import {filter} from "lodash";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    try {
      return fastify.db.users.findMany()
    } catch (error) {
      console.error(error);
      throw new Error('Failed to fetch users');
    }
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | null> {
      try {
        const user = await this.db.users.findOne({key:"id", equals: request.params.id})
        if (!user) {
          reply.code(404).send({ message: 'User not found' });
        }
        return user;
      } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch user');
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        return fastify.db.users.create(request.body);
      } catch (error) {
        console.error(error);
        reply.code(400).send({ message: 'Failed to create user' });
        throw error;
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
    async function (request, reply): Promise<UserEntity> {
      try {
        if (!checkIsValidIdentifier(request.params.id)) {
          throw fastify.httpErrors.badRequest()
        }

        const relatedUsers = await fastify.db.users.findMany({key:'subscribedToUserIds', inArray: request.params.id})

        for (let user of relatedUsers){
          const subscribedToUserIds = filter(user.subscribedToUserIds,(userId) => userId !== request.params.id)
          await fastify.db.users.change(user.id, {subscribedToUserIds})
        }

        const relatedPosts = await fastify.db.posts.findMany({key:'userId', equals:request.params.id})
        for (let post of relatedPosts){
          await fastify.db.posts.delete(post.id)
        }

        const relatedProfiles = await fastify.db.profiles.findMany({key:'userId', equals:request.params.id})
        for (let profile of relatedProfiles){
          await fastify.db.profiles.delete(profile.id)
        }
        return await fastify.db.users.delete(request.params.id)
      } catch (error) {
        console.error(error);
        return reply.code(400).send({ message: (error as any)?.message ?? 'Invalid user id' });
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      try {
        const subscriber = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });
        const user = await fastify.db.users.findOne({ key: 'id', equals: request.body.userId });

        if (!subscriber || !user) {
          throw new Error('Invalid user id.');
        }

        if (user.subscribedToUserIds.includes(request.params.id)) {
          throw new Error('User already subscribed.');
        }

        if (request.params.id === request.body.userId) {
          throw new Error('You cannot subscribe to yourself.');
        }

        await fastify.db.users.change(request.body.userId, {
          subscribedToUserIds: [...user.subscribedToUserIds, request.params.id],
        });

        reply.send({ success: true });
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || 'Invalid user id.' });
      }
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | undefined> {
      try {
        const subscriber = await fastify.db.users.findOne({ key: 'id', equals: request.params.id });
        const user = await fastify.db.users.findOne({ key: 'id', equals: request.body.userId });

        if (!subscriber || !user) {
          throw new Error('Invalid user ids.');
        }

        if (!user.subscribedToUserIds.includes(request.params.id)) {
          throw new Error('Not found subscriber for unsubscribe.');
        }

        const copyIds = [...user.subscribedToUserIds];
        const index = user.subscribedToUserIds.findIndex((item) => item === request.params.id);
        copyIds.splice(index, 1);

        const updateUser = await fastify.db.users.change(request.body.userId, { subscribedToUserIds: [...copyIds] });

        return updateUser;
      } catch (error) {
        return  reply.code(400).send({ message: (error as Error).message || 'Invalid user ids.' });

      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const changedUser = await fastify.db.users.change(request.params.id, request.body) as UserEntity;
        return changedUser;
      } catch (error) {
        return reply.code(400).send({ message: (error as Error).message || 'Bad Request' });
      }
    }
  );
};

export default plugin;
