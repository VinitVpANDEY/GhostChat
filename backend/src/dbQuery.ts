import { db } from "./prismaClient";

export async function createGroupDB(userId: string, name: string) {
    try {
        const group = await db.group.create({
            data: {
                name,
                groupSize: 1,
            }
        })

        await db.usersInGroup.create({
            data: {
                userId: Number(userId),
                groupId: group.id
            }
        })

        return group;        
    } catch (error) {
        console.error("Error creating group:", error);
    }
}


export async function joinGroupDB(userId: string, groupId: string) {
    try {
        const existingMembership = await db.usersInGroup.findUnique({
            where: {
                userId_groupId: { userId: Number(userId), groupId: Number(groupId) }, // Use the composite unique constraint
            },
        });


        if (existingMembership) {
            console.log("User is already a member of this group.");
            return; // Exit early if the user is already in the group
        }

        await db.$transaction([
            // Add the user to the group
            db.usersInGroup.create({
                data: {
                    userId: Number(userId),
                    groupId: Number(groupId),
                },
            }),

            // Increment the group size
            db.group.update({
                where: {
                    id: Number(groupId),
                },
                data: {
                    groupSize: { increment: 1 }, // Increment size by 1
                },
            }),
        ]);

        console.log("User added and group size updated.");
    } catch (error) {
        console.error("Error adding record:", error);
    }
}


export async function leaveGroupDB(userId: string, groupId: string) {
    try {
        await db.$transaction(async (transaction) => {
            // Remove the user from the group
            await transaction.usersInGroup.delete({
                where: {
                    userId_groupId: {
                        userId: Number(userId),
                        groupId: Number(groupId),
                    },
                },
            });

            // Remove all pending request send by this user on this group
            await transaction.groupInvite.deleteMany({
                where: {
                    inviterId: Number(userId),
                    groupId: Number(groupId),
                    status: "PENDING",
                }                
            });

            // Fetch the updated group size
            const group = await transaction.group.update({
                where: {
                    id: Number(groupId)
                },
                data: {
                    groupSize: { decrement: 1 }, // Decrement size by 1
                },
                select: {
                    groupSize: true,  // Get the updated size
                },
            });

            // If group size is 0, delete the group
            if (group.groupSize === 0) {
                await transaction.group.delete({
                    where: { id: Number(groupId) },
                });
                console.log("Group deleted as no members remained.");
            } else {
                console.log("User removed, and group size updated.");
            }

            // TODO : Remove these front end in realtime
            await transaction.groupInvite.deleteMany({
                where: {
                    groupId: Number(groupId),
                    OR: [
                        { inviterId: Number(userId) },
                        { inviteeId: Number(userId) },
                    ],
                }
            });

            
        });
    } catch (error) {
        console.error("Error removing user from group:", error);
    }
}

export async function getGroups(userId: string) {
    try {
        const groups = await db.usersInGroup.findMany({
            where: {
                userId: Number(userId),
            },
            select: {
                lastRead: true,
                group: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        })

        const updatedGroups = await Promise.all(
            groups.map(async (groupDetails) => ({
              id: groupDetails.group.id,
              groupName: groupDetails.group.name,
              count: await db.message.count({
                where: {
                  groupId: groupDetails.group.id,
                  createdAt: {
                    gte: groupDetails.lastRead,
                  },
                },
              }),
            }))
          ) || [];
          

        return updatedGroups;
    } catch (error) {
        console.error("Error fetching groups", error);
    }
}

export async function inviteFriendDB(senderId: string, receiverId: string, groupId: string){
    try {
        const request = await db.groupInvite.findFirst({
            where: {
                groupId: Number(groupId),
                inviteeId: Number(receiverId),
                OR: [
                    { status: "ACCEPTED" },
                    { status: "PENDING" }
                ]
            }
        });

        if(!request){
            const inviteRequest = db.groupInvite.create({
                data: {
                    groupId: Number(groupId),
                    inviterId: Number(senderId),
                    inviteeId: Number(receiverId),
                }
            })

            console.log("Request sent successfully.");
            return inviteRequest;
        }
        else{
            console.log("Request already sent earlier");
            return;
        }
    } catch (error) {
        console.error("Error sending request", error);
    }
}

export async function updateRequestStatusDB(requestId: string, status: string){
    try {
        console.log("Updating request status");
        const id = parseInt(requestId, 10);
        const req = await db.groupInvite.update({
            where: {
                id,
            },
            data: {
                status,
            }
        })
        console.log(req);
    } catch (error) {
        console.error("Error updating status", error);
    }
}

export async function getMessagesBatchDB(groupId: number, batchSize: number, beforeTimestamp: Date) {
    const messages = await db.message.findMany({
      where: {
        groupId, 
        createdAt: {
          lt: beforeTimestamp, // Fetch messages before the given timestamp
        },
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date descending
      },
      take: batchSize, // Limit the number of messages fetched
    });
  
    return messages;
  }


export async function getUsersDB(search: string, page: number){
  const take = 15;
  const skip = (parseInt(page as unknown as string, 10) - 1) * take;

  try {
    const users = await db.user.findMany({
      where: {
        username: {
          contains: search as string,
          mode: "insensitive",
        },
      },
      skip,
      take,
      select: {
        id: true,
        username: true,
      },
    });

    const total = await db.user.count({
      where: {
        username: {
          contains: search as string,
          mode: "insensitive",
        },
      },
    });

    return { users, total, page: parseInt(page as unknown as string, 10), limit: take };
  } catch (error) {
        console.error("Error fetching users", error);
  }
}

export async function getGroupDB(groupId: string){
    try {
        const group = await db.group.findUnique({
            where: {
                id: Number(groupId),
            },
            select: {
                name: true,
            }
        })
        return group?.name;

    } catch (error) {
        console.error("Error fetching group", error);
    }
}


export async function addMessageDB(groupId: string, sender: string, message: string, createdAt: Date, type: string, taggedBy ?: string, taggedMessage?: string){ 
    try {
        await db.message.create({
            data: {
                content: message,
                createdAt,
                sender,
                groupId: Number(groupId),
                type,
                taggedBy,
                taggedMessages: taggedMessage,
            }
        });
    } catch (error) {
        console.error("Error adding message", error);
    }
}   

export async function getUserDB(id: string){
    try {
        const user = await db.user.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                username: true,
            }
        })
        return user?.username;

    } catch (error) {
        console.error("Error fetching user", error);
    }
}
