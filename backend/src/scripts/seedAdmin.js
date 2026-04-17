import { config } from '../config.js'
import { prisma } from '../db.js'
import { hashPassword } from '../utils/password.js'

async function main() {
  const email = String(config.adminEmail || '').trim().toLowerCase()
  const password = String(config.adminInitialPassword || '')

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD are required')
  }

  if (password.length < 8) {
    throw new Error('ADMIN_INITIAL_PASSWORD must be at least 8 characters')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const user = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    })
    console.log(`Admin already exists, ensured active admin role: ${user.email}`)
    return
  }

  const user = await prisma.user.create({
    data: {
      email,
      role: 'ADMIN',
      status: 'ACTIVE',
      passwordHash: await hashPassword(password),
    },
  })

  console.log(`Created admin user: ${user.email}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
