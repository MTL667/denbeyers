import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create owner user (Nick) - this will be linked to Keycloak on first login
  const ownerUser = await prisma.user.upsert({
    where: { keycloakSub: 'owner-placeholder' },
    update: {},
    create: {
      keycloakSub: 'owner-placeholder',
      name: 'Nick',
      role: Role.OWNER,
    },
  })

  console.log('✅ Created owner user:', ownerUser.name)

  // Note: In production, users will be created automatically on Keycloak login
  // The owner's keycloakSub should be updated after first Keycloak login

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

