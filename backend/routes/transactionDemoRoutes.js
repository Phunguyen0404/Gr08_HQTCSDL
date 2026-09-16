const express = require('express');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const demo = require('../services/transactionDemoService');

const router = express.Router();
router.use(auth, authorize('ADMIN'));

function sendError(res, error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
}

router.get('/state', async (_req, res) => { try { res.json({ success: true, data: await demo.getState() }); } catch (e) { sendError(res, e); } });
router.post('/reset', async (_req, res) => { try { res.json({ success: true, data: await demo.reset() }); } catch (e) { sendError(res, e); } });
router.post('/:session/begin', async (req, res) => { try { res.json({ success: true, data: await demo.begin(req.params.session, req.body.isolation) }); } catch (e) { sendError(res, e); } });
router.post('/:session/action', async (req, res) => { try { res.json({ success: true, data: await demo.run(req.params.session, req.body.action, req.body) }); } catch (e) { sendError(res, e); } });
router.post('/:session/commit', async (req, res) => { try { res.json({ success: true, data: await demo.finish(req.params.session, true) }); } catch (e) { sendError(res, e); } });
router.post('/:session/rollback', async (req, res) => { try { res.json({ success: true, data: await demo.finish(req.params.session, false) }); } catch (e) { sendError(res, e); } });

module.exports = router;
