import prisma from "../config/prisma.js";

export const createGame = async (gameData: any) => {
  // Accepter les anciens ET nouveaux noms de champs pour la rétro-compatibilité
  const { 
    publisherId,
    game_publisher_id, // Ancien nom du frontend
    name, 
    typeId,
    type, // Ancien nom (string) - on cherchera le type par label
    minAge,
    min_age, // Ancien nom
    maxPlayers,
    max_players, // Ancien nom
    minPlayers,
    duration,
    imageUrl,
    logo_url, // Ancien nom
    noticeUrl,
    videoUrl,
    prototype,
    theme,
    description,
    mechanisms
  } = gameData;

  // Utiliser les anciens noms si les nouveaux ne sont pas fournis
  const finalPublisherId = publisherId || game_publisher_id;
  const finalMinAge = minAge || min_age;
  const finalMaxPlayers = maxPlayers || max_players;
  const finalImageUrl = imageUrl || logo_url;
  
  // Si 'type' est un string (ancien format), chercher le typeId correspondant
  let finalTypeId = typeId;
  if (!finalTypeId && type && typeof type === 'string') {
    const foundType = await prisma.gameType.findFirst({
      where: { label: type }
    });
    finalTypeId = foundType?.id;
  }

  // Vérification de l'éditeur
  if (finalPublisherId) {
    const existingPublisher = await prisma.gamePublisher.findUnique({
      where: { id: finalPublisherId },
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
      publisherId: finalPublisherId || undefined,
    },
  });

  if (existingGame) {
    throw new Error('A game with the same name already exists for this publisher.');
  }

  const newGame = await prisma.game.create({
    data: {
      name,
      publisherId: finalPublisherId,
      typeId: finalTypeId,
      minAge: finalMinAge,
      maxPlayers: finalMaxPlayers,
      minPlayers,
      duration,
      imageUrl: finalImageUrl,
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

  // Retourner au format attendu par le frontend
  return {
    id: newGame.id,
    name: newGame.name,
    type: newGame.type?.label || '',
    min_age: newGame.minAge,
    max_players: newGame.maxPlayers,
    logo_url: newGame.imageUrl,
    game_publisher_id: newGame.publisherId,
    publisher: newGame.publisher ? {
      id: newGame.publisher.id,
      name: newGame.publisher.name,
      logoUrl: newGame.publisher.logoUrl
    } : undefined
  };
};

export const updateGame = async (id: number, gameData: any) => {
  const { 
    publisherId,
    game_publisher_id,
    name, 
    typeId,
    type,
    minAge,
    min_age,
    maxPlayers,
    max_players,
    minPlayers,
    duration,
    imageUrl,
    logo_url,
    noticeUrl,
    videoUrl,
    prototype,
    theme,
    description,
    mechanisms
  } = gameData;

  // Utiliser les anciens noms si les nouveaux ne sont pas fournis
  const finalPublisherId = publisherId || game_publisher_id;
  const finalMinAge = minAge || min_age;
  const finalMaxPlayers = maxPlayers || max_players;
  const finalImageUrl = imageUrl || logo_url;
  
  // Si 'type' est un string (ancien format), chercher le typeId correspondant
  let finalTypeId = typeId;
  if (!finalTypeId && type && typeof type === 'string') {
    const foundType = await prisma.gameType.findFirst({
      where: { label: type }
    });
    finalTypeId = foundType?.id;
  }

  const existingGame = await prisma.game.findUnique({
    where: { id },
  });

  if (!existingGame) {
    throw new Error('Game not found');
  }

  if (finalPublisherId) {
    const existingPublisher = await prisma.gamePublisher.findUnique({
      where: { id: finalPublisherId },
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

  if (name || finalPublisherId) {
    const duplicateGame = await prisma.game.findFirst({
      where: {
        name: name ?? existingGame.name,
        publisherId: finalPublisherId ?? existingGame.publisherId,
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
      publisherId: finalPublisherId,
      typeId: finalTypeId,
      minAge: finalMinAge,
      maxPlayers: finalMaxPlayers,
      minPlayers,
      duration,
      imageUrl: finalImageUrl,
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

  // Retourner au format attendu par le frontend
  return {
    id: updatedGame.id,
    name: updatedGame.name,
    type: updatedGame.type?.label || '',
    min_age: updatedGame.minAge,
    max_players: updatedGame.maxPlayers,
    logo_url: updatedGame.imageUrl,
    game_publisher_id: updatedGame.publisherId,
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

