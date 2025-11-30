import prisma from "../config/prisma.js";

export const createGamePublisher = async (publisherData: any) => {
  const { name, logo } = publisherData;

  // Check if a publisher with the same name already exists
  const existingPublisher = await prisma.game_Publisher.findUnique({
    where: {
      name,
    },
  });

  if (existingPublisher) {
    throw new Error('This game publisher already exists.');
  }

  // Create a new game publisher
  const newPublisher = await prisma.game_Publisher.create({
    data: {
      name,
      logo,
    },
  });

  return newPublisher;
};

export const updateGamePublisher = async (id: number, publisherData: any) => {
  const { name, logo } = publisherData;

  const existingPublisher = await prisma.game_Publisher.findUnique({
    where: { id },
  });

  if (!existingPublisher) {
    throw new Error('Game publisher not found');
  }

  if (name) {
    const duplicatePublisher = await prisma.game_Publisher.findFirst({
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

  const updatedPublisher = await prisma.game_Publisher.update({
    where: { id },
    data: {
      name,
      logo,
    },
  });

  return updatedPublisher;
};

export const deleteGamePublisher = async (id: number) => {
  const existingPublisher = await prisma.game_Publisher.findUnique({
    where: { id },
  });

  if (!existingPublisher) {
    throw new Error('Game publisher not found');
  }

  await prisma.game_Publisher.delete({
    where: { id },
  });
};

export const getAllGamePublishers = async () => {
  return await prisma.game_Publisher.findMany({
    include: { games: true }, // Charge les jeux associés
    orderBy: { name: 'asc' }
  });
};

export const getGamePublisherById = async (id: number) => {
  const publisher = await prisma.game_Publisher.findUnique({
    where: { id },
    include: { games: true }
  });
  if (!publisher) throw new Error('Publisher not found');
  return publisher;
};