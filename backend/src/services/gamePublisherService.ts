import prisma from "../config/prisma.js";

export const createGamePublisher = async (publisherData: any) => {
  // Adaptation aux nouveaux champs : logoUrl, exposant, distributeur
  const { name, logoUrl, logo, exposant, distributeur } = publisherData;
  
  // Rétro-compatibilité si le front envoie encore "logo"
  const finalLogoUrl = logoUrl || logo;

  // Check if a publisher with the same name already exists
  // Utilisation de findFirst car 'name' n'est pas unique dans le schéma CSV
  const existingPublisher = await prisma.gamePublisher.findFirst({
    where: {
      name,
    },
  });

  if (existingPublisher) {
    throw new Error('This game publisher already exists.');
  }

  // Create a new game publisher
  const newPublisher = await prisma.gamePublisher.create({
    data: {
      name,
      logoUrl: finalLogoUrl,
      exposant: exposant || false,
      distributeur: distributeur || false,
    },
  });

  return newPublisher;
};

export const updateGamePublisher = async (id: number, publisherData: any) => {
  const { name, logoUrl, logo, exposant, distributeur } = publisherData;
  const finalLogoUrl = logoUrl || logo;

  const existingPublisher = await prisma.gamePublisher.findUnique({
    where: { id },
  });

  if (!existingPublisher) {
    throw new Error('Game publisher not found');
  }

  if (name) {
    const duplicatePublisher = await prisma.gamePublisher.findFirst({
      where: {
        name,
        NOT: {
          id: id,
        },
      },
    });

    if (duplicatePublisher) {
      throw new Error('This game publisher already exists.');
    }
  }

  const updatedPublisher = await prisma.gamePublisher.update({
    where: { id },
    data: {
      name,
      logoUrl: finalLogoUrl,
      exposant,
      distributeur
    },
  });

  return updatedPublisher;
};

export const deleteGamePublisher = async (id: number) => {
  const existingPublisher = await prisma.gamePublisher.findUnique({
    where: { id },
  });

  if (!existingPublisher) {
    throw new Error('Game publisher not found');
  }

  await prisma.gamePublisher.delete({
    where: { id },
  });
};

export const getAllGamePublishers = async () => {
  return await prisma.gamePublisher.findMany({
    include: { games: true }, // Charge les jeux associés
    orderBy: { name: 'asc' }
  });
};

export const getGamePublisherById = async (id: number) => {
  const publisher = await prisma.gamePublisher.findUnique({
    where: { id },
    include: { games: true }
  });
  if (!publisher) throw new Error('Publisher not found');
  return publisher;
};