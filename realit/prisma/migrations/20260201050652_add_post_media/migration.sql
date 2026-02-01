/*
  Warnings:

  - You are about to drop the column `caption` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `media_type` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `media_url` on the `posts` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('pending', 'uploaded', 'processing', 'active', 'failed');

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "caption",
DROP COLUMN "media_type",
DROP COLUMN "media_url",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "heading" TEXT;

-- CreateTable
CREATE TABLE "post_media" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "position" INTEGER NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'pending',
    "size_bytes" BIGINT NOT NULL,
    "object_key" TEXT NOT NULL,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
