const axios = require("axios");
const ZoomService = require("./zoom.service");
const ENV = process.env;

const dayjs = require("dayjs");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

class ZoomMeetingService {
  createMeeting = async (data, host_email, subCoachesEmails) => {
    try {
      const token = await ZoomService.getAccessToken();

      const type = data?.isRecurring ? 8 : 2;
      // 8: A recurring meeting with fixed time | Daily | Weekly | Monthly
      // 2: A scheduled meeting

      const recurrence = data?.recurrence;

      // Recurrence Settings for Zoom API Call
      const recurrenceData = {
        repeat_interval: Number(data?.repeatEvery)
      }

      if (!data?.isEndDate) {
        recurrenceData.end_times = Number(data?.occurrences); // Number of times meeting will repeat
      } else {
        recurrenceData.end_date_time = dayjs.utc(data.endDate, "YYYY-MM-DD").endOf('day').format()
      }

      switch (recurrence) {
        case "daily":
          recurrenceData.type = 1;
          break;
        case "weekly":
          recurrenceData.type = 2;
          const weekDay = dayjs(data.date).utc().get('day') + 1; // Adding one because zoom api day index starts from 1
          recurrenceData.weekly_days = data?.weekly_days?.length ? data?.weekly_days : weekDay;
          break;
        case "monthly":
          recurrenceData.type = 3;
          // const monthDay = dayjs(data.date).utc().date();
          // recurrenceData.monthly_day = monthDay;
          if(data?.monthMode === "WEEK_DAY"){
            recurrenceData.monthly_day = data.monthly_day;
          }
          if(data?.monthMode === "MONTH_DAY"){
            recurrenceData.monthly_week = data.monthly_week;
            recurrenceData.monthly_week_day = data.monthly_week_day;
          }
          break;
      }

      const zoomData = {
        topic: data.title,
        start_time: dayjs(data.date).utc().format(),
        // Converting to UTC because zoom accepts time in UTC
        // and then defaults the timezone to Zoom Account Timezone
        type: type,
        duration: data.duration,
        settings: {
            auto_recording: "cloud",
            use_pmi: false,
          ...(subCoachesEmails && {
            alternative_hosts: subCoachesEmails,
            alternative_hosts_email_notification: false
          })
        },
        ...(data?.isRecurring && { recurrence: recurrenceData }),
        email_notification: false,
      };

      // console.log("CALL DATA ---->", data);
      // console.log("ZOOM DATA ---->", zoomData);
      // console.log("HOST ---->", host_email);

      const payload = JSON.stringify(zoomData);

      // TODO: add logged user email as host email

      const resp = await axios({
        method: "POST",
        url: `https://api.zoom.us/v2/users/${host_email}/meetings`,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        data: payload
      });

      const meeting = resp.data;
      return meeting;

    } catch (err) {
      // Handle Error Here
      // console.log("ZOOM ERROR --->", err);
      console.log("ZOOM ERROR --->", err.response.data);
      const error = err.response.data;
      return {
        error: true,
        message: error.message,
        code: error.code
      };
    }
  };

  deleteMeeting = async (meetingId, occurrence_id = null) => {
    try {
      const endPoint = `/meetings/${meetingId}`;
      let queryString = {};

      if (occurrence_id) {
        queryString.occurrence_id = occurrence_id;
        queryString.schedule_for_reminder = false;
        queryString.cancel_meeting_reminder = false;
      }

      const resp = await ZoomService.fetchZoomData("DELETE", endPoint, queryString);
      return resp;

    } catch (err) {
      // Handle Error Here
      // console.log("ZOOM ERROR --->", err);
      console.log("ZOOM ERROR --->", err.response.data);
      const error = err.response.data;
      return {
        error: true,
        message: error.message
      };
    }
  };

}

module.exports = new ZoomMeetingService();
