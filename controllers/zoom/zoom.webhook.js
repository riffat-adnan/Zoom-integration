const crypto = require('crypto');
const STRINGS = require("../../utils/texts");
const ENV = process.env;
const prisma = require("../../prisma/index")
const dayjs = require("dayjs");

class ZoomWebHookController {

  async MainHook(req, res) {
    try {
      console.log("1 - ZOOM WEBHOOK --->", req.body.event);
      let response;
      let payload = req.body.payload;

      // Need to manually validate the Zoom Webhook URL to activate the app in Zoom
      if (req.body.event === 'endpoint.url_validation') {
        const hashForValidate = crypto.createHmac('sha256', ENV.ZOOM_WEBHOOK_SECRET_TOKEN).update(req.body.payload.plainToken).digest('hex');

        response = {
          message: {
            plainToken: req.body.payload.plainToken,
            encryptedToken: hashForValidate
          },
          status: 200
        }

        console.log(response.message);
        res.status(response.status);
        res.json(response.message);
      } else {
        response = {
          message: 'Authorized request to Zoom Webhook sample.',
          status: 200
        };

        res.status(response.status);
        res.json(response);

        // Business logic here, example make API request to Zoom or 3rd party

        // Updating the Meeting status to In Progress when meeting is started by host
        // console.log("HOOK PAYLOAD --->", payload);

        if (req.body.event === "meeting.started") {
          findAndUpdateMeeting(payload, STRINGS.STATUS.INPROGRESS);
        }

        // Updating the Meeting status to Ended when meeting is started by host
        if (req.body.event === "meeting.ended") {
          findAndUpdateMeeting(payload, STRINGS.STATUS.ENDED);
          // removeFromCalendar(payload);
        }

        // Checking if Host left the call
        // If Host lefts the meeting without ending it, changing the status back to pending
        // if (req.body.event === "meeting.participant_left") {
        //   const meeting = await prisma.videoCall.findFirst({
        //     where: {
        //       AND: [
        //         { meeting_id: payload.object.id }
        //       ]
        //     }
        //   });

        //   if (meeting) {
        //     const isLeft = meeting?.host_id === req?.body?.payload?.object?.host_id;
        //     const reason = req?.body?.payload?.object?.participant?.leave_reason?.includes("Host ended the meeting");
        //     const hasHostLeft = isLeft && !reason;

        //     if (hasHostLeft) {
        //       findAndUpdateMeeting(payload, STRINGS.STATUS.PENDING);
        //     }
        //   }
        // }

        if (req.body.event === "recording.completed") {
          // ADD RECORDING NOTIFICATION HERE TO LET USER KNOW THAT RECORDING IS UPLOADED
          try {
            // console.log("RECORDING COMPLETED --->", req.body);
            let payload = req.body.payload;
            const meetingId = String(payload?.object?.id);
            const meetingType = payload?.object?.type;
            const startTime = payload?.object?.start_time;

          } catch (error) {
            console.log("ERROR", error)
          }
        }

        async function findAndUpdateMeeting(payload, updateValue) {
          // Means call is not recurring
          if (payload.object.type === 2) {
            const meet = await prisma.videoCall.findFirst({
              where: {
                AND: [
                  // { host_id: payload.object.host_id }, // Assumtion is meeting webhook return diffrent alternate host id instead of host id
                  { meeting_id: payload.object.id }
                ]
              }
            });

            if (meet) {
              await prisma.videoCall.update({
                where: {
                  id: meet.id
                },
                data: {
                  meeting_status: updateValue
                }
              });


            }
          }

          // Means call is recurring
          if (payload.object.type === 8) {
            const recurrMeets = await prisma.videoCall.findMany({
              where: {
                AND: [
                  // { host_id: payload.object.host_id },
                  { meeting_id: payload.object.id }
                ]
              }
            });

            if (recurrMeets && recurrMeets?.length) {
              const meetToday = recurrMeets.find((meet) => {
                const date = meet.occurrance_start ? meet.occurrance_start : meet.startTime;
                const isSame = dayjs(date).isSame(dayjs(payload.object.start_time), "day"); // Checking if meeting time is at same day
                return isSame;
              });

              if (meetToday) {
                await prisma.videoCall.update({
                  where: {
                    id: meetToday.id
                  },
                  data: {
                    meeting_status: updateValue
                  }
                })
              }
            }
          }
        }

        async function removeFromCalendar(payload) {
          // Deleting Call from Google and Outlook Calendar
          // Getting Meeting Data
          const single_call = await prisma.videoCall.findFirst({
            where: {
              AND: [
                // { host_id: payload.object.host_id }, // Assumtion is meeting webhook return diffrent alternate host id instead of host id
                { meeting_id: payload.object.id }
              ]
            }
          });

          const user = await prisma.user.findFirst({
            where: {
              id: single_call?.coachId,
            },
          });

        }
      }

    } catch (error) {
      console.log("H - Zoom Error -->", error);
      // LoggerService.LoggerHandler(
      //   STRINGS.STATUS_CODE.INTERNAL_SERVER_ERROR,
      //   "Internal Server Error",
      //   res
      // );
    }
  }

}

module.exports = new ZoomWebHookController();
