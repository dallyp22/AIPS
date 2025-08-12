import { prisma } from "./src/prisma.js"; console.log("Models:", Object.keys(prisma).filter(k => k[0] !== "_" && k[0] !== "$").sort());
