-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ai_conversations" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ai_messages" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "charges" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "consents" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "daily_spend_stats" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "detection_proposals" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "goals" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "insights" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "integration_connections" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "merchant_aliases" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notification_preferences" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "payment_methods" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "price_histories" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "raw_events" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "report_jobs" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
