import prisma from "../config/prisma.js";

export const createGame = async (gameData: any) => {
  const { 
    publisherId, // Renommé de game_publisher_id
    name, 
    typeId, // Renommé de type (qui était un string, maintenant une relation)
    minAge, // Renommé de min_age
    maxPlayers, // Renommé de max_players
    minPlayers, // Nouveau champ
    duration, // Nouveau champ
    imageUrl, // Renommé de logo_url
    noticeUrl, // Nouveau champ
    videoUrl, // Nouveau champ
    prototype, // Nouveau champ
    theme, // Nouveau champ
    description, // Nouveau champ
    mechanisms // Array of IDs
  } = gameData;

  // Vérification de l'éditeur
  if (publisherId) {
    const existingPublisher = await prisma.gamePublisher.findUnique({
      where: { id: publisherId },
    });

    if (!existingPublisher) {
      throw new Error('The specified game publisher does not exist.');
    }
  }

  // Vérification du type de jeu
  if (typeId) {
    const existingType = await prisma.gameType.findUnique({
      where: { id: typeId },
    });

    if (!existingType) {
      throw new Error('The specified game type does not exist.');
    }
  }

  // Vérification doublon (Nom + Éditeur)
  const existingGame = await prisma.game.findFirst({
    where: {
      name,
      publisherId: publisherId || undefined, // undefined si null pour éviter erreur Prisma
    },
  });

  if (existingGame) {
    throw new Error('A game with the same name already exists for this publisher.');
  }

  const newGame = await prisma.game.create({
    data: {
      name,
      publisherId,
      typeId,
      minAge,
      maxPlayers,
      minPlayers,
      duration,
      imageUrl,
      noticeUrl,
      videoUrl,
      prototype: prototype || false,
      theme,
      description,
      mechanisms: mechanisms && mechanisms.length > 0 ? {
        connect: mechanisms.map((id: number) => ({ id: Number(id) }))
      } : undefined,
    },
    include: {
      publisher: true,
      type: true,
      mechanisms: true
    },
  });

  return newGame;
};

export const updateGame = async (id: number, gameData: any) => {
  const { 
    publisherId, 
    name, 
    typeId, 
    minAge, 
    maxPlayers, 
    minPlayers,
    duration,
    imageUrl,
    noticeUrl,
    videoUrl,
    prototype,
    theme,
    description,
    mechanisms
  } = gameData;

  const existingGame = await prisma.game.findUnique({
    where: { id },
  });

  if (!existingGame) {
    throw new Error('Game not found');
  }

  if (publisherId) {
    const existingPublisher = await prisma.gamePublisher.findUnique({
      where: { id: publisherId },
    });

    if (!existingPublisher) {
      throw new Error('The specified game publisher does not exist.');
    }
  }

  if (typeId) {
    const existingType = await prisma.gameType.findUnique({
      where: { id: typeId },
    });

    if (!existingType) {
      throw new Error('The specified game type does not exist.');
    }
  }

  if (name || publisherId) {
    const duplicateGame = await prisma.game.findFirst({
      where: {
        name: name ?? existingGame.name,
        publisherId: publisherId ?? existingGame.publisherId,
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
      name,
      publisherId,
      typeId,
      minAge,
      maxPlayers,
      minPlayers,
      duration,
      imageUrl,
      noticeUrl,
      videoUrl,
      prototype,
      theme,
      description,
      mechanisms: mechanisms ? {
        set: mechanisms.map((id: number) => ({ id: Number(id) }))
      } : undefined,
    },
    include: {
      publisher: true,
      type: true,
      mechanisms: true
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

export const getAllGames = async () => {
  return await prisma.game.findMany({
    include: {
      publisher: true // Important pour afficher le nom de l'éditeur dans la carte
    }
  });
};

export const getGameById = async (id: number) => {
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      publisher: true
    }
  });
  if (!game) throw new Error('Game not found');
  return game;
};

