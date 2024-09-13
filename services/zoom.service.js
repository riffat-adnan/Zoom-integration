const axios = require("axios");
const btoa = require("btoa");
const KJUR = require('jsrsasign')
const ENV = process.env;

class ZoomService {
  getAccessToken = async () => {
    try {
      const base_64 = btoa(ENV.Z_CLIENT_ID + ":" + ENV.Z_CLIENT_SECRET);
      const resp = await axios({
        method: "POST",
        url:
          "https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + `${ENV.Z_ACCOUNT_ID}`,
        headers: {
          Authorization: "Basic " + `${base_64} `,
        },
      });
      // console.log("TOKEN --->", resp.data.access_token);
      return resp.data.access_token;
    } catch (err) {
      // Handle Error Here
      console.error("ACCESS TOKEN ERROR", err);
    }
  };

  generateSignature = (meetingNumber, role) => {
    try {
      const iat = Math.round(new Date().getTime() / 1000) - 30;
      const exp = iat + 60 * 60 * 48; // set expiry to 48 hours

      const oHeader = { alg: 'HS256', typ: 'JWT' }
      const oPayload = {
        sdkKey: ENV.Z_CLIENT_ID,
        mn: meetingNumber,
        role: role,
        iat: iat,
        exp: exp,
        appKey: ENV.Z_CLIENT_ID,
        tokenExp: iat + 60 * 60 * 48
      };

      const sHeader = JSON.stringify(oHeader);
      const sPayload = JSON.stringify(oPayload);
      const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, ENV.Z_CLIENT_SECRET);

      return signature;

    } catch (err) {
      // Handle Error Here
      console.error(err);
    }
  };

  fetchZoomData = async (method, endPoint, queryParams) => {
    try {
      const token = await this.getAccessToken();
      const haveParams = Object.keys(queryParams).length !== 0;

      const resp = await axios({
        method: method,
        url: `https://api.zoom.us/v2${endPoint}`,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        ...(haveParams && { params: { ...queryParams } })
      });
      return resp;

    } catch (err) {
      // Handle Error Here
      // const error = err?.response?.data?.message;
      // console.log("AXIOS ERROR", err);
      // throw new Error(error ? error : "Internal Server Error");
    }
  }
}

module.exports = new ZoomService();
