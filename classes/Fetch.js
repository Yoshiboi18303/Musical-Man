module.exports = class Fetch {
  constructor() {
    this.fetch = require("node-superfetch");
  }

  /**
   * @param {String} url
   * @param {Object} headers
   */
  get(url, headers) {
    if (!url) throw new Error("Please define a URL!");
    if (!headers) headers = {};
    if (!(headers instanceof Object))
      throw new Error("The headers of a request must be an Object!");
    const { body } = this.fetch.get(url).set(headers);
    return body;
  }

  /**
   * @param {String} url
   * @param {Object} headers
   * @param {Object} body
   */
  post(url, headers, body) {
    if (!url) throw new Error("Please define a URL!");
    if (!headers) {
      console.log(
        "It's recommended to have headers in a POST request, but we'll still move along."
      );
      headers = {};
    }
    if (!(headers instanceof Object))
      throw new Error("The headers of a request must be an Object!");
    if (!body) throw new Error("A post request needs a body!");
    if (!(body instanceof Object))
      throw new Error("The body of a POST request must be an Object!");
    var { body } = this.fetch.post(url).set(headers).send(body);
    return body;
  }
};
