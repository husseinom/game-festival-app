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