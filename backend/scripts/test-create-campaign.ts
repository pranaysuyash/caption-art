import { PrismaClient } from '@prisma/client'

async function run() {
  const prisma = new PrismaClient()
  try {
    const workspace = await prisma.workspace.findFirst()
    const brandKit = await prisma.brandKit.findFirst()
    console.log({ workspaceId: workspace?.id, brandKitId: brandKit?.id })
    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: workspace?.id as string,
        brandKitId: brandKit?.id as string,
        name: 'Test campaign script',
        description: 'Creating via script',
        callToAction: 'Shop now',
        primaryOffer: 'Intro offer',
        targetAudience: 'Segment A',
        briefData: {
          objective: 'awareness',
          launchType: 'new-launch',
          funnelStage: 'cold',
          placements: ['ig-feed'],
        },
      },
    })
    console.log('Created campaign', campaign.id)
  } catch (err) {
    console.error('Error creating campaign', err)
  } finally {
    await prisma.$disconnect()
  }
}

run()
