// Init
const router = require("express").Router();
const ZoomController = require("../../controllers/zoom");
const ZoomMeetingController = require("../../controllers/zoom/zoom.meeting");
const ZoomWebHookController = require("../../controllers/zoom/zoom.webhook");
const ENV = process.env;


router.get("/thirdparty", ZoomController.zoomThirdPartyAPICall);
router.get("/meeting-access-token", ZoomController.getMsdkSignature);
router.get("/access-token", ZoomController.getZoomAccessToken);

router.get("/meetings", ZoomMeetingController.listZoomMeetings);
router.get("/meeting/:meetingId", ZoomMeetingController.getMeetingDetails);

router.post("/meetings", ZoomMeetingController.createZoomMeeting);

//ZOOM WEBHOOK
router.post("/webhook", ZoomWebHookController.MainHook);

// Export
module.exports = router;
