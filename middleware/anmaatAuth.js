const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const ApiError = require('../utils/apiError');

const ANMAAT_API_URL = process.env.ANMAAT_API_URL;
const ANMAAT_JWT_SECRET = process.env.ANMAAT_JWT_SECRET;

// In-memory cache: token -> { user, expiresAt }
const userCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function extractToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return req.cookies?.token || null;
}

async function fetchUserPermissions(token) {
  if (!ANMAAT_API_URL) return [];
  try {
    const res = await axios.get(`${ANMAAT_API_URL}/api/user/auth/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    const body = res.data;
    return body?.data?.permissions || body?.permissions || [];
  } catch (err) {
    return [];
  }
}

async function fetchUserProfile(token) {
  if (!ANMAAT_API_URL) return null;
  try {
    const res = await axios.get(`${ANMAAT_API_URL}/api/user/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    });
    return res.data?.data || res.data || null;
  } catch (err) {
    return null;
  }
}

// @desc Verifies an anmat-issued JWT and hydrates req.user, req.subscriberId,
//       req.userType, req.permissions, req.token from the canonical anmat
//       backend. Falls back to local JWT decode if remote profile is unavailable.
exports.protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next(new ApiError('Authentication required', 401));
  }

  // Try cached identity first
  const cached = userCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    req.user = cached.user;
    req.userId = cached.user.userId;
    req.subscriberId = cached.user.subscriberId;
    req.userType = cached.user.type;
    req.permissions = cached.user.permissions;
    req.token = token;
    return next();
  }

  // Verify token signature using anmat JWT secret
  let decoded;
  try {
    decoded = jwt.verify(token, ANMAAT_JWT_SECRET);
  } catch (err) {
    return next(new ApiError('Invalid or expired token', 401));
  }

  const payload = decoded?.payload || decoded;
  const userId = payload?.user_id || payload?.userId || payload?._id;
  const userType = payload?.user_type || payload?.type;
  const email = payload?.user_email || payload?.email;

  if (!userId) {
    return next(new ApiError('Token payload is missing user identity', 401));
  }

  // Fetch fresh profile + permissions from anmat backend.
  const [profile, permissions] = await Promise.all([
    fetchUserProfile(token),
    fetchUserPermissions(token),
  ]);

  const resolvedType = profile?.type || userType;
  const subscriberId = profile?.subscriber_id
    ? String(profile.subscriber_id)
    : resolvedType === 'Subscriber'
      ? String(userId)
      : null;

  const user = {
    userId: String(userId),
    email,
    type: resolvedType,
    subscriberId,
    organizationId: profile?.organization_id
      ? String(profile.organization_id)
      : null,
    permissions: Array.isArray(permissions) ? permissions : [],
    profile,
  };

  userCache.set(token, { user, expiresAt: Date.now() + CACHE_TTL_MS });

  req.user = user;
  req.userId = user.userId;
  req.subscriberId = user.subscriberId;
  req.userType = user.type;
  req.permissions = user.permissions;
  req.token = token;

  next();
});

// @desc Checks the caller has the given canonical permission. Supports
//       wildcard '*' (subscribers and super-admins) and any-of arrays.
exports.hasPermission = (...required) =>
  asyncHandler(async (req, res, next) => {
    const permissions = req.permissions || [];

    if (permissions.includes('*')) return next();

    const ok = required.some((perm) => permissions.includes(perm));
    if (!ok) {
      return next(
        new ApiError(
          `Forbidden: missing one of [${required.join(', ')}]`,
          403,
        ),
      );
    }
    next();
  });

// @desc Convenience guard that allows the request if any one of the listed
//       permissions is held. Useful when a route services multiple
//       semantically-related actions.
exports.anyOf = (...required) => exports.hasPermission(...required);

// @desc Restricts a route to a specific anmat user type (Subscriber|Employee|Admin).
exports.onlyTypes = (...types) =>
  asyncHandler(async (req, res, next) => {
    if (!types.includes(req.userType)) {
      return next(new ApiError('Access denied for this user type', 403));
    }
    next();
  });
