-- CreateTable
CREATE TABLE "EncryptedState" (
    "id" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "publicData" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,
    "authorPublicSigningKey" TEXT NOT NULL,
    "authorSignature" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,

    CONSTRAINT "EncryptedState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Key" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lockbox" (
    "id" TEXT NOT NULL,
    "receiverSigningPublicKey" TEXT NOT NULL,
    "senderLockboxPublicKey" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,

    CONSTRAINT "Lockbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "lastEventHash" TEXT NOT NULL,
    "serializedState" JSONB NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "publicSigningKey" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("publicSigningKey")
);

-- CreateTable
CREATE TABLE "AuthenticationChallenge" (
    "nonce" TEXT NOT NULL,
    "userPublicSigningKey" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthenticationChallenge_pkey" PRIMARY KEY ("nonce")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "content" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventProposal" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "EventProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EncryptedStateToLockbox" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_OrganizationToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EncryptedState_organizationId_authorPublicSigningKey_key" ON "EncryptedState"("organizationId", "authorPublicSigningKey");

-- CreateIndex
CREATE UNIQUE INDEX "Lockbox_keyId_receiverSigningPublicKey_key" ON "Lockbox"("keyId", "receiverSigningPublicKey");

-- CreateIndex
CREATE UNIQUE INDEX "_EncryptedStateToLockbox_AB_unique" ON "_EncryptedStateToLockbox"("A", "B");

-- CreateIndex
CREATE INDEX "_EncryptedStateToLockbox_B_index" ON "_EncryptedStateToLockbox"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OrganizationToUser_AB_unique" ON "_OrganizationToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_OrganizationToUser_B_index" ON "_OrganizationToUser"("B");

-- AddForeignKey
ALTER TABLE "EncryptedState" ADD CONSTRAINT "EncryptedState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedState" ADD CONSTRAINT "EncryptedState_authorPublicSigningKey_fkey" FOREIGN KEY ("authorPublicSigningKey") REFERENCES "User"("publicSigningKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EncryptedState" ADD CONSTRAINT "EncryptedState_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lockbox" ADD CONSTRAINT "Lockbox_receiverSigningPublicKey_fkey" FOREIGN KEY ("receiverSigningPublicKey") REFERENCES "User"("publicSigningKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lockbox" ADD CONSTRAINT "Lockbox_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "Key"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationChallenge" ADD CONSTRAINT "AuthenticationChallenge_userPublicSigningKey_fkey" FOREIGN KEY ("userPublicSigningKey") REFERENCES "User"("publicSigningKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventProposal" ADD CONSTRAINT "EventProposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncryptedStateToLockbox" ADD FOREIGN KEY ("A") REFERENCES "EncryptedState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncryptedStateToLockbox" ADD FOREIGN KEY ("B") REFERENCES "Lockbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToUser" ADD FOREIGN KEY ("A") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrganizationToUser" ADD FOREIGN KEY ("B") REFERENCES "User"("publicSigningKey") ON DELETE CASCADE ON UPDATE CASCADE;
