const axios = require('axios');
const Installation = require('../models/Installation');

const SENTRY_CLIENT_ID =
  'bd99f6294ae34eda89b7ff3c8065edb63fd7b34c4e0f4b1e8ac0a8a370e50491';
const SENTRY_CLIENT_SECRET =
  '096a2843571d49009b665f986852847cba1900ad938048a29dfba4b639ea63ac';

class SentryApiClient {
  constructor(authtoken = null, installationId = null) {
    this.instance = axios.create({
      baseURL: process.env.SENTRY_API_BASE_URL,
      headers: (authtoken && {Authorization: 'Bearer ' + authtoken}) || {},
    });
    this.installationId = installationId;
    // Add a response interceptor
    this.instance.interceptors.response.use(
      response => {
        return response;
      },
      async error => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const authToken = await this.refreshAuthToken();
          this.instance.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
          this.authToken = authToken;
          return this.instance(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  verifySignature(request) {
    try {
      const hmac = crypto.createHmac('sha256', SENTRY_CLIENT_SECRET);
      hmac.update(JSON.stringify(request.body), 'utf8');
      const digest = hmac.digest('hex');
      return digest === request.headers['sentry-hook-signature'];
    } catch (error) {
      console.log({error});
      return error;
    }
  }

  setAuthToken(authtoken) {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${authtoken}`;
    return this;
  }

  setupInstallation(installationId, code) {
    let payload = {
      grant_type: 'authorization_code',
      code,
      client_id: SENTRY_CLIENT_ID,
      client_secret: SENTRY_CLIENT_SECRET,
    };
    return this.instance.post(
      `/api/0/sentry-app-installations/${installationId}/authorizations/`,
      payload
    );
  }

  verifyInstallation(installationId) {
    return this.instance.put(`/api/0/sentry-app-installations/${installationId}/`, {
      status: 'installed',
    });
  }

  async refreshAuthToken() {
    let install = await Installation.findOne({giteaAuthToken: this.authtoken});

    let payload = {
      grant_type: 'refresh_token',
      refresh_token: install.giteaRefreshToken,
      client_id: SENTRY_CLIENT_ID,
      client_secret: SENTRY_CLIENT_SECRET,
    };

    let resp = await this.instance.post(
      `/api/0/sentry-app-installations/${installationId}/authorizations/`,
      payload
    );
    let data = resp.data;

    new_token = data['token'];
    new_refresh_token = data['refreshToken'];
    // Securely update the token and refresh_token in DB...

    install.sentryAuthToken = resp.data['token'];
    if (resp.data['refreshToken']) {
      install.sentryRefreshToken = resp.data['refreshToken'];
    }
    await install.save();
    return resp.data.access_token;
  }
}

module.exports = SentryApiClient;
