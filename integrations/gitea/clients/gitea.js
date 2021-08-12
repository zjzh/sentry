const axios = require('axios');
const Installation = require('../models/Installation');
const GITEA_CLIENT_ID = '2befcb1a-592a-4757-bc91-ba0aa88173e1';
const GITEA_CLIENT_SECRET = 'URpuyfodLcnTgz4Af3uFM2rwnAClbxsY_svISqm5xzY=';
const GITEA_REDIRECT_URI = 'http://localhost:7500/gitea/setup';

class GiteaApiClient {
  constructor(authtoken = null) {
    this.authtoken = authtoken;
    this.instance = axios.create({
      baseURL: `${process.env.GITEA_API_BASE_URL}/api/v1`,
      headers: (this.authtoken && {Authorization: 'token ' + this.authtoken}) || {},
    });
    // Add a response interceptor
    this.instance.interceptors.response.use(
      response => {
        return response;
      },
      async error => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const access_token = await this.refreshAuthToken();
          this.instance.defaults.headers.common['Authorization'] =
            'token ' + access_token;
          this.authToken = access_token;
          return this.instance(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  async refreshAuthToken() {
    let install = await Installation.findOne({giteaAuthToken: this.authtoken});
    let resp = await this.instance.post(
      `${process.env.GITEA_API_BASE_URL}/login/oauth/access_token`,
      {
        grant_type: 'refresh_token',
        refresh_token: install.giteaRefreshToken,
        client_id: GITEA_CLIENT_ID,
        client_secret: GITEA_CLIENT_SECRET,
      }
    );
    install.giteaAuthToken = resp.data.access_token;
    if (resp.data.refresh_token) {
      install.giteaRefreshToken = resp.data.refresh_token;
    }
    await install.save();
    return resp.data.access_token;
  }

  authorizeOauth(code) {
    return this.instance.post('/login/oauth/access_token', {
      client_id: GITEA_CLIENT_ID,
      client_secret: GITEA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GITEA_REDIRECT_URI,
    });
  }

  generateRedirectUri(state) {
    return `${process.env.GITEA_WEB_BASE_URL}/login/oauth/authorize?client_id=${GITEA_CLIENT_ID}&redirect_uri=${GITEA_REDIRECT_URI}&response_type=code&state=${state}`;
  }

  fetchAllUsers() {
    return this.instance.get(`/admin/users`);
  }

  fetchAllRepos() {
    return this.instance.get('/user/repos');
  }

  fetchRepoById(id) {
    return this.instance.get(`/repositories/${id}`);
  }
  createIssue(repoFullName, payload) {
    return this.instance.post(`/repos/${repoFullName}/issues`, payload);
  }
  createIssueComment(repoFullName, issueId, payload) {
    return this.instance.post(
      `/repos/${repoFullName}/issues/${issueId}/comments`,
      payload
    );
  }
}

module.exports = GiteaApiClient;
