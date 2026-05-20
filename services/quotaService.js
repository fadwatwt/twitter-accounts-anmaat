const axios = require('axios');
const Account = require('../model/accountModel');
const ApiError = require('../utils/apiError');

const ANMAAT_API_URL = process.env.ANMAAT_API_URL;
const DEFAULT_QUOTA = parseInt(process.env.SOCIAL_MEDIA_DEFAULT_QUOTA, 10) || 1;
const UNLIMITED = -1;

// Fetches { used, limit, unlimited } for the caller from anmat backend.
// Falls back to local count + env default if anmat is unreachable.
async function fetchQuota(req) {
  if (!ANMAAT_API_URL || !req?.token) {
    return localFallback(req);
  }
  try {
    const res = await axios.get(
      `${ANMAAT_API_URL}/api/subscriber/social-media-quota`,
      {
        headers: { Authorization: `Bearer ${req.token}` },
        timeout: 5000,
      },
    );
    const data = res.data?.data || res.data;
    if (!data) return localFallback(req);
    return {
      used: Number(data.used) || 0,
      limit: typeof data.limit === 'number' ? data.limit : DEFAULT_QUOTA,
      unlimited: !!data.unlimited,
    };
  } catch (err) {
    return localFallback(req);
  }
}

async function localFallback(req) {
  if (!req?.subscriberId) {
    return { used: 0, limit: DEFAULT_QUOTA, unlimited: false };
  }
  const used = await Account.countDocuments({ subscriber_id: req.subscriberId });
  return { used, limit: DEFAULT_QUOTA, unlimited: false };
}

// Throws ApiError(403) if creating one more account would exceed the quota.
async function enforceCreateQuota(req) {
  const quota = await fetchQuota(req);
  if (quota.unlimited || quota.limit === UNLIMITED) return quota;
  if (quota.used >= quota.limit) {
    throw new ApiError(
      `Social media account quota reached (${quota.used}/${quota.limit}). Contact your administrator to increase it.`,
      403,
    );
  }
  return quota;
}

// Counts accounts owned by the caller's subscriber. Used both by the
// frontend (Quota card) and by the anmat backend (for the canonical
// /api/subscriber/social-media-quota response that this same module
// otherwise calls — see fetchQuota fallback).
async function countAccountsForSubscriber(subscriberId) {
  if (!subscriberId) return 0;
  return Account.countDocuments({ subscriber_id: subscriberId });
}

module.exports = {
  fetchQuota,
  enforceCreateQuota,
  countAccountsForSubscriber,
  DEFAULT_QUOTA,
  UNLIMITED,
};
