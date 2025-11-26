import prisma from "../config/prisma.js";

export const createGame = async (gameData: any) => {
  const { game_publisher_id, name, type, min_age, logo_url } = gameData;

  const existingPublisher = await prisma.game_Publisher.findUnique({
    where: {
      id: game_publisher_id,
    },
  });

  if (!existingPublisher) {
    throw new Error('The specified game publisher does not exist.');
  }

  const existingGame = await prisma.game.findFirst({
    where: {
      name,
      game_publisher_id,
    },
  });

  if (existingGame) {
    throw new Error('A game with the same name already exists for this publisher.');
  }

  const newGame = await prisma.game.create({
    data: {
      game_publisher_id,
      name,
      type,
      min_age,
      logo_url,
    },
  });

  return newGame;
};