import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { asyncHandler } from './utils/asyncHandler';
import { db } from '../prismaClient';
import { signinSchema, signupSchema } from './types/AuthSchema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './authMiddleware';
import { lastReadSchema } from './types/LastReadSchema';


dotenv.config();

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
}));

interface AuthenticatedRequest extends Request {
    userId?: number;
}

app.post("/api/auth/signup",
    asyncHandler(async (req: Request, res: Response) => {
        const { name, email, password } = signupSchema.parse(req.body);
        const userExists = await db.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await db.user.create({
            data: {
                username: name,
                email,
                password: hashedPassword,
            }
        });
        res.status(201).json({ user });
    })
);

app.post("/api/auth/signin",
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = signinSchema.parse(req.body);
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const userId = user.id;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '24h' });
        res.json({ token });
    })
);

app.get("/api/users",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthenticatedRequest).userId;
        const { search = "", page = 1, limit = 15 } = req.query;

        const pageNumber = parseInt(page as string, 10) || 1;
        const pageSize = parseInt(limit as string, 10) || 15;
        const skip = (pageNumber - 1) * pageSize;

        try {
            const users = await db.user.findMany({
                where: {
                    username: {
                        contains: search as string,
                        mode: "insensitive",
                    },
                },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    username: true,
                }
            });

            const updatedUsers = users.filter((user) => user.id !== userId);  

            res.status(200).json(updatedUsers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    })
);

app.get("/api/requests",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const id = (req as AuthenticatedRequest).userId;

        try {
            const requestReceived = await db.user.findUnique({
                where: {
                    id,
                },
                select: {
                    groupRequestReceived: {
                        where: {
                            status: "PENDING",
                        },
                        select: {
                            inviter: {
                                select: {
                                    id: true,
                                    username: true,
                                }
                            },
                            groupId: true,
                            id: true,
                            status: true,
                        }
                    }
                }
            })

            const requestSent = await db.user.findUnique({
                where: {
                    id,
                },
                select: {
                    groupRequestSent: {
                        where: {
                            status: "PENDING",
                        },
                        select: {
                            invitee: {
                                select: {
                                    id: true,
                                    username: true,
                                }
                            },
                            groupId: true,
                            id: true,
                            status: true,
                        }
                    }
                }
            })

            const updatedRequestReceived = requestReceived?.groupRequestReceived.map((req) => ({ requestId: req.id, groupId: req.groupId, userId: req.inviter.id, username: req.inviter.username, status: req.status }));
            const updatedRequestSent = requestSent?.groupRequestSent.map((req) => ({ requestId: req.id, groupId: req.groupId, userId: req.invitee.id, username: req.invitee.username, status: req.status }));

            const requests = { requestReceived: updatedRequestReceived, requestSent: updatedRequestSent }

            res.status(200).json(requests);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch requests" });
        }
    })
);

app.get("/api/group",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.query;

        try {
            const group = await db.group.findUnique({
                where: {
                    id: Number(id),
                },
                select: {
                    users: {
                        select: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                }
                            }
                        }
                    },
                    groupSize: true,
                    name: true,
                    createdAt: true,
                }
            })

            const members = group?.users.map((u) => ({ id: u.user.id, username: u.user.username }));
            res.status(200).json({ name: group?.name, members, size: group?.groupSize, createdAt: group?.createdAt });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch group" });
        }
    })
);

app.get("/api/profile",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const id = (req as AuthenticatedRequest).userId;

        try {
            const user = await db.user.findUnique({
                where: {
                    id: Number(id),
                },
                select: {
                    username: true,
                    email: true,
                    notificationPermission: true,
                    theme: true,
                }
            })

            res.status(200).json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to fetch group" });
        }
    })
);


app.get("/api/messages",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const id = (req as AuthenticatedRequest).userId;
        const { groupId, page } = req.query;
        if (!groupId || !page) {
            return res.status(400).json({ error: "Group ID and page number are required." });
        }

        const pageNumber = parseInt(page as string, 10) || 1;
        const pageSize = 15;
        const skip = (pageNumber - 1) * pageSize;

        try {
            // Find the user's join date for the group
            const userGroup = await db.usersInGroup.findFirst({
                where: {
                    userId: Number(id),
                    groupId: Number(groupId),
                }
            });

            if (!userGroup) {
                return res.status(404).json({ error: "User is not part of this group." });
            }

            const joinDate = userGroup.joinedAt;

            // Fetch messages sent after the join date
            const messages = await db.message.findMany({
                where: {
                  groupId: Number(groupId),
                  createdAt: {
                    gte: joinDate, // Messages sent after or on the join date
                  },
                },
                orderBy: {
                  createdAt: 'desc', // Newest messages first
                },
                skip: skip, // Number of messages to skip for pagination
                take: pageSize, // Limit to the batch size
                select: {
                    content: true,
                    sender: true,
                    createdAt: true,
                    groupId: true,
                    type: true,
                    taggedBy: true,
                    taggedMessages: true,
                }
              });
              
              const updatedMessage = messages.map((msg) => ({ groupId: msg.groupId.toString(), randomUserId: msg.sender, message: msg.content, timeStamp: msg.createdAt, isReceived: true, type: msg.type, taggedBy: msg.taggedBy, taggedMessage: msg.taggedMessages }));

            return res.json(updatedMessage);
        } catch (error) {
            console.error("Error fetching messages:", error);
            return res.status(500).json({ error: "Failed to fetch messages." });
        }
    })
);

app.post("/api/updateLastRead",
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const id = (req as AuthenticatedRequest).userId;
        const { gId, end } = lastReadSchema.parse(req.body);
        console.log(gId);
        console.log(end);
        if (!gId || !end) {
            return res.status(400).json({ error: "Group ID and time are required." });
        }

        try {
            await db.usersInGroup.update({
                where: {
                    userId_groupId: {
                        userId: Number(id),
                        groupId: Number(gId),
                    },
                },
                data: {
                    lastRead: new Date(Number(end)),
                }
            })
            console.log("Update successfull");
            res.status(200);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to update last read" });
        }
    })
);

const errorHandler: ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error(err.stack);

    if (err.name === 'ZodError') {
        res.status(400).json({ message: err.errors.map((error: any) => error.message) });
        return; // End the request-response cycle
    }

    res.status(500).json({
        message: 'Internal Server Error',
    });

    return; // End the request-response cycle
};

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});






