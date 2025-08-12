"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
// JWKS client for Auth0
const client = (0, jwks_rsa_1.default)({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    requestHeaders: {}, // Optional
    timeout: 30000, // Defaults to 30s
});
// Function to get signing key
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}
// JWT verification options
const jwtOptions = {
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
};
// Auth middleware
async function authenticate(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            });
        }
        const token = authHeader.substring(7);
        // Verify JWT token
        const decoded = await new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, getKey, jwtOptions, (err, decoded) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(decoded);
                }
            });
        });
        // Attach user to request
        request.user = decoded;
        // Log authentication for debugging
        console.log(`✅ Authenticated user: ${request.user?.email} (${request.user?.sub})`);
    }
    catch (error) {
        console.error('🔒 Authentication failed:', error);
        return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }
}
// Role-based authorization
function requireRole(roles) {
    return async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }
        const userRoles = request.user['https://aips.app/roles'] || ['operator'];
        const hasRequiredRole = roles.some(role => userRoles.includes(role));
        if (!hasRequiredRole) {
            console.log(`❌ Access denied for user ${request.user.email}. Required: ${roles.join(', ')}, Has: ${userRoles.join(', ')}`);
            return reply.status(403).send({
                error: 'Forbidden',
                message: `Insufficient permissions. Required roles: ${roles.join(', ')}`
            });
        }
        console.log(`✅ Access granted for user ${request.user.email} with roles: ${userRoles.join(', ')}`);
    };
}
// Optional authentication (for public endpoints that benefit from user context)
async function optionalAuth(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = await new Promise((resolve, reject) => {
                jsonwebtoken_1.default.verify(token, getKey, jwtOptions, (err, decoded) => {
                    if (err) {
                        // Don't reject for optional auth, just log
                        console.log('Optional auth failed:', err.message);
                        resolve(null);
                    }
                    else {
                        resolve(decoded);
                    }
                });
            });
            if (decoded) {
                request.user = decoded;
            }
        }
    }
    catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth error:', error);
    }
}
