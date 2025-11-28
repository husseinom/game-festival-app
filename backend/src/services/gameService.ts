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

export const updateGame = async (id: number, gameData: any) => {
  const { game_publisher_id, name, type, min_age, logo_url } = gameData;

  const existingGame = await prisma.game.findUnique({
    where: { id },
  });

  if (!existingGame) {
    throw new Error('Game not found');
  }

  if (game_publisher_id) {
    const existingPublisher = await prisma.game_Publisher.findUnique({
      where: {
        id: game_publisher_id,
      },
    });

    if (!existingPublisher) {
      throw new Error('The specified game publisher does not exist.');
    }
  }

  if (name || game_publisher_id) {
    const duplicateGame = await prisma.game.findFirst({
      where: {
        name: name ?? existingGame.name,
        game_publisher_id: game_publisher_id ?? existingGame.game_publisher_id,
        NOT: {
          id: id,
        },
      },
    });

    if (duplicateGame) {
      throw new Error('A game with the same name already exists for this publisher.');
    }
  }

  const updatedGame = await prisma.game.update({
    where: { id },
    data: {
      game_publisher_id,
      name,
      type,
      min_age,
      logo_url,
    },
  });

  return updatedGame;
};

export const deleteGame = async (id: number) => {
  const existingGame = await prisma.game.findUnique({
    where: { id },
  });

  if (!existingGame) {
    throw new Error('Game not found');
  }

  await prisma.game.delete({
    where: { id },
  });
};