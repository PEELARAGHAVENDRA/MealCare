# Prisma Infrastructure

The canonical Prisma schema lives at `services/api/prisma/schema.prisma` so the API service can run Prisma commands from its package context.

This folder keeps deployment-facing database artifacts:

- `init.sql`: SQL review/export companion for cloud database provisioning.
- Future migration snapshots or DBA handoff files can be added here without coupling them to generated Prisma client output.
