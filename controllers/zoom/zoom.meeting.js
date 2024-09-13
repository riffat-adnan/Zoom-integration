const ZoomService = require("../../services/zoom.service");
const LoggerService = require("../../config/logger");
const STRINGS = require("../../utils/texts");
const axios = require("axios");
const ZoomMeetingService = require("../../services/meeting.service");

class ZoomMeetingController {

  async listZoomMeetings(req, res) {
    try {
      const token = await ZoomService.getAccessToken();

      const resp = await axios({
        method: "get",
        url: "https://api.zoom.us/v2/users/me/meetings",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        params: { ...req.params }
      });

      const meetings = resp.data.meetings;
      console.log("DATA --->", resp.data);

      return LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.SUCCESS,
        "ZOOM Meetings",
        res,
        { data: meetings }
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

  async createZoomMeeting(req, res) {
    try {
      const body = req.body;

      const meeting = await ZoomMeetingService.createMeeting(body);

      return LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.CREATED,
        "ZOOM Meeting Created",
        res,
        { data: meeting }
      );

    } catch (error) {
      console.log("1 - Zoom Error -->", error.response.data);
      LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.INTERNAL_SERVER_ERROR,
        error.message,
        res
      );
    }
  }

  async getMeetingDetails(req, res) {
    try {
      const meetingId = req.params.meetingId;
      const endPoint = `/meetings/${meetingId}`;

      const resp = await ZoomService.fetchZoomData("GET", endPoint, req.query);

      const meeting = resp.data;

      return LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.SUCCESS,
        "ZOOM Meeting",
        res,
        { meeting: meeting }
      );

    } catch (error) {
      // console.log("1 - Zoom Error -->", error);
      LoggerService.LoggerHandler(
        STRINGS.STATUS_CODE.INTERNAL_SERVER_ERROR,
        error.message,
        res
      );
    }
  }

}

module.exports = new ZoomMeetingController();
