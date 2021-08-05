class BaseApiClient {
  async get(url) {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (error) {
      console.log(error.response);
    }
  }

  async post(url, data) {
    try {
      const res = await axios.post(url, data);
      return res.data;
    } catch (error) {
      console.log(error.response);
    }
  }

  async put(url, data) {
    try {
      const res = await axios.put(url, data);
      return res.data;
    } catch (error) {
      console.log(error.response);
    }
  }

  async delete(url) {
    try {
      const res = await axios.delete(url);
      return res.data;
    } catch (error) {
      console.log(error.response);
    }
  }
}

class GiteaApiClient extends BaseApiClient {}
