-- Infraestructura técnica de prueba, sin datos ni tablas comerciales.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "PersistenceProbe" (
    "id" UUID NOT NULL,
    "message" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersistenceProbe_pkey" PRIMARY KEY ("id")
);
