const ZoomService = require("../../services/zoom.service");
const LoggerService = require("../../config/logger");
const STRINGS = require("../../utils/texts");

class ZoomController {

  async zoomThirdPartyAPICall(req, res) {
    try {
      const thirdPartyAPICall = ZoomService.generateSignature();

      console.log("THIRD PARTY API CALL --->", thirdPartyAPICall);

      if (thirdPartyAPICall === undefined) {
        return LoggerService.LoggerHandler(
          STRINGS.STATUS_CODE.NOT_FOUND,
          "Invalid API Call",
          res,
          { token, user }
        );
      }

      return LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.CREATED,
        "ZOOM API CALL",
        res,
        { data: thirdPartyAPICall }
      );

    } catch (error) {
      console.log("1 - Zoom Error -->", error);
      LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.INTERNAL_SERVER_ERROR,
        error.message,
        res
      );
    }
  }

  async getMsdkSignature(req, res) {
    try {
      const meetingNumber = req.body.meetingNumber;
      const role = req.body.role;
      const token = ZoomService.generateSignature(meetingNumber, role);

      return LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.CREATED,
        "ZOOM Meeting JWT Token",
        res,
        { token: token }
      );

    } catch (error) {
      console.log("1 - Zoom Error -->", error);
      LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.INTERNAL_SERVER_ERROR,
        error.message,
        res
      );
    }
  }

  async getZoomAccessToken(req, res) {
    try {
      const token = await ZoomService.getAccessToken();

      return LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.CREATED,
        "ZOOM Access Token",
        res,
        { token: token }
      );

    } catch (error) {
      console.log("1 - Zoom Error -->", error);
      LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.INTERNAL_SERVER_ERROR,
        error.message,
        res
      );
    }
  }
}

module.exports = new ZoomController();
