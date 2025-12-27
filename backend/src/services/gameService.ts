import prisma from "../config/prisma.js";

export const createGame = async (gameData: any) => {
  const { 
    publisherId: inputPublisherId,
    name, 
    typeId,
    type,
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

  // Si 'type' est un string, chercher le typeId correspondant
  let finalTypeId = typeId;
  if (!finalTypeId && type && typeof type === 'string') {
    const foundType = await prisma.gameType.findFirst({
      where: { 
        label: {
          equals: type,
          mode: 'insensitive'
        }
      }
    });
    if (foundType) {
      finalTypeId = foundType.id;
    } else {
      throw new Error(`Game type "${type}" does not exist. Available types: Tout public, Ambiance, Experts, Enfants, Classiques, Initiés, Jeu de rôle`);
    }
  }

  // Vérification de l'éditeur
  if (inputPublisherId) {
    const existingPublisher = await prisma.gamePublisher.findUnique({
      where: { id: inputPublisherId },
    });

    if (!existingPublisher) {
      throw new Error('The specified game publisher does not exist.');
    }
  }

  // Vérification du type de jeu
  if (finalTypeId) {
    const existingType = await prisma.gameType.findUnique({
      where: { id: finalTypeId },
    });

    if (!existingType) {
      throw new Error('The specified game type does not exist.');
    }
  }

  // Vérification doublon (Nom + Éditeur)
  const existingGame = await prisma.game.findFirst({
    where: {
      name,
      publisherId: inputPublisherId || undefined,
    },
  });

  if (existingGame) {
    throw new Error('A game with the same name already exists for this publisher.');
  }

  const newGame = await prisma.game.create({
    data: {
      name,
      publisherId: inputPublisherId,
      typeId: finalTypeId,
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
        connect: mechanisms.map((mechId: number) => ({ id: Number(mechId) }))
      } : undefined,
    },
    include: {
      publisher: true,
      type: true,
      mechanisms: true
    },
  });

  // Retourner en camelCase
  return {
    id: newGame.id,
    name: newGame.name,
    type: newGame.type?.label || '',
    minAge: newGame.minAge,
    maxPlayers: newGame.maxPlayers,
    imageUrl: newGame.imageUrl,
    publisherId: newGame.publisherId,
    publisher: newGame.publisher ? {
      id: newGame.publisher.id,
      name: newGame.publisher.name,
      logoUrl: newGame.publisher.logoUrl
    } : undefined
  };
};

export const updateGame = async (id: number, gameData: any) => {
  const { 
    publisherId: inputPublisherId,
    name, 
    typeId,
    type,
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

  // Si 'type' est un string, chercher le typeId correspondant
  let finalTypeId = typeId;
  if (!finalTypeId && type && typeof type === 'string') {
    const foundType = await prisma.gameType.findFirst({
      where: { 
        label: {
          equals: type,
          mode: 'insensitive'
        }
      }
    });
    if (foundType) {
      finalTypeId = foundType.id;
    } else {
      throw new Error(`Game type "${type}" does not exist. Available types: Tout public, Ambiance, Experts, Enfants, Classiques, Initiés, Jeu de rôle`);
    }
  }

  const existingGame = await prisma.game.findUnique({
    where: { id },
  });

  if (!existingGame) {
    throw new Error('Game not found');
  }

  if (inputPublisherId) {
    const existingPublisher = await prisma.gamePublisher.findUnique({
      where: { id: inputPublisherId },
    });

    if (!existingPublisher) {
      throw new Error('The specified game publisher does not exist.');
    }
  }

  if (finalTypeId) {
    const existingType = await prisma.gameType.findUnique({
      where: { id: finalTypeId },
    });

    if (!existingType) {
      throw new Error('The specified game type does not exist.');
    }
  }

  if (name || inputPublisherId) {
    const duplicateGame = await prisma.game.findFirst({
      where: {
        name: name ?? existingGame.name,
        publisherId: inputPublisherId ?? existingGame.publisherId,
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
      publisherId: inputPublisherId,
      typeId: finalTypeId,
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
        set: mechanisms.map((mechId: number) => ({ id: Number(mechId) }))
      } : undefined,
    },
    include: {
      publisher: true,
      type: true,
      mechanisms: true
    },
  });

  // Retourner en camelCase
  return {
    id: updatedGame.id,
    name: updatedGame.name,
    type: updatedGame.type?.label || '',
    minAge: updatedGame.minAge,
    maxPlayers: updatedGame.maxPlayers,
    imageUrl: updatedGame.imageUrl,
    publisherId: updatedGame.publisherId,
    publisher: updatedGame.publisher ? {
      id: updatedGame.publisher.id,
      name: updatedGame.publisher.name,
      logoUrl: updatedGame.publisher.logoUrl
    } : undefined
  };
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

