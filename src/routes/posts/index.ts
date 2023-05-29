import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return fastify.db.posts.findMany()
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | null> {
      try {
        const res = await fastify.db.posts.findOne({ key: 'id', equals: request.params.id });
        return res ? res : (reply.code(404).send({ message: 'Not found' }), null);
      } catch (error) {
        reply.code(500).send({ message: 'Server Error' });
        return null;
      }
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return fastify.db.posts.create(request.body);
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
    async function (request, reply): Promise<PostEntity> {
      try {
        return fastify.db.posts.delete(request.params.id)
      } catch (error) {
        console.error(error);
        reply.code(400).send({ message: 'Bad Request' });
        throw error;
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return fastify.db.posts.change(request.params.id, request.body)
      } catch (error) {
        console.error(error);
        reply.code(400).send({ message: 'Bad Request' });
        throw error;
      }
    }
  );
};

export default plugin;
